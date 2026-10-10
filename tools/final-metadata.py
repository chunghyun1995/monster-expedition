import hashlib,json,re,urllib.request
from pathlib import Path
R=Path(__file__).resolve().parent.parent
p=R/'godot/scripts/menus.gd';s=p.read_text(encoding='utf-8');line='\tnotice.text = "Godot Engine\\n"'
start=s.index(line);end=s.index('\n',start)
s=s[:end]+'\n\tfor filename in ["Android-NOTICE.txt", "Apache-2.0.txt", "JSpecify-LICENSE.txt", "Kotlin-LICENSE.txt", "Coroutines-LICENSE.txt"]:\n\t\tnotice.text += "\\n\\n" + filename + "\\n" + FileAccess.get_file_as_string("res://licenses/" + filename)'+s[end:]
p.write_text(s,encoding='utf-8')
p=R/'src/vendor_qr.js';s=p.read_text(encoding='utf-8');license=(R/'godot/licenses/QR-MIT.txt').read_text(encoding='utf-8');p.write_text('/*\n'+license+'\n*/\n'+s,encoding='utf-8')
# POM of annotations 13.0 explicitly identifies Apache 2.0. Versioned source
# archive contains the notices; do not invent a missing tagged LICENSE URL.
(R/'godot/licenses/JetBrains-annotations-LICENSE.txt').write_text('JetBrains annotations 13.0\nUpstream POM: https://repo.maven.apache.org/maven2/org/jetbrains/annotations/13.0/annotations-13.0.pom\nLicense: Apache License, Version 2.0. See included Apache-2.0.txt.\nCopyright JetBrains s.r.o. and contributors.\n',encoding='utf-8')
hashes={str(p.relative_to(R)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [R/'assets/generated/characters-original.png',R/'assets/generated/characters-back.png',R/'assets/generated/revision-2026-10-11/creature-pairs.png',R/'assets/SCORE_2026-10-11.json',*sorted((R/'godot/assets/audio/bgm').glob('*.ogg')),*sorted((R/'godot/assets/audio/jingle').glob('*.ogg'))]}
(R/'assets/generated/revision-2026-10-11/HASHES.json').write_text(json.dumps(hashes,ensure_ascii=False,indent=2),encoding='utf-8')
p=R/'.github/workflows/godot.yml';s=p.read_text(encoding='utf-8')
s=s.replace('echo "::warning::서명 키 시크릿이 없어 디버그 키로 서명합니다."\n            exit 0','if [ "$GITHUB_EVENT_NAME" = "pull_request" ]; then\n              echo "::notice::PR 검증은 디버그 키를 사용합니다."\n              exit 0\n            fi\n            echo "::error::배포 빌드는 기존 업데이트 서명 키가 필요합니다."\n            exit 1')
s=s.replace("if: github.ref == 'refs/heads/main' && github.event_name != 'pull_request'","if: (github.ref == 'refs/heads/main' || github.ref == 'refs/heads/fix/original-expedition-release') && github.event_name != 'pull_request'")
s=s.replace("format('godot-{0}', github.run_number)","format('veloria-{0}', github.run_number)")
s=s.replace('name: 몬스터 원정대 Godot 판','name: 벨로리아 생태기록')
body='''          body: |
            **벨로리아 생태기록 / VELORIA FIELDNOTES** — Godot Android 개정판

            - 폭풍 이후 관측망 복구 이야기와 조사 역할 기반 첫 동료
            - 새 인물 27종 앞·뒤 그림, 생물 3종 새 디자인
            - 비구형 공명등의 연속 신호 조율, 흡수·축소·네 번 흔들기 제거
            - 새 악보의 BGM 13곡·팡파르 8개, 효과음 42개·울음 34종
            - 기존 UI 보정·최초 안내·자동전투·자동진행·무한의 탑 유지
            - Android 의존성 고지와 라이선스 전문 포함

            APK는 휴대폰 설치용(arm64), AAB는 Google Play 콘솔 업로드용입니다.
            Android 7.0 이상 · targetSdk 36 · 16KB 정렬·서명 검사·Android 16 실행 검증.
            기존 Android 패키지 ID와 업데이트 서명 키를 유지합니다.

            확인된 유사 표현을 수정한 빌드이며 법적 비침해 보증은 아닙니다.
            변경 및 출처 확인 범위: docs/ASSET_RECORD_2026-10-11.md
            커밋: ${{ github.sha }}
'''
s=s[:s.index('          body: |')]+body;p.write_text(s,encoding='utf-8')
(R/'README.md').write_text('''# 벨로리아 생태기록 / VELORIA FIELDNOTES

Godot 4.7.2로 제작한 세로 화면 생태 조사 RPG입니다. 폭풍 뒤에 끊어진 다섯 관측소를 연결하고, 사람과 생물 동료와 함께 현장 기록을 모읍니다.

## 실행 및 빌드

Godot에서 `godot/project.godot`을 열어 실행합니다. Android 패키지 ID는 기존 설치본 업데이트를 위해 `io.github.chunghyun1995.monsterexpedition`을 유지합니다. APK/AAB는 `.github/workflows/godot.yml`로 생성하고 회귀 테스트·targetSdk·16KB 정렬·서명·Android 에뮬레이터 실행을 검사합니다. 배포 빌드에는 저장소의 기존 서명 키가 필요합니다.

기능: 지도 40곳, 전투·공명 동행·진화·상점·보관함·합성, 사람 동료의 자발적 합류, 무한의 탑 100층, 자동전투·자동진행, 최초 사용 안내, 리포트 저장.

## 출처와 확인 범위

[2026-10-11 표현 개정 및 에셋 기록](docs/ASSET_RECORD_2026-10-11.md). 법률 검토나 비침해 보증을 대신하지 않습니다. Godot·Galmuri·Android 의존성 라이선스는 앱 설정의 라이선스 화면과 `godot/licenses`에 포함합니다.

`src`와 루트 `index.html`은 이전 웹/WebView 구현의 소스와 배포물입니다. 이번 Android 개정 릴리스의 실행 코드는 `godot`입니다. 이전 웹 배포물을 이번 개정 Android 판으로 오인하지 마세요. 웹 내보내기는 Godot 워크플로의 `godot-web` 아티팩트로 생성합니다.

생성 과정의 단발성 마이그레이션 스크립트(`revise-expression.py`, `finish-release.py`, `final-metadata.py`)는 이미 적용한 파일에 재실행하지 마세요.
''',encoding='utf-8')
print('Included licences, provenance hashes, release-only signing requirement, preview release workflow and accurate README.')
