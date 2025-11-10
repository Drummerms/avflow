
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { EquipmentNode, EquipmentNodeData } from '@types'

export type NodeTemplate = {
  id: string
  name: string // used as label prefix
  data: Pick<EquipmentNodeData, 'description'|'meta'|'inputs'|'outputs'>
  tags?: string[]
  version?: number
  updatedAt?: number
}

type TemplateStore = {
  templates: NodeTemplate[]
  addFromNode: (node: EquipmentNode, name?: string) => void
  remove: (id: string) => void
  getById: (id: string) => NodeTemplate | undefined
}

function derivePrefix(label: string): string {
  const m = label.match(/^(.*?)-\d+$/)
  if (m && m[1]) return m[1].toUpperCase()
  return (label || 'DEV').toUpperCase()
}

export const useTemplateStore = create<TemplateStore>()(persist(
  (set, get) => ({
    templates: [
      {
        id: 'tpl_vs',
        name: 'VS',
        data: {
          description: '',
          meta: {},
          inputs: [{ id: 'in.1', label: 'IN 1', standard: 'CUSTOM', direction: 'in', group: 'input' }],
          outputs: [{ id: 'out.1', label: 'OUT 1', standard: 'CUSTOM', direction: 'out', group: 'output' }],
        },
        version: 1,
        updatedAt: Date.now()
      }
    ],
    addFromNode: (node, name) => set(state => {
      const prefix = name || derivePrefix(node.data.label)
      const newTpl: NodeTemplate = {
        id: `tpl_${Math.random().toString(36).slice(2,8)}`,
        name: prefix,
        data: {
          description: node.data.description || '',
          meta: node.data.meta || {},
          inputs: node.data.inputs.map((c, i) => ({ ...c, id: `in.${i+1}` })),
          outputs: node.data.outputs.map((c, i) => ({ ...c, id: `out.${i+1}` })),
        },
        version: 1,
        updatedAt: Date.now()
      }
      return { templates: [newTpl, ...state.templates] }
    }),
    remove: (id) => set(state => ({ templates: state.templates.filter(t => t.id !== id) })),
    getById: (id) => get().templates.find(t => t.id === id),
  }),
  {
    name: 'av-templates-v1',
    storage: createJSONStorage(() => localStorage)
  }
))
