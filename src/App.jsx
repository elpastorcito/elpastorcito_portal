import React, { useState, useEffect } from 'react'
import { supabase, adminApi } from './supabase.js'
import { useConfig } from './hooks/useConfig.js'
import { Flames } from './components/Flames'
import { TermsModal } from './components/TermsModal'
import { Portal } from './components/Portal'
import { SuccessScreen } from './components/SuccessScreen'
import { AdminLogin } from './components/AdminLogin'
import { AdminPanel } from './components/AdminPanel'

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

  // Efecto para actualizar los favicons dinámicamente cuando cambia la configuración
  useEffect(() => {
    // Eliminar favicons anteriores
    const existingFavicons = document.querySelectorAll('link[rel*="icon"]')
    existingFavicons.forEach(link => {
      if (link.getAttribute('href') !== 'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'><text y=\'.9em\' font-size=\'90\'>🐓</text></svg>') {
        link.remove()
      }
    })

    // Agregar nuevos favicons desde la configuración
    const faviconSizes = [
      { size: 16, rel: 'icon' },
      { size: 32, rel: 'icon' },
      { size: 48, rel: 'icon' },
      { size: 64, rel: 'icon' },
      { size: 128, rel: 'icon' },
      { size: 192, rel: 'apple-touch-icon' },
      { size: 512, rel: 'apple-touch-icon' }
    ]

    faviconSizes.forEach(({ size, rel }) => {
      const url = cfg[`favicon_${size}`]
      if (url) {
        const link = document.createElement('link')
        link.rel = rel
        link.sizes = `${size}x${size}`
        link.href = url
        document.head.appendChild(link)
      }
    })

    // Si no hay favicons configurados, usar el emoji por defecto
    if (!cfg.favicon_16 && !cfg.favicon_32 && !cfg.favicon_48 && !cfg.favicon_64 && !cfg.favicon_128 && !cfg.favicon_192 && !cfg.favicon_512) {
      const defaultLink = document.querySelector('link[rel="icon"][href*="svg+xml"]')
      if (!defaultLink) {
        const link = document.createElement('link')
        link.rel = 'icon'
        link.href = 'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'><text y=\'.9em\' font-size=\'90\'>🐓</text></svg>'
        document.head.appendChild(link)
      }
    }
  }, [cfg])

  useEffect(() => {
    // Verificar sesión al cargar - ahora con cookies HTTP-only no hay token en JS
    // La verificación se hace automáticamente en las solicitudes al backend
    const checkSession = async () => {
      try {
        // Intentar obtener config para verificar si la sesión es válida
        const config = await adminApi.getConfigAll()
        if (config && !config.error) {
          setAdminLoggedIn(true)
          setView('admin')
        }
      } catch (err) {
        // Sesión inválida o expirada
        console.log('No hay sesión activa')
      }
    }
    
    checkSession()
    
    const adminParam = window.location.search.includes('admin')
    setIsAdmin(adminParam)
    if (adminParam && !adminLoggedIn) {
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
