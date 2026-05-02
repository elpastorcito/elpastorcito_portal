// netlify/functions/admin.mjs
// Protege el SERVICE_KEY de Supabase - nunca llega al frontend
// Ahora usa Supabase Auth con email/password y validación por UID

import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block'
}

// Rate limiting persistente usando tabla en BD
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hora
const MAX_ATTEMPTS = 5

function getClientIP(event) {
  return event.headers['x-forwarded-for']?.split(',')[0] || event.headers['client-ip'] || 'unknown'
}

async function checkRateLimit(ip) {
  const now = new Date().toISOString()
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW).toISOString()
  
  // Contar intentos recientes desde la BD
  const { count, error } = await supabaseAdmin
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('ip', ip)
    .gte('attempted_at', windowStart)
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
    console.error('Error checking rate limit:', error)
    return true // Permitir si hay error
  }
  
  return (count || 0) < MAX_ATTEMPTS
}

async function recordLoginAttempt(ip) {
  await supabaseAdmin.from('login_attempts').insert({ ip })
}

async function clearLoginAttempts(ip) {
  await supabaseAdmin.from('login_attempts').delete().eq('ip', ip)
}

// Verificar si el usuario autenticado es admin
async function verifyAdminAuth(event) {
  const authHeader = event.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'No token provided' }
  }
  
  const token = authHeader.substring(7)
  
  // Verificar token con Supabase
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  
  if (error || !user) {
    return { valid: false, error: 'Invalid token' }
  }
  
  // Verificar si el usuario está en la tabla admins
  const { data: admin, error: adminError } = await supabaseAdmin
    .from('admins')
    .select('id, email')
    .eq('id', user.id)
    .single()
  
  if (adminError || !admin) {
    return { valid: false, error: 'User is not an admin' }
  }
  
  return { valid: true, userId: user.id, email: admin.email }
}

// Middleware para proteger endpoints que requieren autenticación
async function requireAuth(event) {
  const authResult = await verifyAdminAuth(event)
  
  if (!authResult.valid) {
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({ error: authResult.error || 'Unauthorized' })
    }
  }
  
  return null // null significa que pasó la autenticación
}

export const handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' }
  }

  const path = event.path.replace('/api/admin/', '')

  try {
    // AUTH: Login con Supabase Auth (email/password)
    if (path === 'login') {
      const ip = getClientIP(event)
      
      // Verificar rate limit
      const rateOk = await checkRateLimit(ip)
      if (!rateOk) {
        return {
          statusCode: 429,
          headers: corsHeaders,
          body: JSON.stringify({ 
            success: false, 
            error: 'Demasiados intentos. Por favor espera 1 hora antes de intentar nuevamente.' 
          })
        }
      }
      
      const { email, password } = JSON.parse(event.body)
      
      // Validar email con regex más robusto
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!email || !emailRegex.test(email.trim())) {
        await recordLoginAttempt(ip)
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, error: 'Email inválido' })
        }
      }

      // Validar que la contraseña no esté vacía
      if (!password || password.length === 0) {
        await recordLoginAttempt(ip)
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, error: 'Contraseña requerida' })
        }
      }

      // Intentar login con Supabase Auth
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email: email.trim(),
        password
      })
      
      if (error) {
        await recordLoginAttempt(ip)
        console.error('Login error:', error.message)
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, error: 'Email o contraseña incorrectos' })
        }
      }
      
      // Verificar si el usuario es admin
      const { data: adminRecord } = await supabaseAdmin
        .from('admins')
        .select('id, email')
        .eq('id', data.user.id)
        .single()
      
      if (!adminRecord) {
        await recordLoginAttempt(ip)
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, error: 'Este usuario no tiene permisos de administrador' })
        }
      }
      
      // Login exitoso - limpiar intentos y devolver token
      await clearLoginAttempts(ip)
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ 
          success: true,
          user: {
            id: data.user.id,
            email: data.user.email
          },
          token: data.session.access_token
        })
      }
    }

    // Para todos los demás endpoints, verificar autenticación
    const authResult = await requireAuth(event)
    if (authResult) return authResult

    // GET: Clientes (todos, no solo públicos)
    if (path === 'clients') {
      const { data, error } = await supabaseAdmin
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(data)
      }
    }

    // GET: Todas las redes sociales (incluidas inactivas)
    if (path === 'socials-all') {
      const { data, error } = await supabaseAdmin
        .from('social_networks')
        .select('*')
        .order('sort_order')

      if (error) throw error
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(data)
      }
    }

    // GET: Todo el menú (incluidos no disponibles)
    if (path === 'menu-all') {
      const { data, error } = await supabaseAdmin
        .from('menu_items')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(data)
      }
    }

    // GET: Toda la config
    if (path === 'config-all') {
      const { data, error } = await supabaseAdmin
        .from('config')
        .select('*')

      if (error) throw error
      const cfg = {}
      data.forEach(row => cfg[row.key] = row.value)
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(cfg)
      }
    }

    // POST: Upsert config
    if (path === 'config-save') {
      const { items } = JSON.parse(event.body)
      const { error } = await supabaseAdmin
        .from('config')
        .upsert(items, { onConflict: 'key' })

      if (error) throw error
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true })
      }
    }

    // POST: Guardar redes sociales
    if (path === 'socials-save') {
      const { networks } = JSON.parse(event.body)
      const { error } = await supabaseAdmin
        .from('social_networks')
        .upsert(networks, { onConflict: 'id' })

      if (error) throw error
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true })
      }
    }

    // POST: Toggle disponibilidad menú
    if (path === 'menu-toggle') {
      const { id, available } = JSON.parse(event.body)
      const { error } = await supabaseAdmin
        .from('menu_items')
        .update({ available })
        .eq('id', id)

      if (error) throw error
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true })
      }
    }

    // POST: Eliminar item menú
    if (path === 'menu-delete') {
      const { id } = JSON.parse(event.body)
      const { error } = await supabaseAdmin
        .from('menu_items')
        .delete()
        .eq('id', id)

      if (error) throw error
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true })
      }
    }

    // POST: Upsert item menú
    if (path === 'menu-save') {
      const { item } = JSON.parse(event.body)
      const { error } = await supabaseAdmin
        .from('menu_items')
        .upsert(item, { onConflict: 'id' })

      if (error) throw error
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true })
      }
    }
    // POST: Upload image (logo o menu)
    if (path === 'upload') {
      try {
        const { filePath, contentType, base64Data } = JSON.parse(event.body)
        
        console.log('Upload request received:', { 
          filePath, 
          contentType, 
          dataLength: base64Data?.length || 0 
        })
        
        // Validar que los datos requeridos existan
        if (!base64Data || !contentType || !filePath) {
          console.error('Missing required fields for upload')
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Datos de imagen inválidos. Faltan campos requeridos.' })
          }
        }
        
        // Validar tipo de contenido PRIMERO (más rápido)
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if (!allowedTypes.includes(contentType)) {
          console.error('Invalid content type:', contentType)
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ 
              error: 'Tipo de archivo no permitido. Solo JPEG, PNG, WebP o GIF',
              type: contentType
            })
          }
        }
        
        // Validar tamaño máximo (5MB para evitar timeouts)
        const MAX_SIZE_MB = 5
        const maxSizeBytes = MAX_SIZE_MB * 1024 * 1024
        
        // Calcular tamaño real del buffer
        let buffer
        try {
          // Remover data URL prefix si existe (ej: "data:image/png;base64,")
          const cleanBase64 = base64Data.split(',').pop()
          buffer = Buffer.from(cleanBase64, 'base64')
        } catch (bufferError) {
          console.error('Error creating buffer:', bufferError)
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Datos de imagen corruptos o inválidos' })
          }
        }
        
        const actualSizeBytes = buffer.length
        
        console.log('Image size check:', { 
          actual: Math.round(actualSizeBytes / 1024 * 100) / 100 + 'KB',
          max: MAX_SIZE_MB + 'MB'
        })
        
        if (actualSizeBytes > maxSizeBytes) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ 
              error: `Imagen demasiado grande. Máximo ${MAX_SIZE_MB}MB`,
              size: Math.round(actualSizeBytes / 1024 / 1024 * 100) / 100 + 'MB',
              max: MAX_SIZE_MB + 'MB'
            })
          }
        }
        
        console.log('Uploading to storage:', filePath)
        
        const { error: uploadError } = await supabaseAdmin
          .storage
          .from('images')
          .upload(filePath, buffer, {
            contentType,
            upsert: true,
            cacheControl: '3600'
          })

        if (uploadError) {
          console.error('Supabase storage error:', uploadError)
          throw uploadError
        }
        
        console.log('Upload successful, getting public URL')

        const { data: { publicUrl } } = supabaseAdmin
          .storage
          .from('images')
          .getPublicUrl(filePath)
          
        console.log('Upload complete:', publicUrl)

        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ url: publicUrl })
        }
      } catch (uploadError) {
        console.error('Detailed upload error:', {
          message: uploadError.message,
          stack: uploadError.stack,
          name: uploadError.name
        })
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ 
            error: 'Error al subir la imagen',
            details: uploadError.message,
            type: uploadError.name
          })
        }
      }
    }

    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Not found' })
    }

  } catch (err) {
    console.error('Handler error:', err)
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message })
    }
  }
}
