# 진행 메모: 3차 원작 연상 요소 정리 (브랜치 claude/monster-expedition-apk-s582te)

중간에 멈춰도 이 체크리스트부터 이어서 진행한다. 끝나면 이 파일은 지운다.

## 요청 (2026-10-11)
1. 연구소 책상에서 셋 중 하나 고르기 → 새 게임 시작 직후(마을) 고르기
2. 획득 직후 애칭 묻기 제거 → 동료 메뉴 "이름 바꾸기"
3. 전투 체력·레벨 상자(구석 HUD) → 캐릭터·생물 머리 위 체력바
4. 관측 구역(걸으면 확률 조우) 제거 → 그 자리에 "조사 나무". 나무 조사 → "조사를 시작할까요?" [시작하자]/[돌아가자] → 무작위 생물

## 상태
- [x] 1 title.gd(마을 4,13에서 시작, Game.dev=opening_starter), events.gd choose_starter/give_starter(sid)/lab_briefing, 캡슐 제거, 테스트 수정
- [x] 2 battle.gd·events.gd·menus.gd 애칭 질문 제거, menus.gd rename()
- [ ] 3 battle.gd make_hud/hide_hud → 머리 위 바
- [ ] 4 데이터 ","→땅 + 구역마다 조사 나무(새 타일), world.gd 상호작용·그리기, auto.gd 자동 사냥, 문구
- [ ] CI 테스트 → 웹 화면 확인 → 문서(SIMILARITY_AUDIT) → PR → 머지 → 링크
