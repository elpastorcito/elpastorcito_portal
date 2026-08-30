import { useState, useRef, useCallback, useEffect } from 'react'

// ============================================
// HOOK: TOAST NOTIFICATIONS
// ============================================
export function useToast() {
  const [toast, setToast] = useState(null)
  const timerRef = useRef(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const showToast = useCallback((msg) => {
    clearTimer()
    setToast(msg)
    timerRef.current = setTimeout(() => setToast(null), 3000)
  }, [clearTimer])

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return clearTimer
  }, [clearTimer])

  return { toast, showToast }
}
