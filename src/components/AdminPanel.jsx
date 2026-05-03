import React, { useState, useCallback } from 'react'
import { ClientsTab } from './tabs/ClientsTab.jsx'
import { StatsTab } from './tabs/StatsTab.jsx'
import { MenuTab } from './tabs/MenuTab.jsx'
import { SocialsTab } from './tabs/SocialsTab.jsx'
import { AppearanceTab } from './tabs/AppearanceTab.jsx'
import { ConfigTab } from './tabs/ConfigTab.jsx'
import { useSessionTimeout } from '../hooks/useSessionTimeout'

export function AdminPanel({ cfg, onCfgUpdated, onLogout, user }) {
  const [activeTab, setActiveTab] = useState('clients')
  
  // Timeout de sesión: 30 minutos de inactividad
  const handleSessionTimeout = useCallback(() => {
    console.log('Cerrando sesión por timeout')
    onLogout()
  }, [onLogout])
  
  useSessionTimeout(30 * 60 * 1000, handleSessionTimeout)

  const tabs = [
    { id: 'clients', label: '👥 Clientes' },
    { id: 'stats', label: '📊 Stats' },
    { id: 'menu', label: '🍗 Menú' },
    { id: 'socials', label: '📱 Redes' },
    { id: 'appearance', label: '🎨 Apariencia' },
    { id: 'config', label: '⚙️ Config' }
  ]

  const renderTab = () => {
    switch (activeTab) {
      case 'clients': return <ClientsTab />
      case 'stats': return <StatsTab />
      case 'menu': return <MenuTab />
      case 'socials': return <SocialsTab />
      case 'appearance': return <AppearanceTab cfg={cfg} onCfgUpdated={onCfgUpdated} />
      case 'config': return <ConfigTab />
      default: return <ClientsTab />
    }
  }

  return (
    <div className="admin-bg">
      <div className="admin-header">
        <div>
          <div className="admin-header-title">{cfg.business_name}</div>
          {user && (
            <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: 4 }}>
              👤 {user.email}
            </div>
          )}
        </div>
        <button className="admin-logout" onClick={onLogout}>
          Salir
        </button>
      </div>

      <div className="admin-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`admin-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="admin-content">
        {renderTab()}
      </div>
    </div>
  )
}
