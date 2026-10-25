import subprocess,tempfile,pathlib,hashlib,json,re
rows=[]
def get(path):
 with tempfile.TemporaryDirectory() as d:
  b=pathlib.Path(d)/'body';h=pathlib.Path(d)/'headers'
  final=subprocess.check_output(['curl','--fail','--silent','--show-error','--location','--max-time','30','--dump-header',str(h),'--output',str(b),'--write-out','%{url_effective}','https://lie.agency'+path],text=True)
  raw=h.read_text().strip().split('\n\n')[-1].splitlines();headers={k.lower():v.strip() for line in raw[1:] if ':' in line for k,v in [line.split(':',1)]};body=b.read_bytes()
  local=pathlib.Path('apps/web/dist/index.html') if path=='/' else pathlib.Path('apps/web/dist')/path.lstrip('/')
  row={'path':path,'status':int(raw[0].split()[1]),'finalUrl':final,'sha256':hashlib.sha256(body).hexdigest(),'bytes':len(body),'mime':headers.get('content-type'),'cacheControl':headers.get('cache-control'),'localCandidateEqual':body==local.read_bytes()};rows.append(row)
  assert row['status']==200 and final=='https://lie.agency'+path and row['localCandidateEqual']
  return body
html=get('/');js=re.findall(r'<script[^>]+src="([^"]+\.js)"',html.decode());assert len(js)==1
get(js[0]);assert 'immutable' in rows[-1]['cacheControl']
print(json.dumps({'origin':'https://lie.agency','rows':rows,'scope':'Exactly homepage and its JS; no browser/voice/API/provider. Other static identity reused from a0e.'},indent=2))
