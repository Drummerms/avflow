
import { useEffect } from 'react'
import ReactDOM from 'react-dom'

type DialogProps = {
  title: string
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

export function Dialog({ title, open, onClose, children }: DialogProps){
  useEffect(() => {
    function onKey(e: KeyboardEvent){ if(e.key === 'Escape') onClose() }
    if(open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if(!open) return null
  const root = document.getElementById('portal-root')!
  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-card text-card-foreground rounded-xl shadow-xl min-w-[360px] max-w-[90vw] p-4 border neon-node" onClick={e => e.stopPropagation()}>
        <div className="font-semibold mb-3">{title}</div>
        {children}
        <div className="mt-4 text-right">
          <button className="px-3 py-1 rounded bg-neutral-700 hover:bg-neutral-600" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>,
    root
  )
}
