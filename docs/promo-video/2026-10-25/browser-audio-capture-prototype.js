(() => {
  const NativeContext = window.AudioContext;
  const control = new NativeContext();
  const input = control.createMediaStreamDestination();
  const output = control.createMediaStreamDestination();
  const mix = control.createMediaStreamDestination();
  const mixBus = control.createGain();
  mixBus.connect(mix);
  const inputGain = control.createGain();
  const outputGain = control.createGain();
  inputGain.gain.value = 0.8;
  outputGain.gain.value = 0.8;
  inputGain.connect(input);
  inputGain.connect(mixBus);
  outputGain.connect(output);
  outputGain.connect(mixBus);
  const virtualMic = control.createMediaStreamDestination();
  const nativeConnect = AudioNode.prototype.connect;
  const nativeGetUserMedia = navigator.mediaDevices.getUserMedia;
  const contexts = new Map();
  const connected = new WeakSet();
  const records = {};
  const pcmChunks = {input:[],output:[],mix:[]};
  const pcmNodes = [];
  let pcmStart=0, pcmEnd=0;
  const events = [];
  let muteMonitoring = true;
  let ready = false;
  let started = null;
  let ended = null;
  let stopped = false;
  let prepared;
  const stamp = () => Date.now();
  function tee(node) {
    if (connected.has(node)) return;
    connected.add(node);
    let sink = contexts.get(node.context);
    if (!sink) {
      sink = node.context.createMediaStreamDestination();
      const source = control.createMediaStreamSource(sink.stream);
      nativeConnect.call(source, outputGain);
      contexts.set(node.context, sink);
    }
    nativeConnect.call(node, sink);
  }
  AudioNode.prototype.connect = function(destination, ...rest) {
    if (this.context !== control && destination === this.context.destination) {
      tee(this);
      if (muteMonitoring) return destination;
    }
    return nativeConnect.call(this, destination, ...rest);
  };
  navigator.mediaDevices.getUserMedia = async function(constraints) {
    if (!constraints?.audio || constraints.video) throw new DOMException('Recording input is audio only', 'NotSupportedError');
    events.push({type:'virtual-mic-request',at:stamp()});
    await control.resume();
    return virtualMic.stream.clone();
  };
  async function prepare(base64) {
    const bytes = Uint8Array.from(atob(base64), c=>c.charCodeAt(0));
    prepared = await control.decodeAudioData(bytes.buffer);
    const module = URL.createObjectURL(new Blob([`class LieRecordingPcm extends AudioWorkletProcessor { process(inputs) { const channel=inputs[0]?.[0]; const samples=new Float32Array(channel ?? 128); this.port.postMessage({frame:currentFrame,samples},[samples.buffer]); return true; } } registerProcessor('lie-recording-pcm',LieRecordingPcm);`],{type:'application/javascript'}));
    await control.audioWorklet.addModule(module);
    URL.revokeObjectURL(module);
    const silence=control.createGain();silence.gain.value=0;silence.connect(control.destination);
    const mixSource=mixBus;
    for(const [name,source] of Object.entries({input:inputGain,output:outputGain,mix:mixSource})) {
      const node=new AudioWorkletNode(control,'lie-recording-pcm',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[1],channelCount:1,channelCountMode:'explicit'});
      node.port.onmessage=e=>{if(started!=null&&!stopped)pcmChunks[name].push(e.data)};
      source.connect(node);node.connect(silence);pcmNodes.push(node);
    }
    ready = true;
    return {duration:prepared.duration,sampleRate:prepared.sampleRate,mime:'audio/webm;codecs=opus',supported:MediaRecorder.isTypeSupported('audio/webm;codecs=opus')};
  }
  async function start() {
    await control.resume();
    if (!ready) throw new Error('Prepare question first');
    started = stamp();
    stopped = false;
    pcmStart=Math.ceil(control.currentTime*control.sampleRate/128)*128;
    for (const [name,sink] of Object.entries({input,output,mix})) {
      const recorder = new MediaRecorder(sink.stream,{mimeType:'audio/webm;codecs=opus',audioBitsPerSecond:128000});
      const chunks=[];
      const finished = new Promise(resolve=>recorder.onstop=()=>resolve(new Blob(chunks,{type:recorder.mimeType})));
      recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
      records[name]={recorder,finished};
      recorder.start(100);
    }
    events.push({type:'record-start',at:started,contextTime:control.currentTime});
  }
  async function question() {
    await control.resume();
    const source=control.createBufferSource();
    source.buffer=prepared;
    source.connect(virtualMic);
    source.connect(inputGain);
    const at=stamp();
    events.push({type:'question',at,duration:prepared.duration,contextTime:control.currentTime});
    source.start();
    return {at,duration:prepared.duration};
  }
  async function calibration() {
    await start();
    const mic = await navigator.mediaDevices.getUserMedia({audio:true});
    const captureContext=new NativeContext();
    const micSource=captureContext.createMediaStreamSource(mic);
    const analyser=captureContext.createAnalyser();
    const silence=captureContext.createGain();
    silence.gain.value=0;
    micSource.connect(analyser);
    analyser.connect(silence);
    silence.connect(captureContext.destination);
    await captureContext.resume();
    await question();
    await new Promise(r=>setTimeout(r,prepared.duration*1000+400));
    const samples=new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(samples);
    const playbackContext=new NativeContext();
    const tone=playbackContext.createOscillator();
    const gain=playbackContext.createGain();
    tone.frequency.value=660;
    gain.gain.value=.12;
    tone.connect(gain);
    gain.connect(playbackContext.destination);
    await playbackContext.resume();
    events.push({type:'calibration-tone',at:stamp(),frequency:660,duration:1});
    tone.start();tone.stop(playbackContext.currentTime+1);
    await new Promise(r=>setTimeout(r,1400));
    await stop();
    mic.getTracks().forEach(t=>t.stop());
    await captureContext.close();
    await playbackContext.close();
    return {started,ended,events,contexts:contexts.size};
  }
  async function stop() {
    if (stopped) return;
    pcmEnd=Math.floor(control.currentTime*control.sampleRate);
    stopped=true;
    ended=stamp();
    for(const value of Object.values(records))value.recorder.stop();
    await Promise.all(Object.values(records).map(v=>v.finished));
    events.push({type:'record-stop',at:ended});
  }
  async function exportTrack(name) {
    const blob=await records[name].finished;
    const bytes=new Uint8Array(await blob.arrayBuffer());
    let str='';for(const b of bytes)str+=String.fromCharCode(b);
    return {base64:btoa(str),bytes:bytes.length,mime:blob.type};
  }
  async function exportPcm(name) {
    const count=Math.max(0,pcmEnd-pcmStart);
    const buffer=new ArrayBuffer(44+count*2);const view=new DataView(buffer);
    const text=(offset,value)=>{for(let i=0;i<value.length;i++)view.setUint8(offset+i,value.charCodeAt(i))};
    text(0,'RIFF');view.setUint32(4,36+count*2,true);text(8,'WAVE');text(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,control.sampleRate,true);view.setUint32(28,control.sampleRate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);text(36,'data');view.setUint32(40,count*2,true);
    for(const chunk of pcmChunks[name])for(let i=0;i<chunk.samples.length;i++){const at=chunk.frame+i-pcmStart;if(at>=0&&at<count){const sample=Math.max(-1,Math.min(1,chunk.samples[i]));view.setInt16(44+at*2,Math.round(sample*(sample<0?32768:32767)),true)}}
    const bytes=new Uint8Array(buffer);let value='';for(const b of bytes)value+=String.fromCharCode(b);
    return {base64:btoa(value),samples:count,sampleRate:control.sampleRate,seconds:count/control.sampleRate};
  }
  async function cleanup() {
    AudioNode.prototype.connect=nativeConnect;
    navigator.mediaDevices.getUserMedia=nativeGetUserMedia;
    await stop();
    for(const sink of [input,output,mix,virtualMic,...contexts.values()])sink.stream.getTracks().forEach(t=>t.stop());
    for(const node of pcmNodes){node.disconnect();node.port.close()}
    await control.close();
    document.getElementById('lie-audio-test-panel')?.remove();
    delete window.__lieAudioCapture;
  }
  window.__lieAudioCapture={prepare,start,question,stop,exportTrack,exportPcm,cleanup,calibration,events,monitor:enabled=>{muteMonitoring=!enabled}};
  const panel=document.createElement('section');
  panel.id='lie-audio-test-panel';
  panel.style.cssText='position:fixed;bottom:24px;left:24px;background:white;color:#172c4c;border:3px solid #172c4c;border-radius:16px;padding:20px;z-index:2147483647;font:16px sans-serif';
  panel.innerHTML='<strong>录音链测试 · 不连接 AI</strong><p>输入：合成提问　输出：660Hz 校准音</p><button type="button">运行离线双轨测试</button><p role="status">准备就绪</p>';
  panel.querySelector('button').onclick=()=>calibration().then(()=>panel.querySelector('[role=status]').textContent='双轨测试完成').catch(e=>panel.querySelector('[role=status]').textContent='测试失败：'+e.message);
  document.documentElement.append(panel);
  return {installed:true};
})()
