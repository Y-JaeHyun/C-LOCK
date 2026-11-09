/* CLASSROOM (1주차): 타임고등학교 3학년 4반. Theme data and room for the Back Stage engine.
   Room: x -6..6 (left wall = windows + exit door, right wall = lockers), z -5.5 (blackboard) .. 5.5 (back wall), ceiling 3.8. */
(() => {
'use strict';
const api = BackStage.api;
const { THREE, scene, TAU, DIGITS, M, Bm, bx, cy, mesh, grp, collide, rng, tex, imgTex, plane, rrect, glow, buildDust,
  zl, V3, props, locks3d, spinners, tickers, padlock, makeInteract, exitDoor, poster, framed, tween, ease, P, ptext, kid, SKIN, PW, PH } = api;

/* ---------------------------------------------------------------- puzzle data */
const LOCKS = [
  { id: 'L1', no: 1, name: '교탁 서랍', type: '숫자 4자리', mech: 'dial', set: DIGITS, len: 4, hash: 'x5we7', related: null,
    hints: ['연관 단서 없이 방 안 단서 하나로 풀립니다. 앞줄 책상의 「생활과 윤리 시험지」를 보세요.', '동그라미 친 글자를 색깔별로, 읽는 순서대로 모으세요. 빨강은 숫자, 파랑은 계산, 초록은 또 다른 숫자가 됩니다.'] },
  { id: 'L2', no: 2, name: '교실 뒤 사물함', type: '숫자 5자리', mech: 'dial', set: DIGITS, len: 5, hash: 'r93mji', related: 'seats',
    hints: ['연관 단서 「교실 좌석표」는 책상 위 「시간표」와 짝입니다.', '시간표는 교탁이 아래, 좌석표는 교탁이 위에 있습니다. 시간표를 180도 돌려 좌석표에 겹친 뒤, 파랑 → 노랑 → 빨강 → 검정 순서로 색칠된 칸의 좌석 번호를 읽으세요.'] },
  { id: 'L3', no: 3, name: '반장 선거 투표함', type: '방향 자물쇠', mech: 'dir', hash: 'ikrtwo', related: 'posters',
    hints: ['연관 단서 「반장 후보 포스터」는 창가 라디오의 「노래」와 짝입니다.', '노래가 "오른손/왼손"을 부를 때마다 지금 후보가 그 손으로 가리키는 방향을 적고, "Put your hands up"이 나오면 다음 후보로 넘어가세요. 왼손·오른손은 포스터를 보는 사람 기준입니다.'] },
  { id: 'L4', no: 4, name: '방송 앰프', type: '한글 4글자', mech: 'text', len: 4, label: '한글 4글자', hash: '1m7lelp', related: 'questions',
    hints: ['연관 단서 「영어 듣기 문제지」는 책상 위 「영어듣기 MP3」와 짝입니다.', '음성 속 실제 문제 문구와 문제지를 비교해 바뀐 글자를 찾고, 바뀌기 전의 원래 글자를 문제 번호 순서대로 이으세요.'] },
  { id: 'L5', no: 5, name: '시계 아래 금고', type: '숫자 4자리', mech: 'dial', set: DIGITS, len: 4, hash: 'bzajx2', related: 'letter',
    hints: ['연관 단서 「가정통신문」은 오른쪽 책상 위 「OMR 카드」와 짝입니다.', 'OMR의 문항 번호는 통신문 본문의 줄 번호, 마킹한 답 번호는 그 줄의 몇 번째 글자(띄어쓰기 제외)입니다. 문항 순서대로 글자를 모아 읽고 숫자로 바꾸세요.'] },
  { id: 'L6', no: 6, name: '교내 인터폰', type: '기타 장치 · 입력 2칸', mech: 'form', related: 'intercom',
    fields: [{ label: '내가 몇 학년 몇 반이었더라?' }, { label: '우리 학교 교훈은 무엇이었지?', long: true }],
    hash: ['15vf2gh', '1gzsqn5', '1k6er64'],
    hints: ['이야기 속 교실과, 칠판 왼쪽 「타임고등학교 교훈」 액자에 답이 있습니다.', '첫 칸은 이 교실(3학년 4반), 둘째 칸은 교훈 액자의 문장 그대로입니다.'] },
];

const CAPTIONS = {
  L1: ['교탁 서랍이 덜컥 열렸다. 몽당 분필 하나가 굴러 나온다.', '사물함 위 빈 게시판에 좌석표가 스르르 떠올랐다.'],
  L2: ['사물함 문이 삐걱 열렸다. 낯익은 이름표가 붙어 있다.', '교실 뒤 게시판에 반장 선거 포스터 네 장이 나붙었다.'],
  L3: ['투표함이 열리고, 어디선가 박수 소리가 들린다.', '방송 앰프 옆에 영어 듣기 문제지 한 장이 내려앉았다.'],
  L4: ['앰프가 지직거리며 켜졌다. 듣기 평가 시작 종소리.', '시계 아래 게시판에 가정통신문 한 장이 붙었다.'],
  L5: ['금고가 열리자 거꾸로 돌던 시계 바늘이 멈췄다.', '인터폰 화면이 켜졌다. 누군가 우리 반을 묻는다.'],
  L6: ['"시키는 대로 공부하면 대학 간다!" 외침이 복도까지 울린다.', '교실 뒷문 위 램프 여섯 개가 모두 초록으로 바뀌었다.'],
};

const SONG_CC = [[0.0, 2.3, '♪ (전주)'], [2.34, 4.2, '오른손 왼손 오른손'], [4.2, 5.7, 'Put your hands up'], [6.7, 8.94, '왼손 왼손 오른손'], [8.94, 10.4, 'Put your hands up'],
  [11.34, 13.62, '오른손 왼손 왼손'], [13.62, 14.82, 'Put your hands up'], [14.82, 18.3, '마지막! 왼손 오른손 왼손'], [18.3, 19.7, 'Put your hands up']];
const LISTEN_CC = {
  '01': [[0, 8.94, '1번. 대화를 듣고, 남자의 마지막 말에 대한 여자의 응답으로 가장 적절한 것을 고르시오.'], [9.18, 13.8, "Amy, you said you're going to study at Donna's house tonight, right?"], [13.86, 15.66, 'Yes, Dad.'], [15.72, 19.38, 'We have to submit our team report online by midnight.'], [19.44, 21.18, "I think you'll be quite late."], [21.24, 23.04, 'Should I pick you up?']],
  '02': [[0, 11.22, '2번. 대화를 듣고, 여자의 마지막 말에 대한 남자의 응답으로 가장 적절한 것을 고르시오.'], [11.4, 13.98, 'Thank you for waiting, sir.'], [14.04, 15.24, 'How can I help you?'], [15.3, 18.72, 'My son wants to join the road safety program.'], [18.78, 20.82, 'Are there any seats still available?'], [20.88, 23.16, "It's your lucky day."], [23.22, 27.12, 'Somebody just canceled, so your son can have that seat.']],
  '09': [[3.06, 9.12, '9번. 대화를 듣고, 남자가 지불할 금액을 고르시오.'], [9.36, 11.28, 'Good afternoon.'], [11.34, 12.84, 'What can I help you with, sir?'], [12.9, 15.72, "I'm looking for inline skates for my twins."], [15.78, 16.92, 'I see.'], [16.98, 20.1, 'We have beginner skates and advanced skates.'], [20.16, 25.32, 'A pair of beginner skates is $60, and a pair of advanced skates is $80.'], [25.62, 28.14, 'My boys will start learning next week.'], [28.2, 30.72, 'Then you need the beginner skates.'], [30.84, 31.62, 'Right.'], [31.68, 34.2, "I'll buy 2 pairs in size 13."], [34.62, 35.34, 'Okay.'], [35.4, 38.52, 'And I think your sons also need safety equipment.'], [38.58, 41.22, 'They already have elbow and knee pads.'], [41.28, 43.32, 'So, they only need helmets.'], [43.44, 44.94, 'How much are helmets?'], [45.0, 49.74, 'They originally cost $20 each, but we have a promotion this week.'], [49.8, 53.22, 'So you will get a 50% discount on each helmet.'], [53.28, 54.54, "That's nice."], [54.6, 55.92, "I'll buy 2 helmets."], [55.98, 57.66, 'Do you want anything else?'], [57.72, 59.04, "No, that's all."], [59.1, 60.48, "Here's my credit card."]],
  '15': [[3.06, 11.88, '15번. 다음 상황 설명을 듣고, 스티브가 캐시에게 할 말로 가장 적절한 것을 고르시오.'], [12.18, 15.9, 'Kathy is starting high school and is looking to join a club.'], [15.96, 20.64, "She's interested in translation and has volunteered as a translator before."], [20.7, 24.36, "So she's happy when she finds a translation club at her school."], [24.48, 28.62, 'To enter the club, she must write a self-introduction letter.'], [28.68, 32.22, "However, she's not satisfied with the letter she wrote."], [32.34, 38.7, 'She remembers that her older brother, Steve, has lots of experience writing self-introduction letters.'], [38.82, 43.02, 'Kathy asks him for advice about her self-introduction letter.'], [43.14, 48.96, "Steve thinks the letter doesn't focus enough on what she did as a volunteer translator."], [49.02, 55.92, 'So Steve wants to suggest to Kathy that she emphasize her volunteer work related to translation.'], [56.04, 61.08, 'In this situation, what would Steve most likely say to Kathy?']],
};

const CLUES = {
  b_exam: { title: '생활과 윤리 시험지', where: '교실 · 앞줄 책상', media: [{ type: 'img', src: 'assets/exam.webp', alt: '사회탐구 영역 생활과 윤리 11~15번 문항. 몇몇 글자에 빨강·파랑·초록 동그라미가 쳐져 있다.', caption: '사진을 누르면 크게 볼 수 있어요.' }] },
  b_timetable: { title: '시간표', where: '교실 · 가운데 책상', media: [{ type: 'img', src: 'assets/timetable.webp', alt: '1~5학년 × 1~5교시 시간표. 국어·수학·영어·체육 칸 네 곳에 파랑·노랑·빨강·검정 표시, 아래에 색 순서와 교탁 칸.' }] },
  b_song: { title: '노래', where: '창가 · 카세트 라디오', media: [{ type: 'audio', src: 'assets/song.mp4', title: '라디오에서 흘러나오는 노래 · 21초', captions: SONG_CC }] },
  b_omr: { title: 'OMR 카드', where: '교실 · 오른쪽 책상', media: [{ type: 'img', src: 'assets/omr.webp', alt: '③교시 영어 영역 모의평가 답안지. 5번 ①③, 6번 ①, 8번 ①에 마킹. 수험번호 칸은 비어 있다.' }] },
  b_listen: { title: '영어듣기 MP3', where: '교실 · 왼쪽 책상 MP3 플레이어', media: [
    { type: 'audio', src: 'assets/listen01.mp4', title: '트랙 1 · 1번 문항', captions: LISTEN_CC['01'] },
    { type: 'audio', src: 'assets/listen02.mp4', title: '트랙 2 · 2번 문항', captions: LISTEN_CC['02'] },
    { type: 'audio', src: 'assets/listen09.mp4', title: '트랙 3 · 9번 문항', captions: LISTEN_CC['09'] },
    { type: 'audio', src: 'assets/listen15.mp4', title: '트랙 4 · 15번 문항', captions: LISTEN_CC['15'] }] },
  b_motto: { title: '타임고등학교 교훈', where: '칠판 왼쪽 액자', media: [{ type: 'img', src: 'assets/motto.webp', alt: '액자 속 교훈 "시키는 대로 공부하면 대학 간다". 위에 시계 모양 학교 로고.' }] },
};

const RELATED = {
  seats: { title: '교실 좌석표', media: [{ type: 'img', src: 'assets/seats.webp', alt: '교탁이 위쪽에 있는 5행 × 5열 좌석표, 1번부터 25번.' }] },
  posters: { title: '반장 후보 포스터', media: [{ type: 'img', src: 'assets/posters.webp', alt: '반장 후보 1~4번 포스터. 후보마다 두 손으로 방향을 가리킨다. 문구: 여러분의 선택이 반을 바꿉니다!' }] },
  questions: { title: '영어 듣기 문제지', media: [{ type: 'text', html: '<p><b>1번</b> 대화를 듣고, 남자의 마지막 말에 대한 여자의 응답으로 가장 적절한 것을 고르시길.</p><p><b>2번</b> 대화를 듣고, 여자의 마지막 말에 대한 남자의 응원으로 가장 적절한 것을 고르시오.</p><p><b>9번</b> 대화를 듣고, 남자가 환불할 금액을 고르시오.</p><p><b>15번</b> 다음 상황 설명을 듣고, 스티브가 캐시에게 할 말로 가장 친절한 것을 고르시오.</p>' }] },
  letter: { title: '가정통신문', media: [{ type: 'img', src: 'assets/letter.webp', alt: '타임고등학교 가정통신문 제47호 "시계가 고장나서 하교가 늦었습니다". 왼쪽 위에 시계 로고.', small: true }] },
  intercom: { title: '인터폰 화면', media: [{ type: 'text', html: '<p>다섯 번째 암호까지 클리어하다니 훌륭한걸? 이제 학교를 떠날 때가 된 듯 한데, 내가 우리 반을 잘 기억하고 있는지 테스트 해볼까?</p><p><b>내가 몇 학년 몇 반이었더라? *</b></p><p><b>우리 학교 교훈은 무엇이었지? 오랜만에 외쳐 보자! *</b></p>' }] },
};

/* ---------------------------------------------------------------- textures */
function drawWall(g, w, h) {
  const r = rng(5);
  g.fillStyle = '#a8a08a'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${60 + r() * 40},${55 + r() * 30},${40},${0.03 + r() * 0.06})`; const x = r() * w, y = r() * h, s = 20 + r() * 120; g.beginPath(); g.ellipse(x, y, s, s * (0.4 + r()), r() * 3, 0, TAU); g.fill(); }
  for (let i = 0; i < 18; i++) { g.strokeStyle = `rgba(40,30,20,${0.15 + r() * 0.2})`; g.lineWidth = 1 + r() * 2; const x = r() * w; g.beginPath(); g.moveTo(x, h * 0.45 + r() * 40); g.lineTo(x + (r() - 0.5) * 30, h * 0.45 + 60 + r() * 200); g.stroke(); }
  /* lower wainscot */
  g.fillStyle = '#56645a'; g.fillRect(0, h * 0.7, w, h * 0.3);
  for (let i = 0; i < 120; i++) { g.fillStyle = `rgba(20,24,20,${0.05 + r() * 0.12})`; g.fillRect(r() * w, h * 0.7 + r() * h * 0.3, 4 + r() * 40, 2 + r() * 10); }
  g.fillStyle = '#3e4a42'; g.fillRect(0, h * 0.695, w, 10);
}
function drawFloor(g, w, h) {
  const r = rng(9), n = 8, s = h / n;
  for (let j = 0; j < n; j++) { let x = -r() * 200; while (x < w) { const L = 160 + r() * 220, v = 70 + r() * 30; g.fillStyle = `rgb(${v + 30},${v + 4},${v - 20})`; g.fillRect(x, j * s, L, s); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x, j * s, 3, s); x += L; } g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(0, j * s, w, 3); }
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(20,12,6,${r() * 0.12})`; g.fillRect(r() * w, r() * h, 2 + r() * 30, 1 + r() * 3); }
}
function drawBoard(g, w, h) {
  const grd = g.createRadialGradient(w * 0.5, h * 0.5, 50, w * 0.5, h * 0.5, w * 0.6); grd.addColorStop(0, '#2f4a3a'); grd.addColorStop(1, '#1d2e25'); g.fillStyle = grd; g.fillRect(0, 0, w, h);
  const r = rng(13); for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(230,240,230,${0.02 + r() * 0.04})`; g.fillRect(r() * w, r() * h, 60 + r() * 220, 8 + r() * 30); }
  g.fillStyle = '#e8eee6'; g.strokeStyle = '#e8eee6'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '700 64px Gaegu, cursive'; g.fillText('당번표', 470, 90);
  g.lineWidth = 3; const x0 = 200, y0 = 140, cw = 108, ch = 54;
  for (let i = 0; i <= 5; i++) { g.beginPath(); g.moveTo(x0 + i * cw, y0); g.lineTo(x0 + i * cw, y0 + ch * 2); g.stroke(); }
  for (let j = 0; j <= 2; j++) { g.beginPath(); g.moveTo(x0, y0 + j * ch); g.lineTo(x0 + cw * 5, y0 + j * ch); g.stroke(); }
  g.font = '700 38px Gaegu, cursive';
  ['월', '화', '수', '목', '금'].forEach((d, i) => g.fillText(d, x0 + cw * i + cw / 2, y0 + ch / 2 + 2));
  ['김민수', '이서연', '박지훈', '최유진', '정현우'].forEach((d, i) => g.fillText(d, x0 + cw * i + cw / 2, y0 + ch * 1.5 + 2));
  g.font = '700 46px Gaegu, cursive'; g.fillText('오늘의 명언', 1080, 150);
  g.font = '700 54px Gaegu, cursive'; g.fillText('"너 자신을 알라"', 1080, 230);
  g.font = '700 34px Gaegu, cursive'; g.textAlign = 'left'; g.fillText('D-100  수능까지', 140, 360);
  g.fillStyle = 'rgba(232,238,230,.5)'; g.fillRect(1240, 330, 160, 6);
}
function drawFlag(g, w, h) {
  g.fillStyle = '#f7f5ef'; g.fillRect(0, 0, w, h);
  const cx = w / 2, cy0 = h / 2, R = h * 0.25;
  g.save(); g.translate(cx, cy0); g.rotate(Math.atan2(2, 3));
  g.fillStyle = '#c8102e'; g.beginPath(); g.arc(0, 0, R, Math.PI, 0); g.fill();
  g.fillStyle = '#003478'; g.beginPath(); g.arc(0, 0, R, 0, Math.PI); g.fill();
  g.fillStyle = '#c8102e'; g.beginPath(); g.arc(-R / 2, 0, R / 2, 0, TAU); g.fill();
  g.fillStyle = '#003478'; g.beginPath(); g.arc(R / 2, 0, R / 2, 0, TAU); g.fill();
  g.restore();
  g.fillStyle = '#111';
  const tri = (a, pat) => { g.save(); g.translate(cx, cy0); g.rotate(a); for (let k = 0; k < 3; k++) { const y = -R * 1.55 - k * R * 0.22; if (pat[k]) g.fillRect(-R * 0.5, y, R, R * 0.14); else { g.fillRect(-R * 0.5, y, R * 0.45, R * 0.14); g.fillRect(R * 0.05, y, R * 0.45, R * 0.14); } } g.restore(); };
  const a = Math.atan2(2, 3);
  tri(-a, [1, 1, 1]); tri(Math.PI + -a, [0, 0, 0]); tri(a, [1, 0, 1]); tri(Math.PI + a, [0, 1, 0]);
}
function paperTex(seed, lines = 14, color = '#ece6d6') {
  return tex(256, 340, (g, w, h) => { const r = rng(seed); g.fillStyle = color; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(40,40,60,.55)'; for (let i = 0; i < lines; i++) g.fillRect(22, 30 + i * 21, 80 + r() * 130, 4); g.fillStyle = 'rgba(0,0,0,.06)'; g.fillRect(0, 0, w, 12); });
}
function drawNight(g, w, h) {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0a1222'); gr.addColorStop(1, '#1a2438'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const r = rng(77);
  for (let i = 0; i < 70; i++) g.fillStyle = 'rgba(255,255,255,.5)', g.fillRect(r() * w, r() * h * 0.5, 1.5, 1.5);
  for (let b = 0; b < 9; b++) { const bw = 40 + r() * 70, bh = h * (0.25 + r() * 0.4), x = b * (w / 9) + r() * 20; g.fillStyle = '#080c16'; g.fillRect(x, h - bh, bw, bh); for (let y = h - bh + 8; y < h - 6; y += 14) for (let xx = x + 6; xx < x + bw - 6; xx += 12) if (r() < 0.22) { g.fillStyle = r() < 0.5 ? '#f6d68a' : '#cfe3ff'; g.fillRect(xx, y, 6, 7); } }
  g.fillStyle = '#e9ecf2'; g.beginPath(); g.arc(w * 0.8, h * 0.18, 18, 0, TAU); g.fill();
}

/* ---------------------------------------------------------------- room */
let clockTex, clockT = 0, clockStop = false, tube;
const HH = 3.8;
function buildRoom() {
  /* light: cold night through the windows, a flickering fluorescent tube, a warm lamp at the front */
  scene.add(new THREE.HemisphereLight(0x9fb0c8, 0x140e08, 0.1));
  scene.add(new THREE.AmbientLight(0xffffff, 0.025));
  const moon = new THREE.DirectionalLight(0x8fb0e8, 0.28); moon.position.set(-9, 6, -1); moon.target.position.set(1, 0, 0); scene.add(moon, moon.target);
  const pl = (c, i, d, x, y, z) => { const l = new THREE.PointLight(c, i, d, 1); l.position.set(x, y, z); scene.add(l); return zl(1, l); };
  pl(0xdfe8ff, 0.42, 9, -2.5, 3.4, -1.5);
  tube = pl(0xdfe8ff, 0.4, 9, 2.5, 3.4, 1.5);
  pl(0xffc070, 0.85, 6, 1.7, 1.4, -4.1);
  pl(0xb8c8ff, 0.18, 7, 0, 3.2, 4.2);
  const redL = pl(0xff3020, 0.5, 3, -5.6, 2.9, 2.4); void redL;

  /* floor, walls, ceiling */
  mesh(new THREE.PlaneGeometry(12, 11), M(0xffffff, { map: tex(1024, 1024, drawFloor, [2, 2]), roughness: 0.82 }), 0, 0, 0).rotation.x = -Math.PI / 2;
  const wt = () => tex(1024, 512, drawWall, [1, 1]);
  const wall = (w, x, z, ry, rep) => { const t = wt(); t.wrapS = THREE.RepeatWrapping; t.repeat.set(rep, 1); const m = mesh(new THREE.PlaneGeometry(w, HH), M(0xffffff, { map: t, roughness: 0.95 }), x, HH / 2, z); m.rotation.y = ry; return m; };
  wall(12, 0, -5.5, 0, 2); wall(12, 0, 5.5, Math.PI, 2); wall(11, -6, 0, Math.PI / 2, 2); wall(11, 6, 0, -Math.PI / 2, 2);
  const ceilT = tex(512, 512, (g, w, h) => { g.fillStyle = '#9a978c'; g.fillRect(0, 0, w, h); const r = rng(3); for (let i = 0; i < 80; i++) { g.fillStyle = `rgba(60,50,40,${r() * 0.12})`; g.fillRect(r() * w, r() * h, 2 + r() * 40, 2 + r() * 40); } g.strokeStyle = '#6f6c62'; g.lineWidth = 4; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * w / 4, 0); g.lineTo(i * w / 4, h); g.stroke(); g.beginPath(); g.moveTo(0, i * h / 4); g.lineTo(w, i * h / 4); g.stroke(); } }, [3, 3]);
  mesh(new THREE.PlaneGeometry(12, 11), M(0xffffff, { map: ceilT, roughness: 1 }), 0, HH, 0).rotation.x = Math.PI / 2;
  /* fluorescent tubes */
  const tubeMat = Bm(0xcfd8e8), tubeMat2 = Bm(0xcfd8e8);
  for (const [x, z, m] of [[-2.5, -3, tubeMat], [2.5, -3, tubeMat], [-2.5, 0.5, tubeMat], [2.5, 0.5, tubeMat2], [-2.5, 3.6, tubeMat], [2.5, 3.6, tubeMat]]) {
    mesh(bx(0.22, 0.06, 1.5), M(0xd8d8d0), x, HH - 0.04, z);
    mesh(cy(0.03, 0.03, 1.4, 10), m, x, HH - 0.09, z).rotation.x = Math.PI / 2;
  }
  tickers.push((t) => { const on = Math.sin(t * 13) > -0.6 && !(Math.floor(t * 2.3) % 7 === 0 && Math.sin(t * 40) > 0); tubeMat2.color.setHex(on ? 0xcfd8e8 : 0x3a3e46); tube.intensity = on ? 0.4 : 0.05; });

  buildFront();
  buildLeft();
  buildRight();
  buildBack();
  buildDesks();
  buildDust(0xcfd8e8, 300, 11, 10);
}

function buildFront() {
  /* teacher's platform and blackboard */
  mesh(bx(8, 0.16, 1.9), M(0x6a4a2c, { roughness: 0.8 }), 0, 0.08, -4.55);
  mesh(bx(6.4, 1.75, 0.06), M(0x5a3a22, { roughness: 0.7 }), 0, 1.7, -5.46);
  const bm = plane(tex(1536, 420, drawBoard), 6.1, 1.6, true, { roughness: 0.95 }); bm.position.set(0, 1.7, -5.42); scene.add(bm);
  mesh(bx(6.2, 0.05, 0.12), M(0x6a4a2c), 0, 0.88, -5.38);
  for (let i = 0; i < 4; i++) mesh(bx(0.08, 0.02, 0.02), Bm(i % 2 ? 0xffe8a0 : 0xffffff), -2 + i * 0.25, 0.92, -5.36);
  /* flag above the board */
  const fl = framed(scene, tex(384, 256, drawFlag), 0.66, 0.44, 0, 3.08, -5.46, 0, 0x5a3a22); void fl;
  /* motto frame — b_motto */
  { const g = framed(scene, imgTex('assets/motto.webp'), 1.2, 0.8, -4.4, 2.15, -5.46, 0, 0x3a2416, 0.06);
    makeInteract(g, 'clue', 'b_motto', '타임고등학교 교훈', 0.75); }
  /* speaker */
  mesh(bx(0.5, 0.36, 0.22), M(0x8a8478), -4.6, 3.35, -5.36);
  mesh(new THREE.CircleGeometry(0.12, 20), M(0x2a2a2a), -4.6, 3.35, -5.245);

  /* teacher's desk with drawer — L1 */
  { const g = grp(0.2, 0.16, -4.25, 0);
    mesh(bx(1.3, 0.95, 0.65), M(0x7a5232, { roughness: 0.6 }), 0, 0.48, 0, g);
    mesh(bx(1.36, 0.05, 0.7), M(0x5e3e24, { roughness: 0.5 }), 0, 0.97, 0, g);
    mesh(bx(0.9, 0.22, 0.02), M(0x6a4428), 0, 0.72, 0.335, g);
    mesh(bx(0.18, 0.04, 0.03), M(0xc9c4b8, { metalness: 0.7, roughness: 0.3 }), 0, 0.72, 0.35, g);
    locks3d.L1 = padlock(g, 0.0, 0.6, 0.37, 0.9);
    const att = plane(paperTex(31, 10, '#f3efe4'), 0.3, 0.4, true); att.rotation.x = -Math.PI / 2; att.rotation.z = 0.2; att.position.set(-0.35, 1.0, 0.05); g.add(att);
    mesh(cy(0.04, 0.035, 0.1, 14), M(0xd8d0bc), 0.45, 1.05, -0.1, g);
    makeInteract(g, 'lock', 'L1', '교탁 서랍', 1.55);
    collide(0.2, -4.25, 1.4, 0.75); }

  /* broadcast amp on a side table — L4; the question sheet lands here */
  { const g = grp(1.9, 0.16, -4.35, 0);
    mesh(bx(0.8, 0.04, 0.55), M(0x6a4a2c), 0, 0.7, 0, g);
    [[-0.36, -0.24], [0.36, -0.24], [-0.36, 0.24], [0.36, 0.24]].forEach(([x, z]) => mesh(bx(0.04, 0.7, 0.04), M(0x4a3020), x, 0.35, z, g));
    const amp = mesh(bx(0.5, 0.18, 0.32), M(0x1c1c1e, { roughness: 0.4 }), -0.05, 0.81, -0.06, g);
    const lcd = tex(256, 64, (c, w, h) => { c.fillStyle = '#0e1a12'; c.fillRect(0, 0, w, h); c.fillStyle = '#8cf0a8'; c.font = '600 30px "IBM Plex Sans KR", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('ㄱ ㄴ ㄷ ㄹ', w / 2, h / 2 + 2); });
    const lm = plane(lcd, 0.22, 0.055, true, { emissive: 0x1a3a22, roughness: 0.4 }); lm.position.set(-0.1, 0.84, 0.101); g.add(lm);
    for (let i = 0; i < 3; i++) mesh(cy(0.022, 0.022, 0.02, 12), M(0xb8b8b8, { metalness: 0.8, roughness: 0.3 }), 0.08 + i * 0.06, 0.8, 0.105, g).rotation.x = Math.PI / 2;
    mesh(cy(0.012, 0.015, 0.22, 8), M(0x222222), 0.22, 0.98, -0.12, g);
    mesh(new THREE.SphereGeometry(0.035, 10, 8), M(0x333333), 0.22, 1.1, -0.12, g);
    /* desk lamp */
    mesh(cy(0.08, 0.09, 0.03, 16), M(0x2a2a2a), -0.3, 0.73, 0.15, g);
    mesh(cy(0.012, 0.012, 0.36, 8), M(0x2a2a2a), -0.3, 0.9, 0.15, g);
    mesh(cy(0.04, 0.11, 0.12, 16, true), M(0xd8c39a, { side: THREE.DoubleSide, emissive: 0x6a4a1a }), -0.3, 1.07, 0.15, g);
    const sheet = plane(tex(512, 680, (c, w, h) => { c.fillStyle = '#f6f2e8'; c.fillRect(0, 0, w, h); c.fillStyle = '#222'; c.font = '700 34px "IBM Plex Sans KR", sans-serif'; c.fillText('영어 듣기 문제지', 40, 70); c.font = '400 22px "IBM Plex Sans KR", sans-serif'; const L = ['1번 ...응답으로 가장 적절한 것을 고르시길.', '2번 ...남자의 응원으로 가장 적절한 것을', '9번 ...남자가 환불할 금액을 고르시오.', '15번 ...가장 친절한 것을 고르시오.']; L.forEach((s, i) => c.fillText(s, 40, 150 + i * 110)); }), 0.3, 0.4, true);
    sheet.rotation.x = -Math.PI / 2; sheet.rotation.z = -0.25; sheet.position.set(0.2, 0.725, 0.1); sheet.visible = false; g.add(sheet);
    props.L4 = { kind: 'fade', m: sheet, drop: -0.3 };
    makeInteract(g, 'lock', 'L4', '방송 앰프', 1.4);
    amp.userData.proxy = g;
    collide(1.9, -4.35, 0.9, 0.65); }

  /* clock (runs backwards), notice board for the letter, wall safe — L5 */
  clockTex = tex(256, 256, () => {}); drawClock();
  mesh(new THREE.CircleGeometry(0.3, 40), Bm(0xffffff, { map: clockTex }), 3.9, 3.05, -5.45);
  mesh(new THREE.TorusGeometry(0.31, 0.025, 10, 40), M(0x2a2a2a), 3.9, 3.05, -5.45);
  mesh(bx(1.0, 0.9, 0.04), M(0xa8784a, { roughness: 0.9 }), 3.9, 2.05, -5.47);
  { const lt = plane(imgTex('assets/letter.webp'), 0.52, 0.69, true, { roughness: 0.8 }); lt.position.set(3.9, 2.05, -5.44); lt.visible = false; scene.add(lt);
    props.L5 = { kind: 'fade', m: lt, drop: 0.25 };
    mesh(new THREE.SphereGeometry(0.02, 8, 6), M(0xcc2222), 3.9, 2.38, -5.43); }
  { const g = grp(3.9, 0, -5.2, 0);
    mesh(bx(0.7, 0.62, 0.05), M(0x4a4a48), 0, 0.31, -0.16, g);
    mesh(bx(0.56, 0.5, 0.42), M(0x5a5d60, { metalness: 0.6, roughness: 0.4 }), 0, 0.72, 0, g);
    mesh(bx(0.5, 0.44, 0.02), M(0x6a6e72, { metalness: 0.6, roughness: 0.35 }), 0, 0.72, 0.215, g);
    mesh(cy(0.06, 0.06, 0.03, 20), M(0xb8b8b8, { metalness: 0.8, roughness: 0.25 }), -0.1, 0.76, 0.23, g).rotation.x = Math.PI / 2;
    locks3d.L5 = padlock(g, 0.12, 0.66, 0.25, 0.75);
    makeInteract(g, 'lock', 'L5', '시계 아래 금고', 1.3);
    collide(3.9, -5.15, 0.7, 0.6); }

  /* intercom + CCTV — L6 */
  { const g = grp(5.2, 0, -5.44, 0);
    mesh(bx(0.42, 0.62, 0.06), M(0xd6d2c6, { roughness: 0.5 }), 0, 1.55, 0, g);
    const off = tex(256, 192, (c, w, h) => { c.fillStyle = '#05080a'; c.fillRect(0, 0, w, h); c.fillStyle = '#1a2228'; c.font = '600 22px "IBM Plex Mono", monospace'; c.textAlign = 'center'; c.fillText('- - -', w / 2, h / 2); });
    const on = tex(256, 192, (c, w, h) => { c.fillStyle = '#0d2a3a'; c.fillRect(0, 0, w, h); c.fillStyle = '#cfefff'; c.font = '600 20px "IBM Plex Sans KR", sans-serif'; c.textAlign = 'center'; c.fillText('몇 학년 몇 반?', w / 2, 70); c.fillText('교훈은?', w / 2, 110); c.fillStyle = '#5fd3ff'; c.fillRect(40, 140, w - 80, 4); });
    const sm = plane(off, 0.3, 0.225); sm.position.set(0, 1.66, 0.032); g.add(sm);
    props.L6 = { kind: 'screen', mat: sm.material, on };
    for (let i = 0; i < 6; i++) mesh(cy(0.018, 0.018, 0.012, 10), M(0x888888), -0.08 + (i % 3) * 0.08, 1.4 - Math.floor(i / 3) * 0.06, 0.035, g).rotation.x = Math.PI / 2;
    makeInteract(g, 'lock', 'L6', '교내 인터폰', 2.05); }
  { const g = grp(5.55, 3.3, -5.35, -0.6);
    mesh(bx(0.08, 0.08, 0.2), M(0xdedad0), 0, 0.05, 0.1, g);
    mesh(bx(0.16, 0.12, 0.3), M(0xeae6dc), 0, -0.05, 0.25, g);
    const led = mesh(new THREE.SphereGeometry(0.015, 8, 6), Bm(0xff2020), 0.05, -0.02, 0.405, g);
    tickers.push(t => led.material.color.setHex(Math.floor(t * 1.5) % 2 ? 0xff2020 : 0x300808)); }
}

function buildLeft() {
  /* two windows with night outside, curtains, and the radio on the sill — b_song */
  const night = tex(1024, 512, drawNight);
  for (const z of [-3.2, -0.2]) {
    const w = plane(night, 2.3, 1.55); w.position.set(-5.97, 1.85, z); w.rotation.y = Math.PI / 2; scene.add(w);
    const fr = M(0xd8d4c8, { roughness: 0.6 });
    mesh(bx(0.08, 1.7, 0.08), fr, -5.93, 1.85, z - 1.18); mesh(bx(0.08, 1.7, 0.08), fr, -5.93, 1.85, z + 1.18); mesh(bx(0.08, 1.7, 0.08), fr, -5.93, 1.85, z);
    mesh(bx(0.08, 0.08, 2.4), fr, -5.93, 2.66, z); mesh(bx(0.08, 0.08, 2.4), fr, -5.93, 1.04, z);
    mesh(bx(0.3, 0.05, 2.5), M(0xb8b4a8), -5.82, 1.0, z);
    const cm = M(0xd9d2b8, { roughness: 1, side: THREE.DoubleSide, transparent: true, opacity: 0.92 });
    for (const s of [-1, 1]) { const c = mesh(new THREE.PlaneGeometry(0.7, 1.9, 6, 1), cm, -5.85, 1.82, z + s * 0.9); c.rotation.y = Math.PI / 2; const p = c.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 14) * 0.04); c.geometry.computeVertexNormals(); }
    glow(1, 0x7fa0e0, 2.6, 1.8, -5.9, 1.85, z, Math.PI / 2, 0.18);
  }
  { const g = grp(-5.78, 1.03, -1.7, Math.PI / 2);
    mesh(bx(0.5, 0.26, 0.14), M(0xb8b0a0, { roughness: 0.5 }), 0, 0.13, 0, g);
    for (const x of [-0.15, 0.15]) { mesh(cy(0.07, 0.07, 0.01, 20), M(0x2a2a2a), x, 0.12, 0.072, g).rotation.x = Math.PI / 2; }
    mesh(bx(0.14, 0.06, 0.01), M(0x1a2a3a), 0, 0.2, 0.072, g);
    mesh(bx(0.42, 0.015, 0.02), M(0x999999, { metalness: 0.8 }), 0, 0.3, -0.02, g);
    makeInteract(g, 'clue', 'b_song', '카세트 라디오 · 노래', 0.65); }
  /* exit door at the back of the left wall */
  exitDoor({ x: -6, z: 3.8, ry: -Math.PI / 2, leaf: 0x6b4a2a, frame: 0x8f8a7e });
  mesh(new THREE.SphereGeometry(0.06, 10, 8), Bm(0xff2a1a), -5.94, 2.9, 2.5);
  glow(1, 0xff3020, 0.8, 0.8, -5.95, 2.9, 2.5, Math.PI / 2, 0.45);
}

function buildRight() {
  /* lockers with the seat chart board above — L2 */
  const lk = M(0x6f7f8a, { metalness: 0.45, roughness: 0.5 });
  for (let i = 0; i < 6; i++) {
    const z = 2.25 + i * 0.5;
    const g = grp(5.72, 0, z, -Math.PI / 2);
    mesh(bx(0.48, 1.5, 0.5), lk, 0, 0.75, 0, g);
    mesh(bx(0.42, 1.38, 0.02), M(0x7f8f9a, { metalness: 0.5, roughness: 0.45 }), 0, 0.77, 0.26, g);
    for (let k = 0; k < 4; k++) mesh(bx(0.24, 0.015, 0.01), M(0x40484e), 0, 1.3 - k * 0.05, 0.272, g);
    const tag = plane(tex(128, 48, (c, w, h) => { c.fillStyle = '#f2eee4'; c.fillRect(0, 0, w, h); c.fillStyle = '#333'; c.font = '600 26px "IBM Plex Mono", monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(19 + i), w / 2, h / 2 + 2); }), 0.12, 0.045, true); tag.position.set(0, 1.0, 0.275); g.add(tag);
    if (i === 2) { locks3d.L2 = padlock(g, 0.13, 0.8, 0.3, 0.8); makeInteract(g, 'lock', 'L2', '교실 뒤 사물함', 1.75); }
  }
  collide(5.72, 3.5, 0.55, 3.1);
  mesh(bx(0.04, 1.1, 1.6), M(0xa8784a, { roughness: 0.9 }), 5.97, 2.35, 3.5);
  { const ch = plane(imgTex('assets/seats.webp'), 1.45, 0.82, true, { roughness: 0.8 }); ch.position.set(5.94, 2.35, 3.5); ch.rotation.y = -Math.PI / 2; ch.visible = false; scene.add(ch);
    props.L2 = { kind: 'fade', m: ch, drop: 0.25 }; }
  /* decor from the base image: a 404 notice and a school-event sheet */
  { const t = tex(512, 400, (c, w, h) => { c.fillStyle = '#efeadc'; c.fillRect(0, 0, w, h); c.strokeStyle = '#c4bca8'; c.lineWidth = 10; c.strokeRect(10, 10, w - 20, h - 20); c.fillStyle = '#222'; c.textAlign = 'center'; c.font = '700 90px "IBM Plex Mono", monospace'; c.fillText('-404', w / 2, 170); c.font = '600 64px "IBM Plex Sans KR", sans-serif'; c.fillText('Not Found', w / 2, 270); });
    const m = plane(t, 1.0, 0.78, true); m.position.set(5.96, 2.45, -2.1); m.rotation.y = -Math.PI / 2; scene.add(m); }
  { const m = plane(paperTex(55, 12, '#e8e2cf'), 0.55, 0.72, true); m.position.set(5.96, 2.3, -0.6); m.rotation.y = -Math.PI / 2; scene.add(m); }
  /* trash can and broom */
  mesh(cy(0.2, 0.17, 0.5, 18), M(0x4a5a52), 5.5, 0.25, 0.9);
  const br = mesh(cy(0.015, 0.015, 1.4, 8), M(0x8a6a3a), 5.85, 0.7, 1.4); br.rotation.z = 0.15;
}

function buildBack() {
  /* bulletin board where the candidate posters appear, with the ballot box below — L3 */
  mesh(bx(3.4, 1.5, 0.05), M(0x9a6a3a, { roughness: 0.95 }), 2.0, 1.95, 5.46);
  mesh(bx(3.5, 1.6, 0.03), M(0x5a3a22), 2.0, 1.95, 5.48);
  const ttl = plane(tex(512, 96, (c, w, h) => { c.fillStyle = '#f4e9c8'; c.fillRect(0, 0, w, h); c.fillStyle = '#7a2a1a'; c.font = '700 54px Gaegu, cursive'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('우리 반 게시판', w / 2, h / 2 + 4); }), 0.9, 0.17, true);
  ttl.position.set(2.0, 2.82, 5.42); ttl.rotation.y = Math.PI; scene.add(ttl);
  { const ps = plane(imgTex('assets/posters.webp'), 1.95, 1.3, true, { roughness: 0.85 }); ps.position.set(2.0, 1.9, 5.43); ps.rotation.y = Math.PI; ps.visible = false; scene.add(ps);
    props.L3 = { kind: 'fade', m: ps, drop: 0.3 }; }
  { const g = grp(2.0, 0, 5.05, Math.PI);
    mesh(bx(0.9, 0.04, 0.55), M(0x6a4a2c), 0, 0.72, 0, g);
    [[-0.4, -0.22], [0.4, -0.22], [-0.4, 0.22], [0.4, 0.22]].forEach(([x, z]) => mesh(bx(0.04, 0.72, 0.04), M(0x4a3020), x, 0.36, z, g));
    mesh(bx(0.5, 0.42, 0.4), M(0xf0f0ea, { roughness: 0.6 }), 0, 0.95, 0, g);
    mesh(bx(0.2, 0.01, 0.03), M(0x222222), 0, 1.165, 0, g);
    const lb = plane(tex(256, 96, (c, w, h) => { c.fillStyle = '#f0f0ea'; c.fillRect(0, 0, w, h); c.fillStyle = '#1a3a7a'; c.font = '700 54px "IBM Plex Sans KR", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('투 표 함', w / 2, h / 2 + 2); }), 0.36, 0.13, true);
    lb.position.set(0, 1.04, 0.202); g.add(lb);
    /* direction lock: a small brass face with four arrows */
    const dl = plane(tex(128, 128, (c, w, h) => { c.fillStyle = '#c9a13a'; rrect(c, 4, 4, w - 8, h - 8, 18); c.fill(); c.fillStyle = '#2a1a0a'; c.font = '700 34px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('↑', 64, 30); c.fillText('↓', 64, 98); c.fillText('←', 30, 64); c.fillText('→', 98, 64); c.beginPath(); c.arc(64, 64, 10, 0, TAU); c.fill(); }), 0.14, 0.14, true, { metalness: 0.7, roughness: 0.35 });
    dl.position.set(0, 0.86, 0.203); g.add(dl);
    makeInteract(g, 'lock', 'L3', '반장 선거 투표함', 1.55);
    collide(2.0, 5.05, 1.0, 0.65); }
  /* theme poster */
  poster({ x: -3.6, z: 5.47, ry: Math.PI, y: 2.0, w: 1.25, h: 1.0 });
  /* cleaning roster sheet */
  { const m = plane(paperTex(71, 9, '#f0ead8'), 0.5, 0.66, true); m.position.set(-1.6, 2.1, 5.47); m.rotation.y = Math.PI; scene.add(m); }
}

function buildDesks() {
  const top = M(0x9a7550, { roughness: 0.6 }), leg = M(0x5a5a5e, { metalness: 0.5, roughness: 0.45 }), seat = M(0x8a6848, { roughness: 0.65 });
  const xs = [-3.6, -1.8, 0, 1.8, 3.6], zs = [-2.05, -0.3, 1.45, 3.2];
  const r = rng(21);
  const clueAt = { '1,0': 'b_exam', '3,1': 'b_timetable', '4,2': 'b_omr', '0,2': 'b_listen' };
  zs.forEach((z, j) => xs.forEach((x, i) => {
    const g = grp(x, 0, z, (r() - 0.5) * 0.12);
    mesh(bx(0.66, 0.035, 0.46), top, 0, 0.72, 0, g);
    mesh(bx(0.6, 0.12, 0.4), M(0x7a7a7e, { metalness: 0.4, roughness: 0.5 }), 0, 0.63, -0.01, g);
    [[-0.3, -0.2], [0.3, -0.2], [-0.3, 0.2], [0.3, 0.2]].forEach(([lx, lz]) => mesh(bx(0.03, 0.7, 0.03), leg, lx, 0.35, lz, g));
    const c = grp(0, 0, 0.36 + (r() - 0.5) * 0.06, (r() - 0.5) * 0.25, g);   /* chairs tucked in so the rows stay walkable */
    mesh(bx(0.4, 0.03, 0.38), seat, 0, 0.44, 0, c); mesh(bx(0.4, 0.32, 0.03), seat, 0, 0.66, 0.18, c);
    [[-0.17, -0.16], [0.17, -0.16], [-0.17, 0.16], [0.17, 0.16]].forEach(([lx, lz]) => mesh(bx(0.025, 0.44, 0.025), leg, lx, 0.22, lz, c));
    collide(x, z + 0.05, 0.7, 0.6);   /* desk only; aisles of ~1.1 m between columns and rows */
    const key = `${i},${j}`, cid = clueAt[key];
    if (cid === 'b_exam' || cid === 'b_timetable' || cid === 'b_omr') {
      const src = { b_exam: ['assets/exam.webp', 0.34, 0.42], b_timetable: ['assets/timetable.webp', 0.5, 0.2], b_omr: ['assets/omr.webp', 0.48, 0.37] }[cid];
      const p = plane(imgTex(src[0]), src[1], src[2], true, { roughness: 0.9 }); p.rotation.x = -Math.PI / 2; p.rotation.z = (r() - 0.5) * 0.4; p.position.set(0, 0.74, 0); g.add(p);
      makeInteract(g, 'clue', cid, CLUES[cid].title, 1.25);
    } else if (cid === 'b_listen') {
      mesh(bx(0.07, 0.015, 0.12), M(0x2a3a6a, { roughness: 0.4 }), 0.05, 0.745, 0.02, g);
      mesh(bx(0.05, 0.002, 0.04), Bm(0x8cd0ff), 0.05, 0.754, -0.015, g);
      const cord = new THREE.CatmullRomCurve3([V3(0.05, 0.75, 0.08), V3(-0.05, 0.745, 0.15), V3(-0.15, 0.745, 0.05), V3(-0.12, 0.745, -0.08)]);
      mesh(new THREE.TubeGeometry(cord, 20, 0.004, 5), M(0xf0f0f0), 0, 0, 0, g);
      for (const [ex, ez] of [[-0.12, -0.08], [-0.17, -0.04]]) mesh(new THREE.SphereGeometry(0.014, 10, 8), M(0xf4f4f4), ex, 0.752, ez, g);
      const p = plane(paperTex(41, 8), 0.24, 0.32, true); p.rotation.x = -Math.PI / 2; p.rotation.z = 0.3; p.position.set(-0.15, 0.739, -0.02); g.add(p);
      makeInteract(g, 'clue', 'b_listen', '영어듣기 MP3', 1.2);
    } else {
      /* scattered decor: papers, books, a phone */
      const k = r();
      if (k < 0.55) { const p = plane(paperTex(100 + i * 7 + j, 10 + (r() * 6 | 0)), 0.24, 0.32, true); p.rotation.x = -Math.PI / 2; p.rotation.z = (r() - 0.5) * 1.2; p.position.set((r() - 0.5) * 0.2, 0.739, (r() - 0.5) * 0.1); g.add(p); }
      if (k > 0.35 && k < 0.7) mesh(bx(0.17, 0.035, 0.24), M([0x7a2a2a, 0x2a4a7a, 0x3a6a3a][(r() * 3) | 0]), (r() - 0.5) * 0.3, 0.756, (r() - 0.5) * 0.15, g).rotation.y = r();
      if (k > 0.8) { mesh(bx(0.075, 0.01, 0.15), M(0x111111, { roughness: 0.3 }), 0.12, 0.743, 0.05, g).rotation.y = r(); }
    }
  }));
  /* the open book "서시" from the base image, on the front row */
  { const g = grp(0, 0, -2.05, 0.08);
    const bt = tex(512, 340, (c, w, h) => { c.fillStyle = '#efe7d2'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(w / 2 - 3, 0, 6, h); c.fillStyle = '#2a2018'; c.font = '700 26px "IBM Plex Sans KR", sans-serif'; c.textAlign = 'center'; c.fillText('서시', w * 0.75, 50); c.font = '400 15px "IBM Plex Sans KR", sans-serif'; ['죽는 날까지 하늘을 우러러', '한 점 부끄럼이 없기를,', '잎새에 이는 바람에도', '나는 괴로워했다.'].forEach((s, i) => c.fillText(s, w * 0.75, 110 + i * 34)); c.fillStyle = 'rgba(40,30,20,.5)'; for (let i = 0; i < 9; i++) c.fillRect(30, 40 + i * 30, 180, 3); });
    const p = plane(bt, 0.5, 0.33, true); p.rotation.x = -Math.PI / 2; p.position.set(0, 0.745, 0); g.add(p); }
}

function drawClock() {
  const { g } = clockTex.userData, w = 256, c = w / 2;
  g.clearRect(0, 0, w, w);
  g.fillStyle = '#1a1a1a'; g.beginPath(); g.arc(c, c, c, 0, TAU); g.fill();
  g.fillStyle = '#efeae0'; g.beginPath(); g.arc(c, c, c - 12, 0, TAU); g.fill();
  g.fillStyle = '#222'; g.font = '600 26px "IBM Plex Sans KR", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let i = 1; i <= 12; i++) { const a = i / 12 * TAU; g.fillText(String(i), c + Math.sin(a) * (c - 36), c - Math.cos(a) * (c - 36)); }
  /* the clock "confuses yesterday and tomorrow": it runs backwards */
  const m = 60 - (clockT * 6) % 60, h = 12 - (clockT * 0.5) % 12;
  const hand = (a, len, wd) => { g.strokeStyle = '#1a1a1a'; g.lineWidth = wd; g.lineCap = 'round'; g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.sin(a) * len, c - Math.cos(a) * len); g.stroke(); };
  hand(h / 12 * TAU, 50, 8); hand(m / 60 * TAU, 80, 5);
  g.fillStyle = '#c2401c'; g.beginPath(); g.arc(c, c, 6, 0, TAU); g.fill();
  clockTex.needsUpdate = true;
}

/* ---------------------------------------------------------------- story scenes (pixel art) */
function makeScenes() {
  const pixG = api.pixG;
  function classroom(t, mood = 'night') {
    const day = mood === 'day', sun = mood === 'sunset';
    P(sun ? '#c98a5a' : day ? '#cdb991' : '#3a4048', 0, 0, PW, 72); P(sun ? '#6a3d26' : day ? '#7a5236' : '#2a2018', 0, 72, PW, 36);
    for (let x = 0; x < PW; x += 16) P(day || sun ? '#6a4630' : '#20180f', x, 72, 1, 36);
    P('#4a3020', 0, 70, PW, 2);
    P('#4a3422', 34, 10, 96, 40); P(sun ? '#24382c' : '#1f3d2e', 37, 13, 90, 34); P('#6a5a40', 34, 50, 96, 2);
    P('#7a8aa0', 150, 12, 34, 38); P(sun ? '#ff9a50' : day ? '#8fc6ee' : '#0e1a30', 152, 14, 30, 34); P('#c8c4b4', 166, 12, 2, 38); P('#c8c4b4', 150, 30, 34, 2);
    if (!day && !sun) { P('#e8ecf2', 172, 18, 4, 4); }
    P('#f4ead6', 10, 14, 14, 14); P('#2a1a12', 16, 16, 1, 6); P('#2a1a12', 16, 21, 4, 1);
  }
  function desks(t, o = {}) {
    const rows = [[24, 76], [70, 76], [116, 76], [10, 92], [58, 92], [106, 92], [154, 92]];
    rows.forEach(([x, y], i) => {
      if (o.kids) kid(x + 6, y - 8, ['#1f3a6a', '#1f3a6a', '#2a2a3a'][i % 3], '#1a120c', t, { back: true, bob: true });
      P('#8a5a30', x, y + 2, 22, 3); P('#5a3a1e', x + 2, y + 5, 2, 8); P('#5a3a1e', x + 18, y + 5, 2, 8);
      if (o.papers) { const n = Math.min(6, Math.floor(t * 3 + i)); for (let k = 0; k < n; k++) P(k % 2 ? '#f4f0e4' : '#e4e0d4', x + 3 + k % 3, y + 1 - k, 14, 1); }
    });
  }
  return {
    hall(t) {
      P('#2a2e36', 0, 0, PW, PH); P('#3a3e46', 0, 70, PW, 38);
      for (let x = 0; x < PW; x += 24) P('#32363e', x, 70, 1, 38);
      P('#4a3a2a', 60, 18, 72, 54); P('#6a5a44', 64, 22, 30, 46); P('#6a5a44', 98, 22, 30, 46); P('#9ab0c8', 68, 26, 22, 18); P('#9ab0c8', 102, 26, 22, 18);
      P('#e8e4d8', 78, 8, 36, 9); ptext('3-4', 96, 13, '#2a2a2a', 7);
      const f = Math.sin(t * 20) > 0.3 ? '#e8f0ff' : '#5a5e66'; P(f, 40, 2, 30, 2); P('#e8f0ff', 122, 2, 30, 2);
      kid(92, 76 - Math.min(6, t * 2), '#1f3a6a', '#1a120c', t, { back: true });
    },
    study(t) {
      classroom(t, 'day');
      const n = Math.min(14, Math.floor(t * 4)); for (let i = 0; i < n; i++) P('#e8e8e0', 42 + i * 6, 22 + (i % 3) * 7, 4, 1);
      ptext('시키는 대로', 82, 40, '#d8e8d0', 7);
      desks(t, { kids: true });
      kid(86, 58, '#1f3a6a', '#1a120c', t, { smile: true }); P('#ffd36b', 84, 54, 12, 3); ptext('반장', 90, 50, '#ffd36b', 6);
    },
    pressure(t) {
      classroom(t, 'night'); desks(t, { papers: true });
      const words = ['내신', '생기부', '수능', '대학'];
      words.forEach((w, i) => { if (t > i * 0.6) ptext(w, 50 + i * 30, 26 + (i % 2) * 10, ['#ffd36b', '#ff9a6a', '#ff6b6b', '#ffffff'][i], 8); });
      const a = -t * 5; P('#c2401c', 16 + Math.round(Math.cos(a) * 5), 21 + Math.round(Math.sin(a) * 5));
    },
    door(t) {
      classroom(t, 'night'); desks(t);
      P('#5a3a20', 0, 30, 18, 42); P('#3a2412', 2, 32, 14, 40);
      const lit = Math.min(6, Math.floor(t * 1.6)); for (let i = 0; i < 6; i++) P(i < lit ? '#ff5a4a' : '#5a1a14', 1 + i * 3, 26, 2, 2);
      P('#ffd36b', 7, 50, 5, 4); P('#ffd36b', 8, 47, 1, 3); P('#ffd36b', 10, 47, 1, 3); P('#ffd36b', 8, 46, 3, 1);
      kid(92, 82 - Math.min(8, t * 2), '#1f3a6a', '#1a120c', t, { back: true });
    },
    bell(t) { classroom(t, 'sunset'); desks(t); for (let i = 0; i < 12; i++) { const x = (i * 37 + t * 6) % PW, y = 20 + ((i * 53) % 50) + Math.sin(t + i) * 2; P('rgba(255,230,160,.7)', x, y); } ptext('딩동댕', 82, 30, Math.floor(t * 3) % 2 ? '#ffd36b' : '#c9a040', 9); },
    gate(t) {
      const gr = pixG.createLinearGradient(0, 0, 0, PH); gr.addColorStop(0, '#ff9a5a'); gr.addColorStop(1, '#6a3a4a'); pixG.fillStyle = gr; pixG.fillRect(0, 0, PW, PH);
      P('#3a2a2a', 0, 74, PW, 34); P('#5a4a44', 20, 30, 10, 44); P('#5a4a44', 162, 30, 10, 44); P('#5a4a44', 20, 26, 152, 6);
      ptext('타임고등학교', 96, 29, '#f4e8c8', 7);
      kid(92 - Math.min(40, t * 10), 62, '#1f3a6a', '#1a120c', t, { back: false, smile: true });
    },
    sky(t) {
      const gr = pixG.createLinearGradient(0, 0, 0, PH); gr.addColorStop(0, '#3a5a9a'); gr.addColorStop(1, '#ffb070'); pixG.fillStyle = gr; pixG.fillRect(0, 0, PW, PH);
      P('#2a2030', 0, 84, PW, 24);
      for (let i = 0; i < 5; i++) { const x = (i * 47 + t * 18) % (PW + 20) - 10, y = 20 + (i * 13) % 30; P('#ffffff', x, y, 6, 2); P('#ffffff', x + 2, y - 1, 2, 1); }
      kid(92, 72, '#1f3a6a', '#1a120c', t, { armsUp: true, smile: true });
    },
  };
}

BackStage.run({
  id: 'w1', week: 1, title: 'CLASSROOM', titleHTML: 'CLASS<em>ROOM</em>', tag: '타임고등학교 3학년 4반', docTitle: 'Classroom',
  poster: 'assets/poster.webp', posterAlt: '불 꺼진 3학년 4반 교실. 칠판, 교탁, 단서가 놓인 책상들',
  intro: ['여긴 참 오랜만이네. 내가 졸업했던 타임고등학교 3학년 4반 교실. 그때의 나는 반장도 했고 공부도 하란대로 잘했던 모범생이었다.',
    '어른들이 시키는 대로 내신 관리하고 생기부 챙기고 수능 공부했지. 근데 지금 생각해 보면 우리 학교, 참 유난스럽고 숨 막히는 곳이긴 했다. 그땐 적당히 명문대만 가면, 알아서 내 세상이 열릴 줄 알았는데 말이야.'],
  fonts: ['700 32px Gaegu'],
  fontSample: '당번표 월화수목금 김민수 이서연 박지훈 최유진 정현우 오늘의 명언 너 자신을 알라 D-100 수능까지 우리 반 게시판 투 표 함 영어 듣기 문제지 몇 학년 몇 반 교훈은 서시 죽는 날까지 하늘을 우러러 한 점 부끄럼이 없기를 잎새에 이는 바람에도 나는 괴로워했다 Not Found ㄱㄴㄷㄹ',
  sky: 0x06080a, fog: [8, 20], exposure: 0.95,
  player: { x: -0.8, z: 4.35, yaw: 0.0, pitch: -0.05 },
  bounds: [-5.65, 5.65, -5.15, 5.15],
  locks: LOCKS, clues: CLUES, related: RELATED, captions: CAPTIONS,
  cut: {
    L2: { at: [5.9, 2.35, 3.5], view: [3.5, 2.1, 3.5], color: 0xffe9b0 },
    L3: { at: [2.0, 1.9, 5.4], view: [2.0, 2.0, 3.4], color: 0xffd36b },
    L4: { at: [2.1, 0.92, -4.25], view: [1.9, 1.95, -2.7], color: 0x8cd0ff },
    L5: { at: [3.9, 2.05, -5.4], view: [3.9, 1.95, -3.4], color: 0xffe9b0 },
    L6: { at: [5.2, 1.66, -5.4], view: [4.5, 1.75, -3.7], color: 0x5fd3ff },
  },
  focus: {
    L1: [[0.2, 3.6, -2.6], [0.2, 0.8, -4.2]], L2: [[4.0, 3.6, 3.5], [5.6, 1.4, 3.5]], L3: [[2.0, 3.6, 3.6], [2.0, 1.1, 5.1]],
    L4: [[1.9, 3.6, -2.9], [1.9, 0.8, -4.35]], L5: [[3.9, 3.6, -3.6], [3.9, 1.3, -5.3]], L6: [[4.9, 3.6, -3.9], [5.2, 1.3, -5.3]],
    start: [[0, 3.6, 1.2], [0, 0.7, -0.6]],
  },
  focusIntensity: 0.8,
  prologue: [
    { scene: 'hall', text: '졸업한 타임고등학교. 3학년 4반 교실 앞에 다시 섰다.' },
    { scene: 'study', text: '그때의 나는 반장이었고, 시키는 대로 공부하던 모범생이었다.' },
    { scene: 'pressure', text: '내신, 생기부, 수능. 대학만 가면 된다는 말에 숨 막히던 교실.' },
    { scene: 'door', text: '등 뒤에서 문이 잠겼다. 자물쇠 여섯 개를 풀고 이 교실을 나가자.' },
  ],
  epilogue: [
    { scene: 'bell', text: '마지막 자물쇠가 풀리자, 종례를 알리는 종이 울렸다.' },
    { scene: 'gate', text: '교문을 나서며 돌아보니, 그 시절의 나는 꽤 애썼다.' },
    { scene: 'sky', text: '명문대가 세상을 열어 주진 않았다. 그래도 다음 문은, 내가 연다.' },
  ],
  scenes: makeScenes,
  exitCaption: '뒷문이 열렸다. 복도 끝에서 저녁 햇살이 들어온다.',
  finalGoal: '뒷문이 풀렸습니다. 교실 뒤쪽 출구로 나가세요.',
  build() { buildRoom(); },
  animate(t, dt) { if (clockStop) return; clockT += dt; if (Math.floor(clockT * 4) !== Math.floor((clockT - dt) * 4)) drawClock(); },
  onSolved(L) { if (L.id === 'L5') clockStop = true; },
});
})();
