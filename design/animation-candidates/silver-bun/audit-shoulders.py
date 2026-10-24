"""Read-only shoulder-band pixel inspection; never saves or changes an image."""
import json
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parent
package=json.loads((root/'package.json').read_text())
node=next(node for node in package['nodes'] if node['id']=='torso')
assert node['sprite']['asset']=='default-source'
assert node['transform']==dict(x=0,y=0,pivotX=0,pivotY=0,rotation=0,scaleX=1,scaleY=1)
polygon=node['sprite']['mask']
def inside(x,y):
    result=False
    for i,(xi,yi) in enumerate(polygon):
        xj,yj=polygon[i-1]
        if ((yi>y)!=(yj>y)) and x<(xj-xi)*(y-yi)/(yj-yi)+xi:
            result=not result
    return result
image=Image.open(root/package['assets']['default-source']['src'])
count=0
for y in range(410,521):
    visible=[]
    for x in range(330,951):
        if image.getpixel((x,y))[3]>=200:
            count+=1
            assert inside(x,y),f'shoulder contour clipped at {x},{y}'
            visible.append(x)
    assert visible,f'missing entire shoulder band row {y}'
print(f'PASS: {count} opaque canonical shoulder-band pixels retained across 111 rows; no image pixels changed')
