#!/usr/bin/env node
// Answer hashes for both games. Answers never go into the page source in plain text (see docs/).
//
//   node tools/hash.mjs s90 수요일 수 수욜          Stage 90 answer / chosung-style missions (normalised like the game)
//   node tools/hash.mjs s90-order 일본 베트남 미국 태국   Stage 90 'order' mission (items joined with |, not normalised)
//   node tools/hash.mjs bs YOUTH 1125               Back Stage lock answers (engine strips spaces/punctuation first)
const [mode, ...args] = process.argv.slice(2);
const fnv = (salt, s) => { let x = 0x811c9dc5; for (const c of (salt + s)) { x ^= c.charCodeAt(0); x = Math.imul(x, 0x01000193) >>> 0; } return x.toString(36); };
const s90norm = s => String(s).normalize('NFC').toLowerCase().replace(/\s+/g, '').replace(/[%.,!?'"~·]/g, '');
const bsnorm = s => String(s || '').replace(/[\s.,!?·~'"“”‘’]/g, '');
if (!mode || !args.length) { console.log('usage: node tools/hash.mjs s90|s90-order|bs <answer...>'); process.exit(1); }
if (mode === 's90') for (const a of args) console.log(`${a}\t→ ${s90norm(a)}\t${fnv('s90:', s90norm(a))}`);
else if (mode === 's90-order') { const j = args.join('|'); console.log(`${j}\t${fnv('s90:', j)}`); }
else if (mode === 'bs') for (const a of args) console.log(`${a}\t→ ${bsnorm(a)}\t${fnv('bs5:', bsnorm(a))}`);
else { console.log('unknown mode ' + mode); process.exit(1); }
