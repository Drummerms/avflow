
import { create } from 'zustand'
import type { OnConnect } from '@xyflow/react'
import { MarkerType } from '@xyflow/react'
import type { EquipmentNode, CableEdge, Unit } from '@types'
import { incrementId } from '@utils/incrementId'

type Store = {
  nodes: EquipmentNode[]
  edges: CableEdge[]
  grid: { snap: boolean; spacing: [number, number]; unit: Unit }
  theme: 'light' | 'dark'
  dirty: boolean
  setNodes: (nodes: EquipmentNode[] | ((ns: EquipmentNode[]) => EquipmentNode[])) => void
  setEdges: (edges: CableEdge[] | ((es: CableEdge[]) => CableEdge[])) => void
  onConnect: OnConnect
  setGrid: (g: Partial<Store['grid']>) => void
  setTheme: (t: Store['theme']) => void
  setDirty: (d: boolean) => void
  duplicateSelected: () => void
}

export const useDiagramStore = create<Store>((set, get) => ({
  nodes: [],
  edges: [],
  grid: { snap: true, spacing: [10,10], unit: 'mm' },
  theme: 'dark',
  dirty: false,
  setNodes: (nodes) => set({ nodes: typeof nodes === 'function' ? (nodes as any)(get().nodes) : nodes, dirty: true }),
  setEdges: (edges) => set({ edges: typeof edges === 'function' ? (edges as any)(get().edges) : edges, dirty: true }),
  onConnect: (params) => set({ edges: [...get().edges, {
    id: `e${Math.random().toString(36).slice(2)}`,
    source: params.source!,
    target: params.target!,
    sourceHandle: params.sourceHandle,
    targetHandle: params.targetHandle,
    type: 'cable',
    markerEnd: { type: MarkerType.ArrowClosed },
    data: { cableType: '', meta: {}, routing: 'bezier' }
  }] }),
  setGrid: (g) => set({ grid: { ...get().grid, ...g }, dirty: true }),
  setTheme: (t) => set({ theme: t }),
  setDirty: (d) => set({ dirty: d }),
  duplicateSelected: () => {
    const nodes = get().nodes
    const selected = nodes.filter(n => n.selected)
    if (!selected.length) return
    const spacing = get().grid.spacing
    const clones = selected.map(n => ({
      ...n,
      id: `${n.id}-copy-${Math.random().toString(36).slice(2,6)}`,
      position: { x: n.position.x + spacing[0], y: n.position.y + spacing[1] },
      data: { ...n.data, label: incrementId(n.data.label) },
      selected: false
    }))
    set({ nodes: [...nodes, ...clones], dirty: true })
  }
}))
