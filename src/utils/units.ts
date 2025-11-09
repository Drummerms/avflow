
export const PX_PER_IN = 96
export const PX_PER_MM = 96 / 25.4

export function pxFrom(value: number, unit: 'px' | 'mm' | 'in'): number {
  if (unit === 'px') return value
  if (unit === 'in') return value * PX_PER_IN
  return value * PX_PER_MM
}

export function valueFromPx(px: number, unit: 'px' | 'mm' | 'in'): number {
  if (unit === 'px') return px
  if (unit === 'in') return px / PX_PER_IN
  return px / PX_PER_MM
}
