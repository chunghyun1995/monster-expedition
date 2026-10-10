# Godot 전체 이식 진행 상황 (작업 중)

## 끝난 것
- 배포 APK arm64만(159MB → 84MB), 에뮬레이터용 x86_64 APK 분리 (CI 통과)
- 플레이 스토어 고칠 점 3가지 반영 (아이콘 RGBA, 스크린샷, 닮은 그림 3종) — 웹 게임·Godot 모두
- `tools/godot-data.cjs`: 40개 지도·NPC 116명·싸우자 대사·대타 데이터 전부 `data/game.json`으로
- 새로 쓴 스크립트(아직 실행 검사 전):
  - `game.gd` 상태·저장(user://report.save)·몬스터 계산·조사·탑 난수
  - `msg.gd` 공용 대화창·선택지·목록·수량·이름 입력·알림 (autoload 이름: Msg)
  - `menus.gd` 메뉴·파티·요약·가방·도감·카드·지도·리포트·설정·상점·쉼터·PC·합성·레벨업·기술·진화·배지·엔딩 (autoload 이름: Menus)
  - `world.gd` 40개 지도 공통 필드(실내·실외·건물·문·연결·트리거·시선·풀숲·아이템·대타)
  - `events.gd` 모든 이야기 이벤트(연구소·라이벌 5회·관장 5명·검은안개단·전설·무한의 탑·싸우자)
  - `battle.gd` 전투 전체(빼앗기·화난 트레이너·맨손 승부·최후의 수단·상금·경험치 분배)
  - `npc.gd`, `emote.gd`, `capsule.gd`

## 확인 완료 (2단계)
- autoload(Msg·Menus) 등록, world.tscn, 새 타이틀(이어하기·처음부터·모션 보기·설정)·오프닝(이름 입력 → 집 → 엄마)
- 지도 40곳 화면 확인, 자동 점검 `selftest`로 40곳 모든 사람과 대화·전투(108회)·조사·트리거 실행 → 오류 0
- 사람과 맨손 승부 + 캡슐 던지기(탈출·화남) 화면 확인, 안드로이드 뒤로 가기 = B

## 다음에 할 것 (순서대로)
1. project.godot autoload에 `Msg="*res://scripts/msg.gd"`, `Menus="*res://scripts/menus.gd"` 추가
2. `scenes/world.tscn` 만들기(스크립트 world.gd), 옛 `field.gd`·`field.tscn`·`message_box.gd` 삭제
3. `title.gd` 다시 쓰기: 이어하기(Game.read_save) / 처음부터(오프닝: 박사 대사 + 이름 입력 → 집에서 엄마 이벤트) / 설정, 개발용 #dev 명령은 Game.dev 로 world에 전달
4. 헤드리스 실행으로 문법 오류 잡기 → 웹 내보내기 → 지도 40개 화면 확인, 전투·포획·진화·상점·저장 확인
5. 커밋·푸시 → CI(웹·APK·AAB·에뮬레이터) 통과 확인
6. (선택) 효과음·배경음 이식(audio.js 합성음), 기존 웹 게임 저장 코드(ME3) 불러오기
