import { describe, it, expect } from 'vitest'
import { 
  fmtPrice, 
  fmtDate, 
  fmtDateShort, 
  genSlug, 
  getFirstName, 
  exportCSV 
} from '../formatters'

describe('formatters', () => {
  describe('fmtPrice', () => {
    it('formatea precios correctamente', () => {
      expect(fmtPrice(1000)).toBe('$1.000')
      expect(fmtPrice(1500.50)).toBe('$1.500,5')
      expect(fmtPrice(0)).toBe('$0')
      expect(fmtPrice('2000')).toBe('$2.000')
    })

    it('maneja números grandes', () => {
      expect(fmtPrice(1000000)).toBe('$1.000.000')
      expect(fmtPrice(1234567.89)).toBe('$1.234.567,89')
    })
  })

  describe('fmtDate', () => {
    it('formatea fechas en formato es-AR', () => {
      const date = '2024-01-15T10:30:00Z'
      const result = fmtDate(date)
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4},? \d{2}:\d{2}/)
    })

    it('maneja objetos Date', () => {
      const date = new Date('2024-06-20T15:45:00Z')
      const result = fmtDate(date)
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })
  })

  describe('fmtDateShort', () => {
    it('formatea fechas cortas (día/mes)', () => {
      const date = '2024-01-15'
      const result = fmtDateShort(date)
      expect(result).toMatch(/\d{1,2}\/\d{1,2}/)
    })

    it('omite el año y la hora', () => {
      const date = '2024-12-25T20:00:00Z'
      const result = fmtDateShort(date)
      expect(result).not.toContain('2024')
      expect(result).not.toContain(':')
    })
  })

  describe('genSlug', () => {
    it('genera un string aleatorio', () => {
      const slug = genSlug()
      expect(typeof slug).toBe('string')
      expect(slug.length).toBeGreaterThan(0)
    })

    it('genera slugs únicos', () => {
      const slugs = new Set()
      for (let i = 0; i < 100; i++) {
        slugs.add(genSlug())
      }
      // Debería generar al menos 90 únicos de 100 intentos
      expect(slugs.size).toBeGreaterThan(90)
    })

    it('limita la longitud del slug', () => {
      const slug = genSlug()
      expect(slug.length).toBeLessThanOrEqual(10)
    })
  })

  describe('getFirstName', () => {
    it('extrae el primer nombre', () => {
      expect(getFirstName('Juan Pérez')).toBe('Juan')
      expect(getFirstName('María García López')).toBe('María')
    })

    it('maneja nombres con espacios extra', () => {
      expect(getFirstName('  Carlos  ')).toBe('Carlos')
      expect(getFirstName('  Ana  María  ')).toBe('Ana')
    })

    it('maneja un solo nombre', () => {
      expect(getFirstName('Pedro')).toBe('Pedro')
    })

    it('maneja string vacío', () => {
      expect(getFirstName('')).toBe('')
    })
  })

  describe('exportCSV', () => {
    it('exporta clientes a CSV sin errores', () => {
      const mockClients = [
        { name: 'Juan Pérez', phone: '123456789', email: 'juan@example.com', created_at: '2024-01-15T10:00:00Z' },
        { name: 'María García', phone: '987654321', email: null, created_at: '2024-01-16T11:00:00Z' }
      ]

      // Mock de createElement y click
      const mockClick = vi.fn()
      const mockCreateElement = vi.fn(() => ({
        href: '',
        download: '',
        click: mockClick
      }))
      
      const originalCreateElement = document.createElement
      document.createElement = mockCreateElement
      
      expect(() => exportCSV(mockClients)).not.toThrow()
      expect(mockCreateElement).toHaveBeenCalledWith('a')
      expect(mockClick).toHaveBeenCalled()
      
      // Restaurar
      document.createElement = originalCreateElement
    })

    it('genera CSV con header correcto', () => {
      const mockClients = [
        { name: 'Test', phone: '123', email: 'test@test.com', created_at: '2024-01-15T10:00:00Z' }
      ]

      const mockClick = vi.fn()
      const mockCreateElement = vi.fn(() => ({
        href: '',
        download: '',
        click: mockClick
      }))
      
      const originalCreateElement = document.createElement
      document.createElement = mockCreateElement
      
      exportCSV(mockClients)
      
      // Verificar que se llamó con los argumentos correctos
      expect(mockCreateElement).toHaveBeenCalledWith('a')
      
      document.createElement = originalCreateElement
    })

    it('maneja clientes sin email', () => {
      const mockClients = [
        { name: 'Sin Email', phone: '123456789', email: null, created_at: '2024-01-15T10:00:00Z' },
        { name: 'Con Email', phone: '987654321', email: 'con@email.com', created_at: '2024-01-16T11:00:00Z' }
      ]

      const mockClick = vi.fn()
      const mockCreateElement = vi.fn(() => ({
        href: '',
        download: '',
        click: mockClick
      }))
      
      const originalCreateElement = document.createElement
      document.createElement = mockCreateElement
      
      expect(() => exportCSV(mockClients)).not.toThrow()
      
      document.createElement = originalCreateElement
    })

    it('genera nombre de archivo con fecha actual', () => {
      const mockClients = [{ name: 'Test', phone: '123', email: 'test@test.com', created_at: '2024-01-15T10:00:00Z' }]

      let mockDownloadValue = ''
      const mockCreateElement = vi.fn(() => ({
        href: '',
        set download(value) {
          mockDownloadValue = value
        },
        get download() {
          return mockDownloadValue
        },
        click: vi.fn()
      }))
      
      const originalCreateElement = document.createElement
      document.createElement = mockCreateElement
      
      exportCSV(mockClients)
      
      // El nombre debería contener "clientes_pastorcito_" y una fecha
      expect(mockCreateElement).toHaveBeenCalledWith('a')
      expect(mockDownloadValue).toContain('clientes_pastorcito_')
      
      document.createElement = originalCreateElement
    })
  })
})
