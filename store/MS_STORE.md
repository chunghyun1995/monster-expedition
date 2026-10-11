# Microsoft Store 등록 (Windows판)

CI(`.github/workflows/godot.yml`의 `windows-package`)가 main 빌드마다 두 파일을 릴리스에 올립니다.

| 파일 | 용도 |
| --- | --- |
| `VeloriaFieldnotes.msix` | Partner Center 업로드용 패키지(서명 없음 — 스토어가 서명) |
| `VeloriaFieldnotes-windows-x64.zip` | 압축을 풀고 `VeloriaFieldnotes.exe`를 실행하는 PC판(테스트·배포용) |

CI는 Windows 러너에서 게임을 헤드리스로 켰다 꺼서 오류가 없는지 보고, 임시 인증서로 서명한 사본을 실제로 설치해 봅니다.

## 1. 앱 이름 예약 → 패키지 ID 받기
1. <https://partner.microsoft.com/dashboard> 에서 개인 개발자 계정을 만듭니다.
2. **앱 및 게임 → 새 제품 → MSIX 또는 PWA 앱**, 이름 `벨로리아 생태기록` 예약.
3. 예약한 앱의 **제품 관리 → 제품 ID(Product identity)** 에서 세 값을 확인합니다.
   - `Package/Identity/Name` (예: `12345Chunghyun.VeloriaFieldnotes`)
   - `Package/Identity/Publisher` (예: `CN=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX`)
   - `Package/Properties/PublisherDisplayName`

## 2. 저장소에 값 넣기 (한 번만)
GitHub 저장소 **Settings → Secrets and variables → Actions → Variables** 에 세 개를 만듭니다(비밀값 아님).

| 이름 | 값 |
| --- | --- |
| `MSIX_IDENTITY_NAME` | Package/Identity/Name |
| `MSIX_PUBLISHER` | Package/Identity/Publisher (`CN=`로 시작) |
| `MSIX_PUBLISHER_DISPLAY_NAME` | PublisherDisplayName |

값을 넣은 뒤 main 빌드(또는 Actions에서 Godot 워크플로 수동 실행)가 만든 MSIX여야 업로드가 통과합니다. 값이 없으면 임시 ID로 만들어져 업로드 단계에서 거부됩니다.

## 3. 제출
- **패키지**: 릴리스의 `VeloriaFieldnotes.msix` 업로드. 버전은 `4.0.(빌드 번호).0`이라 매번 커집니다.
- **속성**: 범주 게임 › 롤플레잉, 개인정보처리방침 `https://chunghyun1995.github.io/monster-expedition/privacy.html`
- **연령 등급**: IARC 설문 — 플레이 스토어와 같은 답(만화풍 판타지 폭력, 피 없음, 비속어·구매·소통 없음)
- **스토어 목록**: 설명 문구는 `store/README.md`의 스토어 등록정보 문구를 그대로 쓰면 됩니다. 스크린샷은 Windows 화면 크기를 요구하므로 zip판을 PC에서 실행해 찍거나 `store/screenshots/`의 세로 화면을 사용합니다.
- **게임 표시 이미지**(스토어 목록 › 스토어 로고): `store/ms/box-art-1x1.png`(1:1 박스 아트, 2160×2160), `store/ms/poster-art-2x3.png`(2:3 포스터 아트, 1440×2160). `python3 tools/ms-store-art.py`로 다시 만듭니다.
- **runFullTrust 사용 사유**(제한된 기능 질문): "Godot 엔진으로 만든 일반 데스크톱 게임 실행 파일(Win32)이라 전체 신뢰 실행이 필요함."

## 참고
- 조작: 키보드(방향키·Z/X/C, Enter·Esc) 또는 마우스로 화면 패드·버튼을 누릅니다.
- 저장 위치: `%APPDATA%\Godot\app_userdata\벨로리아 생태기록` (MSIX 설치판은 Windows가 앱 전용 폴더로 옮겨 저장)
