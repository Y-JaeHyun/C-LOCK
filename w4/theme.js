/* MONITOR (4주차): 출간 원고의 혹평. Theme data and room for the Back Stage engine.
   Room: x -6..6, z -5 (front wall: wall-sized review monitor over the desk) .. 5 (back wall: exit door), ceiling 3.9.
   Left wall = night window, whiteboard (flowchart), old PC. Right wall = wall TV, filing cabinet + tablet, printer.
   Back wall = poster, exit door, calligraphy sideboard, bookshelf; armchair corner with the music laptop. */
(() => {
'use strict';
const api = BackStage.api;
const { THREE, scene, TAU, AZ, DIGITS, M, Bm, bx, cy, mesh, grp, collide, rng, tex, imgTex, plane, rrect, glow, buildDust,
  zl, props, locks3d, tickers, padlock, makeInteract, exitDoor, poster, framed, tween, P, ptext, kid } = api;
const PW = api.PW, PH = api.PH;
const HH = 3.9;
const KR = '"IBM Plex Sans KR", sans-serif', HAND = 'Gaegu, cursive', MONO = '"IBM Plex Mono", monospace';

/* ---------------------------------------------------------------- puzzle data */
const LOCKS = [
  { id: 'L1', no: 1, name: '책상 서랍', type: '대문자 4자리', mech: 'dial', set: AZ, len: 4, hash: '1ymasvh', related: null,
    hints: ['연관 단서 없이 방 안 단서 하나로 풀립니다. 책상 왼쪽 모니터의 「엑셀 시트」를 보세요.',
      '수식마다 SUM 괄호 안의 셀 범위를 시트 위에 직접 칠해 보세요. 칠해진 칸이 알파벳 한 글자 모양이 됩니다. 수식 1 → 4 순서로 읽으세요.'] },
  { id: 'L2', no: 2, name: '파일 캐비닛', type: '대문자 4자리', mech: 'dial', set: AZ, len: 4, hash: 'ejvrl1', related: 'memo',
    hints: ['연관 단서 「메모」는 파일 캐비닛 위 태블릿의 「폴더」와 짝입니다.',
      '메모의 "n -> m"은 n번 폴더 이름(앞의 번호는 빼고)에서 m번째 글자를 뜻합니다. 1번부터 4번까지 차례로 모으세요.'] },
  { id: 'L3', no: 3, name: '프린터 용지함', type: '대문자 4자리', mech: 'dial', set: AZ, len: 4, hash: '1jqz03a', related: 'numbers',
    hints: ['연관 단서 「숫자 이미지」는 소파 옆 노트북에서 흘러나오는 「노래」와 짝입니다.',
      '노래 제목이 곧 할 일입니다. 숫자 네 개를 그 제목만큼 돌려(위아래가 뒤집히게) 보면 알파벳처럼 읽힙니다. 돌리면 읽는 순서도 반대가 됩니다.'] },
  { id: 'L4', no: 4, name: 'TV 장 금고', type: '숫자 4자리', mech: 'dial', set: DIGITS, len: 4, hash: '1gl989q', related: 'video',
    hints: ['연관 단서 「영상」은 책상 위 「계산기」와 짝입니다.',
      '영상 속 폴더 네 개의 자리를 계산기 숫자 키패드 위에 겹쳐 보세요. 폴더 줄 사이 간격이 2:1이라는 점에 주의해 키패드의 줄에 맞추고, 영상에서 선택되는 순서대로 겹친 숫자를 읽습니다.'] },
  { id: 'L5', no: 5, name: '서랍장', type: '숫자 3자리', mech: 'dial', set: DIGITS, len: 3, hash: '1nb26fc', related: 'calli',
    hints: ['연관 단서 「캘리그라피」는 책상 오른쪽 모니터의 「컴퓨터 화면」과 짝입니다.',
      '「흠결」은 화면 속 오류 번호, 「흔적」은 문서에 남은 글자 수입니다. 흠결은 반으로 줄이고 흔적은 두 배로 늘린 뒤, 둘을 더하세요.'] },
  { id: 'L6', no: 6, name: '낡은 PC 본체', type: '방향 자물쇠', mech: 'dir', hash: '1ii5v88', related: 'pwmemo',
    hints: ['연관 단서 「비밀번호 찾기 메모」는 왼쪽 벽 화이트보드의 「순서도」와 짝입니다.',
      '메모에 적힌 일을 순서대로 따라 순서도의 칸을 옮겨 다니며, 움직일 때마다 방향(위·아래·왼쪽·오른쪽)을 적으세요. 같은 두 칸을 오가는 것도 매번 한 번의 이동입니다. 모두 열 번 움직입니다.'] },
];

const CAPTIONS = {
  L1: ['책상 서랍이 덜컥 열렸다. 빨간 펜 자국투성이 원고 뭉치가 나온다.', '파일 캐비닛 위 벽에 노란 메모 창 하나가 떠올랐다.'],
  L2: ['캐비닛 서랍이 열렸다. 출판 계약서 사본이 들어 있다.', '프린터가 덜컹거리며 종이 한 장을 뱉어 냈다.'],
  L3: ['용지함이 열리자 잉크 냄새가 확 퍼진다.', '벽걸이 TV가 켜지고, 짧은 영상이 반복 재생된다.'],
  L4: ['금고 문이 열렸다. 갓 나온 초판 한 권이 놓여 있다.', '뒤쪽 벽에 붓글씨 액자 하나가 걸렸다.'],
  L5: ['서랍장이 열렸다. 처음 이 이야기를 적었던 아이디어 노트가 나온다.', '낡은 PC가 웅 소리를 내며 켜졌다. 화면에 메모 한 장이 떠 있다.'],
  L6: ['PC 잠금이 풀렸다. 원고 폴더가 다시 열린다.', '작업실 문 위 램프가 모두 초록으로 바뀌었다.'],
};

const CLUES = {
  b_sheet: { title: '엑셀 시트', where: '책상 · 왼쪽 모니터', media: [{ type: 'img', src: 'assets/sheet.webp', alt: '빈 엑셀 시트(A~O열, 1~13행) 아래에 수식 네 개. 수식 1: =SUM(A1:A5, C1:C5, A3:C3) / 수식 2: =SUM(E1:E5, G1:G5, E1:G1, E3:G3) / 수식 3: =SUM(I1:K1, J1:J5) / 수식 4: =SUM(M1:M5, M1:O1, M3:O3, M5:O5)', caption: '사진을 누르면 크게 볼 수 있어요.' }] },
  b_folder: { title: '폴더', where: '오른쪽 벽 · 파일 캐비닛 위 태블릿', media: [{ type: 'img', src: 'assets/folders.webp', alt: '검은 바탕화면의 폴더 네 개: 1_DRAFT, 2. ASSESS, 3. EDIT, 4. FINAL', small: true }] },
  b_calc: { title: '계산기', where: '책상 위', media: [{ type: 'img', src: 'assets/calculator.webp', alt: '일반 전자계산기. 숫자 키는 7 8 9 / 4 5 6 / 1 2 3 / 0 . +/- 의 네 줄로 놓여 있다.', small: true }] },
  b_flow: { title: '비밀번호 찾기 순서도', where: '왼쪽 벽 · 화이트보드', media: [{ type: 'img', src: 'assets/flowchart.webp', alt: '비밀번호 찾기 진행 순서도(플로우차트). 로그인 시도 아래 로그인 실패, 그 왼쪽에 재시도(양방향 화살표). 로그인 실패 오른쪽에 비번 찾기, 그 아래 이메일 인증, 오른쪽에 전화번호 인증, 그 아래 인증코드 입력. 인증코드 입력 왼쪽에 인증코드 재발송(틀렸을 때, 양방향 화살표), 오른쪽에 초기화 성공.' }] },
  b_404: { title: '컴퓨터 화면', where: '책상 · 오른쪽 모니터', media: [{ type: 'img', src: 'assets/screen404.webp', alt: '브라우저 창에 404 Not Found 오류. 뒤의 한글 문서 창 아래쪽 빨간 상자에 "글자 수 세기: 250자".' }] },
  b_song: { title: '노래', where: '소파 옆 · 노트북', media: [{ type: 'youtube', id: '0T_FLL9_R4Q', cover: false, label: '노래 단서', title: '노트북에서 흘러나오는 노래', note: '소리를 들을 수 없다면: 이 노래의 제목을 알아내는 것이 단서입니다.' }] },
};

const RELATED = {
  memo: { title: '메모', media: [{ type: 'img', src: 'assets/memo_folders.webp', alt: '노란 메모 창: 1-> 4 / 2-> 1 / 3-> 3 / 4-> 5', small: true }] },
  numbers: { title: '숫자 이미지', media: [{ type: 'img', src: 'assets/numbers.webp', alt: '흰 종이에 굵은 숫자 네 개: 5 3 1 7' }] },
  video: { title: '영상', media: [
    { type: 'youtube', id: 'p8PiIKAFsSI', label: '영상 단서', title: '기승전결' },
    { type: 'img', src: 'assets/video_folders.webp', alt: '영상의 한 장면. 흰 화면에 폴더 네 개: 맨 윗줄 왼쪽 「전」, 오른쪽 「기」, 그 아래 오른쪽 「결」, 맨 아래 왼쪽 「승」. 「승」에 보라색 선택 테두리와 마우스 커서.', caption: '영상의 한 장면 (사진을 누르면 크게 볼 수 있어요)' },
    { type: 'text', html: '<p><b>영상에서 일어나는 일</b> — 흰 화면에 폴더 네 개가 놓여 있고, 마우스 커서가 움직이며 보라색 선택 테두리가 <b>기 → 승 → 전 → 결</b> 순서로 폴더를 하나씩 선택합니다.</p><p><b>폴더 배치</b> — 맨 윗줄에 <b>전</b>(왼쪽)·<b>기</b>(오른쪽), 그 아래 줄에 <b>결</b>(오른쪽), 맨 아래 줄에 <b>승</b>(왼쪽). 줄 사이 간격은 위 사진 그대로입니다.</p>' }] },
  calli: { title: '캘리그라피', media: [{ type: 'img', src: 'assets/calligraphy.webp', alt: '붓글씨 세 줄: 흠결은 반쯤 지워지고 / 흔적은 두 겹으로 새겨진다 / 둘은 모여 하나가 된다' }] },
  pwmemo: { title: '비밀번호 찾기 메모', media: [{ type: 'img', src: 'assets/memo_password.webp', alt: '메모: 비밀번호가 기억이 안 난다. 일단 아무거나 쳐봤는데 실패했고 다시 한 번 쳐봤는데 또 실패했다. 결국 비밀번호 찾기를 눌렀다. 이메일로 인증을 받은 후 핸드폰으로도 인증을 시도했다. 근데 마음이 급해서 코드를 한 번 잘못 쳐서 다시 받았고, 두 번째 입력에서야 초기화를 성공했다.' }] },
};

const STICKY_L = ['Time Island\n성공! ★', '이번엔\n될 수 있다!', '조금만 더\n버티자', '나는\n할 수 있다'];
const STICKY_R = ['Time Island\n이번엔 꼭\n해내자!!', '후회하지 않도록\n최선을 다하자', '시간은\n내 편이다\n믿고 가자', '넘어져도 괜찮아\n멈추지만 말자'];
const STICKY_T = '출판사 미팅\n잊지 말기!';
const REVIEWS = [
  ['익명 평가자3', '스토리는 흥미로운데 문장이 자꾸 길을 잃어요.'],
  ['익명 평가자7', '메시지는 강하지만 표현 방식이 너무 직설적입니다.'],
  ['익명 평가자2', '그냥 흔한 타임슬립물 같아요. 차별점이 부족해요.'],
  ['익명 평가자5', '시작은 좋은데 중반 이후 늘어지는 느낌입니다.'],
  ['익명 평가자9', '주인공의 동기가 공감되지 않습니다.'],
  ['익명 평가자1', '세계관 설명이 부족해 몰입이 어렵습니다.'],
  ['익명 평가자4', '연출은 좋지만 내용이 비어 있는 느낌이에요.'],
  ['익명 평가자6', '결말이 너무 예측 가능해요.'],
];
const CHAT = ['그래서주인공은시간을되돌렸는데왜갑', '자기섬이사라지고 @작가님 이건뭔가요', '복선은회수안하고 ◐ 새인물만계속등장', '하다가결국처음장면으로돌아와서다시', '같은대사를반복 ✎ 독자는어디까지따라', '가야하는지모르겠고 ☺ 설정집복사붙여', '넣기한것같은문단이세페이지나이어짐', '중반부터는누가누군지헷갈려서 ▣ 그냥', '넘기다보니에필로그가먼저나와버림ㅋ'];

/* ---------------------------------------------------------------- texture helpers */
/* a canvas texture that also draws image files once they load (draw(g, w, h, imgs) is called again per image) */
function imgCanvas(w, h, srcs, draw) {
  const imgs = {};
  const t = tex(w, h, g => draw(g, w, h, imgs));
  srcs.forEach(s => {
    const im = new Image();
    im.onload = () => { imgs[s] = im; const g = t.userData.g; g.clearRect(0, 0, w, h); draw(g, w, h, imgs); t.needsUpdate = true; };
    im.src = s;
  });
  return t;
}
function fit(g, im, x, y, w, h) {
  if (!im) return;
  const s = Math.min(w / im.width, h / im.height), dw = im.width * s, dh = im.height * s;
  g.drawImage(im, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}
function lines(g, text, x, y, lh) { String(text).split('\n').forEach((s, i, a) => g.fillText(s, x, y + (i - (a.length - 1) / 2) * lh)); }

function drawWall(g, w, h) {
  const r = rng(11);
  g.fillStyle = '#232a35'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 240; i++) { g.fillStyle = `rgba(${10 + r() * 30},${14 + r() * 30},${24 + r() * 30},${0.05 + r() * 0.08})`; const x = r() * w, y = r() * h, s = 20 + r() * 120; g.beginPath(); g.ellipse(x, y, s, s * (0.4 + r()), r() * 3, 0, TAU); g.fill(); }
  g.fillStyle = '#161b23'; g.fillRect(0, h * 0.94, w, h * 0.06);
  g.fillStyle = '#2e3644'; g.fillRect(0, h * 0.935, w, 4);
}
function drawFloor(g, w, h) {
  const r = rng(9), n = 8, s = h / n;
  for (let j = 0; j < n; j++) { let x = -r() * 200; while (x < w) { const L = 180 + r() * 240, v = 34 + r() * 14; g.fillStyle = `rgb(${v + 12},${v + 4},${v - 4})`; g.fillRect(x, j * s, L, s); g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(x, j * s, 3, s); x += L; } g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(0, j * s, w, 3); }
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.15})`; g.fillRect(r() * w, r() * h, 2 + r() * 30, 1 + r() * 3); }
}
function drawRug(g, w, h) {
  g.fillStyle = '#151a22'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#26303e'; g.lineWidth = 10; g.strokeRect(24, 24, w - 48, h - 48);
  g.strokeStyle = '#1e2632'; g.lineWidth = 4; g.strokeRect(50, 50, w - 100, h - 100);
  const r = rng(4); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.03})`; g.fillRect(r() * w, r() * h, 2, 2); }
}

/* the wall-sized review page from the base image */
function drawReview(g, W, H) {
  g.textAlign = 'left'; g.textBaseline = 'middle';
  g.fillStyle = '#0d1117'; g.fillRect(0, 0, W, H);
  /* tabs */
  g.fillStyle = '#1b1f26'; g.fillRect(0, 0, W, 46);
  g.fillStyle = '#2a2f38'; rrect(g, 70, 8, 320, 40, 8); g.fill();
  g.fillStyle = '#e8b64c'; g.fillRect(88, 21, 14, 14);
  g.fillStyle = '#d6dbe3'; g.font = `500 19px ${KR}`; g.fillText('최종 평가 · Time Island', 112, 28);
  g.fillStyle = '#8b93a0'; g.fillText('✕', 366, 28); g.fillText('+', 408, 28);
  ['—', '□', '✕'].forEach((s, i) => g.fillText(s, W - 140 + i * 46, 25));
  /* address bar */
  g.fillStyle = '#22272f'; g.fillRect(0, 46, W, 50);
  g.fillStyle = '#8b93a0'; g.font = `500 24px ${KR}`; g.fillText('←   →   ↻', 22, 72);
  g.fillStyle = '#12161c'; rrect(g, 160, 54, W - 440, 34, 17); g.fill();
  g.fillStyle = '#aab3c0'; g.font = `400 19px ${MONO}`; g.fillText('time-island.world/critique/final_review', 190, 72);
  g.fillStyle = '#8b93a0'; g.font = `500 22px ${KR}`; g.fillText('☆   ⋮', W - 230, 72);
  /* bookmarks */
  g.fillStyle = '#1d2229'; g.fillRect(0, 96, W, 34);
  let bx0 = 24; g.font = `400 17px ${KR}`;
  ['Time Island', '자료실', '참고', '리서치', '공모전', '기록', '스크랩'].forEach(s => { g.fillStyle = '#e1b84a'; g.fillRect(bx0, 107, 17, 12); g.fillStyle = '#b8c0cc'; g.fillText(s, bx0 + 26, 114); bx0 += g.measureText(s).width + 74; });
  /* page */
  const top = 130, bot = H - 54;
  g.fillStyle = '#12161d'; g.fillRect(0, top, W, bot - top);
  g.fillStyle = '#f2f5f9'; g.font = `700 36px ${KR}`; g.fillText('Time Island', 120, 184);
  g.font = `600 32px ${KR}`; g.fillText('최종 컨셉 평가', 350, 184);
  g.fillStyle = '#7d8896'; g.font = `400 22px ${KR}`; g.fillText('2025.08.17', 590, 186);
  g.fillStyle = '#dfe6ee'; g.font = `600 24px ${KR}`; g.fillText('댓글 27', 1230, 184); g.fillStyle = '#8b97a6'; g.fillText('평가 9', 1380, 184);
  g.fillStyle = '#7fb2ff'; g.fillRect(1226, 204, 92, 4);
  g.fillStyle = '#8b97a6'; g.fillText('♡ +', 1720, 184); g.fillText('⤢', 1860, 184);
  /* chat screenshot card */
  g.fillStyle = '#c3ccd6'; rrect(g, 120, 226, 980, 470, 12); g.fill();
  g.fillStyle = '#e0a040'; g.beginPath(); g.arc(180, 280, 32, 0, TAU); g.fill();
  g.fillStyle = '#5a3a1a'; g.fillRect(168, 272, 6, 6); g.fillRect(186, 272, 6, 6); g.fillRect(172, 290, 16, 3);
  g.fillStyle = '#2a2f36'; g.font = `600 26px ${KR}`; g.fillText('은혁', 228, 262);
  g.fillStyle = '#ffffff'; rrect(g, 228, 290, 780, 380, 18); g.fill();
  g.fillStyle = '#16181c'; g.font = `600 28px ${KR}`;
  CHAT.forEach((s, i) => g.fillText(s, 250, 326 + i * 38));
  g.fillStyle = '#4a525c'; g.font = `400 18px ${KR}`; g.fillText('오후 8:40', 1016, 660);
  /* summary */
  g.fillStyle = '#eef2f6'; g.font = `700 26px ${KR}`; g.fillText('총평', 120, 734);
  g.fillStyle = '#c8d0da'; g.font = `400 21px ${KR}`;
  ['· 장점: 주제의식, 문체미, 기획 의도', '· 단점: 개연성 부족, 캐릭터 설계 미흡, 전개 방식의 진부함', '· 개선 방향: 세계관 구체화, 인물 감정선 강화, 후반부 구조 재구성 필요'].forEach((s, i) => g.fillText(s, 130, 772 + i * 32));
  g.fillStyle = '#ff6b5a'; g.font = `700 25px ${KR}`; g.fillText('평균 점수: 4.2 / 10.0', 120, 878);
  /* review list */
  g.fillStyle = '#171c24'; rrect(g, 1200, 226, 760, bot - 236, 10); g.fill();
  REVIEWS.forEach(([n, s], i) => {
    const y = 250 + i * 82;
    g.fillStyle = '#9aa6b5'; g.font = `600 18px ${KR}`; g.fillText(n, 1226, y);
    g.fillStyle = '#dfe6ee'; g.font = `400 21px ${KR}`; g.fillText(s, 1226, y + 27);
    g.fillStyle = '#6e7a88'; g.font = `400 15px ${KR}`; g.fillText('2025.08.17', 1226, y + 52);
    g.fillStyle = '#232a34'; g.fillRect(1214, y + 68, 732, 2);
  });
  /* taskbar */
  g.fillStyle = '#0a0d12'; g.fillRect(0, bot, W, H - bot);
  for (let i = 0; i < 8; i++) { g.fillStyle = ['#3a7bd5', '#e1b84a', '#5fd38d', '#9aa6b5', '#e06c5a', '#7fb2ff', '#c9a0ff', '#9aa6b5'][i]; rrect(g, W / 2 - 200 + i * 52, bot + 12, 32, 30, 6); g.fill(); }
  g.fillStyle = '#c8d0da'; g.font = `400 17px ${KR}`; g.textAlign = 'right'; g.fillText('오전 2:38', W - 30, bot + 18); g.fillText('2025-09-12', W - 30, bot + 40);
  g.textAlign = 'left';
}

function stickyTex(text, seed, hue = 0) {
  return tex(256, 256, (g, w, h) => {
    const r = rng(seed);
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, hue ? '#f7dc6a' : '#f3d65a'); gr.addColorStop(1, hue ? '#e9c64a' : '#e6c548');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,.06)'; g.fillRect(0, 0, w, 26);
    g.fillStyle = 'rgba(120,90,10,.08)'; for (let i = 0; i < 30; i++) g.fillRect(r() * w, r() * h, 2 + r() * 20, 1);
    g.fillStyle = '#3a2d0c'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const n = text.split('\n').length; g.font = `700 ${n > 2 ? 40 : 46}px ${HAND}`;
    lines(g, text, w / 2, h / 2 + 6, n > 2 ? 46 : 54);
  });
}
function paperTex(seed, n = 14, color = '#ece8de', red = false) {
  return tex(256, 340, (g, w, h) => {
    const r = rng(seed); g.fillStyle = color; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(40,40,60,.5)'; for (let i = 0; i < n; i++) g.fillRect(22, 30 + i * 20, 80 + r() * 130, 3);
    if (red) { g.strokeStyle = 'rgba(200,30,30,.8)'; g.lineWidth = 4; for (let i = 0; i < 6; i++) { const y = 40 + r() * 260; g.beginPath(); g.moveTo(20 + r() * 60, y); g.lineTo(140 + r() * 90, y + (r() - 0.5) * 10); g.stroke(); } g.beginPath(); g.ellipse(180, 70, 40, 24, 0.2, 0, TAU); g.stroke(); }
  });
}
function drawNight(g, w, h) {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#060b18'); gr.addColorStop(1, '#142036'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const r = rng(77);
  for (let i = 0; i < 50; i++) { g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(r() * w, r() * h * 0.4, 1.5, 1.5); }
  for (let b = 0; b < 10; b++) { const bw = 40 + r() * 70, bh = h * (0.3 + r() * 0.45), x = b * (w / 10) + r() * 20; g.fillStyle = '#070a12'; g.fillRect(x, h - bh, bw, bh); for (let y = h - bh + 8; y < h - 6; y += 14) for (let xx = x + 6; xx < x + bw - 6; xx += 12) if (r() < 0.12) { g.fillStyle = r() < 0.6 ? '#cfe0ff' : '#f6d68a'; g.fillRect(xx, y, 6, 7); } }
  g.fillStyle = '#dfe6f2'; g.beginPath(); g.arc(w * 0.22, h * 0.16, 16, 0, TAU); g.fill();
}
/* 7-segment digits for the alarm clock */
const SEG = ['1111110', '0110000', '1101101', '1111001', '0110011', '1011011', '1011111', '1110000', '1111111', '1111011'];
function seg7(g, x, y, w, h, d, on, off) {
  const t = w * 0.2, hh = h / 2, s = SEG[d];
  const R = [[x + t, y, w - 2 * t, t], [x + w - t, y + t, t, hh - 1.5 * t], [x + w - t, y + hh + t / 2, t, hh - 1.5 * t], [x + t, y + h - t, w - 2 * t, t], [x, y + hh + t / 2, t, hh - 1.5 * t], [x, y + t, t, hh - 1.5 * t], [x + t, y + hh - t / 2, w - 2 * t, t]];
  R.forEach((rc, i) => { g.fillStyle = s[i] === '1' ? on : off; g.fillRect(rc[0] + 1, rc[1] + 1, rc[2] - 2, rc[3] - 2); });
}

/* ---------------------------------------------------------------- room */
let clockTex, clockKey = '', tvOn = false, tvTex, tvT = 0, tvAcc = 0, lapTex, lapAcc = 0, screenLight, giantMat;
function buildRoom() {
  /* light: the giant screen's cold glow, a warm desk lamp, a reading lamp in the corner, city light from the window */
  scene.add(new THREE.HemisphereLight(0x8aa0c8, 0x0a0806, 0.14));
  scene.add(new THREE.AmbientLight(0xffffff, 0.035));
  const pl = (c, i, d, x, y, z) => { const l = new THREE.PointLight(c, i, d, 1); l.position.set(x, y, z); scene.add(l); return zl(1, l); };
  screenLight = pl(0x86aaff, 1.5, 9, 0, 2.3, -3.7);
  pl(0x6f8fd8, 0.38, 9, 0, 2.9, -0.6);
  pl(0xffb066, 0.95, 3.6, -1.75, 1.3, -4.25);
  pl(0xffa25a, 0.75, 4.2, -5.0, 1.55, 4.1);
  pl(0x8fa8d8, 0.32, 7, 4.2, 3.0, -0.2);
  pl(0x8fa8d8, 0.22, 6, 0.5, 3.0, 3.2);
  const moon = new THREE.DirectionalLight(0x7f9ad8, 0.18); moon.position.set(-9, 5, -4); moon.target.position.set(1, 0, 0); scene.add(moon, moon.target);

  /* floor, walls, ceiling */
  mesh(new THREE.PlaneGeometry(12, 10), M(0xffffff, { map: tex(1024, 1024, drawFloor, [2, 2]), roughness: 0.7 }), 0, 0, 0).rotation.x = -Math.PI / 2;
  { const rug = mesh(new THREE.PlaneGeometry(4.2, 2.8), M(0xffffff, { map: tex(512, 384, drawRug), roughness: 1 }), 0.2, 0.006, 0.3); rug.rotation.x = -Math.PI / 2; }
  const wall = (w, x, z, ry, rep) => { const t = tex(1024, 512, drawWall); t.wrapS = THREE.RepeatWrapping; t.repeat.set(rep, 1); const m = mesh(new THREE.PlaneGeometry(w, HH), M(0xffffff, { map: t, roughness: 0.95 }), x, HH / 2, z); m.rotation.y = ry; return m; };
  wall(12, 0, -5, 0, 2); wall(12, 0, 5, Math.PI, 2); wall(10, -6, 0, Math.PI / 2, 2); wall(10, 6, 0, -Math.PI / 2, 2);
  mesh(new THREE.PlaneGeometry(12, 10), M(0x15181e, { roughness: 1 }), 0, HH, 0).rotation.x = Math.PI / 2;
  /* ceiling light (switched off) and smoke detector */
  mesh(bx(1.4, 0.05, 0.5), M(0x2a2e36), 0, HH - 0.03, 0);
  mesh(bx(1.3, 0.02, 0.4), M(0x3a3f48, { emissive: 0x05070a }), 0, HH - 0.06, 0);
  mesh(cy(0.07, 0.07, 0.03, 16), M(0xd8d8d0), 2.6, HH - 0.02, 1.8);
  { const led = mesh(new THREE.SphereGeometry(0.012, 8, 6), Bm(0x40ff60), 2.6, HH - 0.04, 1.86); tickers.push(t => led.material.color.setHex(Math.floor(t * 0.8) % 4 ? 0x0a2010 : 0x40ff60)); }

  buildFront();
  buildRight();
  buildLeft();
  buildBack();
  buildDust(0xa8c4ff, 260, 11, 9);
}

function buildFront() {
  /* wall-sized monitor showing the review page */
  { const g = grp(0, 0, -4.95);
    mesh(bx(6.22, 3.02, 0.1), M(0x0a0b0e, { roughness: 0.35, metalness: 0.4 }), 0, 2.3, 0, g);
    const sp = plane(tex(2048, 972, drawReview), 6.0, 2.85); sp.position.set(0, 2.3, 0.056); g.add(sp);
    giantMat = sp.material; giantMat.color.setScalar(0.9);
    glow(1, 0x6f9cff, 8.4, 4.4, 0, 2.3, 0.08, 0, 0.1, g);
    mesh(new THREE.SphereGeometry(0.012, 8, 6), Bm(0x7fb2ff), 2.9, 0.83, 0.06, g); }
  /* sticky notes stuck around the screen edge */
  const notes = [];
  STICKY_L.forEach((s, i) => notes.push([s, -3.3 + (i % 2) * 0.06, 3.2 - i * 0.62, (i % 2 ? 0.07 : -0.05)]));
  STICKY_R.forEach((s, i) => notes.push([s, 3.3 - (i % 2) * 0.05, 3.15 - i * 0.62, (i % 2 ? -0.06 : 0.05)]));
  notes.push([STICKY_T, 1.6, 3.55, 0.04]);
  notes.forEach(([s, x, y, rz], i) => { const m = plane(stickyTex(s, 30 + i, i % 2), 0.5, 0.5, true, { roughness: 0.9, emissive: 0x2a2208, emissiveIntensity: 0.6 }); m.position.set(x, y, -4.84 + i * 0.0005); m.rotation.z = rz; scene.add(m); });

  /* desk */
  const top = M(0x2b2621, { roughness: 0.5 }), dark = M(0x1c1915, { roughness: 0.6 });
  mesh(bx(6.0, 0.06, 0.86), top, 0, 0.75, -4.45);
  mesh(bx(0.06, 0.72, 0.8), dark, 2.95, 0.36, -4.45);
  mesh(bx(4.8, 0.5, 0.03), dark, 0.4, 0.45, -4.84);
  collide(0, -4.45, 6.1, 0.96);
  /* drawer unit with padlock — L1 */
  { const g = grp(-2.35, 0, -4.45);
    mesh(bx(0.72, 0.72, 0.8), dark, 0, 0.36, 0, g);
    for (let k = 0; k < 3; k++) { mesh(bx(0.66, 0.2, 0.02), M(0x2e2a25, { roughness: 0.5 }), 0, 0.6 - k * 0.23, 0.41, g); mesh(bx(0.2, 0.025, 0.03), M(0x9aa0a8, { metalness: 0.8, roughness: 0.3 }), 0, 0.6 - k * 0.23 + 0.05, 0.43, g); }
    mesh(bx(0.03, 0.08, 0.03), M(0xb8b8b8, { metalness: 0.8, roughness: 0.3 }), 0.18, 0.62, 0.43, g);
    locks3d.L1 = padlock(g, 0.18, 0.54, 0.47, 0.85);
    makeInteract(g, 'lock', 'L1', '책상 서랍', 0.98); }
  /* left monitor: the Excel sheet — b_sheet */
  { const g = grp(-2.45, 0.78, -4.5, 0.32);
    mesh(cy(0.13, 0.15, 0.02, 20), M(0x1a1b1f), 0, 0.01, 0, g);
    mesh(bx(0.05, 0.36, 0.04), M(0x1a1b1f), 0, 0.2, -0.03, g);
    mesh(bx(1.04, 0.64, 0.05), M(0x111216, { roughness: 0.4 }), 0, 0.68, 0, g);
    const st = imgCanvas(1024, 600, ['assets/sheet.webp'], (c, w, h, im) => {
      c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#1d6f42'; c.fillRect(0, 0, w, 52); c.fillStyle = '#ffffff'; c.font = `600 24px ${KR}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('통합 문서1 - Excel', w / 2, 27);
      c.fillStyle = '#f3f3f3'; c.fillRect(0, 52, w, 60); c.fillStyle = '#444'; c.font = `400 18px ${KR}`; c.textAlign = 'left'; c.fillText('파일   홈   삽입   페이지 레이아웃   수식   데이터   검토   보기', 20, 82);
      fit(c, im['assets/sheet.webp'], 6, 116, w - 12, h - 122);
    });
    const sm = plane(st, 0.98, 0.58); sm.position.set(0, 0.68, 0.027); g.add(sm);
    glow(1, 0x9fd0b0, 1.5, 1.0, 0, 0.68, 0.04, 0, 0.08, g);
    makeInteract(g, 'clue', 'b_sheet', '엑셀 시트 · 왼쪽 모니터', 1.18); }
  /* right monitor: 404 + word counter — b_404 */
  { const g = grp(2.45, 0.78, -4.5, -0.32);
    mesh(cy(0.13, 0.15, 0.02, 20), M(0x1a1b1f), 0, 0.01, 0, g);
    mesh(bx(0.05, 0.36, 0.04), M(0x1a1b1f), 0, 0.2, -0.03, g);
    mesh(bx(1.04, 0.64, 0.05), M(0x111216, { roughness: 0.4 }), 0, 0.68, 0, g);
    const st = imgCanvas(1024, 600, ['assets/screen404.webp'], (c, w, h, im) => { c.fillStyle = '#121418'; c.fillRect(0, 0, w, h); fit(c, im['assets/screen404.webp'], 0, 0, w, h); });
    const sm = plane(st, 0.98, 0.58); sm.position.set(0, 0.68, 0.027); g.add(sm);
    glow(1, 0xc8d8ff, 1.5, 1.0, 0, 0.68, 0.04, 0, 0.08, g);
    makeInteract(g, 'clue', 'b_404', '컴퓨터 화면 · 오른쪽 모니터', 1.18); }
  /* keyboard, mouse, mug, manuscript */
  { const kt = tex(512, 160, (c, w, h) => { c.fillStyle = '#16171b'; c.fillRect(0, 0, w, h); c.fillStyle = '#2a2c32'; for (let r = 0; r < 5; r++) for (let k = 0; k < 15; k++) { rrect(c, 10 + k * 33, 10 + r * 29, 28, 24, 4); c.fill(); } });
    const kb = mesh(bx(0.9, 0.025, 0.28), M(0x16171b), 0, 0.795, -4.24); kb.rotation.y = 0.02;
    const kp = plane(kt, 0.88, 0.26, true, { roughness: 0.5 }); kp.rotation.x = -Math.PI / 2; kp.position.set(0, 0.809, -4.24); scene.add(kp);
    mesh(new THREE.SphereGeometry(0.045, 14, 10), M(0x1a1b1f, { roughness: 0.4 }), 0.66, 0.79, -4.22).scale.set(0.8, 0.45, 1.25);
    const mug = grp(0.98, 0.78, -4.14);
    mesh(cy(0.055, 0.05, 0.12, 20), M(0xd8dade, { roughness: 0.4 }), 0, 0.06, 0, mug);
    mesh(new THREE.TorusGeometry(0.035, 0.01, 8, 16), M(0xd8dade), 0.06, 0.065, 0, mug).rotation.y = Math.PI / 2;
    mesh(new THREE.CircleGeometry(0.048, 20), M(0x2a1608, { roughness: 0.2 }), 0, 0.11, 0, mug).rotation.x = -Math.PI / 2;
    for (let i = 0; i < 4; i++) { const p = plane(paperTex(60 + i, 14, '#efebe2', i === 0), 0.3, 0.4, true); p.rotation.x = -Math.PI / 2; p.rotation.z = 0.25 + i * 0.07; p.position.set(-0.75, 0.782 + i * 0.004, -4.5); scene.add(p); } }
  /* digital alarm clock 02:38 */
  { const g = grp(-1.05, 0.78, -4.12, 0.12);
    mesh(bx(0.42, 0.17, 0.12), M(0x101216, { roughness: 0.35 }), 0, 0.085, 0, g);
    clockTex = tex(320, 128, () => {}); drawClock(2 * 60 + 38, true);
    const cm = plane(clockTex, 0.38, 0.15); cm.position.set(0, 0.085, 0.061); g.add(cm);
    glow(1, 0x9fc4ff, 0.7, 0.35, 0, 0.09, 0.07, 0, 0.18, g); }
  /* calculator — b_calc */
  { const g = grp(1.62, 0.78, -4.2, -0.25);
    mesh(bx(0.21, 0.024, 0.27), M(0xc8ccd2, { roughness: 0.5 }), 0, 0.012, 0, g);
    const cp = plane(imgTex('assets/calculator.webp'), 0.2, 0.255, true, { roughness: 0.6 }); cp.rotation.x = -Math.PI / 2; cp.position.set(0, 0.026, 0); g.add(cp);
    makeInteract(g, 'clue', 'b_calc', '계산기', 0.42); }
  /* desk lamp */
  { const g = grp(-1.75, 0.78, -4.6, 0.4);
    mesh(cy(0.08, 0.09, 0.025, 18), M(0x22252b), 0, 0.012, 0, g);
    const a = mesh(cy(0.012, 0.012, 0.42, 8), M(0x22252b), 0, 0.22, 0.04, g); a.rotation.x = 0.2;
    const sh = mesh(cy(0.035, 0.1, 0.12, 18, true), M(0x2a2d33, { side: THREE.DoubleSide, emissive: 0x3a2008 }), 0, 0.44, 0.12, g); sh.rotation.x = 0.5;
    mesh(new THREE.SphereGeometry(0.03, 10, 8), Bm(0xffd9a0), 0, 0.41, 0.14, g); }
  /* office chair, bin with crumpled drafts */
  { const g = grp(0.25, 0, -3.35, 0.25);
    mesh(cy(0.26, 0.26, 0.08, 20), M(0x1d2026), 0, 0.5, 0, g);
    mesh(bx(0.46, 0.55, 0.07), M(0x1d2026), 0, 0.85, 0.24, g);
    mesh(cy(0.03, 0.03, 0.4, 8), M(0x55585e, { metalness: 0.7 }), 0, 0.27, 0, g);
    for (let i = 0; i < 5; i++) { const l = mesh(bx(0.3, 0.03, 0.04), M(0x2a2c30), Math.cos(i / 5 * TAU) * 0.15, 0.05, Math.sin(i / 5 * TAU) * 0.15, g); l.rotation.y = -i / 5 * TAU; }
    collide(0.25, -3.35, 0.55, 0.55); }
  { mesh(cy(0.17, 0.14, 0.38, 18, true), M(0x2c323b, { side: THREE.DoubleSide }), -3.4, 0.19, -4.4);
    collide(-3.4, -4.4, 0.4, 0.4);
    const r = rng(8), wad = M(0xe8e4da, { roughness: 1, flatShading: true });
    for (let i = 0; i < 9; i++) { const inBin = i < 4; const m = mesh(new THREE.IcosahedronGeometry(0.05 + r() * 0.03, 0), wad, inBin ? -3.4 + (r() - 0.5) * 0.15 : -3.2 + r() * 2.6, inBin ? 0.36 + r() * 0.05 : 0.05, inBin ? -4.4 + (r() - 0.5) * 0.15 : -3.9 + r() * 1.0); m.rotation.set(r() * 3, r() * 3, r() * 3); } }
}

function buildRight() {
  /* wall TV — the video wakes here (L4 related); the safe under it — L4 */
  { const g = grp(5.94, 0, -3.3, -Math.PI / 2);
    mesh(bx(1.5, 0.88, 0.06), M(0x0b0c0f, { roughness: 0.3, metalness: 0.4 }), 0, 1.95, 0, g);
    const off = tex(512, 288, (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#0c0f14'); gr.addColorStop(0.5, '#05060a'); gr.addColorStop(1, '#0a0c10'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(255,255,255,.04)'; c.beginPath(); c.moveTo(0, 0); c.lineTo(w * 0.35, 0); c.lineTo(w * 0.1, h); c.lineTo(0, h); c.fill(); });
    tvTex = tex(1024, 576, (c, w, h) => drawVideo(c, w, h, 0));
    const sm = plane(off, 1.42, 0.8); sm.position.set(0, 1.95, 0.032); g.add(sm);
    const led = mesh(new THREE.SphereGeometry(0.01, 8, 6), Bm(0xff3020), 0.65, 1.535, 0.035, g);
    /* low cabinet with the safe */
    mesh(bx(1.6, 0.5, 0.45), M(0x23201c, { roughness: 0.6 }), 0, 0.25, 0.24, g);
    mesh(bx(1.56, 0.02, 0.41), M(0x2e2a25, { roughness: 0.45 }), 0, 0.5, 0.24, g);
    const sg = grp(-0.35, 0.51, 0.26, 0, g);
    mesh(bx(0.46, 0.4, 0.38), M(0x3c4046, { metalness: 0.6, roughness: 0.4 }), 0, 0.2, 0, sg);
    mesh(bx(0.4, 0.34, 0.02), M(0x4a4f56, { metalness: 0.6, roughness: 0.35 }), 0, 0.2, 0.195, sg);
    mesh(cy(0.05, 0.05, 0.03, 20), M(0xb8b8b8, { metalness: 0.8, roughness: 0.25 }), -0.08, 0.22, 0.21, sg).rotation.x = Math.PI / 2;
    locks3d.L4 = padlock(sg, 0.1, 0.17, 0.225, 0.7);
    makeInteract(sg, 'lock', 'L4', 'TV 장 금고', 0.72);
    sm.userData.proxy = sg;
    const vglow = glow(1, 0x9fb8ff, 2.2, 1.4, 0, 1.95, 0.05, 0, 0, g);
    props.L4 = { kind: 'custom', reveal(instant) {
      sm.material.map = tvTex; sm.material.needsUpdate = true; tvOn = true; led.material.color.setHex(0x40ff60);
      tween(1.0, u => { sm.material.color.setScalar(u >= 1 ? 1 : (Math.random() < 0.4 ? 0.12 : 1) * (0.3 + 0.7 * u)); vglow.material.opacity = 0.14 * u; }, instant);
    } };
    for (let i = 0; i < 3; i++) mesh(bx(0.2, 0.28, 0.02), M([0x6a2a2a, 0x2a4a6a, 0x3a5a3a][i]), 0.35 + i * 0.05, 0.65, 0.3 - i * 0.03, g).rotation.y = 0.1;
    collide(5.7, -3.3, 0.6, 1.7); }

  /* filing cabinet — L2, tablet with the folders on top — b_folder, memo wakes on the wall above (L2 related) */
  { const g = grp(5.65, 0, -0.5, -Math.PI / 2);
    const steel = M(0x59606a, { metalness: 0.55, roughness: 0.45 });
    mesh(bx(0.6, 1.25, 0.6), steel, 0, 0.625, 0, g);
    for (let k = 0; k < 3; k++) {
      mesh(bx(0.54, 0.36, 0.02), M(0x656d78, { metalness: 0.55, roughness: 0.4 }), 0, 1.03 - k * 0.4, 0.305, g);
      mesh(bx(0.18, 0.03, 0.03), M(0xb8bcc2, { metalness: 0.8, roughness: 0.3 }), 0, 0.97 - k * 0.4, 0.33, g);
      const lb = plane(tex(128, 48, (c, w, h) => { c.fillStyle = '#ece8dc'; c.fillRect(0, 0, w, h); c.fillStyle = '#333'; c.font = `600 24px ${KR}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(['원고', '자료', '계약'][k], w / 2, h / 2 + 2); }), 0.12, 0.045, true);
      lb.position.set(0, 1.1 - k * 0.4, 0.318); g.add(lb);
    }
    const lk = grp(0, 0, 0, 0, g);
    mesh(bx(0.03, 1.22, 0.03), M(0x8a9098, { metalness: 0.8, roughness: 0.3 }), 0.24, 0.62, 0.33, lk);
    locks3d.L2 = padlock(lk, 0.24, 1.08, 0.37, 0.8);
    makeInteract(lk, 'lock', 'L2', '파일 캐비닛', 1.0);
    g.children.forEach(o => { if (o !== lk && o.isMesh) o.userData.proxy = lk; });
    /* tablet on a stand */
    const tg = grp(0.02, 1.25, 0.05, 0, g);
    mesh(bx(0.22, 0.02, 0.14), M(0x22252b), 0, 0.01, 0, tg);
    const tb = grp(0, 0.29, -0.02, 0, tg); tb.rotation.x = -0.22;
    mesh(bx(0.44, 0.54, 0.02), M(0x101114, { roughness: 0.3 }), 0, 0, 0, tb);
    const ft = imgCanvas(400, 500, ['assets/folders.webp'], (c, w, h, im) => { c.fillStyle = '#000000'; c.fillRect(0, 0, w, h); c.fillStyle = '#1a1d22'; c.fillRect(0, 0, w, 26); c.fillStyle = '#c8d0da'; c.font = `500 15px ${KR}`; c.textBaseline = 'middle'; c.fillText('오전 2:38', 12, 13); c.textAlign = 'right'; c.fillText('▮▮▮ 82%', w - 12, 13); fit(c, im['assets/folders.webp'], 10, 34, w - 20, h - 44); });
    const tp = plane(ft, 0.4, 0.5); tp.position.z = 0.011; tb.add(tp);
    glow(1, 0xffe0a0, 0.9, 0.9, 0, 0, 0.02, 0, 0.06, tb);
    makeInteract(tg, 'clue', 'b_folder', '태블릿 · 폴더', 0.64);
    /* memo window on the wall above */
    const mg = grp(0, 2.32, -0.32, 0, g);
    mesh(bx(0.7, 0.37, 0.012), M(0x2a2a22), 0, 0, 0, mg);
    const mp = plane(imgTex('assets/memo_folders.webp'), 0.66, 0.33); mp.material.color.setScalar(0.82); mp.position.z = 0.008; mg.add(mp);
    mesh(new THREE.SphereGeometry(0.018, 10, 8), M(0xd83a2a), 0, 0.17, 0.012, mg);
    mg.visible = false; mg.children.forEach(o => { o.userData.proxy = lk; });
    props.L2 = { kind: 'fade', m: mg, drop: 0.25 };
    collide(5.65, -0.5, 0.7, 0.7); }

  /* printer on its paper cabinet — L3; the printout wakes in the output tray (L3 related) */
  { const g = grp(5.55, 0, 2.5, -Math.PI / 2);
    mesh(bx(0.95, 0.7, 0.6), M(0x2a2622, { roughness: 0.6 }), 0, 0.35, 0, g);
    mesh(bx(0.45, 0.62, 0.02), M(0x34302b, { roughness: 0.5 }), -0.235, 0.35, 0.305, g);
    mesh(bx(0.45, 0.62, 0.02), M(0x34302b, { roughness: 0.5 }), 0.235, 0.35, 0.305, g);
    for (const x of [-0.04, 0.04]) mesh(bx(0.02, 0.14, 0.03), M(0xb8bcc2, { metalness: 0.8, roughness: 0.3 }), x, 0.45, 0.325, g);
    const lk = grp(0, 0, 0, 0, g);
    locks3d.L3 = padlock(lk, 0, 0.36, 0.35, 0.8);
    mesh(bx(0.62, 0.3, 0.46), M(0xd8dad8, { roughness: 0.45 }), 0, 0.85, -0.02, lk);
    mesh(bx(0.5, 0.02, 0.3), M(0x2a2c30), 0, 1.005, 0.0, lk);
    mesh(bx(0.44, 0.03, 0.18), M(0xc8cac8), 0, 0.78, 0.29, lk);
    mesh(bx(0.4, 0.2, 0.04), M(0xc8cac8), 0, 1.08, -0.2, lk).rotation.x = -0.3;
    const lcd = plane(tex(128, 48, (c, w, h) => { c.fillStyle = '#0e1a22'; c.fillRect(0, 0, w, h); c.fillStyle = '#8cd0ff'; c.font = `600 22px ${MONO}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('READY', w / 2, h / 2 + 1); }), 0.1, 0.035);
    lcd.position.set(0.2, 0.9, 0.212); lk.add(lcd);
    mesh(new THREE.SphereGeometry(0.01, 8, 6), Bm(0x40ff60), 0.27, 0.86, 0.212, lk);
    makeInteract(lk, 'lock', 'L3', '프린터 용지함', 1.32);
    const pr = plane(imgTex('assets/numbers.webp'), 0.42, 0.232, true, { roughness: 0.9, emissive: 0x262626, emissiveIntensity: 0.6 });
    pr.position.set(0, 1.12, 0.1); pr.rotation.x = -0.75; pr.visible = false; pr.userData.proxy = lk; lk.add(pr);
    props.L3 = { kind: 'fade', m: pr, drop: -0.12 };
    collide(5.55, 2.5, 0.7, 1.05); }
  /* wall shelf with binders above the printer */
  { mesh(bx(0.3, 0.03, 1.2), M(0x2a2622), 5.85, 2.05, 2.5);
    const r = rng(12); for (let i = 0; i < 9; i++) { const h = 0.24 + r() * 0.08; mesh(bx(0.22, h, 0.07), M([0x3a4a6a, 0x6a3a2a, 0x2a5a4a, 0x7a6a3a, 0x4a3a5a][i % 5], { roughness: 0.7 }), 5.86, 2.065 + h / 2, 2.0 + i * 0.12); } }
  /* clock-ish poster / calendar on the right wall */
  { const cal = plane(tex(256, 340, (c, w, h) => { c.fillStyle = '#eceae4'; c.fillRect(0, 0, w, h); c.fillStyle = '#c0392b'; c.fillRect(0, 0, w, 60); c.fillStyle = '#fff'; c.font = `700 34px ${KR}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('9월', w / 2, 32); c.fillStyle = '#333'; c.font = `500 18px ${MONO}`; for (let d = 1; d <= 30; d++) { const k = d + 0; const x = 26 + ((k - 1) % 7) * 34, y = 92 + Math.floor((k - 1) / 7) * 46; c.fillText(String(d), x, y); if (d === 12) { c.strokeStyle = '#c0392b'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, 15, 0, TAU); c.stroke(); } } }), 0.42, 0.56, true);
    cal.position.set(5.97, 2.1, 0.95); cal.rotation.y = -Math.PI / 2; scene.add(cal); }
}

function buildLeft() {
  /* window with blinds: 2 AM city */
  { const w = plane(tex(1024, 640, drawNight), 1.9, 1.3); w.position.set(-5.97, 1.95, -3.3); w.rotation.y = Math.PI / 2; scene.add(w);
    const fr = M(0x3a404a, { roughness: 0.6 });
    mesh(bx(0.08, 1.42, 0.06), fr, -5.94, 1.95, -4.27); mesh(bx(0.08, 1.42, 0.06), fr, -5.94, 1.95, -2.33);
    mesh(bx(0.08, 0.06, 2.0), fr, -5.94, 2.63, -3.3); mesh(bx(0.08, 0.06, 2.0), fr, -5.94, 1.27, -3.3);
    mesh(bx(0.24, 0.04, 2.1), M(0x2e343e), -5.86, 1.23, -3.3);
    const sl = M(0xb8bcc4, { roughness: 0.7 });
    for (let i = 0; i < 9; i++) { const s = mesh(bx(0.02, 0.05, 1.9), sl, -5.9, 2.58 - i * 0.07, -3.3); s.rotation.z = 0.5; }
    glow(1, 0x6a8ad8, 2.4, 1.8, -5.92, 1.95, -3.3, Math.PI / 2, 0.14); }
  /* whiteboard with the flowchart — b_flow */
  { const g = grp(-5.96, 0, -0.45, Math.PI / 2);
    mesh(bx(2.62, 1.78, 0.04), M(0xa8adb4, { metalness: 0.6, roughness: 0.35 }), 0, 1.9, 0, g);
    mesh(bx(2.54, 1.7, 0.01), M(0xf2f3f4, { roughness: 0.3 }), 0, 1.9, 0.022, g);
    const fp = plane(imgTex('assets/flowchart.webp'), 2.4, 1.596, true, { roughness: 0.4, emissive: 0x202224, emissiveIntensity: 0.5 }); fp.position.set(0, 1.9, 0.029); g.add(fp);
    mesh(bx(2.2, 0.04, 0.08), M(0xa8adb4, { metalness: 0.6 }), 0, 0.99, 0.05, g);
    [0xd83a2a, 0x2a5ad8, 0x1a1a1a].forEach((c, i) => { const m = mesh(cy(0.012, 0.012, 0.13, 8), M(c), -0.6 + i * 0.18, 1.025, 0.05, g); m.rotation.z = Math.PI / 2; });
    makeInteract(g, 'clue', 'b_flow', '화이트보드 · 순서도', 3.0); }
  /* old PC desk: the memo wakes on its screen (L6 related); direction lock on the tower — L6 */
  { const g = grp(-5.55, 0, 2.15, Math.PI / 2);
    const wood = M(0x3a2e24, { roughness: 0.6 });
    mesh(bx(1.3, 0.05, 0.72), wood, 0, 0.72, 0, g);
    [[-0.6, -0.31], [0.6, -0.31], [-0.6, 0.31], [0.6, 0.31]].forEach(([x, z]) => mesh(bx(0.05, 0.72, 0.05), wood, x, 0.36, z, g));
    /* monitor */
    const mg = grp(0.12, 0.745, -0.08, 0, g);
    mesh(bx(0.24, 0.02, 0.18), M(0xb8b4a8), 0, 0.01, 0, mg);
    mesh(bx(0.06, 0.16, 0.05), M(0xb8b4a8), 0, 0.1, -0.02, mg);
    mesh(bx(0.66, 0.54, 0.16), M(0xc4c0b2, { roughness: 0.6 }), 0, 0.44, 0, mg);
    const off = tex(512, 400, (c, w, h) => { c.fillStyle = '#040506'; c.fillRect(0, 0, w, h); c.fillStyle = '#1a2026'; c.font = `500 22px ${KR}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('절전 모드', w / 2, h / 2); });
    const on = imgCanvas(640, 500, ['assets/memo_password.webp'], (c, w, h, im) => { c.fillStyle = '#0f2f52'; c.fillRect(0, 0, w, h); c.fillStyle = '#c9d6e2'; c.fillRect(0, h - 30, w, 30); c.fillStyle = '#2a5ad8'; c.fillRect(0, h - 30, 70, 30); c.fillStyle = '#fff'; c.font = `600 15px ${KR}`; c.textBaseline = 'middle'; c.fillText('시작', 16, h - 15); fit(c, im['assets/memo_password.webp'], 20, 20, w - 40, h - 70); });
    const sm = plane(off, 0.56, 0.44); sm.position.set(0, 0.45, 0.081); mg.add(sm);
    const sglow = glow(1, 0x8fb8ff, 1.2, 1.0, 0, 0.45, 0.09, 0, 0, mg);
    /* tower with the direction lock */
    const tw = grp(-0.42, 0.745, 0.0, 0, g);
    mesh(bx(0.22, 0.46, 0.46), M(0xc4c0b2, { roughness: 0.6 }), 0, 0.23, 0, tw);
    mesh(bx(0.18, 0.06, 0.01), M(0x8a867a), 0, 0.38, 0.231, tw);
    mesh(new THREE.SphereGeometry(0.012, 8, 6), Bm(0x40ff60), 0.06, 0.3, 0.232, tw);
    const dl = plane(tex(128, 128, (c, w, h) => { c.fillStyle = '#c9a13a'; rrect(c, 4, 4, w - 8, h - 8, 18); c.fill(); c.fillStyle = '#2a1a0a'; c.font = '700 34px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('↑', 64, 30); c.fillText('↓', 64, 98); c.fillText('←', 30, 64); c.fillText('→', 98, 64); c.beginPath(); c.arc(64, 64, 10, 0, TAU); c.fill(); }), 0.13, 0.13, true, { metalness: 0.7, roughness: 0.35 });
    dl.position.set(0, 0.16, 0.235); tw.add(dl);
    const chain = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.1, 0.2, 0.24), new THREE.Vector3(-0.13, 0.05, 0.2), new THREE.Vector3(-0.08, 0.02, -0.1)]);
    mesh(new THREE.TubeGeometry(chain, 16, 0.008, 5), M(0x9aa0a8, { metalness: 0.8, roughness: 0.3 }), 0, 0, 0, tw);
    makeInteract(tw, 'lock', 'L6', '낡은 PC 본체', 0.75);
    mg.children.forEach(o => { o.userData.proxy = tw; });
    props.L6 = { kind: 'custom', reveal(instant) {
      sm.material.map = on; sm.material.needsUpdate = true;
      tween(1.0, u => { sm.material.color.setScalar(u >= 1 ? 1 : (Math.random() < 0.4 ? 0.12 : 1) * (0.3 + 0.7 * u)); sglow.material.opacity = 0.14 * u; }, instant);
    } };
    /* old keyboard and a mug of pens */
    mesh(bx(0.18, 0.02, 0.5), M(0xb8b4a8), 0.42, 0.755, 0.08, g).rotation.y = Math.PI / 2;
    mesh(bx(0.5, 0.02, 0.17), M(0xb8b4a8), 0.0, 0.755, 0.22, g);
    mesh(cy(0.04, 0.04, 0.1, 14), M(0x2a5a7a), 0.5, 0.795, -0.2, g);
    collide(-5.55, 2.15, 0.85, 1.4); }
}

function buildBack() {
  /* exit door in the back wall */
  exitDoor({ x: -1.2, z: 5, ry: 0, leaf: 0x2c3440, frame: 0x6a7686 });
  /* theme poster above the reading corner */
  poster({ x: -4.3, z: 4.96, ry: Math.PI, y: 2.35, w: 1.35, h: 0.9 });
  /* reading corner: armchair, side table with the laptop playing a song — b_song, floor lamp */
  { const g = grp(-4.3, 0, 4.1, -0.5);
    const fab = M(0x3a4458, { roughness: 0.95 });
    mesh(bx(0.9, 0.42, 0.8), fab, 0, 0.21, 0, g);
    mesh(bx(0.9, 0.62, 0.18), fab, 0, 0.62, 0.32, g);
    mesh(bx(0.16, 0.26, 0.8), fab, -0.45, 0.54, 0, g); mesh(bx(0.16, 0.26, 0.8), fab, 0.45, 0.54, 0, g);
    mesh(bx(0.66, 0.1, 0.6), M(0x46526a, { roughness: 0.95 }), 0, 0.47, -0.04, g);
    collide(-4.3, 4.1, 1.1, 1.1); }
  { const g = grp(-5.3, 0, 3.3);
    mesh(cy(0.3, 0.3, 0.03, 24), M(0x3a2e24, { roughness: 0.5 }), 0, 0.6, 0, g);
    mesh(cy(0.03, 0.03, 0.6, 8), M(0x2a2420), 0, 0.3, 0, g);
    mesh(cy(0.18, 0.2, 0.02, 20), M(0x2a2420), 0, 0.01, 0, g);
    const lap = grp(0.02, 0.615, 0.02, -0.93, g);
    mesh(bx(0.42, 0.018, 0.3), M(0x8a8f99, { metalness: 0.6, roughness: 0.35 }), 0, 0.009, 0, lap);
    const lid = grp(0, 0.018, 0.15, 0, lap); lid.rotation.x = 0.3;
    mesh(bx(0.42, 0.28, 0.012), M(0x8a8f99, { metalness: 0.6, roughness: 0.35 }), 0, 0.14, 0, lid);
    lapTex = tex(512, 340, (c, w, h) => drawLaptop(c, w, h, 0));
    const ls = plane(lapTex, 0.39, 0.25); ls.position.set(0, 0.14, -0.007); ls.rotation.y = Math.PI; lid.add(ls);
    glow(1, 0xb0a0ff, 0.8, 0.6, 0, 0.14, -0.03, Math.PI, 0.12, lid);
    makeInteract(g, 'clue', 'b_song', '노트북 · 노래', 1.15);
    collide(-5.3, 3.3, 0.65, 0.65); }
  { const g = grp(-5.55, 0, 4.6);
    mesh(cy(0.14, 0.16, 0.03, 18), M(0x1a1b1f), 0, 0.015, 0, g);
    mesh(cy(0.012, 0.012, 1.45, 8), M(0x1a1b1f), 0, 0.74, 0, g);
    mesh(cy(0.13, 0.2, 0.26, 20, true), M(0xe8d8b0, { side: THREE.DoubleSide, emissive: 0x8a5a20, emissiveIntensity: 0.8 }), 0, 1.5, 0, g);
    collide(-5.55, 4.6, 0.35, 0.35); }

  /* sideboard — L5, calligraphy frame wakes above it (L5 related) */
  { const g = grp(1.7, 0, 4.72, Math.PI);
    const wood = M(0x3a2c22, { roughness: 0.55 });
    mesh(bx(1.4, 0.78, 0.5), wood, 0, 0.39, 0, g);
    mesh(bx(0.68, 0.66, 0.02), M(0x45352a, { roughness: 0.5 }), -0.35, 0.39, 0.255, g);
    mesh(bx(0.68, 0.66, 0.02), M(0x45352a, { roughness: 0.5 }), 0.35, 0.39, 0.255, g);
    for (const x of [-0.05, 0.05]) mesh(bx(0.02, 0.16, 0.03), M(0xc9a13a, { metalness: 0.8, roughness: 0.3 }), x, 0.45, 0.275, g);
    locks3d.L5 = padlock(g, 0, 0.36, 0.3, 0.8);
    /* on top: a plant and a stack of printed manuscripts */
    mesh(cy(0.1, 0.08, 0.16, 16), M(0x6a4a3a), 0.45, 0.86, 0, g);
    for (let i = 0; i < 6; i++) { const l = mesh(new THREE.ConeGeometry(0.05, 0.3, 6), M(0x2f5a3a, { roughness: 0.8 }), 0.45 + Math.cos(i) * 0.04, 1.06, Math.sin(i) * 0.04, g); l.rotation.set(Math.cos(i * 2) * 0.4, 0, Math.sin(i * 2) * 0.4); }
    for (let i = 0; i < 5; i++) mesh(bx(0.3, 0.02, 0.4), M(i % 2 ? 0xe8e4da : 0xdedad0), -0.35 + i * 0.006, 0.79 + i * 0.02, 0, g).rotation.y = i * 0.05;
    makeInteract(g, 'lock', 'L5', '서랍장', 1.1);
    const fg = framed(scene, imgTex('assets/calligraphy.webp'), 1.0, 1.0, 1.7, 2.25, 4.95, Math.PI, 0xd8cfb8, 0.04);
    fg.visible = false; fg.traverse(o => { if (o.isMesh) o.userData.proxy = g; });
    props.L5 = { kind: 'fade', m: fg, drop: 0.25 };
    collide(1.7, 4.72, 1.5, 0.6); }
  /* bookshelf */
  { const g = grp(4.35, 0, 4.78, Math.PI);
    const wood = M(0x2e241c, { roughness: 0.6 });
    mesh(bx(1.3, 2.2, 0.04), wood, 0, 1.1, -0.18, g);
    mesh(bx(0.04, 2.2, 0.4), wood, -0.63, 1.1, 0, g); mesh(bx(0.04, 2.2, 0.4), wood, 0.63, 1.1, 0, g);
    const r = rng(33);
    for (let s = 0; s < 5; s++) {
      mesh(bx(1.24, 0.03, 0.38), wood, 0, 0.05 + s * 0.52, 0, g);
      let x = -0.58; while (x < 0.5) { const w = 0.04 + r() * 0.05, h = 0.28 + r() * 0.16; if (r() < 0.12) { x += 0.08; continue; } mesh(bx(w, h, 0.28), M([0x3a4a6a, 0x6a3a2a, 0x2a5a4a, 0x7a6a3a, 0x4a3a5a, 0xd8d0c0][(r() * 6) | 0], { roughness: 0.75 }), x + w / 2, 0.065 + s * 0.52 + h / 2, 0.02, g); x += w + 0.008; }
    }
    collide(4.35, 4.78, 1.35, 0.5); }
}

function drawClock(min, colon) {
  const g = clockTex.userData.g, w = 320, h = 128;
  g.fillStyle = '#05070a'; g.fillRect(0, 0, w, h);
  const hh = Math.floor(min / 60) % 12, mm = min % 60;
  const on = '#d8e6ff', off = 'rgba(120,150,200,.07)';
  const D = [Math.floor(hh / 10), hh % 10, Math.floor(mm / 10), mm % 10];
  const xs = [52, 108, 186, 242];
  D.forEach((d, i) => seg7(g, xs[i], 18, 46, 88, d, on, off));
  g.fillStyle = colon ? on : off; g.fillRect(163, 44, 10, 10); g.fillRect(163, 74, 10, 10);
  g.fillStyle = on; g.font = `600 18px ${MONO}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('AM', 10, 96);
  clockTex.needsUpdate = true;
}

/* the organiser's video, redrawn on the wall TV: the purple selection walks 기 → 승 → 전 → 결 */
const VPOS = { 전: [0.19, 0.28], 기: [0.69, 0.28], 결: [0.69, 0.67], 승: [0.19, 0.86] };
const VORDER = ['기', '승', '전', '결'];
function drawFolder(g, cx, cy0, s, label) {
  const w = s, h = s * 0.78, x = cx - w / 2, y = cy0 - h / 2;
  g.fillStyle = '#f2bf4f'; rrect(g, x, y, w * 0.42, h * 0.3, 6); g.fill();
  g.fillStyle = '#f2bf4f'; rrect(g, x, y + h * 0.12, w, h * 0.88, 8); g.fill();
  g.fillStyle = '#f4f2ec'; g.fillRect(x + w * 0.08, y + h * 0.2, w * 0.84, h * 0.2);
  g.fillStyle = '#fbd46e'; g.beginPath(); g.moveTo(x + w * 0.04, y + h * 0.32); g.lineTo(x + w * 1.0, y + h * 0.3); g.lineTo(x + w * 0.96, y + h); g.lineTo(x, y + h); g.closePath(); g.fill();
  g.fillStyle = '#1a1a1a'; g.font = `700 ${Math.round(s * 0.24)}px ${KR}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, cx, y + h * 0.66);
}
function drawVideo(g, w, h, t) {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
  const bar = 52, S = h - bar - 16, ox = (w - S) / 2, oy = 8, fs = S * 0.26;
  const at = n => [ox + VPOS[n][0] * S, oy + VPOS[n][1] * S];
  for (const n in VPOS) { const [x, y] = at(n); drawFolder(g, x, y, fs, n); }
  const per = 1.4, ph = t / per, k = Math.floor(ph) % 5, u = ph - Math.floor(ph);
  if (k < 4) {
    const cur = VORDER[k], prev = k ? VORDER[k - 1] : null;
    const [cx, cy0] = at(cur);
    if (u > 0.45) { g.strokeStyle = '#8b5cf6'; g.lineWidth = 5; g.strokeRect(cx - fs * 0.62, cy0 - fs * 0.56, fs * 1.24, fs * 1.12); g.fillStyle = 'rgba(139,92,246,.08)'; g.fillRect(cx - fs * 0.62, cy0 - fs * 0.56, fs * 1.24, fs * 1.12); }
    const p0 = prev ? at(prev) : [w * 0.5, h * 0.5], e = Math.min(1, u / 0.4), ee = e * e * (3 - 2 * e);
    const mx = p0[0] + (cx - p0[0]) * ee + fs * 0.05, my = p0[1] + (cy0 - p0[1]) * ee - fs * 0.15;
    g.fillStyle = '#ffffff'; g.strokeStyle = '#111'; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(mx, my); g.lineTo(mx, my + 34); g.lineTo(mx + 9, my + 26); g.lineTo(mx + 16, my + 40); g.lineTo(mx + 22, my + 37); g.lineTo(mx + 15, my + 24); g.lineTo(mx + 26, my + 24); g.closePath(); g.fill(); g.stroke();
  }
  g.fillStyle = '#16181c'; g.fillRect(0, h - bar, w, bar);
  g.fillStyle = '#3a3e46'; g.fillRect(70, h - bar / 2 - 3, w - 260, 6);
  g.fillStyle = '#e04040'; g.fillRect(70, h - bar / 2 - 3, (w - 260) * ((t % (per * 5)) / (per * 5)), 6);
  g.fillStyle = '#fff'; g.beginPath(); g.moveTo(26, h - bar / 2 - 12); g.lineTo(26, h - bar / 2 + 12); g.lineTo(46, h - bar / 2); g.closePath(); g.fill();
  g.font = `500 20px ${MONO}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(`0:0${Math.floor((t % (per * 5)))} / 0:07`, w - 172, h - bar / 2);
}
/* music player on the laptop — never shows the song's title */
function drawLaptop(g, w, h, t) {
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#1a1530'); gr.addColorStop(1, '#0c0f18'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const ag = g.createLinearGradient(30, 40, 170, 180); ag.addColorStop(0, '#f2a65a'); ag.addColorStop(1, '#7a3ab8'); g.fillStyle = ag; rrect(g, 30, 40, 150, 150, 12); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 6; g.beginPath(); g.arc(105, 115, 40, 0, TAU); g.stroke(); g.beginPath(); g.arc(105, 115, 8, 0, TAU); g.stroke();
  g.fillStyle = '#e8e4ff'; g.font = `600 28px ${KR}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('♪ 재생 중', 210, 70);
  g.fillStyle = '#9a94c0'; g.font = `400 20px ${KR}`; g.fillText('노트북 스피커', 210, 108);
  for (let i = 0; i < 22; i++) { const v = 0.25 + 0.75 * Math.abs(Math.sin(t * 3.1 + i * 0.7) * Math.sin(t * 1.7 + i * 0.31)); g.fillStyle = '#b8a0ff'; g.fillRect(210 + i * 12, 190 - v * 50, 8, v * 50); }
  g.fillStyle = '#3a3656'; g.fillRect(30, 240, w - 60, 6); g.fillStyle = '#b8a0ff'; g.fillRect(30, 240, (w - 60) * ((t * 0.01) % 1), 6);
  g.fillStyle = '#e8e4ff'; g.font = `600 30px ${KR}`; g.textAlign = 'center'; g.fillText('⏮     ❚❚     ⏭', w / 2, 290);
}

/* ---------------------------------------------------------------- story scenes (pixel art) */
function makeScenes() {
  const pixG = api.pixG;
  const HAIR = '#1a1418', SHIRT = '#3a4f78';
  const NOTES = [[20, 10], [22, 24], [20, 38], [22, 52], [160, 8], [162, 22], [160, 36], [162, 50]];
  function studio(t, o = {}) {
    P('#0c0f17', 0, 0, PW, 78); P('#07080c', 0, 78, PW, 30);
    for (let x = 0; x < PW; x += 14) P('#0a0b10', x, 78, 1, 30);
    pixG.fillStyle = o.dim ? 'rgba(110,160,255,.04)' : 'rgba(110,160,255,.09)'; pixG.fillRect(26, 0, 140, 80);
    P('#040508', 36, 5, 120, 63); P(o.scr || '#1a3150', 38, 7, 116, 59);
    if (!o.noNotes) NOTES.forEach(([x, y], i) => { P(i % 3 ? '#e8c94a' : '#f2d65e', x, y, 11, 10); P('#9a7e22', x + 2, y + 4, 7, 1); P('#9a7e22', x + 2, y + 6, 5, 1); });
    P('#2a221c', 0, 72, PW, 4); P('#16120e', 0, 76, PW, 2);
    if (!o.noClock) { P('#06080b', 4, 64, 24, 8); ptext('02:38', 16, 68.5, Math.floor(t * 2) % 2 ? '#d8e6ff' : '#9fb4d8', 6); }
    P('#8a8f99', 166, 64, 7, 8); P('#8a8f99', 173, 66, 2, 4);
  }
  function screenLines(n, color = '#8fb2e0', x0 = 44, y0 = 12, seed = 0) { for (let i = 0; i < n; i++) P(color, x0, y0 + i * 5, 30 + (((i + seed) * 37) % 60), 2); }
  return {
    night(t) {
      studio(t);
      screenLines(Math.min(10, Math.floor(t * 3)));
      if (Math.floor(t * 3) % 2) P('#d8e6ff', 44 + 30 + ((Math.min(9, Math.floor(t * 3)) * 37) % 60), 12 + Math.min(9, Math.floor(t * 3)) * 5, 2, 3);
      kid(92, 61, SHIRT, HAIR, t, { back: true, bob: true });
    },
    publish(t) {
      studio(t, { scr: '#1c3756' });
      P('#c9a13a', 80, 12, 32, 38); P('#a8842a', 80, 12, 3, 38); ptext('Time', 97, 24, '#1a1408', 7); ptext('Island', 97, 34, '#1a1408', 7);
      P('#0a1420', 58, 56, 76, 5); P('#5fd38d', 59, 57, Math.min(74, t * 30), 3);
      if (t > 2.6) { ptext('출간 완료!', 96, 46, '#ffffff', 7); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + t; P('#ffd36b', 96 + Math.cos(a) * (20 + (t * 8) % 14), 30 + Math.sin(a) * (14 + (t * 6) % 10), 1, 1); } }
      kid(92, 61, SHIRT, HAIR, t, { back: true, armsUp: t > 2.6 });
    },
    reviews(t) {
      studio(t, { scr: '#131b27' });
      const n = Math.min(6, Math.floor(t * 2.2));
      for (let i = 0; i < n; i++) { const x = 44 + (i % 2) * 54, y = 10 + Math.floor(i / 2) * 15; P('#dfe6ee', x, y, 50, 12); P('#ff5a4a', x + 3, y + 3, 4, 2); P('#6a7380', x + 3, y + 7, 30 + (i * 7) % 14, 2); }
      if (t > 2.6) ptext('4.2 / 10', 96, 58, Math.floor(t * 3) % 2 ? '#ff5a4a' : '#c0392b', 9);
      kid(92, 61 + Math.min(3, t * 0.8), SHIRT, HAIR, t, { back: true });
    },
    locked(t) {
      studio(t, { dim: true, scr: '#16263c' });
      screenLines(8, '#5a7aa8');
      P('#2a303a', 176, 24, 16, 48); P('#3a424e', 178, 26, 12, 46);
      const lit = Math.min(6, Math.floor(t * 1.6)); for (let i = 0; i < 6; i++) P(i < lit ? '#ff5a4a' : '#4a1612', 175 + i * 3, 19, 2, 2);
      P('#ffd36b', 186, 48, 2, 2);
      kid(150 - Math.min(14, t * 5), 61, SHIRT, HAIR, t, {});
    },
    reboot(t) {
      studio(t, { scr: '#1a3654' });
      for (let i = 0; i < 10; i++) { const tgt = 44, cur = 44 + ((i * 53) % 40); const x = cur + (tgt - cur) * Math.min(1, Math.max(0, t * 0.7 - i * 0.08)); P('#bfe0ff', x, 12 + i * 5, 50 + (i % 3) * 12, 2); }
      if (t > 2.4) { P('#5fd38d', 140, 50, 3, 3); P('#5fd38d', 143, 53, 3, 3); P('#5fd38d', 146, 47, 3, 6); P('#5fd38d', 149, 43, 3, 5); }
      kid(92, 61, SHIRT, HAIR, t, { back: true, bob: true });
    },
    dawn(t) {
      const gr = pixG.createLinearGradient(0, 0, 0, 60); gr.addColorStop(0, '#3a5a9a'); gr.addColorStop(1, '#ffb070');
      studio(t, { scr: '#1c3a5a', noClock: true });
      pixG.fillStyle = gr; pixG.fillRect(4, 8, 14, 44); P('#2a303a', 3, 7, 16, 1); P('#2a303a', 3, 52, 16, 1); P('#2a303a', 10, 8, 1, 44);
      P('#ffe0a0', 7, 40 - Math.min(10, t * 3), 4, 4);
      pixG.fillStyle = `rgba(255,190,120,${Math.min(0.12, t * 0.03)})`; pixG.fillRect(0, 0, PW, PH);
      screenLines(Math.min(11, 4 + Math.floor(t * 2)), '#cfe4ff');
      kid(92, 61, SHIRT, HAIR, t, { back: true, bob: true });
    },
    newnote(t) {
      P('#1a1f2a', 0, 0, PW, PH);
      const r = [[20, 14], [56, 10], [92, 16], [128, 12], [30, 50], [66, 46], [138, 48]];
      r.forEach(([x, y], i) => { P(i % 2 ? '#e8c94a' : '#f2d65e', x, y, 28, 26); P('#9a7e22', x + 4, y + 9, 18, 2); P('#9a7e22', x + 4, y + 14, 14, 2); });
      const y = Math.max(44, 110 - t * 30);
      P('#ffe56a', 100, y, 32, 30); ptext('끝까지', 116, y + 15, '#3a2d0c', 8);
      kid(160, 80, SHIRT, HAIR, t, { armsUp: t > 2.2, smile: true });
      if (t > 2.2) for (let i = 0; i < 8; i++) P('rgba(255,230,160,.8)', (i * 41 + t * 10) % PW, 6 + (i * 13) % 30, 1, 1);
    },
  };
}

BackStage.run({
  id: 'w4', week: 4, title: 'MONITOR', titleHTML: 'MONI<em>TOR</em>', tag: '출간 원고의 혹평', docTitle: 'Monitor', brand: 'MONITOR',
  poster: 'assets/poster.jpg', posterAlt: '새벽 2시 38분, 어두운 작업실의 거대한 모니터. Time Island 최종 컨셉 평가 화면(평균 점수 4.2/10)과 그 둘레의 노란 포스트잇, 디지털 시계와 머그잔',
  intro: ['세상에 내놓은 원고는 결국 차가운 혹평을 마주했다. 작품의 기준을 놓치고 여러 의견에 흔들린 결과, 가장 중요한 본질을 잃어버렸다.',
    '화면에 남은 것은 길을 잃은 문장들과 초라한 지표뿐이다. 하지만 이런 실패로 끝이 나서는 안 된다. 최소한 누군가는 스토리라인에 흥미를 가졌던 것으로 기억한다.',
    '어긋난 뼈대를 바로잡고, 처음 가고자 했던 방향으로 다시 나아간다. 이번에는 모니터를 끄지 않는다.'],
  fonts: ['700 32px Gaegu'],
  fontSample: STICKY_L.concat(STICKY_R, [STICKY_T]).join(' ') + ' 원고 자료 계약 9월',
  sky: 0x05070b, fog: [9, 22], exposure: 1.0,
  player: { x: 0, z: 1.3, yaw: 0, pitch: 0.1 },
  bounds: [-5.65, 5.65, -4.65, 4.65],
  locks: LOCKS, clues: CLUES, related: RELATED, captions: CAPTIONS,
  cut: {
    L2: { at: [5.95, 2.32, -0.5], view: [3.5, 1.95, -0.5], color: 0xf3d65a },
    L3: { at: [5.43, 1.12, 2.5], view: [3.7, 2.0, 2.4], color: 0xe8eef6 },
    L4: { at: [5.9, 1.95, -3.3], view: [3.2, 1.85, -2.8], color: 0x8b5cf6 },
    L5: { at: [1.7, 2.25, 4.92], view: [1.6, 1.9, 2.4], color: 0xf3d65a },
    L6: { at: [-5.3, 1.2, 2.07], view: [-3.3, 1.6, 2.0], color: 0x7fb2ff },
  },
  focus: {
    L1: [[-1.8, 3.6, -2.6], [-2.35, 0.7, -4.2]], L2: [[3.9, 3.6, -0.5], [5.65, 1.4, -0.5]], L3: [[3.9, 3.6, 2.5], [5.5, 0.9, 2.5]],
    L4: [[3.9, 3.6, -2.7], [5.6, 1.2, -3.1]], L5: [[1.7, 3.6, 2.8], [1.7, 1.3, 4.7]], L6: [[-3.9, 3.6, 2.0], [-5.5, 1.0, 2.1]],
    start: [[0, 3.6, -1.6], [0, 0.9, -4.3]],
  },
  focusIntensity: 0.75,
  prologue: [
    { scene: 'night', text: '새벽 2시 38분. 작업실에 남은 불빛은 모니터 하나뿐이다.' },
    { scene: 'publish', text: '몇 달을 붙잡고 있던 원고, 「Time Island」가 마침내 세상에 나갔다.' },
    { scene: 'reviews', text: '돌아온 것은 차가운 평가들. 평균 점수 4.2. 화면을 끄고 싶어졌다.' },
    { scene: 'locked', text: '그때, 작업실 문이 잠겼다. 자물쇠 여섯 개를 풀고 이 밤을 빠져나가자.' },
  ],
  epilogue: [
    { scene: 'reboot', text: '마지막 자물쇠가 풀리자, 화면 속 문장들이 하나둘 제자리를 찾아간다.' },
    { scene: 'dawn', text: '창밖이 밝아 온다. 모니터는 여전히 켜져 있다.' },
    { scene: 'newnote', text: '포스트잇 한 장을 새로 붙인다. 이번에는, 끝까지 쓴다.' },
  ],
  scenes: makeScenes,
  exitCaption: '작업실 문이 열렸다. 복도 끝 창문으로 새벽빛이 스민다.',
  finalGoal: '작업실 문이 풀렸습니다. 뒤쪽 벽의 출구로 나가세요.',
  startToast: '물음표는 방 안 단서, 스피커는 소리 단서, 빛나는 자물쇠가 지금 열 수 있는 장치입니다.',
  build() { buildRoom(); },
  animate(t, dt) {
    const S = api.state;
    const el = S.started ? ((S.finished ? S.finalTime * 1000 : performance.now() - S.t0) / 1000 || 0) : 0;
    const min = 2 * 60 + 38 + Math.floor(el / 60), colon = Math.floor(t * 2) % 2 === 0, key = min + ':' + colon;
    if (key !== clockKey) { clockKey = key; drawClock(min, colon); }
    if (screenLight) screenLight.intensity = screenLight.userData.to * (0.96 + Math.sin(t * 1.3) * 0.03 + (Math.random() < 0.01 ? -0.08 : 0));
    if (tvOn) { tvT += dt; tvAcc += dt; if (tvAcc > 1 / 15) { tvAcc = 0; drawVideo(tvTex.userData.g, 1024, 576, tvT); tvTex.needsUpdate = true; } }
    lapAcc += dt; if (lapTex && lapAcc > 1 / 10) { lapAcc = 0; drawLaptop(lapTex.userData.g, 512, 340, t); lapTex.needsUpdate = true; }
  },
});
})();
