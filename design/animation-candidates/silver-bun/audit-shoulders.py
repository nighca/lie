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
for node_id in ['torso','waiting-torso']:
    node=next(node for node in package['nodes'] if node['id']==node_id)
    polygon=node['sprite']['mask']
    image=Image.open(root/package['assets'][node['sprite']['asset']]['src'])
    count=0
    for y in range(410,521):
        visible=[]
        for x in range(330,951):
            if image.getpixel((x,y))[3]>=200:
                count+=1
                assert inside(x,y),f'{node_id}: shoulder contour clipped at {x},{y}'
                visible.append(x)
        assert visible,f'{node_id}: missing entire shoulder band row {y}'
    print(f'PASS: {node_id} retains {count} opaque source shoulder-band pixels across 111 rows')
head=next(node for node in package['nodes'] if node['id']=='head')
polygon=head['sprite']['mask']
assert inside(700,880),'chin retained'
for y in range(926,1155):
    for x in range(541,1030):
        assert not inside(x,y),f'excess collarbone retained at {x},{y}'
print('PASS: lower central collarbone excluded while chin retained; no image pixels changed')
