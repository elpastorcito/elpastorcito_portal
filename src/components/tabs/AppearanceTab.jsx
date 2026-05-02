import React, { useState, useEffect } from 'react'
import { adminApi } from '../../supabase.js'
import { useToast } from '../../hooks/useToast.js'

export function AppearanceTab({ cfg, onCfgUpdated }) {
  const [form, setForm] = useState({
    business_name: cfg.business_name,
    slogan: cfg.slogan,
    logo_url: cfg.logo_url,
    color_primary: cfg.color_primary,
    color_secondary: cfg.color_secondary
  })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast, showToast } = useToast()

  useEffect(() => {
    setForm({
      business_name: cfg.business_name,
      slogan: cfg.slogan,
      logo_url: cfg.logo_url,
      color_primary: cfg.color_primary,
      color_secondary: cfg.color_secondary
    })
  }, [cfg])

  async function handleLogoUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `logo/logo_principal.${ext}`
      const result = await adminApi.uploadImage(path, file)
      const urlWithCache = `${result.url}?v=${Date.now()}`
      setForm({ ...form, logo_url: urlWithCache })
      showToast('Logo subido')
    } catch (err) {
      showToast('Error al subir logo')
    } finally {
      setUploading(false)
    }
  }

  async function saveAppearance() {
    setSaving(true)
    try {
      const items = [
        { key: 'business_name', value: form.business_name },
        { key: 'slogan', value: form.slogan },
        { key: 'logo_url', value: form.logo_url },
        { key: 'color_primary', value: form.color_primary },
        { key: 'color_secondary', value: form.color_secondary }
      ]
      await adminApi.saveConfig(items)
      onCfgUpdated({ ...form })
      showToast('Apariencia guardada — se actualizará en el próximo acceso')
    } catch (e) {
      showToast('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="two-col">
      <div className="admin-card">
        <div className="admin-card-title">🖼️ Logo del local</div>

        <div style={{ 
          height: 140, 
          background: 'var(--light)', 
          borderRadius: 20, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginBottom: 16,
          overflow: 'hidden'
        }}>
          {form.logo_url ? (
            <img src={form.logo_url} alt="Logo" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
          ) : (
            <span style={{ fontSize: 60 }}>🐓</span>
          )}
        </div>

        <div className="upload-area" onClick={() => document.getElementById('logo-input').click()}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>📷</div>
          <div style={{ fontWeight: 700, color: 'var(--ash)' }}>
            {uploading ? 'Subiendo...' : 'Click para cambiar logo'}
          </div>
        </div>
        <input 
          id="logo-input" 
          type="file" 
          accept="image/*" 
          style={{ display: 'none' }}
          onChange={handleLogoUpload}
        />

        {form.logo_url && (
          <button 
            className="btn btn-danger btn-sm" 
            style={{ marginTop: 12, width: '100%' }}
            onClick={() => setForm({ ...form, logo_url: '' })}
          >
            🗑 Quitar logo (usar emoji)
          </button>
        )}
      </div>

      <div className="admin-card">
        <div className="admin-card-title">🎨 Nombre, slogan y colores</div>

        <div className="form-group">
          <label className="form-label">Nombre del local</label>
          <input 
            className="form-input" 
            value={form.business_name}
            onChange={e => setForm({ ...form, business_name: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Slogan / subtítulo</label>
          <input 
            className="form-input" 
            value={form.slogan}
            onChange={e => setForm({ ...form, slogan: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Color primario</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input 
              type="color" 
              value={form.color_primary}
              onChange={e => setForm({ ...form, color_primary: e.target.value })}
              style={{ width: 60, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer' }}
            />
            <span style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{form.color_primary}</span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Color secundario</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input 
              type="color" 
              value={form.color_secondary}
              onChange={e => setForm({ ...form, color_secondary: e.target.value })}
              style={{ width: 60, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer' }}
            />
            <span style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{form.color_secondary}</span>
          </div>
        </div>

        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ash)', marginBottom: 4 }}>Vista previa del gradiente</div>
          <div 
            className="color-preview" 
            style={{ background: `linear-gradient(90deg, ${form.color_primary}, ${form.color_secondary})` }}
          />
        </div>

        <button 
          className="btn btn-primary" 
          style={{ marginTop: 20 }}
          onClick={saveAppearance}
          disabled={saving}
        >
          {saving ? <><span className="spinner" /> Guardando...</> : '💾 Guardar apariencia'}
        </button>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
