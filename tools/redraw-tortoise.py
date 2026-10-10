"""24번 바위거북 다시 그리기: 등의 숲·산봉우리(다른 작품과 닮아 보이던 부분)를 걷어내고
자수정빛 수정 결정 무리를 새로 그려 넣는다. 결정 밑동은 바위 껍데기 덩어리로 덮는다.
머리 위 새싹, 칸 밖으로 남아 있던 초록 덤불도 지운다.

assets/generated/creatures-front.png · creatures-back.png 를 직접 고친다 (한 번만 실행).
사용법: python3 tools/redraw-tortoise.py && node tools/prepare-art.cjs
(prepare-art.cjs 는 24번 칸을 거북 전체가 들어가는 넓은 상자로 자른다)
"""
import math
import os
import random

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.join(os.path.dirname(__file__), "..", "assets", "generated")
SS = 4  # 4배로 그려서 줄이면 가장자리가 부드럽다

# 그림 영역 (시트 좌표). 이 안에서 거북 덩어리만 다룬다
REGION = (975, 640, 1254, 848)

# 등껍질 윗선(이 선 위의 숲·봉우리를 지운다). (x, y) 시트 좌표
FRONT_LINE = [(1040, 712), (1066, 713), (1080, 714), (1110, 723), (1140, 733), (1160, 738), (1190, 744), (1215, 752), (1250, 768)]
BACK_LINE = [(1000, 806), (1015, 792), (1025, 784), (1040, 772), (1060, 769), (1080, 773), (1100, 779), (1120, 776),
             (1140, 771), (1160, 768), (1180, 762), (1195, 752), (1208, 740), (1220, 730), (1231, 727)]

# 결정: (밑동 x, 선에서 아래로 묻히는 깊이, 기울기(도, +는 오른쪽), 폭, 높이, 색조 0=자수정 1=연보라)
# 세 무리: 앞쪽 작은 무리, 가운데 큰 무리(부채꼴), 뒤쪽 작은 무리
FRONT_CRYSTALS = [
    (1080, 7, -30, 10, 20, 1), (1088, 6, -8, 13, 30, 0),
    (1118, 8, -22, 15, 40, 1), (1128, 7, -4, 22, 62, 0), (1140, 8, 16, 17, 46, 0), (1124, 11, 30, 10, 22, 1),
    (1182, 8, 20, 13, 30, 0), (1194, 8, 42, 10, 20, 1), (1172, 10, -6, 8, 16, 1),
]
BACK_CRYSTALS = [
    (1058, 8, -36, 11, 24, 1), (1070, 7, -16, 13, 32, 0),
    (1104, 8, -24, 15, 42, 1), (1116, 8, -2, 22, 62, 0), (1130, 8, 18, 17, 46, 0), (1108, 11, 26, 10, 22, 1),
    (1170, 8, 22, 13, 30, 0), (1184, 8, 44, 10, 20, 1), (1160, 10, -8, 8, 16, 1),
]

PALETTES = [
    # 밝은 면, 가운데 면, 어두운 면, 테두리
    ((226, 204, 255), (168, 128, 232), (104, 70, 172), (58, 36, 100)),
    ((240, 228, 255), (196, 170, 242), (132, 104, 196), (70, 50, 116)),
]
STONE = ((170, 158, 132), (124, 112, 92), (84, 76, 62), (46, 40, 32))


def line_y(line, x):
    if x <= line[0][0]:
        return line[0][1]
    for (x0, y0), (x1, y1) in zip(line, line[1:]):
        if x0 <= x <= x1:
            return y0 + (y1 - y0) * (x - x0) / max(1, x1 - x0)
    return line[-1][1]


def hsv(a):
    rgb = a[..., :3].astype(np.float32) / 255.0
    mx, mn = rgb.max(-1), rgb.min(-1)
    d = mx - mn
    h = np.zeros_like(mx)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    m = d > 1e-6
    rm = m & (mx == r)
    gm = m & (mx == g) & ~rm
    bm = m & ~rm & ~gm
    h[rm] = ((g - b)[rm] / d[rm]) % 6
    h[gm] = (b - r)[gm] / d[gm] + 2
    h[bm] = (r - g)[bm] / d[bm] + 4
    return h * 60.0, np.where(mx > 1e-6, d / np.maximum(mx, 1e-6), 0), mx


def clear_back(a, line, x_from, x_to, front):
    """선 위를 지운다. x_from~x_to 밖은 숲 색(주황·초록)만 지운다."""
    X0, Y0 = REGION[0], REGION[1]
    h, w = a.shape[:2]
    H, S, V = hsv(a)
    foliage = (((H < 50) | (H > 340)) & (S > 0.38)) | ((H > 60) & (H < 170) & (S > 0.25))
    soft_green = (H > 58) & (H < 165) & (S > 0.22)
    orange = (H > 6) & (H < 42) & (S > 0.5) & (V > 0.3)
    for x in range(w):
        sx = x + X0
        ly = line_y(line, sx) - Y0
        for y in range(h):
            if y >= ly:
                break
            sy = y + Y0
            if x_from <= sx <= x_to:
                a[y, x, 3] = 0
            elif front and sx < x_from and (sy < 699 or orange[y, x] or (sy < 708 and soft_green[y, x])):
                a[y, x, 3] = 0          # 머리 윗선(약 703) 위의 숲·새싹 찌꺼기
            elif not front and sx > x_to and (sy < 716 or orange[y, x]):
                a[y, x, 3] = 0          # 머리 위로 남은 숲 찌꺼기
            elif not front and 1012 <= sx < x_from and foliage[y, x]:
                a[y, x, 3] = 0
    # 머리 위 새싹(앞모습) · 왼쪽 초록 덤불(뒷모습): 초록은 위쪽 절반에서 모두 지운다
    green = (H > 72) & (H < 150) & (S > 0.42) & (V > 0.3)
    yy = np.arange(h)[:, None].repeat(w, 1)
    if front:
        sel = green & (yy < 712 - Y0)
    else:
        xx = np.arange(w)[None, :].repeat(h, 0)
        sel = green & (xx + X0 >= 1012) & (xx + X0 < 1050) & (yy < 790 - Y0)   # 왼쪽 칸(돌돌이)은 건드리지 않음
    a[..., 3][sel] = 0


def drop_specks(a, min_size=14):
    """작은 떨어진 조각(지우고 남은 찌꺼기)을 없앤다"""
    h, w = a.shape[:2]
    on = a[..., 3] > 30
    seen = np.zeros_like(on)
    for sy in range(h):
        for sx in range(w):
            if not on[sy, sx] or seen[sy, sx]:
                continue
            stack, comp = [(sy, sx)], []
            seen[sy, sx] = True
            while stack:
                y, x = stack.pop()
                comp.append((y, x))
                for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                    if 0 <= ny < h and 0 <= nx < w and on[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        stack.append((ny, nx))
            if len(comp) < min_size:
                for y, x in comp:
                    a[y, x, 3] = 0
    a[..., 3][a[..., 3] <= 30] = 0


def tidy_head(a):
    """앞모습 머리 꼭대기: 새싹 그늘에 있던 노르스름한 이끼빛을 피부색으로"""
    X0, Y0 = REGION[0], REGION[1]
    H, S, V = hsv(a)
    h, w = a.shape[:2]
    yy = np.arange(h)[:, None].repeat(w, 1) + Y0
    xx = np.arange(w)[None, :].repeat(h, 0) + X0
    sel = (yy < 712) & (xx < 1066) & (H > 45) & (H < 90) & (S > 0.3) & (a[..., 3] > 0)
    skin = np.array([196, 180, 140], np.float32)
    k = np.clip((S - 0.3) / 0.3, 0, 1)[..., None] * 0.75
    rgb = a[..., :3].astype(np.float32)
    lum = rgb.mean(-1, keepdims=True) / 170.0
    new = rgb * (1 - k) + np.clip(skin * lum, 0, 255) * k
    a[..., :3] = np.where(sel[..., None], new, rgb).astype(np.uint8)


def crystal_polys(cx, cy, ang, wd, ht):
    """결정 하나: 몸통 세 면 + 끝 세 면 (4배 좌표)"""
    t = math.radians(ang)
    ux, uy = math.cos(t), math.sin(t)          # 폭 방향
    vx, vy = math.sin(t), -math.cos(t)         # 위쪽 방향

    def P(u, v):
        return (cx + (ux * u + vx * v) * SS, cy + (uy * u + vy * v) * SS)

    hw = wd / 2
    body = ht * 0.68
    side = hw * 0.36
    tip = P(0, ht)
    faces = [
        ([P(-hw, 0), P(-side, -wd * 0.12), P(-side, body - wd * 0.12), P(-hw, body)], 0),
        ([P(-side, -wd * 0.12), P(side, -wd * 0.12), P(side, body - wd * 0.12), P(-side, body - wd * 0.12)], 1),
        ([P(side, -wd * 0.12), P(hw, 0), P(hw, body), P(side, body - wd * 0.12)], 2),
        ([P(-hw, body), P(-side, body - wd * 0.12), tip], 0),
        ([P(-side, body - wd * 0.12), P(side, body - wd * 0.12), tip], 1),
        ([P(side, body - wd * 0.12), P(hw, body), tip], 2),
    ]
    outline = [P(-hw, 0), P(-hw, body), tip, P(hw, body), P(hw, 0), P(side, -wd * 0.12), P(-side, -wd * 0.12)]
    return faces, outline, (vx, vy), tip


def draw_crystal(layer, cx, cy, ang, wd, ht, pal):
    faces, outline, (vx, vy), tip = crystal_polys(cx, cy, ang, wd, ht)
    one = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(one)
    d.polygon(outline, fill=pal[3])
    for poly, k in faces:
        d.polygon(poly, fill=pal[k])
    # 위로 갈수록 밝게 (결정 축 방향 그라데이션)
    arr = np.array(one).astype(np.float32)
    H, W = arr.shape[:2]
    ys, xs = np.mgrid[0:H, 0:W]
    proj = ((xs - cx) * vx + (ys - cy) * vy) / (ht * SS)
    k = np.clip(0.82 + proj * 0.42, 0.75, 1.25)[..., None]
    arr[..., :3] = np.clip(arr[..., :3] * k, 0, 255)
    one = Image.fromarray(arr.astype(np.uint8))
    d = ImageDraw.Draw(one)
    d.line(outline + [outline[0]], fill=pal[3], width=int(1.6 * SS), joint="curve")
    # 모서리 빛
    edge = faces[1][0]
    d.line([edge[0], edge[3]], fill=(255, 250, 255, 170), width=int(0.8 * SS))
    d.line([faces[4][0][0], tip], fill=(255, 255, 255, 200), width=int(0.8 * SS))
    layer.alpha_composite(one)


def draw_lump(d, cx, cy, r, rnd):
    """모난 바위 조각: 불규칙한 다각형 + 윗면 빛 + 아랫면 그늘"""
    n = rnd.randint(6, 8)
    rx, ry = r * (1.0 + rnd.uniform(0, 0.4)), r * (0.62 + rnd.uniform(-0.08, 0.08))
    pts = []
    for i in range(n):
        a = math.tau * i / n + rnd.uniform(-0.25, 0.25)
        k = rnd.uniform(0.82, 1.08)
        pts.append((cx + math.cos(a) * rx * k * SS, cy + math.sin(a) * ry * k * SS))
    d.polygon(pts, fill=STONE[1], outline=STONE[3], width=int(1.1 * SS))
    lower = [p for p in pts if p[1] >= cy] + [(cx - rx * 0.5 * SS, cy + ry * 0.15 * SS)]
    if len(lower) >= 3:
        d.polygon(sorted(lower, key=lambda p: math.atan2(p[1] - cy, p[0] - cx)), fill=STONE[2])
    top = [p for p in pts if p[1] < cy - ry * 0.2 * SS]
    if len(top) >= 2:
        d.polygon(top + [(cx + rx * 0.2 * SS, cy - ry * 0.1 * SS), (cx - rx * 0.4 * SS, cy - ry * 0.05 * SS)], fill=STONE[0])


def draw_crust(d, line, x_range, rnd):
    """결정이 박힌 울퉁불퉁한 바위 띠 (등껍질 윗선을 따라)"""
    X0, Y0 = REGION[0], REGION[1]
    top, bot = [], []
    x = x_range[0]
    while x <= x_range[1]:
        y = line_y(line, x)
        taper = min(1.0, (x - x_range[0]) / 10, (x_range[1] - x) / 14)   # 양 끝은 가늘게
        top.append(((x - X0) * SS, (y - Y0 - rnd.uniform(3, 8) * taper) * SS))
        bot.append(((x - X0) * SS, (y - Y0 + 1 + 5 * taper) * SS))
        x += rnd.uniform(3, 6)
    d.polygon(top + bot[::-1], fill=STONE[2], outline=STONE[3], width=int(1.2 * SS))
    # 윗면 빛 띠
    d.line([(p[0], p[1] + 1.6 * SS) for p in top], fill=STONE[1], width=int(2.2 * SS), joint="curve")


def draw_back(a, line, crystals, x_range, seed):
    X0, Y0 = REGION[0], REGION[1]
    h, w = a.shape[:2]
    rnd = random.Random(seed)
    layer = Image.new("RGBA", (w * SS, h * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    draw_crust(d, line, x_range, rnd)
    # 결정 (뒤에서 앞으로: 작은 것부터)
    for bx, sink, ang, wd, ht, pal in sorted(crystals, key=lambda c: -c[1]):
        by = line_y(line, bx) + sink
        draw_crystal(layer, (bx - X0) * SS, (by - Y0) * SS, ang, wd, ht, PALETTES[pal])
    # 앞쪽 바위 덩어리로 결정 밑동을 묻는다
    d = ImageDraw.Draw(layer)
    for bx, sink, ang, wd, ht, pal in crystals:
        if wd >= 20:
            x = bx + wd * 0.42 + rnd.uniform(-1, 1)
            draw_lump(d, (x - X0) * SS, (line_y(line, x) + 2 - Y0) * SS, rnd.uniform(5, 6.5), rnd)
    x = x_range[0] + 6
    while x <= x_range[1] - 4:
        if all(abs(x - c[0]) > c[3] * 1.2 for c in crystals) and rnd.random() < 0.2:
            draw_lump(d, (x - X0) * SS, (line_y(line, x) - 2 - Y0) * SS, rnd.uniform(5, 7.5), rnd)
        x += rnd.uniform(14, 20)
    # 반짝임
    for _ in range(5):
        c = crystals[rnd.randrange(len(crystals))]
        bx, sink, ang, wd, ht, _p = c
        t = math.radians(ang)
        v = rnd.uniform(0.45, 0.8) * ht
        px = (bx - X0 + math.sin(t) * v) * SS
        py = (line_y(line, bx) + sink - Y0 - math.cos(t) * v) * SS
        s = rnd.uniform(2.2, 3.4) * SS
        d.polygon([(px, py - s), (px + s * 0.25, py - s * 0.25), (px + s, py), (px + s * 0.25, py + s * 0.25),
                   (px, py + s), (px - s * 0.25, py + s * 0.25), (px - s, py), (px - s * 0.25, py - s * 0.25)], fill=(255, 255, 255, 230))
    small = layer.resize((w, h), Image.LANCZOS)
    base = Image.fromarray(a)
    base.alpha_composite(small)
    return np.array(base)


def main():
    for f, line, crystals, xr, front in [
        ("creatures-front.png", FRONT_LINE, FRONT_CRYSTALS, (1066, 1240), True),
        ("creatures-back.png", BACK_LINE, BACK_CRYSTALS, (1022, 1231), False),
    ]:
        p = os.path.join(ROOT, f)
        im = Image.open(p).convert("RGBA")
        arr = np.array(im)
        x0, y0, x1, y1 = REGION
        sub = arr[y0:y1, x0:x1].copy()
        clear_back(sub, line, xr[0], xr[1], front)
        drop_specks(sub[:, 1012 - x0:])
        if front:
            tidy_head(sub)
        sub = draw_back(sub, line, crystals, (xr[0] - 12, xr[1]) if front else xr, 24 if front else 42)
        arr[y0:y1, x0:x1] = sub
        Image.fromarray(arr).save(p)
        print("다시 그림", f)


if __name__ == "__main__":
    main()
