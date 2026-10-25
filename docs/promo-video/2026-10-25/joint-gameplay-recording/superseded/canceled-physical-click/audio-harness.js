(() => {
  const NativeContext = window.AudioContext;
  const NativeSocket = window.WebSocket;
  const nativeConnect = AudioNode.prototype.connect;
  const nativeGetUserMedia = navigator.mediaDevices.getUserMedia;
  const ownedContexts = new Set();
  const ownedTracks = new Set();
  const ownedNodes = new Set();
  const ownedPorts = new Set();
  const ownedSources = new Set();
  const ownedUrls = new Set();
  const ownedSockets = new Set();
  const events = [];
  const pcmChunks = { input: [], output: [], mix: [] };
  let control = null;
  let inputGain = null;
  let outputGain = null;
  let mixBus = null;
  let virtualMic = null;
  let prepared = null;
  const questions = new Map();
  let pcmStart = 0;
  let pcmEnd = 0;
  let started = null;
  let stopped = true;
  let closed = false;
  let cleanupPromise = null;
  let deadline = null;
  let socketCount = 0;
  let muted = true;
  const outputSinks = new Map();
  const tapped = new WeakSet();
  const stamp = () => Date.now();
  function trackContext(ctx) { ownedContexts.add(ctx); return ctx; }
  function trackStream(stream) { for (const t of stream.getTracks()) ownedTracks.add(t); return stream; }
  function trackNode(node) { ownedNodes.add(node); return node; }
  function recordEvent(type, details = {}) { events.push({ type, at: stamp(), ...details }); }
  function stop() {
    if (stopped) return;
    pcmEnd = Math.floor(control.currentTime * control.sampleRate);
    stopped = true;
    recordEvent('record-stop', { contextTime: control.currentTime });
  }
  function cleanup(reason = 'cleanup') {
    if (cleanupPromise) return cleanupPromise;
    closed = true;
    const end = [...document.querySelectorAll('.lie-voice__actions button')].find(button => ['结束对话', '取消连接'].includes(button.textContent.trim()));
    try { end?.click(); } catch {}
    stop();
    if (deadline != null) { clearTimeout(deadline); deadline = null; }
    AudioNode.prototype.connect = nativeConnect;
    navigator.mediaDevices.getUserMedia = nativeGetUserMedia;
    window.AudioContext = NativeContext;
    window.WebSocket = NativeSocket;
    document.getElementById('lie-recording-audio-panel')?.remove();
    cleanupPromise = (async () => {
      for (const socket of ownedSockets) { try { socket.close(1000, reason.slice(0, 80)); } catch {} }
      for (const source of ownedSources) { try { source.stop(); } catch {} }
      for (const port of ownedPorts) { try { port.onmessage = null; port.close(); } catch {} }
      for (const node of ownedNodes) { try { node.disconnect(); } catch {} }
      for (const track of ownedTracks) { try { track.stop(); } catch {} }
      for (const url of ownedUrls) { try { URL.revokeObjectURL(url); } catch {} }
      const results = await Promise.allSettled([...ownedContexts].map(ctx => ctx.state === 'closed' ? Promise.resolve() : ctx.close()));
      await Promise.allSettled([...ownedSockets].map(socket => socket.readyState === 3 ? Promise.resolve() : new Promise(resolve => { const timer=setTimeout(resolve,2000); socket.addEventListener('close',()=>{clearTimeout(timer);resolve()},{once:true}); })));
      recordEvent('cleanup', { reason, sockets: [...ownedSockets].map(socket => socket.readyState), contexts: [...ownedContexts].map(ctx => ctx.state), tracks: [...ownedTracks].map(t => t.readyState), errors: results.filter(r => r.status === 'rejected').length });
    })();
    return cleanupPromise;
  }
  function tee(node) {
    if (tapped.has(node)) return;
    tapped.add(node);
    recordEvent('output-tap', { node: node.constructor.name });
    let sink = outputSinks.get(node.context);
    if (!sink) {
      sink = trackNode(node.context.createMediaStreamDestination());
      trackStream(sink.stream);
      const source = trackNode(control.createMediaStreamSource(sink.stream));
      nativeConnect.call(source, outputGain);
      outputSinks.set(node.context, sink);
    }
    nativeConnect.call(node, sink);
  }
  async function prepare(base64) {
    try {
      if (closed) throw new Error('Recording session closed');
      const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      prepared = await control.decodeAudioData(bytes.buffer);
      const url = URL.createObjectURL(new Blob([`class LieRecordingPcm extends AudioWorkletProcessor { process(inputs) { const samples=new Float32Array(inputs[0]?.[0] ?? 128); this.port.postMessage({frame:currentFrame,samples},[samples.buffer]); return true; } } registerProcessor('lie-recording-pcm',LieRecordingPcm);`], { type: 'application/javascript' }));
      ownedUrls.add(url);
      await control.audioWorklet.addModule(url);
      URL.revokeObjectURL(url); ownedUrls.delete(url);
      if (closed) throw new Error('Recording session closed during prepare');
      const silence = trackNode(control.createGain()); silence.gain.value = 0; silence.connect(control.destination);
      for (const [name, source] of Object.entries({ input: inputGain, output: outputGain, mix: mixBus })) {
        const node = trackNode(new AudioWorkletNode(control, 'lie-recording-pcm', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1], channelCount: 1, channelCountMode: 'explicit' }));
        ownedPorts.add(node.port);
        node.port.onmessage = e => { if (started != null && !stopped) pcmChunks[name].push(e.data); };
        source.connect(node); node.connect(silence);
      }
      recordEvent('prepared', { duration: prepared.duration, sampleRate: control.sampleRate });
      return { duration: prepared.duration, sampleRate: control.sampleRate };
    } catch (error) { await cleanup('prepare-failed'); throw error; }
  }
  async function start() {
    try {
      if (closed || !prepared) throw new Error('Recording not prepared');
      if (started != null) throw new Error('Recording is single use');
      await control.resume();
      if (closed) throw new Error('Recording closed');
      const silenceSource = trackNode(control.createConstantSource());
      silenceSource.offset.value = 0; silenceSource.connect(virtualMic); silenceSource.start(); ownedSources.add(silenceSource);
      started = stamp(); stopped = false;
      pcmStart = Math.ceil(control.currentTime * control.sampleRate / 128) * 128;
      recordEvent('record-start', { contextTime: control.currentTime });
      deadline = setTimeout(() => { void cleanup('90-second-deadline'); }, 90000);
      return { started };
    } catch (error) { await cleanup('start-failed'); throw error; }
  }
  async function question() {
    try {
      if (closed || stopped) throw new Error('Recording not running');
      await control.resume();
      const source = trackNode(control.createBufferSource()); ownedSources.add(source);
      source.buffer = prepared; source.connect(virtualMic); source.connect(inputGain);
      recordEvent('question', { duration: prepared.duration, contextTime: control.currentTime });
      source.start();
      return { duration: prepared.duration };
    } catch (error) { await cleanup('question-failed'); throw error; }
  }
  function exportPcm(name) {
    if (!stopped) throw new Error('Stop recording before export');
    if (!(name in pcmChunks)) throw new Error('Unknown recording track');
    const rate = control.sampleRate;
    const count = started == null ? 0 : Math.max(0, pcmEnd - pcmStart);
    const buffer = new ArrayBuffer(44 + count * 2); const view = new DataView(buffer);
    const text = (offset, value) => { for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i)); };
    text(0, 'RIFF'); view.setUint32(4, 36 + count * 2, true); text(8, 'WAVE'); text(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); text(36, 'data'); view.setUint32(40, count * 2, true);
    for (const chunk of pcmChunks[name]) for (let i = 0; i < chunk.samples.length; i++) { const at = chunk.frame + i - pcmStart; if (at >= 0 && at < count) { const s = Math.max(-1, Math.min(1, chunk.samples[i])); view.setInt16(44 + at * 2, Math.round(s * (s < 0 ? 32768 : 32767)), true); } }
    let value = ''; for (const b of new Uint8Array(buffer)) value += String.fromCharCode(b);
    return { base64: btoa(value), samples: count, sampleRate: rate, seconds: count / rate };
  }
  try {
    control = trackContext(new NativeContext());
    inputGain = trackNode(control.createGain()); outputGain = trackNode(control.createGain()); mixBus = trackNode(control.createGain());
    inputGain.gain.value = .8; outputGain.gain.value = .8; inputGain.connect(mixBus); outputGain.connect(mixBus);
    virtualMic = trackNode(control.createMediaStreamDestination()); trackStream(virtualMic.stream);
    window.AudioContext = new Proxy(NativeContext, { construct(target, args) { return trackContext(Reflect.construct(target, args)); } });
    AudioNode.prototype.connect = function(destination, ...rest) {
      if (this.context !== control && destination === this.context.destination) { tee(this); if (muted) return destination; }
      return nativeConnect.call(this, destination, ...rest);
    };
    navigator.mediaDevices.getUserMedia = async function(constraints) {
      try {
        if (closed || !constraints?.audio || constraints.video) throw new DOMException('Recording input is audio only', 'NotSupportedError');
        await control.resume();
        if (closed) throw new Error('Recording closed');
        recordEvent('virtual-mic-request');
        return trackStream(virtualMic.stream.clone());
      } catch (error) { await cleanup('input-failed'); throw error; }
    };
    const api = { prepare, start, question, stop, cleanup, exportPcm, events, mark: name => recordEvent('phase', {name}), loadQuestion: async (name, base64) => { const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0)); const decoded=await control.decodeAudioData(bytes.buffer); questions.set(name,decoded); return {name,duration:decoded.duration}; }, selectQuestion: name => {if(!questions.has(name))throw new Error('Unknown prepared question');prepared=questions.get(name);}, monitor: enabled => { muted = !enabled; }, status: () => ({ closed, stopped, socketCount, sockets: [...ownedSockets].map(socket => socket.readyState), contexts: [...ownedContexts].map(c => c.state), tracks: [...ownedTracks].map(t => t.readyState) }) };
    window.__lieAudioCapture = api;
    const panel = document.createElement('section'); panel.id = 'lie-recording-audio-panel'; panel.style.cssText = 'position:fixed;bottom:20px;left:20px;padding:16px;background:white;border:3px solid #172c4c;border-radius:12px;z-index:2147483647;font:16px sans-serif';
    panel.innerHTML = '<strong>短测录音 · 最多90秒</strong><button type="button" style="margin-left:12px">准备有声录制</button><span role="status">待开始</span>';
    panel.querySelector('button').onclick = () => { void start().then(() => { panel.remove(); }).catch(error => { panel.querySelector('[role=status]').textContent = error.message; }); };
    document.body.append(panel);
    return { installed: true };
  } catch (error) { void cleanup('install-failed'); throw error; }
})()
