import { useState } from 'react'

import { useDiagramStore } from '@state/store'
import { useReactFlow } from '@xyflow/react'

import type { PageFrameState } from '@components/PageFrame'

type Props = {
  onNew: () => void
  onOpen: () => void
  onSave: () => void
  onClose: () => void
  onExportPNG: () => void
  onExportSVG: () => void
  onToggleFrame: () => void
  frame: PageFrameState
  onUpdateFrame: (patch: Partial<PageFrameState>) => void
}

export default function Toolbar({ onNew, onOpen, onSave, onClose, onExportPNG, onExportSVG, onToggleFrame, frame, onUpdateFrame }: Props){
  const { grid, setGrid, theme, setTheme } = useDiagramStore()
  const rf = useReactFlow()

  return (
    <div className="absolute top-2 left-2 right-2 z-10 flex gap-2 items-center bg-neutral-900/70 text-card-foreground rounded-xl px-3 py-2 border">
      <button className="px-2 py-1 rounded bg-neutral-800" onClick={onNew}>New</button>
      <button className="px-2 py-1 rounded bg-neutral-800" onClick={onOpen}>Open</button>
      <button className="px-2 py-1 rounded bg-neutral-800" onClick={onSave}>Save</button>
      <button className="px-2 py-1 rounded bg-neutral-800" onClick={onClose}>Close</button>
      <button className="px-2 py-1 rounded bg-neutral-800" onClick={onExportPNG}>Export PNG</button>
      <button className="px-2 py-1 rounded bg-neutral-800" onClick={onExportSVG}>Export SVG</button>
      
<div className="relative">
  <button className={"px-2 py-1 rounded " + (frame.enabled ? "bg-blue-800" : "bg-neutral-800")} onClick={onToggleFrame}>Page Frame</button>
  <FrameSettings frame={frame} onUpdateFrame={onUpdateFrame} />
</div>

      <div className="h-6 w-px bg-neutral-700 mx-1" />
      <button className="px-2 py-1 rounded bg-neutral-800" onClick={() => rf.zoomIn()}>Zoom +</button>
      <button className="px-2 py-1 rounded bg-neutral-800" onClick={() => rf.zoomOut()}>Zoom -</button>
      <div className="h-6 w-px bg-neutral-700 mx-1" />
      <label className="flex items-center gap-1">
        <input type="checkbox" checked={grid.snap} onChange={(e)=>setGrid({ snap: e.target.checked })} />
        Snap
      </label>
      <label className="flex items-center gap-1">
        Spacing X
        <input type="number" className="w-16 bg-neutral-800 rounded px-1" value={grid.spacing[0]} onChange={(e)=>setGrid({ spacing: [parseInt(e.target.value||'0'), grid.spacing[1]] })} />
      </label>
      <label className="flex items-center gap-1">
        Y
        <input type="number" className="w-16 bg-neutral-800 rounded px-1" value={grid.spacing[1]} onChange={(e)=>setGrid({ spacing: [grid.spacing[0], parseInt(e.target.value||'0')] })} />
      </label>
      <select className="bg-neutral-800 rounded px-2" value={grid.unit} onChange={(e)=>setGrid({ unit: e.target.value as any })}>
        <option value="px">px</option>
        <option value="mm">mm</option>
        <option value="in">in</option>
      </select>
      <div className="h-6 w-px bg-neutral-700 mx-1" />
      <select className="bg-neutral-800 rounded px-2" onChange={(e)=>document.body.dataset.edgeRouting = e.target.value}>
        <option value="bezier">Bezier</option>
        <option value="step">Step</option>
        <option value="straight">Straight</option>
      </select>
      <div className="h-6 w-px bg-neutral-700 mx-1" />
      <button className="px-2 py-1 rounded bg-neutral-800" onClick={()=>setTheme(theme==='dark'?'light':'dark')}>Theme</button>
    </div>
  )
}


function FrameSettings({ frame, onUpdateFrame }: { frame: PageFrameState, onUpdateFrame: (patch: Partial<PageFrameState>) => void }){
  const [open, setOpen] = useState(false)
  return (
    <div className="inline-block">
      <button className="ml-2 px-2 py-1 rounded bg-neutral-800" onClick={()=>setOpen(v=>!v)}>Settings</button>
      {open && (
        <div className="absolute mt-2 right-0 z-50 w-72 bg-neutral-900/95 text-card-foreground border rounded-xl p-3 shadow-xl">
          <div className="text-sm font-semibold mb-2">Page Frame Settings</div>
          <div className="grid grid-cols-2 gap-2 items-center text-sm">
            <label>Paper</label>
            <select className="bg-neutral-800 rounded px-2 py-1" value={frame.paper} onChange={(e)=>onUpdateFrame({ paper: e.target.value as any })}>
              <option value="Letter">Letter</option>
              <option value="Tabloid">Tabloid</option>
              <option value="A4">A4</option>
              <option value="A3">A3</option>
            </select>
            <label>Orientation</label>
            <select className="bg-neutral-800 rounded px-2 py-1" value={frame.orientation} onChange={(e)=>onUpdateFrame({ orientation: e.target.value as any })}>
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
            <label>Margins (in)</label>
            <input type="number" step="0.05" className="bg-neutral-800 rounded px-2 py-1" value={frame.marginIn} onChange={(e)=>onUpdateFrame({ marginIn: parseFloat(e.target.value || '0') })} />
            <label>DPI</label>
            <input type="number" step="1" className="bg-neutral-800 rounded px-2 py-1" value={frame.dpi} onChange={(e)=>onUpdateFrame({ dpi: parseInt(e.target.value || '0', 10) })} />
          </div>
          <div className="text-right mt-3">
            <button className="px-2 py-1 rounded bg-neutral-800" onClick={()=>setOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
