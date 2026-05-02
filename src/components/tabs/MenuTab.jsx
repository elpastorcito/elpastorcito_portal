import React, { useState, useEffect } from 'react'
import { adminApi } from '../../supabase.js'
import { fmtPrice, genSlug } from '../../utils/formatters.js'
import { useToast } from '../../hooks/useToast.js'

export function MenuTab() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [uploading, setUploading] = useState(false)
  const { toast, showToast } = useToast()

  const emptyItem = {
    name: '',
    description: '',
    price: '',
    category: '',
    image_url: '',
    available: true
  }

  useEffect(() => { loadItems() }, [])

  async function loadItems() {
    try {
      const data = await adminApi.getMenuAll()
      setItems(data)
    } catch (e) {
      showToast('Error al cargar menú')
    } finally {
      setLoading(false)
    }
  }

  async function toggleAvailable(item) {
    try {
      await adminApi.toggleMenuItem(item.id, !item.available)
      setItems(items.map(i => i.id === item.id ? { ...i, available: !i.available } : i))
      showToast(item.available ? 'Item pausado' : 'Item activado')
    } catch (e) {
      showToast('Error al actualizar')
    }
  }

  async function deleteItem(item) {
    if (!window.confirm(`¿Estás seguro que querés eliminar "${item.name}"?\n\nEsta acción no se puede deshacer.`)) return
    try {
      await adminApi.deleteMenuItem(item.id)
      setItems(items.filter(i => i.id !== item.id))
      showToast('Item eliminado correctamente')
    } catch (e) {
      showToast('Error al eliminar el item. Intentá de nuevo.')
    }
  }

  async function handleImageUpload(e, setItem) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `menu/${genSlug()}.${ext}`
      const result = await adminApi.uploadImage(path, file)
      setItem(prev => ({ ...prev, image_url: result.url }))
      showToast('Imagen subida')
    } catch (err) {
      showToast('Error al subir imagen')
    } finally {
      setUploading(false)
    }
  }

  async function saveItem(item) {
    if (!item.name.trim() || !item.price) {
      showToast('Nombre y precio son obligatorios')
      return
    }
    try {
      await adminApi.saveMenuItem({
        ...item,
        price: Number(item.price)
      })
      await loadItems()
      setModalOpen(false)
      setEditingItem(null)
      showToast('Item guardado')
    } catch (e) {
      showToast('Error al guardar')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Lobster', color: 'var(--p)' }}>🍗 Menú</h2>
        <button 
          className="btn btn-primary btn-sm" 
          onClick={() => { setEditingItem({ ...emptyItem }); setModalOpen(true) }}
        >
          + Agregar
        </button>
      </div>

      {loading ? (
        <div className="empty-state">Cargando...</div>
      ) : items.length === 0 ? (
        <div className="empty-state">No hay items en el menú</div>
      ) : (
        <div className="menu-grid">
          {items.map(item => (
            <div key={item.id} className="menu-admin-card anim-slide-up">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="menu-admin-img" />
              ) : (
                <div className="menu-admin-img">🍗</div>
              )}
              <div className="menu-admin-body">
                <div className="menu-admin-name">{item.name}</div>
                <div className="menu-admin-desc">{item.description || 'Sin descripción'}</div>
                <div className="menu-admin-price">{fmtPrice(item.price)}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span className={`badge ${item.available ? 'badge-green' : 'badge-red'}`}>
                    {item.available ? 'Disponible' : 'No disponible'}
                  </span>
                  {item.category && <span className="badge" style={{ background: 'var(--light)', color: 'var(--ash)' }}>{item.category}</span>}
                </div>
                <div className="menu-admin-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => { setEditingItem({ ...item }); setModalOpen(true) }}>
                    ✏️ Editar
                  </button>
                  <button className="btn btn-sm" style={{ background: item.available ? '#f39c12' : '#27ae60', color: 'white' }} onClick={() => toggleAvailable(item)}>
                    {item.available ? '⏸ Pausar' : '▶ Activar'}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteItem(item)}>
                    🗑
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={() => { setModalOpen(false); setEditingItem(null) }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-title">{editingItem?.id ? 'Editar item' : 'Nuevo item'}</div>

            <div className="form-group">
              <div className="upload-area" onClick={() => document.getElementById('menu-img-input').click()}>
                {editingItem?.image_url ? (
                  <img src={editingItem.image_url} alt="Preview" className="upload-preview" />
                ) : (
                  <div>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>📷</div>
                    <div>Click para subir imagen</div>
                  </div>
                )}
              </div>
              <input 
                id="menu-img-input" 
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }}
                onChange={e => handleImageUpload(e, setEditingItem)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input 
                className="form-input" 
                value={editingItem?.name || ''} 
                onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Precio (ARS) *</label>
              <input 
                type="number" 
                className="form-input" 
                value={editingItem?.price || ''} 
                onChange={e => setEditingItem({ ...editingItem, price: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Categoría</label>
              <input 
                className="form-input" 
                placeholder="Ej: Parrilla, Bebidas, Postres"
                value={editingItem?.category || ''} 
                onChange={e => setEditingItem({ ...editingItem, category: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Descripción</label>
              <textarea 
                className="form-input" 
                rows={3}
                value={editingItem?.description || ''} 
                onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="checkbox-row">
              <input 
                type="checkbox" 
                id="available"
                checked={editingItem?.available !== false}
                onChange={e => setEditingItem({ ...editingItem, available: e.target.checked })}
              />
              <label htmlFor="available">Disponible actualmente</label>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={() => { setModalOpen(false); setEditingItem(null) }}>
                Cancelar
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => saveItem(editingItem)}
                disabled={uploading}
              >
                {uploading ? <><span className="spinner" /> Subiendo...</> : '💾 Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
