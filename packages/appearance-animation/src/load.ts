import { readAnimationPackage } from './package'

/** Loads only package-local PNG parts; callers own cancellation and release decoded images after playback. */
export async function loadAnimationPackage(url: URL, signal: AbortSignal) {
  const response = await fetch(url, { signal })
  if (!response.ok) throw Error('Animation package load failed')
  const data = readAnimationPackage(await response.json())
  const images = new Map(await Promise.all(Object.entries(data.assets).map(async ([id, asset]) => {
    const response = await fetch(new URL(asset.src, url), { signal })
    if (!response.ok) throw Error('Animation part load failed')
    const objectUrl = URL.createObjectURL(await response.blob())
    const image = new Image()
    try {
      image.src = objectUrl
      await image.decode()
      signal.throwIfAborted()
      if (image.naturalWidth !== asset.width || image.naturalHeight !== asset.height) throw Error('Animation part dimensions differ from contract')
      return [id, image] as const
    } finally { URL.revokeObjectURL(objectUrl) }
  })))
  return { data, images }
}
