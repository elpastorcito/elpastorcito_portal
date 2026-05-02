import React, { useState, useEffect, useRef, useCallback } from 'react'
import { supabase, adminApi } from './supabase.js'
import { fmtPrice, fmtDate, fmtDateShort, genSlug, getFirstName, exportCSV } from './utils/formatters.js'
import { buildStyles } from './utils/styles.js'
import { useConfig } from './hooks/useConfig.js'
import { useToast } from './hooks/useToast.js'
import { Flames } from './components/Flames'
import { TermsModal } from './components/TermsModal'
import { SocialIcon } from './components/SocialIcon'
import { Portal } from './components/Portal'
import { SuccessScreen } from './components/SuccessScreen'
import { AdminLogin } from './components/AdminLogin'


// ============================================
// TAB: CLIENTES
// ============================================
function ClientsTab() {
  const [clients, setClients] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const { toast, showToast } = useToast()

  useEffect(() => { loadClients() }, [])
  useEffect(() => {
    const term = search.toLowerCase().trim()
    setFiltered(clients.filter(c => 
      c.name.toLowerCase().includes(term) ||
      c.phone.includes(term) ||
      (c.email && c.email.toLowerCase().includes(term))
    ))
  }, [search, clients])

  async function loadClients() {
    try {
      const data = await adminApi.getClients()
      setClients(data)
      setFiltered(data)
    } catch (e) {
      showToast('Error al cargar clientes')
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const todayClients = clients.filter(c => {
    const d = new Date(c.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    return d === today
  })

  const stats = {
    total: clients.length,
    today: todayClients.length,
    withEmail: clients.filter(c => c.email).length,
    avgPerDay: clients.length > 0 ? (clients.length / Math.max(1, new Set(clients.map(c => c.created_at.slice(0,10))).size)).toFixed(1) : 0
  }

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.today}</div>
          <div className="stat-label">Hoy</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.withEmail}</div>
          <div className="stat-label">Con email</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.avgPerDay}</div>
          <div className="stat-label">Prom/día</div>
        </div>
      </div>

      <div className="admin-card">
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            type="text"
            className="search-box"
            placeholder="Buscar por nombre, teléfono o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          />
          <button className="btn btn-secondary btn-sm" onClick={() => exportCSV(filtered)}>
            📥 Exportar CSV
          </button>
        </div>

        {loading ? (
          <div className="empty-state">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">No se encontraron clientes</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.phone}</td>
                    <td>{c.email || '-'}</td>
                    <td>{fmtDate(c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

// ============================================
// TAB: ESTADÍSTICAS
// ============================================
function StatsTab() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const data = await adminApi.getClients()
      setClients(data)
    } catch (e) {
      showToast('Error al cargar clientes')
    } finally {
      setLoading(false)
    }
  }

  // Agrupar por fecha (últimos 7 días)
  const grouped = {}
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    grouped[key] = 0
  }

  clients.forEach(c => {
    const key = c.created_at.slice(0, 10)
    if (grouped.hasOwnProperty(key)) grouped[key]++
  })

  const chartData = Object.entries(grouped).map(([date, count]) => ({
    date,
    count,
    label: fmtDateShort(date)
  }))

  const maxCount = Math.max(...chartData.map(d => d.count), 1)
  const daysWithVisits = Object.values(grouped).filter(c => c > 0).length
  const maxInDay = Math.max(...Object.values(grouped))

  const stats = {
    total: clients.length,
    withEmail: clients.filter(c => c.email).length,
    daysWithVisits,
    maxInDay
  }

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Clientes totales</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.withEmail}</div>
          <div className="stat-label">Con email</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.daysWithVisits}</div>
          <div className="stat-label">Días con visitas</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.maxInDay}</div>
          <div className="stat-label">Máx. en un día</div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-title">📊 Visitas últimos 7 días</div>
        {loading ? (
          <div className="empty-state">Cargando...</div>
        ) : clients.length === 0 ? (
          <div className="empty-state">Sin datos aún — los clientes aparecerán aquí</div>
        ) : (
          <div className="chart-container">
            {chartData.map(d => (
              <div key={d.date} className="chart-bar-wrapper">
                <div className="chart-count">{d.count}</div>
                <div 
                  className="chart-bar" 
                  style={{ height: `${(d.count / maxCount) * 90}px` }}
                />
                <div className="chart-date">{d.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// TAB: MENÚ
// ============================================
function MenuTab() {
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

// ============================================
// TAB: REDES SOCIALES
// ============================================
function SocialsTab() {
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

// ============================================
// TAB: APARIENCIA
// ============================================
function AppearanceTab({ cfg, onCfgUpdated }) {
  const [form, setForm] = useState({
    business_name: cfg.business_name,
    slogan: cfg.slogan,
    logo_url: cfg.logo_url,
    color_primary: cfg.color_primary,
    color_secondary: cfg.color_secondary
  })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast, showToast } = useToast()

  useEffect(() => {
    setForm({
      business_name: cfg.business_name,
      slogan: cfg.slogan,
      logo_url: cfg.logo_url,
      color_primary: cfg.color_primary,
      color_secondary: cfg.color_secondary
    })
  }, [cfg])

  async function handleLogoUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `logo/logo_principal.${ext}`
      const result = await adminApi.uploadImage(path, file)
      const urlWithCache = `${result.url}?v=${Date.now()}`
      setForm({ ...form, logo_url: urlWithCache })
      showToast('Logo subido')
    } catch (err) {
      showToast('Error al subir logo')
    } finally {
      setUploading(false)
    }
  }

  async function saveAppearance() {
    setSaving(true)
    try {
      const items = [
        { key: 'business_name', value: form.business_name },
        { key: 'slogan', value: form.slogan },
        { key: 'logo_url', value: form.logo_url },
        { key: 'color_primary', value: form.color_primary },
        { key: 'color_secondary', value: form.color_secondary }
      ]
      await adminApi.saveConfig(items)
      onCfgUpdated({ ...form })
      showToast('Apariencia guardada — se actualizará en el próximo acceso')
    } catch (e) {
      showToast('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="two-col">
      <div className="admin-card">
        <div className="admin-card-title">🖼️ Logo del local</div>

        <div style={{ 
          height: 140, 
          background: 'var(--light)', 
          borderRadius: 20, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginBottom: 16,
          overflow: 'hidden'
        }}>
          {form.logo_url ? (
            <img src={form.logo_url} alt="Logo" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
          ) : (
            <span style={{ fontSize: 60 }}>🐓</span>
          )}
        </div>

        <div className="upload-area" onClick={() => document.getElementById('logo-input').click()}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>📷</div>
          <div style={{ fontWeight: 700, color: 'var(--ash)' }}>
            {uploading ? 'Subiendo...' : 'Click para cambiar logo'}
          </div>
        </div>
        <input 
          id="logo-input" 
          type="file" 
          accept="image/*" 
          style={{ display: 'none' }}
          onChange={handleLogoUpload}
        />

        {form.logo_url && (
          <button 
            className="btn btn-danger btn-sm" 
            style={{ marginTop: 12, width: '100%' }}
            onClick={() => setForm({ ...form, logo_url: '' })}
          >
            🗑 Quitar logo (usar emoji)
          </button>
        )}
      </div>

      <div className="admin-card">
        <div className="admin-card-title">🎨 Nombre, slogan y colores</div>

        <div className="form-group">
          <label className="form-label">Nombre del local</label>
          <input 
            className="form-input" 
            value={form.business_name}
            onChange={e => setForm({ ...form, business_name: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Slogan / subtítulo</label>
          <input 
            className="form-input" 
            value={form.slogan}
            onChange={e => setForm({ ...form, slogan: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Color primario</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input 
              type="color" 
              value={form.color_primary}
              onChange={e => setForm({ ...form, color_primary: e.target.value })}
              style={{ width: 60, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer' }}
            />
            <span style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{form.color_primary}</span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Color secundario</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input 
              type="color" 
              value={form.color_secondary}
              onChange={e => setForm({ ...form, color_secondary: e.target.value })}
              style={{ width: 60, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer' }}
            />
            <span style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{form.color_secondary}</span>
          </div>
        </div>

        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ash)', marginBottom: 4 }}>Vista previa del gradiente</div>
          <div 
            className="color-preview" 
            style={{ background: `linear-gradient(90deg, ${form.color_primary}, ${form.color_secondary})` }}
          />
        </div>

        <button 
          className="btn btn-primary" 
          style={{ marginTop: 20 }}
          onClick={saveAppearance}
          disabled={saving}
        >
          {saving ? <><span className="spinner" /> Guardando...</> : '💾 Guardar apariencia'}
        </button>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

// ============================================
// TAB: CONFIGURACIÓN
// ============================================
function ConfigTab() {
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

// ============================================
// COMPONENTE: ADMIN PANEL
// ============================================
function AdminPanel({ cfg, onCfgUpdated, onLogout, user }) {
  const [activeTab, setActiveTab] = useState('clients')

  const tabs = [
    { id: 'clients', label: '👥 Clientes' },
    { id: 'stats', label: '📊 Stats' },
    { id: 'menu', label: '🍗 Menú' },
    { id: 'socials', label: '📱 Redes' },
    { id: 'appearance', label: '🎨 Apariencia' },
    { id: 'config', label: '⚙️ Config' }
  ]

  const renderTab = () => {
    switch (activeTab) {
      case 'clients': return <ClientsTab />
      case 'stats': return <StatsTab />
      case 'menu': return <MenuTab />
      case 'socials': return <SocialsTab />
      case 'appearance': return <AppearanceTab cfg={cfg} onCfgUpdated={onCfgUpdated} />
      case 'config': return <ConfigTab />
      default: return <ClientsTab />
    }
  }

  return (
    <div className="admin-bg">
      <div className="admin-header">
        <div>
          <div className="admin-header-title">{cfg.business_name}</div>
          {user && (
            <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: 4 }}>
              👤 {user.email}
            </div>
          )}
        </div>
        <button className="admin-logout" onClick={onLogout}>
          Salir
        </button>
      </div>

      <div className="admin-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`admin-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="admin-content">
        {renderTab()}
      </div>
    </div>
  )
}

// ============================================
// APP ROOT
// ============================================
export default function App() {
  const [view, setView] = useState('portal')
  const [registeredName, setRegisteredName] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminLoggedIn, setAdminLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const { cfg, setCfg, loading: cfgLoading } = useConfig()

  useEffect(() => {
    // Verificar si hay token guardado al cargar
    const token = adminApi.getToken()
    if (token) {
      setAdminLoggedIn(true)
      setView('admin')
    }
    
    const adminParam = window.location.search.includes('admin')
    setIsAdmin(adminParam)
    if (adminParam && !token) {
      setView('admin-login')
    }
  }, [])

  const handleRegister = (name) => {
    setRegisteredName(name)
    setView('success')
  }

  const handleAdminLogin = (user, token) => {
    setCurrentUser(user)
    setAdminLoggedIn(true)
    setView('admin')
  }

  const handleLogout = () => {
    adminApi.logout()
    setCurrentUser(null)
    setAdminLoggedIn(false)
    setView('admin-login')
  }

  const handleCfgUpdated = (newCfg) => {
    setCfg(newCfg)
  }

  if (cfgLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--smoke)',
        color: 'var(--cream)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 60, marginBottom: 20 }}>🐓</div>
          <div style={{ fontFamily: 'Lobster', fontSize: '1.5rem' }}>Cargando...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      {view === 'portal' && <Portal cfg={cfg} onRegister={handleRegister} />}
      {view === 'success' && <SuccessScreen name={registeredName} cfg={cfg} />}
      {view === 'admin-login' && <AdminLogin onLogin={handleAdminLogin} />}
      {view === 'admin' && (
        <AdminPanel 
          cfg={cfg} 
          onCfgUpdated={handleCfgUpdated}
          onLogout={handleLogout}
          user={currentUser}
        />
      )}
    </div>
  )
}
