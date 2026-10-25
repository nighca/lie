import subprocess,tempfile,pathlib,hashlib,json,re
rows=[]
def get(path):
 with tempfile.TemporaryDirectory() as d:
  b=pathlib.Path(d)/'body';h=pathlib.Path(d)/'headers'
  final=subprocess.check_output(['curl','--fail','--silent','--show-error','--location','--max-time','30','--dump-header',str(h),'--output',str(b),'--write-out','%{url_effective}','https://lie.agency'+path],text=True)
  raw=h.read_text().strip().split('\n\n')[-1].splitlines();headers={k.lower():v.strip() for line in raw[1:] if ':' in line for k,v in [line.split(':',1)]};body=b.read_bytes()
  row={'path':path,'status':int(raw[0].split()[1]),'finalUrl':final,'sha256':hashlib.sha256(body).hexdigest(),'bytes':len(body),'mime':headers.get('content-type'),'cacheControl':headers.get('cache-control')};rows.append(row)
  assert row['status']==200 and final=='https://lie.agency'+path
  return body
html=get('/');js=re.findall(r'<script[^>]+src="([^"]+\.js)"',html.decode());assert len(js)==1 and js[0]!='/assets/index-DolkqYbF.js'
body=get(js[0]);assert 'immutable' in rows[-1]['cacheControl'] and rows[-1]['mime'].startswith('text/javascript')
text=body.decode();assert '人物加载中…' in text and 'portrait-loading' in text
print(json.dumps({'origin':'https://lie.agency','rows':rows,'newLoadingTextPresent':True,'newLoadingClassPresent':True,'jsChangedFromPriorRelease':True,'scope':'Exactly homepage and referenced JS, normal TLS. No browser/gameplay/voice/API/provider. No local old dist identity claimed.'},ensure_ascii=False,indent=2))
