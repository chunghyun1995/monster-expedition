# 진행 메모: 2차 원작 연상 요소 정리 + 편의 수정 (브랜치 claude/monster-expedition-apk-s582te)

중간에 멈춰도 이 파일의 체크리스트부터 이어서 진행한다. 끝나면 이 파일은 지운다.

## 요청 (2026-10-11)
1. 강제 대결 없애기: 원정가가 시선으로 다가오지 않고, 말을 걸면 "기록 비교" 수락/거절
2. 직업명·역할 재구성 (꼬마·소녀·야영객 등 원작 직업 대응 제거), 상금 공식 변경
3. 풀숲 → 지도별 "관측 구역"(바닥·장식·점선 테두리) + 조우 직전 신호 파동
4. 턱(한쪽 통행 L) 제거
5. 건물 문 위 이름판
6. 자동전투: 전투마다 꺼진 상태로 시작 (설정 "전투 시작 시 자동전투", 기본 끔)
7. Windows: 창 크기 고정(최대화 버튼 비활성) — 전체화면 대응은 나중에

## 상태
- [x] 1 world.gd `_sight_check`(이야기 장면만), `trainer_talk` 수락 질문
- [x] 2 tools/field-rework-pass.py(실행 완료, 다시 실행 금지), battle.gd 지원금·이송비
- [x] 3 world.gd ZONES·`_signal_cue`, 문구 "풀숲"→"관측 구역"
- [x] 4 데이터 L 제거, world.gd/auto.gd 턱 코드 제거
- [x] 5 world.gd `_name_plate`
- [x] 6 auto.gd `fight_on`, game.gd `autoStart`, battle.gd 시작 시 초기화, 설정 메뉴
- [x] 7 project.godot `window/size/resizable.windows=false`
- [x] 회귀·new_survey 테스트: CI run 38113124629 build 통과 (fc44553)
- [x] 웹 내보내기로 화면 확인(관측 구역·이름판·원정가 대화) — 화산길·건물 색은 재확인 필요
- [ ] docs/SIMILARITY_AUDIT_2026-10-11.md에 2차 수정 기록, store/README.md 문구 확인
- [x] 관측 캠프 지붕 청록+렌즈 문양, 보급소 호박색 (tools/recolor-buildings.py 실행 완료, 다시 실행 금지)
- [x] 화산길 관측 구역 바닥이 용암(14)으로 나오던 것 → 15(모래)+회색
- [ ] PR → CI → 머지 → 릴리스 링크(APK/AAB/MSIX/zip) 전달
