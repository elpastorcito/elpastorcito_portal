import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase.js'
import { SocialIcon } from './SocialIcon'
import { Flames } from './Flames'
import { fmtPrice, getFirstName } from '../utils/formatters'

// ============================================
// COMPONENTE: SUCCESS SCREEN
// ============================================
export function SuccessScreen({ name, cfg }) {
  const [menu, setMenu] = useState([])
  const [socials, setSocials] = useState([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const firstName = getFirstName(name)
  
  useEffect(() => {
    loadData()
  }, [])

  // Carrusel automático
  useEffect(() => {
    if (menu.length <= 1) return
    
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % menu.length)
    }, 3500) // Cambia cada 3.5 segundos
    
    return () => clearInterval(interval)
  }, [menu.length])
  
  async function loadData() {
    try {
      const [{ data: menuData }, { data: socialsData }] = await Promise.all([
        supabase.from('menu_items').select('*').eq('available', true).order('created_at', { ascending: false }),
        supabase.from('social_networks').select('*').eq('active', true).neq('url', '').order('sort_order')
      ])
      if (menuData) setMenu(menuData)
      if (socialsData) setSocials(socialsData)
    } catch (e) {
      // Log error en desarrollo para debugging
      if (import.meta.env.DEV) {
        console.warn('Error loading data in SuccessScreen:', e.message)
      }
    }
  }

  const goToSlide = (index) => {
    setCurrentSlide(index)
  }

  return (
    <div className="portal-bg">
      <Flames />
      <div className="portal-content">
        <div className="success-container anim-pop-in">
          <div className="success-emoji anim-bounce">🎉</div>
          <h1 className="success-title">¡Bienvenido, {firstName}!</h1>
          <p className="success-desc">
            Ya estás conectado al WiFi de <strong>{cfg.business_name}</strong>.<br/>
            ¡Disfrutá de tu estadía!
          </p>

          <div className="wifi-info">
            <div className="wifi-info-title">📶 Conexión exitosa</div>
            <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>
              Podés navegar libremente por internet.
            </p>
          </div>

          {menu.length > 0 && (
            <>
              <h3 style={{ marginBottom: 12, color: 'var(--light)' }}>
                🍗 Nuestro menú
              </h3>
              
              {/* Carrusel automático */}
              <div className="menu-carousel-container">
                <div 
                  className="menu-carousel-track"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {menu.map(item => (
                    <div 
                      key={item.id} 
                      className="menu-card"
                      style={{ 
                        minWidth: '100%', 
                        flexShrink: 0,
                        transition: 'transform 0.5s ease-in-out'
                      }}
                    >
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="menu-card-img" />
                      ) : (
                        <div className="menu-card-img">🍗</div>
                      )}
                      <div className="menu-card-body">
                        <div className="menu-card-name">{item.name}</div>
                        <div className="menu-card-price">{fmtPrice(item.price)}</div>
                        {item.description && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--ash)', marginTop: 6, lineHeight: 1.4 }}>
                            {item.description.length > 80 
                              ? item.description.substring(0, 80) + '...' 
                              : item.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Indicadores (dots) */}
                {menu.length > 1 && (
                  <div className="menu-carousel-dots">
                    {menu.map((_, index) => (
                      <button
                        key={index}
                        className={`menu-carousel-dot ${index === currentSlide ? 'active' : ''}`}
                        onClick={() => goToSlide(index)}
                        aria-label={`Ir al producto ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {socials.length > 0 && (
            <div className="socials-row">
              {socials.map(s => (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn"
                  style={{ background: s.color }}
                >
                  <SocialIcon id={s.id} size={18} />
                  {s.name}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
