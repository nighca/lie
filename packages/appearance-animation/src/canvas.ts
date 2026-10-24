import type { AnimationPackage, AnimationPose, Transform } from './types'

type Matrix = [number, number, number, number, number, number]
function local(t: Transform): Matrix {
  const r = t.rotation * Math.PI / 180, c = Math.cos(r), s = Math.sin(r)
  const a = c*t.scaleX, b = s*t.scaleX, e = -s*t.scaleY, d = c*t.scaleY
  return [a,b,e,d,t.x-a*t.pivotX-e*t.pivotY,t.y-b*t.pivotX-d*t.pivotY]
}
function multiply(a: Matrix, b: Matrix): Matrix {
  return [a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]]
}

export function createCanvasRenderer(canvas: HTMLCanvasElement, data: AnimationPackage, images: ReadonlyMap<string, CanvasImageSource>) {
  const context = canvas.getContext('2d')
  if (context == null) throw Error('Canvas 2D is unavailable')
  canvas.width = data.canvas.width; canvas.height = data.canvas.height
  const draws = data.nodes.filter(node => node.sprite != null).sort((a,b) => (a.sprite?.order ?? 0) - (b.sprite?.order ?? 0))
  return {
    render(pose: AnimationPose) {
      const matrices = new Map<string, Matrix>(), visible = new Map<string, boolean>()
      context.clearRect(0,0,canvas.width,canvas.height)
      for (const node of data.nodes) {
        const matrix = local(pose[node.id].transform)
        const parent = node.parent == null ? null : matrices.get(node.parent)
        matrices.set(node.id, parent == null ? matrix : multiply(parent, matrix))
        visible.set(node.id, pose[node.id].visible && (node.parent == null || visible.get(node.parent) === true))
      }
      for (const node of draws) {
        const sprite = node.sprite, matrix = matrices.get(node.id)
        if (sprite == null || matrix == null || !visible.get(node.id)) continue
        const image = images.get(sprite.asset); if (image == null) throw Error('Missing decoded animation image')
        context.save(); context.setTransform(...matrix)
        if (sprite.mask != null) {
          context.beginPath(); sprite.mask.forEach(([x,y],i) => i === 0 ? context.moveTo(x,y) : context.lineTo(x,y)); context.closePath(); context.clip()
        }
        if (sprite.crop == null) context.drawImage(image,0,0)
        else context.drawImage(image,...sprite.crop,0,0,sprite.crop[2],sprite.crop[3])
        context.restore()
      }
    },
    dispose() { context.clearRect(0,0,canvas.width,canvas.height) },
  }
}
