import { BaseEdge, EdgeLabelRenderer, getBezierPath, getSmoothStepPath, getStraightPath } from '@xyflow/react'
import type { EdgeProps } from '@xyflow/react'
import type { CableEdge } from '@types'

export default function CableEdge(props: EdgeProps<CableEdge>) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data } = props
  const edgeData: CableEdge['data'] = {
    cableType: data?.cableType ?? '',
    meta: data?.meta ?? {},
    routing: data?.routing,
    template: data?.template
  }
  const routing = edgeData.routing ?? 'bezier'

  const straightArgs = { sourceX, sourceY, targetX, targetY }
  const directionalArgs = { sourcePosition, targetPosition }

  let path: string
  let labelX: number
  let labelY: number

  if (routing === 'straight') {
    ;[path, labelX, labelY] = getStraightPath(straightArgs)
  } else if (routing === 'step') {
    ;[path, labelX, labelY] = getSmoothStepPath({ ...straightArgs, ...directionalArgs, borderRadius: 8 })
  } else {
    ;[path, labelX, labelY] = getBezierPath({ ...straightArgs, ...directionalArgs, curvature: 0.25 })
  }

  const text = edgeData.meta?.ms_cable_label ? `${edgeData.meta.ms_cable_label} · ${edgeData.cableType}` : edgeData.cableType

  return (
    <>
      <BaseEdge id={id} path={path} />
      <EdgeLabelRenderer>
        <div
          style={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}
          className="pointer-events-auto select-none text-[10px] px-1.5 py-0.5 rounded bg-muted/70 border backdrop-blur text-card-foreground"
        >
          {text}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
