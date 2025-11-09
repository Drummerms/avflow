
import * as htmlToImage from 'html-to-image'

function downloadBlob(filename: string, blob: Blob){
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',')
  const mime = arr[0].match(/:(.*?);/)![1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) u8arr[n] = bstr.charCodeAt(n)
  return new Blob([u8arr], { type: mime })
}

export async function exportPNG(el: HTMLElement, filename: string, crop?: { x: number; y: number; width: number; height: number; scale?: number }){
  const dataUrl = await htmlToImage.toPng(el, { pixelRatio: crop?.scale || 2 })
  const img = await new Promise<HTMLImageElement>((resolve) => {
    const im = new Image()
    im.onload = () => resolve(im)
    im.src = dataUrl
  })
  if (!crop) {
    downloadBlob(filename, dataUrlToBlob(dataUrl))
    return
  }
  const canvas = document.createElement('canvas')
  const scale = crop.scale || 1
  canvas.width = Math.round(crop.width * scale)
  canvas.height = Math.round(crop.height * scale)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, crop.x * scale, crop.y * scale, crop.width * scale, crop.height * scale, 0, 0, crop.width * scale, crop.height * scale)
  canvas.toBlob((blob) => { if (blob) downloadBlob(filename, blob) }, 'image/png')
}

export async function exportSVG(el: HTMLElement, filename: string){
  const dataUrl = await htmlToImage.toSvg(el, { pixelRatio: 1 })
  const blob = dataUrlToBlob(dataUrl)
  downloadBlob(filename, blob)
}
