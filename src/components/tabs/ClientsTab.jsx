import React, { useState, useEffect } from 'react'
import { adminApi } from '../../supabase.js'
import { fmtDate, exportCSV } from '../../utils/formatters.js'
import { useToast } from '../../hooks/useToast.js'

export function ClientsTab() {
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
