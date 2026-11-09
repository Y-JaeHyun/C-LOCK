/* STAGE (5주차): 노을 진 빈 무대 · 나다운 길. Theme data and room for the Back Stage engine.
   Room: x -6.5..6.5, z -6.5 (upstage wall with the sunset opening) .. 6.0 (house wall), ceiling 4.6.
   Stage left (x<0): prop desk + water glasses, chalkboard + prop trunk, act-board easel, stage door. Stage right (x>0):
   the tall ?? banner, letter wheel, fly rail, follow spot. House wall: lighting console, poster, dressing-room vanity. */
(() => {
'use strict';
const api = BackStage.api;
const { THREE, scene, TAU, DIGITS, AZ, M, Bm, bx, cy, mesh, grp, collide, rng, tex, imgTex, plane, rrect, glow, glowText, buildDust,
  zl, V3, props, locks3d, tickers, padlock, makeInteract, exitDoor, poster, framed, tween, ease, P, ptext, kid, PW, PH } = api;

/* ---------------------------------------------------------------- puzzle data */
const LOCKS = [
  { id: 'L1', no: 1, name: '소품 트렁크', type: '대문자 5자리', mech: 'dial', set: AZ, len: 5, hash: '18nkuf7', related: null,
    hints: ['연관 단서가 없습니다. 무대 왼쪽 벽 칠판의 「이상한 기호」 하나로 풀립니다.',
      '칠판의 8과 5를 디지털 시계 숫자처럼 일곱 개의 획으로 떠올리세요. 괄호 속 획을 지우고 남은 모양을 알파벳으로 읽으면, 줄마다 한 글자씩 다섯 글자가 됩니다.'] },
  { id: 'L2', no: 2, name: '분장실 화장대', type: '대문자 5자리', mech: 'dial', set: AZ, len: 5, hash: 'yxcg7m', related: null,
    hints: ['연관 단서가 없습니다. 무대 왼쪽 소품 책상 위 「물잔」 다섯 개로 풀립니다.',
      '컵 앞 글자를 놓인 순서대로 읽지 마세요. 물이 가장 적게 담긴 컵부터 가장 많이 담긴 컵까지, 물 높이 순서대로 글자를 읽으세요.'] },
  { id: 'L3', no: 3, name: '조명 콘솔', type: '숫자 5자리', mech: 'dial', set: DIGITS, len: 5, hash: '1ftspcb', related: 'actsQ',
    hints: ['연관 단서 「콘솔 화면의 문제」는 무대 왼쪽 안쪽 이젤의 「무대의 막」과 짝입니다.',
      'n막의 값은 숫자 n을 영어로 썼을 때의 글자 수입니다(1막 → one → 3). "2+3막"처럼 숫자를 먼저 계산한 것은 그 막 하나의 값, "7막+4막"처럼 막끼리 더한 것은 두 값의 합입니다. 화면이 묻는 다섯 값을 차례대로 적으세요.'] },
  { id: 'L4', no: 4, name: '팔로우 스포트라이트', type: '대문자 5자리', mech: 'dial', set: AZ, len: 5, hash: 'ydwzu3', related: 'routes',
    hints: ['연관 단서 「막별 동선」은 무대 바닥에 그려진 「무대 공간」(1~9번 3×3 칸)과 짝입니다.',
      '각 막의 동선을 1~9번 칸 위에 차례대로 선으로 이어 그려 보세요. 막마다 그려지는 모양이 알파벳 한 글자이고, 1막부터 5막까지 읽으면 됩니다.'] },
  { id: 'L5', no: 5, name: '플라이 레일 잠금함', type: '대문자 5자리', mech: 'dial', set: AZ, len: 5, hash: 'ob674b', related: 'calli',
    hints: ['연관 단서 「캘리그라피」는 무대 오른쪽 벽의 「알파벳 동그라미」와 짝입니다.',
      '"시작을 알리는 자리"는 1번 칸입니다. 거기서 출발해 시계 방향으로 같은 칸 수씩 건너뛰며 선을 이으면, 밤하늘에 뜨는 별 모양이 완성됩니다. 별의 꼭짓점을 지나는 순서대로 글자를 읽으세요.'] },
  { id: 'L6', no: 6, name: '무대 중앙 의자 · 대본 상자', type: '대문자 5자리', mech: 'dial', set: AZ, len: 5, hash: 'jtwfqs', related: null,
    hints: ['연관 단서가 없습니다. 무대 오른쪽 안쪽에 길게 걸린 「??」 현수막을 보세요.',
      '글자가 세로로 길게 늘어나 있습니다. 핸드폰으로 사진을 찍어 화면을 눕힌 뒤, 아래쪽 끝에서 아주 낮고 비스듬한 각도로 바라보면 납작해진 글자가 읽힙니다.'] },
];

const CAPTIONS = {
  L1: ['소품 트렁크가 덜컥 열렸다. 손때 묻은 연습 대본 한 권이 들어 있다.', '객석 쪽 분장실 거울에 전구가 하나씩 켜진다.'],
  L2: ['화장대 서랍이 열렸다. 쓰다 만 분장 도구가 굴러 나온다.', '조명 콘솔 화면이 켜지고, 문제 한 줄이 떠올랐다.'],
  L3: ['조명 콘솔에 불이 들어왔다. 무대가 한 톤 밝아진다.', '팔로우 스포트 옆 보면대에 동선표가 내려앉았다.'],
  L4: ['팔로우 스포트가 철컥 풀리고, 빛줄기가 바닥의 칸을 비춘다.', '오른쪽 벽에 붓글씨 액자 하나가 떠올랐다.'],
  L5: ['플라이 레일 잠금이 풀리고, 밧줄이 스르르 미끄러진다.', '무대 한가운데, 빈 의자 위로 핀 조명이 떨어졌다.'],
  L6: ['대본 상자가 열렸다. 첫 장은 아직 비어 있다.', '무대 옆 문 위 램프 여섯 개가 모두 초록으로 바뀌었다.'],
};

const CLUES = {
  c_symbols: { title: '이상한 기호', where: '무대 왼쪽 벽 · 칠판', media: [{ type: 'img', src: 'assets/symbols.webp', alt: '칠판에 분필로 쓴 다섯 줄. 1. 8 − [윗획] − [아랫획] / 2. 8 − [가운데획] / 3. 8 − [윗획] − [가운데획] / 4. 5 − [ ] / 5. 8 − [세로획 하나]', caption: '사진을 누르면 크게 볼 수 있어요.' }] },
  c_glasses: { title: '물잔', where: '무대 왼쪽 · 소품 책상', media: [{ type: 'img', src: 'assets/glasses.webp', alt: '투명한 컵 다섯 개. 앞에 놓인 글자는 왼쪽부터 C, O, T, R, A. 컵마다 물 높이가 다르다.' }] },
  c_acts: { title: '무대의 막', where: '무대 왼쪽 안쪽 · 이젤', media: [{ type: 'img', src: 'assets/acts.webp', alt: '1막 = 3, 3막 = 5, 2막 + 3막 = 8, 2+3막 = 4' }] },
  c_grid: { title: '무대 공간', where: '무대 바닥 · 3×3 칸', media: [{ type: 'img', src: 'assets/floorgrid.webp', alt: 'STAGE라고 적힌 벽 아래 3×3 무대 바닥 칸. 위 줄 1 2 3, 가운데 4 5 6, 아래 줄 7 8 9.' }] },
  c_wheel: { title: '알파벳 동그라미', where: '무대 오른쪽 벽', media: [{ type: 'img', src: 'assets/wheel.webp', alt: '원 위 10칸, 맨 위 1번부터 시계 방향으로 S, A, N, R, C, T, E, I, E, O.' }] },
  c_banner: { title: '??', where: '무대 오른쪽 안쪽 · 길게 걸린 현수막', media: [{ type: 'img', src: 'assets/banner.webp', alt: '세로로 아주 길게 늘어난 검은 줄무늬 이미지', caption: '(핸드폰을 이용하기를 권장)' }] },
};

const RELATED = {
  actsQ: { title: '콘솔 화면의 문제', media: [{ type: 'img', src: 'assets/acts-question.webp', alt: '7-4막, 5막, 8막, 10막, 7막+4막의 값을 차례대로 작성하시오.' }] },
  routes: { title: '막별 동선', media: [{ type: 'img', src: 'assets/routes.webp', alt: '1막의 동선: 2-1-4-5-4-7 / 2막의 동선: 1-2-3-6-9-8-7-4-1 / 3막의 동선: 3-2-1-4-7-8-9 / 4막의 동선: 1-4-7-8-9-6-3 / 5막의 동선: 3-2-1-4-5-6-9-8-7' }] },
  calli: { title: '캘리그라피', media: [{ type: 'img', src: 'assets/calligraphy.webp', alt: '모든 극은 시작을 알리는 자리에서 출발한다. 그곳에서부터 일정한 간격으로 도약하라. 움직인 궤적이 어두운 밤하늘을 수놓는 가장 찬란한 형태를 완성할 때, 진짜 무대가 열린다.' }] },
};

/* ---------------------------------------------------------------- textures */
const KR = '"Gowun Batang", "IBM Plex Sans KR", serif', STEN = '"Stardos Stencil", Georgia, serif', MONO = '"IBM Plex Mono", monospace';
function drawFloor(g, w, h) {
  const r = rng(11), n = 10, s = w / n;
  for (let i = 0; i < n; i++) {
    let y = -r() * 300;
    while (y < h) { const L = 220 + r() * 380, v = 22 + r() * 14; g.fillStyle = `rgb(${v + 10},${v + 3},${v - 3})`; g.fillRect(i * s, y, s, L); g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(i * s, y, s, 3); y += L; }
    g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(i * s, 0, 3, h);
  }
  for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,220,180' : '0,0,0'},${r() * 0.05})`; g.fillRect(r() * w, r() * h, 1 + r() * 3, 10 + r() * 60); }
  for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(230,220,190,${0.05 + r() * 0.08})`; g.save(); g.translate(r() * w, r() * h); g.rotate(r() * 3); g.fillRect(-20, -4, 40 + r() * 30, 8); g.restore(); }
}
function drawWall(g, w, h) {
  const r = rng(5);
  g.fillStyle = '#16120f'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 220; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '60,48,40' : '0,0,0'},${0.05 + r() * 0.1})`; const x = r() * w, y = r() * h, s = 20 + r() * 120; g.beginPath(); g.ellipse(x, y, s, s * (0.3 + r()), r() * 3, 0, TAU); g.fill(); }
  g.fillStyle = 'rgba(0,0,0,.45)'; for (let x = 0; x < w; x += w / 4) g.fillRect(x, 0, 4, h);
  g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(0, h * 0.86, w, h * 0.14); g.fillStyle = 'rgba(80,60,44,.4)'; g.fillRect(0, h * 0.86, w, 3);
}
function drawSunset(g, w, h) {
  const hz = h * 0.66;
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, '#191428'); gr.addColorStop(0.25, '#4a2e48'); gr.addColorStop(0.45, '#b3593a'); gr.addColorStop(0.6, '#f19a48'); gr.addColorStop(0.66, '#ffd98e'); gr.addColorStop(0.72, '#9a5a34'); gr.addColorStop(1, '#22140e');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const sg = g.createRadialGradient(w / 2, hz, 0, w / 2, hz, w * 0.45); sg.addColorStop(0, 'rgba(255,240,200,1)'); sg.addColorStop(0.06, 'rgba(255,214,140,.9)'); sg.addColorStop(0.3, 'rgba(255,150,70,.35)'); sg.addColorStop(1, 'rgba(255,120,60,0)');
  g.fillStyle = sg; g.fillRect(0, 0, w, h);
  const r = rng(31);
  for (let i = 0; i < 26; i++) { const y = h * (0.12 + r() * 0.42), x = r() * w, cw = 120 + r() * 360, ch = 10 + r() * 26; g.fillStyle = `rgba(60,30,50,${0.25 + r() * 0.35})`; g.beginPath(); g.ellipse(x, y, cw, ch, 0, 0, TAU); g.fill(); g.fillStyle = `rgba(255,170,100,${0.15 + r() * 0.25})`; g.beginPath(); g.ellipse(x, y + ch * 0.55, cw * 0.8, ch * 0.35, 0, 0, TAU); g.fill(); }
  g.fillStyle = '#fff6dc'; g.beginPath(); g.arc(w / 2, hz - 4, 26, 0, TAU); g.fill();
  /* skyline: tall towers at the sides, a low gap in the middle where the sun sets */
  for (let k = 0; k < 2; k++) {
    let x = 0;
    while (x < w) {
      const bw = 26 + r() * 70, mid = Math.abs(x + bw / 2 - w / 2) / (w / 2);
      const bh = (k ? 0.05 : 0.08) * h + r() * h * (k ? 0.12 : 0.1 + mid * mid * 0.45);
      g.fillStyle = k ? '#2a1814' : '#3c2318'; if (k) g.fillStyle = `rgb(${18 + r() * 10},${12 + r() * 6},${12})`;
      g.fillRect(x, hz + 6 - bh + (k ? 18 : 0), bw, h);
      if (k) for (let yy = hz + 24 - bh + 6; yy < h; yy += 9) for (let xx = x + 4; xx < x + bw - 4; xx += 7) if (r() < 0.18) { g.fillStyle = r() < 0.6 ? 'rgba(255,200,120,.85)' : 'rgba(255,240,210,.7)'; g.fillRect(xx, yy, 3, 4); }
      x += bw + (k ? 0 : r() * 30);
    }
  }
  /* the bright street running straight toward the sun */
  const rg = g.createLinearGradient(0, hz, 0, h); rg.addColorStop(0, 'rgba(255,230,170,.95)'); rg.addColorStop(1, 'rgba(255,170,90,.2)');
  g.fillStyle = rg; g.beginPath(); g.moveTo(w / 2 - 3, hz + 8); g.lineTo(w / 2 + 3, hz + 8); g.lineTo(w / 2 + 60, h); g.lineTo(w / 2 - 60, h); g.closePath(); g.fill();
}
function sheerTex() {
  return tex(256, 512, (g, w, h) => {
    const r = rng(17);
    for (let x = 0; x < w; x += 2) { const a = 0.22 + Math.abs(Math.sin(x * 0.07 + r())) * 0.4 + r() * 0.08; g.fillStyle = `rgba(255,240,222,${a})`; g.fillRect(x, 0, 2, h); }
    const fade = g.createLinearGradient(0, 0, 0, h); fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(0.92, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(0,0,0,1)');
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = fade; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'source-over';
  });
}
function beamTex() {
  return tex(32, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(0.5, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,.06)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
}
function paperTex(seed, lines = 12, color = '#e9e1d0') {
  return tex(256, 340, (g, w, h) => { const r = rng(seed); g.fillStyle = color; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(40,36,44,.5)'; for (let i = 0; i < lines; i++) g.fillRect(22, 30 + i * 22, 70 + r() * 140, 4); });
}
/* a lit text panel like the light boxes on the walls of the base image */
function panelTex(w, h, draw, bg = '#141110') {
  return tex(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    const v = g.createLinearGradient(0, 0, w, h); v.addColorStop(0, 'rgba(255,220,180,.07)'); v.addColorStop(1, 'rgba(0,0,0,.25)'); g.fillStyle = v; g.fillRect(0, 0, w, h);
    draw(g, w, h);
    g.strokeStyle = 'rgba(255,236,210,.28)'; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12);
  });
}
function cityBG(g, w, h, seed, dim = 0.6) {
  const r = rng(seed); const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0e1420'); gr.addColorStop(1, '#2a2026'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  let x = 0; while (x < w) { const bw = 30 + r() * 60, bh = h * (0.3 + r() * 0.55); g.fillStyle = '#0a0c12'; g.fillRect(x, h - bh, bw, bh); for (let y = h - bh + 8; y < h - 6; y += 12) for (let xx = x + 5; xx < x + bw - 5; xx += 9) if (r() < 0.3) { g.fillStyle = `rgba(255,${200 + r() * 40 | 0},140,${0.4 + r() * 0.5})`; g.fillRect(xx, y, 4, 5); } x += bw + 4; }
  g.fillStyle = `rgba(10,8,8,${dim})`; g.fillRect(0, 0, w, h);
}
function txt(g, s, x, y, size, color = '#efe6d6', font = KR, weight = 700, align = 'left') { g.font = `${weight} ${size}px ${font}`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(s, x, y); }
function wallPanel(t, w, h, x, y, z, ry, glowAmt = 0.5) {
  const g = grp(x, y, z, ry);
  mesh(bx(w + 0.05, h + 0.05, 0.03), M(0x0c0a09, { roughness: 0.6 }), 0, 0, 0, g);
  const p = plane(t, w, h, true, { roughness: 0.45, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: glowAmt }); p.position.z = 0.018; g.add(p);
  return g;
}
/* lay a mesh flat on the floor */
function flat(m, y = 0.004) { m.rotation.x = -Math.PI / 2; m.position.y = y; return m; }

/* ---------------------------------------------------------------- room */
const HH = 4.6, BEAM = beamTex();
function beam(from, to, r0, r1, color, op, parent = scene) {
  const a = V3(from), b = V3(to), d = a.clone().sub(b), L = d.length();
  const mat = new THREE.MeshBasicMaterial({ map: BEAM, color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  const m = mesh(cy(r0, r1, L, 32, true), mat, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2, parent);
  m.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize()); m.raycast = () => {}; m.renderOrder = 3;
  return m;
}
function parCan(x, y, z, aim, parent = scene) {
  const g = grp(x, y, z, 0, parent);
  mesh(cy(0.012, 0.012, 0.12, 6), M(0x111111), 0, 0.06, 0, g);
  const can = grp(0, -0.05, 0, 0, g);
  mesh(cy(0.1, 0.085, 0.26, 16), M(0x1a1a1c, { metalness: 0.6, roughness: 0.4 }), 0, 0, 0, can);
  mesh(new THREE.CircleGeometry(0.08, 16), Bm(0xffe2b0), 0, -0.131, 0, can).rotation.x = Math.PI / 2;
  const d = V3(aim).sub(V3(x, y, z)).normalize(); can.quaternion.setFromUnitVectors(V3(0, -1, 0), d);
  return g;
}

let vanity, chairSpot, followSpot;
function buildRoom() {
  /* light: a low sunset through the back opening, a warm desk lamp, dim house lights */
  scene.add(new THREE.HemisphereLight(0xffc89a, 0x0a0606, 0.16));
  scene.add(new THREE.AmbientLight(0xffffff, 0.035));
  const sun = new THREE.DirectionalLight(0xff9a52, 0.55); sun.position.set(0, 3.2, -14); sun.target.position.set(0, 0, 3); scene.add(sun, sun.target);
  const pl = (c, i, d, x, y, z) => { const l = new THREE.PointLight(c, i, d, 1); l.position.set(x, y, z); scene.add(l); return zl(1, l); };
  pl(0xff9248, 1.7, 13, 0, 1.8, -6.7);
  pl(0xffb060, 0.95, 4.5, -5.35, 1.25, 1.45);
  pl(0xffeedd, 0.32, 10, -3, 4.2, -2);
  pl(0xffeedd, 0.32, 10, 3, 4.2, -2);
  pl(0xffe8d0, 0.42, 10, 0, 4.2, 3.6);
  pl(0xffc890, 0.28, 5, -2.2, 0.3, 2.75);
  pl(0xffc890, 0.28, 5, 2.2, 0.3, 2.75);
  pl(0x7aa8ff, 0.22, 3.2, -3.2, 1.6, 5.1);

  /* floor (dark glossy boards), walls, black ceiling */
  const fl = flat(mesh(new THREE.PlaneGeometry(13, 12.5), M(0xffffff, { map: tex(1024, 1024, drawFloor, [3, 3]), roughness: 0.45, metalness: 0.15 }), 0, 0, -0.25), 0);
  void fl;
  const wall = (w, h, x, y, z, ry, rep) => { const t = tex(1024, 512, drawWall); t.wrapS = THREE.RepeatWrapping; t.repeat.set(rep, 1); const m = mesh(new THREE.PlaneGeometry(w, h), M(0xffffff, { map: t, roughness: 0.95 }), x, y, z); m.rotation.y = ry; return m; };
  wall(12.5, HH, -6.5, HH / 2, -0.25, Math.PI / 2, 3); wall(12.5, HH, 6.5, HH / 2, -0.25, -Math.PI / 2, 3);
  wall(13, HH, 0, HH / 2, 6.0, Math.PI, 3);
  /* upstage wall with the opening x -2.6..2.6, y 0..3.6 */
  wall(3.9, HH, -4.55, HH / 2, -6.5, 0, 1); wall(3.9, HH, 4.55, HH / 2, -6.5, 0, 1); wall(5.2, HH - 3.6, 0, 3.6 + (HH - 3.6) / 2, -6.5, 0, 1);
  const ceil = mesh(new THREE.PlaneGeometry(13, 12.5), M(0x0b0908, { roughness: 1 }), 0, HH, -0.25); ceil.rotation.x = Math.PI / 2;

  buildUpstage();
  buildRigging();
  buildLeft();
  buildRight();
  buildHouse();
  buildCentre();
  buildDust(0xffc890, 320, 12, 12);
}

function buildUpstage() {
  /* the opening: a short balcony floor and the sunset city backdrop */
  const sky = plane(tex(1536, 1024, drawSunset), 7.4, 4.9, false, { fog: false }); sky.position.set(0, 2.2, -9.6); scene.add(sky);
  mesh(new THREE.PlaneGeometry(5.2, 3.2), M(0x2a1c14, { roughness: 0.2, metalness: 0.4 }), 0, 0.001, -8.0).rotation.x = -Math.PI / 2;
  for (const s of [-1, 1]) { const m = mesh(new THREE.PlaneGeometry(3.2, 3.6), M(0x0d0a09, { roughness: 1 }), s * 2.6, 1.8, -8.0); m.rotation.y = -s * Math.PI / 2; }
  mesh(bx(5.4, 0.12, 0.3), M(0x0e0b0a), 0, 3.66, -6.45);
  /* a low railing silhouetted against the sun */
  const rail = M(0x0a0706, { roughness: 0.6, metalness: 0.5 });
  mesh(bx(5.2, 0.04, 0.04), rail, 0, 1.0, -9.1);
  for (let x = -2.5; x <= 2.51; x += 0.5) mesh(bx(0.03, 1.0, 0.03), rail, x, 0.5, -9.1);
  /* sun glow spilling in, and its long reflection on the wet floor */
  glow(1, 0xff9a50, 6, 4, 0, 1.6, -6.3, 0, 0.38);
  const streakT = tex(128, 512, (g, w, h) => { for (let y = 0; y < h; y++) { const a = Math.pow(1 - y / h, 1.6); const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, y, w, 1); } });
  const sm = new THREE.MeshBasicMaterial({ map: streakT, color: 0xffa860, transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const st = flat(mesh(new THREE.PlaneGeometry(1.4, 7.2), sm, 0, 0, -6.0), 0.006); st.raycast = () => {};
  const sm2 = sm.clone(); sm2.opacity = 0.18; const st2 = flat(mesh(new THREE.PlaneGeometry(5.0, 6), sm2, 0, 0, -6.5), 0.005); st2.raycast = () => {};
  /* "C-LOCK" stencilled on the header above the opening */
  const hd = plane(tex(1024, 220, (g, w, h) => { txt(g, 'C-LOCK', w / 2, h * 0.46, 150, '#dccfb4', STEN, 700, 'center'); g.fillStyle = 'rgba(220,207,180,.8)'; g.fillRect(w / 2 - 120, h * 0.86, 240, 5); }), 3.4, 0.73, true, { transparent: true, roughness: 0.9, emissive: 0xffe0b8, emissiveIntensity: 0.12 });
  hd.position.set(0, 4.08, -6.48); scene.add(hd);
  /* heavy velvet legs and the sheer curtains drawn back from the opening */
  const velvet = M(0x2a0b0a, { roughness: 0.92, side: THREE.DoubleSide });
  const wavy = (w, h, x, y, z, mat, amp, k, segs = 40) => { const geo = new THREE.PlaneGeometry(w, h, segs, 1), p = geo.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * k) * amp); geo.computeVertexNormals(); return mesh(geo, mat, x, y, z); };
  for (const s of [-1, 1]) wavy(1.3, HH - 0.05, s * 3.35, HH / 2, -6.38, velvet, 0.07, 16);
  const st3 = sheerTex();
  const sheer = M(0xffe6c8, { map: st3, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false, roughness: 1, emissive: 0xff9a50, emissiveMap: st3, emissiveIntensity: 0.4 });
  const curtains = [];
  for (const [x, w, z] of [[-1.75, 1.9, -6.05], [1.75, 1.9, -6.05], [-3.5, 1.8, -5.55], [3.5, 1.8, -5.55]]) curtains.push(wavy(w, 3.75, x, 1.9, z, sheer, 0.06, 11));
  curtains.forEach((c, i) => { c.raycast = () => {}; c.renderOrder = 4; const z0 = c.position.z; tickers.push(t => { c.position.z = z0 + Math.sin(t * 0.7 + i) * 0.03; }); });
  mesh(cy(0.02, 0.02, 9, 8), M(0x222222, { metalness: 0.6 }), 0, 3.82, -6.05).rotation.z = Math.PI / 2;
}

function buildRigging() {
  /* battens with par cans; a few soft beams for the haze */
  const pipe = M(0x1a1a1a, { metalness: 0.6, roughness: 0.4 });
  for (const z of [-4.6, -1.6, 1.4]) { mesh(cy(0.025, 0.025, 11, 8), pipe, 0, 4.25, z).rotation.z = Math.PI / 2; mesh(cy(0.006, 0.006, 0.35, 4), pipe, -4, 4.42, z); mesh(cy(0.006, 0.006, 0.35, 4), pipe, 4, 4.42, z); }
  const aims = [[-3.6, -4.6, -3.2, 0, -3.5], [-1.2, -4.6, -0.3, 0, -3.2], [1.2, -4.6, 0.6, 0, -3.0], [3.6, -4.6, 3.4, 0, -4.2],
    [-4.2, -1.6, -5.4, 0, -1.0], [-1.4, -1.6, 0, 0, 0.3], [1.4, -1.6, 0.5, 0, 0.5], [4.2, -1.6, 5.6, 0, -1.0], [-3.0, 1.4, -4.7, 0, 1.6], [3.0, 1.4, 4.5, 0, 3.0]];
  aims.forEach(([x, z, ax, ay, az]) => parCan(x, 4.16, z, [ax, ay, az]));
  beam([-1.2, 4.0, -4.6], [-0.3, 0, -3.2], 0.08, 0.7, 0xffd2a0, 0.07);
  beam([3.6, 4.0, -4.6], [3.4, 0.6, -4.3], 0.08, 0.6, 0xffe8c8, 0.06);
  beam([-3.0, 4.0, 1.4], [-4.7, 0.4, 1.6], 0.08, 0.6, 0xffc890, 0.05);
  /* footlights along the edge of the playing area */
  for (let x = -3.6; x <= 3.61; x += 0.45) {
    mesh(bx(0.14, 0.05, 0.08), M(0x111111, { metalness: 0.5 }), x, 0.025, 2.7);
    mesh(new THREE.SphereGeometry(0.03, 10, 6, 0, TAU, 0, Math.PI / 2), Bm(0xffd9a0), x, 0.05, 2.66);
  }
  for (const x of [-2.2, 0, 2.2]) { const m = flat(mesh(new THREE.PlaneGeometry(2.4, 1.2), new THREE.MeshBasicMaterial({ map: glowTex(), color: 0xff9a50, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), x, 0, 2.4), 0.007); m.raycast = () => {}; }
}
let _glowT;
function glowTex() { return _glowT || (_glowT = tex(256, 256, (g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.4, 'rgba(255,255,255,.4)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); })); }

function buildLeft() {
  const R = Math.PI / 2;
  /* wall panels from the base image */
  wallPanel(panelTex(460, 680, (g, w) => {
    txt(g, '정답이', 44, 90, 62); txt(g, '정해진 세상', 44, 168, 62);
    ['EXPECTATION', 'STANDARD', 'SCORE'].forEach((s, i) => { txt(g, s, 48, 330 + i * 92, 34, '#d8cdbd', MONO, 600); g.strokeStyle = '#d8cdbd'; g.lineWidth = 3; g.strokeRect(w - 96, 312 + i * 92, 36, 36); });
  }), 1.15, 1.7, -6.46, 2.5, -4.6, R);
  wallPanel(panelTex(480, 300, (g) => { txt(g, '남들이 만든 기준에', 40, 110, 50); txt(g, '맞추느라', 40, 190, 50); }), 1.2, 0.75, -6.46, 2.95, -2.95, R);
  wallPanel(panelTex(360, 320, (g, w) => {
    const c = [w / 2, 140], rr = 95; g.fillStyle = '#e9e1d2'; g.beginPath(); g.arc(c[0], c[1], rr, 0, TAU); g.fill(); g.strokeStyle = '#2a2420'; g.lineWidth = 6; g.stroke();
    g.fillStyle = '#2a2420'; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.fillRect(c[0] + Math.sin(a) * (rr - 14) - 3, c[1] - Math.cos(a) * (rr - 14) - 3, 6, 6); }
    const hand = (a, L, wd) => { g.lineWidth = wd; g.lineCap = 'round'; g.beginPath(); g.moveTo(c[0], c[1]); g.lineTo(c[0] + Math.sin(a) * L, c[1] - Math.cos(a) * L); g.stroke(); };
    hand(10.2 / 12 * TAU, 52, 8); hand(0.62 * TAU, 78, 5);
    txt(g, '정해진 시간', w / 2, 280, 40, '#efe6d6', KR, 700, 'center');
  }), 0.9, 0.8, -6.46, 1.75, -2.95, R, 0.4);
  wallPanel(panelTex(520, 260, (g, w, h) => {
    const r = rng(8); for (let i = 0; i < 26; i++) { const x = 10 + i * 20 + r() * 6, hh = 40 + r() * 30; g.fillStyle = 'rgba(0,0,0,.55)'; g.beginPath(); g.arc(x, h - hh - 6, 9, 0, TAU); g.fill(); g.fillRect(x - 10, h - hh + 2, 20, hh); }
    txt(g, '보여주기 위한 삶', 40, 90, 54);
  }), 1.3, 0.65, -6.46, 2.5, 0.95, R);
  wallPanel(panelTex(280, 360, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2a2622'); gr.addColorStop(1, '#100d0b'); g.fillStyle = gr; g.fillRect(12, 12, w - 24, h - 24);
    g.fillStyle = '#4a4038'; g.beginPath(); g.ellipse(w / 2, 150, 62, 74, 0, 0, TAU); g.fill();
    g.fillStyle = '#b89a80'; g.beginPath(); g.ellipse(w / 2, 162, 40, 50, 0, 0, TAU); g.fill();
    g.fillStyle = '#2a221c'; g.beginPath(); g.ellipse(w / 2, 128, 46, 26, 0, Math.PI, TAU); g.fill();
    g.fillStyle = '#3a322c'; g.beginPath(); g.moveTo(40, h - 12); g.quadraticCurveTo(w / 2, 190, w - 40, h - 12); g.fill();
  }, '#1a1512'), 0.62, 0.8, -6.46, 2.35, 2.45, R, 0.3);

  /* chalkboard with the strange symbols — c_symbols, and the prop trunk in front of it — L1 */
  { const g = grp(-6.44, 0, -0.95, R);
    mesh(bx(2.05, 1.18, 0.04), M(0x2a1a10), 0, 1.9, 0, g);
    const t = imgTex('assets/symbols.webp');
    const b = plane(t, 1.96, 1.08, true, { roughness: 0.9, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.35 }); b.position.set(0, 1.9, 0.025); g.add(b);
    makeInteract(g, 'clue', 'c_symbols', '이상한 기호 · 칠판', 2.65); b.userData.proxy = g;
    /* little picture light */
    mesh(bx(0.6, 0.05, 0.1), M(0x1a1a1a, { metalness: 0.6 }), 0, 2.58, 0.1, g);
    glow(1, 0xfff0d0, 2.0, 1.0, 0, 2.3, 0.04, 0, 0.18, g); }
  { const g = grp(-5.85, 0, -0.95, R);
    const wood = M(0x3a2618, { roughness: 0.7 }), trim = M(0x8a6a3a, { metalness: 0.7, roughness: 0.35 });
    mesh(bx(1.0, 0.5, 0.52), wood, 0, 0.27, 0, g);
    mesh(bx(1.02, 0.12, 0.54), M(0x2e1e12, { roughness: 0.7 }), 0, 0.56, 0, g);
    for (const x of [-0.48, 0.48]) for (const y of [0.04, 0.6]) mesh(bx(0.07, 0.07, 0.56), trim, x, y, 0, g);
    mesh(bx(1.04, 0.03, 0.56), trim, 0, 0.5, 0, g);
    const lb = plane(tex(256, 80, (c, w, h) => { c.fillStyle = 'rgba(0,0,0,0)'; c.clearRect(0, 0, w, h); txt(c, 'PROPS · 소품', w / 2, h / 2 + 2, 40, '#d8c7a4', STEN, 700, 'center'); }), 0.44, 0.14, true, { transparent: true });
    lb.position.set(-0.22, 0.3, 0.262); g.add(lb);
    locks3d.L1 = padlock(g, 0.22, 0.44, 0.29, 0.9);
    makeInteract(g, 'lock', 'L1', '소품 트렁크', 1.05);
    collide(-5.85, -0.95, 0.6, 1.1); }

  /* the act board on an easel, upstage left — c_acts */
  { const g = grp(-3.7, 0, -4.4, 0.42);
    const w = M(0x3a2a1c, { roughness: 0.7 });
    for (const s of [-1, 1]) { const l = mesh(bx(0.05, 1.8, 0.05), w, s * 0.42, 0.88, 0.05, g); l.rotation.z = -s * 0.12; l.rotation.x = -0.12; }
    const bk = mesh(bx(0.05, 1.7, 0.05), w, 0, 0.82, -0.3, g); bk.rotation.x = 0.25;
    mesh(bx(1.1, 0.04, 0.08), w, 0, 0.9, 0.12, g);
    const fr = framed(g, imgTex('assets/acts.webp'), 1.02, 0.68, 0, 1.3, 0.1, 0, 0x16110d, 0.04); fr.rotation.x = -0.12;
    const tag = plane(tex(256, 64, (c, ww, hh) => { c.fillStyle = '#16110d'; c.fillRect(0, 0, ww, hh); txt(c, 'ACT · 막', ww / 2, hh / 2 + 2, 34, '#e6d2a8', STEN, 700, 'center'); }), 0.38, 0.095, true);
    tag.position.set(0, 1.74, 0.08); tag.rotation.x = -0.12; g.add(tag);
    makeInteract(g, 'clue', 'c_acts', '무대의 막 · 이젤', 2.05);
    collide(-3.7, -4.4, 1.0, 0.7); }

  /* the prop desk: lamp, laptop, papers, five water glasses — c_glasses */
  { const g = grp(-4.7, 0, 1.55, 0);
    const wood = M(0x2a1e16, { roughness: 0.55 });
    const top = mesh(bx(1.9, 0.05, 0.8), wood, 0, 0.76, 0, g);
    for (const [x, z] of [[-0.9, -0.35], [0.9, -0.35], [-0.9, 0.35], [0.9, 0.35]]) mesh(bx(0.05, 0.74, 0.05), wood, x, 0.37, z, g);
    mesh(bx(0.5, 0.5, 0.7), M(0x241a13, { roughness: 0.6 }), -0.65, 0.49, 0, g);
    /* lamp */
    mesh(cy(0.09, 0.1, 0.03, 16), M(0x1a1a1a, { metalness: 0.6 }), -0.72, 0.8, -0.22, g);
    const arm = mesh(cy(0.012, 0.012, 0.5, 8), M(0x1a1a1a, { metalness: 0.6 }), -0.66, 1.03, -0.22, g); arm.rotation.z = -0.25;
    const sh = mesh(cy(0.035, 0.12, 0.14, 16, true), M(0x1d1d1d, { side: THREE.DoubleSide, metalness: 0.5, roughness: 0.4 }), -0.52, 1.24, -0.2, g); sh.rotation.z = 0.7;
    mesh(new THREE.SphereGeometry(0.035, 10, 8), Bm(0xffe2a8), -0.5, 1.2, -0.2, g);
    glow(1, 0xffb060, 0.9, 0.9, -0.5, 1.2, -0.12, 0, 0.35, g);
    /* laptop */
    const lp = grp(-0.12, 0.785, -0.08, 0.2, g);
    mesh(bx(0.38, 0.02, 0.26), M(0x2c2c30, { metalness: 0.6, roughness: 0.35 }), 0, 0, 0, lp);
    const scr = grp(0, 0.01, -0.13, 0, lp); scr.rotation.x = -0.32;
    mesh(bx(0.38, 0.25, 0.012), M(0x2c2c30, { metalness: 0.6, roughness: 0.35 }), 0, 0.125, 0, scr);
    const lt = tex(256, 168, (c, w, h) => { c.fillStyle = '#0d1420'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(140,180,255,.5)'; for (let i = 0; i < 9; i++) c.fillRect(18, 22 + i * 15, 60 + (i * 37) % 150, 5); });
    const sp = plane(lt, 0.34, 0.21); sp.position.set(0, 0.125, 0.007); scr.add(sp);
    /* pencil cup, books, papers */
    mesh(cy(0.045, 0.04, 0.11, 14), M(0x3a3a3a, { metalness: 0.5 }), -0.38, 0.84, -0.25, g);
    for (let i = 0; i < 4; i++) { const p = mesh(cy(0.006, 0.006, 0.17, 6), M([0xd8b040, 0x2a2a2a, 0xc04030, 0xe8e0d0][i]), -0.38 + (i - 1.5) * 0.015, 0.92, -0.25, g); p.rotation.z = (i - 1.5) * 0.15; }
    mesh(bx(0.24, 0.05, 0.17), M(0x4a2a24), 0.62, 0.81, -0.24, g); mesh(bx(0.22, 0.04, 0.16), M(0x2a3a4a), 0.63, 0.855, -0.24, g).rotation.y = 0.2;
    const r = rng(4);
    for (let i = 0; i < 4; i++) { const p = plane(paperTex(60 + i, 10), 0.21, 0.28, true); p.rotation.x = -Math.PI / 2; p.rotation.z = (r() - 0.5) * 1.4; p.position.set(-0.45 + r() * 0.5, 0.787 + i * 0.001, 0.12 + r() * 0.15); g.add(p); }
    /* the glasses: C O T R A, water levels as in the photo (low to high: A, C, T, O, R) */
    const gg = grp(0.32, 0, 0.16, 0, g);
    const glassMat = M(0xeef6fb, { transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.1, side: THREE.DoubleSide, depthWrite: false });
    const waterMat = M(0x9ccde6, { transparent: true, opacity: 0.6, roughness: 0.06, emissive: 0x143848, emissiveIntensity: 0.6 });
    const H = 0.15;
    [['C', 0.36], ['O', 0.76], ['T', 0.55], ['R', 0.86], ['A', 0.2]].forEach(([ch, lv], i) => {
      const x = -0.32 + i * 0.16;
      const gl = mesh(cy(0.05, 0.04, H, 22, true), glassMat, x, 0.785 + H / 2, 0, gg); gl.renderOrder = 5;
      mesh(cy(0.04, 0.04, 0.006, 22), glassMat, x, 0.788, 0, gg);
      const wh = H * lv; mesh(cy(0.04 + 0.009 * lv, 0.038, wh, 22), waterMat, x, 0.79 + wh / 2, 0, gg);
      const card = plane(tex(96, 72, (c, w, h) => { c.fillStyle = '#f2efe8'; c.fillRect(0, 0, w, h); txt(c, ch, w / 2, h / 2 + 3, 52, '#1a1a1a', MONO, 600, 'center'); }), 0.075, 0.056, true, { emissive: 0xffffff, emissiveIntensity: 0.15 });
      card.rotation.x = -1.2; card.position.set(x, 0.8, 0.12); gg.add(card);
    });
    makeInteract(gg, 'clue', 'c_glasses', '물잔', 0.55);
    top.userData.proxy = gg;
    collide(-4.7, 1.55, 2.0, 0.9); }
  /* a chair pushed out from the desk */
  chair(-4.4, 2.4, Math.PI + 0.4, 0x241b15);

  /* stage door at the front of the left wall */
  exitDoor({ x: -6.5, z: 4.4, ry: -Math.PI / 2, leaf: 0x2c2420, frame: 0x6a5a48, sign: 'EXIT' });
  { const s = plane(tex(512, 96, (c, w, h) => { c.fillStyle = '#121010'; c.fillRect(0, 0, w, h); txt(c, 'STAGE DOOR', w / 2, h / 2 + 4, 62, '#e6d6b6', STEN, 700, 'center'); }), 1.1, 0.2, true, { emissive: 0xffffff, emissiveIntensity: 0.25 });
    s.position.set(-6.46, 3.95, 4.4); s.rotation.y = Math.PI / 2; scene.add(s); }
  /* scattered papers on the floor */
  const r = rng(12);
  for (let i = 0; i < 12; i++) { const p = plane(paperTex(200 + i, 8 + (r() * 6 | 0)), 0.21, 0.28, true, { roughness: 0.9 }); flat(p, 0.008 + i * 0.0004); p.rotation.z = r() * TAU; p.position.x = -4.6 + r() * 3.8; p.position.z = -0.6 + r() * 3.6; scene.add(p); }
}

function chair(x, z, ry, color, parent = scene) {
  const g = grp(x, 0, z, ry, parent);
  const m = M(color, { roughness: 0.45, metalness: 0.2 });
  mesh(bx(0.46, 0.04, 0.44), m, 0, 0.47, 0, g);
  for (const [lx, lz] of [[-0.2, -0.19], [0.2, -0.19], [-0.2, 0.19], [0.2, 0.19]]) mesh(bx(0.03, 0.47, 0.03), m, lx, 0.235, lz, g);
  for (const lx of [-0.2, 0.2]) mesh(bx(0.03, 0.5, 0.03), m, lx, 0.72, -0.2, g);
  mesh(bx(0.44, 0.24, 0.025), m, 0, 0.84, -0.2, g);
  collide(x, z, 0.55, 0.55);
  return g;
}

function buildRight() {
  const R = -Math.PI / 2;
  /* the tall ?? banner hanging from the upstage batten — c_banner (read it by tilting a phone) */
  { const g = grp(3.45, 0, -4.75, -0.28);
    const t = imgTex('assets/banner.webp');
    const bh = 3.0, bw = bh * 155 / 785;
    const b = plane(t, bw, bh, true, { roughness: 0.9, side: THREE.DoubleSide, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.3 }); b.position.set(0, 1.18 + bh / 2, 0); g.add(b);
    mesh(cy(0.015, 0.015, bw + 0.12, 8), M(0x222222, { metalness: 0.6 }), 0, 1.18 + bh + 0.02, 0, g).rotation.z = Math.PI / 2;
    mesh(cy(0.02, 0.02, bw + 0.1, 8), M(0x222222, { metalness: 0.6 }), 0, 1.16, 0, g).rotation.z = Math.PI / 2;
    for (const s of [-1, 1]) mesh(cy(0.004, 0.004, 4.25 - (1.2 + bh), 4), M(0x444444), s * bw / 2, (4.25 + 1.2 + bh) / 2, 0, g);
    makeInteract(g, 'clue', 'c_banner', '?? · 긴 현수막', 0.95); b.userData.proxy = g; }

  /* upstage right panel: 비교하고 평가받는 무대 위의 우리 */
  wallPanel(panelTex(440, 600, (g, w, h) => { cityBG(g, w, h, 21, 0.45); txt(g, '비교하고', 40, 90, 52); txt(g, '평가받는', 40, 160, 52); txt(g, '무대 위의 우리', 40, 230, 52); }), 1.1, 1.5, 6.46, 2.7, -5.4, R);

  /* letter wheel — c_wheel */
  { const g = grp(6.44, 0, -3.1, R);
    mesh(cy(0.82, 0.82, 0.04, 48), M(0x141110), 0, 2.2, 0, g).rotation.x = Math.PI / 2;
    /* redrawn from the clue photo so the tiles read from across the stage (the modal shows the original) */
    const t = tex(1024, 1024, (c, w, h) => {
      const gr = c.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, w / 2); gr.addColorStop(0, '#5a5550'); gr.addColorStop(1, '#2a2725'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
      const rr = rng(3); for (let i = 0; i < 40; i++) { c.strokeStyle = `rgba(0,0,0,${0.1 + rr() * 0.15})`; c.lineWidth = 1 + rr() * 2; c.beginPath(); const x = rr() * w, y = rr() * h; c.moveTo(x, y); c.lineTo(x + (rr() - 0.5) * 120, y + (rr() - 0.5) * 120); c.stroke(); }
      const R0 = 340; c.strokeStyle = 'rgba(20,18,16,.8)'; c.lineWidth = 4; c.beginPath(); c.arc(w / 2, h / 2, R0, 0, TAU); c.stroke();
      'SANRCTEIEO'.split('').forEach((ch, i) => {
        const a = i / 10 * TAU, x = w / 2 + Math.sin(a) * R0, y = h / 2 - Math.cos(a) * R0;
        c.fillStyle = '#3e3a36'; c.fillRect(x - 54, y - 54, 108, 108); c.strokeStyle = '#1a1816'; c.lineWidth = 4; c.strokeRect(x - 54, y - 54, 108, 108);
        txt(c, ch, x, y + 6, 84, '#e8e0d0', 'Georgia, serif', 400, 'center');
        txt(c, String(i + 1), w / 2 + Math.sin(a) * (R0 + 100), h / 2 - Math.cos(a) * (R0 + 100) + 2, 40, '#d8d0c0', 'Georgia, serif', 400, 'center');
      });
    });
    const d = mesh(new THREE.CircleGeometry(0.78, 64), M(0xffffff, { map: t, roughness: 0.8, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.4 }), 0, 2.2, 0.025, g);
    mesh(new THREE.TorusGeometry(0.79, 0.022, 10, 64), M(0x9a7a44, { metalness: 0.8, roughness: 0.3 }), 0, 2.2, 0.03, g);
    makeInteract(g, 'clue', 'c_wheel', '알파벳 동그라미', 3.15); d.userData.proxy = g;
    glow(1, 0xffe0b0, 2.2, 2.2, 0, 2.2, 0.02, 0, 0.12, g); }

  /* fly rail: rope lines, pin rail and a steel lock box — L5 */
  { const g = grp(6.32, 0, -1.0, R);
    const steel = M(0x3a3c40, { metalness: 0.7, roughness: 0.4 }), rope = M(0xb8a47a, { roughness: 0.95 });
    mesh(bx(1.6, 0.08, 0.1), steel, 0, 1.0, 0.05, g); mesh(bx(1.6, 0.08, 0.1), steel, 0, 3.6, 0.05, g);
    for (let i = 0; i < 7; i++) { const x = -0.7 + i * 0.233; mesh(cy(0.012, 0.012, 4.4, 6), rope, x, 2.25, 0.12, g); mesh(cy(0.015, 0.015, 0.22, 8), M(0x8a6a3a), x, 1.0, 0.18, g).rotation.x = Math.PI / 2; }
    mesh(bx(0.5, 0.56, 0.22), steel, 0, 1.55, 0.2, g);
    mesh(bx(0.44, 0.5, 0.01), M(0x4a4e54, { metalness: 0.7, roughness: 0.35 }), 0, 1.55, 0.315, g);
    const lb = plane(tex(256, 64, (c, w, h) => { c.fillStyle = '#d8b040'; c.fillRect(0, 0, w, h); txt(c, 'FLY · RAIL', w / 2, h / 2 + 2, 36, '#1a1408', STEN, 700, 'center'); }), 0.3, 0.075, true);
    lb.position.set(0, 1.74, 0.322); g.add(lb);
    locks3d.L5 = padlock(g, 0, 1.46, 0.35, 0.95);
    makeInteract(g, 'lock', 'L5', '플라이 레일 잠금함', 2.05);
    collide(6.15, -1.0, 0.6, 1.7);
    onRopes = (u) => { g.children.forEach(c => { if (c.geometry && c.geometry.type === 'CylinderGeometry' && c.material === rope) c.position.y = 2.25 - u * 0.25; }); }; }

  /* calligraphy that wakes on the wall after L4 — L5's related clue */
  { const g = grp(6.43, 2.15, 0.55, R);
    mesh(bx(1.32, 0.9, 0.04), M(0x1a1410, { roughness: 0.6 }), 0, 0, 0, g);
    const t = imgTex('assets/calligraphy.webp');
    const p = plane(t, 1.24, 0.83, true, { roughness: 0.8, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.3 }); p.position.z = 0.022; g.add(p);
    g.visible = false;
    props.L5 = { kind: 'fade', m: g, drop: 0.3 }; }

  /* panels: 이제는 내가 선택하는 방향으로 / checklist / C-LOCK RE:START */
  wallPanel(panelTex(440, 500, (g, w, h) => { cityBG(g, w, h, 33, 0.55); txt(g, '이제는', 40, 110, 50); txt(g, '내가 선택하는', 40, 180, 50); txt(g, '방향으로', 40, 250, 50); }), 1.1, 1.25, 6.46, 2.55, 2.0, R);
  wallPanel(panelTex(400, 420, (g) => {
    ['나의 기준', '나의 속도', '나의 방식', '나의 시간'].forEach((s, i) => { const y = 80 + i * 84; g.strokeStyle = '#efe6d6'; g.lineWidth = 4; g.strokeRect(40, y - 20, 40, 40); g.beginPath(); g.moveTo(48, y); g.lineTo(58, y + 11); g.lineTo(76, y - 13); g.stroke(); txt(g, s, 104, y + 2, 44); });
  }), 0.95, 1.0, 6.46, 1.95, 3.3, R);
  { const n = plane(tex(160, 140, (c, w, h) => { c.fillStyle = '#e8c96a'; c.fillRect(0, 0, w, h); txt(c, '천천히,', 14, 46, 30, '#3a2a10', KR); txt(c, '내 속도로', 14, 94, 30, '#3a2a10', KR); }), 0.24, 0.21, true, { emissive: 0xffffff, emissiveIntensity: 0.12 });
    n.position.set(6.44, 1.42, 3.72); n.rotation.y = R; n.rotation.z = 0.06; scene.add(n); }
  wallPanel(panelTex(480, 300, (g, w) => { glowText(g, 'C-LOCK', w / 2, 120, `700 92px ${STEN}`, '#ffe6c0', 18); g.globalAlpha = 0.85; glowText(g, 'RE:START', w / 2, 220, `700 52px ${STEN}`, '#ffb070', 14); g.globalAlpha = 1; }, '#0e0c0b'), 1.2, 0.75, 6.46, 2.7, 4.6, R, 0.75);
  glow(1, 0xffc890, 1.8, 1.2, 6.42, 2.7, 4.6, R, 0.16);

  /* follow spot on a tripod, aimed at the stage — L4 */
  { const g = grp(4.5, 0, 3.75, 0.92);
    const blk = M(0x1c1c1e, { metalness: 0.5, roughness: 0.4 });
    for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; const l = mesh(cy(0.015, 0.015, 1.25, 6), blk, Math.sin(a) * 0.22, 0.6, Math.cos(a) * 0.22, g); l.rotation.set(Math.cos(a) * 0.35, 0, -Math.sin(a) * 0.35); }
    mesh(cy(0.03, 0.03, 0.3, 8), blk, 0, 1.25, 0, g);
    const head = grp(0, 1.42, 0, 0, g); head.rotation.x = -0.24;
    const can = mesh(cy(0.13, 0.15, 0.9, 20), blk, 0, 0, 0, head); can.rotation.x = Math.PI / 2;
    mesh(cy(0.16, 0.16, 0.06, 20), M(0x2a2a2c, { metalness: 0.7 }), 0, 0, -0.46, head).rotation.x = Math.PI / 2;
    mesh(new THREE.CircleGeometry(0.12, 20), Bm(0x5a4a38), 0, 0, -0.495, head).rotation.y = Math.PI;
    mesh(bx(0.03, 0.03, 0.3), blk, 0, 0, 0.55, head);
    mesh(bx(0.24, 0.2, 0.06), blk, 0, 0, 0.47, head);
    locks3d.L4 = padlock(head, 0, 0.0, 0.52, 0.85);
    makeInteract(g, 'lock', 'L4', '팔로우 스포트라이트', 1.95);
    can.userData.proxy = g;
    collide(4.5, 3.75, 0.8, 0.8);
    g.updateMatrixWorld(true);
    const lens = head.localToWorld(V3(0, 0, -0.5)), aim = V3(0.0, 0.0, 0.25);
    const bm = beam(lens.toArray(), aim.toArray(), 0.1, 0.65, 0xfff2da, 0); bm.visible = false;
    const sl = new THREE.SpotLight(0xfff0d8, 0, 12, 0.16, 0.5, 1); sl.position.copy(lens); sl.target.position.copy(aim); scene.add(sl, sl.target);
    const lensM = head.children.find(c => c.geometry && c.geometry.type === 'CircleGeometry');
    followSpot = { bm, sl, lensM }; }

  /* music stand beside it where the route sheet lands — L4's related clue */
  { const g = grp(5.45, 0, 2.3, -1.25);
    const blk = M(0x161616, { metalness: 0.6, roughness: 0.4 });
    mesh(cy(0.012, 0.012, 1.05, 6), blk, 0, 0.55, 0, g);
    for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + 0.3; const l = mesh(cy(0.008, 0.008, 0.36, 5), blk, Math.sin(a) * 0.14, 0.08, Math.cos(a) * 0.14, g); l.rotation.set(Math.cos(a) * 1.1, 0, -Math.sin(a) * 1.1); }
    const desk = grp(0, 1.12, 0, 0, g); desk.rotation.x = -0.5;
    mesh(bx(0.56, 0.4, 0.015), blk, 0, 0, 0, desk);
    mesh(bx(0.56, 0.03, 0.05), blk, 0, -0.2, 0.025, desk);
    const sheet = plane(imgTex('assets/routes.webp'), 0.5, 0.375, true, { roughness: 0.85, emissive: 0xffffff, emissiveIntensity: 0.12 });
    sheet.position.set(0, 0.01, 0.01); sheet.visible = false; desk.add(sheet);
    props.L4 = { kind: 'fade', m: sheet, drop: 0.25 };
    collide(5.45, 2.3, 0.4, 0.4); }
  /* close the nook between the stand, the follow spot and the bag so nobody gets wedged against the wall */
  collide(5.75, 2.3, 0.9, 0.4); collide(5.7, 3.6, 0.9, 1.4);

  /* sneakers and a bag on the floor */
  { const g = grp(5.35, 0, 5.15, 0.4);
    for (const s of [-1, 1]) { const sh = grp(s * 0.12, 0, s * 0.03, s * 0.12, g); mesh(bx(0.11, 0.03, 0.28), M(0xe8e4dc), 0, 0.015, 0, sh); mesh(bx(0.1, 0.07, 0.24), M(0x22252a, { roughness: 0.7 }), 0, 0.06, 0.01, sh); mesh(bx(0.1, 0.05, 0.08), M(0x22252a), 0, 0.11, 0.08, sh); } }
  { const b = mesh(new THREE.SphereGeometry(0.28, 16, 12), M(0x1c1a18, { roughness: 0.85 }), 5.85, 0.2, 4.7); b.scale.set(1.2, 0.75, 0.9); collide(5.85, 4.7, 0.6, 0.5); }
}

let onRopes = () => {};

function buildHouse() {
  const B = Math.PI;
  poster({ x: 0.2, z: 5.97, ry: B, y: 2.25, w: 1.65, h: 1.1 });

  /* dressing-room vanity with a bulb mirror — L2 (bulbs wake as its reveal) */
  { const g = grp(3.4, 0, 5.72, B);
    const wood = M(0x2a1e18, { roughness: 0.5 });
    mesh(bx(1.4, 0.05, 0.52), wood, 0, 0.76, 0, g);
    mesh(bx(1.4, 0.72, 0.48), M(0x231913, { roughness: 0.55 }), 0, 0.37, -0.01, g);
    mesh(bx(0.6, 0.2, 0.02), M(0x33251c), 0, 0.6, 0.24, g);
    mesh(bx(0.14, 0.03, 0.03), M(0x9a7a44, { metalness: 0.8, roughness: 0.3 }), 0, 0.6, 0.26, g);
    locks3d.L2 = padlock(g, 0.22, 0.56, 0.27, 0.8);
    mesh(bx(1.25, 1.0, 0.04), M(0x15100c, { roughness: 0.6 }), 0, 1.55, -0.24, g);
    const mt = tex(256, 200, (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#3a332e'); gr.addColorStop(0.5, '#1c1a1a'); gr.addColorStop(1, '#2c2622'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(255,200,140,.12)'; c.beginPath(); c.ellipse(w * 0.62, h * 0.4, 40, 70, 0.3, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.06)'; for (let i = 0; i < 3; i++) c.fillRect(30 + i * 22, 0, 8, h); });
    const mirror = plane(mt, 0.98, 0.76, true, { roughness: 0.15, metalness: 0.3 }); mirror.position.set(0, 1.55, -0.215); g.add(mirror);
    const bulbs = [];
    const pos = []; for (let i = 0; i < 5; i++) pos.push([-0.5 + i * 0.25, 2.0]); for (let j = 0; j < 3; j++) { pos.push([-0.57, 1.82 - j * 0.24]); pos.push([0.57, 1.82 - j * 0.24]); }
    pos.forEach(([x, y]) => { const m = mesh(new THREE.SphereGeometry(0.035, 12, 8), Bm(0x3a2c1c), x, y, -0.2, g); bulbs.push(m); });
    const halo = glow(1, 0xffd9a0, 1.8, 1.4, 0, 1.6, -0.19, 0, 0, g);
    const vl = new THREE.PointLight(0xffd9a0, 0, 4, 1); vl.position.set(0, 1.6, 0.25); g.add(vl);
    /* makeup things */
    mesh(cy(0.02, 0.02, 0.09, 10), M(0x8a1a22), -0.4, 0.83, 0.05, g);
    mesh(cy(0.05, 0.05, 0.03, 16), M(0xd8c0a8), -0.25, 0.8, 0.1, g);
    for (let i = 0; i < 3; i++) { const b = mesh(cy(0.006, 0.01, 0.16, 6), M(0x3a2a20), 0.3 + i * 0.04, 0.79, 0.08, g); b.rotation.z = Math.PI / 2; b.rotation.y = i * 0.3; }
    vanity = { bulbs, halo, vl };
    props.L2 = { kind: 'custom', reveal: (instant) => tween(1.6, u => {
      bulbs.forEach((b, i) => b.material.color.setHex(u >= 1 || u * bulbs.length > i + Math.random() * 0.6 ? 0xffe6b0 : 0x3a2c1c));
      halo.material.opacity = 0.55 * ease(u); vl.intensity = 0.9 * ease(u);
    }, instant) };
    makeInteract(g, 'lock', 'L2', '분장실 화장대', 2.35);
    collide(3.4, 5.72, 1.5, 0.65); }

  /* lighting console with a monitor — L3 (the monitor wakes with the question) */
  { const g = grp(-3.2, 0, 5.65, B);
    const blk = M(0x18181a, { metalness: 0.4, roughness: 0.5 });
    mesh(bx(1.5, 0.05, 0.62), M(0x221a14, { roughness: 0.5 }), 0, 0.8, 0, g);
    mesh(bx(1.5, 0.78, 0.58), M(0x1a1512, { roughness: 0.6 }), 0, 0.39, -0.01, g);
    const desk = grp(0, 0.86, 0.06, 0, g); desk.rotation.x = 0.18;
    mesh(bx(1.2, 0.07, 0.42), blk, 0, 0, 0, desk);
    const r = rng(9);
    for (let i = 0; i < 16; i++) { const x = -0.52 + i * 0.07; mesh(bx(0.012, 0.004, 0.16), M(0x050505), x, 0.037, 0.06, desk); mesh(bx(0.03, 0.02, 0.02), M(0xd8d8d8), x, 0.045, 0.02 + r() * 0.08, desk); mesh(new THREE.SphereGeometry(0.008, 6, 4), Bm(r() < 0.5 ? 0x5fd38d : 0xff7a3a), x, 0.04, -0.14, desk); }
    mesh(cy(0.03, 0.06, 0.25, 8), blk, 0, 1.0, -0.18, g);
    mesh(bx(0.86, 0.64, 0.05), blk, 0, 1.45, -0.18, g);
    const off = tex(512, 384, (c, w, h) => { c.fillStyle = '#05070a'; c.fillRect(0, 0, w, h); c.fillStyle = '#1a2a3a'; c.font = `600 34px ${MONO}`; c.textAlign = 'center'; c.fillText('STANDBY', w / 2, h / 2 + 10); });
    const scr = plane(off, 0.8, 0.6); scr.position.set(0, 1.45, -0.152); g.add(scr);
    /* the question from the clue image, set large so it reads from the room (the modal shows the original) */
    const on = tex(512, 384, (c, w, h) => { c.fillStyle = '#f4f2ee'; c.fillRect(0, 0, w, h); ['7-4막, 5막, 8막,', '10막, 7막+4막의', '값을 차례대로', '작성하시오.'].forEach((l, i) => txt(c, l, w / 2, 92 + i * 66, 46, '#1a1a1a', KR, 700, 'center')); });
    props.L3 = { kind: 'screen', mat: scr.material, on };
    locks3d.L3 = padlock(g, 0.5, 0.68, 0.33, 0.85);
    makeInteract(g, 'lock', 'L3', '조명 콘솔', 2.1);
    collide(-3.2, 5.65, 1.6, 0.75); }

  /* a cue light and a sign by the door */
  { const s = plane(tex(512, 128, (c, w, h) => { c.fillStyle = '#121010'; c.fillRect(0, 0, w, h); txt(c, 'QUIET PLEASE · 공연 중', w / 2, h / 2 + 4, 44, '#d9c8a8', STEN, 700, 'center'); }), 1.3, 0.32, true, { emissive: 0xffffff, emissiveIntensity: 0.08 });
    s.position.set(-1.5, 3.4, 5.97); s.rotation.y = B; scene.add(s); }
}

function buildCentre() {
  /* the lone chair centre stage with a locked script box on it — L6 (a pin spot falls on it as its reveal) */
  { const g = chair(0, -2.8, 0, 0x2a211b);
    const box = mesh(bx(0.32, 0.12, 0.22), M(0x5a3a22, { roughness: 0.6 }), 0, 0.55, 0.02, g);
    mesh(bx(0.33, 0.02, 0.23), M(0x9a7a44, { metalness: 0.8, roughness: 0.3 }), 0, 0.6, 0.02, g);
    const lb = plane(tex(256, 64, (c, w, h) => { c.fillStyle = '#e8dcc0'; c.fillRect(0, 0, w, h); txt(c, 'SCRIPT · 대본', w / 2, h / 2 + 2, 34, '#2a1a10', STEN, 700, 'center'); }), 0.2, 0.05, true);
    lb.rotation.x = -Math.PI / 2; lb.position.set(0, 0.612, 0.02); g.add(lb);
    locks3d.L6 = padlock(g, 0, 0.53, 0.14, 0.55);
    makeInteract(g, 'lock', 'L6', '무대 중앙 의자 · 대본 상자', 1.35);
    box.userData.proxy = g;
    const bm = beam([0, 4.2, -2.6], [0, 0, -2.8], 0.06, 0.62, 0xfff4e0, 0); bm.visible = false;
    const pool = flat(mesh(new THREE.PlaneGeometry(1.8, 1.8), new THREE.MeshBasicMaterial({ map: glowTex(), color: 0xfff0d8, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), 0, 0, -2.8), 0.009); pool.raycast = () => {};
    const sl = new THREE.SpotLight(0xfff4e0, 0, 9, 0.24, 0.45, 1); sl.position.set(0, 4.2, -2.6); sl.target.position.set(0, 0.4, -2.8); scene.add(sl, sl.target);
    chairSpot = { bm, pool, sl };
    props.L6 = { kind: 'custom', reveal: (instant) => { bm.visible = true; tween(1.4, u => { const f = u >= 1 ? 1 : (Math.random() < 0.25 ? 0.3 : 1) * ease(u); bm.material.opacity = 0.16 * f; pool.material.opacity = 0.6 * f; sl.intensity = 2.4 * f; }, instant); } }; }
  /* the 3×3 floor grid with STAGE painted upstage — c_grid */
  { const g = grp(0, 0, 0.3, 0);
    const cell = 0.95, S = cell * 3;
    const gt = tex(1024, 1200, (c, w, h) => {
      c.clearRect(0, 0, w, h);
      const top = 176, cs = w / 3;
      txt(c, 'STAGE', w / 2, 80, 120, 'rgba(230,214,180,.85)', STEN, 700, 'center');
      c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, top, w, w);
      c.strokeStyle = 'rgba(240,226,190,.85)'; c.lineWidth = 14;
      for (let i = 0; i <= 3; i++) { c.beginPath(); c.moveTo(i * cs, top); c.lineTo(i * cs, top + w); c.stroke(); c.beginPath(); c.moveTo(0, top + i * cs); c.lineTo(w, top + i * cs); c.stroke(); }
      c.strokeStyle = 'rgba(232,180,90,.5)'; c.lineWidth = 4;
      for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) { c.strokeRect(i * cs + 26, top + j * cs + 26, cs - 52, cs - 52); txt(c, String(j * 3 + i + 1), i * cs + cs / 2, top + j * cs + cs / 2 + 8, 170, 'rgba(236,222,186,.92)', STEN, 700, 'center'); }
    });
    const ext = 1200 / 1024 * S;
    const m = flat(mesh(new THREE.PlaneGeometry(S, ext), M(0xffffff, { map: gt, transparent: true, roughness: 0.5, emissive: 0xffffff, emissiveMap: gt, emissiveIntensity: 0.22, depthWrite: false }), 0, 0, -(ext - S) / 2, g), 0.01);
    m.renderOrder = 1;
    for (let j = 0; j <= 3; j++) for (let i = 0; i <= 3; i++) { mesh(new THREE.SphereGeometry(0.025, 8, 6), Bm(0xffd38a), -S / 2 + i * cell, 0.015, -S / 2 + j * cell, g); }
    const hit = mesh(bx(S, 0.02, S), new THREE.MeshBasicMaterial({ visible: false }), 0, 0.01, 0, g); void hit;
    makeInteract(g, 'clue', 'c_grid', '무대 공간 · 바닥 칸', 0.7); }
}

/* ---------------------------------------------------------------- story scenes (pixel art) */
function makeScenes() {
  const pixG = api.pixG;
  const HOOD = '#5a5a66', HAIR = '#1a120c';
  function sunsetSky(x, y, w, h) {
    const gr = pixG.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, '#3a2a48'); gr.addColorStop(0.55, '#e0783e'); gr.addColorStop(0.8, '#ffd27a'); gr.addColorStop(1, '#8a4a2a');
    pixG.fillStyle = gr; pixG.fillRect(x, y, w, h);
  }
  function stage(t, o = {}) {
    P('#070505', 0, 0, PW, PH);
    P('#120d0a', 0, 78, PW, 30); for (let x = 0; x < PW; x += 12) P('#0c0806', x, 78, 1, 30);
    if (o.sun !== false) { sunsetSky(66, 16, 60, 62); P('#fff2c8', 93, 58, 6, 4); P('#ffe0a0', 91, 60, 10, 2); for (let i = 0; i < 9; i++) { const bh = 6 + ((i * 37) % 13); P('#2a1610', 66 + i * 7, 78 - bh, 6, bh); } P('rgba(255,210,140,.55)', 94, 78, 4, 30); P('rgba(255,170,90,.25)', 86, 78, 20, 30); }
    else P('#140e0c', 66, 16, 60, 62);
    const open = o.open || 0;
    for (const s of [0, 1]) { const x = s ? 110 + open : 60 - open; for (let k = 0; k < 22; k += 3) P('rgba(250,228,200,.22)', x + k, 14, 2, 64); }
    P('#2a0b0a', 40, 10, 12, 68); P('#2a0b0a', 140, 10, 12, 68);
    ptext('C-LOCK', 96, 8, '#d8cbb0', 8);
    if (o.chair !== false) { P('#2a1e16', 88, 72, 14, 2); P('#2a1e16', 88, 64, 2, 14); P('#2a1e16', 88, 64, 14, 2); P('#2a1e16', 100, 74, 2, 6); P('#2a1e16', 89, 74, 2, 6); }
  }
  function lamps(lit, col) { for (let i = 0; i < 6; i++) P(i < lit ? col : '#4a1410', 8 + i * 4, 30, 2, 2); P('#2a2220', 6, 34, 24, 44); P('#3a302a', 8, 36, 20, 42); }
  return {
    monitor(t) {
      P('#07070c', 0, 0, PW, PH); P('#0f0f18', 0, 0, PW, 72); P('#14101a', 0, 72, PW, 36);
      P('#1a2238', 14, 12, 40, 28); for (let i = 0; i < 6; i++) P('#2a3456', 16 + i * 6, 40 - (i * 7) % 18, 4, (i * 7) % 18); P('#f2e6b0', 18 + 40 * 0.1, 15, 1, 1);
      const fl = Math.sin(t * 9) > -0.8 ? 1 : 0.6;
      P('#2a2a30', 92, 30, 44, 30); P(fl > 0.8 ? '#4a7ad0' : '#2a4a8a', 94, 32, 40, 26); for (let i = 0; i < 6; i++) P('rgba(220,235,255,.6)', 97, 35 + i * 4, 10 + (i * 13) % 24, 1);
      ptext('03:12', 126, 54, '#cfe0ff', 5);
      P('#1a1a20', 111, 60, 6, 6);
      P('rgba(90,140,255,.12)', 60, 34, 80, 40);
      P('#3a2a20', 50, 66, 100, 4); P('#2a1e16', 54, 70, 3, 22); P('#2a1e16', 143, 70, 3, 22);
      const b = Math.round(Math.sin(t * 1.6) * 0.6);
      P('#2a2026', 58, 52, 3, 36); P('#2a2026', 58, 76, 18, 3); P('#2a2026', 73, 79, 2, 12);
      P('#30303a', 64, 72, 14, 4); P('#30303a', 76, 74, 3, 16);
      P(HOOD, 62, 66 + b, 10, 8); P(HOOD, 68, 62 + b, 10, 7); P(HOOD, 74, 60 + b, 8, 6); P(HAIR, 82, 58 + b, 8, 7); P('#f2c79a', 80, 64, 12, 2);
      P('#e8e2d4', 60, 64, 10, 2); P('#e8e2d4', 140, 90, 12, 2); P('#e8e2d4', 30, 96, 10, 2);
      if (t > 1) ptext('…', 78, 46, '#9aa8c8', 8);
    },
    path(t) {
      const gr = pixG.createLinearGradient(0, 0, 0, 70); gr.addColorStop(0, '#2a2e3a'); gr.addColorStop(1, '#5a5e6a'); pixG.fillStyle = gr; pixG.fillRect(0, 0, PW, 70);
      P('#1e2028', 0, 70, PW, 38); P('#3a3c46', 0, 74, PW, 18);
      const off = (t * 20) % 16; for (let x = -16; x < PW; x += 16) P('#d8d8d0', x - off, 82, 8, 1);
      for (const [x, s] of [[30, '정답 →'], [120, '성공 →']]) { P('#2a2a30', x + 10, 44, 2, 30); P('#d8d0b8', x, 36, 28, 9); ptext(s, x + 14, 40, '#2a2a30', 6); }
      for (let i = 0; i < 8; i++) { const x = 8 + i * 22; if (i === 4) continue; kid(x, 66, '#6a6a72', '#2a2a30', t, { back: true, bob: true }); }
      kid(96, 66, '#c98a4a', HAIR, t, { bob: true });
      if (t > 1.5) { P('#ffd36b', 99, 58, 2, 4); P('#ffd36b', 99, 63, 2, 1); }
    },
    judged(t) {
      stage(t, { sun: false, chair: false });
      P('rgba(255,240,210,.18)', 80, 10, 32, 76); P('rgba(255,240,210,.12)', 74, 60, 44, 26);
      kid(92, 68, HOOD, HAIR, t, {});
      ['EXPECTATION', 'STANDARD', 'SCORE'].forEach((w, i) => { if (t > 0.4 + i * 0.6) ptext(w, [42, 150, 96][i], [28, 40, 22][i], ['#ffd36b', '#ff9a6a', '#ffffff'][i], 7); });
      for (let i = 0; i < 4; i++) { const x = 34 + i * 38; P('#0c0a0a', x, 92, 14, 16); P('#0c0a0a', x + 3, 86, 8, 7); if (t > 0.8 + i * 0.3) { P('#f2eee4', x + 1, 78, 12, 8); ptext(String([72, 85, 60, 91][i]), x + 7, 82, '#2a2a2a', 6); } }
    },
    enter(t) {
      stage(t);
      lamps(Math.min(6, Math.floor(t * 1.6)), '#ff5a4a');
      kid(92, 98 - Math.min(14, t * 4), HOOD, HAIR, t, { back: true });
    },
    lights(t) {
      stage(t);
      for (const x of [56, 96, 136]) for (let y = 0; y < 76; y += 4) { const cx = x + (95 - x) * y / 76, wd = 6 + y * 0.18; P('rgba(255,244,220,.08)', cx - wd / 2, y, wd, 4); }
      P('rgba(255,244,220,.25)', 80, 76, 34, 4);
      lamps(6, Math.floor(t * 3) % 2 ? '#5fd38d' : '#3aa86a');
      kid(106, 68, HOOD, HAIR, t, { smile: true });
    },
    curtain(t) {
      stage(t, { open: Math.min(22, t * 8), chair: false });
      kid(92, 92 - Math.min(20, t * 6), HOOD, HAIR, t, { back: true });
    },
    restart(t) {
      sunsetSky(0, 0, PW, 80); P('#fff2c8', 92, 54, 10, 6); P('#ffe0a0', 88, 57, 18, 3);
      P('#1a120e', 0, 80, PW, 28); P('#3a3a40', 0, 88, PW, 6);
      for (let i = 0; i < 6; i++) { const u = i / 6; if (t > i * 0.3) P('#e8c070', 30 + u * 60, 98 - u * 18 - Math.sin(u * 3) * 4, 3, 2); }
      kid(93, 69, HOOD, HAIR, t, { armsUp: t > 1.2, smile: true });
      const n = Math.min(8, Math.floor(t * 4)); ptext('RE:START'.slice(0, n), 96, 20, Math.floor(t * 2) % 2 ? '#ffe6b0' : '#ffb070', 14);
      for (let i = 0; i < 10; i++) { const x = (i * 41 + t * 8) % PW, y = 34 + (i * 17) % 18 + Math.sin(t + i) * 2; P('rgba(255,230,170,.7)', x, y); }
    },
  };
}

/* ---------------------------------------------------------------- run */
BackStage.run({
  id: 'w5', week: 5, title: 'STAGE', titleHTML: 'ON<em>STAGE</em>', tag: '노을 진 빈 무대 · 나다운 길', docTitle: 'Stage',
  poster: 'assets/poster.webp', posterAlt: '노을 진 도시가 비치는 어두운 무대. 얇은 커튼, 가운데 빈 의자, 책상과 스탠드, 벽의 글귀 패널들',
  intro: ['모니터 앞에서 무너지고 나니까 오히려 내 모습을 제대로 보게 됐다. 돌이켜보면 난 늘 남들이 괜찮다고 하는 길만 따라가려고 했다. 세상이 정해준 기준에 맞춰 살아가면 언젠가 성공한 삶을 살 수 있을 거라고 믿었으니까.',
    '그러다보니 정작 내가 원하는 방식은 점점 뒤로 밀려 있었다. 결국 나는 나다운 삶을 잊은 채 살아가고 있었다.',
    '그래서 이번만큼은 남들이 정해놓은 답을 찾기보다 내 발걸음이 향하는 방향을 따라가 보기로 했다.'],
  fonts: ['700 48px "Stardos Stencil"', '400 48px "Stardos Stencil"', '700 32px "Gowun Batang"', '400 32px "Gowun Batang"'],
  fontSample: 'C-LOCK RE:START STAGE DOOR PROPS ACT FLY RAIL SCRIPT QUIET PLEASE EXPECTATION STANDARD SCORE 0123456789 정답이 정해진 세상 남들이 만든 기준에 맞추느라 정해진 시간 보여주기 위한 삶 비교하고 평가받는 무대 위의 우리 이제는 내가 선택하는 방향으로 나의 기준 속도 방식 시간 천천히 내 속도로 소품 막 대본 공연 중 7-4막, 5막, 8막, 10막, 7막+4막의 값을 차례대로 작성하시오.',
  sky: 0x070504, fog: [10, 26], exposure: 1.05,
  player: { x: 0, z: 4.9, yaw: 0, pitch: 0.03 },
  bounds: [-6.15, 6.15, -6.1, 5.65],
  locks: LOCKS, clues: CLUES, related: RELATED, captions: CAPTIONS,
  cut: {
    L2: { at: [3.4, 1.62, 5.9], view: [2.9, 1.75, 3.6], color: 0xffd9a0 },
    L3: { at: [-3.2, 1.45, 5.8], view: [-2.7, 1.7, 3.6], color: 0x8fc0ff },
    L4: { at: [5.45, 1.15, 2.3], view: [3.5, 1.7, 2.0], color: 0xffb45a },
    L5: { at: [6.4, 2.15, 0.55], view: [4.0, 1.85, 0.7], color: 0xffe9c0 },
    L6: { at: [0, 0.95, -2.8], view: [0.7, 1.9, -0.2], color: 0xfff3d6 },
  },
  focus: {
    L1: [[-4.0, 4.3, -0.9], [-5.85, 0.4, -0.95]], L2: [[3.4, 4.3, 3.6], [3.4, 1.2, 5.7]], L3: [[-3.2, 4.3, 3.6], [-3.2, 1.1, 5.6]],
    L4: [[4.0, 4.3, 1.2], [5.3, 1.0, 2.6]], L5: [[4.2, 4.3, -0.3], [6.3, 1.7, -0.2]], L6: [[0, 4.4, -0.8], [0, 0.5, -2.8]],
    start: [[0, 4.4, 1.6], [0, 0.4, -2.8]],
  },
  focusIntensity: 0.8,
  prologue: [
    { scene: 'monitor', text: '모니터 앞에서 무너지고 나니, 오히려 내 모습이 또렷하게 보였다.' },
    { scene: 'path', text: '돌이켜보면 늘 남들이 괜찮다는 길만 따라 걸었다. 세상이 정한 기준에 맞추면 성공할 거라 믿으면서.' },
    { scene: 'judged', text: '비교하고 평가받는 사이, 내가 원하는 방식은 점점 뒤로 밀려났다.' },
    { scene: 'enter', text: '이번엔 정해진 답 대신 내 발걸음을 따라가 보자. 노을 진 빈 무대, 자물쇠 여섯 개가 기다린다.' },
  ],
  epilogue: [
    { scene: 'lights', text: '마지막 자물쇠가 풀리자, 빈 무대 위 조명이 하나둘 켜졌다.' },
    { scene: 'curtain', text: '얇은 커튼을 걷고 나서니, 노을 진 도시가 처음 보는 얼굴로 펼쳐졌다.' },
    { scene: 'restart', text: '나의 기준, 나의 속도, 나의 방식, 나의 시간. 여기서부터 다시, RE:START.' },
  ],
  scenes: makeScenes,
  exitCaption: '무대 옆 문이 열렸다. 문틈으로 노을빛이 쏟아져 들어온다.',
  finalGoal: '무대 옆 문이 풀렸습니다. 왼쪽 벽의 STAGE DOOR로 나가세요.',
  startToast: '물음표는 무대 위 단서, 빛나는 자물쇠가 지금 열 수 있는 장치입니다. 길쭉한 현수막은 핸드폰으로 보면 좋아요.',
  build() { buildRoom(); },
  onSolved(L) {
    if (L.id === 'L4' && followSpot) { const { bm, sl, lensM } = followSpot; bm.visible = true; lensM.material.color.setHex(0xfff2da); tween(1.2, u => { const f = ease(u); bm.material.opacity = 0.12 * f; sl.intensity = 1.6 * f; }); }
    if (L.id === 'L5') tween(1.5, u => onRopes(ease(u)));
  },
});
})();
