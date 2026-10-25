export type BaseAnimationState = 'default' | 'listening' | 'waiting' | 'speaking'
export type ResultAnimationState = 'accusedCorrectly' | 'accusedWrongly'
export type AnimationState = BaseAnimationState | ResultAnimationState
export interface Transform { x: number; y: number; pivotX: number; pivotY: number; rotation: number; scaleX: number; scaleY: number }
export interface AnimationAsset { src: string; width: number; height: number }
export interface AnimationSprite { asset: string; order: number; crop?: [number, number, number, number]; mask?: [number, number][] }
export interface AnimationNode { id: string; parent: string | null; transform: Transform; visible: boolean; sprite?: AnimationSprite }
export type AnimationProperty = keyof Transform | 'visible'
export interface AnimationTrack { node: string; property: AnimationProperty; interpolation: 'linear' | 'step'; keys: { time: number; value: number | boolean }[] }
export interface AnimationClip { duration: number; loop: boolean; visibility: Record<string, boolean>; tracks: AnimationTrack[] }
export interface AnimationTransition { from: BaseAnimationState; to: BaseAnimationState; clip: string }
export interface AnimationPackage {
  schemaVersion: 1 | 2
  canvas: { width: number; height: number }
  assets: Record<string, AnimationAsset>
  nodes: AnimationNode[]
  clips: Record<string, AnimationClip>
  states: Record<BaseAnimationState, string> & Partial<Record<ResultAnimationState, string>>
  transitions: AnimationTransition[]
}
export interface PoseNode { transform: Transform; visible: boolean }
export type AnimationPose = Record<string, PoseNode>
