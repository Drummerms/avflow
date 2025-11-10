
import { useMemo } from 'react'
import type { EquipmentNode } from '@types'
import { useTemplateStore } from '@state/templates'

type Props = { nodes: EquipmentNode[] }

export default function TemplatesPanel({ nodes }: Props){
  const { templates, addFromNode, remove } = useTemplateStore()
  const selected = useMemo(() => nodes.find(n => n.selected), [nodes])

  function onDragStart(ev: React.DragEvent, id: string){
    ev.dataTransfer.setData('application/reactflow', JSON.stringify({ kind: 'node-template', id }))
    ev.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="absolute left-2 top-16 bottom-2 w-64 bg-neutral-900/70 text-card-foreground border rounded-xl p-2 overflow-auto z-10">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">Templates</div>
        <button
          className={"px-2 py-1 rounded " + (selected ? "bg-neutral-800" : "bg-neutral-800/50 cursor-not-allowed")}
          disabled={!selected}
          title="Save selected node as template"
          onClick={() => selected && addFromNode(selected)}
        >Save</button>
      </div>
      <div className="space-y-2">
        {templates.map(t => (
          <div key={t.id}
            draggable
            onDragStart={(e)=>onDragStart(e, t.id)}
            className="rounded-lg border p-2 bg-neutral-800/60 hover:bg-neutral-800 cursor-grab active:cursor-grabbing">
            <div className="flex items-center justify-between">
              <div className="font-medium">{t.name}</div>
              <button className="text-xs opacity-70 hover:opacity-100" onClick={()=>remove(t.id)}>Delete</button>
            </div>
            <div className="text-xs opacity-70">
              {t.data.inputs.length} in · {t.data.outputs.length} out
            </div>
            <div className="text-[10px] mt-1 opacity-60 select-none">Drag to canvas</div>
          </div>
        ))}
      </div>
    </div>
  )
}
