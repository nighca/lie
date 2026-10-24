import type { AnimationPackage, AnimationProperty, AnimationState } from './types'

export const animationStates: readonly AnimationState[] = ['default', 'listening', 'waiting', 'speaking']
const maxAssets = 32
const maxPixels = 32 * 1024 * 1024
const properties = ['x', 'y', 'pivotX', 'pivotY', 'rotation', 'scaleX', 'scaleY'] as const
function object(value: unknown, label: string): Record<string, unknown> {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) throw Error(`${label}: expected object`)
  return value as Record<string, unknown>
}
function fields(value: Record<string, unknown>, allowed: readonly string[], label: string) {
  for (const key of Object.keys(value)) if (!allowed.includes(key)) throw Error(`${label}: unknown field ${key}`)
}
function array(value: unknown, label: string): unknown[] { if (!Array.isArray(value)) throw Error(`${label}: expected array`); return value }
function text(value: unknown, label: string): string { if (typeof value !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) throw Error(`${label}: invalid ID`); return value }
function number(value: unknown, label: string): number { if (typeof value !== 'number' || !Number.isFinite(value)) throw Error(`${label}: expected finite number`); return value }
function positive(value: unknown, label: string): number { const result = number(value, label); if (!(result > 0)) throw Error(`${label}: expected positive number`); return result }
function boolean(value: unknown, label: string): boolean { if (typeof value !== 'boolean') throw Error(`${label}: expected boolean`); return value }
function size(value: unknown, label: string): number { const result = positive(value, label); if (!Number.isSafeInteger(result) || result > 8192) throw Error(`${label}: invalid canvas dimension`); return result }

/** Parses the versioned, non-executable appearance animation contract. All references are checked before playback. */
export function readAnimationPackage(value: unknown): AnimationPackage {
  const root = object(value, 'Animation')
  fields(root, ['schemaVersion', 'canvas', 'assets', 'nodes', 'clips', 'states', 'transitions'], 'Animation')
  if (root.schemaVersion !== 1) throw Error('Unsupported animation schemaVersion')
  const canvas = object(root.canvas, 'canvas'); fields(canvas, ['width', 'height'], 'canvas')
  const canvasSize = { width: size(canvas.width, 'canvas.width'), height: size(canvas.height, 'canvas.height') }
  let pixels = canvasSize.width * canvasSize.height
  if (pixels > maxPixels) throw Error('Animation exceeds total pixel budget')
  const entries = Object.entries(object(root.assets, 'assets'))
  if (entries.length > maxAssets) throw Error('Animation exceeds asset count limit')
  const assets: AnimationPackage['assets'] = {}
  for (const [id, raw] of entries) {
    text(id, 'asset ID'); const asset = object(raw, id); fields(asset, ['src', 'width', 'height'], id)
    if (typeof asset.src !== 'string' || !/^parts\/[a-z0-9]+(?:-[a-z0-9]+)*\.png$/.test(asset.src)) throw Error(`${id}: asset must be a local parts/*.png`)
    const width = size(asset.width, id), height = size(asset.height, id)
    pixels += width * height
    if (pixels > maxPixels) throw Error('Animation exceeds total pixel budget')
    assets[id] = { src: asset.src, width, height }
  }
  const ids = new Set<string>()
  const nodes: AnimationPackage['nodes'] = array(root.nodes, 'nodes').map(raw => {
    const node = object(raw, 'node'); fields(node, ['id', 'parent', 'transform', 'visible', 'sprite'], 'node')
    const id = text(node.id, 'node ID'); if (ids.has(id)) throw Error(`Duplicate node ${id}`)
    const parent = node.parent === null ? null : text(node.parent, `${id}.parent`)
    if (parent != null && !ids.has(parent)) throw Error(`${id}: parent must precede child`)
    const transform = object(node.transform, `${id}.transform`); fields(transform, properties, `${id}.transform`)
    const parsedTransform = { x: number(transform.x, id), y: number(transform.y, id), pivotX: number(transform.pivotX, id), pivotY: number(transform.pivotY, id), rotation: number(transform.rotation, id), scaleX: positive(transform.scaleX, id), scaleY: positive(transform.scaleY, id) }
    const result: AnimationPackage['nodes'][number] = { id, parent, transform: parsedTransform, visible: boolean(node.visible, id) }
    if (node.sprite != null) {
      const sprite = object(node.sprite, `${id}.sprite`); fields(sprite, ['asset', 'order', 'crop', 'mask'], id)
      const asset = text(sprite.asset, `${id}.asset`); if (!Object.hasOwn(assets, asset)) throw Error(`${id}: unknown asset`)
      result.sprite = { asset, order: number(sprite.order, id) }
      if (sprite.crop != null) {
        const crop = array(sprite.crop, `${id}.crop`); if (crop.length !== 4) throw Error(`${id}: crop needs four numbers`)
        const [x,y,width,height] = crop.map(v => number(v, id))
        if (x < 0 || y < 0 || width <= 0 || height <= 0 || x+width > assets[asset].width || y+height > assets[asset].height) throw Error(`${id}: crop outside asset`)
        result.sprite.crop = [x,y,width,height]
      }
      if (sprite.mask != null) {
        const points = array(sprite.mask, `${id}.mask`); if (points.length < 3) throw Error(`${id}: mask needs polygon`)
        result.sprite.mask = points.map(point => { const pair = array(point, id); if (pair.length !== 2) throw Error(`${id}: invalid mask point`); return [number(pair[0], id), number(pair[1], id)] })
      }
    }
    ids.add(id); return result
  })
  if (nodes.length === 0) throw Error('Animation requires nodes')
  const clips: AnimationPackage['clips'] = {}
  for (const [id, raw] of Object.entries(object(root.clips, 'clips'))) {
    text(id, 'clip ID'); const clip = object(raw, id); fields(clip, ['duration', 'loop', 'visibility', 'tracks'], id)
    const duration = positive(clip.duration, id), visibility: Record<string, boolean> = {}
    for (const [node, visible] of Object.entries(object(clip.visibility, id))) { if (!ids.has(node)) throw Error(`${id}: unknown visibility node`); visibility[node] = boolean(visible, id) }
    const used = new Set<string>()
    const tracks: AnimationPackage['clips'][string]['tracks'] = array(clip.tracks, id).map(rawTrack => {
      const track = object(rawTrack, id); fields(track, ['node', 'property', 'interpolation', 'keys'], id)
      const node = text(track.node, id); if (!ids.has(node)) throw Error(`${id}: unknown track node`)
      if (typeof track.property !== 'string' || ![...properties, 'visible'].includes(track.property)) throw Error(`${id}: unknown track property`)
      const property = track.property as AnimationProperty
      if (track.interpolation !== 'linear' && track.interpolation !== 'step') throw Error(`${id}: unknown interpolation`)
      if (property === 'visible' && track.interpolation !== 'step') throw Error(`${id}: visibility must use step interpolation`)
      const key = `${node}.${property}`; if (used.has(key)) throw Error(`${id}: duplicate track`); used.add(key)
      let last = -1
      const keys = array(track.keys, id).map(rawKey => {
        const keyframe = object(rawKey, id); fields(keyframe, ['time', 'value'], id)
        const time = number(keyframe.time, id); if (time < 0 || time > duration || time <= last) throw Error(`${id}: unordered or out-of-range keys`); last = time
        const value = property === 'visible' ? boolean(keyframe.value, id) : number(keyframe.value, id)
        if ((property === 'scaleX' || property === 'scaleY') && Number(value) <= 0) throw Error(`${id}: scale must be positive`)
        return { time, value }
      })
      if (keys.length === 0 || keys[0].time !== 0) throw Error(`${id}: tracks must start at zero`)
      return { node, property, interpolation: track.interpolation, keys }
    })
    clips[id] = { duration, loop: boolean(clip.loop, id), visibility, tracks }
  }
  const rawStates = object(root.states, 'states'); fields(rawStates, animationStates, 'states')
  const states = Object.fromEntries(animationStates.map(state => { const clip = text(rawStates[state], state); if (!Object.hasOwn(clips, clip)) throw Error(`${state}: unknown clip`); return [state, clip] })) as AnimationPackage['states']
  const pairs = new Set<string>()
  const transitions: AnimationPackage['transitions'] = array(root.transitions, 'transitions').map(raw => {
    const transition = object(raw, 'transition'); fields(transition, ['from', 'to', 'clip'], 'transition')
    if (!animationStates.includes(transition.from as AnimationState) || !animationStates.includes(transition.to as AnimationState)) throw Error('Unknown transition state')
    const clip = text(transition.clip, 'transition clip'); if (!Object.hasOwn(clips, clip) || clips[clip].loop) throw Error('Transition clip must exist and not loop')
    const from = transition.from as AnimationState, to = transition.to as AnimationState, pair = `${from}:${to}`
    if (from === to || pairs.has(pair)) throw Error('Duplicate or self transition'); pairs.add(pair)
    return { from, to, clip }
  })
  return { schemaVersion: 1, canvas: canvasSize, assets, nodes, clips, states, transitions }
}
