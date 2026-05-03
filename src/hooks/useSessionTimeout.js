import { useEffect, useRef, useCallback } from 'react'
import { adminApi } from '../supabase.js'

/**
 * Hook para manejar timeout de sesión automático
 * Cierra sesión automáticamente después de un período de inactividad
 * 
 * @param {number} timeoutMs - Tiempo de inactividad en milisegundos (default: 30 minutos)
 * @param {function} onLogout - Función a ejecutar cuando se cierra la sesión
 */
export function useSessionTimeout(timeoutMs = 30 * 60 * 1000, onLogout) {
  const timerRef = useRef(null)
  const lastActivityRef = useRef(Date.now())

  // Eventos que resetean el timer de actividad
  const activityEvents = [
    'mousedown',
    'keydown',
    'scroll',
    'touchstart',
    'click',
    'keypress'
  ]

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now()
    clearTimer()
    
    timerRef.current = setTimeout(() => {
      const idleTime = Date.now() - lastActivityRef.current
      if (idleTime >= timeoutMs) {
        // Timeout alcanzado - cerrar sesión
        console.log('Sesión expirada por inactividad')
        adminApi.logout()
        if (onLogout) {
          onLogout()
        }
      }
    }, timeoutMs)
  }, [timeoutMs, onLogout, clearTimer])

  useEffect(() => {
    // Iniciar timer inicial
    resetTimer()

    // Agregar listeners para eventos de actividad
    const handleActivity = () => {
      resetTimer()
    }

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity)
    })

    // Cleanup
    return () => {
      clearTimer()
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [resetTimer, clearTimer])

  // Función para forzar logout manual
  const forceLogout = useCallback(() => {
    clearTimer()
    adminApi.logout()
    if (onLogout) {
      onLogout()
    }
  }, [onLogout, clearTimer])

  return { forceLogout }
}
