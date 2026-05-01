import { createClient } from '@supabase/supabase-js'

const URL = import.meta.env.VITE_SUPABASE_URL
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(URL, ANON_KEY)

// Admin API wrapper - usa Netlify Functions (no expone service key)
export const adminApi = {
  async login(user, password) {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, password })
    })
    return res.json()
  },

  async getClients() {
    const res = await fetch('/api/admin/clients')
    return res.json()
  },

  async getSocialsAll() {
    const res = await fetch('/api/admin/socials-all')
    return res.json()
  },

  async getMenuAll() {
    const res = await fetch('/api/admin/menu-all')
    return res.json()
  },

  async getConfigAll() {
    const res = await fetch('/api/admin/config-all')
    return res.json()
  },

  async saveConfig(items) {
    const res = await fetch('/api/admin/config-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    })
    return res.json()
  },

  async saveSocials(networks) {
    const res = await fetch('/api/admin/socials-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ networks })
    })
    return res.json()
  },

  async toggleMenuItem(id, available) {
    const res = await fetch('/api/admin/menu-toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, available })
    })
    return res.json()
  },

  async deleteMenuItem(id) {
    const res = await fetch('/api/admin/menu-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    return res.json()
  },

  async saveMenuItem(item) {
    const res = await fetch('/api/admin/menu-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item })
    })
    return res.json()
  },

  async uploadImage(filePath, file) {
    const base64 = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result.split(',')[1])
      reader.readAsDataURL(file)
    })

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filePath,
        contentType: file.type,
        base64Data: base64
      })
    })
    return res.json()
  }
}