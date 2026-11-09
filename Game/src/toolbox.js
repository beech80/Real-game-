// REAL — the Toolbox: help with anything, any subject. Ask Heart, practise your own mistakes, word flashcards, a
// calculator that shows its steps, a focus timer with brain breaks, notes, and a calm-down breathing tool.
import { h, UI } from './ui.js';
import { SKILLS, SUBJECTS } from './edu.js';
import { runActivity } from './learnkit.js';
import { askHeart, heartOn } from './heart.js';
import { say, stopReading } from './readalong.js';
import { lookup } from './glossary.js';
import { lang } from './i18n.js';

const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);

// ---- 🔁 Practise my mistakes: the skills you missed lately, mixed, one question each
export async function practiseMistakes(G, PRACTICE, max = 6) {
  const list = Object.entries(G.edu.s.skills).filter(([id, k]) => SKILLS[id] && PRACTICE[id] && (k.miss || 0) > 0 && k.st <= 3)
    .sort((a, b) => (b[1].lastSeenAt || 0) - (a[1].lastSeenAt || 0)).slice(0, max).map(([id]) => id);
  if (!list.length) { UI.toast('No mistakes to practise. Nice work! Try something new in 📚 Learn.', 'good', 3600); return; }
  let right = 0;
  for (const [i, id] of shuffle(list).entries()) { const r = await runActivity(G, () => ({ skill: id, ...PRACTICE[id]() }), 'mistakes', `🔁 Practise my mistakes · ${i + 1} of ${list.length}`, '🔁'); if (r === undefined) break; if (r && r.ok) right++; }
  UI.toast(`🔁 ${right} of ${list.length} right this time. Mistakes are how we learn!`, 'good', 4200);
}

// ---- 📇 word flashcards: your saved words, flip to see the meaning, hear it
function flashcards(G) {
  const words = shuffle((G.state.words || []).filter((w) => /^[a-z']+$/.test(w)));
  const box = h('div', { class: 'act flash' });
  if (!words.length) { box.append(h('p', { class: 'lead' }, 'Tap any word in the game to save it. Your words show up here as flashcards.')); return box; }
  let i = 0, flipped = false;
  const render = () => {
    const w = words[i], e = lookup(w);
    box.replaceChildren(h('p', { class: 'tip' }, `Card ${i + 1} of ${words.length}`),
      h('button', { class: 'flashcard' + (flipped ? ' back' : ''), onclick: () => { flipped = !flipped; render(); if (flipped && e) say(`${w} means ${e.meaning}`); } },
        flipped ? h('span', {}, e ? e.meaning : 'Use it in a sentence of your own!') : h('b', {}, w)),
      h('div', { class: 'row' }, h('button', { class: 'ghost sm', onclick: () => say(w, { en: true }) }, '🔊 Say it'),
        h('button', { class: 'ghost sm', onclick: () => { i = (i - 1 + words.length) % words.length; flipped = false; render(); } }, '‹ Back'),
        h('button', { class: 'primary sm', onclick: () => { i = (i + 1) % words.length; flipped = false; render(); } }, 'Next ›')),
      h('p', { class: 'tip' }, 'Say the word, guess what it means, then tap the card to check.'));
  };
  render(); return box;
}

// ---- 🧮 calculator that shows its steps (column method for + and −, groups for ×, sharing for ÷)
export function steps(a, op, b) {
  const A = Number(a), B = Number(b);
  if (!isFinite(A) || !isFinite(B)) return { ans: null, steps: ['Type two numbers.'] };
  const int = Number.isInteger(A) && Number.isInteger(B) && A >= 0 && B >= 0;
  if (op === '+') {
    if (!int) return { ans: +(A + B).toFixed(4), steps: [`Line up the decimal points.`, `${A} + ${B} = ${+(A + B).toFixed(4)}`] };
    const s = [], da = String(A).split('').reverse(), db = String(B).split('').reverse(), places = ['ones', 'tens', 'hundreds', 'thousands', 'ten-thousands', 'hundred-thousands']; let carry = 0;
    for (let k = 0; k < Math.max(da.length, db.length); k++) { const x = +(da[k] || 0), y = +(db[k] || 0), t = x + y + carry; s.push(`${places[k] || 'next place'}: ${x} + ${y}${carry ? ' + 1 carried' : ''} = ${t}${t >= 10 ? ` → write ${t % 10}, carry 1` : ''}`); carry = t >= 10 ? 1 : 0; }
    if (carry) s.push('Write the last carried 1 in front.');
    return { ans: A + B, steps: s };
  }
  if (op === '−') {
    if (!int || B > A) return { ans: +(A - B).toFixed(4), steps: [B > A ? `${B} is bigger than ${A}, so the answer is below zero: ${A} − ${B} = ${+(A - B).toFixed(4)}` : `Line up the decimal points.`, `${A} − ${B} = ${+(A - B).toFixed(4)}`] };
    const s = [], da = String(A).split('').reverse().map(Number), db = String(B).split('').reverse().map(Number), places = ['ones', 'tens', 'hundreds', 'thousands', 'ten-thousands']; let borrow = 0;
    for (let k = 0; k < da.length; k++) { let x = da[k] - borrow; const y = db[k] || 0; if (x < y) { s.push(`${places[k] || 'next place'}: ${x} is less than ${y}, so borrow 1 from the next place: ${x + 10} − ${y} = ${x + 10 - y}`); borrow = 1; } else { s.push(`${places[k] || 'next place'}: ${x} − ${y} = ${x - y}`); borrow = 0; } }
    return { ans: A - B, steps: s };
  }
  if (op === '×') return { ans: +(A * B).toFixed(4), steps: int && B <= 12 ? [`${B} groups of ${A}.`, `${[...Array(Math.min(B, 6))].map(() => A).join(' + ')}${B > 6 ? ' + …' : ''} = ${A * B}`] : [`Split it: ${A} × ${B} = ${A} × ${Math.floor(B)}${B % 1 ? ` + ${A} × ${+(B % 1).toFixed(2)}` : ''}`, `= ${+(A * B).toFixed(4)}`] };
  if (op === '÷') { if (!B) return { ans: null, steps: ['You can’t divide by zero: there’s no way to share into zero groups.'] }; const q = Math.floor(A / B), r = +(A - q * B).toFixed(4);
    return { ans: +(A / B).toFixed(4), steps: [`Share ${A} into ${B} equal groups.`, `${B} × ${q} = ${B * q}, so each group gets ${q}${r ? ` with ${r} left over` : ''}.`, r ? `As a decimal: ${A} ÷ ${B} ≈ ${+(A / B).toFixed(4)}` : `${A} ÷ ${B} = ${q}`] }; }
  return { ans: null, steps: [] };
}
// the calculator's steps in Spanish
const ES_STEPS = [[/ten-thousands/g, 'decenas de millar'], [/hundred-thousands/g, 'centenas de millar'], [/\bthousands\b/g, 'millares'], [/\bhundreds\b/g, 'centenas'], [/\btens\b/g, 'decenas'], [/\bones\b/g, 'unidades'], 
  [/ \+ 1 carried/g, ' + 1 que llevas'], [/→ write (\d+), carry 1/g, '→ escribe $1, llevas 1'], [/Write the last carried 1 in front\./g, 'Escribe el 1 que llevas al frente.'], [/(\S+) is less than (\S+), so borrow 1 from the next place:/g, '$1 es menor que $2, así que pide 1 prestado al siguiente lugar:'],
  [/(\d+) groups of (\d+)\./g, '$1 grupos de $2.'], [/Split it:/g, 'Sepáralo:'], [/Share (\S+) into (\S+) equal groups\./g, 'Reparte $1 en $2 grupos iguales.'], [/so each group gets (\S+) with (\S+) left over\./g, 'así que a cada grupo le tocan $1 y sobran $2.'], [/so each group gets (\S+)\./g, 'así que a cada grupo le tocan $1.'],
  [/As a decimal:/g, 'En decimal:'], [/Line up the decimal points\./g, 'Alinea los puntos decimales.'], [/(\S+) is bigger than (\S+), so the answer is below zero:/g, '$1 es mayor que $2, así que la respuesta es menor que cero:'], [/You can’t divide by zero: there’s no way to share into zero groups\./g, 'No se puede dividir entre cero: no hay forma de repartir en cero grupos.'], [/Type two numbers\./g, 'Escribe dos números.'], [/next place/g, 'siguiente lugar']];
export const stepText = (t) => (lang() === 'es' ? ES_STEPS.reduce((a, [re, r]) => a.replace(re, r), t) : t);
function calculator() {
  const a = h('input', { class: 'writebox calc-in', inputmode: 'decimal', placeholder: 'First number' }), b = h('input', { class: 'writebox calc-in', inputmode: 'decimal', placeholder: 'Second number' });
  let op = '+'; const ops = h('div', { class: 'row' }), out = h('div', { class: 'calc-out' });
  const go = () => { const r = steps(a.value.replace(/[$,]/g, ''), op, b.value.replace(/[$,]/g, '')); out.replaceChildren(...(r.ans != null ? [h('p', { class: 'smh-ans' }, `= ${r.ans}`)] : []), h('ol', { class: 'smh-steps readable' }, ...r.steps.map((t) => h('li', {}, stepText(t))))); };
  const drawOps = () => ops.replaceChildren(...['+', '−', '×', '÷'].map((o) => h('button', { class: o === op ? 'primary sm' : 'ghost sm', onclick: () => { op = o; drawOps(); go(); } }, o)));
  drawOps(); a.oninput = go; b.oninput = go;
  return h('div', { class: 'act' }, h('p', { class: 'lead' }, 'A calculator that shows how. Check your work, or see the steps for a money problem.'), a, ops, b, out,
    h('button', { class: 'ghost sm', onclick: () => say(out.textContent) }, '🔊 Read the steps'));
}

// ---- ⏱️ focus timer with brain breaks
function focusTimer() {
  const disp = h('div', { class: 'timer-disp' }, '10:00'), note = h('p', { class: 'tip' }, 'Focus for 10 minutes, then take a 2-minute brain break.');
  let left = 600, mode = 'focus', t = null;
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const tick = () => { left--; disp.textContent = fmt(left); if (left <= 0) { clearInterval(t); t = null;
    if (mode === 'focus') { mode = 'break'; left = 120; note.textContent = '🎉 Brain break! Stand up, stretch, drink some water.'; say('Great focus! Time for a brain break. Stand up and stretch.'); start(); }
    else { mode = 'focus'; left = 600; disp.textContent = fmt(left); note.textContent = 'Break’s over. Ready for another round?'; say('Break is over. Ready for another round?'); } } };
  const start = () => { if (!t) t = setInterval(tick, 1000); };
  const box = h('div', { class: 'act' }, h('p', { class: 'lead' }, '⏱️ Focus timer'), disp, note,
    h('div', { class: 'row' }, h('button', { class: 'primary', onclick: start }, 'Start'), h('button', { class: 'ghost', onclick: () => { clearInterval(t); t = null; } }, 'Pause'), h('button', { class: 'ghost sm', onclick: () => { clearInterval(t); t = null; mode = 'focus'; left = 600; disp.textContent = fmt(left); } }, 'Reset')));
  const obs = new MutationObserver(() => { if (!box.isConnected) { clearInterval(t); obs.disconnect(); } }); setTimeout(() => obs.observe(document.body, { childList: true, subtree: true }), 0);
  return box;
}

// ---- 📝 notes
function notes(G) {
  const s = G.state, list = s.notes || (s.notes = []);
  const ta = h('textarea', { class: 'writebox', rows: 3, placeholder: 'Write a note: something you learned, a goal, a question for later…' });
  const wrap = h('div', {});
  const render = () => wrap.replaceChildren(...list.slice().reverse().map((n, i) => h('div', { class: 'bill' }, h('div', { class: 'readable' }, h('small', {}, `Day ${n.d}`), h('p', {}, n.t)),
    h('div', {}, h('button', { class: 'say-btn', onclick: () => say(n.t) }, '🔊'), h('button', { class: 'ghost sm', onclick: () => { list.splice(list.length - 1 - i, 1); G.save(); render(); } }, '🗑️')))));
  render();
  return h('div', { class: 'act' }, ta, h('button', { class: 'primary sm', onclick: () => { const t = ta.value.trim(); if (!t) return; list.push({ t, d: s.day, at: Date.now() }); if (list.length > 100) list.shift(); ta.value = ''; G.save(); render(); } }, 'Save note'), wrap);
}

// ---- 🌬️ calm down: box breathing with Heart counting
function calm() {
  const ring = h('div', { class: 'breath' }), label = h('p', { class: 'lead' }, 'Tap Start and breathe with the circle.');
  let on = false, k = 0;
  const PH = [['Breathe in', 'in'], ['Hold', 'hold'], ['Breathe out', 'out'], ['Hold', 'hold2']];
  const step = () => { if (!on || !ring.isConnected) { on = false; return; } const [t, c] = PH[k % 4]; label.textContent = `${t}… 2… 3… 4`; ring.className = 'breath ' + c; say(t); k++; if (k >= 16) { on = false; label.textContent = 'Nice. How do you feel now?'; say('Nice. How do you feel now?'); return; } setTimeout(step, 4000); };
  return h('div', { class: 'act calm' }, ring, label, h('div', { class: 'row' }, h('button', { class: 'primary', onclick: () => { if (on) return; on = true; k = 0; step(); } }, 'Start'), h('button', { class: 'ghost', onclick: () => { on = false; stopReading(); label.textContent = 'Stopped. You can start again any time.'; } }, 'Stop')),
    h('p', { class: 'tip' }, 'Box breathing: in for 4, hold for 4, out for 4, hold for 4. Four rounds calm your body. If big feelings stay, talk to a grown-up you trust.'));
}

/** the Toolbox app */
export function toolbox(G, PRACTICE, close) {
  const box = h('div', { class: 'act' });
  const menu = () => box.replaceChildren(h('p', { class: 'lead' }, 'Tools that help with anything.'),
    h('div', { class: 'cards cats' }, ...[
      ['✨', 'Ask Heart', 'Questions about anything', () => askHeart(G)],
      ['🔁', 'Practise my mistakes', 'Redo what you missed', () => { close(); practiseMistakes(G, PRACTICE); }],
      ['📇', 'Word flashcards', 'Your saved words', () => page('Word flashcards', flashcards(G))],
      ['🧮', 'Calculator with steps', 'See how, not just the answer', () => page('Calculator', calculator())],
      ['⏱️', 'Focus timer', 'Focus, then a brain break', () => page('Focus timer', focusTimer())],
      ['📝', 'My notes', 'Save what you learn', () => page('My notes', notes(G))],
      ['🌬️', 'Calm down', 'Breathe with Heart', () => page('Calm down', calm())],
    ].map(([ic, n, d, f]) => h('button', { class: 'card', onclick: f }, h('span', { class: 'big-emoji' }, ic), h('b', {}, n), h('small', {}, d)))));
  const page = (title, el) => box.replaceChildren(h('div', { class: 'tier-h' }, title), el, h('button', { class: 'ghost', onclick: () => { stopReading(); menu(); } }, '‹ Toolbox'));
  menu();
  return box;
}
