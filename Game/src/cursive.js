// REAL — Cursive Class (the ✍️ Cursive app on the phone). A full course, in the order schools teach it:
// lowercase letters in stroke families, each followed by words made only of letters already learned; then every capital
// with names; then whole sentences; then signing your own name. Each letter is shown being written, then traced.
// Progress is saved in state.cursive = { done: { lessonId: 1 } }.
import { h, UI } from './ui.js';
import { tr } from './i18n.js';

// [id, title, what the strokes have in common, skill, things to trace in order]
export const CURSIVE_LESSONS = [
  ['l1', 'Swing up: i t u w', 'These letters start on the bottom line and swing up.', 'curs.strokes', ['i', 't', 'u', 'w', 'it', 'wit']],
  ['l2', 'Loops: e l b', 'Swing up, loop back, and come down.', 'curs.lower', ['e', 'l', 'b', 'tell', 'blue']],
  ['l3', 'Tall loops: h k f', 'A tall loop first. Then the rest of the letter.', 'curs.lower', ['h', 'k', 'f', 'hike', 'life']],
  ['l4', 'Swing up: r s j p', 'Swing up to the middle line, then make the letter.', 'curs.lower', ['r', 's', 'j', 'p', 'trip', 'jets']],
  ['l5', 'Round letters: c a d', 'Start like a c. Go up and over, then back around.', 'curs.lower', ['c', 'a', 'd', 'cat', 'dad']],
  ['l6', 'Round letters: g q o', 'Start like a c. Close the circle, then finish.', 'curs.lower', ['g', 'q', 'o', 'good', 'quit']],
  ['l7', 'Humps: n m', 'Go up and over the hump. An m has one more hump than an n.', 'curs.lower', ['n', 'm', 'man', 'moon']],
  ['l8', 'Humps: v x y z', 'Start with a hump, then finish each letter its own way.', 'curs.lower', ['v', 'x', 'y', 'z', 'you', 'zany']],
  ['w1', 'Join whole words', 'Keep your finger down. Each letter leads into the next.', 'curs.words', ['learn', 'grow', 'fresh', 'quick', 'jump']],
  ['u1', 'Capitals: A C E O', 'Capitals are tall. These start near the top and curve around.', 'curs.upper', ['A', 'C', 'E', 'O', 'Ava', 'Cole']],
  ['u2', 'Capitals: N M H K', 'These start at the top with a small hook.', 'curs.upper', ['N', 'M', 'H', 'K', 'Nia', 'Kai']],
  ['u3', 'Capitals: U V W X Y Z', 'Start with a hook at the top, then swing down.', 'curs.upper', ['U', 'V', 'W', 'X', 'Y', 'Z', 'Val', 'Zoe']],
  ['u4', 'Capitals: P R B D', 'A tall line down first. Then go around.', 'curs.upper', ['P', 'R', 'B', 'D', 'Rosa', 'Dee']],
  ['u5', 'Capitals: I J S G L', 'These start low and loop up.', 'curs.upper', ['I', 'J', 'S', 'G', 'L', 'Jax', 'Sam']],
  ['u6', 'Capitals: T F Q', 'T and F wear a wavy hat. Q looks like a big 2.', 'curs.upper', ['T', 'F', 'Q', 'Tom', 'Fay']],
  ['s1', 'Whole sentences', 'A capital first. A small space between words. A period at the end.', 'curs.fluent', ['I can do it', 'Thank you so much', 'See you soon']],
  ['n1', 'Sign your name', 'Your signature is your name in cursive. It is how you sign forms.', 'curs.signature', ['@name']],
];
const lettersOf = (L) => L[4].filter((t) => t.length === 1);
export const cursiveProgress = (s) => { const d = (s.cursive && s.cursive.done) || {}; return { done: CURSIVE_LESSONS.filter((L) => d[L[0]]).length, total: CURSIVE_LESSONS.length }; };

/** the app: the alphabet learned so far, and the lessons in order */
export function cursiveClass(G, A) {
  const s = G.state, box = h('div', { class: 'act cursive-class' });
  const done = () => (s.cursive = s.cursive || { done: {} }).done;
  const home = () => {
    const d = done(), next = CURSIVE_LESSONS.find((L) => !d[L[0]]), learned = new Set(CURSIVE_LESSONS.filter((L) => d[L[0]]).flatMap(lettersOf)), p = cursiveProgress(s);
    box.replaceChildren(
      h('p', { class: 'lead' }, p.done >= p.total ? 'You finished Cursive Class. You can write and sign in cursive. Practice any lesson again.' : 'Learn to write in cursive, one small group of letters at a time. Watch each letter, then trace it.'),
      h('div', { class: 'bar' }, h('i', { style: { width: Math.round(100 * p.done / p.total) + '%' } })),
      h('small', { class: 'curs-count' }, `${p.done} / ${p.total}`),
      h('div', { class: 'curs-abc', 'aria-label': tr('Letters you know') }, ...'abcdefghijklmnopqrstuvwxyz'.split('').map((c) => h('span', { class: (learned.has(c) ? 'low ' : '') + (learned.has(c.toUpperCase()) ? 'up' : '') }, c.toUpperCase() + c))),
      next ? h('button', { class: 'primary', id: 'curs-next', onclick: () => lesson(next) }, `▶ ${tr(p.done ? 'Next lesson' : 'Start')}: ${tr(next[1])}`) : null,
      h('div', { class: 'curs-list' }, ...CURSIVE_LESSONS.map((L, i) => h('button', { class: 'skillrow' + (d[L[0]] ? ' done' : L === next ? ' now' : ''), 'data-lesson': L[0], onclick: () => lesson(L) },
        h('div', {}, h('b', {}, `${i + 1}. ${tr(L[1])}`), h('small', {}, tr(L[2]))), h('span', {}, d[L[0]] ? '✓' : L === next ? '›' : '')))));
  };
  const lesson = (L) => {
    const items = L[4].map((t) => (t === '@name' ? (s.name || 'Kai') : t)); let k = 0;
    const step = () => {
      const t = items[k], demo = h('div', { class: 'curs-demo', 'aria-hidden': 'true' }, h('span', {}, t));
      const replay = () => { const sp = demo.firstChild; sp.style.animation = 'none'; void sp.offsetWidth; sp.style.animation = ''; };
      box.replaceChildren(
        h('button', { class: 'ghost sm', onclick: home }, '‹ ' + tr('Cursive Class')),
        h('p', { class: 'lead' }, tr(L[2])),
        h('small', { class: 'curs-count' }, `${k + 1} / ${items.length}`),
        h('div', { class: 'row curs-watch' }, demo, h('button', { class: 'ghost sm', onclick: replay }, '▶ ' + tr('Watch again'))),
        A.cursivePad(G, t, L[3], '', () => {
          if (++k < items.length) { UI.toast(`✓ “${t}”`, 'good', 1200); return step(); }
          const first = !done()[L[0]]; done()[L[0]] = 1; s.stats.cursiveLessons = (s.stats.cursiveLessons || 0) + (first ? 1 : 0); G.save();
          const p = cursiveProgress(s);
          UI.toast(p.done >= p.total && first ? '✍️ ' + tr('You finished Cursive Class!') : '✍️ ' + tr('Lesson done!'), 'gold', 2600); G.sfx('good'); home();
        }));
    };
    step();
  };
  home();
  return box;
}
