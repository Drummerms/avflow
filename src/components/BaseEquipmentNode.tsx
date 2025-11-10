
import { Handle, Position, NodeResizer } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import type { EquipmentNode } from '@types'

export default function BaseEquipmentNode({ data, selected }: NodeProps<EquipmentNode>) {
  return (
    <div className="relative rounded-2xl shadow-lg border neon-node bg-card text-card-foreground min-w-[160px] min-h-[100px]">
      <NodeResizer minWidth={160} minHeight={100} isVisible={selected} />
      <div className="grid grid-cols-[auto_1fr_auto] items-stretch min-h-[100px]">
        <ul className="flex flex-col justify-stretch gap-2 p-2">
          {data.inputs.map((c) => (
            <li key={c.id} className="relative flex items-center">
              <span className="text-[10px] opacity-70 pr-3">{c.standard}</span>
              <Handle id={c.id} type="target" position={Position.Left} className="absolute -left-2 w-2 h-2 bg-white rounded-full" />
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-center px-3">
          <span className="font-semibold text-center truncate">{data.label}</span>
        </div>
        <ul className="flex flex-col justify-stretch gap-2 p-2">
          {data.outputs.map((c) => (
            <li key={c.id} className="relative flex items-center justify-end">
              <Handle id={c.id} type="source" position={Position.Right} className="absolute -right-2 w-2 h-2 bg-white rounded-full" />
              <span className="text-[10px] opacity-70 pl-3">{c.standard}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
