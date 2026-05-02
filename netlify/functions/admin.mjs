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
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
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
      
      // Validar email básico
      if (!email || !email.includes('@')) {
        await recordLoginAttempt(ip)
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, error: 'Email inválido' })
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
      const { filePath, contentType, base64Data } = JSON.parse(event.body)
      const buffer = Buffer.from(base64Data, 'base64')

      const { error } = await supabaseAdmin
        .storage
        .from('images')
        .upload(filePath, buffer, {
          contentType,
          upsert: true
        })

      if (error) throw error

      const { data: { publicUrl } } = supabaseAdmin
        .storage
        .from('images')
        .getPublicUrl(filePath)

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ url: publicUrl })
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
