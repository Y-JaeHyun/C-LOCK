# Back Stage engine — theme contract

One room per week lives in `site/wN/` and is three files plus assets:

```
wN/index.html   doctype, fonts, ../engine/engine.css, a <style> for this theme, three.js r149, ../engine/engine.js, theme.js
wN/theme.js     BackStage.run({...}) with the data below and build() that makes the room
wN/assets/      poster.webp (the theme base image), clue originals (webp), sound clues (m4a)
```

`w1/` (CLASSROOM) is the reference theme; `w6/` (TIME CASINO) is the older, larger one. Copy `w1/index.html` and adjust the
`:root` palette tokens and title fonts. Do not edit `engine/` from a theme; if something is missing, keep it theme-local
(custom props, tickers, animate hook) or report it.

## Flow the engine runs
Intro screen (poster + `intro` paragraphs) → pixel-art prologue (`prologue` lines, `scenes`) → room. Every room clue is
visible from the start. Locks can be tried in any order. Lock n's related clue stays asleep until lock n-1 opens; opening a
lock plays a cutscene: a spark flies to `cut[next].at`, the camera frames it from `cut[next].view`, and `props[next]` wakes.
After the last lock the spark flies to the exit door. Door → walk out → fireworks → `epilogue` → time + grade.

## BackStage.run(theme)
| key | meaning |
|---|---|
| `id`, `week` | `'w2'`, `2`. Records are saved as `bs-record-<id>` (the theme-select page reads them). |
| `title`, `titleHTML`, `tag`, `docTitle`, `brand` | Names. `titleHTML` may use `<em>` for the second colour line. |
| `poster`, `posterAlt` | `'assets/poster.webp'`. |
| `intro` | Array of paragraphs for the intro screen (use the theme story text the user gave). |
| `fonts`, `fontSample` | Extra fonts to preload before canvas textures draw (e.g. `'700 32px Gaegu'`), and the text they must cover. |
| `sky`, `fog`, `exposure`, `focusIntensity` | Background/fog colour, `[near, far]`, tone-mapping exposure, focus spot multiplier. |
| `player` | `{ x, z, yaw, pitch }` start. yaw 0 looks toward -z. |
| `bounds` | `[x0, x1, z0, z1]` walkable box (room walls minus ~0.35). Add furniture with `collide(cx, cz, w, d)`. |
| `locks` | See below. Sorted by `no`; the chain follows that order. |
| `clues`, `related` | `{ key: { title, where?, html?: () => string, media?: [...] } }`. `related` keys are referenced by `lock.related`. |
| `captions` | `{ L1: [onSolveLine, onRevealLine], ... }` shown in the cutscene letterbox. |
| `cut` | `{ L2: { at:[x,y,z], view:[x,y,z], color }, ... L6 }`. `exit` is computed from the door if omitted. |
| `focus` | `{ L1..L6: [[spotPos],[spotTarget]], start: [...] }` — one shadow spot glides to the device that just woke. |
| `prologue`, `epilogue` | `[{ scene: 'name', text: '...' }]`; the last prologue line shows "입장하기". |
| `scenes(api)` | Returns `{ name: t => draw }` pixel scenes on a 192×108 canvas with `api.P(color,x,y,w,h)`, `api.ptext`, `api.kid`. |
| `exitCaption`, `finalGoal`, `startToast` | Strings. |
| `build(api)` | Builds the room. Must call `api.exitDoor({...})` once and `api.poster({...})` once. |
| `animate(t, dt, api)`, `onSolved(L, api)`, `onSecond(remaining)` | Optional hooks. |

## Locks
```js
{ id: 'L1', no: 1, name: '교탁 서랍', type: '숫자 4자리', mech: 'dial', set: DIGITS, len: 4, hash: 'x5we7', related: null,
  hints: ['1단계: which room clue pairs with it', '2단계: how to solve'] }
```
- `mech: 'dial'` with `set` = `api.DIGITS` / `api.AZ` / `api.az` (lowercase) and `len`.
- `mech: 'keypad'` with `set` = `DIGITS` or `AZ` (length not shown).
- `mech: 'dir'` direction lock. Answer string is the Korean words joined by `/`, e.g. `위/왼/아/오`.
- `mech: 'text'` free text (Korean). `len` shows a counter, `label` the field label. Spaces/punctuation are stripped.
- `mech: 'form'` with `fields: [{ label, long? }]`; answer is the stripped fields joined by `|`.
- `hash` = `BackStage.hash(answer)` (salted FNV, base36), or an array of hashes to accept several spellings. Never put
  plain answers in the theme. Compute with node:
  `node -e "function h(s){let x=0x811c9dc5;for(const c of ('bs5:'+s)){x^=c.charCodeAt(0);x=Math.imul(x,0x01000193)>>>0;}return x.toString(36)} console.log(h('YOUTH'))"`

## Media items (clues and related clues)
```js
{ type: 'img', src: 'assets/x.webp', alt: '...', caption?, small? }          // click to zoom
{ type: 'audio', src: 'assets/x.m4a', title, captions: [[t0, t1, 'text'], ...], note? }   // "소리 단서" badge, player, slow captions
{ type: 'youtube', id: 'VIDEO_ID', start?, title, label?, note?, cover? }    // click-to-load embed + "유튜브에서 열기 ↗"; cover:false hides the thumbnail (use for song clues)
{ type: 'link', href, label, title?, note?, fallback? }                      // new tab; fallback text in a <details>
{ type: 'text', html: '<p>...</p>' }                                          // paper box
```
A clue with audio or youtube gets a speaker marker in the room. Copyrighted songs are never hosted: use `youtube` with the
official video. Captions are what the STT heard, timed in seconds.

## api (BackStage.api)
three: `THREE, scene, camera`. builders: `M(color, opts)` standard material, `Bm` basic (unlit), `bx(w,h,d)`, `cy(rt,rb,h,seg)`,
`mesh(geo, mat, x, y, z, parent)`, `grp(x, y, z, ry, parent)`, `plane(texture, w, h, lit, extra)`, `tex(w, h, draw(g,w,h), repeat)`,
`imgTex(url)`, `framed(parent, texture, w, h, x, y, z, ry, frameColor, depth)`, `glow(zone, color, w, h, x, y, z, ry, opacity, parent)`,
`buildDust(color, n, sx, sz)`, `bulbRow`, `rectBulbs`, `rrect`, `glowText`, `drawCard`, `rng(seed)`, `V3`.
interaction: `makeInteract(group, 'clue'|'lock', id, label, markerHeight)` (marker sits at local y), `obj.userData.proxy = group`
to forward clicks from furniture, `collide(cx, cz, w, d)`.
locks: `locks3d[id] = padlock(parent, x, y, z, scale)` (shackle pops when solved) or `{ keypad: planeMesh }` (glows green).
reveals: `props[id] = { kind: 'fade', m: mesh|[meshes], drop }` (starts hidden, fades in and settles), `{ kind: 'screen', mat, on: texture }`
(swaps a screen texture with a flicker), `{ kind: 'pop', g }` (scale-y pop; start with `g.scale.y = 0.001; g.visible = false`),
`{ kind: 'custom', reveal(instant) }` (use `tween(dur, u => ..., instant)`).
lights: `zl(1, light)` registers a light; `tickers.push((t, dt) => ...)` per-frame updates; `spinners.push({ m, axis, speed })`.
furniture: `exitDoor({ x, z, ry, leaf, frame, sign })` puts the exit in a wall; local +z points out of the room
(`ry = 0` wall at +z, `Math.PI` wall at -z, `-Math.PI/2` wall at -x, `Math.PI/2` wall at +x). Needs ceiling ≥ 3.7.
`poster({ x, y, z, ry, w, h })` hangs the theme poster (interactive).

## Testing
`python3 -m http.server 8765 --directory site` then open `http://localhost:8765/wN/index.html#debug`. With `#debug`,
`window.__bs` (records are not saved in #debug) has `openLock(id)`, `openClue(id)`, `submit()`, `tick(seconds)` (advances the game when the tab is hidden),
`tryDoor()`, `teleport(x, z, yaw, pitch)`, `state`, `api`. Typical check: start → skip prologue → open each lock, type the
answer via `KeyboardEvent('keydown', { code: 'KeyA', key: 'A' })` (dial/keypad), arrow keys (dir) or set `.tinput` values
(text/form) → `submit()` → `tick(7)` → … → `tryDoor()` → `tick(4)` and expect `state.finished`. To look at the room:
`tick(1); api.renderer.render(api.scene, api.camera)` then take a screenshot.
