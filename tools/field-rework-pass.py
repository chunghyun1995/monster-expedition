# 2차 원작 연상 요소 정리 (2026-10-11, 한 번만 실행): 데이터·화면 문구
#   - 원정가 직업명(원작 트레이너 직업과 1:1로 대응하던 이름) 교체, 일부 직업 상투 대사 교체
#   - 한쪽으로만 내려가는 턱(L) 제거 → 주변 땅
#   - "풀숲" → "관측 구역"
# 내부 ID(cls·map id·flag)는 저장 호환을 위해 그대로 둔다.
import json, os, sys

ROOT = os.path.join(os.path.dirname(__file__), '..')
P = lambda *p: os.path.join(ROOT, *p)

CLASS = {
    'kid': '견습 기록원', 'girl': '생물 사진가', 'camper': '산림 조사원', 'bugboy': '표본 연구생',
    'hiker': '지질 조사원', 'swimmer': '수질 측정원', 'fisher': '하천 기록원', 'lass': '관측 통신원',
    'birdkeeper': '기상 관측원', 'engineer': '센서 정비사', 'ranger': '고지대 순찰대',
}
# (지도, 원정가 이름, 바꿀 필드, 원래 문장, 새 문장)
LINES = [
    ('route2', '동훈', 'lose', '캠프파이어가 꺼져 버렸어...', '조사 노트가 바람에 날아갔어...'),
    ('route2', '길동', 'intro', '오늘은 고기 대신 원정가를 낚아 볼까!', '물가에서 모은 기록, 한번 비교해 볼까!'),
    ('route2', '길동', 'lose', '놓친 고기가 크다더니...', '측정값이 한참 모자랐네...'),
    ('route3', '민혁', 'intro', '여기서 캠핑하면 밤에도 따뜻해!', '화산길 식생 조사 중이야. 내 동료도 볼래?'),
    ('route3', '민혁', 'lose', '텐트가 타 버렸어...', '표본 상자가 그을려 버렸어...'),
    ('route2', '하늘', 'lose', '나풀나비가 날아가 버렸다...', '표본 정리가 아직 덜 됐었나 봐...'),
]
# 화면 문구 (파일, 원래, 새)
TEXT = [
    ('godot/data/game.json', '나랑? 좋아, 풀숲에서 갈고닦은 실력 보여 줄게!', '나랑? 좋아, 관측 구역에서 갈고닦은 실력 보여 줄게!'),
    ('godot/data/game.json', '생물을 데리고 다니면 풀숲도 무섭지 않대!', '생물을 데리고 다니면 관측 구역도 무섭지 않대!'),
    ('godot/data/game.json', '풀숲에서는 야생 생물이 튀어나오지.', '테두리가 있는 관측 구역에서는 생물의 신호가 잡히지.'),
    ('godot/scripts/events.gd', '앗, 풀숲에서 무언가 바스락거린다...', '길 너머 관측 구역에서 생물의 신호가 잡힌다...'),
    ('godot/scripts/guides.gd', '자동 사냥은 풀숲을 찾아', '자동 사냥은 관측 구역을 찾아'),
    ('godot/scripts/auto.gd', '이동할 수 있는 풀숲이 없어서', '이동할 수 있는 관측 구역이 없어서'),
    ('godot/scripts/battle.gd', '풀숲이 흔들리더니 %s 모습을 드러냈다!', '신호를 따라가자 %s 모습을 드러냈다!'),
]


def data_pass(g):
    for k, n in CLASS.items():
        g['tclass'][k]['n'] = n
    for mid, name, field, old, new in LINES:
        hit = [n['trainer'] for n in g['maps'][mid]['npcs'] if n.get('trainer') and n['trainer']['name'] == name]
        assert len(hit) == 1, (mid, name)
        t = hit[0]
        if isinstance(t[field], list):
            assert old in t[field], (mid, name, old)
            t[field] = [new if s == old else s for s in t[field]]
        else:
            assert t[field] == old, (mid, name, t[field])
            t[field] = new
    for mid, m in g['maps'].items():
        if any('L' in r for r in m['rows']):
            ground = ':' if mid == 'route3' else '.'
            m['rows'] = [r.replace('L', ground) for r in m['rows']]


def main():
    path = P('godot/data/game.json')
    raw = open(path, encoding='utf-8', newline='').read()
    g = json.loads(raw)
    if g['tclass']['kid']['n'] == CLASS['kid']:
        sys.exit('이미 적용됨')
    data_pass(g)
    files = {path: json.dumps(g, ensure_ascii=False, separators=(',', ':'))}
    for rel, old, new in TEXT:
        f = P(rel)
        s = files.get(f) or open(f, encoding='utf-8', newline='').read()
        assert s.count(old) == 1, (rel, old)
        files[f] = s.replace(old, new)
    for f, s in files.items():
        open(f, 'w', encoding='utf-8', newline='').write(s)
    print('ok', len(files), 'files')


main()
