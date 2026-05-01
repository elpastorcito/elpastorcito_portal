// netlify/functions/admin.mjs
// Protege el SERVICE_KEY de Supabase - nunca llega al frontend

import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
}

// Simple rate limiting: almacenar intentos en memoria (se reinicia al redeploy)
const loginAttempts = new Map()
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hora
const MAX_ATTEMPTS = 5

function getClientIP(event) {
  return event.headers['x-forwarded-for']?.split(',')[0] || event.headers['client-ip'] || 'unknown'
}

function checkRateLimit(ip) {
  const now = Date.now()
  const attempts = loginAttempts.get(ip) || []
  
  // Filtrar intentos fuera de la ventana de tiempo
  const recentAttempts = attempts.filter(time => now - time < RATE_LIMIT_WINDOW)
  
  if (recentAttempts.length >= MAX_ATTEMPTS) {
    return false // Rate limit excedido
  }
  
  recentAttempts.push(now)
  loginAttempts.set(ip, recentAttempts)
  return true
}

export const handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' }
  }

  const path = event.path.replace('/api/admin/', '')

  try {
    // AUTH: Verificar credenciales admin con rate limiting
    if (path === 'login') {
      const ip = getClientIP(event)
      
      // Verificar rate limit
      if (!checkRateLimit(ip)) {
        return {
          statusCode: 429,
          headers: corsHeaders,
          body: JSON.stringify({ 
            success: false, 
            error: 'Demasiados intentos. Por favor espera 1 hora antes de intentar nuevamente.' 
          })
        }
      }
      
      const { user, password } = JSON.parse(event.body)
      const { data, error } = await supabaseAdmin
        .from('config')
        .select('value')
        .in('key', ['admin_user', 'admin_password'])

      if (error) throw error

      const cfg = {}
      data.forEach(row => cfg[row.key] = row.value)

      const valid = cfg.admin_user === user && cfg.admin_password === password
      
      // Si el login falla, el rate limit ya registró el intento
      // Si tiene éxito, podríamos limpiar los intentos para esta IP
      if (valid) {
        loginAttempts.delete(ip) // Limpiar intentos tras login exitoso
      }
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: valid })
      }
    }

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
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message })
    }
  }
}
