/* Back Stage engine: one first-person escape room per theme.
   A theme page loads three.js, this file, then calls BackStage.run(theme) with its data and a build(api) that makes the room.
   The engine owns everything shared: DOM skeleton, HUD, locks, clue modals (image / sound + captions / video / link),
   the escape-room chain with reveal cutscenes, pixel-art story screens, exit door, ending, fireworks and records.
   See README.md next to this file for the theme contract. */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const TAU = Math.PI * 2;
const AZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const az = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';
const TIME_LIMIT = 60 * 60;
const HINT_LIMIT = 5;
const REACH = 4.6;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function hash(s) { let x = 0x811c9dc5; for (const c of ('bs5:' + s)) { x ^= c.charCodeAt(0); x = Math.imul(x, 0x01000193) >>> 0; } return x.toString(36); }

/* ------------------------------------------------------------------ DOM skeleton */
document.body.insertAdjacentHTML('beforeend', `
<div id="stage"></div>
<div id="vignette"></div>
<div id="hud" hidden>
  <div class="hud-left"><span class="brand" id="hudBrand"></span><span class="sub" id="hudSub"></span></div>
  <div id="timer" aria-label="남은 시간">60:00</div>
  <div class="hud-right">
    <button id="btnLocks" type="button">자물쇠 <b id="lockCount">0/6</b></button>
    <button id="btnNotes" type="button">단서 수첩 <b id="noteCount">0</b></button>
    <button id="btnHints" type="button">힌트 <b id="hintCount">5</b></button>
    <button id="btnSound" type="button">소리 켬</button>
  </div>
</div>
<div id="goal" hidden aria-live="polite"><button type="button" id="goalToggle" aria-expanded="true"><span class="gk" id="goalNo"></span><span class="gchev" aria-hidden="true">▾</span><kbd>G</kbd></button><span class="gt" id="goalText"></span></div>
<div id="crosshair" hidden></div>
<div id="prompt" hidden></div>
<div id="help" hidden></div>
<div id="lockHint" hidden><b>클릭해서 시작</b><span>마우스로 둘러보고, 조준점에 물건을 맞춰 클릭하세요 · Esc로 커서 되찾기</span></div>
<div id="joy" hidden><div id="knob"></div></div>
<button id="useBtn" type="button" hidden>조사</button>
<div id="toast" aria-live="polite"></div>
<div id="cine" aria-hidden="true"><div class="bar top"></div><div class="bar bot"></div><p id="caption" aria-live="polite"></p><span class="skip">클릭 또는 Space로 건너뛰기</span></div>
<div id="modal" hidden><div class="sheet" id="sheet" role="dialog" aria-modal="true"></div></div>
<div id="lightbox" hidden><img alt=""></div>
<section id="story" hidden>
  <canvas id="fw" aria-hidden="true"></canvas>
  <div class="sin">
    <div class="schap" id="sChap"></div>
    <div class="pixwrap"><canvas id="pix" width="192" height="108" role="img" aria-label="도트 그림으로 그린 이야기 장면"></canvas></div>
    <p id="sText" aria-live="polite"></p>
    <div id="sStats" hidden></div>
    <div class="sbtns" id="sBtns"><button type="button" class="btn" id="sVoice" hidden>낭독 켬</button><button type="button" class="btn" id="sSkip">건너뛰기</button><button type="button" class="btn primary" id="sNext">다음 ▶</button></div>
  </div>
</section>
<div id="whiteout" aria-hidden="true"></div>
<section class="screen" id="intro">
  <div class="art" role="img" id="introArt"></div>
  <div class="copy">
    <a class="back" href="../backstage.html">← 테마 선택</a>
    <div class="eyebrow" id="introEyebrow"></div>
    <h1 id="introTitle"></h1>
    <div class="tag" id="introTag"></div>
    <div id="introText" style="display:flex;flex-direction:column;gap:14px"></div>
    <div class="facts">
      <div><b id="introLocks">6</b><span>자물쇠</span></div>
      <div><b>60:00</b><span>제한 시간</span></div>
      <div><b>5</b><span>힌트</span></div>
    </div>
    <div class="controls"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 이동 · <kbd>Shift</kbd> 달리기 · 마우스로 시점 · 조준점에 물건을 맞추고 <kbd>클릭</kbd> 또는 <kbd>E</kbd>로 조사 · <kbd>N</kbd> 단서 수첩 · <kbd>H</kbd> 힌트 · <kbd>Esc</kbd> 커서 되찾기. 휴대폰에서는 왼쪽 조이스틱으로 이동하고 화면을 끌어 둘러봅니다. 스피커 표시가 있는 단서는 소리가 나니 이어폰을 준비하세요.</div>
    <button class="start" id="startBtn" type="button" disabled>방을 꾸미는 중…</button>
    <div class="best" id="bestRec" hidden></div>
  </div>
</section>`);

/* ------------------------------------------------------------------ state */
const state = { started: false, finished: false, stage: 0, solved: {}, seen: {}, hint: {}, hintsUsed: 0, wrong: 0, t0: 0, finalTime: 0, modal: null, muted: false, overShown: false, cut: false };
let T = null;                       // the running theme
let LOCKS = [], LOCK_BY_ID = {}, CLUES = {}, RELATED = {}, NEXT = {}, PREV = {}, NL = 6;
const isReady = id => !PREV[id] || !!state.solved[PREV[id]];

/* ------------------------------------------------------------------ three setup */
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
$('#stage').appendChild(renderer.domElement);
const canvasEl = renderer.domElement;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d0705);
scene.fog = new THREE.Fog(0x0d0705, 12, 34);
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 80);
camera.rotation.order = 'YXZ';
camera.layers.enable(1);
/* r is the body radius used against colliders; kept slim so aisles between furniture stay walkable */
const player = { x: 0, z: 0, yaw: 0, pitch: -0.06, eye: 1.65, r: 0.24 };
let bounds = [-11.65, 11.65, -8.65, 8.6];

const colliders = [];
/* Lighting zones: zone n holds lights and glowing surfaces; all start on, but a theme may switch some off and wake them later. */
const ZONES = {};
function zone(n) { return ZONES[n] || (ZONES[n] = { on: true, t: 1, lights: [], mats: [] }); }
function zl(n, l) { l.userData.to = l.intensity; zone(n).lights.push(l); return l; }
function zm(n, mat) { zone(n).mats.push({ m: mat, to: mat.color.clone(), from: mat.color.clone().multiplyScalar(0.1) }); return mat; }
function zg(n, mat) { zone(n).mats.push({ m: mat, op: mat.opacity }); return mat; }
function applyZone(z, flick = 1) {
  const e = z.t * z.t * (3 - 2 * z.t) * flick;
  z.lights.forEach(l => { l.intensity = l.userData.to * e; });
  z.mats.forEach(o => { if (o.op !== undefined) o.m.opacity = o.op * e; else o.m.color.copy(o.from).lerp(o.to, e); });
}
function setZone(n, on) { const z = zone(n); z.on = on; if (!on) { z.t = 0; applyZone(z); } }
const V3 = (x, y, z) => x && x.isVector3 ? x.clone() : Array.isArray(x) ? new THREE.Vector3(x[0], x[1], x[2]) : new THREE.Vector3(x, y, z);
let focus, focusKey = 'start';
const FOCUS = {};
const props = {};
const locks3d = {};
const spinners = [], bulbs = [], tickers = [];
const M = (color, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.75, metalness: 0.05 }, o));
const Bm = (color, o = {}) => new THREE.MeshBasicMaterial(Object.assign({ color, toneMapped: false }, o));
const bx = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cy = (rt, rb, h, s = 28, open = false, ts = 0, tl = TAU) => new THREE.CylinderGeometry(rt, rb, h, s, 1, open, ts, tl);
function mesh(geo, mat, x = 0, y = 0, z = 0, parent = scene) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; }
function grp(x = 0, y = 0, z = 0, ry = 0, parent = scene) { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g); return g; }
function collide(cx, cz, w, d) { colliders.push({ x0: cx - w / 2, x1: cx + w / 2, z0: cz - d / 2, z1: cz + d / 2 }); }
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function tex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  t.userData = { canvas: c, g };
  return t;
}
/* an image file as a texture (clue originals, posters); sRGB, loads async */
const loader = new THREE.TextureLoader();
function imgTex(url) { const t = loader.load(url, tt => { tt.needsUpdate = true; }); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t; }
function plane(t, w, h, lit = false, extra = {}) {
  const mat = lit ? M(0xffffff, Object.assign({ map: t, roughness: 0.85 }, extra)) : Bm(0xffffff, Object.assign({ map: t }, extra));
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
}
function rrect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function glowText(g, text, x, y, font, color, blur = 24) {
  g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = color; g.shadowBlur = blur; g.fillStyle = color; g.fillText(text, x, y); g.fillText(text, x, y);
  g.shadowBlur = 0; g.fillStyle = 'rgba(255,255,240,.85)'; g.fillText(text, x, y);
}
function drawCard(g, x, y, w, h, rank, faceUp = true) {
  g.save(); rrect(g, x, y, w, h, w * 0.12);
  if (faceUp) { g.fillStyle = '#fbf8f1'; g.fill(); g.fillStyle = '#1a1a1a'; g.font = `600 ${h * 0.5}px "IBM Plex Mono", monospace`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(rank, x + w / 2, y + h / 2 + 2); }
  else { g.fillStyle = '#9b2525'; g.fill(); g.strokeStyle = '#ffd9a0'; g.lineWidth = 3; rrect(g, x + 6, y + 6, w - 12, h - 12, 6); g.stroke(); g.fillStyle = '#ffd9a0'; g.font = `600 ${h * 0.4}px "IBM Plex Mono", monospace`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', x + w / 2, y + h / 2 + 2); }
  g.restore();
}
/* soft additive halo */
const glowTexture = (() => { let t; return () => t || (t = tex(256, 256, (g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,255,255,.45)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); })); })();
function glow(n, color, w, h, x, y, z, ry = 0, op = 0.5, parent = scene) {
  const mat = new THREE.MeshBasicMaterial({ map: glowTexture(), color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const m = mesh(new THREE.PlaneGeometry(w, h), mat, x, y, z, parent); m.rotation.y = ry; m.renderOrder = 2; m.raycast = () => {};
  if (n > 1) zg(n, mat);
  return m;
}
let dust;
function buildDust(color = 0xffd9a0, n = 420, sx = 23, sz = 17, cx = 0, cz = 0) {
  const pos = new Float32Array(n * 3), r = rng(42);
  for (let i = 0; i < n; i++) { pos[i * 3] = cx + (r() - 0.5) * sx; pos[i * 3 + 1] = 0.3 + r() * 5.4; pos[i * 3 + 2] = cz + (r() - 0.5) * sz; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ size: 0.035, map: glowTexture(), color, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  dust = new THREE.Points(geo, mat); dust.raycast = () => {}; scene.add(dust);
}
function bulbRow(parent, pts, r = 0.045, n = 1) {
  const geo = new THREE.SphereGeometry(r, 10, 8);
  pts.forEach((p, i) => { const m = mesh(geo, Bm(0xffe6a0), p[0], p[1], p[2], parent); bulbs.push({ m, n, alt: i % 2 }); });
}
function rectBulbs(cx, cy0, w, h, z, step = 0.26) {
  const pts = [];
  for (let x = -w / 2; x <= w / 2 + 1e-6; x += step) { pts.push([cx + x, cy0 + h / 2, z]); pts.push([cx + x, cy0 - h / 2, z]); }
  for (let y = -h / 2 + step; y < h / 2 - 1e-6; y += step) { pts.push([cx - w / 2, cy0 + y, z]); pts.push([cx + w / 2, cy0 + y, z]); }
  return pts;
}

/* ------------------------------------------------------------------ interactables & markers */
const interactables = [];
const ICON = {};
function iconTex(kind) {
  const col = { clue: '#e8b64c', seen: '#9b8558', lock: '#ff5a4a', ok: '#5fd38d', door: '#5fd38d', doorLocked: '#ff5a4a', poster: '#5fb0ea', sound: '#5fb0ea', soundSeen: '#55728a', link: '#e8b64c' }[kind];
  return tex(128, 128, g => {
    g.beginPath(); g.arc(64, 64, 50, 0, TAU); g.fillStyle = 'rgba(20,10,8,.8)'; g.fill(); g.lineWidth = 8; g.strokeStyle = col; g.stroke();
    g.fillStyle = col; g.strokeStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '600 60px "IBM Plex Mono", monospace';
    if (kind === 'lock' || kind === 'doorLocked') { g.fillRect(42, 60, 44, 32); g.lineWidth = 8; g.beginPath(); g.arc(64, 58, 14, Math.PI, 0); g.stroke(); }
    else if (kind === 'ok' || kind === 'door') { g.lineWidth = 10; g.lineCap = 'round'; g.beginPath(); g.moveTo(42, 66); g.lineTo(58, 82); g.lineTo(88, 48); g.stroke(); }
    else if (kind === 'poster') g.fillText('i', 64, 68);
    else if (kind === 'sound' || kind === 'soundSeen') {
      g.beginPath(); g.moveTo(36, 54); g.lineTo(50, 54); g.lineTo(66, 40); g.lineTo(66, 88); g.lineTo(50, 74); g.lineTo(36, 74); g.closePath(); g.fill();
      g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.arc(68, 64, 12, -0.9, 0.9); g.stroke(); g.beginPath(); g.arc(68, 64, 24, -0.9, 0.9); g.stroke();
    }
    else g.fillText('?', 64, 68);
  });
}
const hasSound = c => !!(c && c.media && c.media.some(m => m.type === 'audio' || m.type === 'youtube'));
function makeInteract(g, kind, id, label, markerH) {
  g.userData.interact = { kind, id, label };
  let iconKind = kind === 'lock' ? 'lock' : kind === 'door' ? 'doorLocked' : kind === 'poster' ? 'poster' : 'clue';
  if (kind === 'clue' && hasSound(CLUES[id])) iconKind = 'sound';
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: ICON[iconKind], transparent: true, toneMapped: false, depthWrite: false }));
  sp.scale.set(0.26, 0.26, 0.26); sp.position.set(0, markerH, 0); sp.layers.set(1); sp.raycast = () => {};
  g.add(sp);
  const entry = { g, kind, id, label, sprite: sp, baseY: markerH, phase: Math.random() * TAU };
  interactables.push(entry); g.userData.entry = entry;
  return entry;
}
function setIcon(entry, kind) { entry.sprite.material.map = ICON[kind]; entry.sprite.material.needsUpdate = true; }
const isPending = e => e.kind === 'door' ? state.stage >= NL && !state.finished : e.kind === 'lock' && !state.solved[e.id] && isReady(e.id);

const brass = M(0xc9a13a, { metalness: 0.85, roughness: 0.3 });
function padlock(parent, x, y, z, s = 1) {
  const g = grp(x, y, z, 0, parent); g.scale.setScalar(s);
  const body = mesh(bx(0.2, 0.17, 0.07), brass.clone(), 0, 0, 0, g);
  const shackle = mesh(new THREE.TorusGeometry(0.065, 0.016, 8, 18, Math.PI), M(0xd8d8d8, { metalness: 0.9, roughness: 0.25 }), 0, 0.085, 0, g);
  mesh(cy(0.016, 0.016, 0.02, 10), M(0x1a1a1a), 0, -0.02, 0.036, g).rotation.x = Math.PI / 2;
  return { g, body, shackle };
}
function keypadTex(alpha) {
  return tex(256, 320, (g, w, h) => {
    g.fillStyle = '#1b1b1d'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#0e1a12'; g.fillRect(20, 18, w - 40, 50); g.fillStyle = '#8cf0a8'; g.font = '600 28px "IBM Plex Mono", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(alpha ? 'A-Z' : '- - - -', w / 2, 44);
    const keys = alpha ? AZ.split('').concat(['<', 'OK']) : '123456789<0#'.split('');
    const cols = alpha ? 4 : 3, rows = Math.ceil(keys.length / cols), kw = (w - 40) / cols, kh = (h - 96) / rows;
    keys.forEach((k, i) => { const cx = 20 + (i % cols) * kw, cyy = 84 + Math.floor(i / cols) * kh; g.fillStyle = '#3a3a40'; rrect(g, cx + 3, cyy + 3, kw - 6, kh - 6, 5); g.fill(); g.fillStyle = '#e8e8e8'; g.font = `600 ${alpha ? 18 : 30}px "IBM Plex Mono", monospace`; g.fillText(k, cx + kw / 2, cyy + kh / 2); });
  });
}
/* a framed picture on a wall / desk: the clue original (or any texture) inside a simple frame */
function framed(parent, t, w, h, x, y, z, ry = 0, frame = 0x3a2416, depth = 0.04) {
  const g = grp(x, y, z, ry, parent);
  mesh(bx(w + 0.08, h + 0.08, depth), M(frame, { roughness: 0.6 }), 0, 0, 0, g);
  const p = plane(t, w, h, true, { roughness: 0.75 }); p.position.z = depth / 2 + 0.002; g.add(p);
  return g;
}

/* ------------------------------------------------------------------ exit door and poster (shared furniture) */
let door = null, doorLight = null, doorOpening = -1;
/* door sits in a wall at (x, z); ry turns it so its local +z points out of the room */
function exitDoor({ x = 0, z = 9, ry = 0, leaf = 0x5b1a12, frame = 0xc9a13a, sign = 'EXIT' } = {}) {
  const G = grp(x, 0, z, ry);
  mesh(bx(2.1, 2.95, 0.12), M(frame, { metalness: 0.7, roughness: 0.35 }), 0, 1.47, -0.04, G);
  doorLight = mesh(new THREE.PlaneGeometry(1.6, 2.65), new THREE.MeshBasicMaterial({ color: 0xfff6e0, transparent: true, opacity: 0, toneMapped: false }), 0, 1.33, -0.105, G); doorLight.rotation.y = Math.PI;
  const pivot = grp(-0.85, 0, -0.14, 0, G);
  const lf = mesh(bx(1.7, 2.75, 0.1), M(leaf, { roughness: 0.5 }), 0.85, 1.375, 0, pivot);
  const dk = new THREE.Color(leaf).multiplyScalar(0.8).getHex();
  mesh(bx(1.3, 1.0, 0.02), M(dk, { roughness: 0.5 }), 0, 0.6, -0.06, lf);
  mesh(bx(1.3, 1.0, 0.02), M(dk, { roughness: 0.5 }), 0, -0.6, -0.06, lf);
  mesh(new THREE.SphereGeometry(0.05, 12, 10), brass, 0.65, 0, -0.08, lf);
  const ex = tex(256, 96, (c, w, h) => { c.fillStyle = '#0c2a14'; c.fillRect(0, 0, w, h); glowText(c, sign, w / 2, h / 2 + 4, '64px Bungee, sans-serif', '#5fd38d', 14); });
  const exm = plane(ex, 0.7, 0.26); exm.position.set(0, 3.18, -0.1); exm.rotation.y = Math.PI; G.add(exm);
  glow(1, 0x5fd38d, 1.8, 0.9, 0, 3.18, -0.07, Math.PI, 0.35, G);
  const lamps = [];
  for (let i = 0; i < NL; i++) { const l = mesh(new THREE.SphereGeometry(0.07, 14, 10), Bm(0x7a1a14), -(NL - 1) * 0.15 + i * 0.3, 3.55, -0.1, G); lamps.push(l); }
  const dg = grp(0, 0, -0.25, Math.PI, G);
  mesh(bx(1.8, 2.8, 0.1), new THREE.MeshBasicMaterial({ visible: false }), 0, 1.4, 0, dg);
  makeInteract(dg, 'door', 'exit', '출구', 3.0);
  G.updateMatrixWorld(true);
  const W = (lx, ly, lz) => G.localToWorld(new THREE.Vector3(lx, ly, lz));
  door = { G, pivot, lamps, look: W(0, 1.5, 0.6), stand: W(0, 1.65, -1.6), through: W(0, 1.65, -0.15), inside: W(0, 1.65, -2.3) };
  if (!FOCUS.exit) FOCUS.exit = [W(0, 5.6, -2.8), W(0, 1.3, -0.2)];
  if (!T.cut.exit) T.cut.exit = { at: W(0, 1.7, -0.2), view: W(0, 1.85, -3.1), color: 0x5fd38d };
  return door;
}
function poster({ x, y = 2.4, z, ry = 0, w = 1.36, h = 1.7, parent = scene } = {}) {
  const g = grp(x, 0, z, ry, parent);
  mesh(bx(w + 0.14, h + 0.18, 0.06), M(0xc9a13a, { metalness: 0.7, roughness: 0.35 }), 0, y, 0, g);
  const pm = plane(imgTex(T.poster), w, h, true, { roughness: 0.6 }); pm.position.set(0, y, 0.035); g.add(pm);
  makeInteract(g, 'poster', 'poster', '테마 포스터', y + h / 2 + 0.3);
  return g;
}

/* ------------------------------------------------------------------ audio (sfx) */
let actx = null;
function audio() { if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; } } return actx; }
function tone(f, d = 0.12, type = 'sine', vol = 0.06, when = 0) {
  if (state.muted) return; const a = audio(); if (!a) return;
  const t = a.currentTime + when, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + d + 0.02);
}
const sfx = {
  click: () => tone(880, 0.05, 'triangle', 0.04),
  tick: () => tone(1400, 0.03, 'square', 0.015),
  ok: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.07, i * 0.09)); },
  bad: () => { tone(160, 0.25, 'square', 0.05); tone(120, 0.3, 'square', 0.04, 0.08); },
  door: () => { [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.35, 'sine', 0.07, i * 0.11)); },
  whoosh: () => { const a = audio(); if (!a || state.muted) return; const t = a.currentTime, o = a.createOscillator(), g = a.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(900, t + 1.2); o.frequency.exponentialRampToValueAtTime(300, t + 2.3); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.03, t + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4); o.connect(g).connect(a.destination); o.start(t); o.stop(t + 2.5); },
  reveal: () => { [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.5, 'triangle', 0.06, i * 0.07)); tone(98, 0.6, 'sine', 0.08); },
  blip: () => tone(660 + Math.random() * 120, 0.025, 'square', 0.012),
  pop: () => { tone(90 + Math.random() * 60, 0.25, 'sawtooth', 0.05); tone(1800 + Math.random() * 800, 0.12, 'square', 0.012, 0.05); },
  fanfare: () => { [[523, 0], [659, 0.12], [784, 0.24], [1047, 0.36], [784, 0.6], [1047, 0.72]].forEach(([f, w]) => tone(f, 0.4, 'triangle', 0.07, w)); },
  power: () => { tone(70, 0.5, 'sawtooth', 0.035); [0, 0.12, 0.3, 0.38].forEach(w => tone(2200, 0.03, 'square', 0.02, w)); tone(196, 0.6, 'triangle', 0.05, 0.4); tone(294, 0.7, 'triangle', 0.05, 0.55); },
};

/* ------------------------------------------------------------------ media clues */
/* A clue (room or related) is either { html: () => string } or { media: [items] } (or both: html first).
   items: { type:'img', src, alt, caption, small }
          { type:'audio', src, title, captions:[[t0,t1,'text'],...], note }   → play button, seek bar, "글자로 보기" slow captions
          { type:'youtube', id, start, title, note, label }                   → click-to-load embed + "유튜브에서 열기"
          { type:'link', href, label, title, note, fallback }                  → opens in a new tab; fallback text in a <details>
          { type:'text', html }                                                → a paper box with the given html */
const SPK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 9h4l5-4v14l-5-4H3z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>';
const PLAYI = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M7 5v14l12-7z"/></svg>';
const PAUSEI = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
const mmss = s => { s = Math.max(0, Math.floor(s || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
function mediaHTML(items) {
  return (items || []).map((m, i) => {
    if (m.type === 'img') return `<figure class="cimg ${m.small ? 'small' : ''}"><img src="${esc(m.src)}" alt="${esc(m.alt || '')}" loading="lazy" data-zoom>${m.caption ? `<figcaption>${esc(m.caption)}</figcaption>` : ''}</figure>`;
    if (m.type === 'audio') return `<div class="sound" data-media="${i}"><span class="mbadge">${SPK}소리 단서</span>${m.title ? `<span class="stitle">${esc(m.title)}</span>` : ''}
      <div class="snd-ctrl"><button class="snd-play" type="button" aria-label="재생">${PLAYI}</button><div class="snd-bar" role="slider" aria-label="재생 위치"><i></i></div><span class="snd-time">0:00</span></div>
      ${m.captions && m.captions.length ? `<div class="snd-alt"><button type="button" class="snd-cc" aria-pressed="false">글자로 보기</button><small>소리를 들을 수 없을 때, 들리는 내용을 글자로 천천히 보여 줍니다.</small></div><div class="cc" hidden></div>` : ''}
      ${m.note ? `<p class="mnote">${esc(m.note)}</p>` : ''}</div>`;
    if (m.type === 'youtube') return `<div class="video" data-media="${i}"><span class="mbadge mb-video">${SPK}${esc(m.label || '영상 단서')}</span>${m.title ? `<span class="stitle">${esc(m.title)}</span>` : ''}
      <div class="yt-frame"><button class="yt-cover ${m.cover === false ? 'plain' : ''}" type="button" aria-label="재생" ${m.cover === false ? '' : `style="background-image:url('https://i.ytimg.com/vi/${esc(m.id)}/hqdefault.jpg')"`}><span>${PLAYI}</span>${m.cover === false ? '<em>눌러서 재생</em>' : ''}</button></div>
      <div class="actions" style="justify-content:flex-start"><a class="btn" href="https://www.youtube.com/watch?v=${esc(m.id)}${m.start ? '&t=' + m.start + 's' : ''}" target="_blank" rel="noopener">유튜브에서 열기 ↗</a></div>
      ${m.note ? `<p class="mnote">${m.note}</p>` : ''}</div>`;
    if (m.type === 'link') return `<div class="extlink"><span class="mbadge mb-link">외부 링크</span>${m.title ? `<span class="stitle">${esc(m.title)}</span>` : ''}
      <a class="btn primary" href="${esc(m.href)}" target="_blank" rel="noopener">${esc(m.label || '링크 열기')} ↗</a>
      ${m.note ? `<p class="mnote">${esc(m.note)}</p>` : ''}${m.fallback ? `<details class="fallback"><summary>링크가 열리지 않으면 여기서 보기</summary><div class="fbody">${esc(m.fallback)}</div></details>` : ''}</div>`;
    if (m.type === 'text') return `<div class="qbox">${m.html}</div>`;
    return '';
  }).join('');
}
const players = [];
function stopMedia() { players.forEach(p => p.stop()); players.length = 0; }
function wireMedia(root, items) {
  root.querySelectorAll('[data-zoom]').forEach(img => img.addEventListener('click', () => { const lb = $('#lightbox'); lb.querySelector('img').src = img.src; lb.querySelector('img').alt = img.alt; lb.hidden = false; }));
  root.querySelectorAll('.sound[data-media]').forEach(el => {
    const m = items[+el.dataset.media]; const au = new Audio(); au.preload = 'metadata'; au.src = m.src;
    const btn = el.querySelector('.snd-play'), bar = el.querySelector('.snd-bar'), fill = bar.querySelector('i'), time = el.querySelector('.snd-time');
    const ccBtn = el.querySelector('.snd-cc'), cc = el.querySelector('.cc');
    const caps = m.captions || [];
    let ccOn = false, own = null, raf = 0, lastLine = -1;
    const dur = () => au.duration && isFinite(au.duration) ? au.duration : (caps.length ? caps[caps.length - 1][1] : 0);
    const now = () => own ? own.t : au.currentTime;
    function renderCC() {
      if (!ccOn) return;
      const t = now();
      let html = '';
      caps.forEach(([t0, t1, txt], k) => {
        if (t0 > t) return;
        const cur = t < t1 + 0.4 && (k === caps.length - 1 || caps[k + 1][0] > t);
        const shown = cur ? txt.slice(0, Math.max(1, Math.ceil(txt.length * Math.min(1, (t - t0) / Math.max(0.6, t1 - t0))))) : txt;
        html += `<p class="${cur ? 'now' : ''}"><span class="ts">${mmss(t0)}</span>${esc(shown)}${cur && shown.length < txt.length ? '<span class="cur"></span>' : ''}</p>`;
      });
      if (!html) html = '<p><span class="ts">0:00</span>…</p>';
      cc.innerHTML = html;
      const n = cc.querySelectorAll('p').length; if (n !== lastLine) { lastLine = n; cc.scrollTop = cc.scrollHeight; }
    }
    function tick() {
      raf = requestAnimationFrame(tick);
      if (own) { own.t += (performance.now() - own.last) / 1000 * 0.8; own.last = performance.now(); if (own.t > dur() + 0.5) { own = null; ccBtnText(); } }
      const d = dur(), t = now();
      fill.style.width = d ? Math.min(100, t / d * 100) + '%' : '0';
      time.textContent = `${mmss(t)} / ${mmss(d)}`;
      renderCC();
    }
    const setPlayIcon = () => { btn.innerHTML = au.paused ? PLAYI : PAUSEI; btn.setAttribute('aria-label', au.paused ? '재생' : '일시 정지'); };
    const ccBtnText = () => { if (ccBtn) { ccBtn.textContent = ccOn ? '글자 숨기기' : '글자로 보기'; ccBtn.setAttribute('aria-pressed', String(ccOn)); } };
    btn.addEventListener('click', () => { if (au.paused) { own = null; au.play().catch(() => toast('소리를 재생할 수 없습니다. "글자로 보기"를 눌러 보세요.')); } else au.pause(); });
    au.addEventListener('play', setPlayIcon); au.addEventListener('pause', setPlayIcon); au.addEventListener('ended', setPlayIcon);
    bar.addEventListener('pointerdown', e => { const r = bar.getBoundingClientRect(), d = dur(); if (!d) return; const t = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * d; if (own) own.t = t; else au.currentTime = t; lastLine = -1; });
    if (ccBtn) ccBtn.addEventListener('click', () => {
      ccOn = !ccOn; cc.hidden = !ccOn; lastLine = -1;
      /* with the sound paused, the captions run on their own slower clock from the start */
      if (ccOn && au.paused) own = { t: 0, last: performance.now() }; else if (!ccOn) own = null;
      ccBtnText(); renderCC();
    });
    raf = requestAnimationFrame(tick);
    players.push({ stop: () => { au.pause(); au.src = ''; cancelAnimationFrame(raf); } });
  });
  root.querySelectorAll('.video[data-media]').forEach(el => {
    const m = items[+el.dataset.media]; const cover = el.querySelector('.yt-cover');
    cover.addEventListener('click', () => {
      const f = document.createElement('iframe');
      f.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(m.id)}?autoplay=1&rel=0&playsinline=1${m.start ? '&start=' + m.start : ''}`;
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; f.allowFullscreen = true; f.title = m.title || '영상';
      cover.replaceWith(f);
    });
    players.push({ stop: () => { el.querySelectorAll('iframe').forEach(f => f.remove()); } });
  });
}
$('#lightbox').addEventListener('click', () => { $('#lightbox').hidden = true; });
function clueBody(c) { return (c.html ? c.html() : '') + mediaHTML(c.media); }

/* ------------------------------------------------------------------ UI */
function toast(msg, good = false) {
  const el = document.createElement('div'); el.className = 'toast' + (good ? ' good' : ''); el.textContent = msg;
  $('#toast').appendChild(el); setTimeout(() => el.remove(), 2600);
}
const keys = new Set();
let afterClose = null;
function openModal(html, kind, media) {
  stopMedia();
  keys.clear(); lockUI = null; vel.x = vel.z = 0; afterClose = null;
  if (document.pointerLockElement) document.exitPointerLock();
  state.modal = kind || 'sheet';
  $('#lockHint').hidden = true;
  const sheet = $('#sheet'); sheet.innerHTML = `<button class="x" type="button" aria-label="닫기" data-close>✕</button>` + html;
  $('#modal').hidden = false; $('#prompt').hidden = true;
  sheet.querySelector('[data-close]').addEventListener('click', closeModal);
  if (media) media.forEach(([sel, items]) => { const r = sheet.querySelector(sel); if (r) wireMedia(r, items); });
  sheet.scrollTop = 0;
}
/* closing by a click counts as a user gesture, so the view re-locks right away; Esc needs one more click */
function closeModal(byClick = true) {
  stopMedia(); $('#lightbox').hidden = true;
  $('#modal').hidden = true; state.modal = null; lockUI = null; $('#sheet').innerHTML = '';
  if (byClick) requestLock();
  updateLockHint();
  const f = afterClose; afterClose = null; if (f) f();
}
$('#modal').addEventListener('pointerdown', e => { if (e.target.id === 'modal') closeModal(); });

function markSeen(key) { if (!state.seen[key]) { state.seen[key] = true; updateHUD(); } }
function clueSheet(eyebrow, c, sub, extra = '') {
  return [`<div class="head"><span class="eyebrow">${eyebrow}</span><h2>${esc(c.title)}</h2>${sub ? `<span class="meta">${esc(sub)}</span>` : ''}</div><div class="cbody" style="display:flex;flex-direction:column;gap:14px">${clueBody(c)}</div>${extra}`, [['.cbody', c.media]]];
}
function openClue(id) {
  const c = CLUES[id]; markSeen(id);
  const entry = interactables.find(e => e.id === id); if (entry) setIcon(entry, hasSound(c) ? 'soundSeen' : 'seen');
  const [html, media] = clueSheet('방 안 단서', c, c.where);
  openModal(html, 'sheet', media);
}
function openPoster() {
  openModal(`<div class="head"><span class="eyebrow">테마 포스터</span><h2>${esc(T.title)}</h2><span class="meta">${T.week}주차 · ${esc(T.tag)}</span></div><img src="${esc(T.poster)}" alt="${esc(T.posterAlt || '')}" style="border-radius:8px;width:100%">`);
}

/* lock UI */
let lockUI = null;
const MECH_HINT = {
  dial: '키보드로 바로 입력할 수 있어요. ←→ 칸 이동, ↑↓ 돌리기, Enter 열기',
  keypad: '키보드로 입력할 수 있어요. Backspace 지우기, Enter 열기',
  dir: '방향키(↑←↓→)로도 입력할 수 있어요. Backspace 지우기, Enter 열기',
  text: '입력칸에 직접 입력하고 Enter를 누르세요. 띄어쓰기는 무시합니다.',
  form: '칸마다 입력하고 열어 보기를 누르세요. 띄어쓰기는 무시합니다.',
};
function openLock(id) {
  const L = LOCK_BY_ID[id];
  const relOk = L.related && isReady(id);
  if (relOk) markSeen('r_' + L.related);
  const solved = !!state.solved[id];
  const R = L.related ? RELATED[L.related] : null;
  const rel = relOk ? `<div class="section-label">연관 단서 · ${esc(R.title)}</div><div class="rbody" style="display:flex;flex-direction:column;gap:14px">${clueBody(R)}</div>`
    : L.related ? `<div class="section-label">연관 단서</div><div class="sleeping">아직 잠들어 있습니다. 다른 자물쇠를 열면 깨어날지도 모릅니다.</div>`
    : `<div class="meta">이 자물쇠에는 연관 단서가 없습니다. 방 안 단서 하나만으로 풀 수 있습니다.</div>`;
  openModal(`
    <div class="head"><span class="eyebrow">자물쇠 ${L.no} · ${esc(L.type)}</span><h2>${esc(L.name)}</h2>
      <span>${solved ? '<span class="chip ok">열림</span>' : '<span class="chip bad">잠김</span>'}</span></div>
    ${rel}
    <div class="lockbox ${solved ? 'open' : ''}" id="lockbox"><div id="mech"></div>
      <div class="feedback ${solved ? 'ok' : ''}" id="fb">${solved ? '이미 열린 자물쇠입니다.' : ''}</div>
      <div class="actions">${solved ? '' : '<button class="btn primary" type="button" id="tryBtn">열어 보기</button>'}<button class="btn" type="button" data-close2>닫기</button></div>
      <div class="kbhint">${MECH_HINT[L.mech] || ''}</div>
    </div>`, 'lock', relOk && R.media ? [['.rbody', R.media]] : null);
  $('#sheet [data-close2]').addEventListener('click', closeModal);
  const mech = $('#mech');
  ({ dial: buildDial, keypad: buildKeypad, dir: buildDir, text: buildText, form: buildForm }[L.mech] || buildDial)(mech, L, solved);
  if (lockUI) lockUI.L = L;
  if (!solved) $('#tryBtn').addEventListener('click', () => submitLock(L));
}
function buildDial(root, L, solved) {
  const set = L.set, n = L.len;
  const vals = solved ? null : new Array(n).fill(0);
  let focus = 0;
  root.className = 'dial';
  const faces = [];
  for (let i = 0; i < n; i++) {
    const w = document.createElement('div'); w.className = 'wheel';
    const up = document.createElement('button'); up.type = 'button'; up.textContent = '▲'; up.setAttribute('aria-label', `${i + 1}번째 칸 올리기`);
    const face = document.createElement('div'); face.className = 'face'; face.tabIndex = 0;
    const dn = document.createElement('button'); dn.type = 'button'; dn.textContent = '▼'; dn.setAttribute('aria-label', `${i + 1}번째 칸 내리기`);
    w.append(up, face, dn); root.appendChild(w); faces.push({ w, face });
    if (solved) { face.textContent = '✓'; up.disabled = dn.disabled = true; continue; }
    up.addEventListener('click', () => { spin(i, -1); });
    dn.addEventListener('click', () => { spin(i, 1); });
    face.addEventListener('click', () => { focus = i; render(); });
    face.addEventListener('wheel', e => { e.preventDefault(); spin(i, e.deltaY > 0 ? 1 : -1); }, { passive: false });
  }
  if (solved) return;
  function spin(i, d) { vals[i] = (vals[i] + d + set.length) % set.length; focus = i; sfx.tick(); render(); }
  function render() { faces.forEach((f, i) => { f.face.textContent = set[vals[i]]; f.w.classList.toggle('focus', i === focus); }); }
  render();
  lockUI = {
    value: () => vals.map(v => set[v]).join(''),
    key: e => {
      let k = keyChar(e); if (!set.includes(k) && set.includes(k.toLowerCase())) k = k.toLowerCase();
      if (k.length === 1 && set.includes(k)) { vals[focus] = set.indexOf(k); sfx.tick(); focus = Math.min(n - 1, focus + 1); render(); return true; }
      if (k === 'ArrowLeft') { focus = Math.max(0, focus - 1); render(); return true; }
      if (k === 'ArrowRight') { focus = Math.min(n - 1, focus + 1); render(); return true; }
      if (k === 'ArrowUp') { spin(focus, -1); return true; }
      if (k === 'ArrowDown') { spin(focus, 1); return true; }
      if (k === 'Backspace') { focus = Math.max(0, focus - 1); render(); return true; }
      return false;
    },
  };
}
function buildKeypad(root, L, solved) {
  const alpha = L.set === AZ; let val = '';
  root.style.display = 'flex'; root.style.flexDirection = 'column'; root.style.alignItems = 'center'; root.style.gap = '12px';
  const lcd = document.createElement('div'); lcd.className = 'lcd'; root.appendChild(lcd);
  const pad = document.createElement('div'); pad.className = 'keys ' + (alpha ? 'alpha' : 'num'); root.appendChild(pad);
  const render = () => { lcd.textContent = solved ? 'OPEN' : (val || ' '); };
  render();
  if (solved) return;
  const list = alpha ? AZ.split('').concat(['지움', '비움']) : '123456789'.split('').concat(['지움', '0', '비움']);
  list.forEach(k => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = k; if (k.length > 1) b.className = 'fn';
    b.addEventListener('click', () => press(k)); pad.appendChild(b);
  });
  function press(k) { sfx.tick(); if (k === '지움') val = val.slice(0, -1); else if (k === '비움') val = ''; else if (val.length < 12) val += k; render(); }
  lockUI = {
    value: () => val,
    key: e => {
      const k = keyChar(e);
      if (k.length === 1 && L.set.includes(k)) { press(k); return true; }
      if (k === 'Backspace') { press('지움'); return true; }
      return false;
    },
  };
}
/* direction lock: answer is the words joined with '/', e.g. 위/왼/아/오 */
function buildDir(root, L, solved) {
  const seq = [];
  root.style.display = 'flex'; root.style.flexDirection = 'column'; root.style.alignItems = 'center'; root.style.gap = '12px';
  const lcd = document.createElement('div'); lcd.className = 'lcd dir'; root.appendChild(lcd);
  const AR = { 위: '↑', 아: '↓', 왼: '←', 오: '→' };
  const render = () => { lcd.textContent = solved ? 'OPEN' : (seq.length ? seq.map(d => AR[d]).join(' ') + `  (${seq.length})` : ' '); };
  render();
  if (solved) return;
  const pad = document.createElement('div'); pad.className = 'dirpad'; root.appendChild(pad);
  const cells = [['지움', 'fn'], ['위', ''], ['비움', 'fn'], ['왼', ''], ['아', ''], ['오', '']];
  cells.forEach(([k, cls]) => { const b = document.createElement('button'); b.type = 'button'; b.className = cls; b.textContent = AR[k] ? `${AR[k]} ${k}` : k; b.addEventListener('click', () => press(k)); pad.appendChild(b); });
  function press(k) { sfx.tick(); if (k === '지움') seq.pop(); else if (k === '비움') seq.length = 0; else if (seq.length < 24) seq.push(k); render(); }
  lockUI = {
    value: () => seq.join('/'),
    key: e => {
      const m = { ArrowUp: '위', ArrowDown: '아', ArrowLeft: '왼', ArrowRight: '오' }[e.key];
      if (m) { press(m); return true; }
      if (e.key === 'Backspace') { press('지움'); return true; }
      return false;
    },
  };
}
const norm = s => String(s || '').replace(/[\s.,!?·~'"“”‘’]/g, '');
function textField(root, label, len, long, solved) {
  const f = document.createElement('div'); f.className = 'tfield';
  f.innerHTML = `<label>${esc(label)}</label><input class="tinput ${long ? 'long' : ''}" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" lang="ko" ${solved ? 'disabled value="열림"' : ''}>${len ? `<span class="tcount">0 / ${len}글자</span>` : ''}`;
  root.appendChild(f);
  const inp = f.querySelector('input'), cnt = f.querySelector('.tcount');
  if (cnt) inp.addEventListener('input', () => { cnt.textContent = `${[...norm(inp.value)].length} / ${len}글자`; });
  inp.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing && lockUI) { e.preventDefault(); e.stopPropagation(); submitLock(lockUI.L); } });
  return inp;
}
function buildText(root, L, solved) {
  root.style.display = 'flex'; root.style.justifyContent = 'center'; root.style.width = '100%';
  const inp = textField(root, L.label || L.type, L.len, false, solved);
  if (solved) return;
  setTimeout(() => inp.focus(), 50);
  lockUI = { value: () => norm(inp.value), key: () => false, typing: true };
}
function buildForm(root, L, solved) {
  root.style.display = 'flex'; root.style.flexDirection = 'column'; root.style.alignItems = 'center'; root.style.gap = '12px'; root.style.width = '100%';
  const inps = L.fields.map(f => textField(root, f.label, f.len, f.long, solved));
  if (solved) return;
  setTimeout(() => inps[0].focus(), 50);
  lockUI = { value: () => inps.some(i => !norm(i.value)) ? '' : inps.map(i => norm(i.value)).join('|'), key: () => false, typing: true };
}
function submitLock(L) {
  if (!lockUI || state.solved[L.id]) return;
  const v = lockUI.value(); const box = $('#lockbox'), fb = $('#fb');
  if (!v) { fb.className = 'feedback bad'; fb.textContent = L.mech === 'form' ? '모든 칸을 채워 주세요.' : '먼저 암호를 입력하세요.'; return; }
  if ([].concat(L.hash).includes(hash(v))) {   /* a lock may accept several spellings (array of hashes) */
    state.solved[L.id] = true; sfx.ok();
    box.classList.add('open'); fb.className = 'feedback ok'; fb.textContent = '철컥! 자물쇠가 열렸습니다.';
    $('#tryBtn')?.remove(); lockUI = null;
    box.querySelectorAll('input').forEach(i => { i.disabled = true; });
    onSolved(L);
  } else {
    state.wrong++; sfx.bad();
    fb.className = 'feedback bad'; fb.textContent = '열리지 않습니다. 다시 생각해 보세요.';
    box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
  }
}
function onSolved(L) {
  const entry = interactables.find(e => e.id === L.id); if (entry) setIcon(entry, 'ok');
  const p = locks3d[L.id];
  if (p && p.shackle) { p.opening = 0; }
  if (p && p.keypad) { p.keypad.material.emissive = new THREE.Color(0x1a6a3a); p.keypad.material.emissiveIntensity = 0.6; }
  const n = Object.keys(state.solved).length;
  state.stage = n;
  if (door) door.lamps[L.no - 1].material.color.setHex(0x5fd38d);
  if (T.onSolved) T.onSolved(L, api);
  updateHUD();
  if (n === NL) { const d = interactables.find(e => e.id === 'exit'); if (d) setIcon(d, 'door'); }
  setTimeout(() => { if (state.modal === 'lock') closeModal(false); startCut(L); }, 900);
}
const nClues = () => Object.keys(CLUES).length;
function goalText() {
  if (state.stage >= NL) return T.finalGoal || '출구 문이 풀렸습니다. 출구로 가서 문을 여세요.';
  const clues = Object.keys(CLUES).filter(k => state.seen[k]).length;
  return `모은 단서 ${clues} / ${nClues()} · 자물쇠를 열 때마다 다음 장치가 깨어납니다.`;
}
function placeGoal() { const h = $('#hud'); if (!h.hidden) $('#goal').style.top = Math.round(h.getBoundingClientRect().bottom - 4) + 'px'; }
addEventListener('resize', placeGoal);
function updateGoal(flash = false) {
  placeGoal();
  $('#goalNo').textContent = state.stage < NL ? `자물쇠 ${state.stage} / ${NL} 해제` : '출구 열림';
  $('#goalText').textContent = goalText();
  if (flash) { const g = $('#goal'); g.classList.remove('flash'); void g.offsetWidth; g.classList.add('flash'); }
}
function tryDoor() {
  const n = Object.keys(state.solved).length;
  if (n < NL) { sfx.bad(); toast(`출구가 잠겨 있습니다. 자물쇠 ${n}/${NL} 해제`); return; }
  if (state.finished) { toast('이미 탈출했습니다. 처음부터 다시 하려면 새로고침하세요.'); return; }
  state.finalTime = elapsed(); state.finished = true; sfx.door();
  saveRecord();
  doorOpening = 0; startExitWalk();
}

function locksPanel() {
  openModal(`<div class="head"><span class="eyebrow">자물쇠 현황</span><h2>${Object.keys(state.solved).length} / ${NL} 해제</h2><span class="meta">순서는 자유입니다. 자물쇠마다 방 안 단서 하나가 짝입니다.</span></div>
    <div class="list">${LOCKS.map(L => { const ok = state.solved[L.id];
      return `<div class="item"><span class="no">${L.no}</span><span class="t"><span>${esc(L.name)}</span><small>${esc(L.type)}</small></span>${ok ? '<span class="chip ok">열림</span>' : '<span class="chip bad">잠김</span>'}</div>`; }).join('')}</div>`);
}
function notesPanel() {
  const blog = Object.keys(CLUES).filter(k => state.seen[k]);
  const rel = Object.keys(RELATED).filter(k => state.seen['r_' + k]);
  const nRel = LOCKS.filter(l => l.related).length;
  const row = (key, title, sub, snd) => `<button class="item" type="button" data-open="${key}"><span class="no">·</span><span class="t"><span>${esc(title)}</span><small>${esc(sub)}</small></span><span class="chip">${snd ? '소리 · 보기' : '보기'}</span></button>`;
  openModal(`<div class="head"><span class="eyebrow">단서 수첩</span><h2>모은 단서 ${blog.length + rel.length}개</h2><span class="meta">한 번 살펴본 단서는 여기서 다시 볼 수 있습니다.</span></div>
    <div class="section-label">방 안 단서 (${blog.length}/${nClues()})</div>
    <div class="list">${blog.length ? blog.map(k => row(k, CLUES[k].title, CLUES[k].where, hasSound(CLUES[k]))).join('') : '<div class="empty">아직 살펴본 단서가 없습니다. 물음표나 스피커 표시가 뜬 물건을 조사하세요.</div>'}</div>
    <div class="section-label">자물쇠 연관 단서 (${rel.length}/${nRel})</div>
    <div class="list">${rel.length ? rel.map(k => { const L = LOCKS.find(l => l.related === k); return row('r_' + k, RELATED[k].title, `자물쇠 ${L.no} · ${L.name}`, hasSound(RELATED[k])); }).join('') : '<div class="empty">자물쇠를 조사하면 연관 단서가 여기에 모입니다.</div>'}</div>`);
  $('#sheet').querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.open, back = '<div class="actions"><button class="btn" type="button" id="backNotes">수첩으로</button></div>';
    if (k.startsWith('r_')) { const key = k.slice(2), L = LOCKS.find(l => l.related === key); const [html, media] = clueSheet(`연관 단서 · 자물쇠 ${L.no}`, RELATED[key], L.name, back); openModal(html, 'sheet', media); }
    else { const [html, media] = clueSheet('방 안 단서', CLUES[k], CLUES[k].where, back); openModal(html, 'sheet', media); }
    $('#backNotes').addEventListener('click', notesPanel);
  }));
}
function hintsPanel() {
  const left = HINT_LIMIT - state.hintsUsed;
  openModal(`<div class="head"><span class="eyebrow">힌트</span><h2>남은 힌트 ${left} / ${HINT_LIMIT}</h2><span class="meta">자물쇠마다 2단계 힌트가 있습니다. 1단계는 짝이 되는 단서를, 2단계는 푸는 방법을 알려 주며, 한 번 열 때마다 1개를 씁니다.</span></div>
    <div class="list">${LOCKS.map(L => { const lv = state.hint[L.id] || 0; return `<div class="hintrow"><div class="top"><span><b style="color:var(--gold);font-family:var(--f-mono)">${L.no}</b> · ${esc(L.type)} ${state.solved[L.id] ? '<span class="chip ok">열림</span>' : ''}</span>
      <span class="hb"><button type="button" data-h="${L.id}" data-lv="1" ${lv >= 1 || left <= 0 ? 'disabled' : ''}>1단계</button><button type="button" data-h="${L.id}" data-lv="2" ${lv !== 1 || left <= 0 ? 'disabled' : ''}>2단계</button></span></div>
      ${lv >= 1 ? `<p>${esc(L.hints[0])}</p>` : ''}${lv >= 2 ? `<p>${esc(L.hints[1])}</p>` : ''}</div>`; }).join('')}</div>`);
  $('#sheet').querySelectorAll('[data-h]').forEach(b => b.addEventListener('click', () => {
    if (state.hintsUsed >= HINT_LIMIT) return;
    state.hint[b.dataset.h] = +b.dataset.lv; state.hintsUsed++; sfx.click(); updateHUD(); hintsPanel();
  }));
}
function setGoalOpen(open) {
  $('#goal').classList.toggle('closed', !open); $('#goalToggle').setAttribute('aria-expanded', String(open));
  try { localStorage.setItem('bs-goal-open', open ? '1' : '0'); } catch (e) { /* storage unavailable */ }
}
$('#goalToggle').addEventListener('click', () => { sfx.click(); setGoalOpen($('#goal').classList.contains('closed')); });
try { if (localStorage.getItem('bs-goal-open') === '0') setGoalOpen(false); } catch (e) { /* storage unavailable */ }
function updateHUD() {
  if (state.started) updateGoal();
  $('#lockCount').textContent = `${Object.keys(state.solved).length}/${NL}`;
  $('#noteCount').textContent = Object.keys(state.seen).length;
  $('#hintCount').textContent = HINT_LIMIT - state.hintsUsed;
}
$('#btnLocks').addEventListener('click', () => { sfx.click(); locksPanel(); });
$('#btnNotes').addEventListener('click', () => { sfx.click(); notesPanel(); });
$('#btnHints').addEventListener('click', () => { sfx.click(); hintsPanel(); });
$('#btnSound').addEventListener('click', () => { state.muted = !state.muted; $('#btnSound').textContent = state.muted ? '소리 끔' : '소리 켬'; });

const fmt = s => { const a = Math.abs(Math.floor(s)); return `${String(Math.floor(a / 60)).padStart(2, '0')}:${String(a % 60).padStart(2, '0')}`; };
const elapsed = () => state.finished ? state.finalTime : (performance.now() - state.t0) / 1000;
let lastSec = -1;
function updateTimer() {
  if (!state.started) return;
  const rem = TIME_LIMIT - elapsed(), sec = Math.floor(rem);
  if (sec === lastSec) return; lastSec = sec;
  const el = $('#timer');
  el.textContent = rem >= 0 ? fmt(rem) : '+' + fmt(-rem);
  el.classList.toggle('low', rem < 300 && rem >= 0); el.classList.toggle('over', rem < 0);
  if (rem < 0 && !state.overShown && !state.finished) { state.overShown = true; showTimeUp(); }
  if (T.onSecond) T.onSecond(rem);
}
function showTimeUp() {
  openModal(`<div class="head"><span class="eyebrow">TIME OVER</span><h2>60분이 지났습니다</h2><span class="meta">자물쇠 ${Object.keys(state.solved).length}/${NL} 해제. 실제 방탈출이라면 여기서 종료지만, 계속 풀어 볼 수 있습니다. 타이머는 초과 시간을 셉니다.</span></div>
    <div class="actions"><button class="btn primary" type="button" id="goOn">계속 풀기</button><button class="btn" type="button" id="restart1">처음부터 다시</button><a class="btn" href="../backstage.html">테마 선택</a></div>`);
  $('#goOn').addEventListener('click', closeModal);
  $('#restart1').addEventListener('click', () => location.reload());
}

/* ------------------------------------------------------------------ tweens, sparks, reveal cutscene */
const tweens = [];
function tween(dur, fn, instant = false) { if (instant) { fn(1); return; } fn(0); tweens.push({ t: 0, dur, fn }); }
const ease = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
const bez = (a, b, c, u, out) => out.set(0, 0, 0).addScaledVector(a, (1 - u) * (1 - u)).addScaledVector(b, 2 * u * (1 - u)).addScaledVector(c, u * u);

const PMAX = 500, parts = [];
let sparkPts, sparkPos, sparkCol;
function buildSparks() {
  sparkPos = new Float32Array(PMAX * 3); sparkCol = new Float32Array(PMAX * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(sparkCol, 3));
  sparkPts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.09, map: glowTexture(), vertexColors: true, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  sparkPts.frustumCulled = false; sparkPts.renderOrder = 20; sparkPts.raycast = () => {}; scene.add(sparkPts);
  for (let i = 0; i < PMAX; i++) parts.push({ life: 0 });
}
function burst(at, color, n = 80, speed = 2.4, up = 1.2) {
  const c = new THREE.Color(color); let made = 0;
  for (const p of parts) {
    if (p.life > 0) continue;
    const th = Math.random() * TAU, ph = Math.acos(2 * Math.random() - 1), v = speed * (0.35 + Math.random() * 0.65);
    p.x = at.x; p.y = at.y; p.z = at.z; p.vx = Math.sin(ph) * Math.cos(th) * v; p.vy = Math.cos(ph) * v + up; p.vz = Math.sin(ph) * Math.sin(th) * v;
    p.max = p.life = 0.7 + Math.random() * 0.8; p.r = c.r; p.g = c.g; p.b = c.b;
    if (++made >= n) break;
  }
}
function updateSparks(dt) {
  if (!sparkPts) return;
  parts.forEach((p, i) => {
    if (p.life > 0) {
      p.life -= dt; p.vy -= 3.2 * dt; p.vx *= 0.985; p.vz *= 0.985;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      const f = Math.max(0, p.life / p.max);
      sparkPos[i * 3] = p.x; sparkPos[i * 3 + 1] = p.y; sparkPos[i * 3 + 2] = p.z;
      sparkCol[i * 3] = p.r * f; sparkCol[i * 3 + 1] = p.g * f; sparkCol[i * 3 + 2] = p.b * f;
    } else { sparkCol[i * 3] = sparkCol[i * 3 + 1] = sparkCol[i * 3 + 2] = 0; }
  });
  sparkPts.geometry.attributes.position.needsUpdate = true; sparkPts.geometry.attributes.color.needsUpdate = true;
}
let orb;
function buildOrb() {
  const mk = (scale, op, color) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, opacity: op, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); sp.scale.setScalar(scale); sp.renderOrder = 21; sp.visible = false; sp.raycast = () => {}; scene.add(sp); return sp; };
  orb = { core: mk(0.35, 1, 0xfff4d0), halo: mk(1.3, 0.55, 0xffb040), trail: Array.from({ length: 18 }, (_, i) => mk(0.3 * (1 - i / 22), 0.5 * (1 - i / 18), 0xffc060)), hist: [] };
}
function orbAt(p, show) {
  [orb.core, orb.halo].forEach(s => { s.visible = show; s.position.copy(p); });
  orb.hist.unshift(p.clone()); orb.hist.length = Math.min(orb.hist.length, 40);
  orb.trail.forEach((s, i) => { const h = orb.hist[i * 2]; s.visible = show && !!h; if (h) s.position.copy(h); });
}
function orbHide() { [orb.core, orb.halo, ...orb.trail].forEach(s => { s.visible = false; }); orb.hist.length = 0; }

/* wake a hidden related clue (or the exit). instant = skipped cutscene or debug.
   props[id] kinds: screen {mat, on} · fade {m} · pop {g} · glow {mat} · custom {reveal(instant)} */
function revealProp(id, instant = false) {
  const p = props[id];
  if (id === 'exit') {
    const d = interactables.find(e => e.id === 'exit'); if (d) setIcon(d, 'door');
    if (door) tween(1.4, u => door.lamps.forEach((l, i) => l.material.color.setHex(u >= 1 || Math.floor(u * 10 + i) % 2 ? 0x5fd38d : 0x1a4a2a)), instant);
    return;
  }
  if (!p) return;
  if (p.kind === 'screen') { p.mat.map = p.on; p.mat.needsUpdate = true; tween(1.0, u => p.mat.color.setScalar(u >= 1 ? 1 : (Math.random() < 0.4 ? 0.12 : 1) * (0.3 + 0.7 * u)), instant); }
  if (p.kind === 'fade' || p.kind === 'cards') { const ms = [].concat(p.m); ms.forEach(m => { m.visible = true; const y0 = m.userData.y0 ?? (m.userData.y0 = m.position.y); tween(0.9, u => { m.traverse(o => { if (o.material) { o.material.transparent = true; o.material.opacity = ease(u); } }); m.position.y = y0 + (1 - ease(u)) * (p.drop ?? 0.35); }, instant); }); }
  if (p.kind === 'pop') { p.g.visible = true; tween(0.8, u => { const k = u >= 1 ? 1 : u < 0.7 ? ease(u / 0.7) * 1.12 : 1.12 - (u - 0.7) / 0.3 * 0.12; p.g.scale.set(1, Math.max(0.001, k), 1); }, instant); }
  if (p.kind === 'custom') p.reveal(instant, api);
}
let cut = null;
const _o = new THREE.Vector3(), _c = new THREE.Vector3(), _l = new THREE.Vector3();
function playerEye() { return V3(player.x, player.eye, player.z); }
function cutTarget(id) { const c = T.cut[id]; return { at: V3(c.at), view: V3(c.view), color: c.color ?? 0xffd36b }; }
function startCut(L) {
  const nid = NEXT[L.id], TT = cutTarget(nid);
  const entry = interactables.find(e => e.id === L.id);
  const src = new THREE.Vector3(); entry.sprite.getWorldPosition(src); src.y -= 0.45;
  const startPos = camera.position.clone();
  const startLook = startPos.clone().add(new THREE.Vector3(0, 0, -3).applyQuaternion(camera.quaternion));
  const ctrl = src.clone().lerp(TT.at, 0.5); ctrl.y = Math.max(src.y, TT.at.y) + 3.0;
  const camMid = startPos.clone().lerp(TT.view, 0.5); camMid.y += 1.4;
  cut = { t: 0, L, nid, T: TT, src, ctrl, startPos, startLook, camMid, revealed: false, shot: false };
  state.cut = true; keys.clear(); vel.x = vel.z = 0;
  if (document.pointerLockElement) document.exitPointerLock();
  document.body.classList.add('cut'); $('#cine').classList.add('on');
  $('#caption').textContent = (T.captions[L.id] || ['', ''])[0];
  burst(src, 0xffd36b, 90, 2.0); sfx.ok();
}
function updateCut(dt) {
  const c = cut; c.t += dt; const t = c.t;
  if (t < 0.7) { _o.copy(c.src); _o.y += Math.sin(t * 9) * 0.03; orbAt(_o, true); orb.core.scale.setScalar(0.35 * ease(t / 0.7) + 0.05); }
  else if (t < 3.1) { if (!c.shot) { c.shot = true; sfx.whoosh(); } bez(c.src, c.ctrl, c.T.at, ease((t - 0.7) / 2.4), _o); orbAt(_o, true); }
  else if (!c.revealed) { c.revealed = true; orbHide(); revealProp(c.nid); burst(c.T.at, c.T.color, 140, 2.6); sfx.reveal(); $('#caption').textContent = (T.captions[c.L.id] || ['', ''])[1]; }
  const eye = playerEye();
  if (t < 3.1) { bez(c.startPos, c.camMid, c.T.view, ease(t / 3.1), _c); _l.copy(c.startLook).lerp(_o, ease(t / 0.7)); }
  else if (t < 5.0) { _c.copy(c.T.view); _l.copy(c.T.at); }
  else if (t < 6.1) { const u = ease((t - 5.0) / 1.1); _c.copy(c.T.view).lerp(eye, u); const fin = eye.clone().add(c.T.at.clone().sub(eye).normalize().multiplyScalar(3)); _l.copy(c.T.at).lerp(fin, u); }
  else { endCut(); return; }
  camera.position.copy(_c); camera.lookAt(_l);
}
function endCut() {
  const c = cut; if (!c) return;
  if (!c.revealed) { revealProp(c.nid, true); burst(c.T.at, c.T.color, 60, 2); }
  orbHide();
  const eye = playerEye(), d = c.T.at.clone().sub(eye);
  player.yaw = Math.atan2(-d.x, -d.z); player.pitch = Math.max(-1.2, Math.min(1.2, Math.atan2(d.y, Math.hypot(d.x, d.z))));
  focusKey = c.nid;
  cut = null; state.cut = false;
  document.body.classList.remove('cut'); $('#cine').classList.remove('on');
  updateGoal(true); updateLockHint();
  if (c.nid === 'exit') toast('모든 자물쇠가 열렸습니다. 출구로!', true);
}
function skipCut() { if (cut && cut.t > 0.4) endCut(); }

/* ------------------------------------------------------------------ pixel-art story scenes (192×108) */
const pixG = $('#pix').getContext('2d');
const PW = 192, PH = 108;
const P = (c, x, y, w = 1, h = 1) => { pixG.fillStyle = c; pixG.fillRect(Math.round(x), Math.round(y), w, h); };
const ptext = (txt, x, y, c, size = 8, align = 'center') => { pixG.font = `700 ${size}px "IBM Plex Sans KR", sans-serif`; pixG.textAlign = align; pixG.textBaseline = 'middle'; pixG.fillStyle = c; pixG.fillText(txt, x, y); };
const SKIN = '#f2c79a';
function kid(x, y, shirt, hair, t, o = {}) {
  y += o.jump ? -Math.abs(Math.sin(t * 9 + x)) * 5 : o.bob ? Math.round(Math.sin(t * 3 + x) * 0.6) : 0;
  if (o.back) { P(hair, x + 1, y, 6, 6); } else { P(hair, x + 1, y, 6, 2); P(SKIN, x + 1, y + 2, 6, 4); P(hair, x + 1, y + 2, 1, 2); P(hair, x + 6, y + 2, 1, 2); P('#2a1a12', x + 2, y + 3); P('#2a1a12', x + 5, y + 3); if (o.smile) P('#a0402a', x + 3, y + 5, 2, 1); }
  P(shirt, x, y + 6, 8, 5);
  if (o.armsUp) { P(shirt, x - 1, y + 2, 1, 5); P(shirt, x + 8, y + 2, 1, 5); P(SKIN, x - 1, y + 1); P(SKIN, x + 8, y + 1); }
}
let SCENES = {};

/* narration (typewriter + optional Korean TTS) */
const canSpeak = 'speechSynthesis' in window;
let koVoice = null, voiceOn = true;
try { voiceOn = localStorage.getItem('bs-voice') !== '0'; } catch (e) { /* storage unavailable */ }
function pickVoice() { if (!canSpeak) return; const vs = speechSynthesis.getVoices(); koVoice = vs.find(v => /^ko/i.test(v.lang)) || null; $('#sVoice').hidden = !koVoice; $('#sVoice').textContent = voiceOn ? '낭독 끄기' : '낭독 켜기'; }
if (canSpeak) { pickVoice(); speechSynthesis.addEventListener?.('voiceschanged', pickVoice); }
function speak(text, onend) {
  if (!canSpeak || !koVoice || !voiceOn || state.muted) return false;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text); u.voice = koVoice; u.lang = koVoice.lang; u.rate = 1.0; u.pitch = 1.0;
  u.onend = onend; u.onerror = onend; speechSynthesis.speak(u); return true;
}
function stopSpeak() { if (canSpeak) speechSynthesis.cancel(); }
$('#sVoice').addEventListener('click', () => {
  voiceOn = !voiceOn; try { localStorage.setItem('bs-voice', voiceOn ? '1' : '0'); } catch (e) { /* storage unavailable */ }
  pickVoice(); if (!voiceOn) stopSpeak(); else if (story) story.say();
});
let story = null;
function runStory(lines, { chapter, ending = false, onDone }) {
  const el = $('#story'); el.hidden = false; el.classList.toggle('ending', ending);
  $('#sChap').textContent = chapter; $('#sStats').hidden = true; $('#sNext').hidden = false; $('#sSkip').hidden = false;
  let i = 0, typed = 0, holdT = 0, spoken = true, done = false, typeAcc = 0;
  const first = Object.values(SCENES)[0];
  const S = {
    sceneT: 0,
    say() { spoken = !speak(lines[i].text, () => { spoken = true; }); },
    show(k) { i = k; typed = 0; holdT = 0; S.sceneT = 0; S.say(); },
    next() { const full = lines[i].text; if (typed < full.length) { typed = full.length; return; } if (i < lines.length - 1) S.show(i + 1); else S.finish(); },
    skip() { S.finish(); },
    finish() { if (done) return; done = true; stopSpeak(); story = null; onDone(); },
    update(dt) {
      const full = lines[i].text; S.sceneT += dt;
      if (typed < full.length) { typeAcc += dt; while (typeAcc > 0.055 && typed < full.length) { typeAcc -= 0.055; typed++; if (spoken && full[typed - 1] !== ' ' && typed % 2) sfx.blip(); } }
      else if (spoken && (i < lines.length - 1 || ending)) { holdT += dt; if (holdT > (koVoice && voiceOn ? 0.7 : 1.9)) S.next(); }
      $('#sNext').textContent = i === lines.length - 1 && !ending ? '입장하기 ▶' : '다음 ▶';
      $('#sText').innerHTML = esc(full.slice(0, typed)) + '<span class="cur"></span>';
      (SCENES[lines[i].scene] || first || (() => {}))(S.sceneT);
    },
  };
  story = S; S.show(0);
}
$('#sNext').addEventListener('click', () => { sfx.click(); story?.next(); });
$('#sSkip').addEventListener('click', () => { sfx.click(); story?.skip(); });
$('#pix').addEventListener('click', () => story?.next());

/* ------------------------------------------------------------------ escape: walk out, white-out, fireworks, epilogue, time */
let exitWalk = null;
function startExitWalk() {
  const from = camera.position.clone(), look0 = from.clone().add(new THREE.Vector3(0, 0, -3).applyQuaternion(camera.quaternion));
  exitWalk = { t: 0, from, look0 };
  if (document.pointerLockElement) document.exitPointerLock();
  document.body.classList.add('cut'); $('#cine').classList.add('on'); $('#caption').textContent = T.exitCaption || '문이 열렸다. 밖에서 빛이 쏟아진다.';
}
function updateExitWalk(dt) {
  const w = exitWalk; w.t += dt; const t = w.t;
  if (t < 1.4) { camera.position.copy(w.from).lerp(door.stand, ease(t / 1.4)); _l.copy(w.look0).lerp(door.look, ease(t / 0.9)); }
  else { camera.position.copy(door.stand).lerp(door.through, ease((t - 1.4) / 1.6)); _l.copy(door.look); }
  camera.lookAt(_l);
  doorLight.material.opacity = Math.min(1, t / 1.2);
  if (t > 2.2) $('#whiteout').style.opacity = '1';
  if (t > 3.1) { exitWalk = null; showEnding(); }
}
const fw = { on: false, rockets: [], sparks: [], confetti: [], next: 0, t: 0, g: null };
function fwStart() {
  const c = $('#fw'); c.width = innerWidth * Math.min(2, devicePixelRatio || 1); c.height = innerHeight * Math.min(2, devicePixelRatio || 1);
  fw.g = c.getContext('2d'); fw.on = true; fw.t = 0; fw.next = 0.2; fw.rockets.length = fw.sparks.length = 0;
  const W = c.width, H = c.height, cols = T.fireworkColors || ['#ffd36b', '#ff6b3d', '#5fd38d', '#5fb0ea', '#f5e6c8', '#ff8ad8'];
  fw.confetti = Array.from({ length: 160 }, () => ({ x: Math.random() * W, y: -Math.random() * H * 0.8, vy: (60 + Math.random() * 120) * (W / 1200), vx: (Math.random() - 0.5) * 60, r: Math.random() * TAU, vr: (Math.random() - 0.5) * 8, s: (5 + Math.random() * 6) * (W / 1200), c: cols[(Math.random() * cols.length) | 0] }));
  fw.cols = cols;
}
function fwUpdate(dt) {
  if (!fw.on) return;
  const g = fw.g, W = g.canvas.width, H = g.canvas.height, k = W / 1200;
  fw.t += dt; fw.next -= dt;
  if (fw.next <= 0 && fw.t < 30) { fw.next = 0.35 + Math.random() * 0.6; fw.rockets.push({ x: W * (0.15 + Math.random() * 0.7), y: H, vy: -(H * (0.9 + Math.random() * 0.35)), c: fw.cols[(Math.random() * fw.cols.length) | 0] }); }
  g.globalCompositeOperation = 'destination-out'; g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'lighter';
  for (let i = fw.rockets.length - 1; i >= 0; i--) {
    const r = fw.rockets[i]; r.y += r.vy * dt; r.vy += H * 0.9 * dt;
    g.fillStyle = '#ffe6b0'; g.fillRect(r.x - 2 * k, r.y, 4 * k, 10 * k);
    if (r.vy > -H * 0.08) { fw.rockets.splice(i, 1); sfx.pop(); const n = 70 + (Math.random() * 40 | 0); for (let j = 0; j < n; j++) { const a = j / n * TAU, v = (140 + Math.random() * 220) * k; fw.sparks.push({ x: r.x, y: r.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1.2 + Math.random() * 0.6, c: Math.random() < 0.2 ? '#fff4d8' : r.c }); } }
  }
  for (let i = fw.sparks.length - 1; i >= 0; i--) {
    const p = fw.sparks[i]; p.life -= dt; if (p.life <= 0) { fw.sparks.splice(i, 1); continue; }
    p.vx *= 0.985; p.vy = p.vy * 0.985 + 160 * k * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    g.globalAlpha = Math.min(1, p.life); g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, 2.4 * k, 0, TAU); g.fill();
  }
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  if (fw.t < 9) for (const q of fw.confetti) {
    q.y += q.vy * dt; q.x += q.vx * dt + Math.sin(fw.t * 3 + q.r) * 20 * k * dt; q.r += q.vr * dt;
    g.save(); g.translate(q.x, q.y); g.rotate(q.r); g.fillStyle = q.c; g.fillRect(-q.s / 2, -q.s / 4, q.s, q.s / 2); g.restore();
  }
}
/* best clear record, shared with the theme-select page (same origin). Key: bs-record-<theme id> */
const recordKey = () => 'bs-record-' + T.id;
function loadRecord() { try { return JSON.parse(localStorage.getItem(recordKey()) || 'null'); } catch (e) { return null; } }
function grade(t) { return t <= 20 * 60 ? 'S' : t <= 35 * 60 ? 'A' : t <= 50 * 60 ? 'B' : t <= 60 * 60 ? 'C' : 'D'; }
function saveRecord() {
  if (location.hash === '#debug') return;   /* test runs don't leave records behind */
  const t = state.finalTime, rec = { time: Math.round(t), grade: t <= TIME_LIMIT ? grade(t) : '—', hints: state.hintsUsed, wrong: state.wrong, at: Date.now() };
  const old = loadRecord();
  if (old && old.time <= rec.time) return;
  try { localStorage.setItem(recordKey(), JSON.stringify(rec)); } catch (e) { /* storage blocked: record just isn't kept */ }
}
function showEnding() {
  $('#hud').hidden = true; $('#goal').hidden = true; $('#crosshair').hidden = true; $('#help').hidden = true; $('#joy').hidden = true; $('#useBtn').hidden = true;
  document.body.classList.remove('cut'); $('#cine').classList.remove('on');
  fwStart(); sfx.fanfare();
  runStory(T.epilogue, { chapter: 'ESCAPED · ' + T.title, ending: true, onDone: showStats });
  setTimeout(() => { $('#whiteout').style.opacity = '0'; }, 120);
}
function showStats() {
  const t = state.finalTime, inTime = t <= TIME_LIMIT;
  $('#sNext').hidden = true; $('#sSkip').hidden = true; $('#story').classList.add('done');
  $('#sText').textContent = '탈출 성공';
  const st = $('#sStats'); st.hidden = false;
  st.innerHTML = `<span class="lbl">${inTime ? '탈출까지 걸린 시간' : '걸린 시간 (제한 시간 초과)'}</span><span class="big">${fmt(t)}</span>
    <div class="facts"><div><b>${state.hintsUsed}</b><span>사용한 힌트</span></div><div><b>${state.wrong}</b><span>오답</span></div><div><b class="grade">${inTime ? grade(t) : '—'}</b><span>등급</span></div></div>
    <div class="actions"><button class="btn" type="button" id="stay">방 둘러보기</button><button class="btn" type="button" id="restart2">처음부터 다시</button><a class="btn primary" href="../backstage.html">다른 테마 고르기</a></div>`;
  $('#stay').addEventListener('click', () => { fw.on = false; $('#story').hidden = true; $('#hud').hidden = false; $('#crosshair').hidden = false; $('#help').hidden = isTouch; if (isTouch) { $('#joy').hidden = false; $('#useBtn').hidden = false; } player.x = door.inside.x; player.z = door.inside.z; const d = door.look.clone().sub(door.inside); player.yaw = Math.atan2(d.x, d.z); updateLockHint(); });
  $('#restart2').addEventListener('click', () => location.reload());
}

/* ------------------------------------------------------------------ input */
const isTouch = matchMedia('(pointer: coarse)').matches;
const ptr = { x: 0, y: 0, inCanvas: false, mouse: false };
let look = null;
/* Keys are read by physical position (e.code), so WASD works even with the Korean IME on (W arrives as ㅈ in e.key). */
const MOVE_CODES = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight']);
function keyChar(e) {
  const c = e.code || '';
  if (/^Key[A-Z]$/.test(c)) return c[3];
  if (/^Digit\d$/.test(c)) return c[5];
  if (/^Numpad\d$/.test(c)) return c[6];
  return e.key.length === 1 ? e.key.toUpperCase() : e.key;
}
const SENS = 0.0022;
let locked = false, lockWorked = false;
let dragMode = isTouch || !('requestPointerLock' in canvasEl);
function requestLock() {
  if (dragMode || locked || !state.started || state.modal) return;
  try { const p = canvasEl.requestPointerLock(); if (p && p.catch) p.catch(() => onLockError()); } catch (e) { onLockError(); }
}
function onLockError() {
  if (!lockWorked && !dragMode) { dragMode = true; toast('이 화면에서는 시점 고정이 안 돼서, 드래그로 둘러보는 방식으로 바꿨습니다.'); }
  updateLockHint();
}
document.addEventListener('pointerlockerror', onLockError);
document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === canvasEl;
  if (locked) lockWorked = true; else keys.clear();
  updateLockHint();
});
document.addEventListener('mousemove', e => {
  if (!locked || state.modal) return;
  const dx = Math.max(-150, Math.min(150, e.movementX || 0)), dy = Math.max(-150, Math.min(150, e.movementY || 0));
  player.yaw -= dx * SENS; player.pitch = Math.max(-1.45, Math.min(1.45, player.pitch - dy * SENS));
});
function updateLockHint() {
  $('#lockHint').hidden = !(state.started && !state.modal && !cut && !exitWalk && !dragMode && !locked);
  $('#lockHint b').textContent = lockWorked ? '클릭해서 계속' : '클릭해서 시작';
  $('#help').innerHTML = dragMode
    ? '<kbd>WASD</kbd> 이동 · <kbd>Shift</kbd> 달리기 · 드래그로 둘러보기 · <kbd>클릭</kbd>/<kbd>E</kbd> 조사 · <kbd>N</kbd> 수첩 · <kbd>H</kbd> 힌트'
    : '<kbd>WASD</kbd> 이동 · <kbd>Shift</kbd> 달리기 · <kbd>마우스</kbd> 시점 · <kbd>클릭</kbd>/<kbd>E</kbd> 조사 · <kbd>N</kbd> 수첩 · <kbd>H</kbd> 힌트 · <kbd>Esc</kbd> 커서';
}
canvasEl.addEventListener('pointerdown', e => {
  if (cut) { skipCut(); return; }
  if (exitWalk) return;
  if (!state.started || state.modal) return;
  if (!dragMode && e.pointerType === 'mouse') {
    if (!locked) { requestLock(); return; }
    if (e.button === 0) interactNow();
    return;
  }
  if (look) return;
  look = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0, type: e.pointerType };
  canvasEl.setPointerCapture?.(e.pointerId);
});
canvasEl.addEventListener('pointermove', e => {
  ptr.x = e.clientX; ptr.y = e.clientY; ptr.inCanvas = true; ptr.mouse = e.pointerType === 'mouse';
  if (!look || look.id !== e.pointerId) return;
  const dx = e.clientX - look.x, dy = e.clientY - look.y; look.x = e.clientX; look.y = e.clientY; look.moved += Math.abs(dx) + Math.abs(dy);
  if (look.moved > 5) canvasEl.classList.add('dragging');
  const k = look.type === 'touch' ? 0.006 : 0.0034;
  player.yaw -= dx * k; player.pitch = Math.max(-1.2, Math.min(1.2, player.pitch - dy * k));
});
const endLook = e => {
  if (!look || look.id !== e.pointerId) return;
  const wasClick = look.moved <= 5; look = null; canvasEl.classList.remove('dragging');
  if (wasClick && e.type === 'pointerup' && state.started && !state.modal) { const hit = pickAssist(e.clientX, e.clientY); if (hit) tryInteract(hit); }
};
canvasEl.addEventListener('pointerup', endLook);
canvasEl.addEventListener('pointercancel', endLook);
canvasEl.addEventListener('pointerleave', () => { ptr.inCanvas = false; });

addEventListener('keydown', e => {
  if (!$('#lightbox').hidden && e.key === 'Escape') { $('#lightbox').hidden = true; return; }
  if (story) { if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowRight') { e.preventDefault(); story.next(); } else if (e.code === 'Escape') story.skip(); return; }
  if (cut) { if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape' || e.code === 'KeyE') { e.preventDefault(); skipCut(); } return; }
  if (exitWalk) return;
  if (state.modal) {
    if (e.key === 'Escape') { closeModal(false); return; }
    if (state.modal === 'lock' && lockUI) {
      if (lockUI.typing) return;   /* text inputs handle their own keys (and Korean IME composition) */
      if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.key === 'Enter') { e.preventDefault(); submitLock(lockUI.L); return; }
      if (!e.metaKey && !e.ctrlKey && lockUI.key(e)) e.preventDefault();
    }
    return;
  }
  if (!state.started) return;
  const k = e.code;
  if (MOVE_CODES.has(k) || k === 'KeyE' || k === 'KeyF' || k === 'Space') e.preventDefault();
  if (e.repeat && (k === 'KeyE' || k === 'KeyF')) return;
  if (k === 'KeyE' || k === 'KeyF') { interactNow(); return; }
  if (k === 'KeyN') { sfx.click(); notesPanel(); return; }
  if (k === 'KeyH') { sfx.click(); hintsPanel(); return; }
  if (k === 'KeyL') { sfx.click(); locksPanel(); return; }
  if (k === 'KeyG') { sfx.click(); setGoalOpen($('#goal').classList.contains('closed')); return; }
  keys.add(k);
});
addEventListener('keyup', e => keys.delete(e.code));
addEventListener('blur', () => keys.clear());

const joy = { x: 0, y: 0, id: null };
if (isTouch) {
  const J = $('#joy'), K = $('#knob');
  J.addEventListener('pointerdown', e => { joy.id = e.pointerId; J.setPointerCapture(e.pointerId); moveJoy(e); });
  J.addEventListener('pointermove', e => { if (joy.id === e.pointerId) moveJoy(e); });
  const end = e => { if (joy.id !== e.pointerId) return; joy.id = null; joy.x = joy.y = 0; K.style.transform = ''; };
  J.addEventListener('pointerup', end); J.addEventListener('pointercancel', end);
  function moveJoy(e) { const r = J.getBoundingClientRect(); let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2); const m = Math.hypot(dx, dy), max = r.width / 2 - 10; if (m > max) { dx *= max / m; dy *= max / m; } joy.x = dx / max; joy.y = dy / max; K.style.transform = `translate(${dx}px, ${dy}px)`; }
  $('#useBtn').addEventListener('click', () => { if (cut) skipCut(); else if (!state.modal && !exitWalk) interactNow(); });
}

/* picking: first solid thing under a screen point; a furniture group can hand hits to its lock (userData.proxy) */
const ray = new THREE.Raycaster(); ray.far = 30;
const ndc = new THREE.Vector2();
function pick(cx, cy0) {
  ndc.set((cx / innerWidth) * 2 - 1, -(cy0 / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(scene.children, true);
  for (const h of hits) {
    if (h.object.isSprite || h.object.isPoints) continue;
    /* hidden props (related clues not yet woken) must not catch clicks */
    let vis = true; for (let a = h.object; a; a = a.parent) if (!a.visible) { vis = false; break; }
    if (!vis) continue;
    let o = h.object;
    while (o && !o.userData.interact) { if (o.userData.proxy) { o = o.userData.proxy; break; } o = o.parent; }
    return o ? { obj: o, dist: h.distance } : null;
  }
  return null;
}
const ASSIST = [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7], [2, 0], [-2, 0], [0, 2], [0, -2], [1.4, 1.4], [-1.4, 1.4], [1.4, -1.4], [-1.4, -1.4]];
function pickAssist(cx, cy0) {
  const center = pick(cx, cy0);
  if (center && center.dist <= REACH) return center;
  const r = Math.max(10, Math.min(innerWidth, innerHeight) * 0.022);
  let best = null;
  for (const [ox, oy] of ASSIST) { const h = pick(cx + ox * r, cy0 + oy * r); if (h && h.dist <= REACH && (!best || h.dist < best.dist)) best = h; }
  return best || center;
}
function aimPick() {
  camera.rotation.set(player.pitch, player.yaw, 0); camera.position.x = player.x; camera.position.z = player.z; camera.updateMatrixWorld();
  const useMouse = dragMode && !isTouch && ptr.mouse && ptr.inCanvas && !look;
  return useMouse ? pickAssist(ptr.x, ptr.y) : pickAssist(innerWidth / 2, innerHeight / 2);
}
function interactNow() { const hit = aimPick(); current = hit; if (hit) tryInteract(hit); }
let current = null;
function tryInteract(hit) {
  if (hit.dist > REACH) { toast('조금 더 가까이 가야 조사할 수 있습니다.'); return; }
  const { kind, id } = hit.obj.userData.interact; sfx.click();
  if (kind === 'clue') openClue(id);
  else if (kind === 'lock') openLock(id);
  else if (kind === 'door') tryDoor();
  else if (kind === 'poster') openPoster();
}
let pickFrame = 0;
function updateHover() {
  if (!state.started || state.modal || cut || exitWalk) { $('#prompt').hidden = true; return; }
  if (++pickFrame % 2) return;
  const useMouse = dragMode && !isTouch && ptr.mouse && ptr.inCanvas && !look;
  const hit = aimPick();
  current = hit;
  const pr = $('#prompt');
  if (!hit) { pr.hidden = true; canvasEl.classList.remove('hot'); return; }
  const it = hit.obj.userData.interact, near = hit.dist <= REACH;
  let label = it.label;
  if (it.kind === 'lock') label += state.solved[it.id] ? ' · 열림' : ' · 잠김';
  if (it.kind === 'door') label += ` · ${Object.keys(state.solved).length}/${NL}`;
  if (it.kind === 'clue' && hasSound(CLUES[it.id])) label += ' · 소리';
  pr.innerHTML = near ? `<span class="k">${isTouch ? '탭' : '클릭 / E'}</span>${esc(label)}` : `${esc(label)} · 더 가까이 가세요`;
  pr.classList.toggle('far', !near); pr.hidden = false;
  canvasEl.classList.toggle('hot', near && useMouse);
}

/* movement */
function blocked(x, z) {
  const r = player.r;
  if (x < bounds[0] || x > bounds[1] || z < bounds[2] || z > bounds[3]) return true;
  for (const c of colliders) if (x > c.x0 - r && x < c.x1 + r && z > c.z0 - r && z < c.z1 + r) return true;
  return false;
}
const vel = { x: 0, z: 0 };
const WALK = 3.4, RUN = 6.0;
let bob = 0, bobAmp = 0, last = 0, blinkT = 0;
function move(dt) {
  let f = 0, s = 0;
  if (keys.has('KeyW') || keys.has('ArrowUp')) f += 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) f -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) s += 1;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) s -= 1;
  f -= joy.y; s += joy.x;
  let m = Math.hypot(f, s);
  if (m > 1) { f /= m; s /= m; m = 1; }
  const run = keys.has('ShiftLeft') || keys.has('ShiftRight');
  const speed = (run ? RUN : WALK) * (m > 0.05 ? 1 : 0);
  const sy = Math.sin(player.yaw), cyw = Math.cos(player.yaw);
  const tx = (-sy * f + cyw * s) * speed, tz = (-cyw * f - sy * s) * speed;
  const k = 1 - Math.exp(-dt * (speed > 0 ? 11 : 16));
  vel.x += (tx - vel.x) * k; vel.z += (tz - vel.z) * k;
  const dx = vel.x * dt, dz = vel.z * dt;
  if (!blocked(player.x + dx, player.z)) player.x += dx; else vel.x = 0;
  if (!blocked(player.x, player.z + dz)) player.z += dz; else vel.z = 0;
  const v = Math.hypot(vel.x, vel.z);
  bob += dt * v * 2.7; bobAmp = Math.min(1, v / WALK);
}
const _v = new THREE.Vector3();
function animate(t, dt) {
  if (!cut && !exitWalk) { camera.position.set(player.x, player.eye + Math.sin(bob) * 0.03 * bobAmp, player.z); camera.rotation.set(player.pitch, player.yaw, 0); }
  for (let i = tweens.length - 1; i >= 0; i--) { const w = tweens[i]; w.t += dt; const u = Math.min(1, w.t / w.dur); w.fn(u); if (u >= 1) tweens.splice(i, 1); }
  updateSparks(dt);
  for (const s of spinners) s.m.rotation[s.axis] += s.speed * dt;
  for (const f of tickers) f(t, dt);
  blinkT += dt;
  if (blinkT > 0.45) { blinkT = 0; const on = Math.floor(t / 0.45) % 2; bulbs.forEach(b => b.m.material.color.setHex(zone(b.n).t < 1 ? 0x2a1d14 : (on ^ b.alt) ? 0xfff2c0 : 0x8a6a30)); }
  for (const k in ZONES) { const z = ZONES[k]; if (z.on && z.t < 1) { z.t = Math.min(1, z.t + dt / 1.8); applyZone(z, z.t < 0.7 && Math.random() < 0.35 ? 0.15 : 1); } }
  const F = FOCUS[focusKey] || FOCUS.start;
  if (F && focus) {
    focus.position.lerp(F[0], 1 - Math.exp(-dt * 2.2)); focus.target.position.lerp(F[1], 1 - Math.exp(-dt * 2.2));
    const fGoal = (state.started ? 1.5 : 0.9) * (T.focusIntensity || 1); focus.intensity += (fGoal - focus.intensity) * (1 - Math.exp(-dt * 1.5));
  }
  if (dust) { dust.rotation.y = t * 0.012; dust.position.y = Math.sin(t * 0.3) * 0.08; }
  for (const e of interactables) {
    e.sprite.position.y = e.baseY + Math.sin(t * 2 + e.phase) * 0.05;
    e.sprite.getWorldPosition(_v); const d = _v.distanceTo(camera.position);
    const pend = isPending(e);
    e.sprite.material.depthTest = !pend; e.sprite.renderOrder = pend ? 10 : 0;
    e.sprite.scale.setScalar(0.26 * (pend ? Math.max(1, d / 5) : 1) * (pend ? 1 + Math.sin(t * 4 + e.phase) * 0.08 : 1));
    e.sprite.material.opacity = Math.max(0, Math.min(1, (d - 1.2) / 1.3));
  }
  for (const id in locks3d) { const p = locks3d[id]; if (p.opening !== undefined && p.opening < 1) { p.opening = Math.min(1, p.opening + dt * 1.5); p.shackle.position.y = 0.085 + p.opening * 0.06; p.shackle.rotation.y = p.opening * 1.2; p.body.material.emissive = new THREE.Color(0x1a6a3a); p.body.material.emissiveIntensity = p.opening * 0.7; } }
  if (door && doorOpening >= 0 && doorOpening < 1) { doorOpening = Math.min(1, doorOpening + dt * 0.8); door.pivot.rotation.y = -doorOpening * 1.45; }
  if (T.animate) T.animate(t, dt, api);
}
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
  if (state.started && !state.modal && !cut && !exitWalk) move(dt);
  animate(now / 1000, dt);
  if (cut) updateCut(dt);
  if (story) story.update(dt);
  fwUpdate(dt);
  if (exitWalk) updateExitWalk(dt);
  updateHover();
  updateTimer();
  renderer.render(scene, camera);
}
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

/* ------------------------------------------------------------------ API for themes */
const api = {
  THREE, scene, camera, renderer, state, player, TAU, AZ, az, DIGITS,
  M, Bm, bx, cy, mesh, grp, collide, rng, tex, imgTex, plane, rrect, glowText, drawCard, glow, buildDust, bulbRow, rectBulbs,
  zone, zl, zm, zg, setZone, V3, props, locks3d, spinners, tickers, brass, padlock, keypadTex, framed,
  makeInteract, setIcon, interactables, exitDoor, poster, tween, ease, burst, sfx, toast, esc, hash,
  P, ptext, kid, SKIN, PW, PH, get pixG() { return pixG; },
  get focus() { return focus; }, isReady,
};

async function loadFonts() {
  const sample = (T.fontSample || '') + ' EXIT 0123456789 자물쇠 단서 출구 열림 잠김';
  const specs = (T.fonts || []).concat(['48px Bungee', '400 32px "IBM Plex Sans KR"', '600 32px "IBM Plex Sans KR"', '600 32px "IBM Plex Mono"', '500 32px "IBM Plex Mono"']);
  try { await Promise.race([Promise.all(specs.map(s => document.fonts.load(s, sample))), new Promise(r => setTimeout(r, 5000))]); } catch (e) { /* fall back to system fonts */ }
}

function run(theme) {
  T = theme;
  T.cut = T.cut || {}; T.captions = T.captions || {};
  LOCKS = T.locks.slice().sort((a, b) => a.no - b.no);
  NL = LOCKS.length;
  LOCK_BY_ID = Object.fromEntries(LOCKS.map(l => [l.id, l]));
  CLUES = T.clues; RELATED = T.related || {};
  LOCKS.forEach((L, i) => { NEXT[L.id] = LOCKS[i + 1] ? LOCKS[i + 1].id : 'exit'; if (i) PREV[L.id] = LOCKS[i - 1].id; });
  if (T.focus) for (const k in T.focus) FOCUS[k] = [V3(T.focus[k][0]), V3(T.focus[k][1])];
  if (T.bounds) bounds = T.bounds;
  Object.assign(player, T.player || {});
  if (T.sky !== undefined) { scene.background = new THREE.Color(T.sky); scene.fog = new THREE.Fog(T.sky, T.fog ? T.fog[0] : 12, T.fog ? T.fog[1] : 34); }
  if (T.exposure) renderer.toneMappingExposure = T.exposure;

  document.title = T.docTitle || T.title;
  $('#hudBrand').textContent = T.brand || T.title; $('#hudSub').textContent = `${T.week}주차 · ${T.tag}`;
  /* absolute, because a relative url() in a custom property resolves against engine.css, not the page */
  document.documentElement.style.setProperty('--poster', `url('${new URL(T.poster, location.href).href}')`);
  $('#introArt').setAttribute('aria-label', T.posterAlt || T.title);
  $('#introEyebrow').textContent = `BACK STAGE · ${T.week}주차 테마`;
  $('#introTitle').innerHTML = T.titleHTML || esc(T.title);
  $('#introTag').textContent = T.tag;
  $('#introText').innerHTML = (T.intro || []).map(p => `<p>${esc(p)}</p>`).join('');
  $('#introLocks').textContent = NL;
  { const r = loadRecord(), el = $('#bestRec'); if (r && el) { el.hidden = false; el.textContent = `내 최고 기록 ${fmt(r.time)} · 등급 ${r.grade}`; } }
  updateHUD();

  if (location.hash === '#debug') window.__bs = { state, api, colliders, blocked, get bounds() { return bounds; }, openLock, openClue, notesPanel, hintsPanel, locksPanel, tryDoor, closeModal, submit: () => lockUI && submitLock(lockUI.L), interactables, ZONES, aimPick, revealProp, startCut: id => startCut(LOCK_BY_ID[id]), skipCut, runStory, showEnding,
    /* advance the simulation by hand (tests in a hidden tab, where requestAnimationFrame is paused) */
    tick: (sec = 1) => { for (let k = 0; k < sec * 30; k++) { const dt = 1 / 30; last += dt * 1000; if (state.started && !state.modal && !cut && !exitWalk) move(dt); animate(last / 1000, dt); if (cut) updateCut(dt); if (story) story.update(dt); fwUpdate(dt); if (exitWalk) updateExitWalk(dt); } },
    teleport:(x, z, yaw = 0, pitch) => { player.x = x; player.z = z; player.yaw = yaw; if (pitch !== undefined) player.pitch = pitch; } };

  (async () => {
    await loadFonts();
    ['clue', 'seen', 'lock', 'ok', 'door', 'doorLocked', 'poster', 'sound', 'soundSeen', 'link'].forEach(k => ICON[k] = iconTex(k));
    focus = new THREE.SpotLight(0xffe7c0, 0, 13, 0.42, 0.6, 1);
    focus.castShadow = true; focus.shadow.mapSize.set(1024, 1024); focus.shadow.bias = -0.0006; focus.shadow.normalBias = 0.02;
    focus.shadow.camera.near = 0.5; focus.shadow.camera.far = 14;
    if (FOCUS.start) { focus.position.copy(FOCUS.start[0]); focus.target.position.copy(FOCUS.start[1]); }
    scene.add(focus, focus.target);
    T.build(api);
    if (!door) console.warn('theme did not call api.exitDoor()');
    SCENES = T.scenes ? T.scenes(api) : {};
    buildSparks(); buildOrb();
    scene.traverse(o => { if (o.isMesh && !o.material.isMeshBasicMaterial && !(o.material.transparent && o.material.opacity < 0.5)) { o.castShadow = true; o.receiveShadow = true; } });
    Object.values(ZONES).forEach(z => applyZone(z));
    camera.position.set(player.x, player.eye, player.z);
    requestAnimationFrame(loop);
    const sb = $('#startBtn'); sb.disabled = false; sb.textContent = '입장하기';
    sb.addEventListener('click', () => {
      audio(); sfx.click(); pickVoice();
      $('#intro').hidden = true;
      runStory(T.prologue, { chapter: `BACK STAGE · ${T.week}주차`, onDone: beginGame });
    });
  })();
  function beginGame() {
    $('#story').hidden = true; $('#hud').hidden = false; $('#help').hidden = isTouch; $('#crosshair').hidden = false; $('#goal').hidden = false; updateGoal(true);
    if (isTouch) { $('#joy').hidden = false; $('#useBtn').hidden = false; }
    state.started = true; state.t0 = performance.now();
    updateLockHint(); requestLock();
    toast(T.startToast || '물음표는 방 안 단서, 스피커는 소리 단서, 빛나는 자물쇠가 지금 열 수 있는 장치입니다.');
  }
}

window.BackStage = { run, api, hash };
})();
