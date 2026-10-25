import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { readAnimationPackage } from '../../../packages/character-animation/src/package.ts'
import { sampleClip } from '../../../packages/character-animation/src/playback.ts'

const sources = JSON.parse(process.argv[2])
for (const { root, ids } of sources) for (const id of ids) {
  const data = readAnimationPackage(JSON.parse(fs.readFileSync(path.join(root, 'design/animation-candidates', id, 'package.json'))))
  let checked = 0
  const states = id === 'mint-puffs' ? ['default', 'listening', 'waiting'] : id === 'ochre-freckles' ? ['waiting', 'speaking'] : ['waiting']
  for (const state of states) {
    const clip = data.clips[data.states[state]]
    assert.equal(clip.tracks.filter(track => track.property === 'scaleX' || track.property === 'scaleY').length, 0)
    const sizes = new Map()
    let stateChecks = 0
    for (let i = 0; i <= 240; i++) {
      const pose = sampleClip(data, clip, i * clip.duration / 240)
      for (const node of data.nodes.filter(node => node.sprite && /^(head|waiting-head|head-(?:default|listening|waiting|speaking)|chin-contact)$/.test(node.id) && pose[node.id].visible)) {
        let current = node, scale = 1
        while (current != null) {
          const transform = pose[current.id].transform
          assert(Math.abs(transform.scaleX - transform.scaleY) < 1e-12)
          scale *= transform.scaleX
          current = data.nodes.find(parent => parent.id === current.parent) ?? null
        }
        const previous = sizes.get(node.id)
        if (previous == null) sizes.set(node.id, scale)
        else assert(Math.abs(previous - scale) < 1e-12)
        checked++
        stateChecks++
      }
    }
    assert(stateChecks >= 241)
  }
  assert(checked >= 241)
  console.log(`${id}: ${checked} real sampler head ancestry samples retain uniform constant scale; target clips contain no scaling tracks`)
}
