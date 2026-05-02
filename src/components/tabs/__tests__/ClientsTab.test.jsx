import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { ClientsTab } from '../ClientsTab'
import { adminApi } from '../../../supabase'
import { useToast } from '../../../hooks/useToast'

// Mock de dependencias
vi.mock('../../../supabase', () => ({
  adminApi: {
    getClients: vi.fn()
  }
}))

vi.mock('../../../hooks/useToast', () => ({
  useToast: vi.fn()
}))

vi.mock('../../../utils/formatters.js', () => ({
  fmtDate: vi.fn((date) => new Date(date).toLocaleDateString()),
  exportCSV: vi.fn()
}))

describe('ClientsTab', () => {
  const mockShowToast = vi.fn()
  const mockToast = null

  beforeEach(() => {
    vi.clearAllMocks()
    useToast.mockReturnValue({
      toast: mockToast,
      showToast: mockShowToast
    })
  })

  it('renderiza estadísticas vacías inicialmente', async () => {
    adminApi.getClients.mockResolvedValue([])
    
    render(<ClientsTab />)
    
    expect(screen.getByText('Total')).toBeInTheDocument()
    expect(screen.getByText('Hoy')).toBeInTheDocument()
    expect(screen.getByText('Con email')).toBeInTheDocument()
    expect(screen.getByText('Prom/día')).toBeInTheDocument()
    
    // Verificar que hay 4 stat-cards con valor 0
    await waitFor(() => {
      const statValues = document.querySelectorAll('.stat-value')
      expect(statValues.length).toBe(4)
    })
  })

  it('muestra estado de carga inicialmente', () => {
    adminApi.getClients.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve([]), 100)))
    
    render(<ClientsTab />)
    
    expect(screen.getByText('Cargando...')).toBeInTheDocument()
  })

  it('muestra clientes en la tabla', async () => {
    const mockClients = [
      { id: 1, name: 'Juan Pérez', phone: '123456789', email: 'juan@example.com', created_at: '2024-01-15T10:00:00Z' },
      { id: 2, name: 'María García', phone: '987654321', email: null, created_at: '2024-01-15T11:00:00Z' }
    ]
    
    adminApi.getClients.mockResolvedValue(mockClients)
    
    render(<ClientsTab />)
    
    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
      expect(screen.getByText('María García')).toBeInTheDocument()
      expect(screen.getByText('123456789')).toBeInTheDocument()
    })
  })

  it('filtra clientes por nombre', async () => {
    const mockClients = [
      { id: 1, name: 'Juan Pérez', phone: '123456789', email: 'juan@example.com', created_at: '2024-01-15T10:00:00Z' },
      { id: 2, name: 'María García', phone: '987654321', email: 'maria@example.com', created_at: '2024-01-15T11:00:00Z' }
    ]
    
    adminApi.getClients.mockResolvedValue(mockClients)
    
    render(<ClientsTab />)
    
    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })
    
    const searchInput = screen.getByPlaceholderText(/buscar por nombre/i)
    fireEvent.change(searchInput, { target: { value: 'Juan' } })
    
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    expect(screen.queryByText('María García')).not.toBeInTheDocument()
  })

  it('muestra mensaje cuando no hay resultados', async () => {
    adminApi.getClients.mockResolvedValue([
      { id: 1, name: 'Juan Pérez', phone: '123456789', email: 'juan@example.com', created_at: '2024-01-15T10:00:00Z' }
    ])
    
    render(<ClientsTab />)
    
    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })
    
    const searchInput = screen.getByPlaceholderText(/buscar por nombre/i)
    fireEvent.change(searchInput, { target: { value: 'NoExiste' } })
    
    expect(screen.getByText('No se encontraron clientes')).toBeInTheDocument()
  })

  it('maneja error al cargar clientes', async () => {
    adminApi.getClients.mockRejectedValue(new Error('Error de red'))
    
    render(<ClientsTab />)
    
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('Error al cargar clientes')
    })
  })

  it('exporta CSV al hacer click en el botón', async () => {
    const { exportCSV } = await import('../../../utils/formatters.js')
    const mockClients = [
      { id: 1, name: 'Juan Pérez', phone: '123456789', email: 'juan@example.com', created_at: '2024-01-15T10:00:00Z' }
    ]
    
    adminApi.getClients.mockResolvedValue(mockClients)
    
    render(<ClientsTab />)
    
    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })
    
    const exportButton = screen.getByText(/exportar csv/i)
    fireEvent.click(exportButton)
    
    expect(exportCSV).toHaveBeenCalled()
  })
})
