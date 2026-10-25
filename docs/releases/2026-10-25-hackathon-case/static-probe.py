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
html=get('/');js=re.findall(r'<script[^>]+src="([^"]+\.js)"',html.decode());assert len(js)==1 and js[0]=='/assets/index-CRRGYc8t.js'
body=get(js[0]);assert 'immutable' in rows[-1]['cacheControl'] and rows[-1]['mime'].startswith('text/javascript')
text=body.decode();assert 'hackathon-old-project' in text and '这真是今天做的吗' in text and 'Hackathon 路演刚结束，有人把旧成果说成了现场新作。问问三位参赛者，找出越过规则的人。' in text
assert rows[-1]['sha256']=='641ceb42be4cc78f0330ae4ba269c435608162c2e003d9b0766ec6e0e0fa054f'
print(json.dumps({'origin':'https://lie.agency','rows':rows,'newCaseIdTitleSummaryPresent':True,'reviewedSourceJsFingerprintEqual':True,'scope':'Exactly homepage and referenced JS, normal TLS. No browser/gameplay/voice/API/provider. No local old dist identity claimed.'},ensure_ascii=False,indent=2))
