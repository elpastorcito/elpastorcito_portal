import React, { useState } from 'react'
import { adminApi } from '../../supabase.js'
import { useToast } from '../../hooks/useToast.js'

export function ConfigTab() {
  const [saving, setSaving] = useState(false)
  const { toast, showToast } = useToast()

  async function handleLogoutEverywhere() {
    if (!confirm('¿Estás seguro de cerrar sesión en todos los dispositivos?')) return
    
    setSaving(true)
    try {
      // Limpiar token local
      adminApi.logout()
      // En una implementación completa, aquí se invalidaría el token en el backend
      showToast('Sesión cerrada correctamente')
      window.location.reload()
    } catch (e) {
      showToast('Error al cerrar sesión')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="two-col">
      <div className="admin-card">
        <div className="admin-card-title">🔐 Seguridad de la sesión</div>

        <p style={{ fontSize: '0.9rem', color: 'var(--ash)', marginBottom: 16 }}>
          Tu sesión está protegida con autenticación de Supabase. El token se guarda temporalmente en tu navegador.
        </p>

        <button 
          className="btn btn-danger" 
          onClick={handleLogoutEverywhere}
          disabled={saving}
        >
          {saving ? <><span className="spinner" /> Cerrando...</> : '🚪 Cerrar sesión'}
        </button>
      </div>

      <div className="admin-card">
        <div className="admin-card-title">ℹ️ Información del sistema</div>
        <div style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--ash)' }}>
          <p><strong>Proyecto Supabase:</strong></p>
          <p style={{ fontFamily: 'monospace', fontSize: '0.8rem', background: 'var(--light)', padding: 8, borderRadius: 8, marginTop: 4 }}>
            {import.meta.env.VITE_SUPABASE_URL || 'No configurado'}
          </p>
          <p style={{ marginTop: 16 }}>
            <strong>Autenticación:</strong> Supabase Auth con email/password
          </p>
          <p style={{ marginTop: 12, fontSize: '0.8rem' }}>
            Para cambiar tu contraseña o email, andá a Supabase Dashboard → Authentication → Users
          </p>
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
