// REAL — version and release notes. The version shows on the title screen and in Settings; returning players see
// "What's new" once after an update (new players don't: everything is new to them).
import { h, UI } from './ui.js';
import { lang } from './i18n.js';

export const VERSION = '1.3.0';
export const NOTES = [
  ['1.3.0', [
    ['♿', 'Wheelchair and crutches', 'Your REAL can use a wheelchair or crutches. Pick it when you make your REAL, or in Settings.'],
    ['👁️', 'See through your eyes', 'Tap 👁️ to see the world the way your REAL sees it. Tap it again to see your REAL from behind.'],
    ['🎵', 'Softer music', 'The drum beat is gone. The music is calm now.'],
  ]],
  ['1.1.0', [
    ['🎨', 'New artwork', 'Stickers, medals and postcards drawn by hand. And a face for Heart.'],
    ['👥', 'Players', 'More than one person can keep a game on this device. Find it on the first screen.'],
    ['⏩', 'Faster days', 'Days go by fast now. You can skip to tonight from your bed.'],
    ['📜', 'My certificate', 'Print a certificate of what you have learned. Find it in Trophies.'],
    ['💗', 'Break reminders', 'Heart tells you to stretch and drink water after 30 minutes.'],
    ['🔤', 'Easier-to-read letters', 'A new choice in Settings puts more space in letters and lines.'],
  ]],
  ['1.0.0', [
    ['✨', 'Heart, the reading voice', 'A real voice reads the story, lessons and questions. She cheers you on and helps you. Tap 🗣️ to change her voice.'],
    ['🏆', 'Trophies, streaks and stickers', 'Three goals each day. A streak chart. A sticker book. Badges and jackets you win when you learn.'],
    ['🎵', 'Music for every place', 'New music for each place, for night, for rooms and for lessons. Plus footsteps and sound sliders.'],
    ['🧭', 'Each adventure is a story in five parts', '21 new stories. Pets and rescue. Clues and cooking. Doctors and robots. Building, new ideas and shops.'],
    ['🧰', 'Toolbox', 'Ask Heart. Fix your mistakes. Use flash cards. Use a calculator that shows its steps. Use a timer, notes and calm breaths.'],
    ['📱', 'A cleaner screen', 'Your goal, money and jobs do not hide the game now. The words are easy to read.'],
  ]],
];
const ES = { 'What’s new': 'Novedades', 'Let’s play!': '¡A jugar!' };
const t = (s) => (lang() === 'es' && ES[s]) || s;

/** show "What's new" once per update for returning players */
export function whatsNew(force = false) {
  let seen = null; try { seen = localStorage.getItem('real.seenVersion'); localStorage.setItem('real.seenVersion', VERSION); } catch (e) {}
  if (!force && (!seen || seen === VERSION)) return Promise.resolve();
  const rel = NOTES.find((n) => n[0] === VERSION) || NOTES[0];
  return UI.sheet(`${t('What’s new')} · ${rel[0]}`, (close) => h('div', { class: 'act whatsnew' },
    ...rel[1].map(([ic, title, body]) => h('div', { class: 'wn-row' }, h('span', { class: 'wn-ic' }, ic), h('div', {}, h('b', {}, title), h('p', { class: 'readable' }, body)))),
    h('button', { class: 'primary', onclick: () => close() }, t('Let’s play!'))), { icon: '🆕' });
}
