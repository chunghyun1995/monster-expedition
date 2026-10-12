# 벨로리아 생태기록 / VELORIA FIELDNOTES

Godot 4.7.2로 제작한 세로 화면 생태 조사 RPG입니다. 폭풍 뒤에 끊어진 다섯 관측소를 연결하고, 사람과 생물 동료와 함께 현장 기록을 모읍니다.

## 실행 및 빌드

Godot에서 `godot/project.godot`을 열어 실행합니다. Android 패키지 ID는 기존 설치본 업데이트를 위해 `io.github.chunghyun1995.monsterexpedition`을 유지합니다. APK/AAB는 `.github/workflows/godot.yml`로 생성하고 회귀 테스트·targetSdk·16KB 정렬·서명·Android 에뮬레이터 실행을 검사합니다. 배포 빌드에는 저장소의 기존 서명 키가 필요합니다.

기능: 지도 40곳, 전투·공명 동행·진화·상점·보관함·합성, 사람 동료의 자발적 합류, 무한의 탑 100층, 자동전투·자동진행, 최초 사용 안내, 리포트 저장.

## 웹판

main 빌드마다 GitHub Pages에 배포됩니다: <https://chunghyun1995.github.io/monster-expedition/> (예전 웹 게임은 `/classic/`, 개인정보처리방침은 `/privacy.html`). 처음 한 번 저장소 Settings › Pages › Source를 "GitHub Actions"로 바꿔야 합니다. 웹판 저장은 브라우저(IndexedDB)에 남습니다.

## 출처와 확인 범위

[2026-10-11 표현 개정 및 에셋 기록](docs/ASSET_RECORD_2026-10-11.md). 법률 검토나 비침해 보증을 대신하지 않습니다. Godot·Galmuri·Android 의존성 라이선스는 앱 설정의 라이선스 화면과 `godot/licenses`에 포함합니다.

`src`와 루트 `index.html`은 이전 웹/WebView 구현의 소스와 배포물입니다. 이번 Android 개정 릴리스의 실행 코드는 `godot`입니다. 이전 웹 배포물을 이번 개정 Android 판으로 오인하지 마세요. 웹 내보내기는 Godot 워크플로의 `godot-web` 아티팩트로 생성합니다.

생성 과정의 단발성 마이그레이션 스크립트(`revise-expression.py`, `finish-release.py`, `final-metadata.py`)는 이미 적용한 파일에 재실행하지 마세요.
