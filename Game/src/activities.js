// REAL — learning activities. Education lives inside ordinary tasks: work, shopping, bills, applications.
import { h, UI, money, wait } from './ui.js';

const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
const cents = (v) => Math.round(v * 100);

// ------------------------------------------------------------------------------------ Career Center
export const JOBS = [
  { id: 'cashier', title: 'Cashier — Fresh Mart', pay: 12, req: 'No experience needed. Must be friendly and good with numbers. Can start today.', ok: true },
  { id: 'office', title: 'Office Assistant — Opportunity District', pay: 18, req: 'Requires 2 years of office experience and typing 50 words per minute.', ok: false, why: 'You need two years of office experience first.' },
  { id: 'mechanic', title: 'Mechanic Apprentice — Midtown Motors', pay: 15, req: 'Must have a valid driver’s license and own basic tools.', ok: false, why: 'You don’t have a driver’s license yet.' },
  { id: 'barista', title: 'Barista — Daily Grind', pay: 13, req: 'Weekends only. At least one month of customer-service experience.', ok: false, why: 'You need a month of customer-service experience. Working at Fresh Mart will give you that.' },
];

export function jobApplication(G) {
  return UI.sheet('Career Center', (close, body) => {
    const step = (n) => { body.replaceChildren(steps[n]()); };
    const steps = [
      () => h('div', { class: 'act' },
        h('p', { class: 'lead' }, 'Job board. Read each posting. Which job can you apply for today?'),
        h('div', { class: 'cards' }, JOBS.map((j) => h('button', { class: 'card job', onclick: (e) => {
          if (j.ok) { G.sfx('good'); G.xp('reading', 15); step(1); }
          else { G.sfx('bad'); e.currentTarget.classList.add('wrong'); UI.toast(j.why, 'warn', 3600); }
        } }, h('b', {}, j.title), h('span', { class: 'pay' }, `$${j.pay}/hour`), h('small', {}, j.req))))),
      () => {
        const opts = shuffle([
          ['I am a hard worker and I learn quickly.', true],
          ['i is hard worker and learns quick', false],
          ['Me hard working, learn fast.', false],
        ]);
        return h('div', { class: 'act' },
          h('p', { class: 'lead' }, 'Application form: “Why should we hire you?” Pick the sentence you would write on a real application.'),
          h('div', { class: 'opts' }, opts.map(([t, ok]) => h('button', { class: 'opt', onclick: (e) => {
            if (ok) { G.sfx('good'); G.xp('writing', 15); step(2); } else { G.sfx('bad'); e.currentTarget.classList.add('wrong'); UI.toast('Check capital letters, verb agreement and complete sentences.', 'warn'); }
          } }, t))));
      },
      () => {
        // canvas text only uses a web font once it has loaded
        const holder = h('div', { class: 'act' }, h('p', { class: 'lead' }, 'Loading the signature card…'));
        const ready = document.fonts && document.fonts.load ? document.fonts.load('80px "Dancing Script"') : Promise.resolve();
        Promise.race([ready, wait(2500)]).then(() => holder.replaceWith(signature(G, () => step(3))));
        return holder;
      },
      () => h('div', { class: 'act center' },
        h('div', { class: 'big-emoji' }, '🎉'),
        h('h3', {}, 'You’re hired!'),
        h('p', {}, 'Fresh Mart · Cashier · $12/hour. Report to the manager at Fresh Mart.'),
        h('button', { class: 'primary', onclick: () => close(true) }, 'Let’s go')),
    ];
    step(0);
    return h('div');
  }, { icon: '💼', noClose: false });
}

/** Cursive signature: trace your name in cursive (writing + cursive skill). */
function signature(G, done) {
  const name = G.state.name || 'Real';
  const wrap = h('div', { class: 'act' }, h('p', { class: 'lead' }, 'Sign your application in cursive. Trace your name with your finger.'));
  const cv = h('canvas', { class: 'sig', width: 640, height: 220 });
  const guide = document.createElement('canvas'); guide.width = 640; guide.height = 220;
  const gg = guide.getContext('2d');
  const fit = Math.min(110, 560 / Math.max(3, name.length * 0.55));
  gg.font = `${fit}px "Dancing Script", "Segoe Script", cursive`; gg.textAlign = 'center'; gg.textBaseline = 'middle';
  gg.lineWidth = 26; gg.lineJoin = 'round'; gg.strokeStyle = '#000'; gg.strokeText(name, 320, 115); gg.fillText(name, 320, 115);
  const g = cv.getContext('2d');
  const drawGuide = () => { g.clearRect(0, 0, 640, 220); g.font = gg.font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(233,169,58,.28)'; g.fillText(name, 320, 115); g.strokeStyle = 'rgba(233,169,58,.15)'; g.lineWidth = 1; g.beginPath(); g.moveTo(40, 160); g.lineTo(600, 160); g.stroke(); };
  drawGuide();
  const ink = document.createElement('canvas'); ink.width = 640; ink.height = 220; const ig = ink.getContext('2d');
  let drawing = false, last = null;
  const pos = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * 640 / r.width, (e.clientY - r.top) * 220 / r.height]; };
  cv.addEventListener('pointerdown', (e) => { drawing = true; last = pos(e); cv.setPointerCapture(e.pointerId); e.preventDefault(); });
  cv.addEventListener('pointermove', (e) => {
    if (!drawing) return; const p = pos(e);
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
  wrap.append(cv, h('div', { class: 'row' },
    h('button', { class: 'ghost', onclick: () => { drawGuide(); ig.clearRect(0, 0, 640, 220); } }, 'Clear'),
    h('button', { class: 'primary', onclick: () => {
      const s = score();
      if (s.cover > 0.42 && s.stray < 1.2) { G.sfx('good'); G.xp('writing', 25); G.state.stats.cursive = (G.state.stats.cursive || 0) + 1; done(); }
      else { G.sfx('bad'); UI.toast(s.cover <= 0.42 ? 'Follow the gold letters more closely. Cursive letters connect.' : 'Try to stay on the letters.', 'warn'); }
    } }, 'Sign')));
  return wrap;
}

// ------------------------------------------------------------------------------------ Fresh Mart: clock in
export function clockIn(G) {
  const startH = 9, early = pick([3, 5, 8, 10, 12, 13, 15]);
  const shown = `8:${String(60 - early).padStart(2, '0')}`;
  const opts = shuffle([early, early + 10, Math.abs(60 - early - 10) || 7, early + 5].filter((v, i, a) => a.indexOf(v) === i)).slice(0, 4);
  return UI.sheet('Time Clock', (close) => h('div', { class: 'act' },
    h('div', { class: 'clockface' }, shown, h('small', {}, 'AM')),
    h('p', { class: 'lead' }, `Your shift starts at ${startH}:00 AM. The clock says ${shown}. How many minutes early are you?`),
    h('div', { class: 'opts grid2' }, opts.map((v) => h('button', { class: 'opt', onclick: (e) => {
      if (v === early) { G.sfx('good'); G.xp('math', 10); close(true); }
      else { G.sfx('bad'); e.currentTarget.classList.add('wrong'); UI.toast(`Count up from ${shown} to 9:00.`, 'warn'); }
    } }, `${v} minutes`)))), { icon: '⏱️' });
}

// ------------------------------------------------------------------------------------ Register: scan + make change
const GROCERIES = [
  ['Milk', 3.49], ['Bread', 2.49], ['Apples', 2.99], ['Eggs', 3.79], ['Rice', 1.89], ['Star Bites cereal', 4.29], ['Pasta', 1.59],
  ['Bananas', 1.29], ['Cheese', 4.59], ['Juice', 3.25], ['Yogurt', 0.99], ['Soup', 1.75], ['Granola bars', 3.99], ['Tomatoes', 2.19],
];

export function register(G, level = 1) {
  const n = Math.min(2 + level, 5);
  const items = shuffle(GROCERIES).slice(0, n);
  const total = items.reduce((s, i) => s + cents(i[1]), 0) / 100;
  const notes = [5, 10, 20, 50].filter((v) => v > total);
  const paid = level < 2 ? notes[0] : pick(notes.slice(0, 2));
  const change = Math.round((paid - total) * 100) / 100;
  const customer = pick(['a tired dad', 'a student', 'a nurse after a night shift', 'an older neighbor', 'a delivery driver', 'a little kid with a parent']);
  return UI.sheet('Register 1', (close, body) => {
    let scanned = 0, given = 0;
    const list = h('div', { class: 'receipt' });
    const totalEl = h('div', { class: 'total' }, 'TOTAL $0.00');
    const belt = h('div', { class: 'belt' }, items.map((it, k) => h('button', { class: 'item', onclick: (e) => {
      e.currentTarget.disabled = true; e.currentTarget.classList.add('gone'); G.sfx('scan'); scanned++;
      list.append(h('div', { class: 'rline' }, h('span', {}, it[0]), h('span', {}, money(it[1]))));
      const sub = items.slice(0, 0); const sumSoFar = [...list.children].reduce((s, r) => s + cents(parseFloat(r.lastChild.textContent.replace('$', ''))), 0) / 100;
      totalEl.textContent = 'TOTAL ' + money(sumSoFar);
      if (scanned === items.length) setTimeout(payStep, 450);
    } }, h('span', { class: 'item-ic' }, ['🥛', '🍞', '🍎', '🥚', '🍚', '⭐', '🍝', '🍌', '🧀', '🧃', '🥣', '🥫', '🍫', '🍅'][GROCERIES.findIndex((g) => g[0] === it[0])] || '🛒'), h('small', {}, it[0]))));
    const payStep = () => {
      const tray = [20, 10, 5, 1, 0.25, 0.1, 0.05, 0.01];
      const changeEl = h('b', { class: 'chg' }, money(0));
      const givenList = h('div', { class: 'given' });
      body.replaceChildren(h('div', { class: 'act' },
        h('div', { class: 'math-card' }, h('div', { class: 'mc-head' }, '🛒 MAKE CHANGE'),
          h('p', {}, `The total is ${money(total)}. ${customer[0].toUpperCase() + customer.slice(1)} pays with ${money(paid)}.`),
          h('p', { class: 'q' }, 'Count back the change from the cash drawer.')),
        h('div', { class: 'given-row' }, h('span', {}, 'Change: '), changeEl, givenList),
        h('div', { class: 'tray' }, tray.map((v) => h('button', { class: 'cash ' + (v >= 1 ? 'bill' : 'coin'), onclick: () => {
          G.sfx('coin'); given = Math.round((given + v) * 100) / 100; changeEl.textContent = money(given);
          givenList.append(h('span', { class: 'chip' }, v >= 1 ? `$${v}` : `${Math.round(v * 100)}¢`));
        } }, v >= 1 ? `$${v}` : `${Math.round(v * 100)}¢`))),
        h('div', { class: 'row' },
          h('button', { class: 'ghost', onclick: () => { given = 0; changeEl.textContent = money(0); givenList.replaceChildren(); } }, 'Reset'),
          h('button', { class: 'ghost', onclick: () => UI.toast(`Hint: start at ${money(total)} and count up to ${money(paid)}. ${money(paid)} − ${money(total)} = ?`, 'info', 4500) }, 'Hint'),
          h('button', { class: 'primary', onclick: () => {
            if (Math.abs(given - change) < 0.001) { G.sfx('cash'); G.xp('math', 12 + level * 3); close({ ok: true, change }); }
            else { G.sfx('bad'); G.state.stats.mistakes = (G.state.stats.mistakes || 0) + 1; UI.toast(given > change ? `That's too much. The change should be less than ${money(given)}.` : `Not enough yet. Keep counting up to ${money(paid)}.`, 'warn', 3200); }
          } }, 'Give change'))));
    };
    return h('div', { class: 'act' }, h('p', { class: 'lead' }, `Customer: ${customer}. Tap each item to scan it.`), belt, list, totalEl);
  }, { icon: '🧾', cls: 'wide' });
}

// ------------------------------------------------------------------------------------ Stocking: read labels, find the aisle
export const AISLES = ['BREAD & CEREAL', 'CANNED GOODS', 'PASTA & RICE', 'SNACKS', 'HOUSEHOLD'];
export const PRODUCTS = [
  ['Oat Cereal', 1, '🥣'], ['Whole Wheat Bread', 1, '🍞'], ['Bagels', 1, '🥯'], ['Tomato Soup', 2, '🥫'], ['Black Beans', 2, '🥫'], ['Canned Peaches', 2, '🍑'],
  ['Spaghetti', 3, '🍝'], ['Brown Rice', 3, '🍚'], ['Macaroni', 3, '🧀'], ['Pretzels', 4, '🥨'], ['Granola Bars', 4, '🍫'], ['Popcorn', 4, '🍿'],
  ['Dish Soap', 5, '🧴'], ['Paper Towels', 5, '🧻'], ['Sponges', 5, '🧽'],
];
export function stockCheck(G, product, aisle) {
  if (product[1] === aisle) { G.sfx('good'); G.xp('reading', 10); return true; }
  G.sfx('bad'); UI.toast(`This is aisle ${aisle}: ${AISLES[aisle - 1]}. Where would ${product[0]} go? Read the hanging signs.`, 'warn', 4200);
  return false;
}

// ------------------------------------------------------------------------------------ Inventory count: multiplication
export function inventory(G, level = 1) {
  const cases = ri(3, 4 + level * 2), per = pick(level < 2 ? [6, 10, 12] : [12, 24, 8, 9]), loose = ri(0, per - 1);
  const ans = cases * per + loose;
  return UI.sheet('Stockroom inventory', (close) => {
    let val = '';
    const disp = h('div', { class: 'keypad-disp' }, '0');
    const viz = h('div', { class: 'cases' }, [...Array(cases)].map(() => h('div', { class: 'case' }, `${per}`)), loose ? h('div', { class: 'loose' }, `+${loose}`) : null);
    const key = (k) => h('button', { class: 'key', onclick: () => {
      G.sfx('click');
      if (k === '⌫') val = val.slice(0, -1); else if (val.length < 4) val += k;
      disp.textContent = val || '0';
    } }, k);
    return h('div', { class: 'act' },
      h('p', { class: 'lead' }, `Count the canned tomatoes: ${cases} cases with ${per} cans each, plus ${loose} loose cans.`), viz,
      disp, h('div', { class: 'keypad' }, ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0'].map(key),
        h('button', { class: 'key ok', onclick: () => {
          if (parseInt(val, 10) === ans) { G.sfx('good'); G.xp('math', 15 + level * 3); close(true); }
          else { G.sfx('bad'); UI.toast(`Try ${cases} × ${per} first, then add ${loose}.`, 'warn', 3200); val = ''; disp.textContent = '0'; }
        } }, '✓')));
  }, { icon: '📦' });
}

// ------------------------------------------------------------------------------------ Paycheck: gross, FICA, net
export function paystub(G, hours, rate, bonus = 0) {
  const gross = Math.round((hours * rate + bonus) * 100) / 100;
  const fica = Math.round(gross * 0.0765 * 100) / 100;
  const net = Math.round((gross - fica) * 100) / 100;
  return UI.sheet('Pay stub', (close) => h('div', { class: 'act stub' },
    h('div', { class: 'stub-head' }, h('b', {}, 'FRESH MART'), h('small', {}, `Day ${G.state.day} · ${G.state.name}`)),
    h('div', { class: 'rline' }, h('span', {}, `${hours} hours × ${money(rate)}`), h('span', {}, money(hours * rate))),
    bonus ? h('div', { class: 'rline' }, h('span', {}, 'Accuracy bonus'), h('span', {}, money(bonus))) : null,
    h('div', { class: 'rline strong' }, h('span', {}, 'Gross pay'), h('span', {}, money(gross))),
    h('div', { class: 'rline minus' }, h('span', {}, 'Social Security + Medicare (7.65%)'), h('span', {}, '−' + money(fica))),
    h('div', { class: 'rline net' }, h('span', {}, 'Net pay (what you keep)'), h('span', {}, money(net))),
    h('p', { class: 'tip' }, 'Gross pay is what you earn. Net pay is what lands in your bank after taxes. Always budget with net pay.'),
    h('button', { class: 'primary', onclick: () => { G.sfx('cash'); G.xp('finance', 20); close(net); } }, `Deposit ${money(net)}`)), { icon: '💵', noClose: true });
}

// ------------------------------------------------------------------------------------ Grocery shopping on a budget
export const FOODS = [
  { id: 'noodles', name: 'Instant noodles', price: 0.99, meals: 1, food: 25, icon: '🍜', note: 'Cheap but not very filling' },
  { id: 'pasta', name: 'Pasta + sauce', price: 3.49, meals: 3, food: 45, icon: '🍝', note: 'Three meals' },
  { id: 'eggs', name: 'Eggs (12)', price: 3.79, meals: 4, food: 40, icon: '🥚', note: 'Four breakfasts' },
  { id: 'apples', name: 'Apples (6)', price: 2.99, meals: 3, food: 25, icon: '🍎', note: 'Healthy snack' },
  { id: 'rice', name: 'Rice & beans', price: 2.89, meals: 4, food: 45, icon: '🍚', note: 'Best value' },
  { id: 'cereal', name: 'Star Bites cereal', price: 4.29, meals: 4, food: 30, icon: '⭐', note: 'Sweet, low protein' },
];
export function shop(G) {
  const cart = {};
  return UI.sheet('Fresh Mart groceries', (close) => {
    const totalEl = h('b', {}, money(0)); const perMeal = h('small', {});
    const recalc = () => {
      const t = Object.entries(cart).reduce((s, [id, q]) => s + FOODS.find((f) => f.id === id).price * q, 0);
      const meals = Object.entries(cart).reduce((s, [id, q]) => s + FOODS.find((f) => f.id === id).meals * q, 0);
      totalEl.textContent = money(t); perMeal.textContent = meals ? `${meals} meals · ${money(t / meals)} per meal` : '';
      return t;
    };
    return h('div', { class: 'act' },
      h('p', { class: 'lead' }, `You have ${money(G.state.money)}. Compare the price per meal before you buy.`),
      h('div', { class: 'shelf' }, FOODS.map((f) => {
        const q = h('span', { class: 'qty' }, '0');
        return h('div', { class: 'food' }, h('span', { class: 'f-ic' }, f.icon), h('div', { class: 'f-txt' }, h('b', {}, f.name), h('small', {}, `${money(f.price)} · ${f.note}`), h('small', { class: 'unit' }, `${money(f.price / f.meals)} per meal`)),
          h('div', { class: 'stepper' }, h('button', { onclick: () => { cart[f.id] = Math.max(0, (cart[f.id] || 0) - 1); q.textContent = cart[f.id]; recalc(); } }, '−'), q,
            h('button', { onclick: () => { cart[f.id] = (cart[f.id] || 0) + 1; q.textContent = cart[f.id]; G.sfx('click'); recalc(); } }, '+')));
      })),
      h('div', { class: 'checkout' }, h('div', {}, 'Total ', totalEl, h('br'), perMeal),
        h('button', { class: 'primary', onclick: () => {
          const t = recalc();
          if (t === 0) return close(false);
          if (t > G.state.money) { G.sfx('bad'); UI.toast('Not enough money. Take something out of the cart.', 'warn'); return; }
          for (const [id, q] of Object.entries(cart)) G.state.pantry[id] = (G.state.pantry[id] || 0) + q * FOODS.find((f) => f.id === id).meals;
          G.spend(t, 'Fresh Mart groceries'); G.xp('finance', 8); G.sfx('cash'); close(true);
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
        G.state.pantry[f.id]--; G.feed(f.food); G.sfx('good'); close(true);
      } }, h('span', { class: 'f-ic' }, f.icon), h('div', { class: 'f-txt' }, h('b', {}, f.name), h('small', {}, `${G.state.pantry[f.id]} meals left · +${f.food} food`))))));
  }, { icon: '🍳' });
}

function cook(G, f) {
  const variants = [
    { q: 'The recipe makes 4 servings and uses 1 cup of rice. You’re cooking 2 servings. How much rice?', a: '½ cup', o: ['½ cup', '2 cups', '¼ cup', '1 cup'] },
    { q: 'The recipe serves 2 and needs ¾ cup of pasta. You’re cooking for 4. How much pasta?', a: '1½ cups', o: ['1½ cups', '¾ cup', '3 cups', '1 cup'] },
    { q: 'You need 2 cups of water but only have a ½-cup scoop. How many scoops?', a: '4 scoops', o: ['4 scoops', '2 scoops', '3 scoops', '1 scoop'] },
  ];
  const v = pick(variants);
  return UI.sheet('Cook it right', (close) => h('div', { class: 'act' },
    h('p', { class: 'lead' }, v.q),
    h('div', { class: 'opts grid2' }, shuffle(v.o).map((o) => h('button', { class: 'opt', onclick: (e) => {
      if (o === v.a) { G.sfx('good'); G.xp('math', 12); G.state.pantry[f.id]--; G.feed(f.food + 15); UI.toast('Home-cooked. +15 extra food.', 'good'); close(true); }
      else { G.sfx('bad'); e.currentTarget.classList.add('wrong'); UI.toast('Think about how many times bigger or smaller the batch is.', 'warn'); }
    } }, o)))), { icon: '🥘' });
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
            b.paid = true; G.spend(b.amount, b.name); G.xp('finance', 15); G.sfx('cash'); render();
          } }, 'Pay')))),
        h('p', { class: 'tip' }, '50/30/20 rule: about half your take-home pay for needs (rent, food, bills), 30% for wants, and 20% for savings.')));
    };
    render();
    return h('div');
  }, { icon: '🧾' });
}

// ------------------------------------------------------------------------------------ Learn app quizzes
const QUIZ = {
  math: () => { const a = ri(12, 48), b = ri(3, 9); const p = (ri(150, 999) / 100); return pick([
    { q: `${a} × ${b} = ?`, a: String(a * b), o: [a * b, a * b + b, a * b - b, a * (b + 2)].map(String) },
    { q: `A shirt costs ${money(p * 10)}. It's 20% off. What's the sale price?`, a: money(p * 8), o: [money(p * 8), money(p * 2), money(p * 9), money(p * 7.5)] },
    { q: `You earn $12/hour and work 6 hours. How much before taxes?`, a: '$72.00', o: ['$72.00', '$66.00', '$18.00', '$62.00'] },
  ]); },
  reading: () => pick([
    { q: 'A sign says “Employees must wash hands before returning to work.” Who does this apply to?', a: 'Workers', o: ['Workers', 'Customers', 'Delivery drivers only', 'No one'] },
    { q: 'Which word means “to put off until later”?', a: 'Postpone', o: ['Postpone', 'Prepare', 'Persuade', 'Proceed'] },
    { q: 'Your lease says “Rent is due on the 1st. A $25 fee applies after the 5th.” You pay on the 4th. Is there a fee?', a: 'No', o: ['No', 'Yes, $25', 'Yes, $5', 'Only on weekends'] },
  ]),
  writing: () => pick([
    { q: 'Pick the correctly written sentence.', a: 'Their apartment is near the park.', o: ['Their apartment is near the park.', 'There apartment is near the park.', "They're apartment is near the park.", 'Thier apartment is near the park.'] },
    { q: 'Which is the best way to start a professional email?', a: 'Hello Ms. Rivera,', o: ['Hello Ms. Rivera,', 'yo', 'HEY!!!', 'sup Rivera'] },
  ]),
  finance: () => pick([
    { q: 'You get paid $400. Using 50/30/20, how much goes to savings?', a: '$80', o: ['$80', '$200', '$120', '$40'] },
    { q: 'What is “interest” on a credit card?', a: 'Extra money you pay for borrowing', o: ['Extra money you pay for borrowing', 'A free bonus', 'Your credit limit', 'A type of tax refund'] },
    { q: 'An emergency fund is for…', a: 'Unexpected costs like car repairs', o: ['Unexpected costs like car repairs', 'New sneakers', 'Concert tickets', 'Daily coffee'] },
  ]),
  thinking: () => pick([
    { q: 'An ad says “9 out of 10 people love Star Bites!” What should you ask first?', a: 'Who asked them, and how many people?', o: ['Who asked them, and how many people?', 'What color is the box?', 'Is it on TV?', 'Nothing, it must be true'] },
    { q: 'A friend says a deal is “only today” and you must decide now. What’s the smart move?', a: 'Pause and compare before you buy', o: ['Pause and compare before you buy', 'Buy immediately', 'Borrow money to get it', 'Buy two'] },
  ]),
};
export function learn(G) {
  return UI.sheet('Learn', (close, body) => {
    const cats = [['math', 'Math', '➗'], ['reading', 'Reading', '📖'], ['writing', 'Writing', '✍️'], ['finance', 'Money', '💰'], ['thinking', 'Critical thinking', '🧠']];
    const menu = () => body.replaceChildren(h('div', { class: 'act' }, h('p', { class: 'lead' }, 'Quick lessons. Each correct answer earns skill XP.'),
      h('div', { class: 'cards cats' }, cats.map(([k, n, ic]) => h('button', { class: 'card', onclick: () => ask(k) }, h('span', { class: 'big-emoji' }, ic), h('b', {}, n), h('small', {}, `Level ${G.level(k)}`))))));
    const ask = (k) => {
      const Q = QUIZ[k]();
      body.replaceChildren(h('div', { class: 'act' }, h('p', { class: 'lead' }, Q.q),
        h('div', { class: 'opts' }, shuffle([...new Set(Q.o)]).map((o) => h('button', { class: 'opt', onclick: (e) => {
          if (o === Q.a) { G.sfx('good'); G.xp(k, 10); UI.toast('Correct! +10 XP', 'good'); ask(k); }
          else { G.sfx('bad'); e.currentTarget.classList.add('wrong'); }
        } }, o))), h('button', { class: 'ghost', onclick: menu }, '‹ Topics')));
    };
    menu();
    return h('div');
  }, { icon: '📚', cls: 'wide' });
}

// ------------------------------------------------------------------------------------ Simple purchases
export function menuBuy(G, title, icon, items) {
  return UI.sheet(title, (close) => h('div', { class: 'act' },
    h('p', { class: 'lead' }, `Balance ${money(G.state.money)}`),
    h('div', { class: 'shelf' }, items.map((it) => h('button', { class: 'food btn', onclick: () => {
      if (G.state.money < it.price) { G.sfx('bad'); UI.toast('Not enough money.', 'warn'); return; }
      G.spend(it.price, it.name); G.sfx('cash'); it.apply(); close(it);
    } }, h('span', { class: 'f-ic' }, it.icon), h('div', { class: 'f-txt' }, h('b', {}, it.name), h('small', {}, it.note)), h('span', { class: 'amt' }, money(it.price)))))), { icon });
}
