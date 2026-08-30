import React, { useState, useEffect } from 'react'
import { adminApi } from '../../supabase.js'
import { useToast } from '../../hooks/useToast.js'

export function AppearanceTab({ cfg, onCfgUpdated }) {
  const [form, setForm] = useState({
    business_name: cfg.business_name,
    slogan: cfg.slogan,
    logo_url: cfg.logo_url,
    color_primary: cfg.color_primary,
    color_secondary: cfg.color_secondary,
    favicon_16: cfg.favicon_16 || '',
    favicon_32: cfg.favicon_32 || '',
    favicon_48: cfg.favicon_48 || '',
    favicon_64: cfg.favicon_64 || '',
    favicon_128: cfg.favicon_128 || '',
    favicon_192: cfg.favicon_192 || '',
    favicon_512: cfg.favicon_512 || ''
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
      color_secondary: cfg.color_secondary,
      favicon_16: cfg.favicon_16 || '',
      favicon_32: cfg.favicon_32 || '',
      favicon_48: cfg.favicon_48 || '',
      favicon_64: cfg.favicon_64 || '',
      favicon_128: cfg.favicon_128 || '',
      favicon_192: cfg.favicon_192 || '',
      favicon_512: cfg.favicon_512 || ''
    })
  }, [cfg])

  async function handleLogoUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      // Obtener extensión del archivo
      const ext = file.name.split('.').pop().toLowerCase()
      // Usar nombre fijo para el logo principal
      const safeName = `logo_principal.${ext}`
      const path = `logos/${safeName}`
      const result = await adminApi.uploadImage(path, file)
      const urlWithCache = `${result.url}?v=${Date.now()}`
      setForm({ ...form, logo_url: urlWithCache })
      showToast('Logo subido')
    } catch (err) {
      console.error('Error uploading logo:', err)
      showToast('Error al subir logo: ' + (err.message || 'Verifica el nombre del archivo'))
    } finally {
      setUploading(false)
    }
  }

  async function handleFaviconUpload(e, size) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      // Obtener extensión del archivo
      const ext = file.name.split('.').pop().toLowerCase()
      // Usar nombre fijo basado en el tamaño del favicon
      const safeName = `favicon_${size}x${size}.${ext}`
      const path = `favicons/${safeName}`
      const result = await adminApi.uploadImage(path, file)
      const urlWithCache = `${result.url}?v=${Date.now()}`
      setForm({ ...form, [`favicon_${size}`]: urlWithCache })
      showToast(`Favicon ${size}x${size} subido`)
    } catch (err) {
      console.error('Error uploading favicon:', err)
      showToast('Error al subir favicon: ' + (err.message || 'Verifica el nombre del archivo'))
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
        { key: 'color_secondary', value: form.color_secondary },
        { key: 'favicon_16', value: form.favicon_16 },
        { key: 'favicon_32', value: form.favicon_32 },
        { key: 'favicon_48', value: form.favicon_48 },
        { key: 'favicon_64', value: form.favicon_64 },
        { key: 'favicon_128', value: form.favicon_128 },
        { key: 'favicon_192', value: form.favicon_192 },
        { key: 'favicon_512', value: form.favicon_512 }
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
            <img src="/Logo.png" alt="Logo" style={{ width: 80, height: 80, objectFit: "contain" }} />
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

      {/* Sección de Favicon */}
      <div className="admin-card" style={{ gridColumn: '1 / -1' }}>
        <div className="admin-card-title">🔖 Favicons - Tamaños Múltiples</div>
        
        <div style={{ 
          background: 'rgba(255, 165, 0, 0.1)', 
          border: '2px dashed #FFA500', 
          borderRadius: 12, 
          padding: 16, 
          marginBottom: 20 
        }}>
          <div style={{ fontWeight: 700, color: '#FFA500', marginBottom: 8 }}>
            📏 Guía de tamaños de favicon
          </div>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.85rem', color: 'var(--ash)', lineHeight: 1.6 }}>
            <li><strong>16x16 px</strong> - Navegadores de escritorio (pestañas)</li>
            <li><strong>32x32 px</strong> - Navegadores modernos y alta densidad</li>
            <li><strong>48x48 px</strong> - Windows shortcut icons</li>
            <li><strong>64x64 px</strong> - Pantallas de alta resolución</li>
            <li><strong>128x128 px</strong> - Chrome Web Store</li>
            <li><strong>192x192 px</strong> - Android home screen (PWA)</li>
            <li><strong>512x512 px</strong> - PWA splash screen y manifest</li>
          </ul>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {[
            { size: 16, label: '16x16 px - Escritorio' },
            { size: 32, label: '32x32 px - Moderno' },
            { size: 48, label: '48x48 px - Windows' },
            { size: 64, label: '64x64 px - HD' },
            { size: 128, label: '128x128 px - Chrome Store' },
            { size: 192, label: '192x192 px - Android' },
            { size: 512, label: '512x512 px - PWA' }
          ].map(({ size, label }) => (
            <div key={size} style={{ 
              background: 'var(--light)', 
              borderRadius: 12, 
              padding: 16,
              border: form[`favicon_${size}`] ? '2px solid var(--primary)' : '2px solid transparent'
            }}>
              <div style={{ fontWeight: 700, marginBottom: 8, fontSize: '0.9rem' }}>{label}</div>
              
              <div style={{ 
                height: 80, 
                background: '#fff', 
                borderRadius: 8, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: 12,
                overflow: 'hidden',
                border: '1px solid #ddd'
              }}>
                {form[`favicon_${size}`] ? (
                  <img 
                    src={form[`favicon_${size}`]} 
                    alt={`Favicon ${size}x${size}`} 
                    style={{ 
                      width: Math.min(size, 64), 
                      height: Math.min(size, 64), 
                      objectFit: 'contain' 
                    }} 
                  />
                ) : (
                  <span style={{ fontSize: 24, opacity: 0.5 }}>🔖</span>
                )}
              </div>

              <div className="upload-area" onClick={() => document.getElementById(`favicon-${size}-input`).click()} style={{ padding: '8px 0' }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>📷</div>
                <div style={{ fontWeight: 600, color: 'var(--ash)', fontSize: '0.8rem' }}>
                  {uploading ? 'Subiendo...' : 'Cambiar'}
                </div>
              </div>
              <input 
                id={`favicon-${size}-input`} 
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }}
                onChange={(e) => handleFaviconUpload(e, size)}
              />

              {form[`favicon_${size}`] && (
                <button 
                  className="btn btn-danger btn-sm" 
                  style={{ marginTop: 8, width: '100%', fontSize: '0.75rem' }}
                  onClick={() => setForm({ ...form, [`favicon_${size}`]: '' })}
                >
                  🗑 Quitar
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
