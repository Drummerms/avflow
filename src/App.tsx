
import { useMemo, useState } from 'react'
import { Background, Controls, ReactFlow, addEdge, useEdgesState, useNodesState, useReactFlow, type Node, type Edge, MarkerType } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import BaseEquipmentNode from '@components/BaseEquipmentNode'
import CableEdge from '@components/CableEdge'
import { useDiagramStore } from '@state/store'
import type { EquipmentNodeData, CableEdgeData } from '@types'
import { Dialog } from '@components/Dialogs'
import Toolbar from '@components/Toolbar'
import TemplatesPanel from '@components/TemplatesPanel'
import ConnectorsPanel from '@components/ConnectorsPanel'
import PageFrame, { innerSizePx, type PageFrameState } from '@components/PageFrame'
import { pxFrom } from '@utils/units'
import { nextCableLabel, nextNodeLabel } from '@utils/labels'
import { useTemplateStore } from '@state/templates'
import { saveBundle, openBundle, type Bundle } from '@utils/fileio'
import { exportPNG, exportSVG } from '@utils/export'

const nodeTypes = { equipment: BaseEquipmentNode }
const edgeTypes = { cable: CableEdge }

function newEquipmentNode(x: number, y: number): Node<EquipmentNodeData> {
  const id = `n_${Math.random().toString(36).slice(2,8)}`
  return {
    id,
    type: 'equipment',
    position: { x, y },
    data: {
      label: 'VS-01',
      meta: {},
      inputs: [{ id: `${id}.in.CUSTOM.1`, label: 'IN 1', standard: 'CUSTOM', direction: 'in', group: 'input' }],
      outputs: [{ id: `${id}.out.CUSTOM.1`, label: 'OUT 1', standard: 'CUSTOM', direction: 'out', group: 'output' }],
    },
    width: 220,
    height: 120
  }
}

export default function App(){
  const { grid, theme, setGrid, setTheme } = useDiagramStore()
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<EquipmentNodeData>>([ newEquipmentNode(100,100) ])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<CableEdgeData>>([])
  const rf = useReactFlow()

  const [nodeDialog, setNodeDialog] = useState<{open:boolean, nodeId?: string}>({open:false})
  const [edgeDialog, setEdgeDialog] = useState<{open:boolean, edgeId?: string}>({open:false})

  const [frame, setFrame] = useState<PageFrameState>({ enabled: false, paper: 'Letter', orientation: 'portrait', dpi: 150, marginIn: 0.25 })

  const [diagramName, setDiagramName] = useState<string>('Untitled')
  const [diagramId, setDiagramId] = useState<string>(() => `d_${Math.random().toString(36).slice(2,10)}`)
  const [dirty, setDirty] = useState<boolean>(false)
  const fileHandleRef = (window as any)._avFileHandleRef || { current: null }
  ;(window as any)._avFileHandleRef = fileHandleRef

  const snapGrid = useMemo<[number, number]>(() => {
    if (!grid.snap) return [1,1]
    return [pxFrom(grid.spacing[0], grid.unit), pxFrom(grid.spacing[1], grid.unit)]
  }, [grid.snap, grid.spacing, grid.unit])

  const defaultEdgeOptions = useMemo(() => ({ type: 'cable' as const, markerEnd: { type: MarkerType.ArrowClosed } }), [])

  function onConnect(params: any){
    setDirty(true)
    setEdges(eds => addEdge({
      ...params,
      type: 'cable',
      markerEnd: { type: MarkerType.ArrowClosed },
      data: { cableType: '', meta: {}, routing: (document.body.dataset.edgeRouting as any) || 'bezier' }
    }, eds))
  }

  function onNodeDoubleClick(_: any, node: Node<EquipmentNodeData>){ setNodeDialog({ open: true, nodeId: node.id }); setDirty(true) }
  function onEdgeDoubleClick(_: any, edge: Edge<CableEdgeData>){ setEdgeDialog({ open: true, edgeId: edge.id }); setDirty(true) }

  function updateNodeMeta(nodeId: string, patch: Partial<EquipmentNodeData['meta']>){
    setDirty(true)
    setNodes(nds => nds.map(n => n.id===nodeId ? { ...n, data: { ...n.data, meta: { ...n.data.meta, ...patch } } } : n))
  }
  function updateEdgeMeta(edgeId: string, patch: Partial<CableEdgeData['meta']> & { cableType?: string; routing?: 'bezier'|'step'|'straight' }){
    setDirty(true)
    setEdges(eds => eds.map(e => {
      if (e.id !== edgeId) return e
      const newData = { ...e.data }
      if ('cableType' in patch && typeof patch.cableType !== 'undefined') {
        newData.cableType = patch.cableType!
        newData.meta = { ...(newData.meta||{}), ms_cable_type: patch.cableType }
      }
      newData.meta = { ...(newData.meta||{}), ...(patch as any) }
      const t = newData.meta?.ms_cable_type
      if ((newData.meta?.ms_cable_label ?? '') === '' && t) {
        newData.meta.ms_cable_label = nextCableLabel(eds as any, t, 'CBL')
      }
      if ((patch as any).routing) newData.routing = (patch as any).routing
      return { ...e, data: newData }
    }))
  }

  function instantiateFromTemplate(tplId: string, x: number, y: number){
    const tpl = useTemplateStore.getState().getById(tplId)
    if (!tpl) return
    const id = `n_${Math.random().toString(36).slice(2,8)}`
    const prefix = tpl.name
    const nextLabel = nextNodeLabel(nodes.map(n => ({label: n.data.label} as any)), prefix)
    const regen = (arr: any[], side: 'in'|'out') => arr.map((c, i) => ({
      ...c,
      id: `${id}.${side}.${(c.standard||'CUSTOM')}.${i+1}`
    }))
    const node = {
      id,
      type: 'equipment',
      position: { x, y },
      data: {
        label: nextLabel,
        meta: { ...(tpl.data.meta||{}) },
        description: tpl.data.description || '',
        inputs: regen(tpl.data.inputs || [], 'in'),
        outputs: regen(tpl.data.outputs || [], 'out'),
        template: { id: tpl.id, version: tpl.version }
      },
      width: 220,
      height: 120
    } as any
    setNodes(nds => [...nds, node])
    setDirty(true)
  }

  function buildBundle(): Bundle {
    const diagram = {
      id: diagramId,
      name: diagramName,
      nodes: nodes,
      edges: edges,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      grid: grid,
      theme: theme
    } as any
    const libs = useTemplateStore.getState().templates
    return {
      diagram,
      nodeTemplates: libs,
      cableTemplates: [],
      connectorRegistry: {},
      librariesVersion: 1
    }
  }

  async function handleSave(){
    const bundle = buildBundle()
    await saveBundle(bundle, fileHandleRef, { suggestedName: `${diagramName}.avflow.json` })
    setDirty(false)
  }

  async function handleOpen(){
    if (dirty && !confirm('You have unsaved changes. Continue and lose changes?')) return
    const parsed = await openBundle(fileHandleRef)
    if (!parsed) return
    try {
      setNodes(parsed.diagram.nodes as any)
      setEdges(parsed.diagram.edges as any)
      setDiagramId(parsed.diagram.id || `d_${Math.random().toString(36).slice(2,10)}`)
      setDiagramName(parsed.diagram.name || 'Untitled')
      if (parsed.diagram.grid) setGrid(parsed.diagram.grid as any)
      if (parsed.diagram.theme) setTheme(parsed.diagram.theme as any)
      if (parsed.nodeTemplates) {
        const st = useTemplateStore.getState()
        // @ts-ignore
        st.templates = parsed.nodeTemplates
        useTemplateStore.setState({ templates: parsed.nodeTemplates })
      }
      setDirty(false)
    } catch (e) {
      alert('Failed to open file. See console for details.')
      console.error(e)
    }
  }

  function newDiagram(){
    if (dirty && !confirm('You have unsaved changes. Create new and lose changes?')) return
    setNodes([ newEquipmentNode(100,100) ] as any)
    setEdges([])
    setDiagramId(`d_${Math.random().toString(36).slice(2,10)}`)
    setDiagramName('Untitled')
    ;(fileHandleRef as any).current = null
    setDirty(false)
  }

  function closeDiagram(){
    if (dirty && !confirm('You have unsaved changes. Close and lose changes?')) return
    setNodes([] as any)
    setEdges([] as any)
    setDiagramName('Untitled')
    ;(fileHandleRef as any).current = null
    setDirty(false)
  }

  async function handleExportPNG(){
    const container = document.querySelector('.react-flow') as HTMLElement
    if (!container) return
    if (frame.enabled) {
      const rect = container.getBoundingClientRect()
      const size = innerSizePx(frame)
      const frameBox = {
        x: Math.max(0, (rect.width - size.w) / 2),
        y: Math.max(0, (rect.height - size.h) / 2),
        width: Math.min(size.w, rect.width),
        height: Math.min(size.h, rect.height),
        scale: 2
      }
      await exportPNG(container, `${diagramName}.png`, frameBox)
    } else {
      await exportPNG(container, `${diagramName}.png`)
    }
  }

  async function handleExportSVG(){
    const container = document.querySelector('.react-flow') as HTMLElement
    if (!container) return
    await exportSVG(container, `${diagramName}.svg`)
  }

  function toggleFrame(){ setFrame(f => ({ ...f, enabled: !f.enabled })) }

  // beforeunload prompt
  if (typeof window !== 'undefined') {
    (window as any).onbeforeunload = dirty ? () => true : null
  }

  return (
    <div className={theme==='dark'?'dark':''}>
      <div className="h-dvh bg-neutral-950"
        onDragOver={(e)=>{e.preventDefault(); e.dataTransfer.dropEffect = "move"}}
        onDrop={(e)=>{
          const raw = e.dataTransfer.getData("application/reactflow");
          try{ const payload = JSON.parse(raw); if(payload?.kind === "node-template"){ const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); instantiateFromTemplate(payload.id, e.clientX - rect.left, e.clientY - rect.top); } } catch(err) {}
        }}
      >
        <Toolbar onNew={newDiagram} onOpen={handleOpen} onSave={handleSave} onClose={closeDiagram} onExportPNG={handleExportPNG} onExportSVG={handleExportSVG} onToggleFrame={toggleFrame} />
        <TemplatesPanel nodes={nodes as any} />
        <ConnectorsPanel nodes={nodes as any} edges={edges as any} setNodes={setNodes} setEdges={setEdges} />
        <PageFrame state={frame} />
        <ReactFlow
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDoubleClick={onNodeDoubleClick}
          onEdgeDoubleClick={onEdgeDoubleClick}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          snapToGrid={grid.snap}
          snapGrid={snapGrid}
          defaultEdgeOptions={defaultEdgeOptions}
          deleteKeyCode={['Delete', 'Backspace']}
          >
          <Background variant="dots" />
          <Controls />
        </ReactFlow>
        <Dialog title="Device metadata" open={nodeDialog.open} onClose={()=>setNodeDialog({open:false})}>
          <form className="grid gap-2" onSubmit={(e)=>{e.preventDefault(); setNodeDialog({open:false})}}>
            <label className="text-sm opacity-80">Description <input className="w-full bg-neutral-800 rounded px-2 py-1" onChange={(e)=> nodeDialog.nodeId && updateNodeMeta(nodeDialog.nodeId, { ms_device_description: e.target.value })} /></label>
            <label className="text-sm opacity-80">Manufacturer <input className="w-full bg-neutral-800 rounded px-2 py-1" onChange={(e)=> nodeDialog.nodeId && updateNodeMeta(nodeDialog.nodeId, { ms_device_mfr: e.target.value })} /></label>
            <label className="text-sm opacity-80">Model <input className="w-full bg-neutral-800 rounded px-2 py-1" onChange={(e)=> nodeDialog.nodeId && updateNodeMeta(nodeDialog.nodeId, { ms_device_model: e.target.value })} /></label>
            <button className="mt-2 px-3 py-1 rounded bg-neutral-700">Save</button>
          </form>
        </Dialog>
        <Dialog title="Cable metadata" open={edgeDialog.open} onClose={()=>setEdgeDialog({open:false})}>
          <form className="grid gap-2" onSubmit={(e)=>{e.preventDefault(); setEdgeDialog({open:false})}}>
            <label className="text-sm opacity-80">Cable Label <input className="w-full bg-neutral-800 rounded px-2 py-1" onChange={(e)=> edgeDialog.edgeId && updateEdgeMeta(edgeDialog.edgeId, { ms_cable_label: e.target.value })} /></label>
            <label className="text-sm opacity-80">Cable Type <input className="w-full bg-neutral-800 rounded px-2 py-1" onChange={(e)=> edgeDialog.edgeId && updateEdgeMeta(edgeDialog.edgeId, { cableType: e.target.value, ms_cable_type: e.target.value })} /></label>
            <label className="text-sm opacity-80">Routing
              <select className="w-full bg-neutral-800 rounded px-2 py-1" onChange={(e)=> edgeDialog.edgeId && updateEdgeMeta(edgeDialog.edgeId, { routing: e.target.value as any })}>
                <option value="bezier">Bezier</option>
                <option value="step">Step</option>
                <option value="straight">Straight</option>
              </select>
            </label>
            <button className="mt-2 px-3 py-1 rounded bg-neutral-700">Save</button>
          </form>
        </Dialog>
      </div>
    </div>
  )
}
