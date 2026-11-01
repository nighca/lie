(() => {
  const NativeAudioContext = window.AudioContext
  const metrics = window.__p0Fake = { fake: true, getUserMedia: 0, tracksStopped: 0, contexts: [], inputContexts: [], resume: [], workletModules:0, playbackStarts:0 }
  const nativeResume = NativeAudioContext.prototype.resume
  NativeAudioContext.prototype.resume = async function (...args) {
    const result = await nativeResume.apply(this, args)
    metrics.resume.push({state:this.state,activation:navigator.userActivation.isActive})
    return result
  }
  window.AudioContext = new Proxy(NativeAudioContext, { construct(target,args) { const context = new target(...args); metrics.contexts.push(context); const addModule=context.audioWorklet.addModule.bind(context.audioWorklet); context.audioWorklet.addModule=(...args)=>{metrics.workletModules++;return addModule(...args)}; const createSource=context.createBufferSource.bind(context); context.createBufferSource=(...args)=>{const source=createSource(...args);const start=source.start.bind(source);source.start=(...args)=>{metrics.playbackStarts++;return start(...args)};return source}; return context } })
  Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { configurable:true, value: async () => {
    metrics.getUserMedia++
    const context = new NativeAudioContext({sampleRate:16000})
    const destination = context.createMediaStreamDestination()
    metrics.inputContexts.push(context)
    for(const track of destination.stream.getTracks()) {
      const original = track.stop.bind(track)
      track.stop = () => { metrics.tracksStopped++; original(); void context.close() }
    }
    await context.resume()
    return destination.stream
  } })
})()
