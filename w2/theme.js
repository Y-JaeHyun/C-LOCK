/* PUB (2주차): 대학 시절 단골 술집 TIME PUB. Theme data and room for the Back Stage engine.
   Room: x -6..6, z -5.5 (bar counter, bottle shelves, "오월" menu board) .. 5.5 (back wall: doodle wall, theme poster),
   left wall = food photos, bingo poster, host stand, exit door; right wall = dartboard, window, drunk regular's corner. Ceiling 3.9. */
(() => {
'use strict';
const api = BackStage.api;
const { THREE, scene, TAU, DIGITS, AZ, az, M, Bm, bx, cy, mesh, grp, collide, rng, tex, imgTex, plane, rrect, glow, glowText, buildDust,
  zl, V3, props, locks3d, tickers, padlock, keypadTex, makeInteract, exitDoor, poster, framed, tween, ease, P, ptext, kid, PW, PH } = api;

/* ---------------------------------------------------------------- puzzle data */
const LOCKS = [
  { id: 'L1', no: 1, name: '단골 테이블 수저 서랍', type: '숫자 4자리', mech: 'dial', set: DIGITS, len: 4, hash: '7yr2he', related: 'order',
    hints: ['연관 단서 「번호판 · 주문내역」은 왼쪽 벽의 「음식 사진 모음」과 짝입니다.', '음식 사진 3×3을 번호판 1~9 위에 그대로 겹쳐 보세요. 주문내역의 시간 순서대로, 주문한 음식이 놓인 칸의 번호를 읽습니다.'] },
  { id: 'L2', no: 2, name: '입구 예약 장부함', type: '대문자 5자리', mech: 'dial', set: AZ, len: 5, hash: '1yh1vfs', related: 'reserved',
    hints: ['연관 단서 「예약석 표지」는 왼쪽 벽의 「이달의 빙고 이벤트」 달력과 짝입니다.', '테이블 번호를 날짜로 보세요. 표지가 꽂힌 순서(위에서 아래)대로, 달력에서 그 날짜 칸의 알파벳을 읽습니다.'] },
  { id: 'L3', no: 3, name: '벌주 냉장고', type: '숫자 4자리', mech: 'dial', set: DIGITS, len: 4, hash: '169uw5q', related: 'kakao',
    hints: ['연관 단서 「벌주 제조법」 카톡은 앞쪽 벽의 「진열대의 술」과 짝입니다.', '제조법에 나오는 술 순서대로, 진열대에 그 술이 몇 병 놓여 있는지 세어 적으세요. 윗줄과 아랫줄을 모두 셉니다.'] },
  { id: 'L4', no: 4, name: '낙서벽 방명록함', type: '숫자 5자리', mech: 'dial', set: DIGITS, len: 5, hash: '1q5vo9', related: 'calli',
    hints: ['연관 단서 「캘리그라피」는 오른쪽 벽의 「다트 놀이」와 짝입니다.', '글씨에 쓰인 색이 나오는 순서(검정 → 빨강 → 노랑 → 파랑)대로, 같은 색 다트가 꽂힌 구역의 숫자를 읽어 이으세요. 더블·트리플 배수는 쓰지 않습니다.'] },
  { id: 'L5', no: 5, name: '카운터 컴퓨터', type: '소문자 6자리', mech: 'dial', set: az, len: 6, hash: 'xaefgc', related: 'memo',
    hints: ['연관 단서 「컴퓨터 비밀번호 메모」는 구석 자리 「술취한 아조씨」의 혼잣말과 짝입니다.', '메모대로 KQta를 치려면 Caps Lock까지 포함해 어떤 키를 어떤 순서로 눌러야 할지 적어 보세요. 그리고 취한 아저씨처럼 키보드에서 각 키의 한 칸 오른쪽 키를 눌렀다고 생각하세요.'] },
  { id: 'L6', no: 6, name: '카드 결제 단말기', type: '소문자 4자리', mech: 'dial', set: az, len: 4, hash: '17cyikv', related: 'signature',
    hints: ['방 안 단서 없이, 연관 단서 「시그니처 메뉴」와 사장님 말씀만으로 풀립니다.', '괄호는 빼고 보세요. L은 등호 왼쪽(분류), R은 등호 오른쪽(메뉴 이름)입니다. 사장님이 부른 순서대로, 그 기호의 단어에서 맨 앞부터 숫자번째 글자를 뽑으세요.'] },
];

const CAPTIONS = {
  L1: ['수저 서랍이 덜컥 열렸다. 숟가락 사이에서 동전 몇 개가 짤랑인다.', '입구 안내대에 예약석 표지가 층층이 꽂혔다.'],
  L2: ['예약 장부함이 열렸다. 낯익은 이름들이 빼곡하다.', '냉장고 위 휴대폰에 카톡 알림이 울린다.'],
  L3: ['벌주 냉장고 문이 열리고 찬 기운이 새어 나온다.', '낙서벽 방명록함 위에 붓글씨 한 장이 내려앉았다.'],
  L4: ['방명록함이 열렸다. 그 시절 우리가 남긴 낙서들.', '카운터 모니터에 메모 한 장이 붙었다.'],
  L5: ['컴퓨터가 켜졌다. 바탕화면에 그 시절 단체 사진이 떠 있다.', '카운터 위 메뉴 화면이 켜지고, 사장님 목소리가 들린다.'],
  L6: ['"결제 완료되었습니다." 단말기가 영수증을 뱉어 낸다.', '출입문 위 램프 여섯 개가 모두 초록으로 바뀌었다.'],
};

const DRUNK_CC = [[0.0, 2.16, '아… 아씨'], [2.16, 9.2, '술 취해서 걸을 때마다 자꾸 한 칸씩 오른쪽으로 미끄러지네.']];

const CLUES = {
  b_food: { title: '음식 사진 모음', where: '왼쪽 벽 · 인기 안주 액자', media: [{ type: 'img', src: 'assets/food.webp', alt: '3×3 격자 음식 사진. 윗줄 감자튀김·양념치킨·황도, 가운데 줄 먹태·피자·계란말이, 아랫줄 어묵탕·김치전·볶음면.', caption: '사진을 누르면 크게 볼 수 있어요.' }] },
  b_bingo: { title: '이달의 빙고 이벤트', where: '왼쪽 벽 · 이벤트 포스터', media: [{ type: 'img', src: 'assets/bingo.webp', alt: '이달의 빙고 이벤트 달력. 1일부터 31일까지 날짜 칸마다 알파벳이 하나씩 적혀 있다.' }] },
  b_shelf: { title: '진열대의 술', where: '앞쪽 벽 · 술 진열장', media: [{ type: 'img', src: 'assets/shelf.webp', alt: '두 칸짜리 나무 진열장. 윗줄과 아랫줄에 사이다·참이슬·카스·막걸리 병이 섞여 놓여 있다.' }] },
  b_darts: { title: '다트 놀이', where: '오른쪽 벽 · 다트판', media: [{ type: 'img', src: 'assets/darts.webp', alt: '나무 벽에 걸린 다트판. 검정·빨강·노랑·파랑 다트 네 개가 서로 다른 구역에 꽂혀 있다. 옆 칠판에 EVENT 501 701 801 COUNT-UP.' }] },
  b_drunk: { title: '술취한 아조씨', where: '구석 자리 · 엎드린 단골 아저씨', media: [{ type: 'audio', src: 'assets/drunk.m4a', title: '구석 자리 아저씨의 혼잣말 · 11초', captions: DRUNK_CC }] },
};

const RELATED = {
  order: { title: '번호판 · 주문내역', media: [
    { type: 'img', src: 'assets/numpad.webp', alt: '1부터 9까지 3×3으로 놓인 번호판.', small: true },
    { type: 'img', src: 'assets/receipt.webp', alt: 'TIME PUB 주문내역. 19:30 황도, 20:00 치킨, 21:00 김치전, 22:30 계란말이.' }] },
  reserved: { title: '예약석 표지', media: [{ type: 'img', src: 'assets/reserved.webp', alt: '아크릴 꽂이에 층층이 꽂힌 예약석 표지 다섯 장. 위에서부터 Table 17, 4, 22, 9, 14.' }] },
  kakao: { title: '벌주 제조법 카톡', media: [{ type: 'img', src: 'assets/kakao.webp', alt: '카톡 메시지. 벌주 제조법 팁 딱 알려준다. 소주 먼저 붓고 → 사이다 타고 → 맥주 넣고 → 마지막에 막걸리 살짝 얹으면 완성!', small: true }] },
  calli: { title: '캘리그라피', media: [{ type: 'img', src: 'assets/calligraphy.webp', alt: '붓글씨. 까만 밤이 지나고 / 붉은 해가 뜨고 / 노란 꽃이 피면 / 마침내 푸른 하늘이 열린다. 줄마다 검정·빨강·노랑·파랑 글씨가 섞여 있다.' }] },
  memo: { title: '컴퓨터 비밀번호 메모', media: [{ type: 'img', src: 'assets/pcmemo.webp', alt: '모니터에 테이프로 붙인 메모. 컴퓨터 비밀번호: KQta (키보드 기본 설정은 소문자이니 처음에 대문자로 바꾸는거 까먹ㄴㄴ). 아래에 키보드.' }] },
  signature: { title: '시그니처 메뉴 · 사장님', media: [
    { type: 'img', src: 'assets/signature.webp', alt: 'SIGNITURE MENU. ▲ (Side) = Yellow Nacho, ★ (Main) = Pepperoni Pizza, ■ (Beverage) = Apple Cider, ● (Alcohol) = Lemon Draft. - TIME PUB -', small: true },
    { type: 'text', html: '<p><b>사장님</b> "아이고, 친구분들이랑 엄청 재밌게 노시더라고요! 계산 도와드릴게요. 주문 내역 보니까 ◼ L Size 7개, ★ L Size 2개, ● R Size 3개, ▲ R Size 2개 오늘은 이렇게 드셨네요? 결제 해드리겠습니다.</p><p>저희 가게 결제코드 입력하면 할인되는거 아시죠? 앞에 입력해주시면 감사하겠습니다."</p>' }] },
};

/* ---------------------------------------------------------------- textures */
const KR = '"IBM Plex Sans KR", sans-serif', HAND = 'Gaegu, cursive', SIGN = '"Black Han Sans", sans-serif';
function drawWall(g, w, h) {
  const r = rng(5);
  g.fillStyle = '#6a5846'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 320; i++) { g.fillStyle = `rgba(${30 + r() * 30},${20 + r() * 20},${12},${0.03 + r() * 0.07})`; const x = r() * w, y = r() * h * 0.7, s = 20 + r() * 110; g.beginPath(); g.ellipse(x, y, s, s * (0.4 + r()), r() * 3, 0, TAU); g.fill(); }
  for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(255,230,190,${r() * 0.05})`; g.fillRect(r() * w, r() * h * 0.68, 2 + r() * 50, 2 + r() * 30); }
  for (let i = 0; i < 14; i++) { g.strokeStyle = `rgba(30,20,10,${0.12 + r() * 0.18})`; g.lineWidth = 1 + r() * 1.5; const x = r() * w; g.beginPath(); g.moveTo(x, r() * h * 0.3); g.lineTo(x + (r() - 0.5) * 40, h * 0.3 + r() * h * 0.35); g.stroke(); }
  const y0 = h * 0.68;
  g.fillStyle = '#3a2315'; g.fillRect(0, y0, w, h - y0);
  for (let x = 0; x < w; x += 46) { g.fillStyle = `rgba(0,0,0,${0.3 + r() * 0.2})`; g.fillRect(x, y0, 3, h - y0); g.fillStyle = `rgba(255,190,120,${r() * 0.05})`; g.fillRect(x + 5, y0, 36, h - y0); }
  g.fillStyle = '#22140b'; g.fillRect(0, y0 - 9, w, 13);
  g.fillStyle = 'rgba(255,200,140,.08)'; g.fillRect(0, y0 - 9, w, 2);
}
function drawFloor(g, w, h) {
  const r = rng(9);
  g.fillStyle = '#3a3029'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,220,180'},${r() * 0.06})`; g.fillRect(r() * w, r() * h, 2 + r() * 26, 2 + r() * 26); }
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(10,6,2,${0.05 + r() * 0.1})`; g.beginPath(); g.ellipse(r() * w, r() * h, 10 + r() * 50, 6 + r() * 30, r() * 3, 0, TAU); g.fill(); }
  g.fillStyle = 'rgba(0,0,0,.45)'; for (let i = 0; i <= 4; i++) { g.fillRect(i * w / 4 - 2, 0, 4, h); g.fillRect(0, i * h / 4 - 2, w, 4); }
}
function drawCeil(g, w, h) {
  const r = rng(3);
  g.fillStyle = '#22170f'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 32) { g.fillStyle = `rgba(0,0,0,${0.3 + r() * 0.2})`; g.fillRect(0, y, w, 2); g.fillStyle = `rgba(120,80,40,${r() * 0.12})`; g.fillRect(0, y + 3, w, 26); }
}
function woodTex(seed, base = '#5a3820', lines = 60) {
  return tex(512, 256, (g, w, h) => {
    const r = rng(seed); g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < lines; i++) { g.strokeStyle = `rgba(${r() < 0.5 ? '20,10,4' : '150,100,60'},${0.08 + r() * 0.12})`; g.lineWidth = 1 + r() * 2; const y = r() * h; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + (r() - 0.5) * 20, w * 0.7, y + (r() - 0.5) * 20, w, y + (r() - 0.5) * 10); g.stroke(); }
    for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.12})`; g.beginPath(); g.ellipse(r() * w, r() * h, 4 + r() * 30, 2 + r() * 8, 0, 0, TAU); g.fill(); }
  });
}
function drawNight(g, w, h) {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#080b16'); gr.addColorStop(1, '#1e1824'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const r = rng(77);
  for (let b = 0; b < 7; b++) { const bw = 90 + r() * 80, bh = h * (0.45 + r() * 0.4), x = b * (w / 7) - 20 + r() * 20; g.fillStyle = '#0c0b12'; g.fillRect(x, h - bh, bw, bh); for (let y = h - bh + 10; y < h - 10; y += 18) for (let xx = x + 8; xx < x + bw - 8; xx += 16) if (r() < 0.2) { g.fillStyle = r() < 0.6 ? '#f2c27a' : '#8fb0d8'; g.fillRect(xx, y, 7, 9); } }
  const neon = [['노래방', '#ff5fa8', 150, 190], ['호프', '#5fd0ff', 520, 150], ['24시', '#ffd36b', 820, 220], ['포차', '#ff7a4a', 360, 260]];
  for (const [t, c, x, y] of neon) glowText(g, t, x, y, `400 46px ${SIGN}`, c, 18);
  for (let i = 0; i < 40; i++) { const x = r() * w, y = h * 0.6 + r() * h * 0.4, s = 6 + r() * 22; const rg = g.createRadialGradient(x, y, 0, x, y, s); const c = r() < 0.5 ? '255,190,110' : '255,120,90'; rg.addColorStop(0, `rgba(${c},.55)`); rg.addColorStop(1, `rgba(${c},0)`); g.fillStyle = rg; g.fillRect(x - s, y - s, s * 2, s * 2); }
}
function drawMenu(g, w, h) {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f8e7bd'); gr.addColorStop(1, '#e8cf98'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#2a1a0e'; g.textBaseline = 'middle';
  g.font = `400 150px ${SIGN}`; g.textAlign = 'center'; g.fillText('오월', 210, h / 2 + 6);
  g.fillStyle = 'rgba(60,40,20,.35)'; g.fillRect(410, 30, 3, h - 60); g.fillRect(970, 30, 3, h - 60);
  const cols = [[['모둠전', '18.0'], ['두부김치', '14.0'], ['오징어볶음', '16.0'], ['골뱅이무침', '15.0'], ['오뎅탕', '15.0']], [['소주', '5.0'], ['맥주', '5.0'], ['막걸리', '6.0'], ['생맥주 500', '4.5'], ['과일소주', '7.0']]];
  g.font = `600 34px ${KR}`; g.fillStyle = '#3a2412';
  cols.forEach((col, c) => col.forEach(([n, p], i) => { const x0 = 460 + c * 560, y = 52 + i * 50; g.textAlign = 'left'; g.fillText(n, x0, y); g.textAlign = 'right'; g.fillText(p, x0 + 440, y); }));
}
function paperTex(seed, lines = 12, color = '#ece3cf', title) {
  return tex(256, 340, (g, w, h) => { const r = rng(seed); g.fillStyle = color; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,.05)'; g.fillRect(0, 0, w, 14);
    if (title) { g.fillStyle = '#5a1a10'; g.font = `400 40px ${SIGN}`; g.textAlign = 'center'; g.fillText(title, w / 2, 60); }
    g.fillStyle = 'rgba(50,35,25,.5)'; for (let i = 0; i < lines; i++) g.fillRect(24, (title ? 100 : 34) + i * 20, 70 + r() * 140, 4); });
}
function signTex(lines, bg, fg, font = SIGN, size = 64, w = 512, h = 300) {
  return tex(w, h, (g) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = fg; g.globalAlpha = 0.5; g.lineWidth = 6; g.strokeRect(12, 12, w - 24, h - 24); g.globalAlpha = 1;
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; lines.forEach((s, i) => { g.font = `400 ${i ? size * 0.55 : size}px ${font}`; g.fillText(s, w / 2, h / 2 + (i - (lines.length - 1) / 2) * size * 1.05); }); });
}
function beerPoster(g, w, h) {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#7a1e14'); gr.addColorStop(1, '#2a0c08'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#f6d36b'; g.font = `400 58px ${SIGN}`; g.textAlign = 'center'; g.fillText('시원한', w / 2, 80); g.fillText('생맥주', w / 2, 145);
  g.fillStyle = '#f2b13a'; g.fillRect(w / 2 - 55, 190, 110, 150); g.fillStyle = '#fff6e0'; g.fillRect(w / 2 - 60, 170, 120, 30); g.beginPath(); g.arc(w / 2 - 40, 172, 18, 0, TAU); g.arc(w / 2, 166, 22, 0, TAU); g.arc(w / 2 + 40, 172, 18, 0, TAU); g.fill();
  g.strokeStyle = '#f2b13a'; g.lineWidth = 14; g.beginPath(); g.arc(w / 2 + 60, 265, 32, -1.2, 1.2); g.stroke();
  g.fillStyle = '#f6e6c8'; g.font = `600 30px ${KR}`; g.fillText('500cc 4,500원', w / 2, 390);
}
const LABEL = {};
function labelTex(kind) {
  if (LABEL[kind]) return LABEL[kind];
  return (LABEL[kind] = tex(256, 96, (g, w, h) => {
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (kind === 'soju') { g.fillStyle = '#f3f3ee'; g.fillRect(0, 0, w, h); g.fillStyle = '#1e7ad0'; g.beginPath(); g.moveTo(96, 26); g.quadraticCurveTo(84, 52, 96, 66); g.quadraticCurveTo(108, 52, 96, 26); g.fill(); g.fillStyle = '#1e5a2a'; g.font = `400 34px ${SIGN}`; g.fillText('참이슬', 146, 50); }
    if (kind === 'cider') { g.fillStyle = '#1f8a3e'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffffff'; g.font = `400 38px ${SIGN}`; g.fillText('사이다', 128, 52); g.fillStyle = '#c8f0a0'; g.fillRect(0, 8, w, 4); g.fillRect(0, h - 12, w, 4); }
    if (kind === 'cass') { g.fillStyle = '#1b3c8c'; g.fillRect(0, 0, w, h); g.fillStyle = '#d8b04a'; g.fillRect(0, 6, w, 5); g.fillRect(0, h - 11, w, 5); g.fillStyle = '#ffffff'; g.font = `italic 700 44px Georgia, serif`; g.fillText('Cass', 128, 50); }
    if (kind === 'makgeolli') { g.fillStyle = '#efe8d4'; g.fillRect(0, 0, w, h); g.fillStyle = '#3a2412'; g.font = `400 34px ${SIGN}`; g.fillText('막걸리', 128, 52); g.fillStyle = '#c0301c'; g.fillRect(168, 30, 14, 14); }
    if (kind === 'whisky') { g.fillStyle = '#2a1a10'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8c87a'; g.font = `600 26px Georgia, serif`; g.fillText('OLD OAK', 128, 50); }
  }));
}
function cardTex(n) {
  return tex(256, 170, (g, w, h) => { g.fillStyle = '#f7f4ec'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8a8070'; g.lineWidth = 3; g.strokeRect(10, 10, w - 20, h - 20);
    g.fillStyle = '#2a2420'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `600 24px ${KR}`; g.fillText('예약석', w / 2, 40); g.font = '24px Georgia, serif'; g.fillText('Table', w / 2, 76); g.font = '56px Georgia, serif'; g.fillText(String(n), w / 2, 122); });
}
function receiptTex() {
  return tex(256, 400, (g, w, h) => { g.fillStyle = '#f4f1ea'; g.beginPath(); g.moveTo(0, 0); g.lineTo(w, 0); for (let x = w; x >= 0; x -= 16) g.lineTo(x, h - (x / 16 % 2 ? 10 : 0)); g.closePath(); g.fill();
    g.fillStyle = '#2a2a2a'; g.textAlign = 'center'; g.font = `600 30px "IBM Plex Mono", monospace`; g.fillText('TIME PUB', w / 2, 60);
    g.textAlign = 'left'; g.font = `600 26px ${KR}`; [['19:30', '황도'], ['20:00', '치킨'], ['21:00', '김치전'], ['22:30', '계란말이']].forEach(([a, b], i) => g.fillText(`${a} ${b}`, 46, 130 + i * 62)); });
}
function memoTex() {
  return tex(512, 260, (g, w, h) => { g.fillStyle = '#f6f3ea'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(120,150,200,.35)'; g.lineWidth = 2; for (let y = 40; y < h; y += 34) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.fillStyle = '#2a2a3a'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.font = `700 44px ${HAND}`; g.fillText('컴퓨터 비밀번호: KQta', 30, 70);
    g.font = `700 28px ${HAND}`; g.fillText('(키보드 기본 설정은 소문자이니', 40, 150); g.fillText('처음에 대문자로 바꾸는거 까먹ㄴㄴ)', 40, 190); });
}
function loginTex() {
  return tex(512, 300, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#0e2a4a'); gr.addColorStop(1, '#1a1030'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(w / 2, 95, 38, 0, TAU); g.fill(); g.fillStyle = '#0e2a4a'; g.beginPath(); g.arc(w / 2, 84, 14, 0, TAU); g.fill(); g.beginPath(); g.arc(w / 2, 122, 24, Math.PI, 0); g.fill();
    g.fillStyle = '#e8eef6'; g.textAlign = 'center'; g.font = `600 26px ${KR}`; g.fillText('사장님', w / 2, 168);
    g.fillStyle = 'rgba(255,255,255,.9)'; rrect(g, w / 2 - 120, 190, 240, 40, 8); g.fill(); g.fillStyle = '#8a94a4'; g.font = `400 20px ${KR}`; g.textAlign = 'left'; g.fillText('비밀번호', w / 2 - 104, 216); });
}
function desktopTex() {
  return tex(512, 300, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f0a860'); gr.addColorStop(1, '#6a3a4a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f4ead6'; g.fillRect(120, 40, 272, 190); g.fillStyle = '#3a2a24'; g.fillRect(132, 52, 248, 150);
    const r = rng(8); for (let i = 0; i < 6; i++) { const x = 160 + i * 38, y = 130 + (i % 2) * 8; g.fillStyle = ['#e8c09a', '#f0caa0', '#e4b890'][i % 3]; g.beginPath(); g.arc(x, y, 13, 0, TAU); g.fill(); g.fillStyle = ['#c84a3a', '#3a6ab0', '#4a9a5a', '#e0b040'][(r() * 4) | 0]; g.fillRect(x - 15, y + 14, 30, 40); }
    g.fillStyle = '#3a2a24'; g.font = `700 22px ${HAND}`; g.textAlign = 'center'; g.fillText('TIME PUB 단골들 ♥', w / 2, 218);
    g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(0, h - 26, w, 26); });
}
function bubbleTex() {
  return tex(512, 220, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#fbf6ea'; rrect(g, 8, 8, w - 16, 160, 40); g.fill(); g.beginPath(); g.moveTo(90, 160); g.lineTo(60, 214); g.lineTo(150, 160); g.fill();
    g.fillStyle = '#8a3a1a'; g.font = `600 28px ${KR}`; g.textAlign = 'left'; g.fillText('사장님', 44, 56);
    g.fillStyle = '#2a1a10'; g.font = `700 46px ${HAND}`; g.fillText('"계산 도와드릴게요!"', 44, 116); });
}

/* ---------------------------------------------------------------- props */
const BOT = {
  soju: { r: 0.034, body: 0.14, sh: 0.045, neck: 0.05, nr: 0.013, glass: [0x2c8a40, 0.8], cap: 0x1d6a2c, lab: [0.07, 0.04] },
  cider: { r: 0.04, body: 0.16, sh: 0.05, neck: 0.035, nr: 0.015, glass: [0xd8efe0, 0.42], cap: 0x23913f, lab: [0.07, 0.07] },
  cass: { r: 0.033, body: 0.15, sh: 0.05, neck: 0.075, nr: 0.012, glass: [0x5a2a08, 0.92], cap: 0xc9a13a, lab: [0.07, 0.045] },
  makgeolli: { r: 0.042, body: 0.18, sh: 0.04, neck: 0.03, nr: 0.017, glass: [0xf2eee2, 1], cap: 0xece6d6, lab: [0.1, 0.05] },
  whisky: { r: 0.042, body: 0.17, sh: 0.03, neck: 0.07, nr: 0.014, glass: [0x8a4a14, 0.85], cap: 0x1a1a1a, lab: [0.07, 0.05] },
};
const BMAT = {}, LMAT = {};
function bottle(parent, kind, x, y, z, s = 1) {
  const k = BOT[kind], g = grp(x, y, z, 0, parent); g.scale.setScalar(s);
  const gm = BMAT[kind] || (BMAT[kind] = M(k.glass[0], { roughness: 0.12, metalness: 0.1, transparent: k.glass[1] < 1, opacity: k.glass[1] }));
  mesh(cy(k.r, k.r, k.body, 20), gm, 0, k.body / 2, 0, g);
  mesh(cy(k.nr, k.r, k.sh, 20), gm, 0, k.body + k.sh / 2, 0, g);
  mesh(cy(k.nr, k.nr, k.neck, 14), gm, 0, k.body + k.sh + k.neck / 2, 0, g);
  mesh(cy(k.nr * 1.15, k.nr * 1.15, 0.016, 14), M(k.cap, { metalness: 0.4, roughness: 0.4 }), 0, k.body + k.sh + k.neck + 0.008, 0, g);
  const lm = LMAT[kind] || (LMAT[kind] = M(0xffffff, { map: labelTex(kind), roughness: 0.6 }));
  const lb = mesh(cy(k.r * 1.03, k.r * 1.03, k.lab[0], 24, true), lm, 0, k.lab[1] + k.lab[0] / 2, 0, g); lb.rotation.y = Math.PI;
  return g;
}
const glassMat = M(0xdfeaf0, { transparent: true, opacity: 0.32, roughness: 0.08, metalness: 0.1 });
function shotGlass(parent, x, y, z) { mesh(cy(0.022, 0.017, 0.05, 14, true), glassMat, x, y + 0.025, z, parent); mesh(cy(0.017, 0.017, 0.006, 14), glassMat, x, y + 0.003, z, parent); }
function beerGlass(parent, x, y, z) { mesh(cy(0.04, 0.034, 0.14, 16, true), glassMat, x, y + 0.07, z, parent); mesh(cy(0.036, 0.033, 0.07, 16), M(0xe8a83a, { transparent: true, opacity: 0.75, roughness: 0.2 }), x, y + 0.04, z, parent); }
function bowl(parent, x, y, z, food = 0xc8642a, r = 0.08) {
  mesh(cy(r, r * 0.6, r * 0.6, 20), M(0xe8e0cc, { roughness: 0.4 }), x, y + r * 0.3, z, parent);
  mesh(cy(r * 0.9, r * 0.9, 0.01, 20), M(food, { roughness: 0.6 }), x, y + r * 0.52, z, parent);
}
function plate(parent, x, y, z, food = 0xd8a040, rng0 = Math.random) {
  mesh(cy(0.14, 0.12, 0.018, 24), M(0xf0ece2, { roughness: 0.35 }), x, y + 0.009, z, parent);
  for (let i = 0; i < 6; i++) { const m = mesh(new THREE.SphereGeometry(0.035, 8, 6), M(food, { roughness: 0.7 }), x + (rng0() - 0.5) * 0.12, y + 0.03, z + (rng0() - 0.5) * 0.12, parent); m.scale.set(1, 0.55, 1.3); m.rotation.y = rng0() * 3; }
}
function napkin(parent, x, y, z, r0) { const m = mesh(new THREE.IcosahedronGeometry(0.03, 0), M(0xf4f2ea, { roughness: 1, flatShading: true }), x, y + 0.02, z, parent); m.rotation.set(r0() * 3, r0() * 3, r0() * 3); m.scale.set(1.2, 0.7, 1); }
const candles = [];
function candle(parent, x, y, z) {
  mesh(cy(0.045, 0.045, 0.09, 18, true), glassMat, x, y + 0.045, z, parent);
  mesh(cy(0.034, 0.034, 0.05, 16), M(0xf2e8d0, { roughness: 0.8 }), x, y + 0.025, z, parent);
  const f = mesh(new THREE.ConeGeometry(0.009, 0.03, 8), Bm(0xffc66a), x, y + 0.068, z, parent);
  const gl = glow(1, 0xffa040, 0.22, 0.22, x, y + 0.07, z, 0, 0.6, parent);
  candles.push({ f, gl, ph: Math.random() * 10 });
}
function chair(parent, x, z, ry) {
  const g = grp(x, 0, z, ry, parent), w = M(0x4a2c18, { roughness: 0.6 });
  mesh(bx(0.42, 0.04, 0.4), w, 0, 0.46, 0, g);
  for (const [lx, lz] of [[-0.18, -0.17], [0.18, -0.17], [-0.18, 0.17], [0.18, 0.17]]) mesh(bx(0.035, 0.46, 0.035), w, lx, 0.23, lz, g);
  for (const lx of [-0.18, 0.18]) mesh(bx(0.035, 0.46, 0.035), w, lx, 0.69, 0.17, g);
  mesh(bx(0.42, 0.09, 0.03), w, 0, 0.86, 0.17, g); mesh(bx(0.42, 0.05, 0.03), w, 0, 0.66, 0.17, g);
  return g;
}
let topTex;
function table(x, z, ry = 0, w = 1.6, d = 0.85, chairs = true, r0 = Math.random) {
  const g = grp(x, 0, z, ry);
  mesh(bx(w, 0.06, d), M(0xffffff, { map: topTex, roughness: 0.45, color: 0xd0b090 }), 0, 0.74, 0, g);
  const leg = M(0x2a1a10, { roughness: 0.6 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(bx(0.07, 0.71, 0.07), leg, sx * (w / 2 - 0.08), 0.355, sz * (d / 2 - 0.08), g);
  if (chairs) for (const sz of [-1, 1]) for (const cx of [-w * 0.25, w * 0.25]) chair(g, cx + (r0() - 0.5) * 0.08, sz * (d / 2 + 0.3), (sz > 0 ? 0 : Math.PI) + (r0() - 0.5) * 0.3);
  collide(x, z, w + 0.15, d + (chairs ? 1.1 : 0.15));
  return g;
}
function pendant(x, z, y = 2.7, inten = 0.95, dist = 6) {
  mesh(cy(0.006, 0.006, HH - y - 0.1, 6), M(0x111111), x, (HH + y + 0.1) / 2, z);
  mesh(cy(0.05, 0.25, 0.2, 24, true), M(0x1a1612, { side: THREE.DoubleSide, roughness: 0.5, metalness: 0.4 }), x, y, z);
  mesh(cy(0.03, 0.03, 0.03, 12), M(0x111111), x, y + 0.11, z);
  mesh(new THREE.SphereGeometry(0.055, 14, 10), Bm(0xffe0a8), x, y - 0.07, z);
  glow(1, 0xffb060, 0.6, 0.6, x, y - 0.12, z, 0, 0.35).rotation.x = -Math.PI / 2;
  if (!inten) return null;
  const l = new THREE.PointLight(0xffaa5c, inten, dist, 1); l.position.set(x, y - 0.2, z); scene.add(l);
  return zl(1, l);
}
function stickyNote(x, y, z, ry, color, text, seed) {
  const t = tex(160, 160, (g, w, h) => { const r = rng(seed); g.fillStyle = color; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(0, 0, w, 18);
    g.fillStyle = ['#2a2a4a', '#5a1a1a', '#1a3a2a'][(r() * 3) | 0]; g.font = `700 ${text.length > 7 ? 24 : 30}px ${HAND}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    const parts = text.split('|'); parts.forEach((s, i) => g.fillText(s, w / 2, h / 2 + (i - (parts.length - 1) / 2) * 32)); });
  const m = plane(t, 0.17, 0.17, true, { roughness: 0.9 }); m.position.set(x, y, z); m.rotation.y = ry; m.rotation.z = (rng(seed + 3)() - 0.5) * 0.5; scene.add(m);
  return m;
}

/* ---------------------------------------------------------------- room */
const HH = 3.9;
let pcScreen, neonMat, zzz = [];
function buildRoom() {
  topTex = woodTex(12, '#6a4428', 80);
  scene.add(new THREE.HemisphereLight(0xffcf9a, 0x1a0e06, 0.16));
  scene.add(new THREE.AmbientLight(0xffe0c0, 0.04));
  const pl = (c, i, d, x, y, z) => { const l = new THREE.PointLight(c, i, d, 1); l.position.set(x, y, z); scene.add(l); return zl(1, l); };

  /* floor, walls, ceiling, beams */
  mesh(new THREE.PlaneGeometry(12, 11), M(0xffffff, { map: tex(1024, 1024, drawFloor, [3, 3]), roughness: 0.75 }), 0, 0, 0).rotation.x = -Math.PI / 2;
  const wall = (w, x, z, ry, rep) => { const t = tex(1024, 512, drawWall); t.wrapS = THREE.RepeatWrapping; t.repeat.set(rep, 1); const m = mesh(new THREE.PlaneGeometry(w, HH), M(0xffffff, { map: t, roughness: 0.95 }), x, HH / 2, z); m.rotation.y = ry; return m; };
  wall(12, 0, -5.5, 0, 2); wall(12, 0, 5.5, Math.PI, 2); wall(11, -6, 0, Math.PI / 2, 2); wall(11, 6, 0, -Math.PI / 2, 2);
  mesh(new THREE.PlaneGeometry(12, 11), M(0xffffff, { map: tex(512, 512, drawCeil, [3, 3]), roughness: 1 }), 0, HH, 0).rotation.x = Math.PI / 2;
  const beam = M(0x1a100a, { roughness: 0.8 });
  for (let x = -4.5; x <= 4.6; x += 1.8) mesh(bx(0.2, 0.22, 11), beam, x, HH - 0.11, 0);
  mesh(bx(12, 0.24, 0.2), beam, 0, HH - 0.12, -1.0); mesh(bx(12, 0.24, 0.2), beam, 0, HH - 0.12, 2.6);

  /* warm lamps over the tables and the bar, a cold spill from the window */
  pendant(-1.8, 1.6); pendant(1.8, 1.5); pendant(-2.6, -1.3, 2.75, 0.85); pendant(1.5, -1.5, 2.75, 0.85); pendant(4.95, 4.3, 2.55, 0.7, 4.5);
  pendant(-3.6, -4.2, 2.85, 0); pendant(-0.9, -4.2, 2.85, 0);
  pl(0xffb868, 0.85, 6.5, -2.4, 2.45, -4.3);
  pl(0xffb070, 0.5, 7, -0.6, 3.1, 4.3);
  /* brass wall sconces: left wall (food photos, bingo, host stand) */
  for (const z of [-0.95, 2.35]) { mesh(cy(0.07, 0.04, 0.05, 14), M(0x8a6a3a, { metalness: 0.7, roughness: 0.3 }), -5.95, 2.75, z).rotation.z = Math.PI / 2; const sh = mesh(cy(0.06, 0.1, 0.14, 16, true), M(0xf2d8a0, { side: THREE.DoubleSide, emissive: 0xb07020, emissiveIntensity: 0.9 }), -5.84, 2.82, z); void sh; glow(1, 0xffb050, 0.7, 0.7, -5.9, 2.82, z, Math.PI / 2, 0.45); }
  pl(0xffb468, 0.55, 4.5, -5.5, 2.7, -0.95); pl(0xffb468, 0.35, 3.5, -5.5, 2.7, 2.35);

  buildBar();
  buildFrontRight();
  buildLeft();
  buildRight();
  buildBack();
  buildTables();
  buildDust(0xffcf90, 260, 11, 10);
  tickers.push((t) => {
    candles.forEach(c => { const k = 0.85 + Math.sin(t * 11 + c.ph) * 0.08 + Math.sin(t * 23 + c.ph * 2) * 0.06; c.f.scale.set(1, k, 1); c.gl.material.opacity = 0.45 * k; });
    if (neonMat) neonMat.color.setScalar(Math.floor(t * 1.7) % 9 === 0 && Math.sin(t * 50) > 0 ? 0.35 : 1);
    zzz.forEach((z, i) => { const u = ((t * 0.35 + i / 3) % 1); z.position.set(5.12 - u * 0.12, 1.08 + u * 0.55, 4.3 + Math.sin(u * 6 + i) * 0.06); z.material.opacity = Math.sin(u * Math.PI) * 0.85; z.scale.setScalar(0.1 + u * 0.1); });
  });
}

function buildBar() {
  /* the counter, stools, back shelves with dishes and bottles, the lit "오월" menu board */
  const front = M(0xffffff, { map: woodTex(21, '#3a2214', 70), roughness: 0.7 });
  mesh(bx(6.0, 1.0, 0.55), front, -1.85, 0.5, -4.25);
  mesh(bx(6.1, 0.06, 0.78), M(0xffffff, { map: woodTex(22, '#6a4026', 50), roughness: 0.32 }), -1.85, 1.03, -4.2);
  mesh(bx(6.0, 0.08, 0.04), M(0x1e120a), -1.85, 0.06, -3.96);
  collide(-2.4, -4.7, 7.2, 1.8);
  /* paper notes taped to the counter front, as in the base image */
  const r = rng(31);
  for (let i = 0; i < 9; i++) { const m = plane(paperTex(200 + i, 6 + (r() * 5 | 0), ['#efe4c8', '#f3ead2', '#e8dcc0'][i % 3]), 0.2, 0.26, true); m.position.set(-4.5 + i * 0.62 + (r() - 0.5) * 0.15, 0.7 + (r() - 0.5) * 0.12, -3.965); m.rotation.z = (r() - 0.5) * 0.2; scene.add(m); }
  /* stools */
  const sm = M(0x2a1a10, { roughness: 0.5 }), seat = M(0x5a2a1a, { roughness: 0.6 });
  for (const x of [-4.2, -3.3, -1.3, -0.4]) { mesh(cy(0.18, 0.18, 0.06, 18), seat, x, 0.74, -3.55); mesh(cy(0.025, 0.025, 0.7, 8), sm, x, 0.37, -3.55); mesh(new THREE.TorusGeometry(0.15, 0.012, 6, 18), sm, x, 0.3, -3.55).rotation.x = Math.PI / 2; mesh(cy(0.16, 0.18, 0.03, 18), sm, x, 0.015, -3.55); collide(x, -3.55, 0.4, 0.4); }
  /* lamp on the counter (base image) */
  { const g = grp(-4.55, 1.06, -4.3, 0);
    mesh(cy(0.06, 0.08, 0.04, 16), M(0x3a2a1a, { metalness: 0.5, roughness: 0.4 }), 0, 0.02, 0, g);
    mesh(cy(0.015, 0.015, 0.28, 8), M(0x3a2a1a, { metalness: 0.5 }), 0, 0.18, 0, g);
    mesh(cy(0.08, 0.15, 0.17, 20, true), M(0xf2d8a0, { side: THREE.DoubleSide, emissive: 0xb07020, emissiveIntensity: 0.9 }), 0, 0.38, 0, g);
    glow(1, 0xffb050, 0.9, 0.9, 0, 0.36, 0.1, 0, 0.5, g);
    pl0(0xffb050, 0.4, 3, -4.55, 1.6, -4.0); }
  /* back counter and wall shelves */
  mesh(bx(4.3, 0.95, 0.5), M(0xffffff, { map: woodTex(23, '#2e1a0e', 50), roughness: 0.7 }), -2.95, 0.475, -5.25);
  mesh(bx(4.3, 1.25, 0.03), M(0x1a100a), -2.95, 1.95, -5.48);
  const shelfM = M(0x4a2c18, { roughness: 0.6 });
  const kinds = ['soju', 'cass', 'whisky', 'soju', 'makgeolli', 'soju', 'cider', 'cass', 'whisky', 'soju', 'soju', 'cass'];
  for (const [y, row] of [[1.5, 0], [2.05, 1]]) {
    mesh(bx(4.3, 0.04, 0.3), shelfM, -2.95, y, -5.34);
    for (let i = 0; i < 13; i++) {
      const x = -4.95 + i * 0.32 + (r() - 0.5) * 0.06;
      if ((i + row) % 4 === 1) { for (let k = 0; k < 3; k++) mesh(cy(0.07, 0.05, 0.035, 16), M(0xe8e2d4, { roughness: 0.4 }), x, y + 0.04 + k * 0.035, -5.34); }
      else if ((i + row) % 4 === 3) { beerGlass(scene, x - 0.05, y + 0.02, -5.34); beerGlass(scene, x + 0.06, y + 0.02, -5.3); }
      else bottle(scene, kinds[(i * 5 + row * 3) % kinds.length], x, y + 0.02, -5.34, 1.15);
    }
  }
  /* rice-cooker-ish pot and dish rack on the back counter */
  mesh(cy(0.16, 0.16, 0.26, 20), M(0xd8d4c8, { metalness: 0.3, roughness: 0.35 }), -1.4, 1.08, -5.22);
  for (let i = 0; i < 6; i++) mesh(cy(0.1, 0.1, 0.012, 18), M(0xece6da), -3.8 + i * 0.03, 1.07, -5.2).rotation.z = Math.PI / 2 - 0.2;
  /* menu board */
  const mb = plane(tex(1536, 300, drawMenu), 4.1, 0.8, false); mb.position.set(-2.95, 3.0, -5.44); mb.material.color.setRGB(0.92, 0.82, 0.66); scene.add(mb);
  mesh(bx(4.24, 0.92, 0.05), M(0x1a100a), -2.95, 3.0, -5.47);
  glow(1, 0xffc070, 5.0, 1.6, -2.95, 3.0, -5.41, 0, 0.28);

  /* L5: the owner's computer on the counter; the password memo lands on the monitor */
  { const g = grp(-2.3, 1.06, -4.38, 0);
    mesh(bx(0.22, 0.015, 0.16), M(0x1a1a1c, { roughness: 0.4 }), 0, 0.008, 0, g);
    mesh(bx(0.04, 0.2, 0.03), M(0x1a1a1c, { roughness: 0.4 }), 0, 0.11, -0.02, g);
    const bez = mesh(bx(0.62, 0.38, 0.03), M(0x121214, { roughness: 0.35 }), 0, 0.37, 0, g);
    pcScreen = plane(loginTex(), 0.57, 0.33, false); pcScreen.position.set(0, 0.37, 0.017); g.add(pcScreen);
    glow(1, 0x5a8ad8, 0.9, 0.6, 0, 0.37, 0.05, 0, 0.18, g);
    const kb = mesh(bx(0.44, 0.022, 0.15), M(0x1c1c1e, { roughness: 0.5 }), 0, 0.011, 0.3, g);
    for (let k = 0; k < 4; k++) mesh(bx(0.4, 0.004, 0.025), M(0x3a3a3e), 0, 0.024, 0.25 + k * 0.032, g);
    mesh(bx(0.06, 0.02, 0.1), M(0x1c1c1e), 0.32, 0.01, 0.3, g);
    const memo = new THREE.Group(); memo.position.set(-0.04, 0.42, 0.02); g.add(memo);
    const mp = plane(memoTex(), 0.26, 0.13, true, { roughness: 0.85 }); mp.rotation.z = 0.04; memo.add(mp);
    const tape = mesh(new THREE.PlaneGeometry(0.08, 0.025), M(0xe8dcb0, { transparent: true, opacity: 0.8, roughness: 0.6 }), 0, 0.065, 0.002, memo); void tape;
    memo.visible = false;
    props.L5 = { kind: 'fade', m: memo, drop: 0.12 };
    [bez, kb].forEach(m => { m.userData.proxy = g; });
    makeInteract(g, 'lock', 'L5', '카운터 컴퓨터', 0.85); }

  /* L6: card terminal at the right end of the counter; the signature menu screen above lights up with the owner's line */
  { const g = grp(0.55, 1.06, -4.05, -0.35);
    mesh(bx(0.11, 0.05, 0.2), M(0x2a2a2e, { roughness: 0.4 }), 0, 0.025, 0, g);
    const scr = plane(tex(128, 80, (c, w, h) => { c.fillStyle = '#0c1a14'; c.fillRect(0, 0, w, h); c.fillStyle = '#8cf0a8'; c.font = `600 22px ${KR}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('결제코드', w / 2, h / 2); }), 0.08, 0.05, false);
    scr.rotation.x = -Math.PI / 2 + 0.5; scr.position.set(0, 0.058, -0.05); g.add(scr);
    const kp = plane(keypadTex(false), 0.075, 0.09, true, { roughness: 0.5 }); kp.rotation.x = -Math.PI / 2; kp.position.set(0, 0.052, 0.045); g.add(kp);
    locks3d.L6 = { keypad: kp };
    mesh(cy(0.025, 0.025, 0.06, 12), M(0xf0ece4), 0, 0.05, -0.1, g).rotation.z = Math.PI / 2;
    makeInteract(g, 'lock', 'L6', '카드 결제 단말기', 0.55); }
  { const g = grp(0.1, 2.5, -5.44, 0);
    mesh(bx(1.08, 1.02, 0.06), M(0x101012, { roughness: 0.3 }), 0, 0, 0, g);
    const off = tex(128, 128, (c, w, h) => { c.fillStyle = '#060708'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(255,255,255,.05)'; c.beginPath(); c.moveTo(0, 0); c.lineTo(w * 0.6, 0); c.lineTo(0, h * 0.6); c.fill(); });
    const scr = plane(off, 0.98, 0.92, false); scr.position.z = 0.032; g.add(scr);
    const on = imgTex('assets/signature.webp');
    const bub = plane(bubbleTex(), 0.95, 0.41, false, { transparent: true }); bub.position.set(0.95, 0.55, 0.05); bub.rotation.z = 0.05; bub.visible = false; g.add(bub);
    const gl = glow(1, 0xcfe0ff, 1.6, 1.5, 0, 0, 0.04, 0, 0, g);
    props.L6 = { kind: 'custom', reveal(instant) {
      scr.material.map = on; scr.material.needsUpdate = true; bub.visible = true;
      tween(1.2, u => { scr.material.color.setScalar(u >= 1 ? 1 : (Math.random() < 0.4 ? 0.12 : 1) * (0.3 + 0.7 * u)); bub.material.opacity = ease(u); bub.scale.setScalar(0.6 + 0.4 * ease(u)); gl.material.opacity = 0.25 * u; }, instant);
    } }; }
}
function pl0(c, i, d, x, y, z) { const l = new THREE.PointLight(c, i, d, 1); l.position.set(x, y, z); scene.add(l); return zl(1, l); }

function buildFrontRight() {
  /* b_shelf: the two-shelf display cabinet with exactly the bottles from the blog photo */
  { const g = grp(3.0, 0, -5.3, 0), wd = M(0xffffff, { map: woodTex(41, '#5a3620', 40), roughness: 0.6 });
    mesh(bx(1.7, 0.85, 0.42), M(0xffffff, { map: woodTex(42, '#3a2414', 40), roughness: 0.7 }), 0, 0.425, 0.02, g);
    mesh(bx(1.7, 1.42, 0.03), M(0x3a2214, { roughness: 0.7 }), 0, 1.56, -0.18, g);
    for (const y of [0.87, 1.55, 2.25]) mesh(bx(1.7, 0.05, 0.38), wd, 0, y, 0, g);
    for (const x of [-0.83, 0.83]) mesh(bx(0.05, 1.42, 0.38), wd, x, 1.56, 0, g);
    const top = ['cider', 'soju', 'cass', 'makgeolli'], bot = ['soju', 'cider', 'cass', 'cider', 'soju'];
    top.forEach((k, i) => bottle(g, k, -0.54 + i * 0.36, 1.575, 0.02, 1.25));
    bot.forEach((k, i) => bottle(g, k, -0.6 + i * 0.3, 0.895, 0.02, 1.25));
    const lamp = pl0(0xffd8a0, 0.35, 2.2, 3.0, 2.0, -4.9); void lamp;
    glow(1, 0xffd090, 1.6, 0.4, 0, 2.2, 0.0, 0, 0.25, g);
    makeInteract(g, 'clue', 'b_shelf', '진열대의 술', 2.6);
    collide(3.0, -5.3, 1.75, 0.5); }
  /* neon sign above */
  { const t = tex(1024, 220, (c, w, h) => { c.clearRect(0, 0, w, h); glowText(c, 'TIME PUB', w / 2, h / 2 + 6, `400 150px ${SIGN}`, '#5fe0a0', 30); });
    const m = plane(t, 2.2, 0.47, false, { transparent: true }); m.position.set(3.4, 3.15, -5.45); scene.add(m); neonMat = m.material;
    glow(1, 0x5fe0a0, 3.2, 1.0, 3.4, 3.15, -5.43, 0, 0.3); }
  /* L3: the soju fridge; the kakao message lights up on a phone left on top */
  { const g = grp(4.95, 0, -5.12, 0);
    const shell = M(0xd8d6ce, { roughness: 0.4, metalness: 0.2 });
    const body = mesh(bx(0.72, 1.0, 0.03), shell, 0, 0.5, -0.285, g);
    for (const sx of [-1, 1]) mesh(bx(0.06, 1.0, 0.6), shell, sx * 0.33, 0.5, 0, g);
    mesh(bx(0.72, 0.1, 0.6), shell, 0, 0.95, 0, g); mesh(bx(0.72, 0.12, 0.6), shell, 0, 0.06, 0, g);
    const inner = Bm(0x9ec8e8);
    mesh(new THREE.PlaneGeometry(0.6, 0.78), inner, 0, 0.51, -0.268, g);
    glow(1, 0x9ad0ff, 0.9, 1.1, 0, 0.52, 0.31, 0, 0.18, g);
    for (const y of [0.3, 0.62]) { mesh(bx(0.6, 0.015, 0.4), M(0xb8c0c8, { metalness: 0.6 }), 0, y - 0.01, 0.0, g); for (let i = 0; i < 5; i++) bottle(g, i % 2 ? 'soju' : 'cass', -0.22 + i * 0.11, y, 0.0, 0.95); }
    mesh(new THREE.PlaneGeometry(0.62, 0.8), glassMat, 0, 0.52, 0.302, g);
    mesh(bx(0.03, 0.4, 0.03), M(0xb8b8b8, { metalness: 0.8, roughness: 0.3 }), 0.27, 0.55, 0.33, g);
    const bt = plane(signTex(['ICE COLD', '참이슬 · 카스'], '#1a5aa8', '#ffffff', SIGN, 70, 512, 160), 0.56, 0.085, false); bt.position.set(0, 0.95, 0.302); g.add(bt);
    locks3d.L3 = padlock(g, 0.27, 0.42, 0.37, 0.8);
    /* phone */
    const ph = new THREE.Group(); ph.position.set(-0.08, 1.0, 0.06); ph.rotation.y = 0.35; g.add(ph);
    mesh(bx(0.11, 0.01, 0.2), M(0x111114, { roughness: 0.25, metalness: 0.5 }), 0, 0.005, 0, ph);
    const ps = plane(imgTex('assets/kakao.webp'), 0.1, 0.15, false); ps.rotation.x = -Math.PI / 2; ps.position.set(0, 0.0115, 0); ph.add(ps);
    glow(1, 0xbfd8ff, 0.35, 0.35, 0, 0.05, 0, 0, 0.35, ph).rotation.x = -Math.PI / 2;
    ph.visible = false;
    props.L3 = { kind: 'fade', m: ph, drop: 0.25 };
    body.userData.proxy = g;
    makeInteract(g, 'lock', 'L3', '벌주 냉장고', 1.45);
    collide(4.95, -5.12, 0.8, 0.7); }
}

function buildLeft() {
  /* b_food: the 3×3 food photo frame */
  { const g = framed(scene, imgTex('assets/food.webp'), 1.15, 1.15, -5.95, 1.95, -2.0, Math.PI / 2, 0x2a1a10, 0.06);
    const pq = plane(signTex(['TIME PUB 인기 안주'], '#2a1a10', '#f2c27a', SIGN, 52, 512, 90), 0.7, 0.12, false); pq.position.set(0, 0.7, 0.04); pq.material.color.setScalar(0.8); g.add(pq);
    makeInteract(g, 'clue', 'b_food', '음식 사진 모음', 0.95); }
  /* b_bingo: event poster pinned to a cork board */
  { const g = grp(-5.96, 1.85, 0.05, Math.PI / 2);
    mesh(bx(1.18, 0.92, 0.03), M(0x9a7044, { roughness: 1 }), 0, 0, 0, g);
    const p = plane(imgTex('assets/bingo.webp'), 1.06, 0.8, true, { roughness: 0.8 }); p.position.z = 0.018; g.add(p);
    for (const [x, y] of [[-0.5, 0.37], [0.5, 0.37], [-0.5, -0.37], [0.5, -0.37]]) mesh(new THREE.SphereGeometry(0.014, 8, 6), M(0xc8301c), x, y, 0.025, g);
    makeInteract(g, 'clue', 'b_bingo', '이달의 빙고 이벤트', 0.72); }
  /* extra posters */
  { const m = plane(signTex(['외상 사절', '사장님도 먹고 삽시다'], '#f2e8d0', '#7a1e14', SIGN, 70, 512, 300), 0.62, 0.36, true); m.position.set(-5.97, 2.55, -3.6); m.rotation.y = Math.PI / 2; scene.add(m); }
  { const m = plane(paperTex(61, 10, '#efe6d0', '공지'), 0.4, 0.53, true); m.position.set(-5.97, 2.05, -0.95); m.rotation.y = Math.PI / 2; m.rotation.z = 0.05; scene.add(m); }
  { const m = plane(tex(300, 420, beerPoster), 0.48, 0.67, true); m.position.set(-5.97, 2.05, 5.0); m.rotation.y = Math.PI / 2; scene.add(m); }

  /* L2: host stand by the entrance; the reservation cards appear on it */
  { const g = grp(-5.45, 0, 1.6, Math.PI / 2);
    const st = mesh(bx(0.62, 1.02, 0.42), M(0xffffff, { map: woodTex(51, '#3e2414', 40), roughness: 0.6 }), 0, 0.51, 0, g);
    mesh(bx(0.7, 0.04, 0.5), M(0x5a3620, { roughness: 0.4 }), 0, 1.04, 0, g);
    const lb = plane(signTex(['안내', 'WELCOME'], '#1e120a', '#f2c27a', SIGN, 70, 256, 160), 0.3, 0.19, true); lb.position.set(0, 0.75, 0.212); g.add(lb);
    /* ledger box */
    const box = grp(-0.14, 1.06, 0.0, 0, g);
    mesh(bx(0.3, 0.12, 0.24), M(0x6a2a1a, { roughness: 0.5 }), 0, 0.06, 0, box);
    mesh(bx(0.31, 0.02, 0.25), M(0x4a1a10), 0, 0.12, 0, box);
    const tl = plane(signTex(['예약 장부'], '#6a2a1a', '#f2d8a0', SIGN, 60, 256, 90), 0.16, 0.05, true); tl.position.set(0, 0.07, 0.121); box.add(tl);
    locks3d.L2 = padlock(box, 0.1, 0.05, 0.13, 0.55);
    /* reservation card holder (wakes after L1) */
    const hold = new THREE.Group(); hold.position.set(0.16, 1.06, 0.0); g.add(hold);
    mesh(bx(0.2, 0.01, 0.2), M(0xdfeaf0, { transparent: true, opacity: 0.35, roughness: 0.1 }), 0, 0.005, 0, hold);
    [17, 4, 22, 9, 14].forEach((n, i) => {
      const c = plane(cardTex(n), 0.15, 0.1, true, { roughness: 0.7 }); c.position.set(0, 0.17 - i * 0.025, -0.07 + i * 0.035); c.rotation.x = -0.28; hold.add(c);
      const ac = mesh(new THREE.PlaneGeometry(0.17, 0.06), M(0xdfeaf0, { transparent: true, opacity: 0.25, roughness: 0.1 }), 0, 0.1 - i * 0.025, -0.06 + i * 0.035, hold); ac.rotation.x = -0.28;
    });
    hold.visible = false;
    props.L2 = { kind: 'fade', m: hold, drop: 0.2 };
    st.userData.proxy = g;
    makeInteract(g, 'lock', 'L2', '입구 예약 장부함', 1.6);
    collide(-5.45, 1.6, 0.6, 0.75); }

  /* exit door */
  exitDoor({ x: -6, z: 3.65, ry: -Math.PI / 2, leaf: 0x3e2414, frame: 0x8a6a3a, sign: 'EXIT' });
  { const m = plane(signTex(['영업시간', '17:00 - 03:00'], '#f2e8d0', '#3a2212', SIGN, 50, 256, 160), 0.3, 0.19, true); m.position.set(-5.97, 1.6, 2.35); m.rotation.y = Math.PI / 2; scene.add(m); }
}

function buildRight() {
  /* b_darts: dartboard cabinet with a throw line on the floor */
  { const g = framed(scene, imgTex('assets/darts.webp'), 1.3, 1.04, 5.94, 1.75, -2.4, -Math.PI / 2, 0x1e120a, 0.08);
    makeInteract(g, 'clue', 'b_darts', '다트 놀이', 0.85);
    const ln = mesh(new THREE.PlaneGeometry(0.05, 0.9), Bm(0xd8c060), 3.7, 0.003, -2.4); ln.rotation.x = -Math.PI / 2;
    const tl = plane(signTex(['THROW LINE'], '#1a1a1a', '#e8d070', SIGN, 64, 512, 100), 0.5, 0.1, false); tl.rotation.x = -Math.PI / 2; tl.rotation.z = Math.PI / 2; tl.position.set(3.55, 0.004, -2.4); tl.material.color.setScalar(0.6); scene.add(tl);
    pl0(0xffd8a0, 0.35, 2.6, 5.2, 2.9, -2.4); }
  { const m = plane(tex(300, 420, beerPoster), 0.5, 0.7, true); m.position.set(5.97, 2.0, -0.55); m.rotation.y = -Math.PI / 2; m.rotation.z = -0.03; scene.add(m); }
  /* window with the night street, a candle and dried flowers on the sill (base image) */
  { const w = plane(tex(1024, 600, drawNight), 2.3, 1.45); w.position.set(5.97, 1.95, 1.5); w.rotation.y = -Math.PI / 2; scene.add(w);
    const fr = M(0x2a1a10, { roughness: 0.6 });
    for (const z of [0.33, 1.5, 2.67]) mesh(bx(0.1, 1.6, 0.08), fr, 5.93, 1.95, z);
    for (const y of [1.2, 2.7]) mesh(bx(0.1, 0.08, 2.42), fr, 5.93, y, 1.5);
    mesh(bx(0.32, 0.05, 2.6), M(0x3a2414, { roughness: 0.5 }), 5.82, 1.15, 1.5);
    glow(1, 0x6a8ad8, 2.6, 1.7, 5.9, 1.95, 1.5, -Math.PI / 2, 0.14);
    candle(scene, 5.8, 1.175, 2.3); candle(scene, 5.8, 1.175, 0.7);
    mesh(cy(0.05, 0.035, 0.18, 14), glassMat, 5.82, 1.265, 1.0);
    for (let i = 0; i < 7; i++) { const s = mesh(cy(0.004, 0.004, 0.36, 4), M(0x7a5a30), 5.82, 1.4, 1.0); s.rotation.set((Math.random() - 0.5) * 0.6, 0, (Math.random() - 0.5) * 0.6); mesh(new THREE.SphereGeometry(0.02, 6, 5), M(0xc89a50), 5.82 + Math.sin(i) * 0.06, 1.58, 1.0 + Math.cos(i) * 0.06); } }
  /* b_drunk: the regular slumped over the corner table */
  { const tg = grp(5.12, 0, 4.3, 0);
    mesh(bx(0.75, 0.05, 1.1), M(0xffffff, { map: topTex, color: 0xd0b090, roughness: 0.45 }), 0, 0.74, 0, tg);
    for (const [x, z] of [[-0.3, -0.48], [0.3, -0.48], [-0.3, 0.48], [0.3, 0.48]]) mesh(bx(0.06, 0.72, 0.06), M(0x2a1a10), x, 0.36, z, tg);
    const r0 = rng(77);
    [['soju', -0.2, -0.35], ['soju', -0.05, -0.42], ['soju', 0.12, -0.38], ['cass', 0.2, 0.42]].forEach(([k, x, z]) => bottle(tg, k, x, 0.765, z));
    const tip = bottle(tg, 'soju', -0.15, 0.8, 0.3); tip.rotation.z = Math.PI / 2; tip.rotation.y = 0.6;
    shotGlass(tg, 0.0, 0.765, 0.25); shotGlass(tg, -0.25, 0.765, 0.05);
    plate(tg, -0.18, 0.765, -0.05, 0xb8642a, r0);
    for (let i = 0; i < 4; i++) napkin(tg, (r0() - 0.5) * 0.5, 0.765, (r0() - 0.5) * 0.8, r0);
    candle(tg, -0.25, 0.765, 0.45);
    chair(scene, 5.66, 4.3, Math.PI / 2);
    chair(scene, 4.45, 4.0, -Math.PI / 2 - 0.4);
    /* the man: seated on the wall side, folded arms on the table, head down */
    const man = grp(5.66, 0, 4.3, -Math.PI / 2);
    const shirt = M(0x6a7a8a, { roughness: 0.8 }), pants = M(0x26262c, { roughness: 0.8 }), skin = M(0xd8a07a, { roughness: 0.7 }), hair = M(0x1a1410, { roughness: 0.9 });
    for (const sx of [-0.1, 0.1]) { mesh(bx(0.14, 0.13, 0.42), pants, sx, 0.53, 0.14, man); mesh(bx(0.12, 0.46, 0.13), pants, sx, 0.25, 0.32, man); mesh(bx(0.12, 0.06, 0.22), M(0x1a1410), sx, 0.03, 0.38, man); }
    const torso = grp(0, 0.55, -0.02, 0, man); torso.rotation.x = 1.05;
    mesh(bx(0.4, 0.52, 0.22), shirt, 0, 0.26, 0, torso);
    mesh(bx(0.06, 0.3, 0.01), M(0x8a1a1a), 0.02, 0.32, 0.115, torso).rotation.z = 0.25;
    for (const sx of [-1, 1]) { const a = mesh(bx(0.11, 0.09, 0.4), shirt, sx * 0.13, 0.8, 0.5, man); a.rotation.y = sx * 0.55; }
    const head = mesh(new THREE.SphereGeometry(0.11, 18, 14), skin, 0.02, 0.92, 0.53, man); head.scale.set(1, 0.95, 1.1);
    const hh = mesh(new THREE.SphereGeometry(0.117, 18, 12, 0, TAU, 0, Math.PI * 0.6), hair, 0.02, 0.925, 0.535, man); hh.rotation.x = 1.25;
    const zt = tex(64, 64, (c, w, h) => { c.fillStyle = '#e8eef8'; c.font = `700 48px ${HAND}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('z', w / 2, h / 2); });
    for (let i = 0; i < 3; i++) { const z = new THREE.Sprite(new THREE.SpriteMaterial({ map: zt, transparent: true, depthWrite: false, toneMapped: false })); scene.add(z); z.raycast = () => {}; zzz.push(z); }
    tg.userData.proxy = man;
    tg.traverse(o => { if (o.isMesh) o.userData.proxy = man; });
    makeInteract(man, 'clue', 'b_drunk', '술취한 아조씨', 1.35);
    collide(5.2, 4.3, 1.4, 1.3); collide(4.45, 4.0, 0.5, 0.5); }
}

function buildBack() {
  /* doodle wall with sticky notes; L4 guestbook box; the calligraphy lands above it */
  const ttl = plane(tex(768, 120, (c, w, h) => { c.fillStyle = '#3a2414'; c.fillRect(0, 0, w, h); c.fillStyle = '#f2d8a0'; c.font = `700 70px ${HAND}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('우리들의 낙서벽', w / 2, h / 2 + 4); }), 1.5, 0.23, true);
  ttl.position.set(-1.6, 3.25, 5.46); ttl.rotation.y = Math.PI; scene.add(ttl);
  const notes = ['또 올게요!', '2014|문창과 MT', '사장님|사랑해요', '취업하자!!', '시험 망함ㅠ', '베스트셀러|작가 될 사람|왔다감 ★', '졸업 축하♥', '오늘은|내가 쏜다', '과제 언제|끝나냐', '첫사랑|여기서', '소주는|역시', '또 만나'];
  const cols = ['#f6e27a', '#f8b8c8', '#a8e0f0', '#c8f0a8', '#f8d0a0'];
  const pos = [[-3.5, 2.6], [-3.1, 1.9], [-2.75, 2.45], [-3.4, 1.35], [-2.65, 1.6], [-2.55, 2.95], [-0.55, 2.7], [-0.2, 2.05], [0.15, 2.6], [-0.6, 1.55], [0.2, 1.4], [-3.05, 3.0]];
  pos.forEach(([x, y], i) => stickyNote(x, y, 5.47, Math.PI, cols[i % cols.length], notes[i], 300 + i));
  { const g = grp(-1.6, 0, 5.3, Math.PI);
    const bxm = mesh(bx(0.52, 0.42, 0.24), M(0xffffff, { map: woodTex(61, '#5a3620', 40), roughness: 0.55 }), 0, 1.2, 0, g);
    mesh(bx(0.3, 0.015, 0.01), M(0x111111), 0, 1.36, 0.121, g);
    const lb = plane(signTex(['방명록'], '#f2e2c0', '#4a2010', SIGN, 70, 256, 100), 0.24, 0.09, true); lb.position.set(0, 1.22, 0.122); g.add(lb);
    mesh(bx(0.6, 0.04, 0.3), M(0x3a2414), 0, 0.97, 0.02, g);
    locks3d.L4 = padlock(g, 0.0, 1.07, 0.14, 0.75);
    /* calligraphy scroll */
    const sc = new THREE.Group(); sc.position.set(0, 2.25, -0.17); g.add(sc);
    const p = plane(imgTex('assets/calligraphy.webp'), 1.05, 0.84, true, { roughness: 0.9 }); sc.add(p);
    for (const y of [0.45, -0.45]) { const rod = mesh(cy(0.018, 0.018, 1.18, 10), M(0x3a1e10, { roughness: 0.5 }), 0, y, 0.01, sc); rod.rotation.z = Math.PI / 2; }
    mesh(cy(0.003, 0.003, 0.35, 4), M(0x1a1a1a), 0, 0.6, 0.0, sc).rotation.z = 0;
    sc.visible = false;
    props.L4 = { kind: 'fade', m: sc, drop: 0.3 };
    bxm.userData.proxy = g;
    makeInteract(g, 'lock', 'L4', '낙서벽 방명록함', 1.7); }
  /* theme poster */
  poster({ x: 2.3, z: 5.47, ry: Math.PI, y: 2.05, w: 1.25, h: 1.0 });
  { const m = plane(signTex(['오늘도', '수고했어요'], '#1e2a20', '#bfe8c8', SIGN, 70, 512, 300), 0.55, 0.32, true); m.position.set(3.8, 2.4, 5.47); m.rotation.y = Math.PI; scene.add(m); }
  { const m = plane(paperTex(71, 11, '#f0e6cf'), 0.4, 0.53, true); m.position.set(1.0, 2.2, 5.47); m.rotation.y = Math.PI; m.rotation.z = -0.04; scene.add(m); }
  /* coat hooks and a bench along the back */
  for (let i = 0; i < 4; i++) mesh(cy(0.012, 0.012, 0.1, 6), M(0x9a8a6a, { metalness: 0.7 }), -4.6 + i * 0.3, 1.75, 5.44).rotation.x = Math.PI / 2;
  { const j = mesh(bx(0.34, 0.6, 0.12), M(0x3a3a4a, { roughness: 0.9 }), -4.3, 1.45, 5.38); j.rotation.z = 0.05; }
}

function buildTables() {
  const r = rng(91);
  /* L1: the regulars' table (base image foreground): stew pot, bowls, soju, glasses, phone, receipts, the cutlery drawer */
  { const t = table(-1.8, 1.6, 0, 1.7, 0.9, true, r), y = 0.77;
    mesh(cy(0.16, 0.16, 0.04, 20), M(0x1a1a1a, { metalness: 0.5, roughness: 0.4 }), -0.1, y + 0.02, -0.05, t);
    mesh(cy(0.17, 0.14, 0.13, 24, true), M(0x2a2a2a, { metalness: 0.6, roughness: 0.35, side: THREE.DoubleSide }), -0.1, y + 0.1, -0.05, t);
    mesh(cy(0.15, 0.15, 0.01, 24), M(0x8a2410, { roughness: 0.35 }), -0.1, y + 0.14, -0.05, t);
    bowl(t, -0.45, y, -0.2, 0xc8a050); bowl(t, 0.25, y, -0.22, 0x5a8a3a); bowl(t, -0.55, y, 0.18, 0xd8c8a0, 0.06);
    bottle(t, 'soju', -0.35, y, 0.05); bottle(t, 'soju', 0.32, y, 0.05); bottle(t, 'cass', -0.72, y, -0.3);
    shotGlass(t, -0.25, y, 0.25); shotGlass(t, 0.17, y, 0.0); shotGlass(t, 0.0, y, -0.32); beerGlass(t, -0.62, y, -0.05);
    for (let i = 0; i < 5; i++) napkin(t, (r() - 0.5) * 1.4, y, (r() - 0.5) * 0.7, r);
    candle(t, 0.55, y, -0.28);
    mesh(bx(0.075, 0.008, 0.155), M(0x0e0e10, { roughness: 0.25, metalness: 0.5 }), -0.5, y + 0.004, 0.34, t).rotation.y = 0.3;
    /* related clue (awake from the start): number plate + receipt */
    const np = new THREE.Group(); np.position.set(0.35, y, 0.3); np.rotation.y = -0.15; t.add(np);
    mesh(bx(0.16, 0.2, 0.012), M(0x101010, { roughness: 0.3 }), 0, 0.1, 0, np).rotation.x = -0.18;
    const npp = plane(imgTex('assets/numpad.webp'), 0.15, 0.2, true, { roughness: 0.5 }); npp.position.set(0, 0.1, 0.008); npp.rotation.x = -0.18; np.add(npp);
    mesh(bx(0.12, 0.012, 0.08), M(0x101010), 0, 0.006, 0.03, np);
    const rc = plane(receiptTex(), 0.13, 0.2, true, { roughness: 0.9 }); rc.rotation.x = -Math.PI / 2; rc.rotation.z = 0.25; rc.position.set(0.08, y + 0.002, 0.28); t.add(rc);
    /* the cutlery drawer box with the padlock */
    const d = grp(0.62, y, 0.12, 0, t);
    mesh(bx(0.3, 0.13, 0.22), M(0xffffff, { map: woodTex(71, '#7a4a28', 30), roughness: 0.5 }), 0, 0.065, 0, d);
    mesh(bx(0.26, 0.09, 0.01), M(0x5a3418), 0, 0.06, 0.112, d);
    for (let i = 0; i < 4; i++) mesh(cy(0.006, 0.006, 0.18, 6), M(0xc8c8c8, { metalness: 0.9, roughness: 0.2 }), -0.08 + i * 0.05, 0.16, -0.05, d);
    locks3d.L1 = padlock(d, 0.0, 0.06, 0.13, 0.55);
    makeInteract(d, 'lock', 'L1', '단골 테이블 수저 서랍', 0.55); }
  /* table 2: today's recommendation stand */
  { const t = table(1.8, 1.5, 0.05, 1.6, 0.85, true, r), y = 0.77;
    const st = new THREE.Group(); st.position.set(0.5, y, 0.1); st.rotation.y = -0.3; t.add(st);
    mesh(bx(0.3, 0.02, 0.1), M(0x5a3620), 0, 0.01, 0, st);
    const card = plane(tex(300, 400, (c, w, h) => { c.fillStyle = '#f4ead2'; c.fillRect(0, 0, w, h); c.strokeStyle = '#8a6a40'; c.lineWidth = 6; c.strokeRect(10, 10, w - 20, h - 20); c.fillStyle = '#3a2412'; c.textAlign = 'center'; c.font = `400 40px ${SIGN}`; c.fillText('오늘의 추천', w / 2, 70); c.font = `600 26px ${KR}`; c.textAlign = 'left'; [['두부김치', '14.0'], ['해물파전', '16.0'], ['골뱅이무침', '15.0']].forEach(([a, b], i) => { c.fillText(a, 34, 140 + i * 50); c.textAlign = 'right'; c.fillText(b, w - 34, 140 + i * 50); c.textAlign = 'left'; }); c.font = `700 26px ${HAND}`; c.textAlign = 'center'; c.fillText('맛있게 드시고', w / 2, 320); c.fillText('가는 길 조심하세요 ^^', w / 2, 352); }), 0.27, 0.36, true);
    card.position.set(0, 0.2, 0); card.rotation.x = -0.12; st.add(card);
    plate(t, -0.3, y, -0.1, 0xd8b050, r); bowl(t, 0.05, y, -0.2, 0xe8d8b0);
    bottle(t, 'makgeolli', -0.6, y, 0.15); shotGlass(t, -0.4, y, 0.25); beerGlass(t, 0.1, y, 0.22);
    candle(t, -0.05, y, 0.05);
    for (let i = 0; i < 3; i++) napkin(t, (r() - 0.5) * 1.2, y, (r() - 0.5) * 0.6, r); }
  /* tables 3, 4 */
  { const t = table(-2.6, -1.3, -0.04, 1.6, 0.85, true, r), y = 0.77;
    plate(t, -0.2, y, 0, 0xc86a3a, r); plate(t, 0.3, y, -0.1, 0xe8c070, r); bottle(t, 'soju', 0.0, y, 0.25); bottle(t, 'cider', 0.6, y, -0.2);
    shotGlass(t, -0.5, y, 0.2); shotGlass(t, 0.4, y, 0.25); candle(t, -0.6, y, -0.25); }
  { const t = table(1.5, -1.5, 0.06, 1.6, 0.85, true, r), y = 0.77;
    mesh(cy(0.16, 0.13, 0.12, 24), M(0x6a6a6a, { metalness: 0.7, roughness: 0.3 }), 0, y + 0.06, 0, t);
    mesh(cy(0.15, 0.15, 0.01, 24), M(0xe0c890), 0, y + 0.115, 0, t);
    bowl(t, -0.45, y, 0.15, 0xb83a1a); bottle(t, 'cass', 0.5, y, 0.1); bottle(t, 'cass', 0.6, y, -0.15); beerGlass(t, 0.35, y, 0.28); beerGlass(t, -0.35, y, -0.25);
    for (let i = 0; i < 3; i++) napkin(t, (r() - 0.5) * 1.2, y, (r() - 0.5) * 0.6, r); }
}

/* ---------------------------------------------------------------- story scenes (pixel art) */
function makeScenes() {
  const pixG = api.pixG;
  const halo = (x, y, rad, a, c = '255,190,110') => { const gr = pixG.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, `rgba(${c},${a})`); gr.addColorStop(1, `rgba(${c},0)`); pixG.fillStyle = gr; pixG.fillRect(x - rad, y - rad, rad * 2, rad * 2); };
  const soju = (x, y) => { P('#3a9a4a', x, y, 2, 5); P('#3a9a4a', x, y - 2, 1, 2); P('#e8f0e8', x, y + 2, 2, 1); };
  function pub(t, lit = 0) {
    const L = lit > 0.5;
    P(L ? '#6a4a30' : '#2c1d13', 0, 0, PW, 74); P(L ? '#3a2818' : '#191009', 0, 74, PW, 34);
    for (let x = 0; x < PW; x += 20) P('rgba(0,0,0,.25)', x, 74, 1, 34);
    P(L ? '#3a2616' : '#22150c', 0, 56, PW, 18); P('#3a2616', 0, 55, PW, 2);
    P('#f3dca4', 6, 5, 78, 14); ptext('오월', 17, 12, '#3a2210', 8);
    for (let i = 0; i < 4; i++) { P('#9a7a50', 30 + i * 13, 8, 10, 1); P('#9a7a50', 30 + i * 13, 11, 8, 1); P('#9a7a50', 30 + i * 13, 14, 9, 1); }
    P('#3a2414', 6, 28, 78, 2); P('#3a2414', 6, 38, 78, 2);
    for (let i = 0; i < 12; i++) { const c = ['#3a9a4a', '#7a4a1a', '#e8e4d4', '#3a9a4a'][i % 4]; P(c, 9 + i * 6, 22, 3, 6); P(c, 10 + i * 6, 20, 1, 2); P(['#e8e4d4', '#3a9a4a'][i % 2], 10 + i * 6, 33, 3, 5); }
    P('#5a3820', 0, 44, 90, 3); P('#2e1b0f', 0, 47, 90, 23);
    for (let i = 0; i < 6; i++) P('#e8dcc0', 6 + i * 14, 52, 7, 9);
    P('#3a2616', 146, 12, 40, 36); P('#0d1526', 148, 14, 36, 32); P('#3a2616', 165, 14, 2, 32);
    P('#ff6aa8', 151, 22, 7, 2); P('#6ad0ff', 171, 30, 9, 2); P('#ffd36b', 154, 36, 5, 2);
    P('#4a2c18', 144, 47, 44, 3);
    P('#f2e6c8', 178, 43, 2, 4); P(Math.sin(t * 13) > 0 ? '#ffd36b' : '#ffb040', 178, 41, 2, 2); halo(179, 42, 8, 0.4);
    P('#e8dcc0', 98, 10, 12, 16); P('#d8c8a0', 114, 16, 10, 12); P('#efe4cc', 128, 8, 12, 14); P('#7a1e14', 100, 13, 8, 4);
    for (const x of [62, 122]) { P('#120c08', x, 0, 1, 14); P('#2a1c12', x - 5, 14, 11, 4); P('#ffe0a8', x - 1, 18, 3, 1); halo(x, 22, 30, 0.25 + lit * 0.25); }
    if (L) halo(96, 40, 110, 0.18 * lit);
  }
  function table(x, y, w = 60) { P('#6a4428', x, y, w, 4); P('#3a2414', x + 4, y + 4, 3, 16); P('#3a2414', x + w - 7, y + 4, 3, 16); }
  const shirts = ['#3a5a8a', '#8a3a3a', '#3a7a5a', '#a8803a'];
  return {
    street(t) {
      P('#0b0e1a', 0, 0, PW, PH); P('#16131c', 0, 14, 40, 70); P('#16131c', 156, 6, 36, 78);
      for (let i = 0; i < 8; i++) P('#f2c27a', 6 + (i % 3) * 10, 22 + Math.floor(i / 3) * 14, 4, 5);
      P('#1c1714', 0, 80, PW, 28); P('#2a221c', 0, 80, PW, 2);
      P('#3a2416', 52, 26, 96, 54); P('#22140b', 52, 24, 96, 3);
      P('#120c08', 66, 30, 68, 14); ptext('TIME PUB', 100, 37, Math.floor(t * 2.2) % 7 === 0 ? '#2a5a40' : '#7fe0a8', 9); halo(100, 37, 40, 0.18, '120,230,170');
      for (let i = 0; i < 12; i++) P(Math.floor(t * 3 + i) % 2 ? '#ffd36b' : '#7a5a2a', 54 + i * 8, 22, 2, 2);
      P('#ffcf7a', 92, 54, 16, 26); halo(100, 66, 26, 0.4); P('#d89a50', 60, 52, 24, 14); P('#d89a50', 116, 52, 24, 14);
      P('#2a1a10', 66, 58, 4, 8); P('#2a1a10', 74, 57, 4, 9); P('#2a1a10', 124, 58, 4, 8);
      const x = Math.min(96, 20 + t * 18);
      kid(x, 69, '#3a4a6a', '#1a120c', t, { back: x >= 96 });
    },
    cheers(t) {
      pub(t); table(56, 80, 80);
      kid(66, 64, shirts[0], '#1a120c', t, { smile: true, bob: true }); kid(116, 64, shirts[1], '#2a1a10', t, { smile: true, bob: true });
      soju(84, 75); soju(108, 75); P('#e8d8a0', 94, 77, 6, 3);
      const c = (t % 2.2) < 0.5;
      const gx = c ? [88, 92, 98, 102] : [72, 80, 112, 120], gy = c ? 58 : 72;
      gx.forEach(x => P('#dfeaf0', x, gy, 2, 3));
      if (c) { ptext('짠!', 96, 46, '#ffd36b', 10); for (let i = 0; i < 6; i++) P('#ffe6a0', 90 + Math.cos(i) * 10, 56 + Math.sin(i * 2) * 5); }
      kid(78, 76, shirts[2], '#1a120c', t, { back: true }); kid(106, 76, shirts[3], '#3a2414', t, { back: true });
    },
    promise(t) {
      pub(t); table(56, 82, 80); soju(70, 77); soju(122, 77);
      kid(66, 70, shirts[0], '#1a120c', t, { smile: true, jump: true }); kid(120, 70, shirts[1], '#2a1a10', t, { smile: true, jump: true });
      P('#4a2c18', 89, 76, 14, 2); kid(92, 62, '#3a4a6a', '#1a120c', t, { armsUp: true, smile: true });
      const w = Math.min(124, t * 70);
      P('#f6ecd6', 96 - w / 2, 30, w, 16); if (w > 120) { P('#f6ecd6', 98, 46, 3, 3); ptext('베스트셀러 되면 매일 쏜다!', 96, 38, '#3a2210', 7); }
    },
    monitor(t) {
      P('#0b0c12', 0, 0, PW, PH); P('#16141a', 0, 78, PW, 30);
      P('#2a2018', 30, 74, 132, 4); P('#1a140e', 36, 78, 3, 30); P('#1a140e', 152, 78, 3, 30);
      halo(96, 52, 60, 0.22, '120,170,230');
      P('#1a1a1e', 66, 30, 60, 40); P('#1e3a5a', 69, 33, 54, 32); P('#1a1a1e', 93, 70, 6, 4);
      const n = Math.floor(t * 5) % 14;
      for (let i = 0; i < Math.min(5, n); i++) P('#cfe0f0', 73, 37 + i * 5, i === Math.min(5, n) - 1 ? (n * 7) % 40 + 4 : 44, 1);
      if (Math.floor(t * 3) % 2) P('#ffffff', 73 + ((n * 7) % 40) + 6, 37 + (Math.min(5, n) - 1) * 5, 1, 3);
      ptext('♡ 3', 112, 61, '#8aa0b8', 6);
      for (let i = 0; i < Math.min(7, Math.floor(t * 1.5)); i++) P('#e8e4d8', 20 + i * 23 % 150, 92 + (i * 5) % 10, 4, 3);
      P('#2a2018', 86, 80, 20, 3); P('#1a140e', 94, 83, 3, 14);
      kid(92, 69, '#5a6a8a', '#2a1c12', t, { back: true });
    },
    locked(t) {
      pub(t); table(40, 84, 50); table(110, 84, 50); soju(56, 79); soju(130, 79);
      P('#3a2412', 2, 30, 22, 44); P('#24160c', 4, 32, 18, 42);
      const lit = Math.min(6, Math.floor(t * 1.6)); for (let i = 0; i < 6; i++) P(i < lit ? '#ff5a4a' : '#5a1a14', 2 + i * 3.4, 26, 2, 2);
      P('#ffd36b', 17, 50, 5, 4); P('#ffd36b', 18, 47, 1, 3); P('#ffd36b', 20, 47, 1, 3); P('#ffd36b', 18, 46, 3, 1);
      kid(92, 84 - Math.min(8, t * 2), '#3a4a6a', '#1a120c', t, { back: true });
    },
    lastcall(t) {
      const lit = Math.min(1, t * 0.6);
      pub(t, lit); table(56, 82, 80); soju(70, 77); soju(76, 77); soju(118, 77);
      kid(92, 68, '#3a4a6a', '#1a120c', t, { smile: true, armsUp: t > 1.2 });
      for (let i = 0; i < 14; i++) { const x = (i * 37 + t * 8) % PW, y = 16 + ((i * 53) % 50) + Math.sin(t * 2 + i) * 2; P('rgba(255,230,160,.8)', x, y); }
    },
    alley(t) {
      const gr = pixG.createLinearGradient(0, 0, 0, PH); gr.addColorStop(0, '#2a3a6a'); gr.addColorStop(1, '#e8a070'); pixG.fillStyle = gr; pixG.fillRect(0, 0, PW, PH);
      P('#2a2030', 0, 18, 44, 64); P('#2a2030', 150, 10, 42, 72);
      P('#4a3024', 52, 30, 70, 50); P('#22140b', 60, 34, 54, 12); ptext('TIME PUB', 87, 40, '#3a5a48', 8);
      P('#3a2a20', 80, 56, 16, 24);
      P('#3a3036', 0, 80, PW, 28); P('#4a4048', 0, 80, PW, 2);
      for (let i = 0; i < 3; i++) P('#ffffff', (i * 61 + t * 10) % PW, 12 + i * 6, 6, 1);
      kid(Math.min(150, 96 + t * 12), 69, '#3a4a6a', '#1a120c', t, { smile: true });
    },
    dawn(t) {
      const gr = pixG.createLinearGradient(0, 0, 0, PH); gr.addColorStop(0, '#5a8ac8'); gr.addColorStop(1, '#ffc080'); pixG.fillStyle = gr; pixG.fillRect(0, 0, PW, PH);
      halo(150, 70, 40, 0.6, '255,230,160'); P('#fff0c0', 144, 64, 12, 12);
      P('#2a2030', 0, 84, PW, 24); for (let x = 0; x < PW; x += 26) P('#2a2030', x, 74 + (x % 3) * 3, 18, 12);
      for (let i = 0; i < 6; i++) { const x = (i * 41 + t * 22) % (PW + 20) - 10, y = 22 + (i * 13) % 34 + Math.sin(t * 3 + i) * 2; P('#ffffff', x, y, 4, 3); P('#d8d8e8', x + 1, y + 1, 2, 1); }
      kid(92, 70, '#3a4a6a', '#1a120c', t, { armsUp: true, smile: true });
      P('#f4ead6', 98, 70, 5, 4);
    },
  };
}

BackStage.run({
  id: 'w2', week: 2, title: 'PUB', titleHTML: 'TIME <em>PUB</em>', tag: '대학 시절 단골 술집', docTitle: 'Time Pub', brand: 'TIME PUB',
  poster: 'assets/poster.webp', posterAlt: '어둑한 술집. "오월" 메뉴판 아래 바 카운터, 안주와 소주병이 놓인 나무 테이블, 촛불과 벽에 붙은 메모들',
  intro: ['여기도 오랜만이군. 대학교 때 허구한 날 죽치고 앉아있던 단골 술집.',
    '그땐 내 이름 박힌 글 하나만 터지면 세상이 다 내 건 줄 알고, 밤새 술잔 부딪히면서 별 영양가 없는 소리나 지껄였지.',
    '나중에 베스트셀러 작가 되면 여기서 매일같이 술 쏘겠다고 약속도 참 쉽게 했었다.',
    '근데 막상 모니터 앞에서 남들 입맛에 맞는 글이나 억지로 쥐어 짜내다 보니 뭣도 없으면서 그냥 생각 없이 떠들던 그때가 차라리 속 편했던 것 같다.'],
  fonts: ['400 32px "Black Han Sans"', '700 32px Gaegu'],
  fontSample: '오월 모둠전 두부김치 오징어볶음 골뱅이무침 오뎅탕 소주 맥주 막걸리 생맥주 과일소주 참이슬 사이다 Cass 예약석 Table 황도 치킨 김치전 계란말이 TIME PUB 컴퓨터 비밀번호 KQta 키보드 기본 설정은 소문자이니 처음에 대문자로 바꾸는거 까먹ㄴㄴ 사장님 계산 도와드릴게요 결제코드 인기 안주 외상 사절 사장님도 먹고 삽시다 공지 시원한 생맥주 500cc 4,500원 안내 WELCOME 예약 장부 영업시간 THROW LINE ICE COLD 카스 우리들의 낙서벽 방명록 오늘도 수고했어요 오늘의 추천 해물파전 맛있게 드시고 가는 길 조심하세요 또 올게요 문창과 MT 사랑해요 취업하자 시험 망함 베스트셀러 작가 될 사람 왔다감 졸업 축하 오늘은 내가 쏜다 과제 언제 끝나냐 첫사랑 여기서 역시 또 만나 단골들 노래방 호프 24시 포차 z ♥ ★ ㅠ',
  sky: 0x0a0604, fog: [9, 22], exposure: 1.05,
  player: { x: 0.2, z: 4.5, yaw: 0.12, pitch: -0.08 },
  bounds: [-5.65, 5.65, -5.15, 5.15],
  locks: LOCKS, clues: CLUES, related: RELATED, captions: CAPTIONS,
  cut: {
    L2: { at: [-5.42, 1.2, 1.45], view: [-3.7, 1.85, 1.7], color: 0xffe9b0 },
    L3: { at: [4.87, 1.03, -5.06], view: [4.0, 1.95, -3.5], color: 0x8cd0ff },
    L4: { at: [-1.6, 2.25, 5.4], view: [-1.6, 2.0, 3.3], color: 0xffd36b },
    L5: { at: [-2.34, 1.48, -4.34], view: [-2.3, 1.85, -2.7], color: 0xffe9b0 },
    L6: { at: [0.1, 2.5, -5.4], view: [0.5, 1.95, -2.6], color: 0x6fd39a },
  },
  focus: {
    L1: [[-1.8, 3.6, 3.4], [-1.4, 0.8, 1.6]], L2: [[-3.8, 3.6, 1.8], [-5.4, 1.0, 1.6]], L3: [[4.0, 3.6, -3.4], [4.95, 0.8, -5.1]],
    L4: [[-1.6, 3.6, 3.5], [-1.6, 1.5, 5.3]], L5: [[-2.3, 3.6, -2.5], [-2.3, 1.2, -4.35]], L6: [[0.6, 3.6, -2.6], [0.3, 1.5, -4.6]],
    start: [[-1.6, 3.6, 3.6], [-1.6, 0.75, 1.6]],
  },
  focusIntensity: 0.7,
  prologue: [
    { scene: 'street', text: '대학 시절 단골 술집, TIME PUB. 오랜만에 그 문을 열었다.' },
    { scene: 'cheers', text: '그땐 밤새 술잔을 부딪히며 별 영양가 없는 소리나 떠들었지.' },
    { scene: 'promise', text: '베스트셀러 작가가 되면 여기서 매일 술 쏘겠다고, 참 쉽게도 약속했다.' },
    { scene: 'monitor', text: '지금의 나는 모니터 앞에서 남들 입맛에 맞는 글을 쥐어짜는 중이다.' },
    { scene: 'locked', text: '등 뒤에서 문이 잠겼다. 자물쇠 여섯 개를 풀고 이 술집을 나가자.' },
  ],
  epilogue: [
    { scene: 'lastcall', text: '마지막 자물쇠가 풀리자, 가게 안 불이 하나둘 환하게 켜졌다.' },
    { scene: 'alley', text: '골목에 새벽이 밝는다. 그때 떠들던 허황된 이야기들이 이상하게 반갑다.' },
    { scene: 'dawn', text: '남들 입맛 말고, 그때처럼 내가 하고 싶은 이야기를 써 보자.' },
  ],
  scenes: makeScenes,
  exitCaption: '출입문이 열렸다. 골목 끝에서 새벽 공기가 밀려 들어온다.',
  finalGoal: '출입문이 풀렸습니다. 입구 쪽 출구로 나가세요.',
  build() { buildRoom(); },
  onSolved(L) { if (L.id === 'L5' && pcScreen) { pcScreen.material.map = desktopTex(); pcScreen.material.needsUpdate = true; } },
});
})();
