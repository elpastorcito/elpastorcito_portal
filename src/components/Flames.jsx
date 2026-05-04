import { useMemo } from 'react'

// ============================================
// COMPONENTE: FLAMES (Optimizado)
// ============================================
export function Flames() {
  // Memoizar generación de llamas para evitar recálculos en re-renders
  const flames = useMemo(() => 
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      height: 30 + Math.random() * 60,
      delay: Math.random() * 2,
      duration: 1.5 + Math.random() * 1.5,
      opacity: 0.4 + Math.random() * 0.4
    })),
    []
  )

  return (
    <div className="flames-container">
      {flames.map((f) => (
        <div
          key={f.id}
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
