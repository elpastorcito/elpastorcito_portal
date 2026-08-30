import { createClient } from '@supabase/supabase-js'

const URL = import.meta.env.VITE_SUPABASE_URL
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validación de variables de entorno críticas
if (!URL || !ANON_KEY) {
  throw new Error('Faltan variables de entorno de Supabase. Asegúrate de configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env')
}

export const supabase = createClient(URL, ANON_KEY)

// Helper: perform authenticated fetch with consistent error handling
async function authFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Error ${res.status}: ${res.statusText}`)
  }
  return res.json()
}

// Admin API wrapper - usa Netlify Functions con autenticación por cookie HTTP-only
export const adminApi = {
  async login(email, password) {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    })
    return res.json()
  },

  async logout() {
    await fetch('/api/admin/logout', {
      method: 'POST',
      credentials: 'include',
    })
  },

  async getClients() {
    return authFetch('/api/admin/clients')
  },

  async getSocialsAll() {
    return authFetch('/api/admin/socials-all')
  },

  async getMenuAll() {
    return authFetch('/api/admin/menu-all')
  },

  async getConfigAll() {
    return authFetch('/api/admin/config-all')
  },

  async saveConfig(items) {
    return authFetch('/api/admin/config-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    })
  },

  async saveSocials(networks) {
    return authFetch('/api/admin/socials-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ networks }),
    })
  },

  async toggleMenuItem(id, available) {
    return authFetch('/api/admin/menu-toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, available }),
    })
  },

  async deleteMenuItem(id) {
    return authFetch('/api/admin/menu-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  },

  async saveMenuItem(item) {
    return authFetch('/api/admin/menu-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item }),
    })
  },

  async uploadImage(filePath, file) {
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = () => reject(new Error('Error al leer el archivo'))
      reader.readAsDataURL(file)
    })

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        filePath,
        contentType: file.type,
        base64Data: base64,
      }),
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.error || 'Error al subir la imagen')
    }

    return res.json()
  },
}
