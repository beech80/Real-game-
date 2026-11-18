// REAL — version and release notes. The version shows on the title screen and in Settings; returning players see
// "What's new" once after an update (new players don't: everything is new to them).
import { h, UI } from './ui.js';
import { lang } from './i18n.js';

export const VERSION = '1.9.3';
export const NOTES = [
  ['1.9.3', [
    ['🎮', 'Easier mini-games', 'Each race and contest starts with a short how-to card. In a car race, your car helps you stay on the road.'],
  ]],
  ['1.9.2', [
    ['🎵', 'Smoother music', 'The music has no beat at all now: soft chords that rise and fade, and a few gentle notes.'],
  ]],
  ['1.9.1', [
    ['💗', 'Clearer Heart', 'The music gets quieter while Heart talks, and her sentences play at their natural speed.'],
  ]],
  ['1.9.0', [
    ['📖', 'A story to follow', 'After your first paycheck, the story goes on in chapters. Each one has a few goals. Finish them to start the next chapter. See 📖 Story on your phone.'],
  ]],
  ['1.8.1', [
    ['🗺️', 'Questions at your level', 'People in the city now ask questions that fit your level. Younger players tap a number instead of typing it.'],
  ]],
  ['1.8.0', [
    ['⏩', 'Shorter days', 'A day now takes about 10 minutes to play, not 20.'],
    ['🧭', 'Easier to play', 'Tap 🧭 Go next to your goal and your REAL walks there by itself. The game also runs smoother on phones.'],
    ['🏃', 'Park Jog game', 'Jogging in Brighter Park is a running game now. Grab water, fruit and stars, and step around cones.'],
    ['🗺️', 'Easier side quests', 'Helping people around the city is easier and more fun: fewer choices, quicker help, and a cheer when you finish.'],
    ['💗', 'Heart answers faster', 'Heart starts talking sooner, with shorter pauses between sentences.'],
  ]],
  ['1.7.1', [
    ['💗', 'Heart’s voice is back', 'Heart sounds the way she did before. We are working on making her clearer.'],
  ]],
  ['1.7.0', [
    ['💗', 'Heart sounds better', 'Every line is evened out and warmer. She sounds happier when you get it right and gentler when you miss.'],
    ['🔤', 'Words light up as she says them', 'The highlight follows Heart’s voice, word by word.'],
    ['🗣️', 'Smoother reading', 'When Heart reads word by word, the words flow together.'],
    ['✅', 'Fewer mistakes', 'Heart now says dates, prices per hour, sizes and names the right way.'],
  ]],
  ['1.6.0', [
    ['🌿', 'Calm & clear', 'Softer sounds, no surprises, gentle feedback and a calm space for breaks. Made with autistic players in mind. Turn it on in Settings.'],
    ['🏫', 'City School', 'Take classes on your phone. Each class teaches two skills at your level. Passing classes opens new parts of the city.'],
    ['✍️', 'Cursive Class', 'Learn every cursive letter, small and capital. Then write words and sign your name. Open ✍️ Cursive on your phone.'],
    ['🎒', 'Start at your grade', 'Tell the game your grade when you make your REAL, and lessons start at your level. Change it any time in Settings.'],
  ]],
  ['1.5.0', [
    ['💗', 'A clearer voice', 'Heart sounds clearer and smoother now. Every line was recorded again.'],
  ]],
  ['1.4.0', [
    ['🎮', 'Better controls', 'Moving and looking feel smoother. Buttons press in when you tap them. You can play with a game controller too.'],
    ['⚡', 'Runs smoother', 'The game is faster now, most of all on phones and older computers.'],
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
