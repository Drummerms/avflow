
import { useMemo, useState } from 'react'
import type { Edge, Node } from '@xyflow/react'
import type { EquipmentNodeData, Connector } from '@types'

type Props = {
  nodes: Node<EquipmentNodeData>[]
  edges: Edge[]
  setNodes: any
  setEdges: any
}

export default function ConnectorsPanel({ nodes, edges, setNodes, setEdges }: Props){
  const selected = useMemo(() => nodes.find(n => n.selected), [nodes])
  const [side, setSide] = useState<'inputs'|'outputs'>('inputs')
  if (!selected) return null

  const list = (selected.data as any)[side] as Connector[]
  function updateList(newList: Connector[]){
    setNodes((nds: Node<EquipmentNodeData>[]) => nds.map(n => n.id === selected.id ? ({ ...n, data: { ...n.data, [side]: newList } }) : n))
  }

  function addPort(){
    const count = list.length + 1
    const std = 'CUSTOM'
    const id = `${selected.id}.${side==='inputs'?'in':'out'}.${std}.${count}`
    const c: Connector = { id, label: (side==='inputs'?'IN ':'OUT ') + count, standard: std, direction: side==='inputs'?'in':'out', group: side==='inputs'?'input':'output' }
    updateList([...list, c])
  }

  function removePort(idx: number){
    const port = list[idx]
    // detach edges connected to this port
    setEdges((eds: Edge[]) => eds.filter(e => e.sourceHandle !== port.id && e.targetHandle !== port.id))
    const next = list.slice(0, idx).concat(list.slice(idx+1))
    updateList(next)
  }

  function move(idx: number, dir: -1|1){
    const j = idx + dir
    if (j < 0 || j >= list.length) return
    const copy = list.slice()
    const t = copy[idx]; copy[idx] = copy[j]; copy[j] = t
    updateList(copy) // IDs remain stable, only order changes
  }

  function updateField(idx: number, field: 'label'|'standard', value: string){
    const copy = list.slice()
    const c = { ...copy[idx] }
    c[field] = value
    copy[idx] = c
    updateList(copy)
  }

  return (
    <div className="absolute right-2 top-16 bottom-2 w-72 bg-neutral-900/70 text-card-foreground border rounded-xl p-2 overflow-auto z-10">
      <div className="font-semibold mb-2">Edit Connectors</div>
      <div className="flex gap-2 mb-2">
        <button className={"px-2 py-1 rounded " + (side==='inputs'?'bg-neutral-700':'bg-neutral-800')} onClick={()=>setSide('inputs')}>Inputs</button>
        <button className={"px-2 py-1 rounded " + (side==='outputs'?'bg-neutral-700':'bg-neutral-800')} onClick={()=>setSide('outputs')}>Outputs</button>
        <div className="flex-1" />
        <button className="px-2 py-1 rounded bg-neutral-800" onClick={addPort}>Add</button>
      </div>
      <div className="space-y-2">
        {list.map((c, idx) => (
          <div key={c.id} className="rounded border p-2 bg-neutral-800/60">
            <div className="text-xs opacity-70 mb-1">{c.id}</div>
            <div className="flex gap-2 items-center mb-1">
              <label className="text-xs w-14">Label</label>
              <input className="flex-1 bg-neutral-800 rounded px-2 py-1 text-sm" value={c.label} onChange={(e)=>updateField(idx,'label',e.target.value)} />
            </div>
            <div className="flex gap-2 items-center mb-2">
              <label className="text-xs w-14">Standard</label>
              <input className="flex-1 bg-neutral-800 rounded px-2 py-1 text-sm" value={c.standard} onChange={(e)=>updateField(idx,'standard',e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button className="px-2 py-1 rounded bg-neutral-800" onClick={()=>move(idx,-1)}>↑</button>
              <button className="px-2 py-1 rounded bg-neutral-800" onClick={()=>move(idx,1)}>↓</button>
              <div className="flex-1" />
              <button className="px-2 py-1 rounded bg-red-700/80" onClick={()=>removePort(idx)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
