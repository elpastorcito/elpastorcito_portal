import React, { useState, useEffect } from 'react'
import { adminApi } from '../supabase.js'
import { useToast } from '../hooks/useToast'
import { fmtPrice } from '../utils/formatters'

// ============================================
// TAB: MENÚ
// ============================================
export function MenuTab() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const { toast, showToast } = useToast()

  useEffect(() => {
    loadMenu()
  }, [])

  async function loadMenu() {
    try {
      const data = await adminApi.getMenuAll()
      setItems(data)
    } catch (e) {
      showToast('Error al cargar menú')
    } finally {
      setLoading(false)
    }
  }

  async function toggleAvailability(id, available) {
    try {
      await adminApi.toggleMenuItem(id, !available)
      setItems(items.map(item => 
        item.id === id ? { ...item, available: !available } : item
      ))
      showToast('Estado actualizado')
    } catch (e) {
      showToast('Error al actualizar')
    }
  }

  async function deleteItem(id) {
    if (!confirm('¿Eliminar este producto?')) return
    try {
      await adminApi.deleteMenuItem(id)
      setItems(items.filter(item => item.id !== id))
      showToast('Producto eliminado')
    } catch (e) {
      showToast('Error al eliminar')
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
      await adminApi.updateMenuItem(editingId, editForm)
      setItems(items.map(item => 
        item.id === editingId ? { ...item, ...editForm } : item
      ))
      setEditingId(null)
      showToast('Producto actualizado')
    } catch (e) {
      showToast('Error al actualizar')
    }
  }

  if (loading) {
    return <div className="empty-state">Cargando menú...</div>
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ color: 'var(--light)' }}>🍗 Productos</h3>
        <button className="btn btn-primary btn-sm" onClick={() => showToast('Función agregar próximamente')}>
          + Agregar Producto
        </button>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">No hay productos en el menú</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {items.map(item => (
            <div key={item.id} className="admin-card" style={{ padding: 16 }}>
              {editingId === item.id ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.name || ''}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="Nombre"
                  />
                  <input
                    type="number"
                    className="form-input"
                    value={editForm.price || ''}
                    onChange={e => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                    placeholder="Precio"
                  />
                  <textarea
                    className="form-input"
                    value={editForm.description || ''}
                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Descripción"
                    rows={2}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={saveEdit}>Guardar</button>
                    <button className="btn btn-secondary btn-sm" onClick={cancelEdit}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--cream)' }}>
                        {item.name}
                      </div>
                      {item.description && (
                        <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: 4 }}>
                          {item.description}
                        </div>
                      )}
                      <div style={{ color: 'var(--accent)', fontWeight: 600, marginTop: 8 }}>
                        {fmtPrice(item.price)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className={`btn btn-sm ${item.available ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={() => toggleAvailability(item.id, item.available)}
                      >
                        {item.available ? '✓ Disponible' : '✕ No disponible'}
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => startEdit(item)}>
                        ✏️
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => deleteItem(item.id)}>
                        🗑️
                      </button>
                    </div>
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
