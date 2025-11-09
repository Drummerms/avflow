
import type { Diagram } from '@types'

export type Bundle = {
  diagram: Diagram
  nodeTemplates: any[]
  cableTemplates: any[]
  connectorRegistry: Record<string, any>
  librariesVersion: number
}

type SaveOptions = { suggestedName?: string }

function supportsFS() {
  return typeof window !== 'undefined' && 'showSaveFilePicker' in window
}

// Fallback: download a JSON file
function downloadJSON(filename: string, data: any){
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function saveBundle(bundle: Bundle, handleRef?: React.MutableRefObject<any>, opts: SaveOptions = {}){
  if (supportsFS()) {
    try {
      let handle = handleRef?.current
      if (!handle) {
        // @ts-ignore
        handle = await window.showSaveFilePicker({
          suggestedName: opts.suggestedName || `${bundle.diagram.name || 'diagram'}.avflow.json`,
          types: [
            { description: 'AV Flow Bundle', accept: { 'application/json': ['.avflow.json'] } }
          ]
        })
        if (handleRef) handleRef.current = handle
      }
      const writable = await handle.createWritable()
      await writable.write(JSON.stringify(bundle, null, 2))
      await writable.close()
      return true
    } catch (e) {
      console.warn('saveBundle failed, falling back to download', e)
      downloadJSON(`${bundle.diagram.name || 'diagram'}.avflow.json`, bundle)
      return false
    }
  } else {
    downloadJSON(`${bundle.diagram.name || 'diagram'}.avflow.json`, bundle)
    return false
  }
}

export async function openBundle(handleRef?: React.MutableRefObject<any>): Promise<Bundle | null>{
  try {
    // @ts-ignore
    const [handle] = await window.showOpenFilePicker({ multiple: false, types: [{ description: 'AV Flow Bundle', accept: { 'application/json': ['.avflow.json', '.json'] } }] })
    if (handleRef) handleRef.current = handle
    const f = await handle.getFile()
    const text = await f.text()
    const parsed = JSON.parse(text)
    return parsed as Bundle
  } catch (e) {
    console.warn('openBundle cancelled or failed', e)
    return null
  }
}
