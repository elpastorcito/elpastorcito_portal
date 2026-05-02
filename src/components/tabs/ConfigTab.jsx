import React, { useState, useEffect } from 'react'
import { adminApi } from '../supabase.js'
import { useToast } from '../hooks/useToast'

// ============================================
// TAB: CONFIGURACIÓN GENERAL
// ============================================
export function ConfigTab() {
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
      setEditingId(null)
      showToast('Configuración actualizada')
    } catch (e) {
      showToast('Error al actualizar')
    }
  }

  if (loading) {
    return <div className="empty-state">Cargando configuración...</div>
  }

  const configItemsFiltered = configItems.filter(item => 
    !['business_name', 'slogan', 'logo_url', 'primary_color', 'accent_color'].includes(item.key)
  )

  const labels = {
    wifi_password: 'Contraseña WiFi',
    hours: 'Horarios de Atención',
    address: 'Dirección',
    phone: 'Teléfono',
    email: 'Email',
    terms_text: 'Texto de Términos y Condiciones'
  }

  return (
    <div>
      <h3 style={{ marginBottom: 16, color: 'var(--light)' }}>⚙️ Configuración General</h3>

      {configItemsFiltered.length === 0 ? (
        <div className="empty-state">No hay elementos de configuración</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {configItemsFiltered.map(item => (
            <div key={item.id} className="admin-card" style={{ padding: 16 }}>
              {editingId === item.id ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ fontWeight: 600, color: 'var(--cream)' }}>
                    {labels[item.key] || item.key}
                  </div>
                  
                  {item.key === 'terms_text' ? (
                    <textarea
                      className="form-input"
                      value={editForm.value || ''}
                      onChange={e => setEditForm({ ...editForm, value: e.target.value })}
                      placeholder="Texto completo de términos..."
                      rows={6}
                    />
                  ) : (
                    <input
                      type={item.key === 'wifi_password' ? 'password' : 'text'}
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
                    <div style={{ opacity: 0.8, wordBreak: 'break-word' }}>
                      {item.key === 'wifi_password' ? '••••••••' : item.value}
                    </div>
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
