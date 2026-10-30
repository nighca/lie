/** Streaming mono resampling by weighted sample averaging; output is PCM16LE 16kHz/20ms. */
export function createPcmEncoder(inputSampleRate        , onFrame                             ) {
  if (!Number.isFinite(inputSampleRate) || inputSampleRate < 16000) throw new Error('Microphone sample rate must be at least 16kHz')
  const ratio = inputSampleRate / 16000
  let weight = 0
  let sum = 0
  let frame = new Uint8Array(640)
  let offset = 0

  function write(sample        ) {
    const clamped = Math.max(-1, Math.min(1, sample))
    const value = Math.round(clamped * (clamped < 0 ? 32768 : 32767))
    new DataView(frame.buffer).setInt16(offset, value, true)
    offset += 2
    if (offset === frame.byteLength) {
      onFrame(frame)
      frame = new Uint8Array(640)
      offset = 0
    }
  }

  return {
    push(samples              ) {
      for (const sample of samples) {
        let remaining = 1
        while (remaining > 1e-10) {
          const take = Math.min(remaining, ratio - weight)
          sum += (Number.isFinite(sample) ? sample : 0) * take
          weight += take
          remaining -= take
          if (weight >= ratio - 1e-10) {
            write(sum / ratio)
            sum = 0
            weight = 0
          }
        }
      }
    },
    /** Pad the final partial frame with silence, then reset for another recording. */
    flush() {
      if (weight > 0) write(sum / weight)
      sum = 0
      weight = 0
      if (offset > 0) {
        onFrame(frame)
        frame = new Uint8Array(640)
        offset = 0
      }
    }
  }
}

export function decodePcm16(data            )                            {
  if (data.byteLength % 2 !== 0) throw new Error('PCM16 requires complete samples')
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  const samples = new Float32Array(data.byteLength / 2)
  for (let i = 0; i < samples.length; i++) samples[i] = view.getInt16(i * 2, true) / 32768
  return samples
}
