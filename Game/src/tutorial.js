// REAL — the guided first minutes. One tip at a time, each when it matters: the screen dims, a spotlight shows the
// thing to use, Heart reads the tip, and "Got it" (or simply doing it) moves on. Players can skip tips, and turn them
// back on in Settings. Tips are remembered per device, so a new save on the same device doesn't repeat them.
import { h } from './ui.js';
import { say, stopReading } from './readalong.js';
import { lang } from './i18n.js';

const KEY = 'real.tips';
const seen = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } };
const mark = (id) => { const s = seen(); s[id] = 1; try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} };
export const tipsOff = () => !!seen().__off;
export function setTips(on) { const s = on ? {} : { ...seen(), __off: 1 }; try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }

const touch = () => matchMedia('(pointer: coarse)').matches;
const vis = (sel) => { const e = document.querySelector(sel); if (!e || e.hidden) return null; const r = e.getBoundingClientRect(); return r.width > 4 && r.height > 4 && r.bottom > 0 && r.top < innerHeight ? e : null; };
// [id, target selector (or a function giving a rect), English, Spanish, when (ctx) => bool, done (ctx) => bool]
const TIPS = [
  ['move', () => (touch() ? { x: 20, y: innerHeight - 260, w: Math.min(260, innerWidth * 0.45), h: 230 } : null),
    () => (touch() ? 'Drag your thumb here to walk. Tap RUN to go faster.' : 'Walk with the arrow keys or W A S D. Hold Shift to run.'),
    () => (touch() ? 'Arrastra el dedo aquí para caminar. Toca RUN para ir más rápido.' : 'Camina con las flechas o W A S D. Mantén Shift para correr.'),
    (c) => c.playing, (c) => c.moved > 3],
  ['goal', '#objective', 'This is your goal. It tells you what to do next. Tap 🔊 to hear it.', 'Esta es tu meta. Te dice qué hacer ahora. Toca 🔊 para escucharla.', (c) => c.playing && c.moved > 1],
  ['map', '#minimap', 'This is your map. Walk toward the gold dot to reach your goal.', 'Este es tu mapa. Camina hacia el punto dorado para llegar a tu meta.', (c) => c.playing && c.seen.goal],
  ['interact', '#btn-interact', 'When you are close, tap here to talk or use things.', 'Cuando estés cerca, toca aquí para hablar o usar cosas.', (c) => c.playing],
  ['words', '#dialog .d-text', 'Tap any word to hear it, sound it out, and save it.', 'Toca cualquier palabra para escucharla y guardarla.', (c) => c.dialog],
  ['phone', '#btn-phone', 'Your phone has your bank, your jobs, and 📚 Learn for lessons.', 'Tu teléfono tiene tu banco, tus trabajos y 📚 Aprender.', (c) => c.playing && c.phone],
  ['heart', '#btn-voice', 'This is Heart. She reads to you, cheers you on, and answers your questions.', 'Esta es Heart. Te lee, te anima y responde tus preguntas.', (c) => c.playing && c.seen.phone],
  ['help', '#modal .modal:last-child .activity .row', 'Stuck? Tap a hint, 🧑‍🏫 Show me how, or ✨ Ask Heart. There is no timer.', '¿Atorado? Toca una pista, 🧑‍🏫 Muéstrame cómo, o ✨ Pregúntale a Heart. No hay prisa.', (c) => c.activity],
];

let cur = null, layer = null;
function close(id, done = true) { if (done && id) mark(id); if (layer) { layer.remove(); layer = null; } cur = null; stopReading(); }
function show(tip, el) {
  const [id, , en, es] = tip; cur = id;
  const r = el.getBoundingClientRect ? el.getBoundingClientRect() : el;
  const pad = 8, box = { x: r.x - pad, y: r.y - pad, w: (r.width || r.w) + pad * 2, h: (r.height || r.h) + pad * 2 };
  const text = (lang() === 'es' ? (typeof es === 'function' ? es() : es) : (typeof en === 'function' ? en() : en));
  const below = box.y + box.h + 150 < innerHeight;
  const bubble = h('div', { class: 'tip-bubble', role: 'dialog', 'aria-live': 'polite', style: { left: Math.max(12, Math.min(innerWidth - 312, box.x)) + 'px', top: (below ? box.y + box.h + 12 : Math.max(12, box.y - 150)) + 'px' } },
    h('div', { class: 'tip-who' }, '✨ Heart'), h('p', {}, text),
    h('div', { class: 'row' }, h('button', { class: 'ghost sm', onclick: () => { setTips(false); close(null, false); } }, lang() === 'es' ? 'Saltar consejos' : 'Skip tips'), h('button', { class: 'primary sm', onclick: () => close(id) }, lang() === 'es' ? '¡Entendido!' : 'Got it!')));
  layer = h('div', { class: 'tip-layer' }, h('div', { class: 'tip-spot', style: { left: box.x + 'px', top: box.y + 'px', width: box.w + 'px', height: box.h + 'px' } }), bubble);
  document.body.append(layer);
  say(text);
}
/** called about twice a second with what's happening */
export function tutorialTick(c) {
  if (tipsOff()) { if (layer) close(null, false); return; }
  const S = seen(); c.seen = S;
  if (cur) { const t = TIPS.find((x) => x[0] === cur); if (t && t[5] && t[5](c)) close(cur); return; }
  if (c.busyOther) return;   // never on top of a story scene that isn't the one the tip is about
  for (const t of TIPS) {
    if (S[t[0]] || !t[4](c)) continue;
    const el = typeof t[1] === 'function' ? t[1]() : vis(t[1]);
    if (el) { show(t, el); return; }
  }
}
export const tipShowing = () => !!cur;
