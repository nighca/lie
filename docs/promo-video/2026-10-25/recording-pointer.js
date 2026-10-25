(() => {
  const host = document.createElement('div');
  host.id = 'lie-recording-pointer';
  host.setAttribute('aria-hidden', 'true');
  host.setAttribute('popover', 'manual');
  host.style.cssText = 'position:fixed;inset:0;margin:0;padding:0;border:0;width:100vw;height:100vh;background:transparent;pointer-events:none;overflow:hidden';
  const shadow = host.attachShadow({mode:'open'});
  shadow.innerHTML = '<svg id="arrow" width="30" height="38" viewBox="0 0 30 38" style="position:absolute;left:0;top:0;transition:transform 400ms ease-in-out;filter:drop-shadow(0 2px 2px #0005)"><path d="M3 2 L3 29 L10 22 L16 35 L22 32 L16 20 L26 19 Z" fill="white" stroke="#152542" stroke-width="2.3" stroke-linejoin="round"/></svg>';
  document.documentElement.append(host);
  host.showPopover();
  const arrow = shadow.getElementById('arrow');
  function move(event) { arrow.style.transform = `translate(${event.clientX}px,${event.clientY}px)`; }
  function down(event) {
    move(event);
    const ring = document.createElement('div');
    ring.style.cssText = `position:absolute;left:${event.clientX-18}px;top:${event.clientY-18}px;width:36px;height:36px;border:3px solid #165bff;background:#ffce3244;border-radius:50%;box-sizing:border-box`;
    shadow.append(ring);
    ring.animate([{transform:'scale(.4)',opacity:1},{transform:'scale(1.6)',opacity:0}],{duration:650}).onfinish = () => ring.remove();
  }
  document.addEventListener('mousemove',move,true);
  document.addEventListener('mousedown',down,true);
  window.__lieRecordingCleanup = () => {
    document.removeEventListener('mousemove',move,true);
    document.removeEventListener('mousedown',down,true);
    host.remove();
    delete window.__lieRecordingCleanup;
  };
})();
