/* Stage 90 — game engine. One save in localStorage; stages (단계) live in stageN.js as window.S90_STAGES[N].
   Flow per 단계: pick the order of the 9 normal missions → for each: brief (도전 / 패스 / 아이템) → 3·2·1 → mission →
   result → … → boss (no pass, no items) → 단계 결산 (HP rules) → next 단계. */
(() => {
'use strict';

const SAVE_KEY = 's90-save-v1';
const DEBUG = location.hash === '#debug';
const NORMAL = ['행운', '수리', '타자', '암호', '눈치', '두뇌', '반응', '순서', '지식'];
const BOSS = '보스';
const LAST_STAGE = 9, HP_START = 3, HP_MAX = 5, PASS_PER_STAGE = 2;
const ITEMS = {
  shield:  { icon: '🛡️', name: '방패', start: 3, desc: '도전 직전에 사용을 선언합니다. 실패하더라도 Level이 내려가지 않고 패스로 처리됩니다. 보스 스테이지에선 사용할 수 없습니다.' },
  potion:  { icon: '🧪', name: 'HP 물약', start: 1, desc: 'HP를 1 올려 줍니다. HP가 0이 되는 순간에는 자동으로 사용됩니다.' },
  reality: { icon: '🔴', name: '리얼리티 스톤', start: 1, desc: '미션의 정확한 룰과 문제를 미리 열람한 뒤 30초 안에 도전 여부를 결정합니다.' },
  space:   { icon: '🔷', name: '스페이스 스톤', from: 1, desc: '도전 실패 결과를 확인한 직후 사용하면 실패를 무효로 하고 해당 스테이지를 패스 처리합니다.' },
  mind:    { icon: '🟡', name: '마인드 스톤', from: 2, desc: 'Normal Stage 성공 시 보상을 +1 Level 대신 +1 HP로 받습니다.' },
  power:   { icon: '🟣', name: '파워 스톤', from: 3, desc: '도전 시작 전 사용을 선언하면 해당 미션의 제한 시간이 무제한이 됩니다.' },
  time:    { icon: '🟢', name: '타임 스톤', from: 4, desc: '도전에 실패했을 때 시간을 되돌려 같은 문제로 최대 2번까지 재도전합니다.' },
  soul:    { icon: '🟠', name: '소울 스톤', from: 5, desc: '언제든 HP 1과 Level 2를 원하는 방향으로 교환합니다.' },
  chronos: { icon: '⏳', name: '크로노스의 눈', from: 6, desc: 'Level 및 순위 2명을 확인합니다. 7단계 보스에 실패해도 아이템을 획득합니다.' },
  caesar:  { icon: '☀️', name: '카이사르의 달력', from: 7, desc: '특정 테마 도전 전에 사용 후 성공하면, 그 테마의 1~6단계 결과를 모두 패스로 바꿉니다.' },
};
const R_LABEL = { success: '성공', fail: '실패', pass: '패스', shield: '방패 (패스)', space: '스페이스 스톤 (패스)' };

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const STAGES = window.S90_STAGES || {};
function hash(s) { let x = 0x811c9dc5; for (const c of ('s90:' + s)) { x ^= c.charCodeAt(0); x = Math.imul(x, 0x01000193) >>> 0; } return x.toString(36); }
const norm = s => String(s).normalize('NFC').toLowerCase().replace(/\s+/g, '').replace(/[%.,!?'"~·]/g, '');
const rand = n => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };

/* ------------------------------------------------------------------ state */
function fresh() {
  const items = {}; for (const k in ITEMS) items[k] = ITEMS[k].start || 0;
  return { v: 1, stage: 1, phase: 'order', order: NORMAL.slice(), idx: 0, level: 0, hp: HP_START, items,
    stats: { normalWin: 0, normalFail: 0, bossWin: 0, bossFail: 0, passes: 0 },
    weeks: {}, cur: null, out: false, started: Date.now(), log: [] };
}
let S = load();
function load() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); return s && s.v === 1 ? s : null; } catch (e) { return null; } }
function save() { if (!S) return; try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* private mode: progress only lives in memory */ } }
function wipe() { S = null; try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ } }
const week = () => (S.weeks[S.stage] = S.weeks[S.stage] || { results: {}, passes: 0, hp: [] });
const seq = () => S.order.concat(BOSS);
const curType = () => seq()[S.idx];
const mission = t => STAGES[S.stage] && STAGES[S.stage].missions[t];
const weekLevel = () => Object.values(week().results).reduce((a, r) => a + (r.delta || 0), 0);
function log(msg) { S.log.push({ t: Date.now(), stage: S.stage, msg }); if (S.log.length > 300) S.log.shift(); }

/* HP with the potion rule: hitting 0 drinks the potion automatically */
function hurt(n, why) {
  S.hp = Math.max(0, S.hp - n); week().hp.push({ d: -n, why });
  if (S.hp <= 0 && S.items.potion > 0) { S.items.potion--; S.hp = 1; week().hp.push({ d: +1, why: 'HP 물약 자동 사용' }); toast('🧪 HP가 0이 되어 HP 물약이 자동으로 사용됐습니다.'); }
  if (S.hp <= 0) { S.out = true; log('HP 0 · 퇴장'); }
}
function heal(n, why) { const before = S.hp; S.hp = Math.min(HP_MAX, S.hp + n); if (S.hp > before) week().hp.push({ d: S.hp - before, why }); }

/* ------------------------------------------------------------------ HUD */
function hud() {
  const on = !!S && view !== 'home';
  $('#hud').hidden = !on; if (!on) return;
  $('#hStage').innerHTML = `${S.stage}<em>단계</em>`;
  const wl = weekLevel();
  $('#hLevel').innerHTML = `${S.level > 0 ? '+' : ''}${S.level}<em>이번 단계 ${wl > 0 ? '+' : ''}${wl}</em>`;
  $('#hHp').innerHTML = Array.from({ length: HP_MAX }, (_, i) => `<i class="${i < S.hp ? '' : 'off'}">♥</i>`).join('');
  $('#hHp').setAttribute('aria-label', `HP ${S.hp} / ${HP_MAX}`);
  const used = week().passes;
  $('#hPass').innerHTML = Array.from({ length: PASS_PER_STAGE }, (_, i) => `<i class="${i < used ? 'used' : ''}"></i>`).join('');
  $('#hPass').setAttribute('aria-label', `패스 ${PASS_PER_STAGE - used}회 남음`);
  $('#hItems').innerHTML = Object.entries(ITEMS).filter(([k, it]) => it.start || S.items[k] > 0)
    .map(([k, it]) => `<button type="button" class="item ${S.items[k] ? '' : 'zero'}" data-item="${k}" title="${esc(it.name)}">${it.icon}<span>${esc(it.name)}</span><b>${S.items[k]}</b></button>`).join('');
  const res = week().results;
  $('#track').innerHTML = seq().map((t, i) => {
    const r = res[t]; return `<div class="slot ${t === BOSS ? 'boss' : ''} ${r ? r.r : ''} ${i === S.idx && S.phase === 'missions' && !r ? 'now' : ''}" title="${t}${r ? ' · ' + R_LABEL[r.r] : ''}">${t}</div>`;
  }).join('');
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-item]'); if (!b) return;
  const k = b.dataset.item, it = ITEMS[k];
  const canDrink = k === 'potion' && S.items.potion > 0 && S.hp < HP_MAX && !S.out && view !== 'play' && view !== 'count';
  modal(`<h3>${it.icon} ${esc(it.name)} <small style="color:var(--gold)">× ${S.items[k]}</small></h3><p>${esc(it.desc)}</p>
    ${k === 'potion' && S.hp >= HP_MAX ? '<p class="hint">HP가 최대(5)라 지금은 쓸 수 없습니다.</p>' : ''}
    <div class="btns">${canDrink ? '<button class="btn go" type="button" data-act="drink">지금 사용 (HP +1)</button>' : ''}<button class="btn ghost" type="button" data-act="close">닫기</button></div>`,
  { drink: () => { S.items.potion--; heal(1, 'HP 물약 사용'); log('HP 물약 사용'); save(); hud(); toast('🧪 HP +1'); } });
});
$('#rulesBtn').addEventListener('click', () => modal(`<h3>Stage 90 룰</h3>${rulesHTML()}<div class="btns"><button class="btn ghost" type="button" data-act="close">닫기</button></div>`));
$('#homeLink').addEventListener('click', e => { e.preventDefault(); if (view === 'play' || view === 'count') return; go('home'); });

function rulesHTML() {
  return `<ul>
    <li><b>Normal Stage</b> 9개(행운·수리·타자·암호·눈치·두뇌·반응·순서·지식)를 원하는 순서로 도전합니다. 성공 +1 Level, 실패 −1 Level.</li>
    <li><b>패스</b>는 도전 시작 전에만, 단계마다 최대 ${PASS_PER_STAGE}번. Level 변화 없음.</li>
    <li><b>Boss Stage</b>는 마지막에 고정. 패스·아이템 사용 불가. 성공 +1 Level·+1 HP와 스톤 획득, 실패 −1 Level·−1 HP.</li>
    <li><b>HP</b>는 3에서 시작(최대 5). 단계가 끝났을 때 그 단계 Level 합이 음수면 −1. HP 0이면 퇴장.</li>
    <li><b>아이템</b>: 🛡️ 방패 3회(실패해도 패스 처리), 🧪 HP 물약 1회(HP 0일 때 자동 사용), 🔴 리얼리티 스톤 1회(문제를 미리 보고 30초 안에 결정).</li>
    <li><b>단어 문제</b>(반응 초성게임, 단어 만들기 보스)는 <b>뉴에이스 국어사전</b>(macOS 내장 국어사전) 표제어 기준으로 채점합니다.</li>
    <li>9단계 × 10스테이지 = 90 Stage. 최종 Level이 가장 높은 배역이 최종장에 진출합니다.</li>
  </ul>`;
}

/* ------------------------------------------------------------------ modal / toast */
let modalActs = {};
function modal(html, acts = {}) { modalActs = acts; const m = $('#modal'); m.innerHTML = `<div class="card" role="dialog" aria-modal="true">${html}</div>`; m.hidden = false; const f = m.querySelector('.btn'); if (f) f.focus(); }
function closeModal() { $('#modal').hidden = true; $('#modal').innerHTML = ''; }
$('#modal').addEventListener('click', e => {
  if (e.target.id === 'modal') return closeModal();
  const a = e.target.closest('[data-act]'); if (!a) return;
  const fn = modalActs[a.dataset.act]; closeModal(); if (fn) fn();
});
let toastT = 0;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2600); }

/* ------------------------------------------------------------------ router */
let view = 'home', timer = null;
function stopTimer() { if (timer) { cancelAnimationFrame(timer.raf); clearTimeout(timer.to); timer = null; } }
function go(v, arg) {
  stopTimer(); view = v; const el = $('#view');
  el.innerHTML = `<section class="screen">${SCREENS[v](arg)}</section>`;
  hud(); window.scrollTo(0, 0);
  if (BIND[v]) BIND[v](arg);
}
function resume() {
  if (!S) return go('home');
  if (S.out) return go('out');
  if (S.phase === 'order') return go(STAGES[S.stage] ? 'order' : 'wait');
  if (S.phase === 'weekEnd') return go('weekEnd');
  if (S.phase === 'final') return go('final');
  if (S.idx >= 10) return finishWeek();
  return go('brief');
}

/* ------------------------------------------------------------------ screens */
const SCREENS = {}, BIND = {};

SCREENS.home = () => {
  const s = S, hasSave = !!s;
  return `<div class="hero"><div class="eyebrow">SURVIVAL QUIZ SHOW</div><h1>STAGE <b>90</b></h1>
    <p>9단계 × 10스테이지. 행운·수리·타자·암호·눈치·두뇌·반응·순서·지식, 그리고 보스. 순서를 정하고, 도전할지 패스할지 아이템을 쓸지 고르세요.</p></div>
    ${hasSave ? `<div class="save">
      <div class="stat"><small>진행</small><strong>${s.out ? '퇴장' : s.phase === 'final' ? '완주' : `${s.stage}단계`}<em>${s.phase === 'missions' ? (s.idx >= 10 ? '결산 전' : `${s.idx + 1}/10`) : s.phase === 'weekEnd' ? '결산' : ''}</em></strong></div>
      <div class="stat"><small>LEVEL</small><strong>${s.level > 0 ? '+' : ''}${s.level}</strong></div>
      <div class="stat"><small>HP</small><strong>${s.hp} / ${HP_MAX}</strong></div>
      <div class="stat"><small>아이템</small><strong>${Object.entries(ITEMS).filter(([k]) => s.items[k] > 0).map(([k, it]) => it.icon + s.items[k]).join(' ') || '없음'}</strong></div>
    </div>` : ''}
    <div class="btns home-btns">
      ${hasSave ? '<button class="btn go big" type="button" id="cont">이어하기</button><button class="btn big" type="button" id="newg">새로 시작</button>' : '<button class="btn go big" type="button" id="newg">시작하기</button>'}
    </div>
    ${hasSave ? '<div class="btns home-btns"><button class="btn warn" type="button" id="reset">진행 기록 초기화</button></div>' : ''}
    <details class="rules card"><summary>룰 보기</summary>${rulesHTML()}</details>
    <p class="hint" style="text-align:center;margin-top:18px">진행 상황은 이 브라우저에 자동 저장됩니다. · <a href="../index.html">← 메인 메뉴</a></p>`;
};
BIND.home = () => {
  const c = $('#cont'); if (c) c.onclick = resume;
  $('#newg').onclick = () => {
    if (S) return modal('<h3>새로 시작할까요?</h3><p>지금까지의 진행 기록이 지워지고 1단계부터 다시 시작합니다.</p><div class="btns"><button class="btn warn" data-act="yes" type="button">새로 시작</button><button class="btn ghost" data-act="close" type="button">취소</button></div>', { yes: start });
    start();
  };
  const r = $('#reset'); if (r) r.onclick = () => modal('<h3>진행 기록을 초기화할까요?</h3><p>Level, HP, 아이템, 단계 결과가 모두 지워집니다. 되돌릴 수 없습니다.</p><div class="btns"><button class="btn warn" data-act="yes" type="button">초기화</button><button class="btn ghost" data-act="close" type="button">취소</button></div>', { yes: () => { wipe(); go('home'); toast('진행 기록을 초기화했습니다.'); } });
};
function start() { S = fresh(); save(); go('order'); }

/* ---- order: choose the order of the remaining normal missions; boss stays last */
SCREENS.order = () => {
  const done = week().results, mid = S.phase === 'missions';
  return `<div class="card"><div class="eyebrow">${S.stage}단계 · 도전 순서</div>
    <h2 style="margin-top:6px">${mid ? '남은 미션 순서 바꾸기' : '어떤 순서로 도전할까요?'}</h2>
    <p class="hint">▲▼로 순서를 바꾸세요. 보스는 항상 마지막입니다.</p>
    <ol class="olist" id="olist">${S.order.map((t, i) => `<li class="orow ${done[t] ? 'done' : ''}" data-i="${i}">
      <span class="n">${String(i + 1).padStart(2, '0')}</span><span class="t">${t}<small>${esc((mission(t) || {}).rules ? mission(t).rules[0] : '')}</small></span>
      <span class="mv"><button type="button" data-mv="-1" aria-label="${t} 위로" ${done[t] || i === 0 || done[S.order[i - 1]] ? 'disabled' : ''}>▲</button><button type="button" data-mv="1" aria-label="${t} 아래로" ${done[t] || i === S.order.length - 1 ? 'disabled' : ''}>▼</button></span></li>`).join('')}
      <li class="orow boss"><span class="n">10</span><span class="t" style="color:var(--pink)">보스<small>패스·아이템 불가</small></span><span></span></li></ol>
    <div class="btns"><button class="btn go big" type="button" id="ogo">${mid ? '이 순서로 계속' : '이 순서로 시작'}</button><button class="btn" type="button" id="oshuf">랜덤 섞기</button></div></div>`;
};
BIND.order = () => {
  $('#olist').onclick = e => {
    const b = e.target.closest('[data-mv]'); if (!b) return;
    const i = +b.closest('.orow').dataset.i, j = i + +b.dataset.mv; [S.order[i], S.order[j]] = [S.order[j], S.order[i]]; save(); go('order');
  };
  $('#oshuf').onclick = () => {
    const done = week().results, free = S.order.filter(t => !done[t]);
    for (let i = free.length - 1; i > 0; i--) { const j = rand(i + 1); [free[i], free[j]] = [free[j], free[i]]; }
    S.order = S.order.filter(t => done[t]).concat(free); save(); go('order');
  };
  $('#ogo').onclick = () => {
    const done = week().results; S.order = S.order.filter(t => done[t]).concat(S.order.filter(t => !done[t]));
    S.idx = S.order.filter(t => done[t]).length; S.phase = 'missions'; log(`순서: ${S.order.join('·')}`); save(); go('brief');
  };
};

/* ---- brief: type, level, short description, then 도전 / 패스 / items */
let declare = { shield: false };
SCREENS.brief = () => {
  const t = curType(), m = mission(t), boss = t === BOSS, w = week();
  const passLeft = PASS_PER_STAGE - w.passes;
  return `<div class="card brief"><div class="eyebrow">${S.stage}단계 · 스테이지 ${S.idx + 1} / 10${boss ? ' · BOSS STAGE' : ''}</div>
    <div class="type ${boss ? 'boss' : ''}">${t}</div>
    <div class="lv">Lv.${m.lv}${m.name ? ' · ' + esc(m.name) : ''}</div>
    <p class="desc">${esc(m.brief)}</p>
    <div class="chips">${m.rules.map(r => `<span>${esc(r)}</span>`).join('')}</div>
    ${boss ? `<p class="hint">성공하면 +1 Level · +1 HP · ${ITEMS[STAGES[S.stage].bossReward].icon} ${ITEMS[STAGES[S.stage].bossReward].name} 획득, 실패하면 −1 Level · −1 HP</p>` : `
    <div class="toggles">
      <button class="toggle" type="button" id="tShield" aria-pressed="${declare.shield}" ${S.items.shield ? '' : 'disabled'}>🛡️ 방패 사용 선언 <small>(${S.items.shield})</small></button>
      <button class="toggle" type="button" id="tReality" ${S.items.reality ? '' : 'disabled'}>🔴 리얼리티 스톤으로 미리 보기 <small>(${S.items.reality})</small></button>
    </div>`}
    <div class="btns"><button class="btn go big" type="button" id="bgo">도전</button>
      ${boss ? '' : `<button class="btn big" type="button" id="bpass" ${passLeft > 0 ? '' : 'disabled'}>패스 <small>남은 ${passLeft}회</small></button>`}</div>
    ${boss ? '' : '<button class="link" type="button" id="reorder">남은 순서 바꾸기</button>'}</div>`;
};
BIND.brief = () => {
  const t = curType(), boss = t === BOSS;
  $('#bgo').onclick = () => challenge(t);
  if (boss) return;
  $('#bpass').onclick = () => doPass(t);
  $('#reorder').onclick = () => go('order');
  $('#tShield').onclick = e => { declare.shield = !declare.shield; e.currentTarget.setAttribute('aria-pressed', declare.shield); };
  $('#tReality').onclick = () => modal(`<h3>🔴 리얼리티 스톤을 쓸까요?</h3><p>${esc(t)} 미션의 문제를 미리 열람하고, 30초 안에 도전할지 패스할지 정합니다. (남은 ${S.items.reality}개)</p><div class="btns"><button class="btn go" data-act="yes" type="button">사용</button><button class="btn ghost" data-act="close" type="button">취소</button></div>`,
    { yes: () => { S.items.reality--; S.cur = { type: t, reality: true }; log(`${t}: 리얼리티 스톤`); save(); go('reality'); } });
};
function doPass(t) {
  const w = week(); if (w.passes >= PASS_PER_STAGE || t === BOSS) return;
  w.passes++; S.stats.passes++; declare = { shield: false }; record(t, 'pass', 0); log(`${t}: 패스`);
  go('result', { t, r: 'pass' });
}

/* ---- reality stone: preview with a 30 s decision clock */
SCREENS.reality = () => {
  const t = curType(), m = mission(t), w = week(), passLeft = PASS_PER_STAGE - w.passes;
  return `<div class="timer" id="tm"><div class="bar"><i></i></div><div class="sec">30</div></div>
    <div class="card qcard"><div class="tag">🔴 리얼리티 스톤 · ${t} Lv.${m.lv} 미리 보기</div>${preview(t, m)}
      <div class="chips">${m.rules.map(r => `<span>${esc(r)}</span>`).join('')}</div></div>
    <div class="card brief" style="margin-top:14px;padding:18px"><p class="desc" style="margin:0">30초 안에 결정하세요. 시간이 지나면 바로 도전합니다.</p>
      <div class="toggles"><button class="toggle" type="button" id="tShield" aria-pressed="${declare.shield}" ${S.items.shield ? '' : 'disabled'}>🛡️ 방패 사용 선언 <small>(${S.items.shield})</small></button></div>
      <div class="btns"><button class="btn go big" type="button" id="bgo">도전</button><button class="btn big" type="button" id="bpass" ${passLeft > 0 ? '' : 'disabled'}>패스 <small>남은 ${passLeft}회</small></button></div></div>`;
};
BIND.reality = () => {
  const t = curType();
  $('#tShield').onclick = e => { declare.shield = !declare.shield; e.currentTarget.setAttribute('aria-pressed', declare.shield); };
  $('#bgo').onclick = () => challenge(t);
  $('#bpass').onclick = () => { S.cur = null; doPass(t); };
  runTimer(30, () => challenge(t));
};
function preview(t, m) {
  switch (m.kind) {
    case 'roulette': return `<p class="q big">성공 ${m.slices.win}칸 · 실패 ${m.slices.lose}칸 룰렛</p>`;
    case 'typing': return `<div class="target">${esc(m.text)}</div>`;
    case 'chosung': return `<div class="cho">${esc(m.chosung)}</div>`;
    case 'order': return `${m.html}<div class="pick">${m.items.map(x => `<button type="button" disabled style="opacity:1">${esc(x)}</button>`).join('')}</div>`;
    case 'board': return boardHTML(m, true);
    default: return m.html;
  }
}

/* ---- challenge: lock in declarations, count down, then the mission */
function challenge(t) {
  const boss = t === BOSS;
  S.cur = { type: t, shield: !boss && declare.shield && S.items.shield > 0, live: true };
  if (S.cur.shield) { S.items.shield--; log(`${t}: 방패 선언`); }
  declare = { shield: false };
  save(); go('count', t);
}
SCREENS.count = () => `<div class="count" aria-live="assertive"><b id="cn">3</b></div>`;
BIND.count = t => {
  let n = 3; const el = $('#cn');
  const tick = () => {
    n--; if (n <= 0) return go('play', t);
    el.textContent = n; el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
    timer = { to: setTimeout(tick, 900) };
  };
  timer = { to: setTimeout(tick, 900) };
};

/* ---- play */
let finished = false;
SCREENS.play = t => {
  const m = mission(t);
  const head = `<div class="timer ${m.time ? '' : 'inf'}" id="tm"><div class="bar"><i></i></div><div class="sec">${m.time || '∞'}</div></div>`;
  const tag = `<div class="tag">${S.stage}단계 · ${t} Lv.${m.lv}${S.cur && S.cur.shield ? ' · 🛡️ 방패' : ''}</div>`;
  switch (m.kind) {
    case 'roulette': return `${head}<div class="card qcard">${tag}<p class="q big">룰렛을 돌리세요</p>${wheelSVG(m)}<div class="btns" style="justify-content:center"><button class="btn go big" type="button" id="spin">돌리기</button></div></div>`;
    case 'typing': return `${head}<div class="card qcard typing">${tag}<p class="q">아래 문장을 그대로 입력하세요</p><div class="target" id="tgt">${esc(m.text)}</div>
      <textarea id="ans" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" aria-label="입력"></textarea><p class="hint">붙여넣기는 막혀 있습니다. 똑같이 치면 바로 성공합니다.</p></div>`;
    case 'chosung': return `${head}<div class="card qcard">${tag}<p class="q">초성을 보고 단어를 만드세요</p><div class="cho">${esc(m.chosung)}</div>${answerBox('단어', '제출')}<p class="hint">한 번만 제출할 수 있습니다. ${esc(m.dict || '국어사전')}에 있는 단어만 정답입니다.</p></div>`;
    case 'order': return `${head}<div class="card qcard">${tag}${m.html}<div class="pick" id="pick">${m.items.map((x, i) => `<button type="button" data-i="${i}">${esc(x)}</button>`).join('')}</div>
      <div class="picked" id="picked"><span class="ph">순서대로 누르세요</span></div><div class="btns" style="justify-content:center"><button class="btn" type="button" id="oclr">다시 고르기</button><button class="btn go" type="button" id="osub" disabled>제출</button></div><p class="hint">한 번만 제출할 수 있습니다. 검색해도 됩니다.</p></div>`;
    case 'board': return `${head}<div class="card qcard">${tag}<p class="q">글자판의 글자로 <b>세 글자 단어 ${m.need}개</b>를 만드세요</p>${boardHTML(m, false)}
      ${answerBox('세 글자 단어', '내기')}<div class="btns" style="justify-content:center;margin-top:10px"><button class="btn ghost" type="button" id="bclr">지우기</button></div>
      <div class="found" id="found"></div><p class="hint">글자를 눌러 고르거나 직접 입력하세요. ${esc(m.dict || '국어사전')}에 있는 단어만 인정됩니다.</p></div>`;
    default: return `${head}<div class="card qcard">${tag}${m.html}${answerBox(m.placeholder || '정답', '제출')}${m.once ? '<p class="hint">한 번 틀리면 실패입니다.</p>' : ''}</div>`;
  }
};
const answerBox = (ph, label) => `<form class="answer" id="af" autocomplete="off"><input id="ans" placeholder="${esc(ph)}" aria-label="${esc(ph)}" enterkeyhint="done"><button class="btn go" type="submit">${label}</button></form>`;
const boardHTML = (m, isStatic) => `<div class="board ${isStatic ? 'static' : ''}" id="board">${m.board.map((c, i) => `<button type="button" data-i="${i}" ${isStatic ? 'disabled' : ''}>${esc(c)}</button>`).join('')}</div>`;

BIND.play = t => {
  const m = mission(t); finished = false;
  if (m.time) runTimer(m.time, () => {
    /* time's up: a typed but unsent answer still counts as the one submission */
    const inp = $('#ans');
    if (inp && inp.value.trim() && (m.kind === 'answer' || m.kind === 'chosung')) return judge(t, inp.value, true);
    end(t, 'fail', '시간 초과');
  });
  const inp = $('#ans'); if (inp) setTimeout(() => inp.focus(), 50);
  PLAY[m.kind](t, m);
};
const PLAY = {
  answer(t) { $('#af').onsubmit = e => { e.preventDefault(); judge(t, $('#ans').value); }; },
  chosung(t) { $('#af').onsubmit = e => { e.preventDefault(); judge(t, $('#ans').value); }; },
  typing(t, m) {
    const inp = $('#ans'), tgt = $('#tgt'), want = m.text.replace(/\s+/g, ' ').trim();
    inp.addEventListener('paste', e => { e.preventDefault(); toast('붙여넣기는 사용할 수 없습니다.'); });
    inp.addEventListener('drop', e => e.preventDefault());
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') e.preventDefault(); });
    inp.addEventListener('input', () => {
      const got = inp.value.replace(/\s+/g, ' ').replace(/^ /, '');
      let html = '';
      for (let i = 0; i < want.length; i++) {
        const c = esc(want[i]);
        if (i < got.length) html += `<span class="${got[i] === want[i] ? 'ok' : 'bad'}">${c}</span>`;
        else html += i === got.length ? `<span class="cur">${c}</span>` : c;
      }
      tgt.innerHTML = html;
      if (got.trim() === want) end(t, 'success');
    });
  },
  roulette(t, m) {
    $('#spin').onclick = e => {
      e.currentTarget.disabled = true;
      const n = m.slices.win + m.slices.lose, k = rand(n), win = k < m.slices.win, seg = 360 / n;
      /* slice k is centred at k*seg + seg/2 (clockwise from the top pointer); turn so it ends under the pointer */
      const deg = 360 * 6 + (360 - (k * seg + seg / 2)) + (rand(60) - 30) / 100 * seg;
      const svg = $('#wheel'); svg.style.transform = `rotate(${deg}deg)`;
      let done = false;
      const fin = () => { if (done) return; done = true; end(t, win ? 'success' : 'fail', win ? '성공 칸!' : '실패 칸에 멈췄습니다'); };
      svg.addEventListener('transitionend', fin, { once: true });
      setTimeout(fin, matchMedia('(prefers-reduced-motion: reduce)').matches ? 900 : 4000);
    };
  },
  order(t, m) {
    const picked = [];
    const draw = () => {
      $('#picked').innerHTML = picked.length ? picked.map((i, k) => `<button type="button" data-k="${k}"><b>${k + 1}</b>${esc(m.items[i])}</button>`).join('') : '<span class="ph">순서대로 누르세요</span>';
      document.querySelectorAll('#pick button').forEach(b => { b.disabled = picked.includes(+b.dataset.i); });
      $('#osub').disabled = picked.length !== m.items.length;
    };
    $('#pick').onclick = e => { const b = e.target.closest('button'); if (!b || b.disabled) return; picked.push(+b.dataset.i); draw(); };
    $('#picked').onclick = e => { const b = e.target.closest('[data-k]'); if (!b) return; picked.splice(+b.dataset.k, 1); draw(); };
    $('#oclr').onclick = () => { picked.length = 0; draw(); };
    $('#osub').onclick = () => judge(t, picked.map(i => m.items[i]).join('|'));
  },
  board(t, m) {
    const inp = $('#ans'), found = [], sel = [];
    const words = new Set(m.words);
    const drawFound = () => { $('#found').innerHTML = found.map(w => `<span>${esc(w)}</span>`).join('') + Array.from({ length: m.need - found.length }, () => '<span class="need">?</span>').join(''); };
    const drawSel = () => document.querySelectorAll('#board button').forEach(b => b.classList.toggle('on', sel.includes(+b.dataset.i)));
    drawFound();
    $('#board').onclick = e => {
      const b = e.target.closest('button'); if (!b) return; const i = +b.dataset.i;
      if (sel.includes(i)) { sel.splice(sel.indexOf(i), 1); } else if (sel.length < m.len) sel.push(i);
      inp.value = sel.map(k => m.board[k]).join(''); drawSel();
    };
    inp.addEventListener('input', () => { sel.length = 0; drawSel(); });
    $('#bclr').onclick = () => { inp.value = ''; sel.length = 0; drawSel(); inp.focus(); };
    $('#af').onsubmit = e => {
      e.preventDefault(); const w = norm(inp.value);
      const bad = msg => { toast(msg); const f = $('#af'); f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); };
      if (!w) return;
      if (w.length !== m.len) return bad(`${m.len}글자 단어를 내세요.`);
      if (found.includes(w)) return bad('이미 낸 단어입니다.');
      if (!words.has(w)) return bad(`「${w}」은(는) 판의 글자로 만든 사전 단어가 아닙니다.`);
      found.push(w); inp.value = ''; sel.length = 0; drawSel(); drawFound(); toast(`✔ ${w}`);
      if (found.length >= m.need) end(t, 'success', `찾은 단어: ${found.join(', ')}`);
    };
  },
};
function judge(t, raw, timeout) {
  if (finished) return;
  const m = mission(t);
  let v = norm(raw);
  if (m.numeric) { const d = v.match(/\d+/); v = d ? d[0] : v; }
  let ok;
  if (m.kind === 'chosung') ok = m.words.includes(v);
  else ok = [].concat(m.hash).includes(hash(m.kind === 'order' ? raw : v));
  end(t, ok ? 'success' : 'fail', ok ? '' : `${timeout ? '시간 초과 · ' : ''}제출한 답: ${raw}`);
}

/* timer: requestAnimationFrame for the bar, setTimeout for the deadline (keeps working in a background tab) */
function runTimer(sec, onEnd) {
  const tm = $('#tm'); if (!tm) return;
  const bar = tm.querySelector('.bar i'), out = tm.querySelector('.sec'), t0 = performance.now(), ms = sec * 1000;
  const frame = () => {
    const left = Math.max(0, ms - (performance.now() - t0));
    bar.style.transform = `scaleX(${left / ms})`; out.textContent = Math.ceil(left / 1000);
    tm.classList.toggle('low', left < Math.min(5000, ms * 0.3));
    if (left > 0 && timer) timer.raf = requestAnimationFrame(frame);
  };
  timer = { raf: requestAnimationFrame(frame), to: setTimeout(() => { if (timer) { stopTimer(); onEnd(); } }, ms) };
}

/* ------------------------------------------------------------------ outcomes */
function record(t, r, delta) { week().results[t] = { r, delta, at: Date.now() }; S.cur = null; S.idx = seq().findIndex(x => !week().results[x]); if (S.idx < 0) S.idx = 10; save(); }
function end(t, outcome, why) {
  if (finished) return; finished = true; stopTimer();
  const boss = t === BOSS, shield = S.cur && S.cur.shield;
  let r = outcome, delta = 0;
  if (outcome === 'success') {
    delta = 1; S.level += 1;
    if (boss) { S.stats.bossWin++; heal(1, '보스 성공'); const k = STAGES[S.stage].bossReward; S.items[k] = (S.items[k] || 0) + 1; log(`보스 성공 · ${ITEMS[k].name} 획득`); }
    else S.stats.normalWin++;
  } else if (shield) { r = 'shield'; }
  else {
    delta = -1; S.level -= 1;
    if (boss) { S.stats.bossFail++; hurt(1, '보스 실패'); } else S.stats.normalFail++;
  }
  log(`${t}: ${R_LABEL[r]}${why ? ' · ' + why : ''}`);
  record(t, r, delta);
  go('result', { t, r, why });
}
SCREENS.result = ({ t, r, why }) => {
  const m = mission(t), boss = t === BOSS, wr = week().results[t];
  const big = { success: 'SUCCESS', fail: 'FAIL', pass: 'PASS', shield: 'SAFE', space: 'PASS' }[r];
  const delta = { success: boss ? '+1 Level · +1 HP' : '+1 Level', fail: boss ? '−1 Level · −1 HP' : '−1 Level', pass: 'Level 변화 없음', shield: '🛡️ 방패로 패스 처리 · Level 변화 없음', space: '🔷 실패 무효 · 패스 처리' }[r];
  const canSpace = r === 'fail' && !boss && S.items.space > 0 && wr && wr.r === 'fail';
  let reveal = '';
  if ((r === 'fail' || r === 'shield' || r === 'space') && m.reveal) reveal = `<div class="reveal">정답 <b>${esc(m.reveal)}</b></div>`;
  if ((r === 'fail' || r === 'shield' || r === 'space') && m.kind === 'chosung') reveal = `<div class="reveal">인정 단어 예 <b>${esc(m.words.filter((_, i) => i % 5 === 0).slice(0, 4).join(', '))}</b> 외 ${m.words.length - 4}개</div>`;
  if ((r === 'fail' || r === 'shield' || r === 'space') && m.kind === 'board') reveal = `<div class="reveal">가능한 단어 예 <b>${esc(['고구마', '도자기', '미나리', '배터리'].join(', '))}</b> 외 ${m.words.length - 4}개</div>`;
  const reward = boss && r === 'success' ? (() => { const k = STAGES[S.stage].bossReward; return `<p class="note">${ITEMS[k].icon} <b>${ITEMS[k].name}</b> 획득 — ${esc(ITEMS[k].desc)}</p>`; })() : '';
  const last = S.idx >= 10;
  return `<div class="card result ${r}"><div class="eyebrow">${S.stage}단계 · ${t}</div><div class="word">${big}</div>
    <div class="delta">${delta}</div>${why ? `<p class="why">${esc(why)}</p>` : ''}${reveal}${reward}
    ${S.out ? '<p class="note">HP가 0이 되었습니다.</p>' : ''}
    <div class="btns">${canSpace ? `<button class="btn" type="button" id="useSpace">🔷 스페이스 스톤 사용 <small>(${S.items.space})</small></button>` : ''}
      <button class="btn go big" type="button" id="next">${S.out ? '결과 보기' : last ? '단계 결산' : '다음 미션'}</button></div></div>`;
};
BIND.result = ({ t }) => {
  $('#next').onclick = () => {
    if (S.out) return go('out');
    if (S.idx >= 10) return finishWeek();
    go('brief');
  };
  const sp = $('#useSpace');
  if (sp) sp.onclick = () => {
    const wr = week().results[t]; if (!wr || wr.r !== 'fail' || S.items.space <= 0) return;
    S.items.space--; S.level += 1; S.stats.normalFail--; wr.r = 'space'; wr.delta = 0; log(`${t}: 스페이스 스톤으로 실패 무효`); save();
    go('result', { t, r: 'space' });
  };
};

/* ---- 단계 결산: negative stage level costs 1 HP */
function finishWeek() {
  const w = week();
  if (!w.closed) {
    w.level = weekLevel(); w.closed = true;
    if (w.level < 0) hurt(1, `${S.stage}단계 Level 합 ${w.level}`);
    S.phase = 'weekEnd'; save();
  }
  go(S.out ? 'out' : 'weekEnd');
}
SCREENS.weekEnd = () => {
  const w = week(), res = w.results;
  const rows = seq().map((t, i) => { const r = res[t] || { r: '', delta: 0 }; return `<tr><td>${i + 1}</td><td>${t}</td><td class="r-${r.r}">${R_LABEL[r.r] || '-'}</td><td class="num">${r.delta > 0 ? '+' : ''}${r.delta}</td></tr>`; }).join('');
  const hpRows = w.hp.map(h => `<li>${h.d > 0 ? '+' : ''}${h.d} HP · ${esc(h.why)}</li>`).join('') || '<li>변화 없음</li>';
  const hasNext = S.stage < LAST_STAGE, nextReady = !!STAGES[S.stage + 1];
  return `<div class="card"><div class="eyebrow">${S.stage}단계 결산</div><h2 style="margin-top:6px">이번 단계 Level ${w.level > 0 ? '+' : ''}${w.level} · 누적 Level ${S.level > 0 ? '+' : ''}${S.level}</h2>
    <table class="sum"><thead><tr><th>#</th><th>미션</th><th>결과</th><th style="text-align:right">Level</th></tr></thead><tbody>${rows}</tbody></table>
    <h3 style="margin-top:18px;font-size:16px">HP 변화</h3><ul>${hpRows}</ul>
    <div class="btns">${hasNext ? `<button class="btn go big" type="button" id="nextStage">${S.stage + 1}단계로</button>` : '<button class="btn go big" type="button" id="toFinal">최종 결과</button>'}</div>
    ${hasNext && !nextReady ? `<p class="hint">${S.stage + 1}단계 문제는 아직 준비 중입니다. 진행 상황은 저장되어 있으니 나중에 이어서 할 수 있어요.</p>` : ''}</div>`;
};
BIND.weekEnd = () => {
  const n = $('#nextStage');
  if (n) n.onclick = () => { S.stage++; S.phase = 'order'; S.order = NORMAL.slice(); S.idx = 0; save(); go(STAGES[S.stage] ? 'order' : 'wait'); };
  const f = $('#toFinal'); if (f) f.onclick = () => { S.phase = 'final'; save(); go('final'); };
};
SCREENS.wait = () => `<div class="card brief"><div class="eyebrow">${S.stage}단계</div><div class="type" style="font-size:56px">준비 중</div>
  <p class="desc">${S.stage}단계 문제는 아직 준비되지 않았습니다. 지금까지의 진행 상황은 저장되어 있어요.</p>
  <div class="btns"><a class="btn" href="../index.html">메인 메뉴</a><button class="btn ghost" type="button" id="toHome">Stage 90 처음 화면</button></div></div>`;
BIND.wait = () => { $('#toHome').onclick = () => go('home'); };
SCREENS.out = () => `<div class="card result fail"><div class="eyebrow">STAGE 90</div><div class="word">OUT</div>
  <p class="desc">HP가 0이 되어 Stage 90에서 퇴장합니다. ${S.stage}단계 · 최종 Level ${S.level > 0 ? '+' : ''}${S.level}</p>
  <div class="btns" style="justify-content:center"><button class="btn go big" type="button" id="again">새로 시작</button><button class="btn ghost" type="button" id="toHome">처음 화면</button></div></div>`;
BIND.out = () => { $('#again').onclick = start; $('#toHome').onclick = () => go('home'); };
SCREENS.final = () => `<div class="card result success"><div class="eyebrow">90 STAGES CLEAR</div><div class="word">FINISH</div>
  <div class="delta">최종 Level ${S.level > 0 ? '+' : ''}${S.level} · HP ${S.hp}</div>
  <p class="why">보스 성공 ${S.stats.bossWin} · 일반 성공 ${S.stats.normalWin} · 패스 ${S.stats.passes} · 물약 ${S.items.potion}</p>
  <div class="btns" style="justify-content:center"><button class="btn ghost" type="button" id="toHome">처음 화면</button></div></div>`;
BIND.final = () => { $('#toHome').onclick = () => go('home'); };

/* ------------------------------------------------------------------ roulette art */
function wheelSVG(m) {
  const n = m.slices.win + m.slices.lose, seg = 360 / n, R = 100;
  const pt = a => [R + R * Math.sin(a * Math.PI / 180), R - R * Math.cos(a * Math.PI / 180)];
  let s = '';
  for (let k = 0; k < n; k++) {
    const a0 = k * seg, a1 = a0 + seg, [x0, y0] = pt(a0), [x1, y1] = pt(a1), win = k < m.slices.win;
    const mid = (a0 + a1) / 2, tx = R + 64 * Math.sin(mid * Math.PI / 180), ty = R - 64 * Math.cos(mid * Math.PI / 180);
    s += `<path d="M${R} ${R} L${x0} ${y0} A${R} ${R} 0 0 1 ${x1} ${y1} Z" fill="${win ? (k % 2 ? '#1d6e8a' : '#26869f') : '#d8344a'}" stroke="#090b16" stroke-width="1.5"/>`;
    s += `<text x="${tx}" y="${ty}" fill="#fff" font-size="15" font-weight="700" text-anchor="middle" dominant-baseline="middle" transform="rotate(${mid} ${tx} ${ty})" font-family="IBM Plex Sans KR, sans-serif">${win ? '성공' : '실패'}</text>`;
  }
  return `<div class="wheel-wrap"><div class="pointer"></div><svg id="wheel" viewBox="0 0 200 200" aria-label="성공 ${m.slices.win}칸, 실패 ${m.slices.lose}칸 룰렛">${s}<circle cx="100" cy="100" r="14" fill="#090b16" stroke="#ffc94a" stroke-width="3"/></svg></div>`;
}

/* ------------------------------------------------------------------ boot */
/* a mission that was running when the page closed counts as a failure (no peeking by reloading) */
if (S && S.cur && S.cur.live) {
  const t = S.cur.type; finished = false;
  view = 'boot'; end(t, 'fail', '도전 중에 페이지를 떠나 실패 처리되었습니다');
  toast('진행 중이던 미션은 실패로 처리됐습니다.');
} else if (S && S.cur && S.cur.reality) {
  view = 'boot'; go('reality');
} else go('home');

addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#modal').hidden) closeModal(); });
if (DEBUG) window.__s90 = { get S() { return S; }, STAGES, go, end, judge, hash, norm, resume, fresh: () => { S = fresh(); save(); } };
})();
