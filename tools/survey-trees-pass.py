# 3차 원작 연상 요소 정리 (2026-10-11, 한 번만 실행): 걸으면 확률로 조우하던 관측 구역(",")을 없애고
# 구역마다 "조사 나무"(J) 한 그루를 둔다. 나무를 조사하면 "조사를 시작할까요?" → 무작위 생물.
#   - 구역 칸은 주변 땅(화산길 ":", 나머지 ".")으로 바꾼다
#   - 나무는 구역 가운데에 가까우면서, 놓아도 다른 칸으로 가는 길이 끊기지 않고 옆에서 조사할 수 있는 칸에 둔다
import json, os, sys
from collections import deque

ROOT = os.path.join(os.path.dirname(__file__), '..')
P = lambda *p: os.path.join(ROOT, *p)
WALK = set(".=fQD:O")
MIN_ZONE = 6
TEXT = [
    ('godot/data/game.json', '나랑? 좋아, 관측 구역에서 갈고닦은 실력 보여 줄게!', '나랑? 좋아, 조사 나무 아래에서 갈고닦은 실력 보여 줄게!'),
    ('godot/data/game.json', '생물을 데리고 다니면 관측 구역도 무섭지 않대!', '생물을 데리고 다니면 조사 나무 근처도 무섭지 않대!'),
    ('godot/data/game.json', '테두리가 있는 관측 구역에서는 생물의 신호가 잡히지.', "'조사' 팻말이 달린 나무를 살펴보면 근처 생물을 만날 수 있지."),
    ('godot/scripts/guides.gd', '자동 사냥은 관측 구역을 찾아', '자동 사냥은 조사 나무를 찾아'),
    ('godot/scripts/auto.gd', '이동할 수 있는 관측 구역이 없어서', '조사할 수 있는 나무가 없어서'),
]


def blocked_cells(m):
    out = set()
    for n in m.get('npcs', []):
        out.add((n['x'], n['y']))
    for it in m.get('items', []):
        out.add((it['x'], it['y']))
    for t in m.get('trig', []):
        for y in range(t['y'], t['y'] + t['h']):
            for x in range(t['x'], t['x'] + t['w']):
                out.add((x, y))
    for k in list(m.get('warps', {})) + list(m.get('signs', {})) + list(m.get('obj', {})):
        x, y = map(int, k.split(','))
        out.add((x, y))
    return out


def reach(rows, starts):
    H, W = len(rows), len(rows[0])
    seen = set(s for s in starts if rows[s[1]][s[0]] in WALK)
    q = deque(seen)
    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < W and 0 <= ny < H and (nx, ny) not in seen and rows[ny][nx] in WALK:
                seen.add((nx, ny))
                q.append((nx, ny))
    return seen


def entries(m, rows):
    H, W = len(rows), len(rows[0])
    s = [(x, y) for y in range(H) for x in range(W) if (x in (0, W - 1) or y in (0, H - 1)) and rows[y][x] in WALK]
    for k in m.get('warps', {}):
        s.append(tuple(map(int, k.split(','))))
    return s


def zones(rows):
    H, W = len(rows), len(rows[0])
    seen, out = set(), []
    for y in range(H):
        for x in range(W):
            if rows[y][x] != ',' or (x, y) in seen:
                continue
            comp, q = [], deque([(x, y)])
            seen.add((x, y))
            while q:
                cx, cy = q.popleft()
                comp.append((cx, cy))
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = cx + dx, cy + dy
                    if 0 <= nx < W and 0 <= ny < H and (nx, ny) not in seen and rows[ny][nx] == ',':
                        seen.add((nx, ny))
                        q.append((nx, ny))
            out.append(comp)
    return out


def plant(mid, m):
    ground = ':' if mid == 'route3' else '.'
    zs = zones(m['rows'])
    rows = [list(r.replace(',', ground)) for r in m['rows']]
    bad = blocked_cells(m)
    placed = []
    for comp in zs:
        if len(comp) < MIN_ZONE:
            continue
        cx = sum(c[0] for c in comp) / len(comp)
        cy = sum(c[1] for c in comp) / len(comp)
        for (x, y) in sorted(comp, key=lambda c: (c[0] - cx) ** 2 + (c[1] - cy) ** 2):
            if (x, y) in bad:
                continue
            before = reach(rows, entries(m, rows))
            if (x, y) not in before:
                continue
            rows[y][x] = 'J'
            after = reach(rows, entries(m, rows))
            side = any((x + dx, y + dy) in after for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
            if after == before - {(x, y)} and side:
                placed.append((x, y))
                break
            rows[y][x] = ground
        else:
            sys.exit(f'{mid}: 구역 {comp[0]}에 나무를 둘 칸이 없음')
    m['rows'] = [''.join(r) for r in rows]
    return placed


def main():
    path = P('godot/data/game.json')
    raw = open(path, encoding='utf-8', newline='').read()
    g = json.loads(raw)
    if any('J' in r for m in g['maps'].values() for r in m['rows']):
        sys.exit('이미 적용됨')
    for mid, m in g['maps'].items():
        if any(',' in r for r in m['rows']):
            print(mid, plant(mid, m))
    assert not any(',' in r for m in g['maps'].values() for r in m['rows'])
    files = {path: json.dumps(g, ensure_ascii=False, separators=(',', ':'))}
    for rel, old, new in TEXT:
        f = P(rel)
        s = files.get(f) or open(f, encoding='utf-8', newline='').read()
        assert s.count(old) == 1, (rel, old)
        files[f] = s.replace(old, new)
    for f, s in files.items():
        open(f, 'w', encoding='utf-8', newline='').write(s)
    print('ok')


main()
