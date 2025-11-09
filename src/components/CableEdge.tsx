
import type { EdgeProps } from '@xyflow/react'
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, getStraightPath, getStepPath } from '@xyflow/react'
import type { CableEdgeData } from '@types'

function pathFor(routing: 'bezier'|'step'|'straight', args: any){
  if(routing==='straight') return getStraightPath(args)
  if(routing==='step') return getStepPath({ ...args, borderRadius: 8 })
  return getSmoothStepPath({ ...args, borderRadius: 6 }) // bezier-like smooth
}

export default function CableEdge(props: EdgeProps<CableEdgeData>) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data } = props
  const routing = data?.routing ?? 'bezier'
  const [path, labelX, labelY] = pathFor(routing, { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition }) as [string, number, number]
  const text = data?.meta?.ms_cable_label ? `${data.meta.ms_cable_label} · ${data.cableType}` : data?.cableType
  return (
    <>
      <BaseEdge id={id} path={path} />
      <EdgeLabelRenderer>
        <div style={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }} className="pointer-events-auto select-none text-[10px] px-1.5 py-0.5 rounded bg-muted/70 border backdrop-blur text-card-foreground">
          {text}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
