import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase.js'
import { buildStyles } from '../utils/styles'

// ============================================
// HOOK: CONFIGURACIÓN
// ============================================
export function useConfig() {
  const [cfg, setCfg] = useState({
    business_name: 'El Pastorcito Parripollo',
    slogan: '🔥 Pollos a la parrilla · Empanadas · Platos',
    logo_url: '',
    color_primary: '#E85D04',
    color_secondary: '#FAA307'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConfig()
  }, [])

  useEffect(() => {
    let el = document.getElementById("dynamic-styles")
    if (!el) {
      el = document.createElement("style")
      el.id = "dynamic-styles"
      document.head.appendChild(el)
    }
    el.textContent = buildStyles(cfg)
  }, [cfg])

  async function loadConfig() {
    try {
      const { data, error } = await supabase
        .from('config')
        .select('key, value')
        .in('key', ['business_name', 'slogan', 'logo_url', 'color_primary', 'color_secondary'])

      if (error) throw error

      const newCfg = { ...cfg }
      data.forEach(row => { newCfg[row.key] = row.value })
      setCfg(newCfg)
    } catch (e) {
      // Silencioso: usa config por defecto si no hay datos
    } finally {
      setLoading(false)
    }
  }

  return { cfg, setCfg, loading }
}
