"""Read-only follow-up: report all failing silver seam phases and old false contributors."""
from pathlib import Path
import json
repo=Path(__file__).resolve().parents[3]
f=repo/'design/animation-candidates/silver-bun/check-waiting-revision.py'
ns={'__file__':str(f)}
source=f.read_text()
exec(compile(source[:source.index('probes=0\n')],str(f),'exec'),ns)
np=ns['np'];p=ns['p'];x=ns['x'];y=ns['y'];images=ns['images'];results=[]
for phase,pose in enumerate(ns['poses']):
 w=ns['worlds'](pose);opacity=ns['draw_alpha'](w,x,y);bad=opacity<128
 if not np.any(bad):continue
 unique=np.unique(np.column_stack((x[bad],y[bad])),axis=0);details=[]
 for px,py in unique:
  contributors=[]
  for n in p['nodes']:
   if n['id'] not in ns['points']:continue
   sp=n['sprite'];im=images[sp['asset']];inv=np.linalg.inv(w[n['id']]);u=np.array([inv[0,0]*px+inv[0,1]*py+inv[0,2]]);v=np.array([inv[1,0]*px+inv[1,1]*py+inv[1,2]])
   included,ix,iy=ns['sprite_samples'](sp,im,u,v)
   legacy=ns['in_mask'](u,v,sp['mask']) if 'mask' in sp else np.ones(1,dtype=bool)
   legacy &= (ix>=0)&(ix<im.shape[1])&(iy>=0)&(iy<im.shape[0])
   if legacy[0] and im[iy[0],ix[0],3]>0:
    contributors.append({'node':n['id'],'crop':sp.get('crop'),'local':[float(u[0]),float(v[0])],'source':[int(ix[0]),int(iy[0])],'sourceAlpha':int(im[iy[0],ix[0],3]),'insideLocalDraw':bool(included[0])})
  details.append({'world':[float(px),float(py)],'contributorsUnderOldWholeImageBounds':contributors})
 results.append({'phase':phase,'seconds':phase*ns['new']['duration']/32,'badProbeCount':int(bad.sum()),'uniquePoints':details})
print(json.dumps({'correctCropSilverSeamFailures':results},indent=2))
