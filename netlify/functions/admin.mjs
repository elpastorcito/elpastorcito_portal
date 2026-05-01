import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
}

export const handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' }
  }

  const path = event.path.replace('/api/admin/', '').replace(/\/$/, '')

  try {
    // Endpoint de diagnóstico mejorado
    if (path === 'ping') {
      // Probar conexión a Supabase
      const { data, error } = await supabaseAdmin
        .from('config')
        .select('*')
        .limit(1)

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          hasUrl: !!process.env.SUPABASE_URL,
          hasKey: !!process.env.SUPABASE_SERVICE_KEY,
          urlPrefix: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 15) : 'missing',
          supabaseTest: error ? 'ERROR: ' + error.message : 'OK',
          dataSample: data
        })
      }
    }

    // AUTH: Verificar credenciales admin
    if (path === 'login') {
      const { user, password } = JSON.parse(event.body)
      
      // Verificar conexión a Supabase con más detalle
      const { data, error, status, statusText } = await supabaseAdmin
        .from('config')
        .select('*')
        .in('key', ['admin_user', 'admin_password'])

      if (error) {
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ 
            success: false, 
            error: 'Database error: ' + error.message,
            code: error.code,
            details: error.details
          })
        }
      }

      if (!data || data.length === 0) {
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ 
            success: false, 
            error: 'No data returned from config table',
            dataLength: data ? data.length : 'null'
          })
        }
      }

      const cfg = {}
      data.forEach(row => cfg[row.key] = row.value)

      const valid = cfg.admin_user === user && cfg.admin_password === password
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ 
          success: valid,
          debug: { 
            userProvided: user,
            configUser: cfg.admin_user,
            configPass: cfg.admin_password ? '***' : 'MISSING',
            allKeys: Object.keys(cfg)
          }
        })
      }
    }

    // El resto del código se mantiene igual...
    // GET: Clientes
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
