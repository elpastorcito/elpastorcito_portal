import React, { useState, useEffect } from 'react'
import { adminApi } from '../../supabase.js'
import { SocialIcon } from '../SocialIcon.jsx'
import { useToast } from '../../hooks/useToast.js'

export function SocialsTab() {
  const [networks, setNetworks] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast, showToast } = useToast()

  useEffect(() => { loadSocials() }, [])

  async function loadSocials() {
    try {
      const data = await adminApi.getSocialsAll()
      setNetworks(data)
    } catch (e) {
      showToast('Error al cargar redes')
    } finally {
      setLoading(false)
    }
  }

  async function saveSocials() {
    setSaving(true)
    try {
      await adminApi.saveSocials(networks)
      showToast('Redes guardadas')
    } catch (e) {
      showToast('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const updateNetwork = (id, field, value) => {
    setNetworks(networks.map(n => n.id === id ? { ...n, [field]: value } : n))
  }

  return (
    <div>
      <div className="admin-card">
        <div className="admin-card-title">📱 Redes Sociales</div>
        <p style={{ fontSize: '0.9rem', color: 'var(--ash)', marginBottom: 20 }}>
          Activá las redes que ya tengas. Podés cambiarlas en cualquier momento: el portal se actualiza automáticamente.
        </p>

        {loading ? (
          <div className="empty-state">Cargando...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {networks.map(n => (
              <div key={n.id} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 16, 
                padding: 16, 
                background: 'white', 
                borderRadius: 16,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}>
                <div style={{ 
                  width: 44, 
                  height: 44, 
                  borderRadius: 12, 
                  background: n.color, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <SocialIcon id={n.id} size={24} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, marginBottom: 6 }}>{n.name}</div>
                  <input
                    className="form-input"
                    placeholder={`URL de ${n.name}`}
                    value={n.url}
                    onChange={e => updateNetwork(n.id, 'url', e.target.value)}
                    style={{ padding: '10px 12px', fontSize: '0.9rem' }}
                  />
                </div>
                <div 
                  className={`toggle-switch ${n.active ? 'active' : ''}`}
                  onClick={() => updateNetwork(n.id, 'active', !n.active)}
                />
              </div>
            ))}
          </div>
        )}

        <button 
          className="btn btn-primary" 
          style={{ marginTop: 24 }}
          onClick={saveSocials}
          disabled={saving}
        >
          {saving ? <><span className="spinner" /> Guardando...</> : '💾 Guardar cambios'}
        </button>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
