import React, { useState, useEffect } from 'react'
import { adminApi } from '../../supabase.js'
import { fmtDateShort } from '../../utils/formatters.js'
import { useToast } from '../../hooks/useToast.js'

export function StatsTab() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

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
