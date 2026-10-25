import urllib.request,hashlib,json,re,subprocess
origin='https://lie.agency'
rows=[]
def get(path):
 import tempfile,pathlib
 with tempfile.TemporaryDirectory(prefix='lie-static-') as directory:
  body=pathlib.Path(directory)/'body';headers=pathlib.Path(directory)/'headers'
  final=subprocess.check_output(['curl','--fail','--silent','--show-error','--location','--max-time','30','--dump-header',str(headers),'--output',str(body),'--write-out','%{url_effective}',origin+path],text=True)
  raw=headers.read_text().strip().split('\n\n')[-1].splitlines();status=int(raw[0].split()[1]);h={k.lower():v.strip() for line in raw[1:] if ':' in line for k,v in [line.split(':',1)]};b=body.read_bytes()
  row={'path':path,'status':status,'finalUrl':final,'mime':h.get('content-type','').split(';')[0],'cacheControl':h.get('cache-control'),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()};rows.append(row)
  assert status==200 and final==origin+path
  return b,row
html,home=get('/')
for path in ['/editor','/?game=duck-finale']:get(path)
refs=re.findall(r'(?:src|href)="([^" ]+\.(?:js|css))"',html.decode())
assert refs
js=''
for path in refs:
 assert path.startswith('/assets/')
 b,r=get(path);assert 'immutable' in (r['cacheControl'] or '')
 if path.endswith('.js'):js+=b.decode()
manifestPaths=set(re.findall(r'/static/[a-f0-9]{64}/appearances/manifest\.json',js));assert len(manifestPaths)==1,manifestPaths
b,r=get(next(iter(manifestPaths)));assert r['sha256']==r['path'].split('/')[2] and 'immutable' in (r['cacheControl'] or '')
manifest=json.loads(b);assert len(manifest)==8
for path in [manifest[0]['avatar'],manifest[0]['portrait']]:
 b,r=get(path);assert r['mime']=='image/webp' and b[:4]==b'RIFF' and b[8:12]==b'WEBP' and 'immutable' in (r['cacheControl'] or '')
 assert r['sha256']==path.split('/')[2]
print(json.dumps({'origin':origin,'rows':rows,'presets':len(manifest),'scope':'Read-only HTTPS HTML/static routes and content/hash/cache; no browser, game interaction, voice/API/WS or provider'},indent=2))
