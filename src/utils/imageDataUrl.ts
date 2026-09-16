/** Match `.profile-intro__figure`: full width, top-aligned, overflow hidden (bottom clipped). */
export async function cropResumeCutoutPhoto(
  url: string,
  boxWidthPx = 384,
): Promise<string | undefined> {
  try {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.decoding = 'async'

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error(`Failed to load image: ${url}`))
      image.src = url
    })

    const naturalWidth = image.naturalWidth || boxWidthPx
    const naturalHeight = image.naturalHeight || boxWidthPx
    const boxHeightPx = Math.round(boxWidthPx * (1455 / 1081) * (2 / 3))
    const scaledHeight = (naturalHeight / naturalWidth) * boxWidthPx

    const canvas = document.createElement('canvas')
    canvas.width = boxWidthPx
    canvas.height = boxHeightPx
    const context = canvas.getContext('2d')
    if (!context) return undefined

    context.drawImage(image, 0, 0, boxWidthPx, scaledHeight)
    return canvas.toDataURL('image/png')
  } catch {
    return undefined
  }
}

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
