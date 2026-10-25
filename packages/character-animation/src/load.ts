import { readAnimationPackage } from './package'
import { readImageDimensions } from './image-header'

function decodeImage(image: HTMLImageElement, src: string, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    let settled = false
    const finish = (failed: boolean, error: unknown) => {
      if (settled) return
      settled = true
      signal.removeEventListener('abort', abort)
      if (!failed) resolve()
      else { image.src = ''; reject(error) }
    }
    const abort = () => finish(true, signal.reason)
    signal.addEventListener('abort', abort, { once: true })
    if (signal.aborted) { abort(); return }
    try {
      image.src = src
      image.decode().then(() => finish(false, null), error => finish(true, error))
    } catch (error) { finish(true, error) }
  })
}

/** Loads at most three package-local PNG/WebP parts at a time; cancellation releases in-flight decode URLs immediately. */
export async function loadAnimationPackage(url: URL, signal: AbortSignal) {
  signal.throwIfAborted()
  const loading = new AbortController()
  const abort = () => loading.abort(signal.reason)
  signal.addEventListener('abort', abort, { once: true })
  const images = new Map<string, HTMLImageElement>()
  try {
    const response = await fetch(url, { signal: loading.signal })
    if (!response.ok) throw Error('Animation package load failed')
    const data = readAnimationPackage(await response.json())
    const assets = Object.entries(data.assets)
    let next = 0
    async function worker() {
      while (next < assets.length) {
        loading.signal.throwIfAborted()
        const [id, asset] = assets[next++]
        const response = await fetch(new URL(asset.src, url), { signal: loading.signal })
        if (!response.ok) throw Error('Animation part load failed')
        const blob = await response.blob()
        loading.signal.throwIfAborted()
        const dimensions = readImageDimensions(new DataView(await blob.arrayBuffer()))
        if (dimensions.width !== asset.width || dimensions.height !== asset.height) throw Error('Animation part dimensions differ from contract')
        loading.signal.throwIfAborted()
        const image = new Image(), objectUrl = URL.createObjectURL(blob)
        try {
          await decodeImage(image, objectUrl, loading.signal)
          loading.signal.throwIfAborted()
          if (image.naturalWidth !== asset.width || image.naturalHeight !== asset.height) throw Error('Animation part dimensions differ from contract')
          images.set(id, image)
        } catch (error) { image.src = ''; throw error }
        finally { URL.revokeObjectURL(objectUrl) }
      }
    }
    await Promise.all(Array.from({ length: Math.min(3, assets.length) }, worker))
    loading.signal.throwIfAborted()
    return { data, images }
  } catch (error) {
    loading.abort(error)
    for (const image of images.values()) image.src = ''
    images.clear()
    throw error
  } finally { signal.removeEventListener('abort', abort) }
}
