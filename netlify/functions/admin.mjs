// netlify/functions/admin.mjs
// Protege el SERVICE_KEY de Supabase - nunca llega al frontend

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

  const path = event.path.replace('/api/admin/', '')

  try {
    // AUTH: Verificar credenciales admin
    if (path === 'login') {
      const { user, password } = JSON.parse(event.body)
      const { data, error } = await supabaseAdmin
        .from('config')
        .select('value')
        .in('key', ['admin_user', 'admin_password'])

      if (error) throw error

      const cfg = {}
      data.forEach(row => cfg[row.key] = row.value)

      const valid = cfg.admin_user === user && cfg.admin_password === password
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
