// REAL — learning activities. Learn by Living: Discover → Understand → Practice → Apply → Master.
// Each activity is a real task in the world, adapts privately to the player's demonstrated skill,
// gives hints and alternate explanations, and never measures speed.
import { h, UI, money, wait } from './ui.js';
import { SKILLS, SUBJECTS, STATES } from './edu.js';
import { runActivity } from './learnkit.js';
import { lookup as lookupWord } from './glossary.js';
import { wordCard, wordPractice, say as sayWord } from './readalong.js';
import { PASSAGES, passagesNear } from './curriculum8.js';

// automated playtests only (navigator.webdriver): expose the expected keypad answer so a test bot can play like a person
const forBot = (k, v) => { try { if (navigator.webdriver) window[k] = v; } catch (e) {} };
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
const cents = (v) => Math.round(v * 100);

// ------------------------------------------------------------------------------------ teaching helpers
/** Discover → Understand: first time a skill appears, an NPC/visual explanation card. */
export async function teach(G, id, who = 'Tip') {
  if (!G.edu.discover(id)) return;
  const sk = SKILLS[id];
  await UI.sheet('New skill', (close) => h('div', { class: 'act learn-card' },
    h('div', { class: 'lc-subj' }, `${SUBJECTS[sk.subj].icon} ${SUBJECTS[sk.subj].name}`),
    h('h3', {}, sk.name), h('p', { class: 'lead' }, sk.objective),
    h('div', { class: 'lc-explain' }, h('b', {}, who + ': '), sk.explain),
    h('p', { class: 'tip' }, 'You’ll practise this with help first. There’s no timer and no grade, only progress.'),
    h('button', { class: 'primary', onclick: () => close() }, 'Got it')), { icon: '💡' });
}
/** Inline helper shown during Practice (and after mistakes, the alternate explanation). */
export function helpBox(G, id) {
  const sup = G.edu.support(id);
  const box = h('div', { class: 'helpbox', hidden: sup === 'independent' }, h('b', {}, '💡 '), G.edu.explain(id));
  const btn = h('button', { class: 'ghost sm', onclick: () => { box.hidden = false; btn.hidden = true; btn.dataset.used = '1'; } }, 'Show a hint');
  if (sup !== 'independent') btn.hidden = true;
  return { box, btn, hinted: () => sup === 'guided' || btn.dataset.used === '1' };
}
function stateChip(G, id) { const st = G.edu.state(id); return h('span', { class: 'chipst st' + st }, STATES[st]); }

function keypad(onOk, { decimals = false } = {}) {
  let val = '';
  const disp = h('div', { class: 'keypad-disp' }, decimals ? '$0.00' : '0');
  const show = () => { disp.textContent = decimals ? '$' + (val ? (parseInt(val, 10) / 100).toFixed(2) : '0.00') : (val || '0'); };
  const key = (k) => h('button', { class: 'key', onclick: () => { if (k === '⌫') val = val.slice(0, -1); else if (val.length < 6) val += k; show(); } }, k);
  const reset = () => { val = ''; show(); };
  const pad = h('div', { class: 'keypad' }, ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0'].map(key),
    h('button', { class: 'key ok', onclick: () => onOk(decimals ? parseInt(val || '0', 10) / 100 : parseInt(val || '0', 10), reset) }, '✓'));
  return { disp, pad };
}

// ------------------------------------------------------------------------------------ Chapter 1: reading signs in the wilderness
export async function readSign(G, sign) {
  await teach(G, sign.skill, 'The road');
  return UI.sheet('Read the sign', (close) => {
    const hp = helpBox(G, sign.skill);
    return h('div', { class: 'act' },
      h('div', { class: 'signcard' + (sign.wood ? ' wood' : '') }, sign.text.map((t) => h('div', {}, t)), sign.arrow ? h('div', { class: 'arrow' }, sign.arrow) : null),
      h('p', { class: 'lead' }, sign.q), hp.box,
      h('div', { class: 'opts' }, shuffle(sign.o).map((o) => h('button', { class: 'opt', onclick: (e) => {
        const ok = o === sign.a;
        G.edu.record(sign.skill, ok, { ctx: 'wilderness', hinted: hp.hinted() });
        if (ok) { G.sfx('good'); close(true); } else { G.sfx('bad'); e.currentTarget.classList.add('wrong'); hp.box.hidden = false; hp.box.lastChild.textContent = G.edu.explain(sign.skill); }
      } }, o))), hp.btn);
  }, { icon: '🪧' });
}

// ------------------------------------------------------------------------------------ Chapter 2: needs vs wants + first budget
export async function needsWants(G) {
  await teach(G, 'fin.needs', 'Mr. Okafor');
  const items = shuffle([['Groceries', true, '🥫'], ['Rent', true, '🏠'], ['Work shoes', true, '👟'], ['Phone bill', true, '📱'],
    ['Designer hoodie', false, '🧥'], ['Concert ticket', false, '🎟️'], ['Game skin', false, '🎮'], ['Daily latte', false, '☕']]).slice(0, 6);
  return UI.sheet('Needs or wants?', (close) => {
    const left = new Set(items.map((i) => i[0])); let hinted = false, mistakes = 0;
    const hp = helpBox(G, 'fin.needs');
    const rows = items.map(([n, need, ic]) => {
      const row = h('div', { class: 'sortrow' }, h('span', { class: 'f-ic' }, ic), h('b', {}, n),
        h('button', { class: 'ghost sm', onclick: () => choose(true) }, 'Need'), h('button', { class: 'ghost sm', onclick: () => choose(false) }, 'Want'));
      const choose = (asNeed) => {
        if (asNeed === need) { row.classList.add('done'); left.delete(n); G.sfx('good'); if (!left.size) finish(); }
        else { mistakes++; row.classList.add('wrong'); setTimeout(() => row.classList.remove('wrong'), 400); hp.box.hidden = false; G.sfx('bad'); }
      };
      return row;
    });
    const finish = () => { G.edu.record('fin.needs', mistakes === 0, { ctx: 'housing', hinted: hp.hinted() || mistakes > 0 }); close(true); };
    return h('div', { class: 'act' }, h('p', { class: 'lead' }, 'You have about $100. Sort what you must pay for from what can wait.'), hp.box, h('div', { class: 'sortlist' }, rows), hp.btn);
  }, { icon: '🧺', noClose: true });
}

export async function firstBudget(G) {
  await teach(G, 'fin.budget', 'Mr. Okafor');
  const q = 'You have $100. Groceries for the week cost about $25 and your phone bill ($25) is due Day 5. Rent is covered for your first week. How much is left for everything else?';
  forBot('__keyAns', 50);
  return UI.sheet('Your first budget', (close) => {
    const hp = helpBox(G, 'fin.budget');
    const { disp, pad } = keypad((v, reset) => {
      const ok = v === 50; G.edu.record('fin.budget', ok, { ctx: 'housing', hinted: hp.hinted() });
      if (ok) { G.sfx('good'); G.state.stats.budgetsPlanned = (G.state.stats.budgetsPlanned || 0) + 1; close(true); }
      else { G.sfx('bad'); hp.box.hidden = false; UI.toast('Start with $100. Take away each must-pay amount.', 'warn', 3500); reset(); }
    });
    return h('div', { class: 'act' }, h('div', { class: 'budget' }, h('div', {}, h('small', {}, 'MONEY'), h('b', {}, '$100')), h('div', {}, h('small', {}, 'GROCERIES'), h('b', { class: 'neg' }, '−$25')), h('div', {}, h('small', {}, 'PHONE'), h('b', { class: 'neg' }, '−$25'))),
      h('p', { class: 'lead' }, q), hp.box, disp, pad, hp.btn);
  }, { icon: '📝', noClose: true });
}

// ------------------------------------------------------------------------------------ Chapter 3: application + interview (Fresh Mart)
export function jobApplication(G) {
  return UI.sheet('Fresh Mart application', (close, body) => {
    const step = (n) => { body.replaceChildren(steps[n]()); };
    const steps = [
      () => {
        G.edu.discover('read.main');
        const hp = helpBox(G, 'read.main');
        return h('div', { class: 'act' },
          h('div', { class: 'posting' }, h('b', {}, 'NOW HIRING: CASHIER'), h('p', {}, 'Fresh Mart is looking for a friendly, reliable cashier. You will scan groceries, make change, stock shelves and help customers find what they need. No experience required. We train you. $15/hour, 4-hour shifts.')),
          h('p', { class: 'lead' }, 'What is the main idea of this posting?'), hp.box,
          h('div', { class: 'opts' }, shuffle([['Fresh Mart is hiring a cashier and will train you', true], ['Fresh Mart sells cheap groceries', false], ['You need experience to work here', false]]).map(([t, ok]) =>
            h('button', { class: 'opt', onclick: (e) => { G.edu.record('read.main', ok, { ctx: 'application', hinted: hp.hinted() }); if (ok) { G.sfx('good'); step(1); } else { G.sfx('bad'); e.currentTarget.classList.add('wrong'); hp.box.hidden = false; } } }, t))), hp.btn);
      },
      () => {
        G.edu.discover('write.forms');
        const hp = helpBox(G, 'write.forms');
        const fields = [['Name', [G.state.name, 'me', 'a REAL'], G.state.name], ['Available', ['Mornings and weekends', 'whenever lol', '???'], 'Mornings and weekends'], ['Why should we hire you?', ['I am reliable and I learn quickly.', 'i need money', 'Because.'], 'I am reliable and I learn quickly.']];
        let i = 0; const wrap = h('div', { class: 'act' });
        const render = () => {
          const [label, opts, good] = fields[i];
          wrap.replaceChildren(h('p', { class: 'lead' }, `Application form · ${i + 1}/3`), h('div', { class: 'formrow' }, h('small', {}, label.toUpperCase()), h('div', { class: 'formbox' }, '…')), hp.box,
            h('div', { class: 'opts' }, shuffle(opts).map((o) => h('button', { class: 'opt', onclick: (e) => {
              const ok = o === good; G.edu.record(i === 2 ? 'write.sentences' : 'write.forms', ok, { ctx: 'application', hinted: hp.hinted() });
              if (ok) { G.sfx('good'); i++; if (i < fields.length) render(); else step(2); } else { G.sfx('bad'); e.currentTarget.classList.add('wrong'); hp.box.hidden = false; }
            } }, o))), hp.btn);
        };
        render(); return wrap;
      },
      () => {
        const holder = h('div', { class: 'act' }, h('p', { class: 'lead' }, 'Loading the signature card…'));
        const ready = document.fonts && document.fonts.load ? document.fonts.load('80px "Dancing Script"') : Promise.resolve();
        Promise.race([ready, wait(2500)]).then(() => holder.replaceWith(cursivePad(G, G.state.name, 'curs.signature', 'Sign your application in cursive. Trace your name with your finger.', () => close(true))));
        return holder;
      },
    ];
    step(0);
    return h('div');
  }, { icon: '📝' });
}

export async function interview(G) {
  const R = 'Rosa · Manager';
  const qs = [
    ['A customer says they were charged twice. What do you do?', ['Listen, check the receipt, and fix it or get help', 'Tell them it’s not my problem', 'Ignore them and keep scanning'], 0, 'think.consequence',
      ['When you work the register, the customer’s problem is your problem. Brushing them off loses a customer, and they tell their friends.', 'Ignoring someone makes them angrier, and the double charge is still there. Problems don’t fix themselves.'],
      'A good worker listens, checks the facts, and fixes it or asks for help.'],
    ['Your shift starts at 9:00. The bus is late and you’ll arrive at 9:10. What’s best?', ['Message the manager before 9:00 to let them know', 'Show up and say nothing', 'Skip the shift'], 0, 'think.consequence',
      ['If you say nothing, I don’t know if you’re coming. I can’t plan the shift. A quick message builds trust.', 'Skipping a whole shift because you’re 10 minutes late leaves the team short. Late and honest beats missing.'],
      'Telling your manager early lets them plan. That’s what reliable people do.'],
    ['Why do you want this job?', ['To earn my own money and learn real skills', 'My old life ended and I have to', 'Honestly, I don’t'], 0, 'think.compare',
      ['That may be true, but it’s about your past. Tell me what you want to build. Bosses hire people who look ahead.', 'Honesty is good, but a manager wants to hear why you’d show up and try. Find one real reason.'],
      'Connecting the job to your goals shows you’ll stick with it.'],
  ];
  await UI.say(R, `Thanks for applying, ${G.state.name}. I don’t care where you come from. I care whether you show up and do the work. A few questions.`);
  let good = 0;
  for (const [q, opts, ans, skill, whyNot, whyYes] of qs) {
    G.edu.discover(skill);
    const order = shuffle(opts.map((o, i) => [o, i]));
    const c = await UI.say(R, q, order.map((x) => x[0]));
    const ok = order[c][1] === ans;
    G.edu.record(skill, ok, { ctx: 'interview' });
    if (ok) good++;
    if (ok) await UI.say(R, pick(['Good answer. ', 'That’s what I like to hear. ', 'Exactly. ']) + whyYes);
    else { const wi = order[c][1] - 1; await UI.say(R, 'Hmm, not quite. ' + whyNot[wi]); await UI.say(R, 'The best answer: “' + opts[ans] + '.” ' + whyYes); }
  }
  await UI.say(R, good >= 2 ? 'You’re hired. Cashier, $15 an hour, four-hour shifts. Clock in at the time clock in the back room when you’re ready.' : 'You’ve got a lot to learn, but so did I. You’re hired. We’ll train you. Clock in at the back when you’re ready.');
  return true;
}

/** Cursive tracing pad (signature, letter practice). Builds up step by step: each letter on its own first,
 *  then the whole word joined. (A sentence goes word by word, then the whole sentence.) */
export function cursivePad(G, text, skill, prompt, done, opts = {}) {
  const PRINT = opts.style === 'print';
  G.edu.discover(skill);
  text = String(text || '').trim() || 'a';
  const sentence = /\s/.test(text);
  const parts = sentence ? text.split(/\s+/) : [...text];
  const steps = parts.length > 1 ? [...parts.map((t, i) => ({ t, i, final: false })), { t: text, final: true }] : [{ t: text, final: true }];
  const wrap = h('div', { class: 'act cursivepad' }, prompt ? h('p', { class: 'lead' }, prompt) : null);
  const strip = h('div', { class: 'cursive-steps', 'aria-label': 'Progress' });
  const stepLbl = h('p', { class: 'tip cursive-steplbl' });
  const holder = h('div', {});
  const hp = helpBox(G, skill); if (!prompt) hp.box.hidden = true;   // inside a learning card the tip is already shown above
  if (steps.length > 1) wrap.append(strip, stepLbl);
  wrap.append(holder, hp.box);
  let k = 0;
  const drawStrip = () => {
    const st = steps[k];
    strip.replaceChildren(...parts.map((t, i) => h('span', { class: st.final ? 'now' : i < st.i ? 'done' : i === st.i ? 'now' : '' }, t)));
    strip.classList.toggle('sentence', sentence);
    stepLbl.textContent = st.final
      ? (PRINT ? `Now the whole ${sentence ? 'sentence' : 'word'}: trace “${text}”. ${sentence ? 'Leave a finger space between words.' : 'Keep the letters close together.'}` : `Now join them! Trace the whole ${sentence ? 'sentence' : 'word'} “${text}” in one smooth line.`)
      : `${sentence ? 'Word' : 'Letter'} ${st.i + 1} of ${parts.length}: trace “${st.t}”.`;
  };
  const show = () => {
    const st = steps[k]; if (steps.length > 1) drawStrip();
    holder.replaceChildren(tracer(st.t, st.final, () => {
      if (st.final) { G.sfx('good'); G.state.stats.cursive = (G.state.stats.cursive || 0) + 1; done(); return; }
      G.sfx('click'); UI.toast(k + 1 === steps.length - 1 ? `✓ “${st.t}”. Now the whole ${sentence ? 'sentence' : 'word'}!` : `✓ “${st.t}”`, 'good', 1400);
      k++; show();
    }));
  };
  const tracer = (t, final, ok) => {
    const cv = h('canvas', { class: 'sig', width: 640, height: 220, 'data-text': t, 'data-final': final ? '1' : '0' });
    const guide = document.createElement('canvas'); guide.width = 640; guide.height = 220;
    const gg = guide.getContext('2d');
    const fit = t.length === 1 ? 150 : Math.min(110, 560 / Math.max(3, t.length * 0.55));
    cv.dataset.fit = String(fit);
    const font = PRINT ? `${fit}px "Andika", "Comic Sans MS", sans-serif` : `${fit}px "Dancing Script", "Segoe Script", cursive`;
    const drawTarget = () => { gg.clearRect(0, 0, 640, 220); gg.font = font; gg.textAlign = 'center'; gg.textBaseline = 'middle'; gg.lineWidth = 26; gg.lineJoin = 'round'; gg.strokeStyle = '#000'; gg.strokeText(t, 320, 115); gg.fillText(t, 320, 115); };
    drawTarget();
    const g = cv.getContext('2d');
    // the cursive font may still be loading: redraw the gold letters in cursive as soon as it arrives
    if (document.fonts && document.fonts.load) document.fonts.load(PRINT ? `${fit}px "Andika"` : `${fit}px "Dancing Script"`).then(() => { if (!cv.isConnected && !holder.isConnected) return; drawTarget(); if (!inked) drawGuide(); }).catch(() => {});
    let inked = false;
    const drawGuide = () => { g.clearRect(0, 0, 640, 220); if (PRINT && t.length === 1) { const w = g.measureText ? (g.font = font, g.measureText(t).width) : fit * 0.5, x0 = 320 - w / 2, top = 115 - fit * 0.42, mid = 115 - fit * 0.05; const tall = /[bdfhklt]|[A-Z]/.test(t), magic = /[cadgqoes]|[CGOQ]/.test(t), sx = magic ? x0 + w * 0.8 : /[f]/.test(t) ? x0 + w * 0.75 : x0 + w * 0.2, sy = tall && !/[d]/.test(t) ? top : mid; g.save(); g.fillStyle = '#2fbf71'; g.beginPath(); g.arc(sx, sy, 9, 0, Math.PI * 2); g.fill(); g.font = '600 16px sans-serif'; g.fillText('start', sx + 14, sy - 10); g.restore(); }
      if (PRINT) { g.save(); g.strokeStyle = 'rgba(120,160,255,.45)'; g.lineWidth = 2; for (const [y, dash] of [[115 - fit * 0.42, []], [115 - fit * 0.05, [10, 10]], [115 + fit * 0.3, []]]) { g.setLineDash(dash); g.beginPath(); g.moveTo(16, y); g.lineTo(624, y); g.stroke(); } g.restore(); } g.font = gg.font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(233,169,58,.32)'; g.fillText(t, 320, 115); g.strokeStyle = 'rgba(233,169,58,.15)'; g.lineWidth = 1; g.beginPath(); g.moveTo(40, 160); g.lineTo(600, 160); g.stroke(); };
    drawGuide();
    const ink = document.createElement('canvas'); ink.width = 640; ink.height = 220; const ig = ink.getContext('2d');
    let drawing = false, last = null;
    const pos = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * 640 / r.width, (e.clientY - r.top) * 220 / r.height]; };
    cv.addEventListener('pointerdown', (e) => { drawing = true; last = pos(e); try { cv.setPointerCapture(e.pointerId); } catch (x) {} e.preventDefault(); });
    cv.addEventListener('pointermove', (e) => {
      if (!drawing) return; const p = pos(e); inked = true;
      for (const c of [g, ig]) { c.strokeStyle = c === g ? '#f4ead7' : '#000'; c.lineWidth = c === g ? 5 : 28; c.lineCap = 'round'; c.beginPath(); c.moveTo(...last); c.lineTo(...p); c.stroke(); }
      last = p;
    });
    cv.addEventListener('pointerup', () => { drawing = false; });
    const score = () => {
      const a = gg.getImageData(0, 0, 640, 220).data, b = ig.getImageData(0, 0, 640, 220).data;
      let tot = 0, hit = 0, stray = 0;
      for (let i = 3; i < a.length; i += 16) { if (a[i] > 0) { tot++; if (b[i] > 0) hit++; } else if (b[i] > 0) stray++; }
      return { cover: hit / Math.max(1, tot), stray: stray / Math.max(1, tot) };
    };
    return h('div', {}, cv, h('div', { class: 'row' }, hp.btn,
      h('button', { class: 'ghost', onclick: () => { inked = false; drawGuide(); ig.clearRect(0, 0, 640, 220); } }, 'Clear'),
      h('button', { class: 'primary', onclick: () => {
        const s = score(); const good = s.cover > 0.42 && s.stray < 1.2;
        // the skill is recorded once, on the whole word; single letters are warm-up steps
        if (final) G.edu.record(skill, good, { ctx: skill === 'curs.signature' ? 'application' : 'practice', hinted: hp.hinted() });
        if (good) ok();
        else { G.sfx('bad'); hp.box.hidden = false; UI.toast(s.cover <= 0.42 ? (final ? (PRINT ? 'Follow the gold letters more closely. Start at the top.' : 'Follow the gold letters more closely. Cursive letters connect.') : 'Follow the gold letter more closely.') : 'Try to stay on the letters.', 'warn'); }
      } }, final ? 'Done' : 'Next ›')));
  };
  show();
  return wrap;
}

// ------------------------------------------------------------------------------------ Fresh Mart: clock in (time)
export async function clockIn(G) {
  await teach(G, 'math.time', 'Rosa');
  const early = pick([3, 5, 8, 10, 12, 15]);
  const shown = `8:${String(60 - early).padStart(2, '0')}`;
  const opts = shuffle([...new Set([early, early + 10, early + 5, Math.max(1, early - 2)])]);
  return UI.sheet('Time clock', (close) => {
    const hp = helpBox(G, 'math.time');
    return h('div', { class: 'act' },
      h('div', { class: 'clockface' }, shown, h('small', {}, 'AM')),
      h('p', { class: 'lead' }, `Your shift starts at 9:00 AM. The clock says ${shown}. How many minutes early are you?`), hp.box,
      h('div', { class: 'opts grid2' }, opts.map((v) => h('button', { class: 'opt', onclick: (e) => {
        const ok = v === early; G.edu.record('math.time', ok, { ctx: 'timeclock', hinted: hp.hinted() });
        if (ok) { G.sfx('good'); close(true); } else { G.sfx('bad'); e.currentTarget.classList.add('wrong'); hp.box.hidden = false; }
      } }, `${v} minutes`))), hp.btn);
  }, { icon: '⏱️' });
}

// ------------------------------------------------------------------------------------ Register: total, then make change (adaptive)
const GROCERIES = [['Milk', 3.49, '🥛'], ['Bread', 2.49, '🍞'], ['Apples', 2.99, '🍎'], ['Eggs', 3.79, '🥚'], ['Rice', 1.89, '🍚'], ['Star Bites', 4.29, '⭐'],
  ['Pasta', 1.59, '🍝'], ['Bananas', 1.29, '🍌'], ['Cheese', 4.59, '🧀'], ['Juice', 3.25, '🧃'], ['Yogurt', 0.99, '🥣'], ['Soup', 1.75, '🥫'], ['Tomatoes', 2.19, '🍅']];

export async function register(G) {
  const E = G.edu;
  const whole = E.state('math.add') < 3;                       // Foundation: whole dollars (e.g. $4 + $6 + $3)
  const addSkill = whole ? 'math.add' : 'math.decimals';
  const coupon = !whole && E.state('math.decimals') >= 3 && E.state('math.change') >= 3 && Math.random() < 0.5;
  await teach(G, addSkill, 'Rosa');
  const n = whole ? 3 : ri(3, 4);
  const items = shuffle(GROCERIES).slice(0, n).map(([name, p, ic]) => [name, whole ? ri(2, 9) : p, ic]);
  const sub = items.reduce((s, i) => s + cents(i[1]), 0) / 100;
  const total = coupon ? Math.round(sub * 0.9 * 100) / 100 : sub;
  const customer = pick(['a tired dad', 'a student', 'a nurse after a night shift', 'an older neighbor', 'a delivery driver', 'a parent with a toddler']);
  return UI.sheet('Register 1', (close, body) => {
    // Step 1: scan, then work out the total (the register is "in training mode": it shows the prices, you add them)
    let scanned = 0;
    const list = h('div', { class: 'receipt' });
    const belt = h('div', { class: 'belt' }, items.map((it) => h('button', { class: 'item', onclick: (e) => {
      e.currentTarget.disabled = true; e.currentTarget.classList.add('gone'); G.sfx('scan'); scanned++;
      list.append(h('div', { class: 'rline' }, h('span', {}, it[0]), h('span', {}, money(it[1]))));
      if (scanned === items.length) setTimeout(totalStep, 350);
    } }, h('span', { class: 'item-ic' }, it[2]), h('small', {}, it[0]), h('small', { class: 'price' }, money(it[1])))));
    const totalStep = async () => {
      if (coupon) await teach(G, 'math.percent', 'Rosa');
      const skill = coupon ? 'math.percent' : addSkill;
      forBot('__keyAns', total);
      const hp = helpBox(G, skill);
      const { disp, pad } = keypad((v, reset) => {
        const ok = Math.abs(v - total) < 0.005;
        G.edu.record(skill, ok, { ctx: 'register', hinted: hp.hinted() });
        if (ok) { G.sfx('good'); changeStep(); }
        else { G.sfx('bad'); hp.box.hidden = false; hp.box.lastChild.textContent = G.edu.explain(skill); G.state.stats.mistakes++; UI.toast(coupon ? `Subtotal ${money(sub)}. Take 10% off: find 10% by moving the decimal one place, round it to the nearest cent, then subtract.` : 'Add the prices on the receipt one at a time.', 'warn', 3600); reset(); }
      }, { decimals: !whole });
      body.replaceChildren(h('div', { class: 'act' }, list.cloneNode(true),
        coupon ? h('div', { class: 'coupon' }, '🏷️ Customer has a 10% OFF coupon') : null,
        h('p', { class: 'lead' }, coupon ? 'Training mode: work out the total after the 10% coupon (round the discount to the nearest cent).' : 'Training mode: the register shows the prices. What is the total?'), hp.box, disp, pad, hp.btn));
    };
    const changeStep = async () => {
      await teach(G, 'math.change', 'Rosa');
      const notes = [5, 10, 20, 50].filter((v) => v > total);
      const paid = notes.length ? (whole ? notes[0] : pick(notes.slice(0, 2))) : Math.ceil(total / 10) * 10 + 10;   // always more than the total
      const change = Math.round((paid - total) * 100) / 100; forBot('__change', change);
      const hp = helpBox(G, 'math.change');
      const tray = whole ? [10, 5, 1] : [20, 10, 5, 1, 0.25, 0.1, 0.05, 0.01];
      let given = 0;
      const changeEl = h('b', { class: 'chg' }, money(0)); const givenList = h('div', { class: 'given' });
      body.replaceChildren(h('div', { class: 'act' },
        h('div', { class: 'math-card' }, h('div', { class: 'mc-head' }, '🛒 MAKE CHANGE'),
          h('p', {}, `The total is ${money(total)}. ${customer[0].toUpperCase() + customer.slice(1)} pays with ${money(paid)}.`),
          h('p', { class: 'q' }, 'Count back the change from the cash drawer.')),
        hp.box,
        h('div', { class: 'given-row' }, h('span', {}, 'Change: '), changeEl, givenList),
        h('div', { class: 'tray' }, tray.map((v) => h('button', { class: 'cash ' + (v >= 1 ? 'bill' : 'coin'), onclick: () => {
          G.sfx('coin'); given = Math.round((given + v) * 100) / 100; changeEl.textContent = money(given);
          givenList.append(h('span', { class: 'chip' }, v >= 1 ? `$${v}` : `${Math.round(v * 100)}¢`));
        } }, v >= 1 ? `$${v}` : `${Math.round(v * 100)}¢`))),
        h('div', { class: 'row' }, hp.btn,
          h('button', { class: 'ghost', onclick: () => { given = 0; changeEl.textContent = money(0); givenList.replaceChildren(); } }, 'Reset'),
          h('button', { class: 'primary', onclick: () => {
            const ok = Math.abs(given - change) < 0.001;
            G.edu.record('math.change', ok, { ctx: 'register', hinted: hp.hinted() });
            if (ok) { G.sfx('cash'); close({ ok: true, change }); }
            else { G.sfx('bad'); G.state.stats.mistakes++; hp.box.hidden = false; hp.box.lastChild.textContent = G.edu.explain('math.change'); UI.toast(given > change ? `That's too much. The change should be less than ${money(given)}.` : `Not enough yet. Keep counting up to ${money(paid)}.`, 'warn', 3200); }
          } }, 'Give change'))));
    };
    return h('div', { class: 'act' }, h('p', { class: 'lead' }, `Customer: ${customer}. Tap each item to scan it.`), belt, list);
  }, { icon: '🧾', cls: 'wide' });
}

// ------------------------------------------------------------------------------------ Stocking: read the signs (spatial reading)
export const AISLES = ['BREAD & CEREAL', 'CANNED GOODS', 'PASTA & RICE', 'SNACKS', 'HOUSEHOLD'];
export const PRODUCTS = [
  ['Oat Cereal', 1, '🥣'], ['Whole Wheat Bread', 1, '🍞'], ['Bagels', 1, '🥯'], ['Tomato Soup', 2, '🥫'], ['Black Beans', 2, '🥫'], ['Canned Peaches', 2, '🍑'],
  ['Spaghetti', 3, '🍝'], ['Brown Rice', 3, '🍚'], ['Macaroni', 3, '🧀'], ['Pretzels', 4, '🥨'], ['Granola Bars', 4, '🍫'], ['Popcorn', 4, '🍿'],
  ['Dish Soap', 5, '🧴'], ['Paper Towels', 5, '🧻'], ['Sponges', 5, '🧽'],
];
export function stockCheck(G, product, aisle) {
  const ok = product[1] === aisle;
  G.edu.record('read.signs', ok, { ctx: 'freshmart' });
  if (ok) { G.sfx('good'); return true; }
  G.sfx('bad'); UI.toast(`This is aisle ${aisle}: ${AISLES[aisle - 1]}. Where would ${product[0]} go? Read the hanging signs.`, 'warn', 4200);
  return false;
}

// ------------------------------------------------------------------------------------ Inventory: count → multiply → fractions
export async function inventory(G) {
  const E = G.edu;
  const skill = E.state('math.count') < 3 ? 'math.count' : (E.state('math.multiply') < 3 || E.state('math.fractions') === 0 && Math.random() < 0.6) ? 'math.multiply' : 'math.fractions';
  await teach(G, skill, 'Rosa');
  let q, ans, viz;
  if (skill === 'math.count') {
    const rows = ri(2, 4), per = ri(3, 5); ans = rows * per;
    q = `Count the cans on the shelf.`;
    viz = h('div', { class: 'cangrid', style: { gridTemplateColumns: `repeat(${per}, 34px)` } }, [...Array(ans)].map(() => h('span', {}, '🥫')));
  } else if (skill === 'math.multiply') {
    const cases = ri(3, 8), per = pick([6, 10, 12, 24]), loose = ri(0, per - 1); ans = cases * per + loose;
    q = `Count the canned tomatoes: ${cases} cases with ${per} cans each, plus ${loose} loose cans.`;
    viz = h('div', { class: 'cases' }, [...Array(cases)].map(() => h('div', { class: 'case' }, `${per}`)), loose ? h('div', { class: 'loose' }, `+${loose}`) : null);
  } else {
    const total = pick([12, 16, 20, 24, 32]), den = pick([2, 4]); const bad = total / den; ans = total - bad;
    q = `A case of ${total} cans arrived. 1/${den} of them are dented and go back. How many good cans go on the shelf?`;
    viz = h('div', { class: 'cases' }, h('div', { class: 'case wide' }, `${total} cans`), h('div', { class: 'loose' }, `1/${den} dented`));
  }
  forBot('__keyAns', ans);
  return UI.sheet('Stockroom inventory', (close) => {
    const hp = helpBox(G, skill);
    const { disp, pad } = keypad((v, reset) => {
      const ok = v === ans; G.edu.record(skill, ok, { ctx: 'inventory', hinted: hp.hinted() });
      if (ok) { G.sfx('good'); close(true); } else { G.sfx('bad'); hp.box.hidden = false; hp.box.lastChild.textContent = G.edu.explain(skill); reset(); }
    });
    return h('div', { class: 'act' }, h('p', { class: 'lead' }, q), viz, hp.box, disp, pad, hp.btn);
  }, { icon: '📦' });
}

// ------------------------------------------------------------------------------------ Paycheck: gross (you work it out), FICA, net
export async function paystub(G, hours, rate, bonus = 0, employer = 'FRESH MART') {
  await teach(G, 'fin.paycheck', 'Rosa');
  const gross = Math.round((hours * rate + bonus) * 100) / 100;
  const fica = Math.round(gross * 0.0765 * 100) / 100;
  const net = Math.round((gross - fica) * 100) / 100;
  // Apply: the player works out the base pay before seeing the stub
  forBot('__keyAns', hours * rate);
  await UI.sheet('Your hours', (close) => {
    const hp = helpBox(G, 'math.multiply');
    const { disp, pad } = keypad((v, reset) => {
      const ok = v === hours * rate; G.edu.record('math.multiply', ok, { ctx: 'paycheck', hinted: hp.hinted() }); G.edu.record('fin.paycheck', ok, { ctx: 'paycheck', hinted: hp.hinted() });
      if (ok) { G.sfx('good'); close(); } else { G.sfx('bad'); hp.box.hidden = false; reset(); }
    });
    return h('div', { class: 'act' }, h('p', { class: 'lead' }, `You worked ${hours} hours at ${money(rate)} an hour. How much did you earn before deductions?`), hp.box, disp, pad, hp.btn);
  }, { icon: '🧮', noClose: true });
  return UI.sheet('Pay stub', (close) => h('div', { class: 'act stub' },
    h('div', { class: 'stub-head' }, h('b', {}, employer), h('small', {}, `Day ${G.state.day} · ${G.state.name}`)),
    h('div', { class: 'rline' }, h('span', {}, `${hours} hours × ${money(rate)}`), h('span', {}, money(hours * rate))),
    bonus ? h('div', { class: 'rline' }, h('span', {}, bonus >= 5 ? 'Accuracy bonus / tips' : 'Tips'), h('span', {}, money(bonus))) : null,
    h('div', { class: 'rline strong' }, h('span', {}, 'Gross pay'), h('span', {}, money(gross))),
    h('div', { class: 'rline minus' }, h('span', {}, 'Social Security + Medicare (7.65%)'), h('span', {}, '−' + money(fica))),
    h('div', { class: 'rline net' }, h('span', {}, 'Net pay (what you keep)'), h('span', {}, money(net))),
    h('p', { class: 'tip' }, 'Gross pay is what you earn. Net pay is what lands in your bank after taxes. Always budget with net pay.'),
    h('button', { class: 'primary', onclick: () => { G.sfx('cash'); close(net); } }, `Deposit ${money(net)}`)), { icon: '💵', noClose: true });
}

// ------------------------------------------------------------------------------------ Groceries on a budget
export const FOODS = [
  { id: 'noodles', name: 'Instant noodles', price: 0.99, meals: 1, food: 25, icon: '🍜', note: 'Cheap but not very filling' },
  { id: 'pasta', name: 'Pasta + sauce', price: 3.49, meals: 3, food: 45, icon: '🍝', note: 'Three meals' },
  { id: 'eggs', name: 'Eggs (12)', price: 3.79, meals: 4, food: 40, icon: '🥚', note: 'Four breakfasts' },
  { id: 'apples', name: 'Apples (6)', price: 2.99, meals: 3, food: 25, icon: '🍎', note: 'Healthy snack' },
  { id: 'rice', name: 'Rice & beans', price: 2.89, meals: 4, food: 45, icon: '🍚', note: 'Best value' },
  { id: 'cereal', name: 'Star Bites cereal', price: 4.29, meals: 4, food: 30, icon: '⭐', note: 'Sweet, low protein' },
];
export async function shop(G) {
  await teach(G, 'fin.budget', 'Fresh Mart');
  const cart = {};
  return UI.sheet('Fresh Mart groceries', (close) => {
    const totalEl = h('b', {}, money(0)); const perMeal = h('small', {});
    const recalc = () => {
      const t = Object.entries(cart).reduce((s, [id, q]) => s + FOODS.find((f) => f.id === id).price * q, 0);
      const meals = Object.entries(cart).reduce((s, [id, q]) => s + FOODS.find((f) => f.id === id).meals * q, 0);
      totalEl.textContent = money(t); perMeal.textContent = meals ? `${meals} meals · ${money(t / meals)} per meal` : '';
      return { t, meals };
    };
    return h('div', { class: 'act' },
      h('p', { class: 'lead' }, `You have ${money(G.state.money)}. Compare the price per meal before you buy.`),
      h('div', { class: 'shelf' }, FOODS.map((f) => {
        const q = h('span', { class: 'qty' }, '0');
        return h('div', { class: 'food' }, h('span', { class: 'f-ic' }, f.icon), h('div', { class: 'f-txt' }, h('b', {}, f.name), h('small', {}, `${money(f.price)} · ${f.note}`), h('small', { class: 'unit' }, `${money(f.price / f.meals)} per meal`)),
          h('div', { class: 'stepper' }, h('button', { 'aria-label': 'Remove one', onclick: () => { cart[f.id] = Math.max(0, (cart[f.id] || 0) - 1); q.textContent = cart[f.id]; recalc(); } }, '−'), q,
            h('button', { 'aria-label': 'Add one', onclick: () => { cart[f.id] = (cart[f.id] || 0) + 1; q.textContent = cart[f.id]; G.sfx('click'); recalc(); } }, '+')));
      })),
      h('div', { class: 'checkout' }, h('div', {}, 'Total ', totalEl, h('br'), perMeal),
        h('button', { class: 'primary', onclick: () => {
          const { t, meals } = recalc();
          if (t === 0) return close(false);
          if (t > G.state.money) { G.sfx('bad'); UI.toast('Not enough money. Take something out of the cart.', 'warn'); return; }
          for (const [id, q] of Object.entries(cart)) G.state.pantry[id] = (G.state.pantry[id] || 0) + q * FOODS.find((f) => f.id === id).meals;
          G.spend(t, 'Fresh Mart groceries');
          G.edu.record('fin.budget', t / meals < 1.2 && G.state.money > 0, { ctx: 'groceries' });
          G.sfx('cash'); close(true);
        } }, 'Pay')));
  }, { icon: '🛒', cls: 'wide' });
}

// ------------------------------------------------------------------------------------ Eat (+ cooking fractions)
export function eat(G) {
  return UI.sheet('Kitchen', (close) => {
    const have = FOODS.filter((f) => (G.state.pantry[f.id] || 0) > 0);
    if (!have.length) return h('div', { class: 'act center' }, h('p', {}, 'Your fridge is empty. Buy groceries at Fresh Mart, or grab food at the Main St Diner.'), h('button', { class: 'primary', onclick: () => close(false) }, 'OK'));
    return h('div', { class: 'act' }, h('p', { class: 'lead' }, 'What will you make?'),
      h('div', { class: 'shelf' }, have.map((f) => h('button', { class: 'food btn', onclick: () => {
        if (f.id === 'rice' || f.id === 'pasta') return cook(G, f).then(close);
        G.state.pantry[f.id]--; G.feed(f.food); G.state.stats.mealsEaten = (G.state.stats.mealsEaten || 0) + 1; G.sfx('good'); close(true);
      } }, h('span', { class: 'f-ic' }, f.icon), h('div', { class: 'f-txt' }, h('b', {}, f.name), h('small', {}, `${G.state.pantry[f.id]} meals left · +${f.food} food${f.id === 'rice' || f.id === 'pasta' ? ' · cook it' : ''}`))))));
  }, { icon: '🍳' });
}
async function cook(G, f) {
  await teach(G, 'math.fractions', 'Recipe card');
  const v = pick([
    { q: 'The recipe makes 4 servings and uses 1 cup of rice. You’re cooking 2 servings. How much rice?', a: '½ cup', o: ['½ cup', '2 cups', '¼ cup', '1 cup'] },
    { q: 'The recipe serves 2 and needs ¾ cup of pasta. You’re cooking for 4. How much pasta?', a: '1½ cups', o: ['1½ cups', '¾ cup', '3 cups', '1 cup'] },
    { q: 'You need 2 cups of water but only have a ½-cup scoop. How many scoops?', a: '4 scoops', o: ['4 scoops', '2 scoops', '3 scoops', '1 scoop'] },
  ]);
  return UI.sheet('Cook it right', (close) => {
    const hp = helpBox(G, 'math.fractions');
    return h('div', { class: 'act' }, h('div', { class: 'recipe' }, h('b', {}, '📜 Grandma’s recipe card'), h('p', { class: 'cursive' }, f.id === 'rice' ? 'Rice & beans — feeds four' : 'Pasta night — feeds two')),
      h('p', { class: 'lead' }, v.q), hp.box,
      h('div', { class: 'opts grid2' }, shuffle(v.o).map((o) => h('button', { class: 'opt', onclick: (e) => {
        const ok = o === v.a; G.edu.record('math.fractions', ok, { ctx: 'kitchen', hinted: hp.hinted() });
        if (ok) { G.sfx('good'); G.state.pantry[f.id]--; G.feed(f.food + 15); G.state.stats.mealsCooked = (G.state.stats.mealsCooked || 0) + 1; G.achieve('cook'); UI.toast('Home-cooked. +15 extra food.', 'good'); close(true); }
        else { G.sfx('bad'); e.currentTarget.classList.add('wrong'); hp.box.hidden = false; hp.box.lastChild.textContent = G.edu.explain('math.fractions'); }
      } }, o))), hp.btn);
  }, { icon: '🥘' });
}

// ------------------------------------------------------------------------------------ Bills & budget
export function bills(G) {
  return UI.sheet('Bills', (close, body) => {
    const render = () => {
      const s = G.state, due = s.bills.filter((b) => !b.paid);
      const upcoming = due.reduce((t, b) => t + b.amount, 0);
      body.replaceChildren(h('div', { class: 'act' },
        h('div', { class: 'budget' },
          h('div', {}, h('small', {}, 'BANK BALANCE'), h('b', {}, money(s.money))),
          h('div', {}, h('small', {}, 'BILLS DUE'), h('b', { class: upcoming > s.money ? 'neg' : '' }, money(upcoming))),
          h('div', {}, h('small', {}, 'AFTER BILLS'), h('b', { class: s.money - upcoming < 0 ? 'neg' : 'pos' }, money(s.money - upcoming)))),
        due.length ? null : h('p', { class: 'tip' }, 'All paid. Anything left over can go to savings.'),
        h('div', { class: 'bill-list' }, s.bills.map((b) => h('div', { class: 'bill' + (b.paid ? ' paid' : b.due < s.day ? ' late' : '') },
          h('div', {}, h('b', {}, b.name), h('small', {}, b.paid ? 'Paid' : b.due < s.day ? `Overdue since Day ${b.due}` : `Due Day ${b.due}`)),
          h('span', { class: 'amt' }, money(b.amount)),
          b.paid ? h('span', { class: 'ok' }, '✓') : h('button', { class: 'primary sm', onclick: () => {
            if (s.money < b.amount) { G.sfx('bad'); UI.toast('Not enough in your account yet. Work another shift first.', 'warn'); return; }
            b.paid = true; G.spend(b.amount, b.name); G.edu.record('fin.bills', b.due >= s.day, { ctx: 'bills' });
            if (b.due >= s.day) { s.stats.billsOnTime = (s.stats.billsOnTime || 0) + 1; if (b.id.startsWith('rent')) { s.stats.rentPaidSelf = (s.stats.rentPaidSelf || 0) + 1; G.achieve('rent_on_time'); } }
            G.sfx('cash'); render();
          } }, 'Pay')))),
        h('p', { class: 'tip' }, '50/30/20 rule: about half your take-home pay for needs (rent, food, bills), 30% for wants, and 20% for savings.')));
    };
    render();
    return h('div');
  }, { icon: '🧾' });
}

// ------------------------------------------------------------------------------------ Learn app: private mastery + contextual practice
export const PRACTICE = {
  'math.add': () => { const a = [ri(2, 9), ri(2, 9), ri(2, 9)]; return { q: `At the farmers market: tomatoes $${a[0]}, bread $${a[1]}, honey $${a[2]}. Total?`, a: '$' + (a[0] + a[1] + a[2]), o: [a[0] + a[1] + a[2], a[0] + a[1] + a[2] + 1, a[0] + a[1], a[0] + a[1] + a[2] - 2].map((v) => '$' + v) }; },
  'math.sub': () => { const a = ri(20, 60), b = ri(3, 19); return { q: `You have $${a}. A bus pass costs $${b}. What's left?`, a: '$' + (a - b), o: [a - b, a + b, a - b + 1, b].map((v) => '$' + v) }; },
  'math.decimals': () => { const a = ri(120, 899) / 100, b = ri(120, 899) / 100; return { q: `Coffee ${money(a)} and a bagel ${money(b)}. Total?`, a: money(a + b), o: [a + b, a + b + 1, a + b - 0.1, Math.floor(a + b)].map(money) }; },
  'math.change': () => { const t = ri(110, 1890) / 100; const p = t < 10 ? 10 : 20; return { q: `The total is ${money(t)}. The customer pays ${money(p)}. Change?`, a: money(p - t), o: [p - t, p - t + 1, p - t - 0.1, p - Math.floor(t)].map(money) }; },
  'math.multiply': () => { const a = ri(3, 9), b = pick([6, 8, 12, 15]); return { q: `${a} shifts × $${b * 4} per shift = ?`, a: '$' + a * b * 4, o: [a * b * 4, (a + 1) * b * 4, a * b * 4 + b, a + b * 4].map((v) => '$' + v) }; },
  'math.time': () => { const m = pick([15, 20, 35, 45]); return { q: `The bus leaves at 8:${String(m).padStart(2, '0')}. It's 8:00. How long do you have?`, a: `${m} minutes`, o: [m, m + 10, 60 - m, m - 5].map((v) => `${v} minutes`) }; },
  'math.fractions': () => ({ q: 'A pizza has 8 slices. You eat 1/4 of it. How many slices?', a: '2 slices', o: ['2 slices', '4 slices', '1 slice', '3 slices'] }),
  'math.percent': () => { const p = pick([40, 48, 60, 80, 120]); return { q: `A $${p} jacket is 25% off. Sale price?`, a: '$' + p * 0.75, o: [p * 0.75, p * 0.25, p - 25, p * 0.8].map((v) => '$' + v), why: `25% = one quarter. $${p} ÷ 4 = $${p / 4} off, so $${p} − $${p / 4} = $${p * 0.75}.` }; },
  'read.signs': () => ({ q: 'A sign says “AISLE 3 — PASTA & RICE ←”. Where is the brown rice?', a: 'Aisle 3, to the left', o: ['Aisle 3, to the left', 'Aisle 1', 'Behind the counter'] }),
  'read.instructions': () => ({ q: '“1) Wash hands. 2) Put on gloves. 3) Slice bread.” What do you do right after washing your hands?', a: 'Put on gloves', o: ['Put on gloves', 'Slice bread', 'Wash again'] }),
  'read.main': () => ({ q: '“The park cleanup is Saturday at 9. Bring gloves. Snacks provided.” Main idea?', a: 'There is a park cleanup on Saturday', o: ['There is a park cleanup on Saturday', 'Snacks are free', 'You need gloves for everything'] }),
  'read.documents': () => ({ q: 'Lease: “Rent is due on the 1st. A $25 fee applies after the 5th.” You pay on the 4th. Fee?', a: 'No fee', o: ['No fee', '$25 fee', '$5 fee'] }),
  'write.sentences': () => ({ q: 'Which is a complete, correct sentence?', a: 'Their apartment is near the park.', o: ['Their apartment is near the park.', 'there apartment near park', 'Near the park, their.'] }),
  'write.professional': () => ({ q: 'Best way to start a message to your manager?', a: 'Hello Rosa, I wanted to ask about Saturday’s shift.', o: ['Hello Rosa, I wanted to ask about Saturday’s shift.', 'yo rosa whats up with saturday', 'SATURDAY??? Need to talk!!!', 'Hey, so about that Saturday shift thing I have'] }),
  'fin.needs': () => ({ q: 'Which is a need?', a: 'Groceries for the week', o: ['Groceries for the week', 'A second pair of sneakers', 'Concert tickets'] }),
  'fin.budget': () => ({ q: 'You earn $200 this week. Using 50/30/20, how much goes to savings?', a: '$40', o: ['$40', '$100', '$60', '$20'] }),
  'fin.bills': () => ({ q: 'Your phone bill is due Day 5. When is the safest day to pay?', a: 'On or before Day 5', o: ['On or before Day 5', 'On Day 7', 'Whenever you can', 'After Day 5'] }),
  'fin.credit': () => ({ q: 'What is interest on a credit card?', a: 'Extra money you pay for borrowing', o: ['Extra money you pay for borrowing', 'A free bonus for using the card', 'The most you are allowed to spend', 'A fee for opening a new card'] }),
  'think.compare': () => ({ q: 'Diner burger $11.50 (1 meal) vs. rice & beans $2.89 (4 meals). Which costs less per meal?', a: 'Rice & beans', o: ['Rice & beans', 'The burger', 'They’re the same'] }),
  'think.evaluate': () => ({ q: 'An ad says “9 out of 10 people love Star Bites!” What should you ask first?', a: 'Who asked them, and how many people?', o: ['Who asked them, and how many people?', 'What color is the box?', 'Nothing, it must be true'] }),
  'think.opportunity': () => ({ q: 'If you spend $40 on a hoodie, what is the opportunity cost?', a: 'Whatever else that $40 could have paid for', o: ['Whatever else that $40 could have paid for', 'Nothing, since you wanted the hoodie', 'The hoodie itself and its $40 price', 'The $40 plus the tax you paid'] }),
};
/** “Words I know”: every lesson word the learner has tapped and learned. Tap to see them with their meanings. */
function wordsLine(G) {
  const words = G.state.words || [];
  if (!words.length) return h('p', { class: 'tip' }, '📖 Tip: tap any word to hear it and sound it out. Underlined words also show what they mean.');
  return h('button', { class: 'ghost sm', onclick: () => UI.sheet('My Words', () => myWords(G), { icon: '📖' }) }, `📖 My Words: ${words.length}`);
}
/** My Words: every word the player tapped (hear it, sound it out, meaning) and a listening game to practise reading them. */
export function myWords(G) {
  const words = (G.state.words || []).slice().reverse();
  const box = h('div', { class: 'act' });
  const list = () => box.replaceChildren(
    h('p', { class: 'lead' }, words.length ? `You have ${words.length} word${words.length === 1 ? '' : 's'}. Tap one to hear it and sound it out.` : 'Tap any word in the game to hear it. It will be saved here.'),
    h('button', { class: 'primary', onclick: () => box.replaceChildren(h('button', { class: 'ghost sm', onclick: list }, '‹ My Words'), wordPractice(Math.min(3, G.edu.band('reading')))) }, '🎧 Word game: listen and find'),
    h('div', { class: 'wordchips' }, words.map((w) => { const e = lookupWord(w); return h('button', { class: 'wchip', onclick: () => wordCard(w) }, h('b', {}, w), e ? h('small', {}, e.meaning) : null); })));
  list();
  return box;
}
/** Read one whole passage and answer its questions in order. Picks a passage near the reader's level they haven't read lately. */
export async function readPassage(G, id) {
  const s = G.state, done = s.passagesRead || (s.passagesRead = {});
  const P = id ? PASSAGES.find((x) => x.id === id) : (() => { const near = passagesNear(G.edu.band('reading')); return near.sort((a, b) => (done[a.id] || 0) - (done[b.id] || 0))[0]; })();
  if (!P) return;
  let right = 0;
  for (const [i, Q] of P.qs.entries()) {
    const r = await runActivity(G, { type: 'choice', skill: Q.skill, q: `Question ${i + 1} of ${P.qs.length}: ${Q.q}`, a: Q.a, o: [Q.a, ...Q.o], why: Q.why, whyWrong: Q.ww, v: { title: `${P.icon} ${P.title}`, lines: P.text } }, 'reading', P.title, P.icon);
    if (r && r.ok) right++;
    if (r === undefined) break;   // closed the passage
  }
  done[P.id] = (done[P.id] || 0) + 1; s.stats.passages = (s.stats.passages || 0) + 1; G.save();
  UI.toast(`📖 ${P.title}: ${right} of ${P.qs.length} on the first try`, right === P.qs.length ? 'gold' : 'good', 3200);
}
export function learn(G) {
  return UI.sheet('Learn', (close, body) => {
    const menu = () => body.replaceChildren(h('div', { class: 'act' },
      h('p', { class: 'lead' }, 'Your private skill path. It adapts to you. No grades, no timers, only progress.'),
      wordsLine(G),
      h('div', { class: 'cards cats' }, Object.entries(SUBJECTS).map(([k, s]) => {
        const p = G.edu.progress(k);
        return h('button', { class: 'card', onclick: () => subject(k) }, h('span', { class: 'big-emoji' }, s.icon), h('b', {}, s.name),
          h('div', { class: 'bar' }, h('i', { style: { width: p.pct + '%' } })), h('small', {}, `${G.edu.band(k) <= 6 ? 'Now exploring: ' + ['Foundation', 'Beginner Independence', 'Practical Skills', 'Career Development', 'Professional Growth', 'Mastery & Leadership'][G.edu.band(k) - 1] : ''}`));
      }))));
    const subject = (k) => body.replaceChildren(h('div', { class: 'act' },
      h('p', { class: 'tip' }, 'Every skill is open to you. Start anywhere: the game adapts to what you show it.'),
      k === 'reading' ? h('button', { class: 'primary', onclick: () => { close(); readPassage(G); } }, '📖 Read a passage (with questions)') : null,
      h('div', { class: 'skilllist' }, Object.values(SKILLS).filter((s) => s.subj === k).sort((a, b) => a.band - b.band).map((s) =>
        h('button', { class: 'skillrow' + (s.band > G.edu.band(k) + 1 ? ' later' : '') + (s.band === G.edu.band(k) ? ' now' : ''), onclick: () => skill(s.id) }, h('div', {}, h('b', {}, s.name), h('small', {}, s.objective)), stateChip(G, s.id)))),
      h('button', { class: 'ghost', onclick: menu }, '‹ Subjects')));
    const skill = (id) => {
      const sk = SKILLS[id];
      const gen = PRACTICE[id];
      const practice = async () => {
        if (['curs.strokes', 'curs.signature', 'curs.reading'].includes(id)) {
          const word = pick(['fresh', 'grow', 'real', 'learn', G.state.name]);
          body.replaceChildren(cursivePad(G, word, id === 'curs.signature' ? 'curs.signature' : 'curs.strokes', `Trace “${word}” in cursive.`, () => { UI.toast('Beautiful. Keep the letters joined.', 'good'); skill(id); }));
          return;
        }
        if (!gen) { UI.toast('You’ll practise this one out in the world.', 'info'); return; }
        await runActivity(G, () => ({ skill: id, ...gen() }), 'learn', sk.name, SUBJECTS[sk.subj].icon);
        skill(id);
      };
      body.replaceChildren(h('div', { class: 'act' }, h('div', { class: 'lc-subj' }, `${SUBJECTS[sk.subj].icon} ${SUBJECTS[sk.subj].name}`), h('h3', {}, sk.name), stateChip(G, id),
        h('p', { class: 'lead' }, sk.objective), h('div', { class: 'lc-explain' }, sk.explain),
        h('p', { class: 'tip' }, 'Where you’ll use it: ' + (sk.where && sk.where.length ? sk.where.join(' · ') : ({ math: 'the register, paychecks, recipes and inventory.', reading: 'signs, aisle labels, leases and instructions.', writing: 'applications and messages.', cursive: 'signatures and handwritten notes.', finance: 'bills, budgets and groceries.', thinking: 'every choice — especially when Jax is talking.' })[sk.subj])),
        sk.prereq && sk.prereq.length ? h('p', { class: 'tip' }, 'Builds on: ' + sk.prereq.map((p) => SKILLS[p] ? SKILLS[p].name : p).join(', ')) : null,
        h('div', { class: 'row' }, h('button', { class: 'ghost', onclick: () => subject(sk.subj) }, '‹ Skills'), h('button', { class: 'primary', onclick: practice }, 'Practise'))));
    };
    menu();
    return h('div');
  }, { icon: '📚', cls: 'wide' });
}

// ------------------------------------------------------------------------------------ Business plan (Tier 4 preview)
export async function businessPlan(G) {
  await teach(G, 'fin.business', 'Business app');
  const steps = [
    { q: 'Coffee cart idea. Who are your customers? Pick the best research step.', a: 'Count how many people pass the park each morning', o: ['Count how many people pass the park each morning', 'Guess', 'Ask Jax'], skill: 'think.evaluate' },
    { q: 'Startup costs: cart $1,400 + espresso machine $600 + license $50. Total?', a: '$2,050', o: ['$2,050', '$2,000', '$1,450', '$2,500'], skill: 'math.add' },
    { q: 'Each cup sells for $3.50 and costs $1.20 to make. Profit per cup?', a: '$2.30', o: ['$2.30', '$4.70', '$1.20', '$3.50'], skill: 'math.decimals' },
    { q: 'At $2.30 profit per cup, about how many cups to earn back $2,050?', a: 'About 900 cups', o: ['About 900 cups', 'About 90 cups', 'About 9,000 cups'], skill: 'math.multiply' },
  ];
  return UI.sheet('Business plan: coffee cart', (close, body) => {
    let i = 0;
    const render = () => {
      const st = steps[i];
      forBot('__planAns', st.a);
      body.replaceChildren(h('div', { class: 'act' }, h('p', { class: 'tip' }, `Step ${i + 1} of ${steps.length}`), h('p', { class: 'lead' }, st.q),
        h('div', { class: 'opts' }, shuffle(st.o).map((o) => h('button', { class: 'opt', onclick: (e) => {
          const ok = o === st.a; G.edu.record(st.skill, ok, { ctx: 'business' });
          if (ok) { G.sfx('good'); i++; if (i < steps.length) render(); else { G.state.stats.businessSteps = (G.state.stats.businessSteps || 0) + 2; G.edu.record('fin.business', true, { ctx: 'business' }); G.achieve('plan'); close(true); } }
          else { G.sfx('bad'); e.currentTarget.classList.add('wrong'); }
        } }, o)))));
    };
    render(); return h('div');
  }, { icon: '🚀' });
}

export function menuBuy(G, title, icon, items) {
  return UI.sheet(title, (close) => h('div', { class: 'act' },
    h('p', { class: 'lead' }, `Balance ${money(G.state.money)}`),
    h('div', { class: 'shelf' }, items.map((it) => h('button', { class: 'food btn', onclick: () => {
      if (G.state.money < it.price) { G.sfx('bad'); UI.toast('Not enough money.', 'warn'); return; }
      G.spend(it.price, it.name); G.sfx('cash'); it.apply(); close(it);
    } }, h('span', { class: 'f-ic' }, it.icon), h('div', { class: 'f-txt' }, h('b', {}, it.name), h('small', {}, it.note)), h('span', { class: 'amt' }, money(it.price)))))), { icon });
}

export { PASSAGES };
