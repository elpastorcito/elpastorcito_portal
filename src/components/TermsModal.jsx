import React from 'react'

// ============================================
// COMPONENTE: MODAL TÉRMINOS
// ============================================
export function TermsModal({ businessName, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="terms-title">
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-title" id="terms-title">Términos y Condiciones</div>
        <div className="modal-text">
          <p><strong>1. Aceptación</strong></p>
          <p>Al conectarte a la red WiFi de {businessName}, aceptás estos términos y condiciones de uso.</p>
          <br/>
          <p><strong>2. Uso adecuado</strong></p>
          <p>El servicio de WiFi es gratuito para clientes del local. Está prohibido el uso indebido de la red, incluyendo actividades ilegales o que afecten el funcionamiento del servicio.</p>
          <br/>
          <p><strong>3. Datos personales</strong></p>
          <p>Los datos solicitados (nombre, teléfono, email) se utilizan únicamente para mejorar nuestro servicio y mantenerte informado sobre novedades. No compartimos tu información con terceros.</p>
          <br/>
          <p><strong>4. Limitación de responsabilidad</strong></p>
          <p>{businessName} no se responsabiliza por problemas técnicos en la conexión ni por la seguridad de los dispositivos conectados a la red.</p>
          <br/>
          <p><strong>5. Modificaciones</strong></p>
          <p>Nos reservamos el derecho de modificar estos términos en cualquier momento.</p>
        </div>
        <button className="btn btn-primary" onClick={onClose} aria-label="Cerrar términos y condiciones">
          Entendido ✓
        </button>
      </div>
    </div>
  )
}
