
type Paper = 'Letter'|'Tabloid'|'A4'|'A3'
const PAPER_IN: Record<Paper, { w: number; h: number }> = {
  Letter: { w: 8.5, h: 11 },
  Tabloid: { w: 11, h: 17 },
  A4: { w: 8.27, h: 11.69 },
  A3: { w: 11.69, h: 16.54 }
}

export type PageFrameState = {
  enabled: boolean
  paper: Paper
  orientation: 'portrait'|'landscape'
  dpi: number
  marginIn: number
}

type Props = {
  state: PageFrameState
}

export function innerSizePx(state: PageFrameState){
  const p = PAPER_IN[state.paper]
  const wIn = state.orientation === 'portrait' ? p.w : p.h
  const hIn = state.orientation === 'portrait' ? p.h : p.w
  const innerWIn = Math.max(0, wIn - state.marginIn * 2)
  const innerHIn = Math.max(0, hIn - state.marginIn * 2)
  return { w: innerWIn * state.dpi, h: innerHIn * state.dpi }
}

export default function PageFrame({ state }: Props){
  if (!state.enabled) return null
  const size = innerSizePx(state)
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-20">
      <div className="relative border-2 border-white/60 outline outline-2 outline-blue-400/50"
        style={{ width: size.w, height: size.h, boxShadow: '0 0 0 200vmax rgba(0,0,0,.4)' }}>
        <div className="absolute inset-0 border border-blue-300/70" />
        <div className="absolute -top-6 left-0 text-xs text-white/80">Page frame {state.paper} {state.orientation} @ {state.dpi} DPI, margins {state.marginIn} in</div>
      </div>
    </div>
  )
}
