import { createClient } from '@supabase/supabase-js'

const URL = import.meta.env.VITE_SUPABASE_URL
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validación de variables de entorno críticas
if (!URL || !ANON_KEY) {
  throw new Error('Faltan variables de entorno de Supabase. Asegúrate de configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env')
}

export const supabase = createClient(URL, ANON_KEY)

// Admin API wrapper - usa Netlify Functions con autenticación por token JWT
export const adminApi = {
  // Token se guarda en sessionStorage después del login
  getToken() {
    return sessionStorage.getItem('admin_token')
  },

  setToken(token) {
    sessionStorage.setItem('admin_token', token)
  },

  clearToken() {
    sessionStorage.removeItem('admin_token')
  },

  async login(email, password) {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    
    if (data.success && data.token) {
      this.setToken(data.token)
    }
    
    return data
  },

  logout() {
    this.clearToken()
  },

  async getClients() {
    const res = await fetch('/api/admin/clients', {
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    })
    return res.json()
  },

  async getSocialsAll() {
    const res = await fetch('/api/admin/socials-all', {
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    })
    return res.json()
  },

  async getMenuAll() {
    const res = await fetch('/api/admin/menu-all', {
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    })
    return res.json()
  },

  async getConfigAll() {
    const res = await fetch('/api/admin/config-all', {
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    })
    return res.json()
  },

  async saveConfig(items) {
    const res = await fetch('/api/admin/config-save', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: JSON.stringify({ items })
    })
    return res.json()
  },

  async saveSocials(networks) {
    const res = await fetch('/api/admin/socials-save', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: JSON.stringify({ networks })
    })
    return res.json()
  },

  async toggleMenuItem(id, available) {
    const res = await fetch('/api/admin/menu-toggle', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: JSON.stringify({ id, available })
    })
    return res.json()
  },

  async deleteMenuItem(id) {
    const res = await fetch('/api/admin/menu-delete', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: JSON.stringify({ id })
    })
    return res.json()
  },

  async saveMenuItem(item) {
    const res = await fetch('/api/admin/menu-save', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
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
        'Authorization': `Bearer ${this.getToken()}`
      },
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