// REAL — Calm & clear mode, made with autistic players in mind (and anyone who likes a quieter, more predictable game).
// One switch, saved on this device:
//   • softer, quieter sounds: no buzzer for a wrong answer, no fanfare, music turned well down, no buzzing phone
//   • no surprises: no confetti or flashing, no moving or shaking, messages stay on screen longer
//   • gentle wording on mistakes: “Not yet” in calm blue, never red
//   • a heads-up before every change of place (“Next: the bus to Midtown. The screen will go dark for a moment.”)
//   • a 🌿 Calm space button: the game stops, a slow breathing circle, and you come back when you are ready
import { h, UI } from './ui.js';
import { tr } from './i18n.js';

const KEY = 'real.calmClear';
export const isCalm = () => { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } };
export function setCalm(on) { try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {} applyCalm(); }
export function applyCalm() {
  const on = isCalm();
  document.body.classList.toggle('calm-clear', on);
  document.body.classList.toggle('a11y-calm', on || !!(window.REAL && window.REAL.game && window.REAL.game() && (window.REAL.game().state.settings || {}).calm));   // reduce motion comes with it
  const b = document.getElementById('btn-calm'); if (b) b.hidden = !on;
}
/** how long a message stays on screen */
export const holdMs = (ms) => (isCalm() ? Math.round(ms * 1.7) : ms);
/** sounds that calm mode leaves out or softens */
const SOFTER = { bad: null, reward: 'good', level: 'good', cash: 'coin', whoosh: null, register: 'click', scan: 'click' };
export const calmSound = (name) => (isCalm() && name in SOFTER ? SOFTER[name] : name);

/** a short heads-up before something changes; resolves when the player taps OK (instantly when calm mode is off) */
export function headsUp(text) {
  if (!isCalm() || (navigator.webdriver && !window.__calmAsk)) return Promise.resolve();
  return UI.sheet('What happens next', (close) => h('div', { class: 'act calm-next' },
    h('p', { class: 'lead' }, text),
    h('button', { class: 'primary', onclick: () => close(true) }, 'OK, I’m ready')), { icon: '🗺️', noClose: true });
}

/** the calm space: a quiet screen with a slow breathing circle; the game waits until the player is ready */
export function calmSpace() {
  return UI.sheet('Calm space', (close) => {
    const label = h('p', { class: 'calm-say', 'aria-live': 'polite' }, tr('Breathe in…'));
    let n = 0; const t = setInterval(() => { if (!label.isConnected) return clearInterval(t); n++; label.textContent = tr(n % 2 ? 'Breathe out…' : 'Breathe in…'); }, 4000);
    return h('div', { class: 'act calm-room' },
      h('p', { class: 'lead' }, 'The game is paused. Take as long as you need.'),
      h('div', { class: 'calm-circle', 'aria-hidden': 'true' }), label,
      h('p', { class: 'tip' }, 'Breathe in while the circle grows. Breathe out while it gets smaller.'),
      h('button', { class: 'primary', onclick: () => { clearInterval(t); close(true); } }, 'I’m ready'));
  }, { icon: '🌿' });
}
