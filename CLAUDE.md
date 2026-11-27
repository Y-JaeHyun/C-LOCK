# C-LOCK — 작업 안내 (에이전트용)

이 저장소 하나가 **소스이자 배포본**입니다. 빌드 단계가 없습니다. `main`에 push하면 GitHub Pages(https://y-jaehyun.github.io/C-LOCK/)에 1분 안팎으로 반영됩니다.

- 사용자에게는 **항상 한국어로** 답합니다. 게임 안 문구도 한국어입니다.
- 사용자는 문제 이미지(카카오톡 PNG 묶음)나 단서 자료를 주고 "만들어 줘"라고만 요청합니다. 아래 절차대로 알아서 해석하고, 구현하고, 브라우저로 검증하고, 배포까지 마칩니다.
- 해석이 갈리는 부분만 짧게 묻거나, 합리적인 기본값으로 진행한 뒤 마지막 보고에서 "제가 정한 값"이라고 밝힙니다.

## 게임 두 개

| 게임 | 위치 | 설명 | 상세 문서 |
|---|---|---|---|
| 메인 메뉴 | `index.html` | 두 게임 중 하나를 고르는 허브. 각 게임의 진행 기록(localStorage)을 보여 줌 | — |
| **BACK STAGE** | `backstage.html`, `engine/`, `w1`~`w6/` | three.js 1인칭 방탈출. 주차마다 방 하나, 자물쇠 6개 | [docs/BACKSTAGE.md](docs/BACKSTAGE.md), [engine/README.md](engine/README.md) |
| **STAGE 90** | `s90/` | 9단계 × 10스테이지 서바이벌 퀴즈. 단계별 문제는 `s90/stageN.js` | [docs/STAGE90.md](docs/STAGE90.md) |

```
index.html          메인 메뉴 (doctype 포함. 아티팩트에도 이 파일을 그대로 올림)
backstage.html      Back Stage 테마 선택
engine/             Back Stage 공용 엔진 (engine.js, engine.css, README.md = 테마 계약)
w1/ … w6/           방 하나 = index.html + theme.js + assets/
s90/                Stage 90 (index.html, s90.js 엔진, stage1~3.js 문제, assets/)
tools/              hash.mjs(정답 해시), kodict.py(국어사전 표제어 추출), words.py(단어 목록 생성)
docs/               게임별 상세 문서
```

## 자주 하는 작업

### 1. Stage 90 새 단계 추가 (가장 흔함)
사용자가 `N` 폴더나 zip으로 카드 이미지 약 30장을 주고, 특이 사항만 몇 줄 덧붙입니다 (예: "행운은 직접 구현", "보스 첫 이미지는 예시").
→ [docs/STAGE90.md의 "새 단계 만들기"](docs/STAGE90.md#새-단계-만들기) 절차를 따릅니다.
- 요약: 이미지를 모두 읽고 미션별로 정리합니다. 정답을 풀고, 사실 문제는 검색으로 검증합니다. 새 미션 형식이 필요하면 `s90.js`에 추가합니다.
- 이어서 `s90/stageN.js`를 작성하고 `s90/index.html`에 script 태그를 넣습니다. 10개 미션을 모두 브라우저에서 확인한 뒤 배포합니다.

### 2. Back Stage 방 추가·수정
→ [docs/BACKSTAGE.md](docs/BACKSTAGE.md), [engine/README.md](engine/README.md). `w1/`이 기준 테마입니다. 테마에서 `engine/`을 고치지 않습니다. 엔진 기능은 엔진에서 고치고, 그러면 모든 방에 적용됩니다.

### 3. 정답 정정
사용자가 "정답이 X래"라고 하면 **사용자 정답을 따릅니다.** 검색 결과와 달라도 그렇습니다. 다르다는 사실만 한 줄로 알립니다.
- 해시를 다시 만들고(`node tools/hash.mjs …`), `reveal` 문구도 맞춰 고칩니다.

## 로컬 실행과 검증
```bash
python3 -m http.server 8765        # 저장소 루트에서
```
- 확인할 주소: `http://localhost:8765/s90/index.html#debug`, `http://localhost:8765/w1/index.html#debug`
- `#debug`를 붙이면 `window.__s90` / `window.__bs` 디버그 API가 열립니다. 사용법은 각 문서에 있습니다.
- 확인 범위: 변경한 화면을 **PC 폭과 휴대폰 폭(375px)** 모두에서 봅니다. 가로 스크롤이 없어야 합니다(`document.documentElement.scrollWidth === innerWidth`). 콘솔 오류도 없어야 합니다.
- 정답과 오답을 직접 넣어 보고 판정을 확인합니다.
- 테스트로 만든 localStorage 저장(`s90-save-v1`, `bs-record-wN`)은 끝나면 원래 상태로 되돌립니다. 시작 전에 값이 있었는지 먼저 확인하세요.

## 배포
```bash
git add -A && git commit -m "…" && git push origin main
curl -s -o /dev/null -w '%{http_code}\n' https://y-jaehyun.github.io/C-LOCK/s90/stageN.js   # 200이면 반영됨
```
- 커밋 메시지 끝에는 사용 중인 에이전트의 Co-Authored-By 줄을 붙입니다.
- (선택) claude.ai 비공개 미러 아티팩트: https://claude.ai/artifact/3o7L5oQSVeiX3ywAV6Fszc (소유자 전용)
  - Artifact 도구가 있는 Claude 환경에서만 올릴 수 있습니다.
  - `file_path`는 루트 `index.html`, `root`는 저장소 루트로 하고, 바뀐 파일만 `files`에 넣습니다. 빠진 파일은 그대로 유지됩니다.
  - 먼저 `action: "read"`로 읽어야 덮어쓸 수 있습니다.
  - 도구가 없으면 GitHub Pages만 배포하고, 미러는 갱신하지 않았다고 보고합니다.

## 지켜야 할 규칙
- **정답 평문 금지**: 정답은 `tools/hash.mjs`로 만든 해시로만 넣습니다. 실패 화면에 보여 줄 `reveal` 문구만 평문입니다.
- **단어 퍼즐 채점은 오프라인**: 표준국어대사전 API는 키가 필요하고 CORS도 막혀 있습니다. 그래서 macOS **뉴에이스 국어사전** 표제어로 그 문제의 정답 범위만 잘라 `stageN.js`에 넣습니다. 게임 안에는 "뉴에이스 국어사전 기준"이라고 표시합니다.
  - 사전 전체 덤프(`tools/cache/`)는 저작권 때문에 **커밋하지 않습니다**. `.gitignore`에 있습니다.
  - macOS가 아니면 덤프를 만들 수 없습니다. 이 경우 사용자에게 알리고, 주제 목록(국가 등)처럼 직접 만들 수 있는 범위로 진행합니다.
- **저작권 음원·영상은 호스팅하지 않음**: 공식 유튜브 임베드(`type: 'youtube'`)만 씁니다.
- **정답을 확신할 수 없는 퍼즐**: 화면과 흐름은 모두 만들고, 판정은 확인 가능한 부분까지만 합니다(예: 계산 결과만 확인). 보고할 때 "정답 미확정, 알려 주시면 반영"이라고 분명히 적습니다.
- 휴대폰에서도 플레이할 수 있어야 합니다. Stage 90은 휴대폰이 주 환경입니다.
- 클래스 이름 충돌에 주의합니다. 예전에 `.big`이 버튼 `.btn.big`과 겹친 적이 있습니다.
