export async function imageUrlToDataUrl(url: string, sizePx = 112): Promise<string | undefined> {
  try {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.decoding = 'async'

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error(`Failed to load image: ${url}`))
      image.src = url
    })

    const naturalWidth = image.naturalWidth || sizePx
    const naturalHeight = image.naturalHeight || sizePx
    const scale = Math.min(sizePx / naturalWidth, sizePx / naturalHeight, 1)
    const width = Math.max(1, Math.round(naturalWidth * scale))
    const height = Math.max(1, Math.round(naturalHeight * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) return undefined

    context.drawImage(image, 0, 0, width, height)
    return canvas.toDataURL('image/png')
  } catch {
    return undefined
  }
}
