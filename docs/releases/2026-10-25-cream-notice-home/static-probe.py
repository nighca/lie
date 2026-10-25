import subprocess,tempfile,pathlib,hashlib,json,re
rows=[]
def get(path):
 with tempfile.TemporaryDirectory() as d:
  b=pathlib.Path(d)/'body';h=pathlib.Path(d)/'headers'
  final=subprocess.check_output(['curl','--fail','--silent','--show-error','--location','--max-time','30','--dump-header',str(h),'--output',str(b),'--write-out','%{url_effective}','https://lie.agency'+path],text=True)
  raw=h.read_text().strip().split('\n\n')[-1].splitlines();headers={k.lower():v.strip() for line in raw[1:] if ':' in line for k,v in [line.split(':',1)]};body=b.read_bytes();row={'path':path,'status':int(raw[0].split()[1]),'finalUrl':final,'sha256':hashlib.sha256(body).hexdigest(),'bytes':len(body),'mime':headers.get('content-type'),'cacheControl':headers.get('cache-control')};rows.append(row)
  assert row['status']==200 and final=='https://lie.agency'+path
  return body.decode()
html=get('/');refs=re.findall(r'(?:src|href)="([^" ]+\.(?:js|css))"',html);assert len(refs)==2
texts={}
for path in refs:
 assert path.startswith('/assets/');texts[path.rsplit('.',1)[1]]=get(path);assert 'immutable' in rows[-1]['cacheControl']
 assert rows[-1]['mime'].startswith('text/javascript' if path.endswith('.js') else 'text/css')
js=texts['js'];css=texts['css'];assert '正在连接…' in js and '连好后再说话' in js and '取消连接' in js and 'voice-connection-notice' in js
checks={'creamNotice':bool(re.search(r'\.voice-connection-notice\{[^}]*background:#fffef7',css)),'notice360':bool(re.search(r'\.voice-connection-notice\{[^}]*width:min\(360px',css)),'homeDesktop621':bool(re.search(r'@media[^{}]*(?:min-width:621px|width>=621px)',css)),'homeViewport':bool(re.search(r'\.home-shell\{[^}]*height:100dvh',css)),'caseScroll':bool(re.search(r'\.case-grid\{[^}]*overflow-y:auto',css)),'reducedMotion':bool(re.search(r'prefers-reduced-motion:reduce',css))}
assert all(checks.values()),checks
print(json.dumps({'origin':'https://lie.agency','rows':rows,'newNoticeCopyPresent':True,'cssRules':checks,'scope':'Exactly HTTPS home/JS/CSS; static identity only. Native voice QA NOT RUN, no browser/provider.'},ensure_ascii=False,indent=2))
