// ============================================
// UTILIDADES DE FORMATO
// ============================================

export const fmtPrice = (n) => `$${Number(n).toLocaleString("es-AR")}`

export const fmtDate = (d) => new Date(d).toLocaleDateString("es-AR", {
  day: "2-digit", month: "2-digit", year: "numeric",
  hour: "2-digit", minute: "2-digit"
})

export const fmtDateShort = (d) => new Date(d).toLocaleDateString("es-AR", {
  day: "2-digit", month: "2-digit"
})

export const genSlug = () => Math.random().toString(36).slice(2, 10)

export const getFirstName = (name) => name.trim().split(' ')[0]

// ============================================
// EXPORTAR CSV
// ============================================
export function exportCSV(clients) {
  const header = "Nombre,Teléfono,Email,Fecha de registro"
  const rows = clients.map(c => 
    `"${c.name}","${c.phone}","${c.email || ''}","${fmtDate(c.created_at)}"`
  )
  const csv = [header, ...rows].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `clientes_pastorcito_${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
