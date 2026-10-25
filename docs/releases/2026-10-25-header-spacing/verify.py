from pathlib import Path
import subprocess,json,re,hashlib,zipfile
D=Path(__file__).parent;sha='2f5496d61fca524dca04cf23da4ade8778513924'
def H(b):return hashlib.sha256(b).hexdigest()
meta=json.loads((D/'artifacts.json').read_text());a=[a for a in meta['artifacts'] if a['name']==f'production-build-{sha}-40183820150-1'];assert len(a)==1;a=a[0]
assert not a['expired'] and a['workflow_run']['head_sha']==sha
ziphash=H((D/'artifact.zip').read_bytes());assert a['digest']=='sha256:'+ziphash
z=zipfile.ZipFile(D/'artifact.zip');r=json.loads(z.read('receipt.json'));assert r['sha']==sha and r['runId']=='40183820150' and r['attempt']=='1'
lock=subprocess.check_output(['git','show',sha+':package-lock.json']);assert H(lock)==r['lockSha256']
for f in r['files']:
 b=z.read('bundle/'+f['path']);assert len(b)==f['size'] and H(b)==f['sha256']
rows=[]
def get(path):
 target=D/('online-'+str(len(rows)));headers=target.with_suffix('.headers')
 if not target.exists():
  code=subprocess.check_output(['curl','--fail','--silent','--show-error','--location','--max-time','30','--dump-header',str(headers),'--output',str(target),'--write-out','%{http_code} %{url_effective}','https://lie.agency'+path],text=True)
  assert code=='200 https://lie.agency'+path,code
 else:
  assert re.search(r'HTTP/[0-9.]+ 200',headers.read_text()),'Cached normal-TLS response must be200'
 b=target.read_bytes();expected=z.read('bundle/v0/workers/default/assets/'+('index.html' if path=='/' else path.lstrip('/')));assert b==expected,path
 row={'path':path,'bytes':len(b),'sha256':H(b),'status':200,'matchesExactCIArtifact':True};rows.append(row);return b
html=get('/').decode();refs=re.findall(r'(?:src|href)="([^" ]+\.(?:js|css))"',html);assert refs
css='';js=''
for ref in refs:
 b=get(ref).decode()
 if ref.endswith('.css'):css+=b
 else:js+=b
assert re.search(r'@media\s*\(width<=620px\)\{[^@]*?\.home-cases\{margin-top:32px\}',css)
assert re.search(r'\.lie-product-header__brand[^{}]*:after\{[^}]*left:30\.9%',css)
assert 'LIE 首页' in js and '正在连接…' in js
out={'sha':sha,'ciRun':40183820150,'artifactId':a['id'],'artifactDigest':a['digest'],'independentZipDigest':ziphash,'receiptFilesChecked':len(r['files']),'lockMatch':True,'rows':rows,'mobile620CaseSectionMargin32':True,'headerUnderlineLeft30_9':True,'accessibleHomeBrandInJS':True,'scope':'Read-only normal TLS GET homepage/JS/CSS, no browser, voice/API/WS or provider'}
(D/'online.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
