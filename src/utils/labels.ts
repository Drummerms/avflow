
export function nextSeriesLabel(prefix: string, existing: string[]): string {
  const re = new RegExp(`^${prefix}-\\d+$`)
  const nums = existing
    .filter(s => re.test(s))
    .map(s => parseInt(s.split('-').pop() || '0', 10))
  const next = (nums.length ? Math.max(...nums) + 1 : 1)
  const width = Math.max(2, (nums.length ? String(Math.max(...nums)) : '0').length)
  return `${prefix}-${String(next).padStart(width, '0')}`
}

export function nextNodeLabel(nodes: { label: string }[], prefix: string): string {
  const existing = nodes.map(n => n.label)
  return nextSeriesLabel(prefix, existing)
}

export function nextCableLabel(edges: { data?: { meta?: any } }[], type: string|undefined, prefix = 'CBL'): string {
  const existing = edges
    .filter(e => e?.data?.meta?.ms_cable_type === type)
    .map(e => String(e?.data?.meta?.ms_cable_label || ''))
  return nextSeriesLabel(prefix, existing)
}
