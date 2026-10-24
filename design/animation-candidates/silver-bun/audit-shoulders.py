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
for node_id in ['torso','listening-torso']:
    node=next(node for node in package['nodes'] if node['id']==node_id)
    polygon=node['sprite']['mask']
    image=Image.open(root/package['assets'][node['sprite']['asset']]['src'])
    for y in range(890,1220):
        for x in range(920,1030):
            r,g,b,a=image.getpixel((x,y))
            if a>=200 and r>150 and 70<g<210 and b<145:
                assert not inside(x,y),f'{node_id}: lowered right arm skin retained at {x},{y}'
    print(f'PASS: {node_id} excludes lower-right skin pixels in original lowered-arm region')
node=next(node for node in package['nodes'] if node['id']=='listening-torso')
polygon=node['sprite']['mask']
image=Image.open(root/package['assets']['listening-source']['src'])
count=0
for y in range(745,991):
    for x in range(330,650):
        r,g,b,a=image.getpixel((x,y))
        if a>=200 and r<170 and g>140 and b>140:
            count+=1
            assert inside(x,y),f'listening cardigan clipped at {x},{y}'
print(f'PASS: listening retains all {count} aqua cardigan pixels in left waist/hem band')
node=next(node for node in package['nodes'] if node['id']=='right-neutral')
polygon=node['sprite']['mask']
image=Image.open(root/package['assets']['default-source']['src'])
skin=set()
for y in range(1000,1226):
    for x in range(920,1041):
        r,g,b,a=image.getpixel((x,y))
        if a>=128 and r>150 and 70<g<210 and b<145:
            skin.add((x,y))
near_skin={(x+dx,y+dy) for x,y in skin for dx in range(-8,9) for dy in range(-8,9) if dx*dx+dy*dy<=64}
count=0
for x,y in near_skin:
    if 920<=x<=1040 and 1000<=y<=1225 and image.getpixel((x,y))[3]>=128:
        count+=1
        assert inside(x,y),f'neutral right arm skin/nearby ink clipped at {x},{y}'
print(f'PASS: neutral forearm/hand retains {count} opaque skin/nearby ink pixels (8px skin neighbourhood)')
node=next(node for node in package['nodes'] if node['id']=='listen-arm')
polygon=node['sprite']['mask']
image=Image.open(root/package['assets']['listening-source']['src'])
count=0
for y in range(675,741):
    for x in range(260,471):
        if image.getpixel((x,y))[3]>=128:
            count+=1
            assert inside(x,y),f'listening elbow contour clipped at {x},{y}'
print(f'PASS: listening elbow retains all {count} opaque lower-arc pixels, including ink')
node=next(node for node in package['nodes'] if node['id']=='speak-arm')
polygon=node['sprite']['mask']
image=Image.open(root/package['assets']['speaking-source']['src'])
hand_count=0
for y in range(620,811):
    for x in range(810,881):
        r,g,b,a=image.getpixel((x,y))
        if a>=200 and r>210 and g>190 and b>160:
            assert not inside(x,y),f'speaking arm includes unrelated shirt-white at {x},{y}'
        if 695<=y<=755 and a>=200 and r>170 and 70<g<210 and b<145:
            hand_count+=1
            assert inside(x,y),f'speaking palm/finger skin clipped at {x},{y}'
print(f'PASS: speaking arm excludes moving shirt-white and retains {hand_count} palm/finger skin pixels in inner-edge band')
