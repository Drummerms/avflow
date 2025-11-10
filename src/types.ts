
import type { Node, Edge } from '@xyflow/react'

export type UUID = string
export type Unit = 'px' | 'mm' | 'in'
export type Direction = 'in' | 'out'
export type ConnectorStandard = string

export interface Connector {
  id: UUID
  label: string
  standard: ConnectorStandard
  direction: Direction
  group?: 'input' | 'output'
}

export interface AppliedTemplateRef { id: UUID; version?: number }

export interface EquipmentNodeData extends Record<string, unknown> {
  label: string
  description?: string
  meta: Record<string, string | number | boolean | null | undefined>
  inputs: Connector[]
  outputs: Connector[]
  template?: AppliedTemplateRef
}

export interface CableMeta {
  ms_cable_label?: string
  ms_cable_length?: string
  ms_cable_qty?: string
  ms_cable_type?: string
  tags?: string[]
}

export interface CableEdgeData extends Record<string, unknown> {
  cableType: string
  meta: CableMeta
  routing?: 'bezier' | 'step' | 'straight'
  template?: AppliedTemplateRef
}

export interface Diagram {
  id: UUID
  name: string
  nodes: Node<EquipmentNodeData>[]
  edges: Edge<CableEdgeData>[]
  createdAt: number
  updatedAt: number
  grid: { snap: boolean; spacing: [number, number]; unit: Unit }
  theme: 'light' | 'dark'
}

export interface NodeTemplate { id: UUID; name: string; data: EquipmentNodeData; tags?: string[]; version?: number; updatedAt?: number }
export interface CableTemplate { id: UUID; name: string; data: CableEdgeData; tags?: string[]; version?: number; updatedAt?: number }

export type EquipmentNode = Node<EquipmentNodeData, 'equipment'>
export type CableEdge = Edge<CableEdgeData, 'cable'>
