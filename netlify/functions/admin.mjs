// netlify/functions/admin.mjs
// Protege el SERVICE_KEY de Supabase - nunca llega al frontend
// Ahora usa Supabase Auth con email/password y validación por UID
// MEJORA DE SEGURIDAD: Validación estricta con Zod
// MEJORA DE SEGURIDAD: Cookies HTTP-only para proteger tokens XSS

import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Lista blanca de orígenes permitidos (CORS)
const ALLOWED_ORIGINS = [
  'https://tu-dominio-production.netlify.app',
  'https://tu-dominio-staging.netlify.app',
  'http://localhost:5173',
  'http://localhost:8888'
].filter(Boolean)

// Configuración de cookies seguras
const COOKIE_OPTIONS = {
  httpOnly: true,      // No accesible desde JavaScript (protege contra XSS)
  secure: true,        // Solo HTTPS en producción
  sameSite: 'strict',  // Protege contra CSRF
  path: '/',
  maxAge: 60 * 60      // 1 hora de sesión
}

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN && ALLOWED_ORIGINS.includes(process.env.ALLOWED_ORIGIN) 
    ? process.env.ALLOWED_ORIGIN 
    : ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',  // Permitir cookies
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
}

// Función para validar origen CORS
function isValidOrigin(origin) {
  if (!origin) return false
  return ALLOWED_ORIGINS.includes(origin) || 
         (process.env.ALLOWED_ORIGIN && origin === process.env.ALLOWED_ORIGIN)
}

// Rate limiting persistente usando tabla en BD
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hora
const MAX_ATTEMPTS = 5

// Schemas de validación con Zod para todos los endpoints
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres')
})

const updateClientSchema = z.object({
  id: z.string().uuid('ID de cliente inválido'),
  name: z.string().min(2, 'Nombre muy corto').max(100, 'Nombre muy largo'),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  notes: z.string().max(500, 'Notas muy largas').optional()
})

const createClientSchema = z.object({
  name: z.string().min(2, 'Nombre muy corto').max(100, 'Nombre muy largo'),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  notes: z.string().max(500, 'Notas muy largas').optional()
})

const updateSocialSchema = z.object({
  id: z.string().uuid('ID inválido'),
  name: z.string().min(2, 'Nombre muy corto').max(50, 'Nombre muy largo'),
  url: z.string().url('URL inválida'),
  active: z.boolean(),
  sort_order: z.number().int().min(0).optional()
})

const createSocialSchema = z.object({
  name: z.string().min(2, 'Nombre muy corto').max(50, 'Nombre muy largo'),
  url: z.string().url('URL inválida'),
  active: z.boolean().default(true),
  sort_order: z.number().int().min(0).optional()
})

const updateMenuItemSchema = z.object({
  id: z.string().uuid('ID inválido'),
  name: z.string().min(2, 'Nombre muy corto').max(100, 'Nombre muy largo'),
  description: z.string().max(500, 'Descripción muy larga').optional(),
  price: z.number().positive('Precio debe ser positivo'),
  category: z.string().min(2, 'Categoría muy corta').max(50, 'Categoría muy larga'),
  available: z.boolean(),
  image_url: z.string().url('URL de imagen inválida').optional().or(z.literal(''))
})

const createMenuItemSchema = z.object({
  name: z.string().min(2, 'Nombre muy corto').max(100, 'Nombre muy largo'),
  description: z.string().max(500, 'Descripción muy larga').optional(),
  price: z.number().positive('Precio debe ser positivo'),
  category: z.string().min(2, 'Categoría muy corta').max(50, 'Categoría muy larga'),
  available: z.boolean().default(true),
  image_url: z.string().url('URL de imagen inválida').optional().or(z.literal(''))
})

const uploadImageSchema = z.object({
  filePath: z.string().min(1, 'Ruta requerida'),
  contentType: z.string(),
  base64Data: z.string().min(1, 'Datos de imagen requeridos')
})

const updateConfigSchema = z.object({
  key: z.string().min(2, 'Clave inválida').max(50, 'Clave muy larga'),
  value: z.string().max(1000, 'Valor muy largo')
})

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
  // Primero intentar obtener token desde cookie HTTP-only
  let token = null
  
  const authHeader = event.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  } else {
    // Extraer token de las cookies
    const cookieHeader = event.headers.cookie
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(c => c.trim())
      const adminCookie = cookies.find(c => c.startsWith('admin_token='))
      if (adminCookie) {
        token = adminCookie.split('=')[1]
      }
    }
  }
  
  if (!token) {
    return { valid: false, error: 'No token provided' }
  }
  
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
  // Validar origen CORS antes de procesar cualquier solicitud
  const origin = event.headers.origin
  if (origin && !isValidOrigin(origin)) {
    console.warn('CORS blocked request from:', origin)
    return { 
      statusCode: 403, 
      headers: corsHeaders, 
      body: JSON.stringify({ error: 'Origen no permitido' }) 
    }
  }

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
      
      // VALIDACIÓN CON ZOD: Validar datos de entrada antes de procesar
      let validatedData
      try {
        const rawData = JSON.parse(event.body)
        validatedData = loginSchema.parse(rawData)
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          const errorMessage = validationError.errors.map(e => e.message).join(', ')
          console.warn('Login validation error:', validationError.errors)
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ 
              success: false, 
              error: `Datos inválidos: ${errorMessage}` 
            })
          }
        }
        throw validationError
      }
      
      const { email, password } = validatedData
      
      // Ya no se necesita validación manual adicional - Zod lo hizo

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
      
      // Login exitoso - limpiar intentos y devolver token con cookie HTTP-only
      await clearLoginAttempts(ip)
      
      // Crear headers para Set-Cookie con opciones seguras
      const setCookieHeader = `admin_token=${data.session.access_token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=3600`
      
      return {
        statusCode: 200,
        headers: {
          ...corsHeaders,
          'Set-Cookie': setCookieHeader
        },
        body: JSON.stringify({ 
          success: true,
          user: {
            id: data.user.id,
            email: data.user.email
          }
          // NOTA: El token ahora se envía en cookie HTTP-only, no en el body
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
      // VALIDACIÓN CON ZOD
      let validatedData
      try {
        const rawData = JSON.parse(event.body)
        validatedData = z.array(updateConfigSchema).parse(rawData.items)
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          const errorMessage = validationError.errors.map(e => e.message).join(', ')
          console.warn('Config validation error:', validationError.errors)
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ 
              success: false, 
              error: `Datos inválidos: ${errorMessage}` 
            })
          }
        }
        throw validationError
      }
      
      const { items } = { items: validatedData }
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
      // VALIDACIÓN CON ZOD
      let validatedData
      try {
        const rawData = JSON.parse(event.body)
        validatedData = z.array(updateSocialSchema).parse(rawData.networks)
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          const errorMessage = validationError.errors.map(e => e.message).join(', ')
          console.warn('Social validation error:', validationError.errors)
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ 
              success: false, 
              error: `Datos inválidos: ${errorMessage}` 
            })
          }
        }
        throw validationError
      }
      
      const { networks } = { networks: validatedData }
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
      // VALIDACIÓN CON ZOD
      let validatedData
      try {
        const rawData = JSON.parse(event.body)
        validatedData = z.object({
          id: z.string().uuid('ID inválido'),
          available: z.boolean()
        }).parse(rawData)
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          const errorMessage = validationError.errors.map(e => e.message).join(', ')
          console.warn('Menu toggle validation error:', validationError.errors)
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ 
              success: false, 
              error: `Datos inválidos: ${errorMessage}` 
            })
          }
        }
        throw validationError
      }
      
      const { id, available } = validatedData
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
      // VALIDACIÓN CON ZOD
      let validatedData
      try {
        const rawData = JSON.parse(event.body)
        validatedData = z.object({
          id: z.string().uuid('ID inválido')
        }).parse(rawData)
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          const errorMessage = validationError.errors.map(e => e.message).join(', ')
          console.warn('Menu delete validation error:', validationError.errors)
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ 
              success: false, 
              error: `Datos inválidos: ${errorMessage}` 
            })
          }
        }
        throw validationError
      }
      
      const { id } = validatedData
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
      // VALIDACIÓN CON ZOD - determinar si es create o update
      let validatedData
      try {
        const rawData = JSON.parse(event.body)
        const schema = rawData.item.id ? updateMenuItemSchema : createMenuItemSchema
        validatedData = z.object({ item: schema }).parse(rawData)
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          const errorMessage = validationError.errors.map(e => e.message).join(', ')
          console.warn('Menu save validation error:', validationError.errors)
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ 
              success: false, 
              error: `Datos inválidos: ${errorMessage}` 
            })
          }
        }
        throw validationError
      }
      
      const { item } = validatedData
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
      // VALIDACIÓN CON ZOD
      let validatedData
      try {
        const rawData = JSON.parse(event.body)
        validatedData = uploadImageSchema.parse(rawData)
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          const errorMessage = validationError.errors.map(e => e.message).join(', ')
          console.warn('Upload validation error:', validationError.errors)
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ 
              error: `Datos inválidos: ${errorMessage}` 
            })
          }
        }
        throw validationError
      }
      
      try {
        const { filePath, contentType, base64Data } = validatedData
        
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
        
        // SANITIZACIÓN CRÍTICA: Prevenir Path Traversal
        // 1. Remover cualquier intento de navegación hacia atrás
        const sanitizedPath = filePath.replace(/\.\.\//g, '').replace(/\.\.\\/g, '')
        // 2. Asegurar que el path comience con el directorio esperado
        const allowedPrefixes = ['logos/', 'menu/']
        const hasValidPrefix = allowedPrefixes.some(prefix => sanitizedPath.startsWith(prefix))
        
        if (!hasValidPrefix) {
          console.error('Invalid file path:', filePath)
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ 
              error: 'Ruta de archivo inválida. Debe comenzar con "logos/" o "menu/"',
              provided: filePath
            })
          }
        }
        
        // 3. Prevenir caracteres especiales peligrosos
        if (/[\0\<\>\:\"\/\\\|\?\*]/.test(sanitizedPath)) {
          console.error('Invalid characters in file path:', filePath)
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ 
              error: 'Caracteres inválidos en el nombre del archivo'
            })
          }
        }
        
        // Usar el path sanitizado para el upload
        const safeFilePath = sanitizedPath
        
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
        
        console.log('Uploading to storage:', safeFilePath)
        
        const { error: uploadError } = await supabaseAdmin
          .storage
          .from('Images')  // El nombre del bucket es case-sensitive: 'Images' con I mayúscula
          .upload(safeFilePath, buffer, {
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
          .from('Images')  // El nombre del bucket es case-sensitive: 'Images' con I mayúscula
          .getPublicUrl(safeFilePath)
          
        console.log('Upload complete:', publicUrl)

        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ url: publicUrl })
        }
      } catch (uploadError) {
        console.error('Upload error:', {
          message: uploadError.message,
          name: uploadError.name
        })
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ 
            error: 'Error al subir la imagen'
            // NO exponer detalles internos al cliente
          })
        }
      }
    }

    // POST: Logout - limpiar cookie HTTP-only
    if (path === 'logout') {
      const clearCookieHeader = 'admin_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
      
      return {
        statusCode: 200,
        headers: {
          ...corsHeaders,
          'Set-Cookie': clearCookieHeader
        },
        body: JSON.stringify({ success: true })
      }
    }

    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Not found' })
    }

  } catch (err) {
    console.error('Handler error:', err.message)
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Error interno del servidor'
        // NO exponer stack traces o detalles internos
      })
    }
  }
}
