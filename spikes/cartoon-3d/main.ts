import * as THREE from 'three'

const stage = document.querySelector<HTMLDivElement>('#stage')!
const fallback = document.querySelector<HTMLDivElement>('#fallback')!
const metrics = document.querySelector<HTMLPreElement>('#metrics')!
const startedAt = performance.now()
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
let state = 'idle'
let yaw = 0
let disabled = false
let renderer: THREE.WebGLRenderer | null = null

try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
} catch {
  fallback.hidden = false
  metrics.textContent = 'WebGL 2 初始化失败：已显示静态降级。'
}

if (renderer != null) {
  const activeRenderer = renderer
  activeRenderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
  stage.append(activeRenderer.domElement)
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 30)
  camera.position.set(0, 1.2, 6)
  camera.lookAt(0, 1.1, 0)
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8888aa, 2))
  const light = new THREE.DirectionalLight(0xffffff, 3)
  light.position.set(-3, 5, 4)
  scene.add(light)
  const figure = new THREE.Group()
  scene.add(figure)
  const materials = [0xffc15b, 0x1957ff, 0x15244d, 0xffffff].map(color => new THREE.MeshToonMaterial({ color }))
  const geometry = new THREE.SphereGeometry(1, 24, 16)
  function part(parent: THREE.Object3D, color: number, position: number[], scale: number[]) {
    const mesh = new THREE.Mesh(geometry, materials[color])
    mesh.position.set(position[0], position[1], position[2])
    mesh.scale.set(scale[0], scale[1], scale[2])
    parent.add(mesh)
    return mesh
  }
  part(figure, 1, [0, 0.4, 0], [0.68, 0.75, 0.38])
  const head = new THREE.Group()
  head.position.y = 1.55
  figure.add(head)
  part(head, 0, [0, 0, 0], [0.62, 0.68, 0.5])
  part(head, 2, [0, 0.48, -0.08], [0.61, 0.28, 0.48])
  for (const x of [-0.22, 0.22]) {
    part(head, 3, [x, 0.06, 0.45], [0.13, 0.16, 0.06])
    part(head, 2, [x + 0.02, 0.06, 0.5], [0.055, 0.085, 0.035])
    part(head, 0, [x < 0 ? -0.62 : 0.62, 0, 0], [0.12, 0.19, 0.12])
  }
  part(head, 0, [0, -0.1, 0.51], [0.12, 0.13, 0.12])
  const mouth = part(head, 2, [0, -0.32, 0.45], [0.18, 0.045, 0.04])
  const arm = new THREE.Group()
  arm.position.set(-0.6, 0.85, 0)
  figure.add(arm)
  part(arm, 1, [0, -0.25, 0], [0.19, 0.42, 0.2])
  part(arm, 0, [0, -0.62, 0], [0.19, 0.2, 0.18])
  part(figure, 1, [0.64, 0.5, 0], [0.19, 0.43, 0.2])
  part(figure, 0, [0.64, 0.1, 0], [0.19, 0.2, 0.18])
  const resize = new ResizeObserver(() => {
    const { width, height } = stage.getBoundingClientRect()
    activeRenderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  })
  resize.observe(stage)
  let firstFrameMs: number | null = null
  let previous = 0
  let samples: number[] = []
  let lastReport = 0
  function render(time: number) {
    if (disabled || document.hidden) {
      previous = 0
      return
    }
    const t = time / 1000
    figure.rotation.y = yaw
    figure.position.y = reducedMotion ? 0 : Math.sin(t * 2) * 0.025
    head.rotation.z = state === 'listening' ? 0.15 : 0
    head.rotation.x = state === 'listening' ? -0.08 : 0
    arm.rotation.z = state === 'listening' ? -2.2 : state === 'speaking' ? -0.8 : -0.12
    mouth.scale.y = state === 'speaking' ? (reducedMotion ? 0.1 : 0.06 + Math.abs(Math.sin(t * 8)) * 0.12) : 0.045
    activeRenderer.render(scene, camera)
    if (firstFrameMs == null) firstFrameMs = performance.now() - startedAt
    if (previous !== 0) samples.push(time - previous)
    previous = time
    if (time - lastReport > 1000) {
      const sorted = samples.slice().sort((a, b) => a - b)
      const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0
      const mean = samples.reduce((sum, value) => sum + value, 0) / Math.max(1, samples.length)
      metrics.textContent = `WebGL 2 · ${state} · 旋转 ${Math.round(yaw * 180 / Math.PI)}°\n首帧（模块执行起）${firstFrameMs.toFixed(1)} ms · RAF 平均 ${mean.toFixed(1)} ms / P95 ${p95.toFixed(1)} ms\nDraw calls ${activeRenderer.info.render.calls} · Triangles ${activeRenderer.info.render.triangles} · DPR ${activeRenderer.getPixelRatio()}\n仅占位场景，不代表正式资产 / 低端设备性能；隐藏页面暂停。`
      samples = []
      lastReport = time
    }
  }
  function showFallback() {
    disabled = true
    activeRenderer.setAnimationLoop(null)
    activeRenderer.domElement.hidden = true
    fallback.hidden = false
    metrics.textContent = '静态降级已启用；无音频、供应商或游戏状态依赖。'
  }
  activeRenderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault()
    showFallback()
  })
  document.querySelector('#fallbackButton')!.addEventListener('click', showFallback)
  document.querySelector('#restore')!.addEventListener('click', () => {
    if (activeRenderer.getContext().isContextLost()) {
      metrics.textContent = '真实 GPU context 丢失：保留静态降级，请刷新重试。'
      return
    }
    disabled = false
    previous = 0
    fallback.hidden = true
    activeRenderer.domElement.hidden = false
    activeRenderer.setAnimationLoop(render)
  })
  document.querySelectorAll<HTMLButtonElement>('[data-state]').forEach(button => {
    button.addEventListener('click', () => {
      state = button.dataset.state!
      document.querySelectorAll('[data-state]').forEach(item => item.setAttribute('aria-pressed', String(item === button)))
    })
  })
  document.querySelector<HTMLInputElement>('#rotation')!.addEventListener('input', event => {
    yaw = Number((event.target as HTMLInputElement).value) * Math.PI / 180
  })
  activeRenderer.setAnimationLoop(render)
  addEventListener('pagehide', () => {
    activeRenderer.setAnimationLoop(null)
    resize.disconnect()
    geometry.dispose()
    materials.forEach(material => material.dispose())
    activeRenderer.dispose()
  }, { once: true })
}
