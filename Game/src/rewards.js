// REAL — rewards and progress, all earned by learning and living (never bought): daily goals, a streak calendar,
// a sticker book, trophies (achievements + learning badges), outfits you unlock, and celebrations when you grow.
import { h, UI } from './ui.js';
import { SKILLS, SUBJECTS } from './edu.js';
import { ACHIEVEMENTS } from './life.js';
import { say } from './readalong.js';
import { lang } from './i18n.js';

const today = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);
const es = () => lang() === 'es';

// ------------------------------------------------------------------------------------------- celebrations
/** confetti, a banner, a sound, and Heart cheering */
export function celebrate(G, title, sub = '', { big = false, heart = true } = {}) {
  const old = document.querySelector('.celebrate'); if (old) old.remove();
  const conf = h('div', { class: 'confetti', 'aria-hidden': 'true' }, ...[...Array(big ? 60 : 34)].map((_, i) => h('i', { style: { left: Math.random() * 100 + '%', background: ['#e9a93a', '#3fbf7a', '#4f8cff', '#e96fa0', '#8f7bff', '#ffd27a'][i % 6], animationDelay: Math.random() * 0.6 + 's', animationDuration: 1.6 + Math.random() * 1.2 + 's', transform: `rotate(${Math.random() * 360}deg)` } })));
  const card = h('div', { class: 'celebrate' + (big ? ' big' : ''), role: 'status', 'aria-live': 'polite' }, conf, h('div', { class: 'cel-card' }, h('div', { class: 'cel-burst' }, big ? '🌟' : '🎉'), h('b', {}, title), sub ? h('small', {}, sub) : null));
  document.body.append(card);
  G.sfx && G.sfx('reward');
  if (heart && (G.state.settings || {}).heart !== false) say(`${title}! ${sub}`);
  setTimeout(() => { card.classList.add('out'); setTimeout(() => card.remove(), 600); }, big ? 3600 : 2600);
}

// ------------------------------------------------------------------------------------------- daily goals
// each goal: how to read progress from the save (a counter now, compared with the start of the day)
const COUNTERS = {
  answered: (G) => Object.values(G.edu.s.days || {}).reduce((a, d) => a + d[0], 0),
  firstTry: (G) => Object.values(G.edu.s.days || {}).reduce((a, d) => a + d[1], 0),
  words: (G) => (G.state.words || []).length,
  reviews: (G) => G.state.stats.reviews || 0,
  shifts: (G) => G.state.stats.shifts || 0,
  pieces: (G) => G.state.stats.pieces || 0,
  asked: (G) => G.state.stats.askedHeart || 0,
  adventures: (G) => G.state.stats.adventures || 0,
  lessons: (G) => G.state.stats.lessons || 0,
};
const POOL = [
  ['answered', 5, '✏️ Answer 5 questions', '✏️ Responde 5 preguntas'],
  ['firstTry', 3, '🎯 Get 3 right on the first try', '🎯 Acierta 3 al primer intento'],
  ['words', 1, '📖 Save a new word (tap any word)', '📖 Guarda una palabra nueva (toca cualquier palabra)'],
  ['lessons', 3, '📚 Do 3 lessons', '📚 Haz 3 lecciones'],
  ['shifts', 1, '💼 Work a shift', '💼 Trabaja un turno'],
  ['adventures', 1, '🧭 Play an adventure', '🧭 Juega una aventura'],
  ['asked', 1, '✨ Ask Heart a question', '✨ Hazle una pregunta a Heart'],
  ['reviews', 1, '🔁 Do a quick review', '🔁 Haz un repaso rápido'],
  ['pieces', 1, '✍️ Publish a piece of writing', '✍️ Publica un escrito'],
];
const seedOf = (d) => [...d].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
export function dailyGoals(G) {
  const s = G.state, d = today();
  if (!s.daily || s.daily.date !== d) {
    // three goals for the day: always one about answering, two others that fit where the player is
    const ok = POOL.filter(([k]) => !(k === 'shifts' && !(s.jobs || []).length) && !(k === 'reviews' && !G.edu.dueReviews().length));
    let r = seedOf(d); const pick = [ok[0]]; const rest = ok.slice(1);
    while (pick.length < 3 && rest.length) { r = (r * 1103515245 + 12345) >>> 0; pick.push(rest.splice(r % rest.length, 1)[0]); }
    s.daily = { date: d, goals: pick.map(([k, n]) => ({ k, n, base: COUNTERS[k](G) })), done: false };
  }
  return s.daily.goals.map((g) => { const def = POOL.find((p) => p[0] === g.k); return { ...g, have: Math.max(0, COUNTERS[g.k](G) - g.base), label: es() ? def[3] : def[2] }; });
}
/** check goals; when all three are done: reward, a sticker, the streak, a celebration */
export function checkDaily(G) {
  const s = G.state; const gs = dailyGoals(G);
  if (s.daily.done || !gs.every((g) => g.have >= g.n)) return;
  s.daily.done = true;
  const st = s.streak || (s.streak = { days: [], best: 0 });
  if (!st.days.includes(s.daily.date)) st.days.push(s.daily.date);
  if (st.days.length > 400) st.days.splice(0, st.days.length - 400);
  const cur = streakNow(G); st.best = Math.max(st.best || 0, cur);
  G.earn(25, es() ? 'Metas del día' : 'Daily goals reward');
  const stk = giveSticker(G);
  celebrate(G, es() ? '¡Metas del día listas!' : 'Daily goals done!', `${es() ? 'Racha' : 'Streak'}: ${cur} 🔥 · +$25${stk ? ' · ' + stk : ''}`, { big: cur % 7 === 0 });
  unlockOutfits(G);
  G.save();
}
export function streakNow(G) {
  const days = new Set(((G.state.streak || {}).days) || []); let n = 0;
  for (let t = Date.now(); ; t -= 864e5) { const d = today(t); if (days.has(d)) n++; else if (d === today()) continue; else break; if (n > 999) break; }
  return n;
}

// ------------------------------------------------------------------------------------------- stickers
export const STICKERS = ['🌟', '🚀', '🦊', '🐢', '🌈', '🍕', '🎸', '🏀', '🦄', '🌻', '🐙', '🎨', '🧩', '🛹', '🍩', '🐳', '🌙', '⚡', '🦉', '🌵', '🎈', '🐝', '🍉', '👑'];
function giveSticker(G) {
  const s = G.state, have = s.stickers || (s.stickers = []);
  const left = STICKERS.filter((x) => !have.includes(x)); if (!left.length) return null;
  const x = left[Math.floor(Math.random() * left.length)]; have.push(x); return x;
}

// ------------------------------------------------------------------------------------------- outfits you unlock
export const UNLOCKS = [
  ['sunrise', 'Sunrise', 0xe2662a, (G) => streakNow(G) >= 3 || ((G.state.streak || {}).best || 0) >= 3, '3-day streak', 'Racha de 3 días'],
  ['galaxy', 'Galaxy', 0x3b1f6e, (G) => ((G.state.streak || {}).best || 0) >= 7, '7-day streak', 'Racha de 7 días'],
  ['scholar', 'Scholar', 0x1f6e5c, (G) => G.edu.masteredCount() >= 10, 'Master 10 skills', 'Domina 10 habilidades'],
  ['gold', 'Gold', 0xc9a227, (G) => (G.state.stickers || []).length >= 12, 'Collect 12 stickers', 'Junta 12 estampas'],
  ['sky', 'Sky', 0x3d8fd6, (G) => Object.keys(G.state.achievements || {}).length >= 10, 'Earn 10 trophies', 'Gana 10 trofeos'],
];
export function addUnlockJackets(JACKETS) { for (const [id, name, color] of UNLOCKS) if (!JACKETS.some((j) => j.id === id)) JACKETS.push({ id, name, color }); }
export function unlockOutfits(G) {
  const s = G.state;
  for (const [id, name, , test] of UNLOCKS) if (!s.wardrobe.includes(id) && test(G)) { s.wardrobe.push(id); setTimeout(() => celebrate(G, es() ? `¡Chaqueta nueva: ${name}!` : `New jacket: ${name}!`, es() ? 'Póntela en tu armario.' : 'Wear it from your wardrobe at home.'), 2800); }
}

// ------------------------------------------------------------------------------------------- the Trophies app
function badges(G) {
  // learning badges: one per subject at 3, 8 and 15 skills you can do on your own
  return Object.entries(SUBJECTS).flatMap(([k, sub]) => { const n = Object.values(SKILLS).filter((x) => x.subj === k && G.edu.state(x.id) >= 3).length;
    return [[3, '🥉'], [8, '🥈'], [15, '🥇']].map(([need, medal]) => ({ icon: `${medal}${sub.icon}`, name: `${sub.name} ${need}`, desc: es() ? `${need} habilidades de ${sub.name} que haces solo` : `${need} ${sub.name} skills you can do on your own`, got: n >= need, prog: `${Math.min(n, need)}/${need}` })); });
}
function calendar(G) {
  const days = new Set(((G.state.streak || {}).days) || []), now = new Date(), y = now.getFullYear(), m = now.getMonth();
  const first = new Date(y, m, 1).getDay(), n = new Date(y, m + 1, 0).getDate();
  const cells = [...Array(first)].map(() => h('i', { class: 'cal-c empty' }));
  for (let d = 1; d <= n; d++) { const key = new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10); cells.push(h('i', { class: 'cal-c' + (days.has(key) ? ' on' : '') + (d === now.getDate() ? ' today' : '') }, days.has(key) ? '🔥' : String(d))); }
  return h('div', {}, h('div', { class: 'cal-h' }, now.toLocaleDateString(lang() === 'es' ? 'es' : 'en', { month: 'long', year: 'numeric' })),
    h('div', { class: 'cal' }, ...['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((w) => h('b', {}, w)), ...cells));
}
export function trophiesApp(G) {
  const s = G.state, gs = dailyGoals(G), cur = streakNow(G);
  const ach = Object.entries(ACHIEVEMENTS), got = ach.filter(([id]) => s.achievements[id]).length, B = badges(G);
  return h('div', { class: 'act trophies' },
    h('div', { class: 'budget' }, h('div', {}, h('small', {}, es() ? 'RACHA' : 'STREAK'), h('b', {}, `${cur} 🔥`)), h('div', {}, h('small', {}, es() ? 'MEJOR' : 'BEST'), h('b', {}, (s.streak || {}).best || 0)), h('div', {}, h('small', {}, es() ? 'TROFEOS' : 'TROPHIES'), h('b', {}, `${got}/${ach.length}`))),
    h('div', { class: 'tier-h' }, es() ? '🎯 Metas de hoy' : '🎯 Today’s goals'),
    h('div', { class: 'goals' }, ...gs.map((g) => h('div', { class: 'goal' + (g.have >= g.n ? ' done' : '') }, h('span', {}, g.have >= g.n ? '✅' : '⬜'), h('span', {}, g.label), h('small', {}, `${Math.min(g.have, g.n)}/${g.n}`)))),
    h('p', { class: 'tip' }, s.daily && s.daily.done ? (es() ? '¡Listo por hoy! Vuelve mañana para seguir tu racha.' : 'All done for today! Come back tomorrow to keep your streak.') : (es() ? 'Termina las 3 para ganar $25, una estampa y un día de racha.' : 'Finish all 3 for $25, a sticker and a streak day.')),
    calendar(G),
    h('div', { class: 'tier-h' }, `${es() ? '🗂️ Estampas' : '🗂️ Sticker book'} (${(s.stickers || []).length}/${STICKERS.length})`),
    h('div', { class: 'stickers' }, ...STICKERS.map((x) => h('span', { class: 'stk' + ((s.stickers || []).includes(x) ? ' got' : '') }, (s.stickers || []).includes(x) ? x : '?'))),
    h('div', { class: 'tier-h' }, es() ? '🧥 Chaquetas para ganar' : '🧥 Jackets to unlock'),
    h('div', { class: 'unlocks' }, ...UNLOCKS.map(([id, name, color, , en, sp]) => h('div', { class: 'unl' + (s.wardrobe.includes(id) ? ' got' : '') }, h('i', { style: { background: '#' + color.toString(16).padStart(6, '0') } }), h('b', {}, name), h('small', {}, s.wardrobe.includes(id) ? (es() ? '¡Tuya!' : 'Yours!') : (es() ? sp : en))))),
    h('div', { class: 'tier-h' }, es() ? '🏅 Medallas de aprendizaje' : '🏅 Learning badges'),
    h('div', { class: 'badges' }, ...B.map((b) => h('div', { class: 'badge' + (b.got ? ' got' : ''), title: b.desc }, h('span', {}, b.got ? b.icon : '🔒'), h('small', {}, b.name), h('i', {}, b.prog)))),
    h('div', { class: 'tier-h' }, `${es() ? '🏆 Trofeos' : '🏆 Trophies'} (${got}/${ach.length})`),
    h('div', { class: 'badges' }, ...ach.map(([id, [name, desc]]) => h('div', { class: 'badge' + (s.achievements[id] ? ' got' : ''), title: desc }, h('span', {}, s.achievements[id] ? '🏆' : '🔒'), h('small', {}, name), h('i', {}, s.achievements[id] ? `${es() ? 'Día' : 'Day'} ${s.achievements[id]}` : desc)))));
}
