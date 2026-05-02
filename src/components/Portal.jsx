import React, { useState } from 'react'
import { SocialIcon } from './SocialIcon'
import { Flames } from './Flames'
import { TermsModal } from './TermsModal'
import { fmtPrice, getFirstName } from '../utils/formatters'

// ============================================
// COMPONENTE: PORTAL
// ============================================
export function Portal({ cfg, onRegister }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', terms: false })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [submitError, setSubmitError] = useState('')
  
  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Ingresá tu nombre'
    if (!/^\d{8,15}$/.test(form.phone.replace(/\s/g, ''))) {
      errs.phone = 'Teléfono inválido (solo números, 8-15 dígitos)'
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Email inválido'
    }
    if (!form.terms) errs.terms = 'Debés aceptar los términos'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    if (!validate()) return

    setLoading(true)
    try {
      const { error } = await supabase.from('clients').insert({
        name: form.name.trim(),
        phone: form.phone.replace(/\s/g, ''),
        email: form.email.trim() || null,
        accepted_terms: true
      })

      if (error) throw error
      onRegister(form.name.trim())
    } catch (err) {
      setSubmitError('Error al registrarse. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="portal-bg">
      <Flames />
      <div className="portal-content anim-slide-up">
        <div className="logo-circle">
          {cfg.logo_url ? (
            <img src={cfg.logo_url} alt="Logo" />
          ) : (
            <span>🐓</span>
          )}
        </div>

        <h1 className="business-name">{cfg.business_name}</h1>
        <p className="slogan">{cfg.slogan}</p>

        <div className="wifi-badge">
          📶 Conectate gratis al WiFi del local
        </div>

        <div className="card">
          {submitError && (
            <div className="error-text" style={{ marginBottom: 16, textAlign: 'center' }}>
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Nombre completo *</label>
              <input
                type="text"
                className={`form-input ${errors.name ? 'error' : ''}`}
                placeholder="Tu nombre"
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
              />
              {errors.name && <div className="error-text">{errors.name}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Teléfono *</label>
              <input
                type="tel"
                className={`form-input ${errors.phone ? 'error' : ''}`}
                placeholder="Ej: 1123456789"
                value={form.phone}
                onChange={e => setForm({...form, phone: e.target.value})}
              />
              {errors.phone && <div className="error-text">{errors.phone}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="tu@email.com (opcional)"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
              />
              {errors.email && <div className="error-text">{errors.email}</div>}
            </div>

            <div className="checkbox-row">
              <input
                type="checkbox"
                id="terms"
                checked={form.terms}
                onChange={e => setForm({...form, terms: e.target.checked})}
              />
              <label htmlFor="terms">
                Acepto los <a onClick={() => setShowTerms(true)}>Términos y Condiciones</a> de uso del WiFi
              </label>
            </div>
            {errors.terms && <div className="error-text" style={{ marginTop: -8, marginBottom: 12 }}>{errors.terms}</div>}

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <><span className="spinner" /> Registrando...</>
              ) : (
                <>🔥 ¡Conectarme al WiFi!</>
              )}
            </button>
          </form>
        </div>
      </div>

      {showTerms && (
        <TermsModal businessName={cfg.business_name} onClose={() => setShowTerms(false)} />
      )}
    </div>
  )
}
