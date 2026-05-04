import React, { useState, useEffect } from 'react'
import { adminApi } from '../../supabase.js'
import { fmtDateShort } from '../../utils/formatters.js'
import { useToast } from '../../hooks/useToast.js'

export function StatsTab() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [chartType, setChartType] = useState('bar')
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
  const totalThisWeek = Object.values(grouped).reduce((a, b) => a + b, 0)
  const avgPerDay = Math.round(totalThisWeek / 7)

  const stats = {
    total: clients.length,
    withEmail: clients.filter(c => c.email).length,
    daysWithVisits,
    maxInDay,
    totalThisWeek,
    avgPerDay
  }

  const chartTypes = [
    { id: 'bar', label: 'Barras', icon: '📊' },
    { id: 'line', label: 'Línea', icon: '📈' },
    { id: 'area', label: 'Área', icon: '🏔️' }
  ]

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
        <div className="stat-card">
          <div className="stat-value">{stats.totalThisWeek}</div>
          <div className="stat-label">Esta semana</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.avgPerDay}</div>
          <div className="stat-label">Promedio/día</div>
        </div>
      </div>

      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div className="admin-card-title" style={{ margin: 0 }}>📊 Visitas últimos 7 días</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {chartTypes.map(type => (
              <button
                key={type.id}
                className={`chart-type-btn ${chartType === type.id ? 'active' : ''}`}
                onClick={() => setChartType(type.id)}
                title={type.label}
              >
                {type.icon}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="empty-state">Cargando...</div>
        ) : clients.length === 0 ? (
          <div className="empty-state">Sin datos aún — los clientes aparecerán aquí</div>
        ) : (
          <>
            {chartType === 'bar' && (
              <div className="chart-container">
                {chartData.map(d => (
                  <div key={d.date} className="chart-bar-wrapper">
                    <div className="chart-count">{d.count}</div>
                    <div 
                      className="chart-bar" 
                      style={{ height: `${Math.max((d.count / maxCount) * 120, 4)}px` }}
                    />
                    <div className="chart-date">{d.label}</div>
                  </div>
                ))}
              </div>
            )}
            
            {chartType === 'line' && (
              <div className="chart-container-line">
                <svg viewBox="0 0 400 150" className="chart-svg">
                  <line x1="0" y1="140" x2="400" y2="140" stroke="var(--light)" strokeWidth="1" opacity="0.3" />
                  <polyline
                    fill="none"
                    stroke="var(--p)"
                    strokeWidth="3"
                    points={chartData.map((d, i) => {
                      const x = (i / (chartData.length - 1)) * 380 + 10
                      const y = 140 - (d.count / maxCount) * 120
                      return `${x},${y}`
                    }).join(' ')}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {chartData.map((d, i) => {
                    const x = (i / (chartData.length - 1)) * 380 + 10
                    const y = 140 - (d.count / maxCount) * 120
                    return (
                      <g key={d.date}>
                        <circle cx={x} cy={y} r="5" fill="var(--p)" />
                        <circle cx={x} cy={y} r="3" fill="white" />
                        <text x={x} y="165" textAnchor="middle" fontSize="10" fill="var(--ash)">
                          {d.label}
                        </text>
                        <text x={x} y={y - 10} textAnchor="middle" fontSize="11" fontWeight="bold" fill="var(--p)">
                          {d.count}
                        </text>
                      </g>
                    )
                  })}
                </svg>
              </div>
            )}
            
            {chartType === 'area' && (
              <div className="chart-container-line">
                <svg viewBox="0 0 400 150" className="chart-svg">
                  <defs>
                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="var(--p)" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="var(--p)" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>
                  <polygon
                    fill="url(#areaGradient)"
                    points={`10,140 ${chartData.map((d, i) => {
                      const x = (i / (chartData.length - 1)) * 380 + 10
                      const y = 140 - (d.count / maxCount) * 120
                      return `${x},${y}`
                    }).join(' ')} ${380 + 10},140`}
                  />
                  <polyline
                    fill="none"
                    stroke="var(--p)"
                    strokeWidth="3"
                    points={chartData.map((d, i) => {
                      const x = (i / (chartData.length - 1)) * 380 + 10
                      const y = 140 - (d.count / maxCount) * 120
                      return `${x},${y}`
                    }).join(' ')}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {chartData.map((d, i) => {
                    const x = (i / (chartData.length - 1)) * 380 + 10
                    const y = 140 - (d.count / maxCount) * 120
                    return (
                      <g key={d.date}>
                        <circle cx={x} cy={y} r="5" fill="var(--p)" />
                        <circle cx={x} cy={y} r="3" fill="white" />
                        <text x={x} y="165" textAnchor="middle" fontSize="10" fill="var(--ash)">
                          {d.label}
                        </text>
                        <text x={x} y={y - 10} textAnchor="middle" fontSize="11" fontWeight="bold" fill="var(--p)">
                          {d.count}
                        </text>
                      </g>
                    )
                  })}
                </svg>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
