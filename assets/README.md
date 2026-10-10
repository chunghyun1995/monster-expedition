# 2.5D 원본 자산

내장 이미지 생성 도구로 만든 몬스터 앞·뒷모습 34종, 등장인물 앞·뒷모습 27종, 주인공 방향별 포즈 16개, 배경 6곳, 소품 24개, 바닥 소재 16개입니다.

`generated/`는 생성 원본, `runtime/`은 게임에 쓰는 압축 WebP 묶음입니다. 프롬프트와 출처 기록은 [PROVENANCE.json](PROVENANCE.json)에 있습니다. 외부 게임의 이미지나 지도를 참조 입력으로 제공하지 않았습니다. 기존 게임의 지도 배열과 충돌·출입구 좌표는 유지했습니다.

자산 수정 후 `npm install --no-save sharp`, `node tools/prepare-art.cjs`, `python build.py` 또는 `node tools/build.cjs`를 실행합니다. `src/assets25d.js`와 `index.html`에 이미지가 내장되므로 Android에서도 인터넷 없이 작동합니다.

## 디자인 검토

주인공은 청록 케이프·코랄 재킷·겨자색 탐험 가방, 회복 담당자는 민트 머리·허브 가방·잎 브로치, 포획 도구는 청록색 다면체 씨앗 랜턴입니다. 유명 작품의 로고, 인물 이름, 지도, 스프라이트를 가져오지 않았습니다. 음악은 기존 코드 합성 음원이며 외부 게임 녹음이 아닙니다. Galmuri 글꼴의 기존 OFL 고지와 배포 라이선스는 유지합니다.

다른 작품과 닮아 보일 수 있는 3종은 `tools/redesign-art.py`로 생성 원본을 다시 칠했습니다(한 번만 실행).
- 17번 전기 고양이: 노란 털 → 하늘색, 귀 끝의 검은색 제거
- 24번 바위거북: 다시 그림 (`tools/redraw-tortoise.py`) — 등의 숲·산봉우리를 걷어내고 바위 띠에 박힌 자수정빛 수정 결정 무리로. 머리가 옆 칸까지 나와 있어 `prepare-art.cjs`가 넓은 상자로 자름
- 검은안개단원: 검은 제복·빨간 문양 → 짙은 회청색 제복·청록 문양

이 기록은 법률 검토나 권리 침해가 없다는 보증이 아닙니다. Google Play 등록 시 이미지뿐 아니라 앱 이름, 아이콘, 설명에도 타 작품과의 공식 관계를 암시하지 않아야 합니다. [Google Play 지식재산권 정책](https://support.google.com/googleplay/android-developer/answer/9888072?hl=ko), [명의 도용 정책](https://support.google.com/googleplay/android-developer/answer/9888374?hl=ko)을 확인했습니다.

## 모션

주인공은 네 방향 포즈에 어깨·고관절 회전과 착지 리듬을 결합합니다. NPC와 사람 동료도 팔·다리를 따로 움직입니다. 몬스터 공격은 준비 자세, 팔·다리 움직임, 기존 기술별 돌진·도약·투사체, 복귀 동작을 결합합니다. 기존 기술 효과는 유지하며 빛 번짐을 추가했습니다. 설정에서 애니메이션을 끌 수 있습니다.

브라우저 검증은 `npm install --no-save playwright` 후 `node tools/visual-qa.cjs`로 실행합니다. Chrome 경로는 사용하는 운영체제에 맞춰 수정하세요. Android 검증은 기존 GitHub Actions의 서명 빌드·에뮬레이터 검사를 사용합니다.
