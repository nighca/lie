import type { AnimationClip, AnimationPackage, AnimationPose, AnimationState, Transform } from './types'

const channels: readonly (keyof Transform)[] = ['x', 'y', 'pivotX', 'pivotY', 'rotation', 'scaleX', 'scaleY']

export function sampleClip(data: AnimationPackage, clip: AnimationClip, seconds: number): AnimationPose {
  const time = clip.loop ? ((seconds % clip.duration) + clip.duration) % clip.duration : Math.min(Math.max(seconds, 0), clip.duration)
  const pose: AnimationPose = Object.fromEntries(data.nodes.map(node => [node.id, { transform: { ...node.transform }, visible: Object.hasOwn(clip.visibility, node.id) ? clip.visibility[node.id] : node.visible }]))
  for (const track of clip.tracks) {
    let index = 0
    while (index + 1 < track.keys.length && track.keys[index + 1].time <= time) index++
    const left = track.keys[index], right = track.keys[index + 1]
    let value = left.value
    if (track.interpolation === 'linear' && right != null) value = Number(left.value) + (Number(right.value) - Number(left.value)) * (time - left.time) / (right.time - left.time)
    if (track.property === 'visible') pose[track.node].visible = Boolean(value)
    else pose[track.node].transform[track.property] = Number(value)
  }
  return pose
}

export function blendPoses(from: AnimationPose, to: AnimationPose, progress: number): AnimationPose {
  return Object.fromEntries(Object.entries(to).map(([id, node]) => {
    const transform = { ...node.transform }
    for (const channel of channels) transform[channel] = from[id].transform[channel] + (node.transform[channel] - from[id].transform[channel]) * progress
    return [id, { transform, visible: node.visible }]
  }))
}

/** Host-independent clock. Dedicated transition clips play once; absent transitions settle shared transforms in 240 ms. */
export class AnimationTimeline {
  private state: AnimationState = 'default'
  private elapsed = 0
  private transitionClip: string | null = null
  private blendFrom: AnimationPose | null = null
  constructor(private readonly data: AnimationPackage, state: AnimationState = 'default') { this.state = state }
  setState(state: AnimationState) {
    if (state === this.state) return
    const previous = this.pose()
    this.transitionClip = this.data.transitions.find(item => item.from === this.state && item.to === state)?.clip ?? null
    this.blendFrom = this.transitionClip == null ? previous : null
    this.state = state
    this.elapsed = 0
  }
  advance(seconds: number): AnimationPose {
    if (!Number.isFinite(seconds) || seconds < 0) throw Error('Animation delta must be finite and nonnegative')
    this.elapsed += seconds
    if (this.transitionClip != null && this.elapsed >= this.data.clips[this.transitionClip].duration) {
      this.elapsed -= this.data.clips[this.transitionClip].duration
      this.transitionClip = null
      this.blendFrom = null
    }
    return this.pose()
  }
  private pose(): AnimationPose {
    const clip = this.data.clips[this.transitionClip ?? this.data.states[this.state]]
    const target = sampleClip(this.data, clip, this.elapsed)
    if (this.blendFrom == null || this.elapsed >= .24) return target
    return blendPoses(this.blendFrom, target, this.elapsed / .24)
  }
}
