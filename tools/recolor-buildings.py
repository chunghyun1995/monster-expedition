# 관측 캠프(분홍 지붕 + 하트 장식)·보급소(파란 지붕·차양) 그림이 원작 회복 시설·상점을 연상시켜 색과 문양을 바꾼다.
#   python3 tools/recolor-buildings.py   (godot/assets/props.webp의 9·10번 칸을 고침, 한 번만 실행)
import colorsys, os, sys
from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(__file__), '..')
PATH = os.path.join(ROOT, 'godot/assets/props.webp')
CELL = 192


def shift(im, box, keep, new_hue, y_max, sat_mul=1.0, val_mul=1.0, min_sat=0.28):
    """box 안에서 hue가 keep(hue)에 맞는 채도 있는 픽셀의 색상을 new_hue로 옮긴다 (y_max 위쪽만)."""
    px = im.load()
    x0, y0, x1, y1 = box
    for y in range(y0, min(y1, y0 + y_max)):
        for x in range(x0, x1):
            r, g, b, a = px[x, y]
            if a < 10:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if s < min_sat or not keep(h * 360):
                continue
            r2, g2, b2 = colorsys.hsv_to_rgb(new_hue / 360, min(1, s * sat_mul), min(1, v * val_mul))
            px[x, y] = (int(r2 * 255), int(g2 * 255), int(b2 * 255), a)


def lens_badge(im, cx, cy):
    """하트 자리에 관측 렌즈(돋보기) 문양: 크림색 바탕 위 청록 렌즈 + 손잡이"""
    S = 4
    w = 64
    layer = Image.new('RGBA', (w * S, w * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    c = w * S // 2
    # 하트 모양 판자를 통째로 덮는 둥근 판
    d.ellipse((c - 29 * S, c - 26 * S, c + 29 * S, c + 26 * S), fill=(120, 84, 52, 255))
    d.ellipse((c - 26 * S, c - 23 * S, c + 26 * S, c + 23 * S), fill=(250, 240, 222, 255))
    d.ellipse((c - 9 * S, c - 10 * S, c + 5 * S, c + 4 * S), outline=(28, 110, 110, 255), width=3 * S, fill=(170, 225, 220, 255))
    d.line((c + 3 * S, c + 2 * S, c + 10 * S, c + 9 * S), fill=(110, 70, 40, 255), width=4 * S)
    d.ellipse((c - 6 * S, c - 7 * S, c - 1 * S, c - 3 * S), fill=(235, 255, 250, 255))
    small = layer.resize((w, w), Image.LANCZOS)
    im.alpha_composite(small, (cx - w // 2, cy - w // 2))


def main():
    im = Image.open(PATH).convert('RGBA')
    camp = (3 * CELL, 1 * CELL, 4 * CELL, 2 * CELL)   # 9번 칸
    mart = (4 * CELL, 1 * CELL, 5 * CELL, 2 * CELL)   # 10번 칸
    px = im.load()
    r, g, b, _ = px[camp[0] + 96, camp[1] + 30]
    if g > r:   # 이미 청록 지붕
        sys.exit('이미 적용됨')
    # 하트 장식 → 렌즈 문양 (분홍을 옮기기 전에 덮는다)
    lens_badge(im, camp[0] + 96, camp[1] + 102)
    # 분홍 지붕 → 청록 (아래쪽 화단 꽃은 그대로)
    shift(im, camp, lambda h: h >= 300 or h <= 20, 172, 118, 0.85, 0.92)
    # 파란 지붕·차양 → 호박색
    shift(im, mart, lambda h: 185 <= h <= 255, 30, 150, 0.95, 1.0, 0.06)
    im.save(PATH, 'WEBP', lossless=True)
    print('ok', os.path.getsize(PATH))


main()
