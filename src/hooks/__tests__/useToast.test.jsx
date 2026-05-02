import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useToast } from '../useToast'

describe('useToast', () => {
  it('inicializa con toast null', () => {
    const { result } = renderHook(() => useToast())
    
    expect(result.current.toast).toBeNull()
    expect(result.current.showToast).toBeDefined()
  })

  it('muestra un mensaje de toast', () => {
    const { result } = renderHook(() => useToast())
    
    act(() => {
      result.current.showToast('Mensaje de prueba')
    })
    
    expect(result.current.toast).toBe('Mensaje de prueba')
  })

  it('limpia el toast después de 3 segundos', async () => {
    vi.useFakeTimers()
    
    const { result } = renderHook(() => useToast())
    
    act(() => {
      result.current.showToast('Mensaje temporal')
    })
    
    expect(result.current.toast).toBe('Mensaje temporal')
    
    // Avanzar 2.9 segundos - aún debería estar visible
    act(() => {
      vi.advanceTimersByTime(2900)
    })
    
    expect(result.current.toast).toBe('Mensaje temporal')
    
    // Avanzar 100ms más (total 3s) - debería desaparecer
    act(() => {
      vi.advanceTimersByTime(100)
    })
    
    expect(result.current.toast).toBeNull()
    
    vi.useRealTimers()
  })

  it('puede mostrar múltiples mensajes secuencialmente', () => {
    const { result } = renderHook(() => useToast())
    
    act(() => {
      result.current.showToast('Primer mensaje')
    })
    expect(result.current.toast).toBe('Primer mensaje')
    
    act(() => {
      result.current.showToast('Segundo mensaje')
    })
    expect(result.current.toast).toBe('Segundo mensaje')
  })

  it('acepta diferentes tipos de mensajes', () => {
    const { result } = renderHook(() => useToast())
    
    const mensajes = [
      'Éxito: Operación completada',
      'Error: Algo salió mal',
      'Info: Nueva actualización disponible',
      'Advertencia: Revisa tu conexión'
    ]
    
    mensajes.forEach(mensaje => {
      act(() => {
        result.current.showToast(mensaje)
      })
      expect(result.current.toast).toBe(mensaje)
    })
  })
})
