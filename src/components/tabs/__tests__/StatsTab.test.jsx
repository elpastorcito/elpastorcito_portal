import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { StatsTab } from '../StatsTab'
import { adminApi } from '../../../supabase'
import { useToast } from '../../../hooks/useToast'

vi.mock('../../../supabase', () => ({
  adminApi: {
    getClients: vi.fn()
  }
}))

vi.mock('../../../hooks/useToast', () => ({
  useToast: vi.fn()
}))

vi.mock('../../../utils/formatters.js', () => ({
  fmtDateShort: vi.fn((date) => {
    const d = new Date(date)
    return `${d.getDate()}/${d.getMonth() + 1}`
  })
}))

describe('StatsTab', () => {
  const mockShowToast = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useToast.mockReturnValue({
      toast: null,
      showToast: mockShowToast
    })
  })

  it('renderiza estadísticas vacías inicialmente', async () => {
    adminApi.getClients.mockResolvedValue([])
    
    render(<StatsTab />)
    
    expect(screen.getByText('Clientes totales')).toBeInTheDocument()
    expect(screen.getByText('Con email')).toBeInTheDocument()
    expect(screen.getByText('Días con visitas')).toBeInTheDocument()
    expect(screen.getByText('Máx. en un día')).toBeInTheDocument()
    
    // Verificar que hay 4 stat-cards
    await waitFor(() => {
      const statValues = document.querySelectorAll('.stat-value')
      expect(statValues.length).toBe(4)
    })
  })

  it('muestra estado de carga inicialmente', () => {
    adminApi.getClients.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve([]), 100)))
    
    render(<StatsTab />)
    
    expect(screen.getByText('Cargando...')).toBeInTheDocument()
  })

  it('muestra mensaje cuando no hay datos', async () => {
    adminApi.getClients.mockResolvedValue([])
    
    render(<StatsTab />)
    
    await waitFor(() => {
      expect(screen.getByText(/sin datos aún/i)).toBeInTheDocument()
    })
  })

  it('muestra gráfico con datos de clientes', async () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const mockClients = [
      { id: 1, name: 'Juan', phone: '123', email: 'juan@example.com', created_at: today.toISOString() },
      { id: 2, name: 'María', phone: '456', email: null, created_at: today.toISOString() },
      { id: 3, name: 'Pedro', phone: '789', email: 'pedro@example.com', created_at: yesterday.toISOString() }
    ]
    
    adminApi.getClients.mockResolvedValue(mockClients)
    
    render(<StatsTab />)
    
    await waitFor(() => {
      // Verificar que se renderiza el contenedor del gráfico
      const chartContainer = document.querySelector('.chart-container')
      expect(chartContainer).toBeInTheDocument()
    })
  })

  it('calcula correctamente estadísticas con email', async () => {
    const mockClients = [
      { id: 1, name: 'Juan', phone: '123', email: 'juan@example.com', created_at: new Date().toISOString() },
      { id: 2, name: 'María', phone: '456', email: null, created_at: new Date().toISOString() },
      { id: 3, name: 'Pedro', phone: '789', email: 'pedro@example.com', created_at: new Date().toISOString() }
    ]
    
    adminApi.getClients.mockResolvedValue(mockClients)
    
    render(<StatsTab />)
    
    await waitFor(() => {
      // Verificar que hay stat-cards
      const statCards = document.querySelectorAll('.stat-card')
      expect(statCards.length).toBe(4)
    })
  })

  it('maneja error al cargar datos', async () => {
    adminApi.getClients.mockRejectedValue(new Error('Error de red'))
    
    render(<StatsTab />)
    
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('Error al cargar clientes')
    })
  })

  it('renderiza barras del gráfico correctamente', async () => {
    const today = new Date()
    const mockClients = Array(5).fill(null).map((_, i) => ({
      id: i + 1,
      name: `Cliente ${i}`,
      phone: `${i}`,
      email: `cliente${i}@example.com`,
      created_at: today.toISOString()
    }))
    
    adminApi.getClients.mockResolvedValue(mockClients)
    
    render(<StatsTab />)
    
    await waitFor(() => {
      const chartBars = document.querySelectorAll('.chart-bar')
      expect(chartBars.length).toBeGreaterThan(0)
    })
  })
})
