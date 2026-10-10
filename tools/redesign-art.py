"""유명 작품과 닮아 보일 수 있는 그림 3종을 다시 칠한다 (생성 원본 assets/generated/*.png 를 직접 고침).

- 17번 전기 고양이: 노란 털 → 하늘색 털, 귀 끝의 검은색 → 털과 같은 밝은 색 (노란 몸 + 검은 귀 끝 조합 제거)
- 24번 산거북: 등의 초록 숲 → 단풍(주황·빨강), 바위 봉우리 → 눈 덮인 흰 봉우리
- 검은안개단원: 검은 제복 → 짙은 회청색, 빨간 문양·띠 → 안개색(청록), 옆 칸에서 넘어온 파란 조각 제거

한 번만 실행한다(이미 고친 원본에 다시 실행하면 색이 또 바뀐다).
사용법: python3 tools/redesign-art.py && node tools/prepare-art.cjs
"""
import colorsys
import os
import sys

import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), "..", "assets", "generated")


def box(sheet_w, sheet_h, cols, rows, i):
    c, r = i % cols, i // cols
    left, top = round(c * sheet_w / cols), round(r * sheet_h / rows)
    return left, top, round((c + 1) * sheet_w / cols), round((r + 1) * sheet_h / rows)


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
    h = h * 60.0
    s = np.where(mx > 1e-6, d / np.maximum(mx, 1e-6), 0)
    return h, s, mx


def to_rgb(h, s, v):
    h = (h % 360) / 60.0
    i = np.floor(h).astype(int) % 6
    f = h - np.floor(h)
    p, q, t = v * (1 - s), v * (1 - s * f), v * (1 - s * (1 - f))
    out = np.stack([np.choose(i, [v, q, p, p, t, v]), np.choose(i, [t, v, v, q, p, p]), np.choose(i, [p, p, t, v, v, q])], -1)
    return np.clip(out * 255, 0, 255)


def edit(a, mask, h=None, s=None, v=None, w=None):
    """mask 자리의 색을 바꾼다. w(0~1)로 섞어 경계를 부드럽게."""
    H, S, V = hsv(a)
    nh = np.where(mask, h(H, S, V) if callable(h) else (H if h is None else h), H)
    ns = np.where(mask, s(H, S, V) if callable(s) else (S if s is None else s), S)
    nv = np.where(mask, v(H, S, V) if callable(v) else (V if v is None else v), V)
    new = to_rgb(nh, np.clip(ns, 0, 1), np.clip(nv, 0, 1))
    k = mask.astype(np.float32) if w is None else (mask * w).astype(np.float32)
    a[..., :3] = (a[..., :3] * (1 - k[..., None]) + new * k[..., None]).astype(np.uint8)


def silhouette_rows(alpha):
    """가장 긴 연속 행 구간(옆 칸에서 넘어온 조각은 빈 행으로 떨어져 있어 제외됨)"""
    on = (alpha > 40).sum(1) > 2
    best, cur, start = (0, -1), 0, 0
    for y, v in enumerate(list(on) + [False]):
        if v and cur == 0:
            start = y
        cur = cur + 1 if v else 0
        if v and cur > best[1] - best[0] + 1:
            best = (start, y)
    return best


def kitten(a):
    H, S, V = hsv(a)
    vis = a[..., 3] > 20
    yellow = vis & (H > 22) & (H < 68) & (S > 0.2)
    edit(a, yellow, h=lambda H, S, V: 200 + (H - 45) * 0.3, s=lambda H, S, V: S * 0.62, v=lambda H, S, V: np.minimum(1, V * 1.02))
    # 귀 끝(실루엣 위쪽 35%)의 어두운 부분을 털 색으로
    H, S, V = hsv(a)
    y0, y1 = silhouette_rows(a[..., 3])
    yy = np.arange(a.shape[0])[:, None].repeat(a.shape[1], 1)
    top = yy < y0 + (y1 - y0) * 0.36
    dark = vis & top & (V < 0.62) & ~((H > 180) & (H < 230) & (S > 0.15) & (V > 0.5))
    w = np.clip((0.62 - V) / 0.25, 0, 1)
    edit(a, dark, h=203, s=lambda H, S, V: 0.28 + 0 * S, v=lambda H, S, V: 0.78 + V * 0.18, w=w)


def tortoise(a):
    """등의 숲과 바위 봉우리를 단풍 든 나무숲으로: 초록 → 주황 단풍, 회색 봉우리 → 붉은 단풍 나무, 몸의 이끼 → 흙빛"""
    y0, y1 = silhouette_rows(a[..., 3])
    yy = np.arange(a.shape[0])[:, None].repeat(a.shape[1], 1)
    upper = yy < y0 + (y1 - y0) * 0.5
    H, S, V = hsv(a)
    vis = a[..., 3] > 20
    green = vis & (H > 60) & (H < 170) & (S > 0.22)
    peak = vis & ~green & (yy < y0 + (y1 - y0) * 0.36) & (S < 0.5) & (V > 0.25)
    edit(a, green & upper, h=lambda H, S, V: 28 + (H - 100) * 0.25, s=lambda H, S, V: np.minimum(0.85, S * 1.05), v=lambda H, S, V: np.minimum(1, V * 1.08))
    edit(a, green & ~upper, h=38, s=lambda H, S, V: S * 0.35)
    edit(a, peak, h=lambda H, S, V: 6 + V * 22, s=lambda H, S, V: 0.62 + 0 * S, v=lambda H, S, V: np.minimum(1, V * 0.92))


def villain(a, front):
    H, S, V = hsv(a)
    vis = a[..., 3] > 20
    # 옆 칸에서 넘어온 파란 조각 지우기 (왼쪽 22%)
    xx = np.arange(a.shape[1])[None, :].repeat(a.shape[0], 0)
    blue = vis & (H > 190) & (H < 270) & (S > 0.2) & (xx < a.shape[1] * 0.22)
    a[..., 3][blue] = 0
    red = vis & ((H < 18) | (H > 335)) & (S > 0.38) & (V > 0.22)
    edit(a, red, h=176, s=lambda H, S, V: S * 0.55, v=lambda H, S, V: np.minimum(1, V * 1.05 + 0.08))
    H, S, V = hsv(a)
    black = vis & (S < 0.3) & (V < 0.38)
    edit(a, black, h=218, s=lambda H, S, V: 0.2 + 0 * S, v=lambda H, S, V: V * 1.15 + 0.08)


def main():
    targets = [
        ("creatures-front.png", 6, 6, [(16, kitten), (23, tortoise)]),
        ("creatures-back.png", 6, 6, [(16, kitten), (23, tortoise)]),
        ("characters-original.png", 7, 4, [(25, lambda a: villain(a, True))]),
        ("characters-back.png", 7, 4, [(25, lambda a: villain(a, False))]),
    ]
    for f, cols, rows, edits in targets:
        p = os.path.join(ROOT, f)
        im = Image.open(p).convert("RGBA")
        arr = np.array(im)
        for i, fn in edits:
            l, t, r, b = box(im.width, im.height, cols, rows, i)
            sub = arr[t:b, l:r].copy()
            fn(sub)
            arr[t:b, l:r] = sub
        Image.fromarray(arr).save(p)
        print("고침", f)


if __name__ == "__main__":
    sys.exit(main())
