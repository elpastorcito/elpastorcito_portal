import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../supabase.js'
import { buildStyles } from '../utils/styles'

// ============================================
// HOOK: CONFIGURACIÓN
// ============================================
export function useConfig() {
  // Estado inicial memoizado para evitar recreación
  const defaultConfig = useMemo(() => ({
    business_name: 'El Pastorcito Parripollo',
    slogan: '🔥 Pollos a la parrilla · Empanadas · Platos',
    logo_url: '',
    color_primary: '#E85D04',
    color_secondary: '#FAA307'
  }), [])

  const [cfg, setCfg] = useState(defaultConfig)
  const [loading, setLoading] = useState(true)

  // Cargar configuración al montar
  useEffect(() => {
    let isMounted = true
    
    async function loadConfig() {
      try {
        const { data, error } = await supabase
          .from('config')
          .select('key, value')
          .in('key', ['business_name', 'slogan', 'logo_url', 'color_primary', 'color_secondary'])

        if (error) throw error

        if (isMounted) {
          const newCfg = { ...defaultConfig }
          data.forEach(row => { newCfg[row.key] = row.value })
          setCfg(newCfg)
        }
      } catch (e) {
        // Log error in development mode for debugging
        if (import.meta.env.DEV) {
          console.warn('Failed to load config, using defaults:', e.message)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    
    loadConfig()
    
    // Cleanup para evitar memory leaks
    return () => {
      isMounted = false
    }
  }, [defaultConfig])

  // Memoizar actualización de estilos para evitar cálculos innecesarios
  const updateStyles = useCallback((config) => {
    let el = document.getElementById("dynamic-styles")
    if (!el) {
      el = document.createElement("style")
      el.id = "dynamic-styles"
      document.head.appendChild(el)
    }
    el.textContent = buildStyles(config)
  }, [])

  // Aplicar estilos cuando cambia la configuración
  useEffect(() => {
    updateStyles(cfg)
  }, [cfg, updateStyles])

  return { cfg, setCfg, loading }
}
