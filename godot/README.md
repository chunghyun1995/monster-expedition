# 몬스터 원정대 — Godot 4 판 (모션 미리보기)

기존 웹 게임(`src/*.js`)의 데이터와 2.5D 그림을 그대로 쓰고, Godot 4.7(GL Compatibility)로 동작을 새로 만든 미리보기입니다.
기존 Canvas 그리기로는 어려웠던 **그림 한 장을 격자 메시로 휘게 하는 모션**이 핵심입니다.

| 장면 | 내용 |
| --- | --- |
| 타이틀 | 몬스터들이 각자 다른 기본 움직임, 주인공이 걸어 들어옴 |
| 필드 (새싹마을 ↔ 1번 도로) | 칸 이동(걷기 프레임 크로스페이드·통통·착지 눌림·달리기 기울기·먼지), 턱 뛰어내리기, 흔들리는 나무·꽃, 지나가면 출렁이는 풀숲, 일렁이는 물, 걸어 다니고 종이 인형처럼 돌아서는 마을 사람, 시선이 마주치면 "!" 하고 다가오는 트레이너 |
| 전투 | 실루엣 등장, 캡슐에서 튀어나오기, 예비 동작→돌진→히트스톱→넉백·출렁임, 기 모으기·발사체·번개, 상태 이상 연출, 능력 변화 빛, 빛 조각으로 흩어지는 쓰러짐, 캡슐 흡수·통통·흔들흔들·딸깍/탈출, 레벨 업 |
| 모션 보기 | 몬스터 34종 + 사람 26명의 기본 움직임 |

## 구조

- `scripts/puppet.gd` + `shaders/deform.gdshader`: 퍼펫(숨쉬기·납작/길쭉·기울기·휨·흔들림·출렁임·걷기·날개짓·일렁임·번쩍임·실루엣·빛·흩어짐)
- `scripts/player.gd`, `npc.gd`, `field.gd`, `battle.gd`, `fx.gd`(파티클), `touch_pad.gd`(화면 패드), `message_box.gd`
- `data/game.json`: `node tools/godot-data.cjs`로 기존 게임 데이터에서 생성 · `data/bounds.json`: `python3 tools/godot-bounds.py`
- 글꼴: Galmuri11 (SIL OFL, `fonts/OFL-Galmuri.txt`)

## 빌드

`.github/workflows/godot.yml`이 웹·APK·AAB를 만들고(targetSdk 36, 16KB 정렬 검사, 저장소 서명 키), main이면 `godot-번호` 사전 출시로 올립니다.
패키지 이름은 `io.github.chunghyun1995.monsterexpedition.godot`라 기존 앱과 따로 설치됩니다.

로컬: Godot 4.7.2 편집기로 `godot/project.godot`을 열고 실행. 개발용 바로가기: 실행 인자 `-- field|battle|trainer|person|gallery` 또는 웹 주소 `#battle`.
