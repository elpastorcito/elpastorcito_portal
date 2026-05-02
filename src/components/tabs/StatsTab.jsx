import React, { useState, useEffect } from 'react'
import { adminApi } from '../supabase.js'
import { useToast } from '../hooks/useToast'

// ============================================
// TAB: ESTADISTICAS
// ============================================
export function StatsTab() {
  const [stats, setStats] = useState({
    totalClients: 0,
    clientsToday: 0,
    clientsThisWeek: 0,
    clientsThisMonth: 0,
    menuItems: 0,
    socialNetworks: 0
  })
  const [loading, setLoading] = useState(true)
  const { toast, showToast } = useToast()

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      const [clientsData, menuData, socialsData] = await Promise.all([
        adminApi.getClients(),
        adminApi.getMenuItems(),
        adminApi.getSocialNetworks()
      ])

      const now = new Date()
      const today = now.toISOString().slice(0, 10)
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

      const clientsToday = clientsData.filter(c => c.created_at.slice(0, 10) === today).length
      const clientsThisWeek = clientsData.filter(c => c.created_at.slice(0, 10) >= weekAgo).length
      const clientsThisMonth = clientsData.filter(c => c.created_at.slice(0, 10) >= monthAgo).length

      setStats({
        totalClients: clientsData.length,
        clientsToday,
        clientsThisWeek,
        clientsThisMonth,
        menuItems: menuData.length,
        socialNetworks: socialsData.length
      })
    } catch (e) {
      showToast('Error al cargar estadísticas')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="empty-state">Cargando estadísticas...</div>
  }

  return (
    <div>
      <h3 style={{ marginBottom: 16, color: 'var(--light)' }}>📊 Resumen General</h3>
      
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-value">{stats.totalClients}</div>
          <div className="stat-label">Total Clientes</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.clientsToday}</div>
          <div className="stat-label">Hoy</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.clientsThisWeek}</div>
          <div className="stat-label">Esta Semana</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.clientsThisMonth}</div>
          <div className="stat-label">Este Mes</div>
        </div>
      </div>

      <div className="admin-card">
        <h4 style={{ marginBottom: 12, color: 'var(--cream)' }}>📈 Contenido</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          <div className="stat-card" style={{ padding: 16 }}>
            <div className="stat-value" style={{ fontSize: '1.5rem' }}>{stats.menuItems}</div>
            <div className="stat-label">Productos en Menú</div>
          </div>
          <div className="stat-card" style={{ padding: 16 }}>
            <div className="stat-value" style={{ fontSize: '1.5rem' }}>{stats.socialNetworks}</div>
            <div className="stat-label">Redes Sociales</div>
          </div>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
