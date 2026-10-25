"""Execute existing read-only author audit in memory, adding the renderer's crop extent check.
Never rewrites author sources, PNGs or evidence. Requires Pillow/numpy and Node24.
"""
from pathlib import Path
import sys
root=Path(sys.argv[1])
for role in sys.argv[2:] or ['silver-bun','salt-pepper-beard','plum-crop']:
 p=root/'design/animation-candidates'/role/'check-waiting-revision.py'
 text=p.read_text()
 old="if 'crop' in sp:u=u+sp['crop'][0];v=v+sp['crop'][1]"
 new="if 'crop' in sp:\n   included &= (u>=0)&(u<sp['crop'][2])&(v>=0)&(v<sp['crop'][3])\n   u=u+sp['crop'][0];v=v+sp['crop'][1]"
 assert text.count(old)==2
 text=text.replace(old,new)
 text=text.replace('for pose in poses:\n w=worlds(pose);opacity=draw_alpha(w,x,y)', 'for phase_index,pose in enumerate(poses):\n w=worlds(pose);opacity=draw_alpha(w,x,y)')
 text=text.replace("('waist/contact seam',int(np.sum(opacity<128))", "('waist/contact seam',phase_index,int(np.sum(opacity<128))")
 print('CORRECTED CROP EXTENT AUDIT',role,flush=True)
 exec(compile(text,str(p),'exec'),{'__file__':str(p),'__name__':'__main__'})
