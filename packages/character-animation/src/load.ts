import { readAnimationPackage } from './package'

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

/** Loads at most three package-local PNG parts at a time; cancellation releases in-flight decode URLs immediately. */
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
        const header = new DataView(await blob.slice(0, 24).arrayBuffer())
        if (header.byteLength < 24 || header.getUint32(0) !== 0x89504e47 || header.getUint32(4) !== 0x0d0a1a0a || header.getUint32(8) !== 13 || header.getUint32(12) !== 0x49484452) throw Error('Animation part must be PNG')
        if (header.getUint32(16) !== asset.width || header.getUint32(20) !== asset.height) throw Error('Animation part dimensions differ from contract')
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
