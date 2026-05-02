import React, { useState, useEffect } from 'react'
import { adminApi } from '../supabase.js'
import { useToast } from '../hooks/useToast'

// ============================================
// TAB: REDES SOCIALES
// ============================================
export function SocialsTab() {
  const [networks, setNetworks] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const { toast, showToast } = useToast()

  useEffect(() => {
    loadSocials()
  }, [])

  async function loadSocials() {
    try {
      const data = await adminApi.getSocialsAll()
      setNetworks(data)
    } catch (e) {
      showToast('Error al cargar redes sociales')
    } finally {
      setLoading(false)
    }
  }

  async function toggleActive(id, active) {
    try {
      const network = networks.find(n => n.id === id)
      await adminApi.saveSocials([{ ...network, active: !active }])
      setNetworks(networks.map(n => 
        n.id === id ? { ...n, active: !active } : n
      ))
      showToast('Estado actualizado')
    } catch (e) {
      showToast('Error al actualizar')
    }
  }

  function startEdit(network) {
    setEditingId(network.id)
    setEditForm({ ...network })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm({})
  }

  async function saveEdit() {
    try {
      await adminApi.saveSocials([editForm])
      setNetworks(networks.map(n => 
        n.id === editingId ? { ...n, ...editForm } : n
      ))
      setEditingId(null)
      showToast('Red social actualizada')
    } catch (e) {
      showToast('Error al actualizar')
    }
  }

  if (loading) {
    return <div className="empty-state">Cargando redes sociales...</div>
  }

  const socialColors = {
    facebook: '#1877F2',
    instagram: '#E4405F',
    twitter: '#1DA1F2',
    tiktok: '#000000',
    whatsapp: '#25D366',
    youtube: '#FF0000'
  }

  return (
    <div>
      <h3 style={{ marginBottom: 16, color: 'var(--light)' }}>📱 Redes Sociales</h3>

      {networks.length === 0 ? (
        <div className="empty-state">No hay redes sociales configuradas</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {networks.map(network => (
            <div key={network.id} className="admin-card" style={{ padding: 16 }}>
              {editingId === network.id ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.name || ''}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="Nombre (ej: Instagram)"
                  />
                  <input
                    type="url"
                    className="form-input"
                    value={editForm.url || ''}
                    onChange={e => setEditForm({ ...editForm, url: e.target.value })}
                    placeholder="URL completa"
                  />
                  <input
                    type="color"
                    className="form-input"
                    value={editForm.color || '#000000'}
                    onChange={e => setEditForm({ ...editForm, color: e.target.value })}
                    style={{ height: 40 }}
                  />
                  <input
                    type="number"
                    className="form-input"
                    value={editForm.sort_order || 0}
                    onChange={e => setEditForm({ ...editForm, sort_order: parseInt(e.target.value) })}
                    placeholder="Orden"
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={saveEdit}>Guardar</button>
                    <button className="btn btn-secondary btn-sm" onClick={cancelEdit}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div 
                      style={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: 8, 
                        background: network.color || socialColors[network.id] || '#666',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 600
                      }}
                    >
                      {network.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--cream)' }}>{network.name}</div>
                      <div style={{ fontSize: '0.85rem', opacity: 0.7, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {network.url}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className={`btn btn-sm ${network.active ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={() => toggleActive(network.id, network.active)}
                    >
                      {network.active ? '✓ Activo' : '✕ Inactivo'}
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => startEdit(network)}>
                      ✏️
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
