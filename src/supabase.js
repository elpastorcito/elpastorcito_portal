import { createClient } from '@supabase/supabase-js'

const URL = import.meta.env.VITE_SUPABASE_URL
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validación de variables de entorno críticas
if (!URL || !ANON_KEY) {
  throw new Error('Faltan variables de entorno de Supabase. Asegúrate de configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env')
}

export const supabase = createClient(URL, ANON_KEY)

// Admin API wrapper - usa Netlify Functions con autenticación por token JWT
// MEJORA DE SEGURIDAD: Cookies HTTP-only para proteger contra XSS
// El token se almacena en cookie HTTP-only en lugar de sessionStorage
export const adminApi = {
  // Token se obtiene automáticamente desde cookies en las solicitudes
  // No es accesible desde JavaScript (protección XSS)
  getToken() {
    // NOTA: Con cookies HTTP-only, el token NO es accesible desde JS
    // La autenticación se maneja automáticamente mediante cookies
    return null
  },

  setToken(token) {
    // NOTA: Con cookies HTTP-only, el token se establece vía header Set-Cookie
    // desde el backend, no desde el frontend
    console.warn('setToken() está obsoleto - usar login() que establece cookie HTTP-only')
    return false
  },

  clearToken() {
    // NOTA: Con cookies HTTP-only, la limpieza se hace vía backend logout
    console.warn('clearToken() está obsoleto - usar logout() que limpia cookie HTTP-only')
  },

  async login(email, password) {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'  // Incluir cookies en la solicitud
    })
    const data = await res.json()
    
    // El token se guarda automáticamente en cookie HTTP-only por el backend
    // No necesitamos guardarlo manualmente
    
    return data
  },

  async logout() {
    // Llamar al endpoint de logout para limpiar la cookie HTTP-only
    await fetch('/api/admin/logout', {
      method: 'POST',
      credentials: 'include'  // Incluir cookies
    })
  },

  async getClients() {
    const res = await fetch('/api/admin/clients', {
      credentials: 'include'  // Las cookies se envían automáticamente
    })
    return res.json()
  },

  async getSocialsAll() {
    const res = await fetch('/api/admin/socials-all', {
      credentials: 'include'
    })
    return res.json()
  },

  async getMenuAll() {
    const res = await fetch('/api/admin/menu-all', {
      credentials: 'include'
    })
    return res.json()
  },

  async getConfigAll() {
    const res = await fetch('/api/admin/config-all', {
      credentials: 'include'
    })
    return res.json()
  },

  async saveConfig(items) {
    const res = await fetch('/api/admin/config-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ items })
    })
    return res.json()
  },

  async saveSocials(networks) {
    const res = await fetch('/api/admin/socials-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ networks })
    })
    return res.json()
  },

  async toggleMenuItem(id, available) {
    const res = await fetch('/api/admin/menu-toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id, available })
    })
    return res.json()
  },

  async deleteMenuItem(id) {
    const res = await fetch('/api/admin/menu-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id })
    })
    return res.json()
  },

  async saveMenuItem(item) {
    const res = await fetch('/api/admin/menu-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ item })
    })
    return res.json()
  },

  async uploadImage(filePath, file) {
    // Convertir archivo a base64 completo (con data URL prefix)
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result) // Mantener el prefix "data:image/..."
      reader.onerror = () => reject(new Error('Error al leer el archivo'))
      reader.readAsDataURL(file)
    })

    const isDevelopment = import.meta.env.DEV
    
    if (isDevelopment) {
      console.log('Uploading image:', { filePath, type: file.type, size: file.size })
    }

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        filePath,
        contentType: file.type,
        base64Data: base64
      })
    })
    
    if (!res.ok) {
      const errorData = await res.json()
      if (isDevelopment) {
        console.error('Upload failed:', errorData)
      }
      throw new Error(errorData.error || 'Error al subir la imagen')
    }
    
    return res.json()
  }
}