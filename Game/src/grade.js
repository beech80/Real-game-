// REAL — where a learner starts. A new player says what grade they are in (ages are shown beside it), and lessons in
// every subject begin at that level instead of at the very beginning. It is only a starting point: the game still moves
// each subject up as skills are learned, and down if the work turns out to be too hard. Saved on the device only.
import { h, UI } from './ui.js';

// [starting level 1–6, label, ages]
export const GRADES = [
  [1, 'Kindergarten or 1st grade', 'ages 5 to 7'],
  [2, '2nd or 3rd grade', 'ages 7 to 9'],
  [3, '4th or 5th grade', 'ages 9 to 11'],
  [4, '6th, 7th or 8th grade', 'ages 11 to 14'],
  [5, '9th or 10th grade', 'ages 14 to 16'],
  [6, '11th or 12th grade, or older', 'ages 16 and up'],
];
export const gradeName = (n) => (GRADES.find((g) => g[0] === n) || [0, 'Not set'])[1];

/** Ask for the grade. Resolves to 1–6, or undefined if the sheet was closed without choosing. */
export function askGrade(current) {
  return UI.sheet('What grade are you in?', (close) => h('div', {},
    h('p', { class: 'lead' }, 'This picks where your lessons start. The game still changes to fit you as you play.'),
    h('div', { class: 'grade-list' }, ...GRADES.map(([n, label, ages]) => h('button', { class: 'grade-btn' + (current === n ? ' on' : ''), 'data-grade': n, onclick: () => close(n) }, h('b', {}, label), h('small', {}, ages)))),
    h('p', { class: 'tip' }, 'Not sure? Pick the one closest to your age. You can change it later in Settings.')), { icon: '🎒' });
}
