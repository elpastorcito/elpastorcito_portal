import React, { useState } from 'react'

// ============================================
// HOOK: TOAST NOTIFICATIONS
// ============================================
export function useToast() {
  const [toast, setToast] = useState(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  return { toast, showToast }
}
