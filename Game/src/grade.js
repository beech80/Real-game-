// REAL — where a learner starts. A new player says what grade they are in (ages are shown beside it), and lessons in
// every subject begin at that level instead of at the very beginning. It is only a starting point: the game still moves
// each subject up as skills are learned, and down if the work turns out to be too hard. Saved on the device only.
import { h, UI } from './ui.js';
import { tr } from './i18n.js';
import { isCalm, setCalm } from './calm.js';

// [starting level 1–6, label, ages]
export const GRADES = [
  [0.5, 'Pre-K: getting ready for school', 'ages 3 to 5'],
  [1, 'Kindergarten or 1st grade', 'ages 5 to 7'],
  [2, '2nd or 3rd grade', 'ages 7 to 9'],
  [3, '4th or 5th grade', 'ages 9 to 11'],
  [4, '6th, 7th or 8th grade', 'ages 11 to 14'],
  [5, '9th or 10th grade', 'ages 14 to 16'],
  [6, '11th or 12th grade', 'ages 16 to 18'],
  [7, 'Getting ready for college', 'ages 16 and up'],
];
/** a grade choice → the starting level (1–6) and which school day fits (Pre-K and college prep have their own) */
export const gradeStart = (n) => ({ level: Math.max(1, Math.min(6, Math.round(n))), band: n === 0.5 ? 'prek' : n === 7 ? 'college' : n <= 3 ? 'elem' : n === 4 ? 'middle' : 'high' });
export const gradeName = (n) => (GRADES.find((g) => g[0] === n) || [0, 'Not set'])[1];

/** Ask for the grade. Resolves to 1–6, or undefined if the sheet was closed without choosing. */
export function askGrade(current) {
  return UI.sheet('What grade are you in?', (close) => h('div', {},
    h('p', { class: 'lead' }, 'This picks where your lessons start. The game still changes to fit you as you play.'),
    h('div', { class: 'grade-list' }, ...GRADES.map(([n, label, ages]) => h('button', { class: 'grade-btn' + (current === n ? ' on' : ''), 'data-grade': n, onclick: () => close(n) }, h('b', {}, label), h('small', {}, ages)))),
    h('p', { class: 'tip' }, 'Not sure? Pick the one closest to your age. You can change it later in Settings.'),
    (() => { const b = h('button', { class: 'calm-pick' + (isCalm() ? ' on' : ''), id: 'calm-pick', 'aria-pressed': String(isCalm()), onclick: () => { setCalm(!isCalm()); b.classList.toggle('on', isCalm()); b.setAttribute('aria-pressed', String(isCalm())); b.lastChild.textContent = tr(isCalm() ? 'On' : 'Off'); } }, h('span', {}, '🌿 ' + tr('Calm & clear: softer sounds, no surprises, a calm space')), h('b', {}, tr(isCalm() ? 'On' : 'Off'))); return b; })()), { icon: '🎒' });
}
