# Microsoft Store 게임 표시 이미지: 1:1 박스 아트(2160x2160), 2:3 포스터 아트(1440x2160)
#   python3 tools/ms-store-art.py  →  store/ms/box-art-1x1.png, store/ms/poster-art-2x3.png
# 게임 그림(godot/assets)과 게임 글꼴(Galmuri11)로 만든다.
# 유사성 점검(docs/SIMILARITY_AUDIT_2026-10-11.md)에서 그림 교체 후보로 남긴 생물은 넣지 않는다.
import json, os
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.join(os.path.dirname(__file__), '..')
A = lambda *p: os.path.join(ROOT, *p)
BOUNDS = json.load(open(A('godot/data/bounds.json')))
FONT = A('godot/fonts/Galmuri11.ttf')   # Bold는 '록'의 ㄹ이 뭉개져 보통 굵기 + 외곽선
OUT = A('store/ms')


def sprite(sheet, idx):
    x0, y0, x1, y1 = BOUNDS[sheet][idx]
    return Image.open(A('godot/assets', sheet + '.webp')).convert('RGBA').crop((x0, y0, x1, y1))


def soften_cut(im):
    # 시트 칸 경계에서 잘린 쪽(가장자리에 불투명 픽셀이 많은 쪽)을 부드럽게 사라지게
    a = im.getchannel('A')
    w, h = im.size
    edges = {'l': [a.getpixel((0, y)) for y in range(h)], 'r': [a.getpixel((w - 1, y)) for y in range(h)],
             't': [a.getpixel((x, 0)) for x in range(w)], 'b': [a.getpixel((x, h - 1)) for x in range(w)]}
    ramp = Image.new('L', (w, h), 255)
    px = ramp.load()
    for side, vals in edges.items():
        if side == 'b' or sum(v > 128 for v in vals) < len(vals) * 0.08:
            continue
        n = max(6, int((w if side in 'lr' else h) * 0.14))
        for i in range(n):
            k = i / n
            if side in 'lr':
                x = i if side == 'l' else w - 1 - i
                for y in range(h):
                    px[x, y] = min(px[x, y], int(255 * k))
            else:
                for x in range(w):
                    px[x, i] = min(px[x, i], int(255 * k))
    im.putalpha(ImageChops.multiply(a, ramp))
    return im


def creature(sid):          # 생물 번호(1부터) → 그림
    return soften_cut(sprite('monsters', sid - 1))


def scene(i):               # scenes.webp: 512x384 칸 3x2
    im = Image.open(A('godot/assets/scenes.webp')).convert('RGBA')
    c, r = i % 3, i // 3
    return im.crop((c * 512 + 8, r * 384 + 8, c * 512 + 504, r * 384 + 376))   # 칸 사이 테두리 제외


def cover(im, w, h):
    s = max(w / im.width, h / im.height)
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    l, t = (im.width - w) // 2, (im.height - h) // 2
    return im.crop((l, t, l + w, t + h))


def place(canvas, im, cx, bottom, height, flip=False, shadow=True):
    s = height / im.height
    im = im.resize((round(im.width * s), round(height)), Image.LANCZOS)
    im = im.filter(ImageFilter.UnsharpMask(radius=2, percent=60, threshold=2))
    if flip:
        im = im.transpose(Image.FLIP_LEFT_RIGHT)
    x, y = round(cx - im.width / 2), round(bottom - im.height)
    if shadow:
        sh = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
        w = im.width * 0.8
        ImageDraw.Draw(sh).ellipse((cx - w / 2, bottom - w * 0.09, cx + w / 2, bottom + w * 0.09), fill=(20, 30, 20, 110))
        canvas.alpha_composite(sh.filter(ImageFilter.GaussianBlur(w * 0.04)))
    # 가장자리 빛(밝은 배경에서 그림이 묻히지 않게)
    glow = Image.new('RGBA', im.size, (255, 248, 225, 0))
    glow.putalpha(im.getchannel('A').filter(ImageFilter.MaxFilter(7)).point(lambda a: int(a * 0.55)))
    layer = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
    layer.alpha_composite(glow.filter(ImageFilter.GaussianBlur(4)), (x, y))
    layer.alpha_composite(im, (x, y))
    canvas.alpha_composite(layer)


def backdrop(w, h, idx=0):
    bg = cover(scene(idx), w, h).filter(ImageFilter.GaussianBlur(w / 900))
    top = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(top)
    for y in range(h):                       # 위는 남색으로 어둡게(제목), 아래는 살짝
        k = max(0.0, 1 - y / (h * 0.42)) * 0.62 + max(0.0, (y - h * 0.8) / (h * 0.2)) * 0.35
        d.line((0, y, w, y), fill=(18, 28, 52, int(255 * min(k, 0.85))))
    bg.alpha_composite(top)
    return bg


def text(canvas, s, cy, size, fill=(255, 246, 222), stroke=(22, 30, 54), sw=None, spacing=0):
    f = ImageFont.truetype(FONT, size)
    d = ImageDraw.Draw(canvas)
    sw = sw if sw is not None else max(4, size // 15)
    b = d.textbbox((0, 0), s, font=f, stroke_width=sw)
    x = (canvas.width - (b[2] - b[0])) / 2 - b[0]
    y = cy - (b[3] - b[1]) / 2 - b[1]
    sh = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).text((x, y + size * 0.06), s, font=f, fill=(0, 0, 0, 150), stroke_width=sw, stroke_fill=(0, 0, 0, 150))
    canvas.alpha_composite(sh.filter(ImageFilter.GaussianBlur(size * 0.04)))
    d.text((x, y), s, font=f, fill=fill, stroke_width=sw, stroke_fill=stroke)


def title(canvas, cy, size):
    text(canvas, '벨로리아 생태기록', cy, size)
    text(canvas, 'VELORIA FIELDNOTES', cy + size * 0.92, int(size * 0.36), fill=(190, 232, 222), sw=max(3, size // 28))


def box_art():
    W = H = 2160
    c = backdrop(W, H)
    title(c, 320, 210)
    # 뒤: 심해왕(물·용) · 하늘: 짹짹이
    place(c, creature(32), 1560, 1500, 820)
    place(c, creature(10), 520, 900, 300, shadow=False)
    # 가운데: 조사원 + 앞줄 생물
    place(c, sprite('people', 0), 1010, 1880, 940)
    place(c, creature(18), 1650, 2010, 560, flip=True)
    place(c, creature(4), 440, 1990, 420)
    place(c, creature(24), 650, 1500, 380)
    return c


def poster_art():
    W, H = 1440, 2160
    c = backdrop(W, H)
    title(c, 290, 138)
    place(c, creature(32), 980, 1260, 700)
    place(c, creature(10), 330, 820, 230, shadow=False)
    place(c, sprite('people', 0), 640, 1820, 900)
    place(c, creature(18), 1110, 1990, 470, flip=True)
    place(c, creature(4), 300, 1990, 360)
    place(c, creature(24), 330, 1420, 300)
    return c


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    box_art().convert('RGB').save(os.path.join(OUT, 'box-art-1x1.png'), optimize=True)
    poster_art().convert('RGB').save(os.path.join(OUT, 'poster-art-2x3.png'), optimize=True)
    print('store/ms: box-art-1x1.png (2160x2160), poster-art-2x3.png (1440x2160)')
