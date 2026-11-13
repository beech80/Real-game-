// REAL — version and release notes. The version shows on the title screen and in Settings; returning players see
// "What's new" once after an update (new players don't: everything is new to them).
import { h, UI } from './ui.js';
import { lang } from './i18n.js';

export const VERSION = '1.1.0';
export const NOTES = [
  ['1.1.0', [
    ['🎨', 'New artwork', 'Hand-drawn stickers, medals, city postcards, and a face for Heart.'],
    ['👥', 'Players', 'More than one person can keep a game on this device. Find it on the first screen.'],
    ['⏩', 'Faster days', 'Days go by faster, and you can skip ahead to tonight from your bed.'],
    ['📜', 'My certificate', 'Print a certificate of what you have learned. Find it in Trophies.'],
    ['💗', 'Break reminders', 'Heart reminds you to stretch and drink water after 30 minutes.'],
    ['🔤', 'Easier-to-read letters', 'A new choice in Settings spreads letters and lines apart.'],
  ]],
  ['1.0.0', [
    ['✨', 'Heart, the reading voice', 'A natural voice reads the story, lessons and questions, cheers you on, and answers questions. Tap 🗣️ for her settings.'],
    ['🏆', 'Trophies, streaks and stickers', 'Three daily goals, a streak calendar, a sticker book, learning badges and jackets you unlock by learning.'],
    ['🎵', 'Music for every place', 'New music for each district, night, indoors and lessons, plus footsteps and volume sliders.'],
    ['🧭', 'Every adventure is a five-part story', '21 new episodes across pets, rescue, mystery, cooking, medicine, robots, building, inventing and business.'],
    ['🧰', 'Toolbox', 'Ask Heart, practise your mistakes, flashcards, a calculator that shows its steps, a focus timer, notes and calm breathing.'],
    ['📱', 'A cleaner screen', 'Your goal, money and jobs no longer cover the game, and the words are easier to read.'],
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
