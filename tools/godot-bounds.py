"""Godot용: 각 아틀라스 칸에서 실제로 보이는 부분(알파>40)의 경계 [x0,y0,x1,y1](아틀라스 px)을 계산한다.
사용법: python3 tools/godot-bounds.py  → godot/data/bounds.json"""
import json, os
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ATLAS = {'monsters': (6, 160, 160, 34), 'backs': (6, 160, 160, 34), 'people': (7, 128, 192, 27), 'peopleBack': (7, 128, 192, 27),
         'walk': (4, 128, 192, 16), 'props': (6, 192, 192, 24)}
out = {}
for name, (cols, cw, ch, n) in ATLAS.items():
    im = Image.open(os.path.join(ROOT, 'godot/assets', name + '.webp')).convert('RGBA')
    a = im.split()[3].point(lambda v: 255 if v > 40 else 0)
    res = []
    for i in range(n):
        x, y = (i % cols) * cw, (i // cols) * ch
        bb = a.crop((x, y, x + cw, y + ch)).getbbox() or (0, 0, cw, ch)
        res.append([x + bb[0], y + bb[1], x + bb[2], y + bb[3]])
    out[name] = res
json.dump(out, open(os.path.join(ROOT, 'godot/data/bounds.json'), 'w'))
print({k: len(v) for k, v in out.items()}, out['monsters'][0], out['walk'][0])
