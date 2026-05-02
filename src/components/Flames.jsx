import React from 'react'

// ============================================
// COMPONENTE: FLAMES
// ============================================
export function Flames() {
  const flames = Array.from({ length: 15 }, (_, i) => ({
    height: 30 + Math.random() * 60,
    delay: Math.random() * 2,
    duration: 1.5 + Math.random() * 1.5,
    opacity: 0.4 + Math.random() * 0.4
  }))
  
  return (
    <div className="flames-container">
      {flames.map((f, i) => (
        <div
          key={i}
          className="flame"
          style={{
            height: f.height,
            animationDelay: `${f.delay}s`,
            animationDuration: `${f.duration}s`,
            opacity: f.opacity
          }}
        />
      ))}
    </div>
  )
}
