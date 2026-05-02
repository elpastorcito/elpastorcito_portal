import React, { useState, useEffect } from 'react'
import { adminApi } from '../supabase.js'
import { useToast } from '../hooks/useToast'

// ============================================
// TAB: APARIENCIA
// ============================================
export function AppearanceTab({ cfg, onCfgUpdated }) {
  const [configItems, setConfigItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const { toast, showToast } = useToast()

  useEffect(() => {
    loadConfig()
  }, [])

  async function loadConfig() {
    try {
      const data = await adminApi.getConfigAll()
      setConfigItems(data)
    } catch (e) {
      showToast('Error al cargar configuración')
    } finally {
      setLoading(false)
    }
  }

  function startEdit(item) {
    setEditingId(item.id)
    setEditForm({ ...item })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm({})
  }

  async function saveEdit() {
    try {
      await adminApi.saveConfig([editForm])
      setConfigItems(configItems.map(item => 
        item.id === editingId ? { ...item, ...editForm } : item
      ))
      
      // Actualizar config global si se editaron items clave
      if (['business_name', 'slogan', 'logo_url'].includes(editForm.key)) {
        const updatedCfg = { ...cfg, [editForm.key]: editForm.value }
        onCfgUpdated(updatedCfg)
      }
      
      setEditingId(null)
      showToast('Configuración actualizada')
    } catch (e) {
      showToast('Error al actualizar')
    }
  }

  if (loading) {
    return <div className="empty-state">Cargando configuración...</div>
  }

  const appearanceItems = configItems.filter(item => 
    ['business_name', 'slogan', 'logo_url', 'primary_color', 'accent_color'].includes(item.key)
  )

  const labels = {
    business_name: 'Nombre del Negocio',
    slogan: 'Eslogan',
    logo_url: 'URL del Logo',
    primary_color: 'Color Principal',
    accent_color: 'Color de Acento'
  }

  return (
    <div>
      <h3 style={{ marginBottom: 16, color: 'var(--light)' }}>🎨 Apariencia</h3>

      {appearanceItems.length === 0 ? (
        <div className="empty-state">No hay elementos de apariencia configurados</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {appearanceItems.map(item => (
            <div key={item.id} className="admin-card" style={{ padding: 16 }}>
              {editingId === item.id ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ fontWeight: 600, color: 'var(--cream)' }}>
                    {labels[item.key] || item.key}
                  </div>
                  
                  {item.key.includes('color') ? (
                    <input
                      type="color"
                      className="form-input"
                      value={editForm.value || '#000000'}
                      onChange={e => setEditForm({ ...editForm, value: e.target.value })}
                      style={{ height: 50, width: '100%' }}
                    />
                  ) : item.key === 'logo_url' ? (
                    <div>
                      <input
                        type="url"
                        className="form-input"
                        value={editForm.value || ''}
                        onChange={e => setEditForm({ ...editForm, value: e.target.value })}
                        placeholder="https://..."
                      />
                      {editForm.value && (
                        <img 
                          src={editForm.value} 
                          alt="Vista previa" 
                          style={{ marginTop: 8, maxHeight: 100, borderRadius: 8 }}
                        />
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.value || ''}
                      onChange={e => setEditForm({ ...editForm, value: e.target.value })}
                      placeholder={labels[item.key]}
                    />
                  )}
                  
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={saveEdit}>Guardar</button>
                    <button className="btn btn-secondary btn-sm" onClick={cancelEdit}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--cream)', marginBottom: 4 }}>
                      {labels[item.key] || item.key}
                    </div>
                    {item.key.includes('color') ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div 
                          style={{ 
                            width: 24, 
                            height: 24, 
                            borderRadius: 4, 
                            background: item.value 
                          }}
                        />
                        <span style={{ fontFamily: 'monospace' }}>{item.value}</span>
                      </div>
                    ) : item.key === 'logo_url' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {item.value && (
                          <img 
                            src={item.value} 
                            alt="Logo" 
                            style={{ height: 40, borderRadius: 4 }}
                          />
                        )}
                        <span style={{ opacity: 0.7, fontSize: '0.9rem' }}>{item.value}</span>
                      </div>
                    ) : (
                      <div style={{ opacity: 0.8 }}>{item.value}</div>
                    )}
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => startEdit(item)}>
                    ✏️ Editar
                  </button>
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
