
export function incrementId(label: string): string {
  const m = label.match(/^(.*?)-(\d+)$/)
  if (m) {
    const prefix = m[1]
    const num = m[2]
    const n = String(parseInt(num, 10) + 1).padStart(num.length, '0')
    return `${prefix}-${n}`
  }
  const t = label.match(/^(.*?)(\d+)$/)
  if (!t) return label
  const prefix = t[1]
  const num = t[2]
  const n = String(parseInt(num, 10) + 1).padStart(num.length, '0')
  return `${prefix}${n}`
}
