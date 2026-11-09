/* TIME CASINO (6주차): theme data and room for the Back Stage engine. */
(() => {
'use strict';
const api = BackStage.api;
const { THREE, scene, TAU, AZ, M, Bm, bx, cy, mesh, grp, collide, rng, tex, plane, rrect, glowText, drawCard, glow, buildDust, bulbRow, rectBulbs,
  zl, zm, zg, V3, props, locks3d, spinners, tickers, brass, padlock, keypadTex, makeInteract, exitDoor, poster, tween, ease, P, ptext, kid, SKIN, PW, PH } = api;
const esc = api.esc;
const SURVIVE = [1, 3, 4, 6, 9, 11, 13, 15];
const LOCKS = [
  { id: 'L1', no: 1, name: '경품 뽑기 기계', type: '숫자 4자리', mech: 'dial', set: '0123456789', len: 4, hash: '1nt82kc', related: 'note',
    hints: ['게임룸 칠판의 「게임 기록」과 짝입니다.', '5는 보, 0은 묵, 2는 찌. 가위바위보에서 이긴 쪽이 공격하고, 공격자가 상대와 같은 손을 내면 이깁니다. 빈칸 * ~ ****에 들어갈 손을 숫자로 적으세요.'] },
  { id: 'L2', no: 2, name: '16릴 슬롯머신', type: '대문자 8자리', mech: 'dial', set: AZ, len: 8, hash: '6miq0n', related: 'slot',
    hints: ['진열장 속 「러시안룰렛」 기록과 짝입니다.', '16글자를 1~16번에 하나씩 대응시키고, 찰칵(생존)한 번호의 글자만 남기세요.'] },
  { id: 'L3', no: 3, name: '블랙잭 테이블 칩 트레이', type: '대문자 5자리', mech: 'dial', set: AZ, len: 5, hash: 'vuqqz0', related: 'cards',
    hints: ['벽에 걸린 「교집합」 그림과 짝입니다.', '두 플레이어가 모두 가진 카드만 고르고, 순서표의 순번(A=1 … K=13)을 알파벳 순번으로 바꾸세요.'] },
  { id: 'L4', no: 4, name: '룰렛 테이블 칩 보관함', type: '대문자 4자리', mech: 'dial', set: AZ, len: 4, hash: '14tsp8e', related: 'calli',
    hints: ['게임룸 문구판의 「알 수 없는 문구」와 짝입니다.', '하늘과 땅이 뒤바뀐다는 건 위아래로 뒤집는다는 뜻. 뒤집어도 모양이 그대로인 글자만 남기세요.'] },
  { id: 'L5', no: 5, name: '홀덤 테이블 금고', type: '숫자 키패드', mech: 'keypad', set: '0123456789', hash: 'wmceji', related: 'holdem',
    hints: ['출구 옆 「인디언 홀덤 규칙」 명판과 짝입니다.', '가려진 공유 카드에 1~10을 하나씩 넣어 보세요. 내가 이길 수 있는 내 카드가 딱 1개인 경우와 딱 2개인 경우가 하나씩 나옵니다.'] },
  { id: 'L6', no: 6, name: '1등 경품 진열장', type: '대문자 키패드', mech: 'keypad', set: AZ, hash: '34q76d', related: null,
    hints: ['연관 단서 없이 방 안 단서 하나로 풀립니다. 칵테일 테이블의 「질문지」를 보세요.', '단어를 소리 내어 읽어 보세요. Are는 R처럼 들립니다.'] },
];
const CAPTIONS = {
  L1: ['집게가 저절로 움직이더니 캡슐 하나를 떨어뜨렸다.', '캡슐에서 튀어 나간 불빛에, 멈춰 있던 릴이 깨어났다.'],
  L2: ['잭팟! 동전이 와르르 쏟아진다.', '아무도 없는 테이블에, 누군가 카드를 돌려 놓았다.'],
  L3: ['칩 트레이가 열리자 하얀 룰렛 공이 튀어 올랐다.', '보관함 위로 액자 하나가 솟아올랐다.'],
  L4: ['보관함 뚜껑이 열리고, 칩 사이에서 빛이 새어 나온다.', '꺼져 있던 화면에 판이 깔렸다.'],
  L5: ['묵직한 금고 문이 열렸다.', '진열장 속 루비가 붉게 깨어났다.'],
  L6: ['진열장이 열리고, 루비를 손에 쥐었다.', '출구 위 램프 여섯 개가 모두 초록으로 바뀌었다.'],
};
const card = (r, cls = '') => `<span class="pc ${cls}">${r}</span>`;
const seq = arr => arr.map(r => card(r)).join('<span class="arrow">→</span>');

const GAMES = [
  ['Game 1', ['A:5 vs B:0', 'A:5 vs B:0', 'A:5 vs B:2'], 'Nobody win'],
  ['Game 2', ['A:5 vs B:0', 'A:0 vs B:0'], 'A win'],
  ['Game 3', ['A:2 vs B:0', 'A:<span class="blank">[*]</span> vs B:2', 'A:2 vs B:<span class="blank">[**]</span>'], 'B win'],
  ['Game 4', ['A:2 vs B:5', 'A:5 vs B:<span class="blank">[***]</span>', 'A:<span class="blank">[****]</span> vs B:0'], 'B win'],
];

const CLUES = {
  b_record: { title: '게임 기록', where: '게임룸 · 칠판', html: () => `
    <div class="chalk"><h3>게임 기록</h3><div class="rows">${GAMES.map(([g, steps, r]) =>
      `<div class="row"><span class="g">${g}.</span>${steps.map(s => `<span class="st">${s}</span>`).join('<span>→</span>')}<span>→</span><span class="res">${r}</span></div>`).join('')}</div></div>` },
  b_roulette: { title: '러시안룰렛', where: '카지노 · 유리 진열장', html: () => `
    <div class="roul">${Array.from({ length: 16 }, (_, i) => { const n = i + 1, live = SURVIVE.includes(n);
      return `<div class="c ${live ? 'live' : 'dead'}"><span class="n">${n}번</span><span class="dot"></span><span class="t">${live ? '찰칵' : '탕!'}</span></div>`; }).join('')}</div>
    <div class="meta">찰칵은 빈 약실(생존), 탕!은 격발(사망)입니다.</div>` },
  b_venn: { title: '교집합', where: '카지노 · 오른쪽 벽 액자', html: () => `
    <div class="venn"><svg viewBox="0 0 360 240" role="img" aria-label="원 1과 원 2가 겹친 부분만 칠해진 벤 다이어그램">
      <defs><clipPath id="vc1"><circle cx="140" cy="120" r="90"/></clipPath></defs>
      <circle cx="220" cy="120" r="90" fill="#7b1e1e" clip-path="url(#vc1)"/>
      <circle cx="140" cy="120" r="90" fill="none" stroke="#2b1e16" stroke-width="3"/>
      <circle cx="220" cy="120" r="90" fill="none" stroke="#2b1e16" stroke-width="3"/>
      <text x="82" y="126" font-family="IBM Plex Mono, monospace" font-size="20" fill="#2b1e16">1</text>
      <text x="268" y="126" font-family="IBM Plex Mono, monospace" font-size="20" fill="#2b1e16">2</text></svg></div>` },
  b_phrase: { title: '알 수 없는 문구', where: '게임룸 · 앞쪽 벽 문구판', html: () => `
    <div class="board"><span class="ttl">오늘의 문구</span><div class="letters">${'MDSINCRE'.split('').map(c => `<span>${c}</span>`).join('')}</div></div>` },
  b_rules: { title: '인디언 홀덤 규칙', where: '카지노 · 출구 옆 명판', html: () => `
    <div class="paper rules"><h3>Indian Hold'em</h3><ol>
      <li><span>①</span><span>카드는 1~10이 4세트, 총 40장. 공유 카드 2장과 개인 카드 1장을 받는다. 자기 카드는 볼 수 없고 상대 카드만 볼 수 있다.</span></li>
      <li><span>②</span><span>행동은 콜 · 레이즈 · 폴드 세 가지.</span></li>
      <li><span>③</span><span>족보: 트리플 &gt; 스트레이트(1과 10도 이어진다) &gt; 더블 &gt; 높은 숫자. 같은 족보면 자기 카드가 높은 쪽이 이긴다.</span></li>
      <li><span>④</span><span>승자가 팟을 모두 가져간다. 폴드하면 상대가 즉시 이긴다.</span></li>
      <li><span>⑤</span><span>스트레이트·트리플을 들고 폴드하면 칩 10개, 더블이면 칩 5개를 추가로 지급한다.</span></li>
    </ol></div>` },
  b_quiz: { title: '질문지', where: '게임룸 · 칵테일 테이블', html: () => `
    <div class="paper quiz"><h3>질문지</h3>1. Are<br>2. You<br>3. Be<br>4. Why</div>` },
};

const RELATED = {
  note: { title: '포스트잇', html: () => `<div class="note">* → ** → *** → **** 순대로 작성하시오.</div>` },
  slot: { title: '슬롯 화면', html: () => `<div class="led">${'SXURMVQBICVDOERT'.split('').map(c => `<span>${c}</span>`).join('')}</div>` },
  cards: { title: '테이블 위 카드', html: () => `
    <div class="cards">
      <div class="hand"><span class="who">PLAYER 1</span><div class="row">${seq(['2', 'Q', '6', 'A', '7', '3', 'K', 'J'])}</div></div>
      <div class="hand"><span class="who">PLAYER 2</span><div class="row">${seq(['2', '4', 'Q', '9', 'A', '3', 'J', '5'])}</div></div>
      <div class="order">순서표 · A → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → J → Q → K</div>
    </div>` },
  calli: { title: '캘리그라피 액자', html: () => `<div class="calli">하늘과 땅이 뒤바뀌어도<br>본질은 변하지 않는다.</div>` },
  holdem: { title: '홀덤 게임 화면', html: () => `
    <div class="holdem">
      <div class="tbl">
        <span class="lbl">PLAYER 2 · 상대</span>${card('3', 'bigc')}
        <span class="lbl">공유 카드</span><div style="display:flex;gap:8px">${card('5', 'bigc')}${card('?', 'bigc back')}</div>
        <span class="lbl">PLAYER 1 · 나 (볼 수 없음)</span>${card('?', 'bigc back')}
      </div>
      <div class="side"><div><span>BLIND</span><b>1</b></div><div><span>POT</span><b>8</b></div><div><span>CALL</span><b>4</b></div><div><span>P1 칩</span><b>4</b></div><div><span>P2 칩</span><b>4</b></div>
        <div class="acts"><span>CALL</span><span>RAISE</span><span class="fold">FOLD</span></div></div>
    </div>
    <div class="qtext">PLAYER 1(나)은 이번 판을 <b>폴드</b>했다. 가려진 공유 카드가 무엇이냐에 따라, 내가 이길 수 있는 내 카드가 <b>1개뿐인 경우(Case 1)</b>와 <b>2개뿐인 경우(Case 2)</b>가 있다고 봤기 때문이다.<br>
    각 경우를 <b>내 카드 → 가려진 공유 카드</b> 순으로 적고, Case 1 → Case 2 순으로 이어 쓰시오. Case 2는 두 수의 합이 큰 조합부터 쓴다.</div>` },
};

/* ---------------------------------------------------------------- room */
let clockTex, jewelLight;
const moles = [];
function drawSky(g, w, h, seed) {
  const r = rng(seed);
  const grd = g.createLinearGradient(0, 0, 0, h * 0.72); grd.addColorStop(0, '#3f93dc'); grd.addColorStop(1, '#a9d8f6');
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
  for (let i = 0; i < w / 120; i++) {
    const cx = r() * w, cyy = h * (0.12 + r() * 0.45), s = 30 + r() * 40;
    g.fillStyle = 'rgba(255,255,255,.92)';
    for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(cx + (k - 2) * s * 0.7, cyy + Math.sin(k * 1.7) * s * 0.18, s * (0.7 + r() * 0.4), s * 0.5, 0, 0, TAU); g.fill(); }
  }
  g.fillStyle = '#2f6db0'; g.fillRect(0, h * 0.72, w, h * 0.28);
  g.fillStyle = '#e8b64c'; g.fillRect(0, h * 0.72, w, 8);
  g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 4;
  for (let x = 40; x < w; x += 180) { g.strokeRect(x, h * 0.76, 140, h * 0.19); }
}
function drawWood(g, w, h) {
  g.fillStyle = '#331a12'; g.fillRect(0, 0, w, h);
  const r = rng(7);
  for (let i = 0; i < 140; i++) { g.strokeStyle = `rgba(${90 + r() * 40},${45 + r() * 20},${25},${0.18 + r() * 0.2})`; g.lineWidth = 1 + r() * 2; const x = r() * w; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 6, h * 0.3, x - 6, h * 0.6, x + 3, h); g.stroke(); }
  g.strokeStyle = '#1c0d08'; g.lineWidth = 10; g.strokeRect(28, 30, w - 56, h * 0.58);
  g.strokeStyle = 'rgba(232,182,76,.35)'; g.lineWidth = 2; g.strokeRect(40, 42, w - 80, h * 0.58 - 24);
  g.fillStyle = '#24110b'; g.fillRect(0, h * 0.7, w, h * 0.3);
  g.fillStyle = '#b8862f'; g.fillRect(0, h * 0.695, w, 6);
  g.strokeStyle = '#140805'; g.lineWidth = 6; g.strokeRect(30, h * 0.74, w - 60, h * 0.22);
}
function drawTiles(g, w, h) {
  const r = rng(3), n = 4, s = w / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const v = 228 + r() * 14; g.fillStyle = `rgb(${v},${v - 14},${v - 40})`; g.fillRect(i * s, j * s, s, s); }
  g.strokeStyle = '#bfa77f'; g.lineWidth = 6; for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, h); g.stroke(); g.beginPath(); g.moveTo(0, i * s); g.lineTo(w, i * s); g.stroke(); }
}
function drawCarpet(g, w, h) {
  g.fillStyle = '#5b0f15'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(200,146,52,.45)'; g.lineWidth = 3; const s = 128;
  for (let x = -w; x < w * 2; x += s) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + h, h); g.stroke(); g.beginPath(); g.moveTo(x, h); g.lineTo(x + h, 0); g.stroke(); }
  g.fillStyle = 'rgba(232,182,76,.55)';
  for (let x = 0; x <= w; x += s) for (let y = 0; y <= h; y += s) { g.beginPath(); g.arc(x, y, 7, 0, TAU); g.fill(); g.beginPath(); g.arc(x + s / 2, y + s / 2, 4, 0, TAU); g.fill(); }
}

function buildRoom() {

  /* light */
  scene.add(new THREE.HemisphereLight(0xffe9cc, 0x2a120c, 0.2));
  scene.add(new THREE.AmbientLight(0xffffff, 0.05));
  const pl = (n, c, i, d, x, y, z) => { const l = new THREE.PointLight(c, i, d, 1); l.position.set(x, y, z); scene.add(l); return zl(n, l); };
  pl(1, 0xfff3e0, 1.2, 20, -6, 5.2, -3);
  pl(1, 0xfff3e0, 0.95, 16, -6, 5.0, 5);
  pl(1, 0x7fc4ff, 0.55, 8, -6.5, 4.2, -7.6);
  pl(2, 0xffb070, 0.95, 18, 6, 5.0, -3);
  pl(2, 0xff6a3a, 1.0, 9, 6.3, 4.2, -7.6);
  pl(3, 0xffd6a0, 0.9, 7, 8.6, 3.4, -1.0);
  pl(5, 0xffb070, 0.8, 12, 7, 4.8, 5);
  pl(5, 0xffd6a0, 0.6, 5, 6.6, 3.0, 7.4);
  jewelLight = new THREE.PointLight(0xff3050, 0, 5, 1); jewelLight.position.set(-10.2, 2.4, 3.6); scene.add(jewelLight);
  const spot = new THREE.SpotLight(0xffe2b0, 1.4, 12, 0.55, 0.5, 1); spot.position.set(2.2, 5.6, 1.6); spot.target.position.set(2.2, 0.9, 1.6); scene.add(spot, spot.target); zl(4, spot);


  /* floor */
  const tileT = tex(512, 512, drawTiles, [6, 9]);
  mesh(new THREE.PlaneGeometry(12, 18), M(0xffffff, { map: tileT, roughness: 0.5 }), -6, 0, 0).rotation.x = -Math.PI / 2;
  const carpetT = tex(512, 512, drawCarpet, [4, 6]);
  mesh(new THREE.PlaneGeometry(12, 18), M(0xffffff, { map: carpetT, roughness: 0.95 }), 6, 0, 0).rotation.x = -Math.PI / 2;
  mesh(bx(0.12, 0.02, 18), M(0xc9a13a, { metalness: 0.7, roughness: 0.35 }), 0, 0.01, 0);

  /* walls */
  const skyBack = tex(1536, 768, (g, w, h) => drawSky(g, w, h, 11));
  const skyLeft = tex(2304, 768, (g, w, h) => drawSky(g, w, h, 21));
  const skyFront = tex(1536, 768, (g, w, h) => drawSky(g, w, h, 31));
  const woodT = () => tex(512, 768, drawWood, [1, 1]);
  const wall = (t, w, x, z, ry, rep) => { if (rep) { t.wrapS = THREE.RepeatWrapping; t.repeat.set(rep, 1); } const m = mesh(new THREE.PlaneGeometry(w, 6), M(0xffffff, { map: t, roughness: 0.9 }), x, 3, z); m.rotation.y = ry; return m; };
  wall(skyBack, 12, -6, -9, 0);
  wall(woodT(), 12, 6, -9, 0, 5);
  wall(skyLeft, 18, -12, 0, Math.PI / 2);
  wall(woodT(), 18, 12, 0, -Math.PI / 2, 7);
  wall(skyFront, 12, -6, 9, Math.PI);
  wall(woodT(), 12, 6, 9, Math.PI, 5);
  const ceil = mesh(new THREE.PlaneGeometry(24, 18), M(0x1d120e, { roughness: 1 }), 0, 6, 0); ceil.rotation.x = Math.PI / 2;
  const trim = M(0x8a5a22, { metalness: 0.5, roughness: 0.4 });
  mesh(bx(24, 0.18, 0.2), trim, 0, 5.9, -8.9); mesh(bx(24, 0.18, 0.2), trim, 0, 5.9, 8.9);
  mesh(bx(0.2, 0.18, 18), trim, -11.9, 5.9, 0); mesh(bx(0.2, 0.18, 18), trim, 11.9, 5.9, 0);
  const downL = Bm(0xfff1d0), downR = zm(2, Bm(0xfff1d0));
  for (let x = -10; x <= 10; x += 4) for (let z = -7; z <= 7; z += 3.5) { const d = mesh(new THREE.CircleGeometry(0.11, 18), x < 0 ? downL : downR, x, 5.985, z); d.rotation.x = Math.PI / 2; }

  buildSigns();
  buildGameRoom();
  buildCasino();
  buildFrontWall();
  buildDust();

}

function buildSigns() {
  /* GAME ROOM marquee */
  const gr = tex(1024, 420, (g, w, h) => {
    g.fillStyle = '#e8692c'; rrect(g, 0, 0, w, h, 90); g.fill();
    g.fillStyle = '#f3c74a'; rrect(g, 26, 26, w - 52, h - 52, 72); g.fill();
    const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#4a9be0'); sky.addColorStop(1, '#a9d8f6');
    g.fillStyle = sky; rrect(g, 46, 46, w - 92, h - 92, 60); g.fill();
    g.fillStyle = 'rgba(255,255,255,.9)'; [[200, 120], [760, 110], [520, 330], [880, 300]].forEach(([x, y]) => { for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(x + k * 34 - 50, y, 40, 26, 0, 0, TAU); g.fill(); } });
    g.font = '150px Bungee, "Arial Black", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 18; g.strokeStyle = '#ffffff'; g.strokeText('GAME ROOM', w / 2, h / 2 + 10);
    g.fillStyle = '#e8692c'; g.fillText('GAME ROOM', w / 2, h / 2 + 10);
  });
  const grm = plane(gr, 6.2, 2.55); grm.position.set(-6.4, 4.45, -8.94); scene.add(grm);
  bulbRow(scene, rectBulbs(-6.4, 4.45, 6.0, 2.35, -8.9, 0.3), 0.045, 1);
  glow(1, 0xff9a40, 9.5, 5.2, -6.4, 4.45, -8.975, 0, 0.32);

  /* TIME CASINO neon */
  const tc = tex(1024, 460, (g, w, h) => {
    g.fillStyle = '#7a1d12'; g.beginPath(); g.moveTo(0, h); g.lineTo(0, 120); g.quadraticCurveTo(0, 90, 40, 90); g.lineTo(340, 90); g.quadraticCurveTo(512, -40, 684, 90); g.lineTo(984, 90); g.quadraticCurveTo(1024, 90, 1024, 120); g.lineTo(1024, h); g.closePath(); g.fill();
    g.fillStyle = '#1a0606'; g.beginPath(); g.moveTo(22, h - 22); g.lineTo(22, 130); g.quadraticCurveTo(22, 112, 50, 112); g.lineTo(350, 112); g.quadraticCurveTo(512, -6, 674, 112); g.lineTo(974, 112); g.quadraticCurveTo(1002, 112, 1002, 130); g.lineTo(1002, h - 22); g.closePath(); g.fill();
    g.fillStyle = '#e8b64c';
    const star = (x, y, r) => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); };
    star(300, 165, 26); star(724, 165, 26);
    glowText(g, 'TIME', w / 2, 255, '138px Limelight, Didot, serif', '#ffd36b', 28);
    glowText(g, 'CASINO', w / 2, 385, '128px Limelight, Didot, serif', '#ff6b3d', 30);
  });
  const tcm = plane(tc, 8.2, 3.68); tcm.position.set(6.3, 4.05, -8.94); scene.add(tcm); zm(2, tcm.material);
  bulbRow(scene, rectBulbs(6.3, 3.69, 8.02, 2.78, -8.9, 0.32), 0.045, 2);
  glow(2, 0xff5a2a, 12.5, 6.4, 6.3, 3.9, -8.975, 0, 0.5);
  clockTex = tex(256, 256, () => {});
  drawClock();
  mesh(new THREE.CircleGeometry(0.4, 40), zm(2, Bm(0xffffff, { map: clockTex })), 6.3, 5.35, -8.9);
  mesh(new THREE.TorusGeometry(0.41, 0.03, 10, 48), M(0xe8b64c, { metalness: 0.8, roughness: 0.3, emissive: 0x5a3a0a }), 6.3, 5.35, -8.9);
}
function drawClock() {
  const { g } = clockTex.userData, w = 256, c = w / 2, now = new Date();
  g.clearRect(0, 0, w, w);
  g.fillStyle = '#1a0a06'; g.beginPath(); g.arc(c, c, c, 0, TAU); g.fill();
  g.fillStyle = '#ffe9b0'; g.beginPath(); g.arc(c, c, c - 14, 0, TAU); g.fill();
  g.strokeStyle = '#3a2210'; for (let i = 0; i < 60; i++) { const a = i / 60 * TAU; g.lineWidth = i % 5 ? 2 : 6; const r1 = c - 22, r2 = i % 5 ? c - 30 : c - 40; g.beginPath(); g.moveTo(c + Math.sin(a) * r1, c - Math.cos(a) * r1); g.lineTo(c + Math.sin(a) * r2, c - Math.cos(a) * r2); g.stroke(); }
  const hand = (a, len, wd, col) => { g.strokeStyle = col; g.lineWidth = wd; g.lineCap = 'round'; g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.sin(a) * len, c - Math.cos(a) * len); g.stroke(); };
  const s = now.getSeconds(), m = now.getMinutes() + s / 60, h = (now.getHours() % 12) + m / 60;
  hand(h / 12 * TAU, 56, 9, '#2a1608'); hand(m / 60 * TAU, 86, 6, '#2a1608'); hand(s / 60 * TAU, 92, 2, '#c2401c');
  g.fillStyle = '#2a1608'; g.beginPath(); g.arc(c, c, 7, 0, TAU); g.fill();
  clockTex.needsUpdate = true;
}

function buildGameRoom() {
  const orange = M(0xe9893b), red = M(0xd9542b), yellow = M(0xf2c14e), blue = M(0x3c7fc4), dark = M(0x2a1d18);

  /* claw machine — L1 */
  {
    const g = grp(-10.55, 0, -7.55, Math.PI / 4);
    mesh(bx(1.3, 1.0, 1.2), orange, 0, 0.5, 0, g);
    mesh(bx(0.9, 0.48, 0.03), red, 0, 0.42, 0.61, g);
    mesh(bx(0.3, 0.18, 0.04), dark, 0.38, 0.82, 0.61, g);
    const glass = M(0xbfe6ff, { transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0.1, depthWrite: false });
    mesh(bx(1.24, 1.3, 1.14), glass, 0, 1.65, 0, g);
    [[-0.63, -0.58], [0.63, -0.58], [-0.63, 0.58], [0.63, 0.58]].forEach(([x, z]) => mesh(bx(0.06, 1.3, 0.06), orange, x, 1.65, z, g));
    mesh(bx(1.3, 0.48, 1.2), red, 0, 2.54, 0, g);
    const pz = tex(512, 160, (c, w, h) => { c.fillStyle = '#f2c14e'; c.fillRect(0, 0, w, h); c.font = '96px Bungee, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#c2401c'; c.fillText('PRIZES', w / 2, h / 2 + 6); });
    const pzm = plane(pz, 1.15, 0.36); pzm.position.set(0, 2.54, 0.605); g.add(pzm);
    const r = rng(5), cols = [0x5fb0ea, 0x7fd67a, 0xf29b4b, 0xf2d54b, 0x9fd0f6];
    for (let i = 0; i < 14; i++) { const c = M(cols[i % cols.length], { roughness: 0.95 }); const x = (r() - 0.5) * 0.95, z = (r() - 0.5) * 0.85, y = 1.12 + r() * 0.2; mesh(new THREE.SphereGeometry(0.15, 14, 10), c, x, y, z, g); mesh(new THREE.SphereGeometry(0.055, 8, 6), c, x - 0.08, y + 0.14, z, g); mesh(new THREE.SphereGeometry(0.055, 8, 6), c, x + 0.08, y + 0.14, z, g); }
    mesh(cy(0.02, 0.02, 0.4, 8), M(0xcccccc, { metalness: 0.8 }), 0.1, 2.1, 0.1, g);
    mesh(new THREE.ConeGeometry(0.08, 0.12, 6, 1, true), M(0xcccccc, { metalness: 0.8, side: THREE.DoubleSide }), 0.1, 1.86, 0.1, g);
    const note = tex(512, 300, (c, w, h) => { c.fillStyle = '#ffe680'; c.fillRect(0, 0, w, h); c.fillStyle = '#3a2b10'; c.font = '700 54px Gaegu, cursive'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('* → ** → *** → ****', w / 2, h * 0.38); c.font = '700 46px Gaegu, cursive'; c.fillText('순대로 작성하시오.', w / 2, h * 0.7); });
    const nm = plane(note, 0.5, 0.29, true); nm.position.set(-0.22, 1.72, 0.58); nm.rotation.z = 0.05; g.add(nm);
    locks3d.L1 = padlock(g, 0.0, 0.42, 0.66, 1.1);
    makeInteract(g, 'lock', 'L1', '경품 뽑기 기계', 3.05);
    collide(-10.55, -7.55, 1.8, 1.8);
  }

  /* skee-ball lane */
  {
    const g = grp(-7.2, 0, -6.3, 0);
    const lane = mesh(bx(1.1, 0.1, 3.4), M(0xe8c58a, { roughness: 0.5 }), 0, 0.78, 0, g); lane.rotation.x = 0.12;
    mesh(bx(0.12, 0.35, 3.5), orange, -0.62, 0.86, 0, g).rotation.x = 0.12; mesh(bx(0.12, 0.35, 3.5), orange, 0.62, 0.86, 0, g).rotation.x = 0.12;
    mesh(bx(1.4, 0.75, 0.55), blue, 0, 0.375, 1.85, g);
    mesh(bx(1.4, 0.75, 3.0), blue, 0, 0.375, -0.1, g);
    mesh(bx(1.5, 2.1, 0.35), orange, 0, 1.05, -1.95, g);
    const tgt = tex(512, 640, (c, w, h) => { c.fillStyle = '#f2c14e'; c.fillRect(0, 0, w, h); const cx = w / 2, cyy = h * 0.55; [[230, '#e8692c'], [180, '#f3e3b0'], [130, '#e8692c'], [84, '#f3e3b0'], [44, '#c2401c']].forEach(([r, col]) => { c.fillStyle = col; c.beginPath(); c.arc(cx, cyy, r, 0, TAU); c.fill(); }); c.fillStyle = '#2a1608'; c.font = '44px Bungee, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; [['20', 205], ['30', 155], ['40', 107], ['50', 0]].forEach(([t, dy]) => c.fillText(t, cx, cyy - dy)); c.font = '54px Bungee, sans-serif'; c.fillStyle = '#c2401c'; c.fillText('SKEE', cx, 60); });
    const tm = plane(tgt, 1.3, 1.62, true); tm.position.set(0, 1.25, -1.77); g.add(tm);
    [[-0.3, 0.86], [0.3, 0.86], [0, 0.86]].forEach(([x, y], i) => mesh(new THREE.SphereGeometry(0.09, 14, 10), M(0x7a4a26), x, y, 1.8 - i * 0.12, g));
    collide(-7.2, -6.3, 1.6, 4.4);
  }

  /* basketball hoop + 35 scoreboard */
  {
    const bb = mesh(bx(1.3, 0.85, 0.05), M(0xf7f3ea), -3.7, 3.05, -8.92);
    void bb;
    mesh(bx(0.5, 0.36, 0.02), Bm(0xc2401c), -3.7, 2.9, -8.89);
    const rim = mesh(new THREE.TorusGeometry(0.23, 0.02, 8, 24), M(0xe8692c, { metalness: 0.4 }), -3.7, 2.68, -8.6); rim.rotation.x = Math.PI / 2;
    mesh(cy(0.23, 0.16, 0.36, 14, true), M(0xffffff, { wireframe: true, transparent: true, opacity: 0.7 }), -3.7, 2.48, -8.6);
    const sc = tex(256, 160, (c, w, h) => { c.fillStyle = '#20140f'; c.fillRect(0, 0, w, h); glowText(c, '35', w / 2, h / 2 + 6, '110px Bungee, sans-serif', '#ff8a3a', 18); });
    mesh(bx(0.9, 0.56, 0.18), M(0x3c7fc4), -3.7, 3.85, -8.85);
    const scm = plane(sc, 0.72, 0.45); scm.position.set(-3.7, 3.85, -8.75); scene.add(scm);
  }

  /* prize wheel */
  {
    const g = grp(-1.4, 0, -8.35, 0);
    mesh(bx(0.12, 1.6, 0.12), M(0x3c7fc4), -0.5, 0.8, 0, g); mesh(bx(0.12, 1.6, 0.12), M(0x3c7fc4), 0.5, 0.8, 0, g); mesh(bx(1.3, 0.12, 0.6), M(0x3c7fc4), 0, 0.06, 0, g);
    const wt = tex(512, 512, (c, w) => { const n = 12; for (let i = 0; i < n; i++) { c.fillStyle = i % 2 ? '#f3e3b0' : '#d9542b'; c.beginPath(); c.moveTo(w / 2, w / 2); c.arc(w / 2, w / 2, w / 2, i / n * TAU, (i + 1) / n * TAU); c.closePath(); c.fill(); } c.fillStyle = '#e8b64c'; c.beginPath(); c.arc(w / 2, w / 2, 40, 0, TAU); c.fill(); });
    const disc = mesh(cy(0.95, 0.95, 0.1, 48), [M(0xe8b64c, { metalness: 0.5 }), M(0xffffff, { map: wt }), M(0xffffff, { map: wt })], 0, 1.75, 0.06, g);
    disc.rotation.x = Math.PI / 2; spinners.push({ m: disc, axis: 'y', speed: 0.25 });
    mesh(new THREE.ConeGeometry(0.1, 0.22, 3), M(0xe8b64c, { metalness: 0.6 }), 0, 2.78, 0.12, g).rotation.z = Math.PI;
    collide(-1.4, -8.35, 1.4, 0.7);
  }

  /* whack-a-mole */
  {
    const g = grp(-9.7, 0, -2.4, Math.PI / 2);
    mesh(bx(1.3, 0.75, 1.0), M(0x3c7fc4), 0, 0.375, 0, g);
    mesh(bx(1.36, 0.08, 1.06), yellow, 0, 0.79, 0, g);
    [[-0.35, -0.2], [0.35, -0.2], [0, 0.05], [-0.35, 0.3], [0.35, 0.3]].forEach(([x, z], i) => {
      mesh(cy(0.14, 0.14, 0.02, 20), M(0x1a0f0a), x, 0.835, z, g);
      const mole = mesh(new THREE.SphereGeometry(0.11, 14, 10), M(0x8a5530), x, 0.84, z, g); moles.push({ m: mole, base: 0.84, ph: i * 1.3 });
    });
    const mallet = grp(-9.1, 0.05, -1.4, 0.6);
    mesh(cy(0.025, 0.025, 0.7, 10), M(0xe8c58a), 0, 0, 0.35, mallet).rotation.x = Math.PI / 2;
    mesh(cy(0.1, 0.1, 0.28, 16), red, 0, 0.05, 0, mallet).rotation.z = Math.PI / 2;
    collide(-9.7, -2.4, 1.2, 1.5);
  }

  /* chalkboard easel — b_record */
  {
    const g = grp(-6.2, 0, 1.2, 0.2);
    const wood = M(0x6b4426);
    mesh(bx(0.06, 2.0, 0.06), wood, -0.7, 1.0, 0.1, g).rotation.x = -0.12; mesh(bx(0.06, 2.0, 0.06), wood, 0.7, 1.0, 0.1, g).rotation.x = -0.12;
    mesh(bx(0.06, 2.0, 0.06), wood, 0, 1.0, -0.25, g).rotation.x = 0.25;
    mesh(bx(1.7, 1.2, 0.06), wood, 0, 1.45, 0.05, g).rotation.x = -0.12;
    const ch = tex(1024, 680, (c, w, h) => {
      c.fillStyle = '#203a2f'; c.fillRect(0, 0, w, h);
      const r = rng(9); for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(255,255,255,${0.02 + r() * 0.03})`; c.beginPath(); c.ellipse(r() * w, r() * h, 40 + r() * 120, 20 + r() * 40, r(), 0, TAU); c.fill(); }
      c.fillStyle = '#f1eee4'; c.font = '700 74px Gaegu, cursive'; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText('게임 기록', 50, 100);
      c.font = '500 27px "IBM Plex Mono", monospace';
      const L = ['G1. A:5 B:0 → A:5 B:0 → A:5 B:2 → Nobody win', 'G2. A:5 B:0 → A:0 B:0 → A win', 'G3. A:2 B:0 → A:[*] B:2 → A:2 B:[**] → B win', 'G4. A:2 B:5 → A:5 B:[***] → A:[****] B:0 → B win'];
      L.forEach((s, i) => c.fillText(s, 50, 210 + i * 110));
    });
    const cm = plane(ch, 1.56, 1.04, true, { roughness: 1 }); cm.position.set(0, 1.45, 0.085); cm.rotation.x = -0.12; g.add(cm);
    makeInteract(g, 'clue', 'b_record', '게임 기록', 2.35);
    collide(-6.2, 1.2, 1.6, 0.7);
  }

  /* cocktail table — b_quiz */
  {
    const g = grp(-4.0, 0, 4.9, 0);
    mesh(cy(0.06, 0.06, 1.0, 12), M(0x2a1d18, { metalness: 0.6 }), 0, 0.5, 0, g);
    mesh(cy(0.3, 0.3, 0.04, 24), M(0x2a1d18, { metalness: 0.6 }), 0, 0.02, 0, g);
    mesh(cy(0.48, 0.48, 0.05, 32), M(0x3c7fc4, { roughness: 0.4 }), 0, 1.03, 0, g);
    mesh(bx(0.34, 0.015, 0.46), M(0x8a5a22), 0.02, 1.065, 0.02, g).rotation.y = 0.2;
    const qz = tex(400, 540, (c, w, h) => { c.fillStyle = '#f3ead6'; c.fillRect(0, 0, w, h); c.fillStyle = '#2b1e16'; c.font = '700 58px Gaegu, cursive'; c.textAlign = 'left'; c.fillText('질문지', 36, 90); c.font = '700 52px Gaegu, cursive'; ['1. Are', '2. You', '3. Be', '4. Why'].forEach((s, i) => c.fillText(s, 50, 190 + i * 88)); });
    const qm = plane(qz, 0.3, 0.405, true); qm.rotation.x = -Math.PI / 2; qm.rotation.z = -0.2; qm.position.set(0.02, 1.075, 0.02); g.add(qm);
    [[-0.75, 0.2], [0.7, -0.3]].forEach(([x, z]) => { mesh(cy(0.2, 0.2, 0.06, 20), M(0xd9542b), x, 0.75, z, g); mesh(cy(0.03, 0.03, 0.72, 8), M(0x2a1d18), x, 0.37, z, g); });
    makeInteract(g, 'clue', 'b_quiz', '질문지', 1.55);
    collide(-4.0, 4.9, 1.0, 1.0);
  }

  /* jewelry case — L6 */
  {
    const g = grp(-11.25, 0, 3.6, Math.PI / 2);
    mesh(bx(1.1, 1.0, 0.7), M(0x3a1d14, { roughness: 0.5 }), 0, 0.5, 0, g);
    mesh(bx(1.14, 0.05, 0.74), M(0xc9a13a, { metalness: 0.8, roughness: 0.3 }), 0, 1.02, 0, g);
    mesh(bx(0.9, 0.6, 0.55), M(0xdff3ff, { transparent: true, opacity: 0.15, roughness: 0.05, depthWrite: false }), 0, 1.35, 0, g);
    mesh(bx(0.92, 0.04, 0.57), M(0xc9a13a, { metalness: 0.8, roughness: 0.3 }), 0, 1.67, 0, g);
    mesh(cy(0.16, 0.18, 0.08, 20), M(0x5b0f15, { roughness: 1 }), 0, 1.09, 0, g);
    const ruby = mesh(new THREE.OctahedronGeometry(0.11, 0), M(0x6a0818, { metalness: 0.3, roughness: 0.15, emissive: 0x000000 }), 0, 1.25, 0, g);
    props.L6 = { kind: 'custom', reveal: (instant) => revealRuby(ruby, instant) };
    spinners.push({ m: ruby, axis: 'y', speed: 0.8 });
    const kp = plane(keypadTex(true), 0.26, 0.325, true, { roughness: 0.5 }); kp.position.set(0.3, 0.62, 0.356); g.add(kp);
    const lbl = tex(512, 128, (c, w, h) => { c.fillStyle = '#c9a13a'; c.fillRect(0, 0, w, h); c.fillStyle = '#2a1608'; c.font = '600 56px "IBM Plex Sans KR", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('1등 경품', w / 2, h / 2 + 4); });
    const lm = plane(lbl, 0.42, 0.105, true, { metalness: 0.6, roughness: 0.35 }); lm.position.set(-0.22, 0.8, 0.356); g.add(lm);
    locks3d.L6 = { keypad: kp, ruby };
    makeInteract(g, 'lock', 'L6', '1등 경품 진열장', 1.95);
    collide(-11.25, 3.6, 0.9, 1.3);
  }
}

function chair(x, z, ry) {
  const g = grp(x, 0, z, ry), vel = M(0x5a0e16, { roughness: 0.95 }), wood = M(0x3a1d14);
  mesh(bx(0.5, 0.12, 0.5), vel, 0, 0.5, 0, g);
  mesh(bx(0.5, 0.6, 0.1), vel, 0, 0.85, -0.22, g);
  [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].forEach(([a, b]) => mesh(bx(0.05, 0.45, 0.05), wood, a, 0.22, b, g));
  return g;
}
function chips(parent, x, y, z, n, color) { for (let i = 0; i < n; i++) mesh(cy(0.035, 0.035, 0.012, 16), M(color, { roughness: 0.5 }), x, y + i * 0.013, z, parent); }

function buildCasino() {
  const darkWood = M(0x40200f, { roughness: 0.45 });
  const felt = M(0x0c3a2b, { roughness: 1 });

  /* roulette table — L4 on chip box */
  {
    const g = grp(2.2, 0, 1.6, 0);
    mesh(bx(0.5, 0.8, 0.6), darkWood, -1.3, 0.4, 0, g); mesh(bx(0.5, 0.8, 0.6), darkWood, 1.3, 0.4, 0, g);
    const sh = new THREE.Shape(); sh.absellipse(0, 0, 2.35, 1.25, 0, TAU, false, 0);
    const top = mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.04, bevelSegments: 2, curveSegments: 48 }), darkWood, 0, 0.82, 0, g); top.rotation.x = -Math.PI / 2;
    const sh2 = new THREE.Shape(); sh2.absellipse(0, 0, 2.15, 1.07, 0, TAU, false, 0);
    const leather = mesh(new THREE.ShapeGeometry(sh2, 48), M(0x5a2a17, { roughness: 0.8 }), 0, 0.975, 0, g); leather.rotation.x = -Math.PI / 2;
    const lay = tex(1024, 480, (c, w, h) => {
      c.fillStyle = '#4a2414'; c.fillRect(0, 0, w, h);
      const REDS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
      const x0 = 90, cw = (w - x0 - 20) / 12, ch = (h - 100) / 3;
      c.fillStyle = '#1d6b3a'; c.fillRect(20, 20, x0 - 26, ch * 3); c.fillStyle = '#fff'; c.font = '600 40px "IBM Plex Mono", monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('0', 20 + (x0 - 26) / 2, 20 + ch * 1.5);
      for (let col = 0; col < 12; col++) for (let row = 0; row < 3; row++) { const n = col * 3 + (3 - row); const x = x0 + col * cw, y = 20 + row * ch; c.fillStyle = REDS.includes(n) ? '#a8201c' : '#141010'; c.fillRect(x + 3, y + 3, cw - 6, ch - 6); c.fillStyle = '#f3e3b0'; c.font = '600 34px "IBM Plex Mono", monospace'; c.fillText(String(n), x + cw / 2, y + ch / 2); }
      ['1-18', 'EVEN', 'RED', 'BLACK', 'ODD', '19-36'].forEach((t, i) => { const x = x0 + i * cw * 2, y = 20 + ch * 3 + 8; c.strokeStyle = '#e8b64c'; c.lineWidth = 3; c.strokeRect(x + 3, y, cw * 2 - 6, 64); c.fillStyle = t === 'RED' ? '#ff5a4a' : '#f3e3b0'; c.font = '600 26px "IBM Plex Mono", monospace'; c.fillText(t, x + cw, y + 33); });
    });
    const lm = plane(lay, 2.7, 1.27, true, { roughness: 0.7 }); lm.rotation.x = -Math.PI / 2; lm.position.set(0.55, 0.978, -0.02); g.add(lm);
    mesh(cy(0.66, 0.6, 0.14, 48), darkWood, -1.5, 1.02, 0, g);
    const pockets = tex(512, 512, (c, w) => { const n = 37; const order = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26]; c.fillStyle = '#3a1d0e'; c.fillRect(0, 0, w, w); for (let i = 0; i < n; i++) { c.fillStyle = i === 0 ? '#1d6b3a' : i % 2 ? '#a8201c' : '#141010'; c.beginPath(); c.moveTo(w / 2, w / 2); c.arc(w / 2, w / 2, w / 2 - 6, i / n * TAU, (i + 1) / n * TAU); c.closePath(); c.fill(); c.save(); c.translate(w / 2, w / 2); c.rotate((i + 0.5) / n * TAU); c.fillStyle = '#f3e3b0'; c.font = '600 18px "IBM Plex Mono", monospace'; c.textAlign = 'center'; c.fillText(String(order[i]), w / 2 - 34, 6); c.restore(); } c.fillStyle = '#6b3a1a'; c.beginPath(); c.arc(w / 2, w / 2, w * 0.28, 0, TAU); c.fill(); });
    const wheel = mesh(cy(0.54, 0.54, 0.03, 48), [M(0x6b3a1a), M(0xffffff, { map: pockets, roughness: 0.4 }), M(0x6b3a1a)], -1.5, 1.1, 0, g);
    spinners.push({ m: wheel, axis: 'y', speed: 0.6 });
    mesh(cy(0.05, 0.08, 0.14, 12), M(0xc9a13a, { metalness: 0.85, roughness: 0.25 }), -1.5, 1.18, 0, g);
    mesh(new THREE.SphereGeometry(0.045, 12, 10), M(0xc9a13a, { metalness: 0.85, roughness: 0.25 }), -1.5, 1.28, 0, g);
    chips(g, 1.4, 0.985, 0.85, 6, 0xd9542b); chips(g, 1.55, 0.985, 0.8, 4, 0x3c7fc4);

    const box = grp(0.45, 0.975, 0.86, 0, g);
    mesh(bx(0.52, 0.2, 0.3), M(0x6b3a1a, { roughness: 0.4 }), 0, 0.1, 0, box);
    mesh(bx(0.54, 0.05, 0.32), M(0x4a2414, { roughness: 0.4 }), 0, 0.22, 0, box);
    mesh(bx(0.54, 0.02, 0.02), brass, 0, 0.17, 0.15, box);
    locks3d.L4 = padlock(box, 0, 0.1, 0.19, 0.75);
    const cal = tex(640, 420, (c, w, h) => { c.fillStyle = '#efe6cf'; c.fillRect(0, 0, w, h); c.strokeStyle = '#6b3a1a'; c.lineWidth = 16; c.strokeRect(0, 0, w, h); c.fillStyle = '#1d140e'; c.font = '78px "Nanum Brush Script", cursive'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('하늘과 땅이 뒤바뀌어도', w / 2, h * 0.38); c.fillText('본질은 변하지 않는다.', w / 2, h * 0.66); });
    const cg = grp(0, 0.22, 0, 0, box);
    const calm = plane(cal, 0.48, 0.315, true); calm.position.set(0, 0.2, -0.06); calm.rotation.x = -0.25; cg.add(calm);
    mesh(bx(0.04, 0.3, 0.04), M(0x6b3a1a), 0, 0.11, -0.1, cg).rotation.x = -0.25;
    cg.scale.set(1, 0.001, 1); cg.visible = false; props.L4 = { kind: 'pop', g: cg };
    makeInteract(box, 'lock', 'L4', '룰렛 테이블 칩 보관함', 0.82);
    g.userData.proxy = box;
    collide(2.2, 1.6, 4.8, 2.6);
    [[0.8, 3.1, Math.PI], [2.2, 3.15, Math.PI], [3.6, 3.1, Math.PI], [1.4, 0.05, 0], [3.0, 0.05, 0]].forEach(([x, z, r]) => chair(x, z, r));
  }

  /* slot machines along right wall — L2 is the wide one */
  {
    const slots = [[-7.7, 0.95, false], [-6.7, 0.95, false], [-5.1, 1.6, true], [-3.5, 0.95, false], [-2.5, 0.95, false]];
    const symSets = [['7', 'BAR', '7'], ['★', '7', 'BAR'], null, ['BAR', 'BAR', '★'], ['7', '★', '7']];
    slots.forEach(([z, w, big], i) => {
      const g = grp(11.35, 0, z, -Math.PI / 2);
      mesh(bx(w, 1.85, 0.75), M(big ? 0x7a1d12 : 0x2d2a40, { roughness: 0.4, metalness: 0.3 }), 0, 0.925, 0, g);
      mesh(bx(w + 0.04, 0.12, 0.79), M(0xc9a13a, { metalness: 0.8, roughness: 0.3 }), 0, 1.86, 0, g);
      mesh(bx(w - 0.1, 0.25, 0.3), zm(2, Bm(big ? 0xff8a3a : 0x6fc0ff)), 0, 2.05, 0.1, g);
      mesh(bx(w, 0.08, 0.35), M(0x1a1a1a), 0, 0.85, 0.5, g);
      const scr = big
        ? tex(1600, 300, (c, W, H) => { c.fillStyle = '#0d0606'; c.fillRect(0, 0, W, H); const cw = W / 16; 'SXURMVQBICVDOERT'.split('').forEach((ch, k) => { c.fillStyle = '#2a0f0f'; rrect(c, k * cw + 6, 30, cw - 12, H - 60, 10); c.fill(); glowText(c, ch, k * cw + cw / 2, H / 2 + 4, '84px Bungee, sans-serif', '#ffd36b', 14); }); })
        : tex(512, 320, (c, W, H) => { c.fillStyle = '#10101a'; c.fillRect(0, 0, W, H); symSets[i].forEach((s, k) => { c.fillStyle = '#f7f3ea'; c.fillRect(20 + k * 164, 30, 144, H - 60); c.fillStyle = s === '7' ? '#c2401c' : '#2a1608'; c.font = `${s === 'BAR' ? 54 : 110}px Bungee, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s, 92 + k * 164, H / 2 + 6); }); });
      const sm = plane(scr, w - 0.14, big ? 0.36 : 0.42); sm.position.set(0, 1.35, 0.38); g.add(sm); zm(2, sm.material);
      if (big) {
        const off = tex(1600, 300, (c, W, H) => { c.fillStyle = '#0a0505'; c.fillRect(0, 0, W, H); const cw = W / 16; for (let k = 0; k < 16; k++) { c.fillStyle = '#1a0b0b'; rrect(c, k * cw + 6, 30, cw - 12, H - 60, 10); c.fill(); c.fillStyle = '#3a2420'; c.font = '84px Bungee, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('-', k * cw + cw / 2, H / 2 + 4); } });
        sm.material.map = off; props.L2 = { kind: 'screen', mat: sm.material, on: scr };
      }
      mesh(cy(0.02, 0.02, 0.4, 8), M(0xcccccc, { metalness: 0.9 }), w / 2 + 0.05, 1.3, 0.1, g);
      mesh(new THREE.SphereGeometry(0.06, 12, 10), M(0xc2401c), w / 2 + 0.05, 1.52, 0.1, g);
      if (big) {
        mesh(bx(0.7, 0.42, 0.05), M(0x2a1608, { metalness: 0.4 }), 0, 0.45, 0.38, g);
        locks3d.L2 = padlock(g, 0, 0.45, 0.43, 1.1);
        makeInteract(g, 'lock', 'L2', '16릴 슬롯머신', 2.45);
      }
      chair(10.4, z, Math.PI / 2);
    });
    collide(11.35, -5.1, 0.9, 6.2);
  }

  /* blackjack table — L3 */
  {
    const g = grp(6.4, 0, -5.4, 0);
    mesh(cy(1.32, 1.32, 0.1, 40, false, -Math.PI / 2, Math.PI), darkWood, 0, 0.86, 0, g);
    mesh(cy(1.2, 1.2, 0.02, 40, false, -Math.PI / 2, Math.PI), felt, 0, 0.92, 0, g);
    mesh(bx(0.9, 0.86, 0.3), darkWood, 0, 0.43, 0.3, g);
    const ct = tex(1024, 448, (c, w, h) => {
      c.clearRect(0, 0, w, h);
      c.fillStyle = '#d7efe4'; c.font = '600 30px "IBM Plex Mono", monospace'; c.textAlign = 'left'; c.textBaseline = 'middle';
      const rows = [['PLAYER 1', ['2', 'Q', '6', 'A', '7', '3', 'K', 'J']], ['PLAYER 2', ['2', '4', 'Q', '9', 'A', '3', 'J', '5']]];
      rows.forEach(([who, cs], r) => { const y = 30 + r * 190; c.fillText(who, 20, y + 10); cs.forEach((k, i) => drawCard(c, 20 + i * 124, y + 34, 96, 132, k, true)); });
      c.font = '500 24px "IBM Plex Mono", monospace'; c.fillStyle = '#bfe3d2'; c.fillText('A→2→3→4→5→6→7→8→9→10→J→Q→K', 20, h - 18);
    });
    const cm = plane(ct, 1.6, 0.7, true, { transparent: true, roughness: 0.9 }); cm.rotation.x = -Math.PI / 2; cm.position.set(0, 0.935, 0.48); g.add(cm);
    cm.visible = false; cm.material.opacity = 0; props.L3 = { kind: 'cards', m: cm };
    const tray = grp(0, 0.93, 0.02, 0, g);
    mesh(bx(0.62, 0.14, 0.26), M(0x2a1608, { roughness: 0.4 }), 0, 0.07, 0, tray);
    chips(tray, -0.18, 0.15, 0, 5, 0xd9542b); chips(tray, 0, 0.15, 0, 4, 0x2a2a2a); chips(tray, 0.18, 0.15, 0, 6, 0x3c7fc4);
    locks3d.L3 = padlock(tray, 0, 0.06, 0.16, 0.8);
    makeInteract(g, 'lock', 'L3', '블랙잭 테이블 칩 트레이', 1.55);
    collide(6.4, -4.75, 2.7, 1.5);
    [[5.6, -3.7, Math.PI], [6.4, -3.5, Math.PI], [7.2, -3.7, Math.PI]].forEach(([x, z, r]) => chair(x, z, r));
  }

  /* revolver display — b_roulette */
  {
    const g = grp(3.3, 0, -7.6, 0);
    mesh(bx(0.7, 1.0, 0.6), M(0x2a1608, { roughness: 0.5 }), 0, 0.5, 0, g);
    mesh(bx(0.74, 0.04, 0.64), brass, 0, 1.02, 0, g);
    mesh(bx(0.64, 0.42, 0.54), M(0xdff3ff, { transparent: true, opacity: 0.14, roughness: 0.05, depthWrite: false }), 0, 1.25, 0, g);
    mesh(bx(0.5, 0.03, 0.4), M(0x5b0f15, { roughness: 1 }), 0, 1.055, 0, g);
    const gun = grp(0, 1.1, 0, 0.4, g), steel = M(0x3a3a3e, { metalness: 0.85, roughness: 0.35 });
    mesh(cy(0.018, 0.018, 0.3, 12), steel, 0.12, 0.03, 0, gun).rotation.z = Math.PI / 2;
    mesh(cy(0.05, 0.05, 0.08, 12), steel, -0.06, 0.03, 0, gun).rotation.z = Math.PI / 2;
    mesh(bx(0.06, 0.03, 0.14), M(0x6b3a1a), -0.15, 0.015, 0.03, gun).rotation.y = 0.5;
    const pq = tex(512, 140, (c, w, h) => { c.fillStyle = '#c9a13a'; c.fillRect(0, 0, w, h); c.fillStyle = '#2a1608'; c.font = '52px Limelight, serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('RUSSIAN ROULETTE', w / 2, h / 2 + 4); });
    const pm = plane(pq, 0.56, 0.15, true, { metalness: 0.6, roughness: 0.35 }); pm.position.set(0, 0.8, 0.305); g.add(pm);
    makeInteract(g, 'clue', 'b_roulette', '러시안룰렛', 1.75);
    collide(3.3, -7.6, 0.8, 0.8);
  }

  /* venn poster — b_venn */
  {
    const g = grp(11.94, 0, 2.4, -Math.PI / 2);
    mesh(bx(1.25, 1.55, 0.06), M(0xc9a13a, { metalness: 0.7, roughness: 0.35 }), 0, 2.3, 0, g);
    const vt = tex(640, 800, (c, w, h) => { c.fillStyle = '#f3ead6'; c.fillRect(0, 0, w, h); c.save(); c.beginPath(); c.arc(250, 420, 170, 0, TAU); c.clip(); c.fillStyle = '#7b1e1e'; c.beginPath(); c.arc(390, 420, 170, 0, TAU); c.fill(); c.restore(); c.strokeStyle = '#2b1e16'; c.lineWidth = 6; c.beginPath(); c.arc(250, 420, 170, 0, TAU); c.stroke(); c.beginPath(); c.arc(390, 420, 170, 0, TAU); c.stroke(); c.fillStyle = '#2b1e16'; c.font = '600 44px "IBM Plex Mono", monospace'; c.textAlign = 'center'; c.fillText('1', 160, 435); c.fillText('2', 480, 435); });
    const vm = plane(vt, 1.1, 1.375, true); vm.position.set(0, 2.3, 0.035); g.add(vm);
    makeInteract(g, 'clue', 'b_venn', '교집합', 3.3);
  }

  /* hold'em table — L5 */
  {
    const g = grp(7.9, 0, 4.7, 0);
    mesh(cy(0.2, 0.35, 0.86, 20), darkWood, 0, 0.43, 0, g);
    mesh(cy(1.25, 1.25, 0.1, 48), darkWood, 0, 0.86, 0, g);
    mesh(cy(1.1, 1.1, 0.02, 48), felt, 0, 0.92, 0, g);
    chips(g, 0.5, 0.93, 0.5, 4, 0xd9542b); chips(g, 0.6, 0.93, -0.45, 4, 0x3c7fc4); chips(g, 0.1, 0.93, 0.1, 8, 0xe8b64c);
    const dev = grp(-0.55, 0.93, 0, -Math.PI / 2, g);
    const ht = tex(1024, 640, (c, w, h) => {
      const gr2 = c.createRadialGradient(w * 0.4, h / 2, 40, w * 0.4, h / 2, 520); gr2.addColorStop(0, '#1f6a52'); gr2.addColorStop(1, '#0d3227'); c.fillStyle = gr2; c.fillRect(0, 0, w, h);
      c.fillStyle = '#0a0a0a'; c.fillRect(0, 0, w, 56); c.fillStyle = '#e8b64c'; c.font = '34px Limelight, serif'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText("INDIAN HOLD'EM", 24, 30);
      c.fillStyle = '#bfe3d2'; c.font = '600 22px "IBM Plex Mono", monospace'; c.textAlign = 'center';
      c.fillText('PLAYER 2', 360, 86); drawCard(c, 318, 104, 84, 120, '3', true);
      c.fillText('SHARED', 360, 262); drawCard(c, 268, 280, 84, 120, '5', true); drawCard(c, 368, 280, 84, 120, '?', false);
      c.fillText('PLAYER 1 (ME)', 360, 438); drawCard(c, 318, 456, 84, 120, '?', false);
      c.textAlign = 'left'; c.font = '600 28px "IBM Plex Mono", monospace';
      [['BLIND', '1'], ['POT', '8'], ['CALL', '4'], ['P1 CHIPS', '4'], ['P2 CHIPS', '4']].forEach(([k, v], i) => { c.fillStyle = '#bfe3d2'; c.fillText(k, 650, 130 + i * 62); c.fillStyle = '#ffffff'; c.textAlign = 'right'; c.fillText(v, 980, 130 + i * 62); c.textAlign = 'left'; });
      [['CALL', 650], ['RAISE', 765], ['FOLD', 895]].forEach(([t, x]) => { c.strokeStyle = t === 'FOLD' ? '#ff5a5a' : '#bfe3d2'; c.lineWidth = 3; rrect(c, x, 470, 104, 52, 8); c.stroke(); c.fillStyle = t === 'FOLD' ? '#ffb0b0' : '#bfe3d2'; c.font = '600 22px "IBM Plex Mono", monospace'; c.textAlign = 'center'; c.fillText(t, x + 52, 497); c.textAlign = 'left'; });
    });
    mesh(bx(0.08, 0.3, 0.06), M(0x1a1a1a, { metalness: 0.5 }), 0, 0.15, -0.04, dev);
    mesh(bx(0.86, 0.56, 0.04), M(0x111111, { metalness: 0.4, roughness: 0.3 }), 0, 0.52, -0.02, dev);
    const hm = plane(ht, 0.8, 0.5); hm.position.set(0, 0.52, 0.002); dev.add(hm); zm(5, hm.material);
    const hOff = tex(512, 320, (c, w, h) => { c.fillStyle = '#060808'; c.fillRect(0, 0, w, h); c.fillStyle = '#2a3a34'; c.font = '600 34px "IBM Plex Mono", monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('NO SIGNAL', w / 2, h / 2); });
    hm.material.map = hOff; props.L5 = { kind: 'screen', mat: hm.material, on: ht };
    const safe = grp(0, 0, 0.32, 0, dev);
    mesh(bx(0.4, 0.3, 0.3), M(0x5a5d63, { metalness: 0.7, roughness: 0.35 }), 0, 0.15, 0, safe);
    const kp = plane(keypadTex(false), 0.16, 0.2, true, { roughness: 0.5 }); kp.position.set(0.08, 0.15, 0.152); safe.add(kp);
    mesh(cy(0.04, 0.04, 0.03, 16), M(0xc9a13a, { metalness: 0.8 }), -0.1, 0.15, 0.16, safe).rotation.x = Math.PI / 2;
    locks3d.L5 = { keypad: kp };
    makeInteract(dev, 'lock', 'L5', '홀덤 테이블 금고', 1.1);
    g.userData.proxy = dev;
    collide(7.9, 4.7, 2.6, 2.6);
    [[7.9, 6.25, Math.PI], [9.45, 4.7, -Math.PI / 2], [7.9, 3.15, 0], [6.35, 5.6, Math.PI * 0.75]].forEach(([x, z, r]) => chair(x, z, r));
  }

  /* extra poker table (decor) */
  {
    const g = grp(8.4, 0, -0.6, 0);
    mesh(cy(0.18, 0.3, 0.86, 18), darkWood, 0, 0.43, 0, g);
    mesh(cy(1.0, 1.0, 0.1, 40), darkWood, 0, 0.86, 0, g); mesh(cy(0.88, 0.88, 0.02, 40), felt, 0, 0.92, 0, g);
    chips(g, 0.2, 0.93, 0.2, 7, 0xd9542b); chips(g, -0.3, 0.93, -0.1, 5, 0x2a2a2a);
    collide(8.4, -0.6, 2.1, 2.1);
    [[8.4, 0.75, Math.PI], [9.75, -0.6, -Math.PI / 2], [8.4, -1.95, 0]].forEach(([x, z, r]) => chair(x, z, r));
  }

  /* pendant lamps & sconces */
  [[4.2, -3, 2], [8.4, -3, 3], [4.4, 4.8, 4], [10.2, 2.2, 3]].forEach(([x, z, n]) => {
    mesh(cy(0.006, 0.006, 1.0, 6), M(0x1a1a1a), x, 5.5, z);
    mesh(new THREE.SphereGeometry(0.2, 18, 12, 0, TAU, 0, Math.PI / 2), M(0xc9a13a, { metalness: 0.7, roughness: 0.3, side: THREE.DoubleSide }), x, 5.0, z);
    mesh(new THREE.SphereGeometry(0.1, 14, 10), zm(n, Bm(0xffe2a8)), x, 4.93, z);
  });
  [[-7, 2], [-1, 3], [6, 5]].forEach(([z, n]) => { mesh(bx(0.1, 0.3, 0.2), brass, 11.92, 3.2, z); mesh(new THREE.SphereGeometry(0.1, 12, 10), zm(n, Bm(0xffd59a)), 11.8, 3.38, z); glow(n, 0xffb060, 1.4, 1.4, 11.88, 3.38, z, -Math.PI / 2, 0.5); });
}

function buildFrontWall() {
  /* exit door (shared engine furniture) */
  exitDoor({ x: 0, z: 9, ry: 0 });

  /* theme poster */
  poster({ x: -3.0, z: 8.94, ry: Math.PI });

  /* letter board — b_phrase */
  {
    const g = grp(-7.6, 0, 8.94, Math.PI);
    mesh(bx(3.3, 1.3, 0.1), M(0x151010), 0, 3.3, 0, g);
    const lb = tex(1280, 460, (c, w, h) => { c.fillStyle = '#f7f3ea'; c.fillRect(0, 0, w, h); c.strokeStyle = '#d9d0bd'; c.lineWidth = 3; for (let y = 30; y < h; y += 34) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } c.fillStyle = '#b3261e'; c.font = '600 40px "IBM Plex Sans KR", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('오늘의 문구', w / 2, 70); c.fillStyle = '#151010'; c.font = '150px Bungee, sans-serif'; 'MDSINCRE'.split('').forEach((ch, i) => c.fillText(ch, 110 + i * 151, 280)); });
    const lm = plane(lb, 3.1, 1.12, true, { roughness: 0.8 }); lm.position.set(0, 3.3, 0.055); g.add(lm);
    bulbRow(g, rectBulbs(0, 3.3, 3.3, 1.3, 0.07, 0.3), 0.035, 4);
    makeInteract(g, 'clue', 'b_phrase', '알 수 없는 문구', 4.2);
  }

  /* hold'em rules plaque — b_rules */
  {
    const g = grp(6.6, 0, 8.94, Math.PI);
    mesh(bx(1.7, 1.5, 0.06), M(0x40200f), 0, 2.3, 0, g);
    const rt = tex(900, 780, (c, w, h) => {
      const gg = c.createLinearGradient(0, 0, w, h); gg.addColorStop(0, '#e4c069'); gg.addColorStop(0.5, '#c9a13a'); gg.addColorStop(1, '#a87b2a'); c.fillStyle = gg; c.fillRect(0, 0, w, h);
      c.strokeStyle = '#5a3a0a'; c.lineWidth = 8; c.strokeRect(20, 20, w - 40, h - 40);
      c.fillStyle = '#2a1608'; c.font = '62px Limelight, serif'; c.textAlign = 'center'; c.fillText("INDIAN HOLD'EM", w / 2, 110);
      c.font = '600 38px "IBM Plex Sans KR", sans-serif'; c.fillText('인디언 홀덤 규칙', w / 2, 175);
      c.textAlign = 'left'; c.font = '400 31px "IBM Plex Sans KR", sans-serif';
      ['① 1~10 카드 4세트, 총 40장', '② 공유 카드 2장 + 개인 카드 1장', '    자기 카드는 못 보고 상대 카드만 본다', '③ 트리플 > 스트레이트 > 더블 > 높은 숫자', '④ 승자가 팟을 모두 가져간다', '⑤ 폴드 시 족보에 따라 칩 추가 지급'].forEach((s, i) => c.fillText(s, 70, 270 + i * 76));
    });
    const rm = plane(rt, 1.56, 1.35, true, { metalness: 0.5, roughness: 0.4 }); rm.position.set(0, 2.3, 0.035); g.add(rm);
    makeInteract(g, 'clue', 'b_rules', '인디언 홀덤 규칙', 3.25);
  }
}
function revealRuby(ruby, instant) {
  tween(1.2, u => { const e = ease(u); ruby.material.color.setHex(0xd0102a); ruby.material.emissive.setRGB(0.55 * e, 0, 0.06 * e); jewelLight.intensity = 1.1 * e * (u < 1 && Math.random() < 0.3 ? 0.3 : 1); }, instant);
}

/* ---------------------------------------------------------------- story scenes */
function makeScenes() {
  const pixG = api.pixG;
function kid(x, y, shirt, hair, t, o = {}) {
  y += o.jump ? -Math.abs(Math.sin(t * 9 + x)) * 5 : o.bob ? Math.round(Math.sin(t * 3 + x) * 0.6) : 0;
  if (o.back) { P(hair, x + 1, y, 6, 6); } else { P(hair, x + 1, y, 6, 2); P(SKIN, x + 1, y + 2, 6, 4); P(hair, x + 1, y + 2, 1, 2); P(hair, x + 6, y + 2, 1, 2); P('#2a1a12', x + 2, y + 3); P('#2a1a12', x + 5, y + 3); if (o.smile) P('#a0402a', x + 3, y + 5, 2, 1); }
  P(shirt, x, y + 6, 8, 5);
  if (o.armsUp) { P(shirt, x - 1, y + 2, 1, 5); P(shirt, x + 8, y + 2, 1, 5); P(SKIN, x - 1, y + 1); P(SKIN, x + 8, y + 1); }
}
function classroom(t, mood = 'day') {
  const sun = mood === 'sunset';
  P(sun ? '#c98a5a' : '#cdb991', 0, 0, PW, 72); P(sun ? '#6a3d26' : '#7a5236', 0, 72, PW, 36);
  for (let x = 0; x < PW; x += 16) P(sun ? '#5a3220' : '#6a4630', x, 72, 1, 36);
  P('#4a3020', 0, 70, PW, 2);
  P('#6b4426', 34, 10, 96, 40); P(sun ? '#24382c' : '#1f3d2e', 37, 13, 90, 34); P('#8a6a40', 34, 50, 96, 2);
  P('#4a7ab0', 150, 12, 34, 38); P(sun ? '#ff9a50' : '#8fc6ee', 152, 14, 30, 34); P('#e8e0cc', 166, 12, 2, 38); P('#e8e0cc', 150, 30, 34, 2);
  P(sun ? '#ffdd88' : '#fff2a0', sun ? 170 : 174, sun ? 38 : 18, 6, 6);
  P('#f4ead6', 10, 14, 14, 14); P('#2a1a12', 16, 16, 1, 6); P('#2a1a12', 16, 21, 4, 1);
  const a = t * (sun ? 0.4 : 2.5); P('#c2401c', 16 + Math.round(Math.cos(a) * 5), 21 + Math.round(Math.sin(a) * 5));
}
function desks(t, o = {}) {
  const rows = [[24, 76], [70, 76], [116, 76], [10, 92], [58, 92], [106, 92], [154, 92]];
  const cols = ['#2f4a7a', '#7a2f3a', '#2f6a4a', '#6a5a2a', '#4a2f7a', '#2f6a6a', '#7a4a2f'];
  rows.forEach(([x, y], i) => {
    if (!o.empty) kid(x + 6, y - 8, cols[i], i % 3 ? '#2a1a12' : '#4a2a16', t, { back: !o.front, jump: o.jump, armsUp: o.jump, bob: !o.jump });
    P('#8a5a30', x, y + 2, 22, 3); P('#5a3a1e', x + 2, y + 5, 2, 8); P('#5a3a1e', x + 18, y + 5, 2, 8);
  });
}
function casino(t, alpha = 1) {
  pixG.globalAlpha = alpha;
  P('#2a0d0d', 0, 0, PW, 70); P('#5b0f15', 0, 70, PW, 38);
  for (let x = -8; x < PW; x += 12) for (let y = 74; y < PH; y += 10) P('#7a1a20', x + ((y / 10) % 2) * 6, y, 2, 2);
  P('#7a1d12', 46, 6, 100, 30); P('#1a0606', 49, 9, 94, 24);
  const on = Math.floor(t * 3) % 2;
  ptext('TIME', 96, 16, on ? '#ffd36b' : '#c9a040', 9); ptext('CASINO', 96, 27, on ? '#ff6b3d' : '#c05030', 9);
  for (let x = 46; x <= 146; x += 5) { P(((x / 5) % 2) ^ on ? '#fff2c0' : '#6a4a20', x, 4); P(((x / 5) % 2) ^ on ? '#6a4a20' : '#fff2c0', x, 37); }
  const cx = 52, cy0 = 86;
  P('#40200f', cx - 16, cy0 - 3, 32, 10);
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + t * 2; P(i % 2 ? '#a8201c' : '#141010', cx + Math.cos(a) * 10, cy0 + Math.sin(a) * 3, 2, 2); }
  P('#c9a13a', cx - 1, cy0 - 1, 2, 2);
  [[150, 46], [166, 46]].forEach(([x, y], i) => { P('#2d2a40', x, y, 14, 26); P('#c9a13a', x, y, 14, 2); P('#10101a', x + 2, y + 6, 10, 6); P(Math.floor(t * 6 + i) % 3 ? '#ffd36b' : '#ff6b3d', x + 3 + (Math.floor(t * 8 + i * 3) % 3) * 3, y + 8, 2, 2); });
  pixG.globalAlpha = 1;
}
return {
  class(t) { classroom(t); const n = Math.min(14, Math.floor(t * 4)); for (let i = 0; i < n; i++) P('#e8e8e0', 42 + i * 6, 22 + (i % 3) * 7, 4, 1); ptext('1교시', 82, 42, '#d8e8d0', 7); desks(t); },
  bell(t) {
    classroom(t); ptext('쉬는 시간!', 82, 30, '#ffd36b', 10);
    const sw = Math.sin(t * 18) * 2; P('#c9a13a', 92 + sw, 52, 8, 6); P('#8a6a20', 95 + sw, 58, 2, 2);
    if (Math.floor(t * 4) % 2) { ptext('딩동댕', 118, 56, '#fff2a0', 8); }
    desks(t, { jump: true, front: true });
  },
  game(t) {
    P('#cdb991', 0, 0, PW, 40); P('#8a5a30', 0, 40, PW, 68); P('#6a4224', 0, 40, PW, 2);
    kid(20, 14, '#2f4a7a', '#2a1a12', t, { smile: true, bob: true }); kid(164, 14, '#7a2f3a', '#4a2a16', t, { smile: true, bob: true });
    P('#2f4a7a', 14, 26, 20, 14); P('#7a2f3a', 158, 26, 20, 14);
    /* a nod, not an answer: fists pumping but never thrown, cards face down, a die mid-roll, candy as stakes */
    const pump = Math.abs(Math.sin(t * 7)) * 4;
    P(SKIN, 70, 58 - pump, 11, 9); P('#d9a87a', 72, 61 - pump, 7, 1); P('#2f4a7a', 66, 64 - pump, 5, 6);
    P(SKIN, 111, 58 - pump, 11, 9); P('#d9a87a', 113, 61 - pump, 7, 1); P('#7a2f3a', 121, 64 - pump, 5, 6);
    ptext(['하나', '둘', '셋!'][Math.floor(t * 2.2) % 3], 96, 50, '#fff2a0', 8);
    [[36, 82], [44, 84], [52, 82]].forEach(([x, y]) => { P('#9b2525', x, y, 8, 12); P('#ffd9a0', x + 1, y + 1, 6, 1); P('#ffd9a0', x + 1, y + 10, 6, 1); });
    const pip = Math.floor(t * 6) % 6, dx = 86, dy = 84;
    P('#fbf8f1', dx, dy, 11, 11); P('#c9b48a', dx, dy + 10, 11, 1);
    const PIPS = [[[5, 5]], [[2, 2], [8, 8]], [[2, 2], [5, 5], [8, 8]], [[2, 2], [8, 2], [2, 8], [8, 8]], [[2, 2], [8, 2], [5, 5], [2, 8], [8, 8]], [[2, 2], [8, 2], [2, 5], [8, 5], [2, 8], [8, 8]]];
    PIPS[pip].forEach(([x, y]) => P(pip === 0 ? '#c2401c' : '#2a1608', dx + x, dy + y, 1, 1));
    for (let i = 0; i < 6; i++) P(['#ff6b3d', '#5fd38d', '#ffd36b'][i % 3], 132 + (i % 3) * 7, 86 + Math.floor(i / 3) * 6, 5, 4);
    const say = Math.floor(t / 1.6) % 2;
    P('#fbf8f1', say ? 112 : 26, 1, say ? 66 : 48, 13); ptext(say ? '다음 판은 내가!' : '한 판 더!', say ? 145 : 50, 8, '#2a1608', 8);
  },
  morph(t) { classroom(t); desks(t, { back: true }); const a = Math.min(1, Math.max(0, (t - 0.6) / 2.2)); for (let y = 0; y < PH; y += 2) { if (Math.random() < a * 0.2) P('rgba(255,180,90,.5)', 0, y, PW, 1); } casino(t, a); },
  door(t) {
    casino(t, 1); P('#1a0606', 0, 40, PW, 34);
    P('#c9a13a', 80, 30, 32, 44); P('#5b1a12', 83, 33, 26, 41); P('#c9a13a', 104, 52, 2, 2);
    const lit = Math.min(6, Math.floor(t * 1.6));
    for (let i = 0; i < 6; i++) P(i < lit ? '#5fd38d' : '#7a1a14', 81 + i * 6, 24, 4, 4);
    ptext('EXIT', 96, 18, '#5fd38d', 7);
    kid(92, 82 - Math.min(10, t * 2), '#2f4a7a', '#2a1a12', t, { back: true });
  },
  sunset(t) { classroom(t, 'sunset'); desks(t, { empty: true }); for (let i = 0; i < 12; i++) { const x = (i * 37 + t * 6) % PW, y = 20 + ((i * 53) % 50) + Math.sin(t + i) * 2; P('rgba(255,230,160,.7)', x, y); } ptext('딩동댕', 82, 30, Math.floor(t * 3) % 2 ? '#ffd36b' : '#c9a040', 9); },
  score(t) {
    P('#8a5a30', 0, 0, PW, PH); for (let x = 0; x < PW; x += 24) P('#7a4e28', x, 0, 1, PH);
    P('#f4ecd8', 40, 14, 112, 80); for (let y = 26; y < 92; y += 10) P('#c8d8e8', 42, y, 108, 1); P('#e09090', 56, 14, 1, 80);
    ptext('묵찌빠 점수표', 104, 21, '#3a2a1a', 8);
    ptext('A', 50, 40, '#2a1608', 8); ptext('B', 50, 60, '#2a1608', 8);
    const tallies = (n, y) => { for (let i = 0; i < n; i++) { const g = Math.floor(i / 5), k = i % 5; if (k < 4) P('#2a2a2a', 64 + g * 18 + k * 3, y - 5, 1, 9); else P('#2a2a2a', 63 + g * 18, y, 13, 1); } };
    tallies(Math.min(12, Math.floor(t * 4)), 40); tallies(Math.min(9, Math.floor(t * 3)), 60);
    const px = 64 + Math.min(11, Math.floor(t * 4)) * 3; P('#f2c14e', px + 10, 66 - (Math.floor(t * 8) % 2), 3, 18); P('#2a1a12', px + 10, 84, 3, 2);
  },
  friends(t) {
    const gr = pixG.createLinearGradient(0, 0, 0, PH); gr.addColorStop(0, '#ff8a4a'); gr.addColorStop(1, '#5a2a3a'); pixG.fillStyle = gr; pixG.fillRect(0, 0, PW, PH);
    P('#ffd88a', 86, 44, 20, 20); P('#3a1a1a', 0, 80, PW, 28);
    for (let i = 0; i < 4; i++) { const x = 40 + i * 34; kid(x, 64, '#1a0e0e', '#1a0e0e', t + i, { jump: true, armsUp: i % 2 === 0 }); }
    for (let i = 0; i < 8; i++) { const x = (i * 29 + t * 12) % PW, y = 10 + (i * 17) % 40; P(i % 2 ? '#fff2c0' : '#ffd36b', x, y); }
  },
};
}

BackStage.run({
  id: 'w6', week: 6, title: 'TIME CASINO', titleHTML: 'TIME<em>CASINO</em>', tag: '쉬는 시간의 내기', docTitle: 'Time Casino',
  poster: 'assets/poster.webp', posterAlt: '게임룸과 TIME CASINO 네온사인이 있는 카지노 테마 이미지',
  intro: ['학교는 공부만 하던 곳이라고 기억했다. 그런데 쉬는 시간 종이 울리면 책상 위는 순식간에 판이 됐다. 별것 아닌 내기에 목숨 걸던 10분. 그 기억이 낯선 카지노가 되어 눈앞에 펼쳐졌다.',
    '방 곳곳에 단서가 흩어져 있다. 자물쇠를 하나 열 때마다 다음 장치가 깨어나고, 그 장치의 연관 단서가 모습을 드러낸다. 어떤 단서가 어느 자물쇠의 짝인지는 스스로 알아내야 한다.'],
  fonts: ['48px Limelight', '700 32px Gaegu', '32px "Nanum Brush Script"'],
  fontSample: 'TIME CASINO GAME ROOM PRIZES → ★ 게임 기록 순대로 작성하시오 하늘과 땅이 뒤바뀌어도 본질은 변하지 않는다 질문지 오늘의 문구 1등 경품 인디언 홀덤 규칙 카드 세트 총 장 공유 개인 자기 못 보고 상대 만 본다 트리플 스트레이트 더블 높은 숫자 승자가 팟을 모두 가져간다 폴드 시 족보에 따라 칩 추가 지급',
  player: { x: -2.4, z: 6.4, yaw: 0.55, pitch: -0.06 },
  bounds: [-11.65, 11.65, -8.65, 8.6],
  locks: LOCKS, clues: CLUES, related: RELATED, captions: CAPTIONS,
  cut: {
    L2: { at: [10.97, 1.35, -5.1], view: [8.7, 1.75, -5.1], color: 0xffd36b },
    L3: { at: [6.4, 0.95, -4.92], view: [6.4, 2.55, -2.75], color: 0xbfe3d2 },
    L4: { at: [2.65, 1.3, 2.42], view: [2.65, 1.85, 4.45], color: 0xffe9b0 },
    L5: { at: [7.35, 1.45, 4.7], view: [5.55, 1.8, 4.7], color: 0x8cf0a8 },
    L6: { at: [-11.1, 1.3, 3.6], view: [-9.0, 1.75, 3.6], color: 0xff3050 },
    exit: { at: [0, 1.7, 8.8], view: [0, 1.85, 5.7], color: 0x5fd38d },
  },
  focus: {
    L1: [[-8.6, 5.6, -5.4], [-10.5, 1.0, -7.5]], L2: [[9.0, 5.6, -5.1], [11.2, 1.0, -5.1]], L3: [[6.4, 5.6, -3.4], [6.4, 0.9, -5.2]],
    L4: [[2.6, 5.6, 4.2], [2.6, 1.0, 2.4]], L5: [[6.3, 5.6, 4.7], [7.4, 1.0, 4.7]], L6: [[-9.0, 5.6, 3.6], [-11.2, 1.2, 3.6]],
    exit: [[0, 5.6, 6.2], [0, 1.3, 8.8]], start: [[2.2, 5.6, 3.6], [2.2, 0.9, 1.6]],
  },
  prologue: [
    { scene: 'class', text: '학교는 공부만 하던 곳이라고 기억했다.' },
    { scene: 'bell', text: '그런데 쉬는 시간 종이 울리면, 책상 위는 순식간에 판이 됐다.' },
    { scene: 'game', text: '선생님 몰래 걸던 사소한 내기들. 이긴 사람이 다음 판을 정했다.' },
    { scene: 'morph', text: '그 기억이 낯선 카지노가 되어 눈앞에 펼쳐졌다.' },
    { scene: 'door', text: '자물쇠 여섯 개를 열고, 사소한 즐거움을 되찾아 이곳을 나가자.' },
  ],
  epilogue: [
    { scene: 'sunset', text: '마지막 문이 열리자 종이 울렸다. 쉬는 시간이 끝나는 소리였다.' },
    { scene: 'score', text: '카지노는 사라지고, 책상 위엔 연필로 그은 묵찌빠 점수표만 남았다.' },
    { scene: 'friends', text: '공부만 했던 게 아니었다. 사소한 내기에 웃던 10분이, 분명 거기 있었다.' },
  ],
  scenes: makeScenes,
  exitCaption: '문이 열렸다. 밖에서 종소리가 들린다.',
  finalGoal: '출구 문이 풀렸습니다. 출구로 가서 문을 여세요.',
  build() { buildRoom(); },
  onSecond() { drawClock(); },
  onSolved(L) { if (L.id === 'L6' && locks3d.L6 && locks3d.L6.ruby) locks3d.L6.ruby.material.emissive.setHex(0xa0001a); },
  animate(t) { for (const m of moles) m.m.position.y = m.base + Math.max(0, Math.sin(t * 2 + m.ph)) * 0.12; },
});
})();
