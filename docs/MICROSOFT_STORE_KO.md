# Windows / Microsoft Store 빌드

대상: Windows 10 1809 이상 및 Windows 11의 x64 PC. Godot 4.7.2 GL Compatibility, OpenGL 3.3 그래픽 장치. Xbox 콘솔용 빌드가 아니다.

게임은 `VeloriaFieldnotes.exe`와 같은 폴더의 `VeloriaFieldnotes.pck`로 구성한다. 임시 Windows 프리셋은 `tools/windows-export.cfg`이며 Android 프리셋을 바꾸지 않는다. `tools/Build-Windows.ps1`은 Windows 내보내기 후 원래 프리셋을 복원하고 MSIX 아이콘을 준비한다.

필요한 도구: 공식 Godot 4.7.2 Windows 편집기 및 같은 버전의 x64 Windows debug/release 내보내기 템플릿, Python/Pillow, Microsoft Windows SDK의 MakeAppx.exe. SDK를 사용자에게 게임의 일부로 배포하지 않는다.

```powershell
./tools/Build-Windows.ps1 -GodotPath 'C:/tools/Godot.exe' -TemplateDirectory 'C:/tools/templates' -OutputDirectory 'C:/build/Veloria' -PythonPath python
$identity = Get-Content ./tools/windows-store-identity.json -Raw | ConvertFrom-Json
./tools/Package-WindowsStore.ps1 -GameDirectory 'C:/build/Veloria' -OutputDirectory 'C:/build/store' -IdentityName $identity.IdentityName -Publisher $identity.Publisher -PublisherDisplayName $identity.PublisherDisplayName -DisplayName $identity.DisplayName -Version $identity.Version -MakeAppxPath 'C:/tools/sdk/makeappx.exe'
```

`windows-store-identity.json`의 Name, Publisher, PublisherDisplayName은 사용자가 Partner Center에서 복사해 제공한 값이다. 표시 이름은 현재 게임 이름 ‘벨로리아 생태기록’이다. 예약한 표시 이름이 다르면 이 값을 예약 이름과 맞춰야 한다. 업데이트 때는 패키지 버전을 올리고 마지막 자릿수는 0을 유지한다.

MakeAppx의 기본 스키마·의미 검증을 활성화한 채 패키징한다. `/nv`로 검증을 생략하지 않는다. `-STORE.msix`는 제출용 미서명 MSIX이며 직접 설치용 파일이 아니다. Microsoft Store는 인증 후 패키지에 서명하므로 제출용 MSIX를 위해 개인 인증서를 구매할 필요는 없다. `-PREVIEW-IDENTITY-REQUIRED`는 구조 확인용 가짜 ID이며 업로드하면 안 된다.

업로드: Partner Center → 예약한 게임 → 제출 시작 → 패키지 → `-STORE.msix`. 게임 카테고리, IARC 연령 등급, 가격/지역, 설명·스크린샷·지원/개인정보 URL 등은 실제 내용에 따라 입력한다. restricted capability `runFullTrust`는 네이티브 Godot Win32 실행을 위해 필요하며, 해당 기능 설명을 요청하면 이 용도를 제출한다. Windows App Certification Kit(WACK) 검사와 Store의 최종 인증은 MakeAppx 패키지 구조 검사와 별개다.

게임 내부 메뉴 → 설정 → 라이선스는 Godot 엔진과 엔진에 포함된 구성요소의 고지, Galmuri 폰트와 기존 리소스 고지를 표시한다. 제작·법률 검토 범위는 `ASSET_RECORD_2026-10-11.md`를 참고한다.

공식 근거:
- https://learn.microsoft.com/en-us/windows/apps/publish/get-started
- https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/publish-first-app
- https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_windows.html
