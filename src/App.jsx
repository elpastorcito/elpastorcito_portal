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
