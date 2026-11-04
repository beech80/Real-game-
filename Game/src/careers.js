// REAL — Chapter 6 "Finding your path": every career Tier 0–3 is playable as real work.
// Each shift is three tasks drawn from that job, adapted to the player's level, with hints and no timers.
import { h, UI, money, wait } from './ui.js';
import { helpBox, paystub, PRACTICE, teach } from './activities.js';

const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
const doc = (title, lines) => h('div', { class: 'doc' }, title ? h('div', { class: 'doc-h' }, title) : null, ...lines.map((l) => h('div', { class: 'doc-l' }, l)));
const $ = (v) => '$' + (Number.isInteger(v) ? v : v.toFixed(2));
const frac = (n) => { const w = Math.floor(n + 1e-9), r = n - w, f = { 0.25: '1/4', 0.5: '1/2', 0.75: '3/4' }[Math.round(r * 4) / 4]; return r < 0.01 ? `${w}` : w ? `${w} ${f}` : f; };
const tm = (mins) => { let hh = Math.floor(mins / 60) % 24; const mm = mins % 60, ap = hh >= 12 ? 'PM' : 'AM'; hh = hh % 12 || 12; return `${hh}:${String(mm).padStart(2, '0')} ${ap}`; };

// ------------------------------------------------------------------------------------------- task generators
// each returns { skill, q, o: [...], a, v?: visual node }
export const T = {
  address: () => { const st = pick(['Elm St', 'Cedar Ave', 'Harbor Rd', 'Maple St']); const base = ri(2, 8) * 100 + ri(0, 4) * 2; const opts = [['Bakery', base], ['Apartments', base + 4], ['Laundromat', base + 8], ['Bookshop', base + 12]]; const t = pick(opts);
    return { skill: 'read.signs', v: doc('📦 PACKAGE LABEL', [`Deliver to: ${t[1]} ${st}`, 'Signature required']), q: `Street doors: ${opts.map(([n, a]) => `${a} ${n}`).join(' · ')}. Which door?`, a: t[0], o: opts.map((x) => x[0]) }; },
  delivery: () => { const p = ri(13, 16) * 60 + pick([10, 25, 40]), d = pick([20, 25, 35, 45]); return { skill: 'math.time', v: doc('ROUTE', [`Picked up: ${tm(p)}`, `Drive time: ${d} minutes`]), q: 'What time will you arrive?', a: tm(p + d), o: [tm(p + d), tm(p + d + 10), tm(p + d - 15), tm(p + 60 + d)] }; },
  note: () => pick([
    { skill: 'read.instructions', v: doc('DELIVERY NOTE', ['If no one answers, leave it with the neighbor in 2B.', 'Do NOT leave at the front door.']), q: 'You knock. Nobody answers. What do you do?', a: 'Take it to the neighbor in 2B', o: ['Take it to the neighbor in 2B', 'Leave it at the front door', 'Take it home'] },
    { skill: 'read.instructions', v: doc('DELIVERY NOTE', ['Fragile: glass inside.', 'Keep this side up ↑', 'Ring the bell twice.']), q: 'How do you carry and deliver it?', a: 'Arrow side up, then ring the bell twice', o: ['Arrow side up, then ring the bell twice', 'Any way, then knock', 'Toss it on the porch'] }]),
  pallets: () => { const L = ri(3, 6), B = pick([6, 8, 9, 12]), P = ri(2, 5); const a = L * B * P; return { skill: 'math.multiply', v: doc('LOADING DOCK', [`Each pallet: ${L} layers × ${B} boxes`, `Pallets on the truck: ${P}`]), q: 'How many boxes are on the truck?', a: String(a), o: [a, L * B + P, a + B, (L + 1) * B * P].map(String) }; },
  slip: () => { const items = [['Rice 5 lb', ri(4, 9)], ['Canned beans', ri(10, 24)], ['Paper towels', ri(3, 8)]]; const k = ri(0, 2); const got = items.map(([n, q], i) => [n, i === k ? q - ri(1, 3) : q]);
    return { skill: 'read.documents', v: h('div', { class: 'row2' }, doc('PACKING SLIP', items.map(([n, q]) => `${n}: ${q}`)), doc('IN THE BOX', got.map(([n, q]) => `${n}: ${q}`))), q: 'Which item is short?', a: items[k][0], o: items.map((x) => x[0]).concat(['Nothing is short']) }; },
  truckFrac: () => { const cap = pick([16, 20, 24, 32]), f = pick([[1, 4], [1, 2], [3, 4]]); const a = cap * f[0] / f[1]; return { skill: 'math.fractions', v: doc('TRUCK', [`Holds ${cap} pallets`, `Loaded: ${f[0]}/${f[1]} full`]), q: 'How many pallets are loaded?', a: String(a), o: [a, cap - a, cap / 3 | 0, a + 2].map(String) }; },
  manual: () => { const steps = ['Park and let the engine cool', 'Drain the old oil', 'Replace the oil filter', 'Fill with new oil', 'Check the level with the dipstick']; const i = ri(0, 3);
    return { skill: 'read.instructions', v: doc('SERVICE MANUAL · OIL CHANGE', steps.map((s, k) => `${k + 1}. ${s}`)), q: `What comes right after “${steps[i]}”?`, a: steps[i + 1], o: shuffle(steps.filter((_, k) => k !== i)).slice(0, 3).concat(steps[i + 1]) }; },
  wrench: () => { const sz = [['1/4', 0.25], ['3/8', 0.375], ['1/2', 0.5], ['9/16', 0.5625], ['5/8', 0.625], ['3/4', 0.75]]; const a = pick(sz), b = pick(sz.filter((x) => x !== a)); const big = a[1] > b[1] ? a : b;
    return { skill: 'math.fractions', q: `Two wrenches: ${a[0]} inch and ${b[0]} inch. Which is bigger?`, a: big[0] + ' inch', o: [a[0] + ' inch', b[0] + ' inch', 'They are the same'] }; },
  diagnose: () => pick([
    { skill: 'think.evaluate', v: doc('CUSTOMER SAYS', ['The car clicks but won’t start.', 'The headlights are dim.']), q: 'What do you check first?', a: 'The battery', o: ['The battery', 'The tires', 'The radio'] },
    { skill: 'think.evaluate', v: doc('CUSTOMER SAYS', ['Squealing noise when I brake.', 'It started last week.']), q: 'Most likely cause?', a: 'Worn brake pads', o: ['Worn brake pads', 'Low windshield fluid', 'A flat tire'] },
    { skill: 'think.evaluate', v: doc('DASHBOARD', ['Temperature light is ON', 'Steam from under the hood']), q: 'What do you check first?', a: 'The coolant level', o: ['The coolant level', 'The air freshener', 'The horn'] }]),
  recipe: () => { const amt = pick([0.5, 0.75, 1.5]), base = 2, ppl = pick([4, 6, 8]); const a = amt * ppl / base; return { skill: 'math.fractions', v: doc('RECIPE · PANCAKES', [`${frac(amt)} cup milk`, `Serves ${base}`]), q: `You need to serve ${ppl}. How much milk?`, a: frac(a) + ' cups', o: [a, a + 0.5, amt * ppl, amt + ppl / base].map((v) => frac(v) + ' cups') }; },
  orders: () => { const ready = 18 * 60 + pick([0, 15, 30]), c = pick([12, 15, 18]), f = pick([6, 8, 10]); return { skill: 'math.time', v: doc('TICKET #42', [`Burger: cook ${c} min`, `Fries: cook ${f} min`, `Both ready at ${tm(ready)}`]), q: 'When do you start the fries?', a: tm(ready - f), o: [tm(ready - f), tm(ready - c), tm(ready), tm(ready - c - f)] }; },
  safety: () => pick([
    { skill: 'read.instructions', v: doc('FOOD SAFETY', ['Chicken: cook to 165°F.', 'Keep cold food below 40°F.']), q: 'The thermometer in the chicken reads 150°F. What now?', a: 'Keep cooking until 165°F', o: ['Keep cooking until 165°F', 'Serve it now', 'Put it in the fridge'] },
    { skill: 'read.instructions', v: doc('KITCHEN RULES', ['Red board: raw meat only.', 'Green board: vegetables.']), q: 'Where do you cut the lettuce?', a: 'The green board', o: ['The green board', 'The red board', 'Either one'] }]),
  discount: () => { const p = pick([24, 36, 48, 60, 80]), d = pick([10, 25, 50]); const a = p * (100 - d) / 100; return { skill: 'math.percent', v: doc('SALE TAG', [`${$(p)}`, `${d}% OFF`]), q: 'What does the customer pay?', a: $(a), o: [a, p - d, p * d / 100, a + 5].map($) }; },
  unitPrice: () => { const n = pick([3, 4]), each = pick([8, 9, 10, 12]), deal = n * each - pick([3, 6, -3]); const per = deal / n; const better = per < each;
    return { skill: 'think.compare', v: doc('TWO OPTIONS', [`One T-shirt: ${$(each)}`, `${n}-pack: ${$(deal)}`]), q: 'Which costs less per shirt?', a: better ? `The ${n}-pack` : 'One at a time', o: [`The ${n}-pack`, 'One at a time', 'They’re the same'] }; },
  reply: () => pick([
    { skill: 'write.professional', v: doc('CUSTOMER', ['“This jacket doesn’t fit. Can I return it?”']), q: 'Best reply?', a: 'Of course. Do you have your receipt? I can help you find another size.', o: ['Of course. Do you have your receipt? I can help you find another size.', 'Not my problem.', 'Returns are annoying, but fine.'] },
    { skill: 'write.professional', v: doc('EMAIL TO A CLIENT', ['They asked when their order will be ready.']), q: 'Best sentence?', a: 'Your order will be ready on Thursday by 3:00 PM.', o: ['Your order will be ready on Thursday by 3:00 PM.', 'soon probably', 'IT WILL BE READY WHEN IT’S READY.'] }]),
  email: () => pick([
    { skill: 'write.professional', q: 'Which subject line is clearest for an email about moving Friday’s meeting?', a: 'Friday meeting moved to 2:00 PM', o: ['Friday meeting moved to 2:00 PM', 'hey', 'URGENT!!!', 'Meeting stuff'] },
    { skill: 'write.professional', q: 'How do you close a professional email?', a: 'Thank you, [your name]', o: ['Thank you, [your name]', 'k bye', 'whatever'] }]),
  memo: () => { const room = pick(['Room 4B', 'Room 12', 'the Garden Room']), t = pick(['10:30 AM', '1:15 PM', '3:00 PM']);
    return { skill: 'read.documents', v: doc('MEMO', ['To: All staff', `The budget meeting is moving to ${room} at ${t}.`, 'Please bring last month’s report.']), q: 'Where and when is the meeting?', a: `${room} at ${t}`, o: [`${room} at ${t}`, `Room 1 at ${t}`, `${room} at 9:00 AM`] }; },
  schedule: () => { const s = pick([9, 10, 11]); return { skill: 'math.time', v: doc('WHO IS FREE', [`Ana: ${s}:00 – ${s + 3}:00`, `Ben: ${s + 1}:00 – ${s + 4}:00`, `Room: ${s + 2}:00 – ${s + 5}:00`]), q: 'Earliest start for a 1-hour meeting with everyone?', a: `${(s + 2) % 12 || 12}:00`, o: [s, s + 1, s + 2, s + 3].map((v) => `${v % 12 || 12}:00`) }; },
  measure: () => { const a = ri(2, 6) + pick([0.25, 0.5, 0.75]), b = ri(1, 5) + pick([0.25, 0.5, 0.75]); return { skill: 'math.fractions', v: doc('CUT LIST', [`Board A: ${frac(a)} ft`, `Board B: ${frac(b)} ft`]), q: 'Total length?', a: frac(a + b) + ' ft', o: [a + b, a + b + 0.5, Math.floor(a) + Math.floor(b), a + b - 0.25].map((v) => frac(v) + ' ft') }; },
  area: () => { const w = ri(8, 14), hh = pick([8, 9, 10]); const a = w * hh; return { skill: 'math.multiply', v: doc('PAINT JOB', [`Wall: ${w} ft wide × ${hh} ft tall`]), q: 'How many square feet do you paint?', a: `${a} sq ft`, o: [a, w + hh, 2 * (w + hh), a + w].map((v) => `${v} sq ft`) }; },
  ladder: () => { const up = pick([8, 12, 16, 20]); return { skill: 'read.instructions', v: doc('LADDER SAFETY', ['Set the base 1 foot out for every 4 feet up.']), q: `The ladder reaches ${up} feet up. How far out is the base?`, a: `${up / 4} ft`, o: [up / 4, up / 2, 4, up].map((v) => `${v} ft`) }; },
  deposit: () => { const p = pick([200, 300, 400, 500]), d = pick([20, 25, 30, 50]); const a = p * d / 100; return { skill: 'math.percent', v: doc('BOOKING', [`Photo package: ${$(p)}`, `Deposit: ${d}%`]), q: 'How much is the deposit?', a: $(a), o: [a, p - a, d, a * 2].map($) }; },
  pricing: () => { const c1 = pick([40, 60, 80]), c2 = pick([50, 90, 120]), pr = pick([100, 150, 200]); const a = c1 + c2 + pr; return { skill: 'fin.business', v: doc('YOUR COSTS', [`Travel: ${$(c1)}`, `Editing time: ${$(c2)}`, `Profit you want: ${$(pr)}`]), q: 'What price covers costs and your profit?', a: $(a), o: [a, c1 + c2, pr, a - c1].map($) }; },
  weather: () => ({ skill: 'think.evaluate', v: doc('FORECAST', ['Saturday: 80% chance of rain', 'Sunday: sunny']), q: 'A client wants an outdoor shoot on Saturday. Best plan?', a: 'Suggest Sunday, or book an indoor backup', o: ['Suggest Sunday, or book an indoor backup', 'Go anyway and hope', 'Cancel without telling them'] }),
  solve: () => { const x = ri(2, 9), a = ri(2, 6), b = ri(1, 15); return { skill: 'math.algebra', v: doc('CODE', [`${a} * x + ${b} == ${a * x + b}`]), q: 'What value of x makes this true?', a: String(x), o: [x, x + 1, a * x + b - b, b].map(String) }; },
  loop: () => { const n = ri(3, 6); const t = n * (n + 1) / 2; return { skill: 'think.evaluate', v: doc('CODE', ['total = 0', `for i in 1 to ${n}:`, '    total = total + i']), q: 'What is total at the end?', a: String(t), o: [t, n, t + n, n * n].map(String) }; },
  bug: () => ({ skill: 'think.evaluate', v: doc('SPEC: “Ages 13 and older can join.”', ['if age > 13:', '    allow()']), q: 'What is the bug?', a: 'A 13-year-old is blocked. It should be age >= 13', o: ['A 13-year-old is blocked. It should be age >= 13', 'Nothing is wrong', 'It should be age < 13'] }),
  tax: () => { const g = pick([800, 1200, 1500, 2000]), r = pick([10, 12, 15]); const a = g * r / 100; return { skill: 'fin.taxes', v: doc('PAYROLL', [`Gross pay: ${$(g)}`, `Income tax withholding: ${r}%`]), q: 'How much is withheld?', a: $(a), o: [a, g - a, r * 10, a / 2].map($) }; },
  ledger: () => { const e = [ri(120, 400), ri(50, 200), ri(30, 150)]; const real = e.reduce((s, v) => s + v, 0), wrong = real + pick([10, 20, -10]);
    return { skill: 'read.documents', v: doc('LEDGER', [`Supplies: ${$(e[0])}`, `Delivery: ${$(e[1])}`, `Repairs: ${$(e[2])}`, `TOTAL: ${$(wrong)}`]), q: 'Is the total correct?', a: `No, it should be ${$(real)}`, o: [`No, it should be ${$(real)}`, 'Yes', `No, it should be ${$(wrong + 30)}`] }; },
  growth: () => { const a = pick([400, 800, 1000]), p = pick([10, 20, 25, 50]); const b = a * (100 + p) / 100; return { skill: 'math.percent', v: doc('SALES', [`Last month: ${$(a)}`, `This month: ${$(b)}`]), q: 'By what percent did sales grow?', a: p + '%', o: [p, p / 2, b - a, 100 - p].map((v) => v + '%') }; },
  meds: () => { const every = pick([4, 6, 8]), last = pick([7, 8, 9]); return { skill: 'math.time', v: doc('PATIENT CHART', [`Medicine: every ${every} hours`, `Last dose: ${last}:00 AM`]), q: 'When is the next dose?', a: tm((last + every) * 60), o: [last + every, last + every + 1, last + 2 * every, last + every - 2].map((v) => tm(v * 60)) }; },
  allergy: () => { const al = pick(['Peanuts', 'Penicillin', 'Latex']); return { skill: 'read.documents', v: doc('PATIENT CHART', ['Name: J. Rivera', `Allergies: ${al}`, 'Diet: vegetarian']), q: 'What must you avoid with this patient?', a: al, o: ['Peanuts', 'Penicillin', 'Latex', 'Water'] }; },
  dose: () => { const ml = pick([2.5, 5, 7.5]), times = pick([2, 3]), days = pick([3, 4, 5]); const a = ml * times * days; return { skill: 'math.decimals', v: doc('PRESCRIPTION', [`${ml} mL, ${times} times a day`, `for ${days} days`]), q: 'How much medicine in total?', a: a + ' mL', o: [a, ml * days, ml * times, a + ml].map((v) => v + ' mL') }; },
  ohm: () => { const R = pick([10, 20, 30, 40]), I = pick([2, 3, 4, 6]); return { skill: 'math.algebra', v: doc('OHM’S LAW', ['Voltage = Current × Resistance  (V = I × R)', `V = ${I * R} volts, R = ${R} ohms`]), q: 'What is the current I?', a: `${I} amps`, o: [I, I * R, R, I + 2].map((v) => `${v} amps`) }; },
  breaker: () => { const s = ['Turn off the breaker', 'Test that the wire is dead', 'Replace the outlet', 'Turn the breaker back on']; const i = ri(0, 2);
    return { skill: 'read.instructions', v: doc('SAFETY CODE', s.map((x, k) => `${k + 1}. ${x}`)), q: `What comes right after “${s[i]}”?`, a: s[i + 1], o: s.filter((_, k) => k !== i) }; },
  wire: () => { const n = ri(2, 4), L = ri(1, 3) + pick([0.5, 0.25, 0.75]); return { skill: 'math.fractions', q: `You need ${n} pieces of wire, each ${frac(L)} ft. How much wire in total?`, a: frac(n * L) + ' ft', o: [n * L, n + L, n * L + 1, L * (n + 1)].map((v) => frac(v) + ' ft') }; },
  load: () => { const sf = pick([2, 3, 4]), cap = pick([1200, 2400, 3600]); return { skill: 'math.algebra', v: doc('BEAM SPEC', [`Breaks at ${cap.toLocaleString()} lb`, `Safety factor: ${sf}  (design load × ${sf} = break load)`]), q: 'What is the design load?', a: (cap / sf).toLocaleString() + ' lb', o: [cap / sf, cap * sf, cap - sf, cap / (sf + 1)].map((v) => Math.round(v).toLocaleString() + ' lb') }; },
  tests: () => ({ skill: 'think.evaluate', v: doc('TEST RESULTS · need: strength ≥ 90, cost ≤ $500', ['Design A: strength 95, cost $620', 'Design B: strength 91, cost $480', 'Design C: strength 70, cost $300']), q: 'Which design meets every requirement?', a: 'Design B', o: ['Design A', 'Design B', 'Design C'] }),
  efficiency: () => { const total = pick([400, 500, 600, 800]), p = pick([50, 60, 75, 80]); return { skill: 'math.percent', q: `A machine turns ${total * p / 100} of every ${total} watts into useful work. What is its efficiency?`, a: p + '%', o: [p, 100 - p, p / 2, p + 10].map((v) => v + '%') }; },
  vitals: () => ({ skill: 'read.documents', v: doc('VITALS · normal ranges in ( )', ['Temperature 98.6°F (97–99)', 'Heart rate 128 bpm (60–100)', 'Breathing 16 / min (12–20)']), q: 'Which reading is outside the normal range?', a: 'Heart rate', o: ['Temperature', 'Heart rate', 'Breathing'] }),
  weightDose: () => { const mg = pick([5, 10, 15]), kg = pick([20, 30, 40]); return { skill: 'math.multiply', v: doc('DOSING', [`${mg} mg per kg of body weight`, `Patient weighs ${kg} kg`]), q: 'What is the dose?', a: `${mg * kg} mg`, o: [mg * kg, mg + kg, kg, mg * kg / 2].map((v) => `${v} mg`) }; },
  nextQ: () => ({ skill: 'think.evaluate', v: doc('PATIENT', ['“My stomach hurts.”']), q: 'What is the best next question?', a: 'Where does it hurt, and since when?', o: ['Where does it hurt, and since when?', 'Do you like pizza?', 'Can you come back next week?'] }),
  room: () => { const w = pick([3.5, 4, 4.5, 5]), l = pick([4, 5, 6]); const a = w * l; return { skill: 'math.decimals', v: doc('FLOOR PLAN', [`Bedroom: ${w} m × ${l} m`]), q: 'What is the floor area?', a: `${a} m²`, o: [a, w + l, 2 * (w + l), a + 1].map((v) => `${v} m²`) }; },
  scale: () => { const sc = pick([2, 5, 10]), cm = pick([3, 4.5, 6, 7.5]); return { skill: 'math.multiply', v: doc('DRAWING SCALE', [`1 cm on the plan = ${sc} m in real life`]), q: `A wall is ${cm} cm long on the plan. How long is it really?`, a: `${cm * sc} m`, o: [cm * sc, cm + sc, cm, cm * sc / 2].map((v) => `${v} m`) }; },
  client: () => ({ skill: 'think.leadership', v: doc('CLIENT REQUEST', ['“More natural light, but the budget can’t change.”']), q: 'Best response?', a: 'Offer two options with their costs, and explain the trade-offs', o: ['Offer two options with their costs, and explain the trade-offs', 'Just add windows and bill them later', 'Say it is impossible'] }),
  clause: () => { const n = pick([14, 30, 60]); return { skill: 'read.documents', v: doc('LEASE · SECTION 7', [`Tenant must give ${n} days’ written notice before moving out.`]), q: 'Your client emailed notice 20 days before moving. Did they follow the lease?', a: n <= 20 ? 'Yes' : `No, they needed ${n} days`, o: ['Yes', `No, they needed ${n} days`, 'Leases don’t matter'] }; },
  evidence: () => ({ skill: 'think.evaluate', v: doc('CASE', ['A window was broken at 3:00 PM on Tuesday.']), q: 'Which evidence matters most?', a: 'A camera video from Tuesday at 3:00 PM', o: ['A camera video from Tuesday at 3:00 PM', 'What the neighbor ate for lunch', 'A photo from last year'] }),
  brief: () => ({ skill: 'write.professional', q: 'Which sentence is clearest for a judge?', a: 'The contract required payment by June 1, and payment arrived June 20.', o: ['The contract required payment by June 1, and payment arrived June 20.', 'They paid kinda late I guess.', 'EVERYONE KNOWS THEY WERE WRONG.'] }),
  lead: () => pick([
    { skill: 'think.leadership', q: 'Two of your team disagree about a deadline. What do you do first?', a: 'Listen to both, then agree on a plan together', o: ['Listen to both, then agree on a plan together', 'Pick a side quickly', 'Ignore it'] },
    { skill: 'think.leadership', q: 'A new teammate makes a mistake. Best response?', a: 'Show them how to fix it and why it matters', o: ['Show them how to fix it and why it matters', 'Embarrass them in front of everyone', 'Do it yourself and say nothing'] }]),
  consequence: () => ({ skill: 'think.consequence', q: 'You could skip paying the phone bill this week to buy concert tickets. What happens next week?', a: 'The bill is still due, plus a late fee', o: ['The bill is still due, plus a late fee', 'The bill disappears', 'Nothing'] }),
  vocab: () => pick([{ skill: 'read.vocab', q: 'What does “gross pay” mean?', a: 'Pay before taxes and deductions', o: ['Pay before taxes and deductions', 'Pay after taxes', 'A bonus'] }, { skill: 'read.vocab', q: 'What is a “shift”?', a: 'A block of time you are scheduled to work', o: ['A block of time you are scheduled to work', 'A kind of car', 'A day off'] }]),
  forms: () => ({ skill: 'write.forms', q: 'A form asks for “Date of birth (MM/DD/YYYY)”. Which is correct?', a: '04/09/2008', o: ['04/09/2008', 'April 9th', '9-4-08'] }),
  count: () => { const n = ri(3, 7), each = pick([4, 5, 6]); return { skill: 'math.count', q: `There are ${n} rows of cans with ${each} in each row. Count them all.`, a: String(n * each), o: [n * each, n + each, n * each - 1, n * each + each].map(String) }; },
  moneyQ: () => { const q = ri(1, 3), d = ri(1, 4), n = ri(0, 4); const v = q * 25 + d * 10 + n * 5; return { skill: 'fin.money', q: `${q} quarters, ${d} dimes and ${n} nickels. How much money?`, a: $(v / 100), o: [v, v + 5, v - 10, q + d + n].map((c) => $(c / 100)) }; },
  observe: () => ({ skill: 'think.observe', q: 'At the bus stop, the schedule says buses every 20 minutes. One just left at 8:10. When is the next?', a: '8:30', o: ['8:30', '8:20', '9:10'] }),
  paycheckQ: () => { const g = pick([300, 420, 600]); const net = Math.round(g * (1 - 0.0765)); return { skill: 'fin.paycheck', q: `Gross pay ${$(g)}. 7.65% goes to Social Security + Medicare. About how much do you keep?`, a: $(net), o: [net, g, Math.round(g * 0.0765), g + 20].map($) }; },
  bizQ: () => { const price = pick([3, 4, 5]), cost = pick([1, 1.5, 2]), fixed = pick([60, 90, 120]); const be = Math.ceil(fixed / (price - cost)); return { skill: 'fin.business', q: `Coffee sells for ${$(price)} and costs ${$(cost)} to make. The cart rent is ${$(fixed)} a week. Cups to break even?`, a: String(be), o: [be, Math.ceil(fixed / price), be + 10, fixed].map(String) }; },
  taxQ: () => T.tax(),
  algebraQ: () => T.solve(),
};
// Learn app: random practice for every skill (no money, just growth)
const BY_SKILL = {};
for (const [k, g] of Object.entries(T)) { try { const s = g().skill; (BY_SKILL[s] = BY_SKILL[s] || []).push(g); } catch (e) {} }
for (const [s, gens] of Object.entries(BY_SKILL)) { const old = PRACTICE[s]; PRACTICE[s] = () => { const all = old ? gens.concat([old]) : gens; const q = pick(all)(); return { q: q.v ? q.v.textContent.replace(/\s+/g, ' ').trim() + ' — ' + q.q : q.q, a: q.a, o: q.o }; }; }

// ------------------------------------------------------------------------------------------- careers → workplace + tasks
export const WORK = {
  courier: { place: ['midtown', 'express'], boss: ['Marisol', 'Midtown Express dispatcher'], tasks: ['address', 'delivery', 'note'], verb: 'Deliveries' },
  warehouse: { place: ['opportunity', 'logistics'], boss: ['Gus', 'Warehouse supervisor'], tasks: ['pallets', 'slip', 'truckFrac'], verb: 'Loading' },
  mechanic: { place: ['midtown', 'motors'], boss: ['Ray', 'Head mechanic'], tasks: ['manual', 'wrench', 'diagnose'], verb: 'Repairs' },
  cook: { place: ['midtown', 'kitchen'], boss: ['Chef Lou', 'Corner Kitchen'], tasks: ['recipe', 'orders', 'safety'], verb: 'Orders' },
  sales: { place: ['midtown', 'thread'], boss: ['Nadia', 'Thread & Co store manager'], tasks: ['discount', 'unitPrice', 'reply'], verb: 'Customers' },
  office: { place: ['opportunity', 'tower'], boss: ['Mr. Haddad', 'Office manager'], tasks: ['email', 'memo', 'schedule'], verb: 'Tasks' },
  construction: { place: ['opportunity', 'buildright'], boss: ['Jo', 'Site foreman'], tasks: ['measure', 'area', 'ladder'], verb: 'Jobs' },
  photo: { place: ['opportunity', 'lumen'], boss: ['Sol', 'Studio Lumen owner'], tasks: ['deposit', 'pricing', 'weather'], verb: 'Clients' },
  programmer: { place: ['opportunity', 'brightline'], boss: ['Priya', 'Lead developer'], tasks: ['solve', 'loop', 'bug'], verb: 'Tickets' },
  accountant: { place: ['opportunity', 'tower'], boss: ['Ms. Ledger', 'Ledger & Co'], tasks: ['tax', 'ledger', 'growth'], verb: 'Accounts' },
  health: { place: ['midtown', 'clinic'], boss: ['Nurse Kim', 'City Clinic'], tasks: ['meds', 'allergy', 'dose'], verb: 'Patients' },
  electrician: { place: ['opportunity', 'voltworks'], boss: ['Volt', 'Master electrician'], tasks: ['ohm', 'breaker', 'wire'], verb: 'Jobs' },
  engineer: { place: ['heights', 'engineering'], boss: ['Dr. Osei', 'Chief engineer'], tasks: ['load', 'tests', 'efficiency'], verb: 'Projects' },
  doctor: { place: ['heights', 'medical'], boss: ['Dr. Amara', 'Chief of medicine'], tasks: ['vitals', 'weightDose', 'nextQ'], verb: 'Patients' },
  architect: { place: ['heights', 'form'], boss: ['Theo', 'Principal architect'], tasks: ['room', 'scale', 'client'], verb: 'Designs' },
  lawyer: { place: ['heights', 'legal'], boss: ['Ms. Reyes', 'Managing partner'], tasks: ['clause', 'evidence', 'brief'], verb: 'Cases' },
};

/** One task card. Resolves {ok: firstTry}. Never timed; hints are free; a mistake shows the alternate explanation. */
export function runTask(G, gen, ctx, title = 'Task', icon = '🧩') {
  const Q = typeof gen === 'function' ? gen() : gen;
  G.edu.discover(Q.skill);
  let tries = 0;
  return UI.sheet(title, (close) => {
    const hp = helpBox(G, Q.skill);
    return h('div', { class: 'act' }, Q.v || null, h('p', { class: 'lead' }, Q.q), hp.box,
      h('div', { class: 'opts' }, shuffle([...new Set(Q.o)]).map((o) => h('button', { class: 'opt', onclick: (e) => {
        const ok = o === Q.a; tries++;
        G.edu.record(Q.skill, ok, { ctx, hinted: hp.hinted() || tries > 1 });
        if (ok) { G.sfx('good'); close({ ok: tries === 1 }); }
        else { G.sfx('bad'); G.state.stats.mistakes++; e.currentTarget.classList.add('wrong'); e.currentTarget.disabled = true; hp.box.hidden = false; hp.box.lastChild.textContent = G.edu.explain(Q.skill); }
      } }, o))), h('div', { class: 'row' }, hp.btn));
  }, { icon, noClose: true });
}

/** A full shift at any Tier 0–3 career. */
export async function workShift(G, career) {
  const s = G.state, W = WORK[career.id];
  const hours = career.hours || [4, 5, 6, 8][career.tier];
  if (s.time < 7 || s.time + hours > 22) { UI.toast(`${career.employer} is closed for new shifts now. Shifts run between 7 AM and 10 PM.`, 'info', 3500); return; }
  if (s.flags[`w_${career.id}_${s.day}`]) { UI.toast('You already worked this shift today. Rest up.', 'info'); return; }
  if (s.energy < 20) { UI.toast('You’re too tired to work safely. Eat or rest first.', 'warn'); return; }
  const raise = (s.raises || {})[career.id] || 0, rate = career.rate + raise;
  await UI.say(`${W.boss[0]} · ${W.boss[1]}`, pick([`Morning, ${s.name}. Three ${W.verb.toLowerCase()} on the board today.`, 'Good to see you. Take your time and get it right.', 'Here’s today’s list. Ask if you’re stuck.']));
  for (const k of W.tasks) await teach(G, T[k]().skill, W.boss[0]);
  let first = 0;
  for (let i = 0; i < W.tasks.length; i++) { const r = await runTask(G, T[W.tasks[i]], career.id, `${W.verb} · ${i + 1} of ${W.tasks.length}`, '🧰'); if (r && r.ok) first++; }
  G.advance(hours);
  s.flags[`w_${career.id}_${s.day}`] = true; s.flags[`worked${s.day}`] = true;
  s.stats.shifts++; s.workLog = s.workLog || {}; s.workLog[career.id] = (s.workLog[career.id] || 0) + 1;
  if (first === W.tasks.length) s.stats.perfectShifts = (s.stats.perfectShifts || 0) + 1;
  const bonus = first === W.tasks.length && career.tier >= 1 ? Math.round(rate * 0.5) : 0;
  const net = await paystub(G, hours, rate, bonus, career.employer.toUpperCase());
  G.earn(net, `${career.employer} pay`);
  G.befriend(W.boss[0], 0.5);
  const done = s.workLog[career.id];
  if (done % 5 === 0) {
    s.raises = s.raises || {}; s.raises[career.id] = raise + Math.max(1, Math.round(career.rate * 0.08));
    s.stats.promotions = (s.stats.promotions || 0) + 1; G.achieve('promoted');
    await UI.say(`${W.boss[0]} · ${W.boss[1]}`, `${done} shifts and you keep getting better. You’ve earned a raise: ${money(rate)} → ${money(career.rate + s.raises[career.id])} an hour.`);
  }
  G.save();
}

/** Applying for a job in a new district: requirements check, a professional application, a short interview. */
export async function apply(G, career) {
  const W = WORK[career.id], boss = `${W.boss[0]} · ${W.boss[1]}`;
  await UI.say(boss, `Thanks for coming in. Let’s see your application for ${career.title}.`);
  const r1 = await runTask(G, { skill: 'write.professional', q: 'Your application ends with one sentence about you. Which is best?', a: `I am reliable, I keep learning, and I would be proud to work at ${career.employer}.`, o: [`I am reliable, I keep learning, and I would be proud to work at ${career.employer}.`, 'i need money lol', 'Hire me or else.'] }, 'application', 'Application', '📝');
  const r2 = await runTask(G, T[W.tasks[0]], 'interview', 'Interview question', '🤝');
  await UI.say(boss, r1.ok && r2.ok ? 'That’s exactly what I was hoping to hear. You’re hired.' : 'You worked through that carefully. That matters more than getting it instantly. You’re hired. We’ll train you.');
  G.state.jobs.push(career.id); G.sfx('level'); G.achieve('hired');
  if (career.tier >= 2) G.achieve('career');
  if (career.tier >= 3) G.achieve('professional');
  UI.toast(`New job: ${career.title} · ${money(career.rate)}/h · Shifts at ${career.employer}`, 'good', 4200);
  G.save();
}

// ------------------------------------------------------------------------------------------- courses (study for professional careers)
export const COURSES = {
  code: { name: 'Intro to Programming', school: 'City Tech Institute', place: ['opportunity', 'bootcamp'], cost: 200, sessions: 4, tasks: ['solve', 'loop', 'bug', 'algebraQ'] },
  trades: { name: 'Electrical Safety & Basics', school: 'City Tech Institute', place: ['opportunity', 'bootcamp'], cost: 150, sessions: 3, tasks: ['ohm', 'breaker', 'wire'] },
  acct: { name: 'Accounting Basics', school: 'City Tech Institute', place: ['opportunity', 'bootcamp'], cost: 150, sessions: 3, tasks: ['tax', 'ledger', 'growth'] },
  eng: { name: 'Engineering Design', school: 'Heights College', place: ['heights', 'college'], cost: 500, sessions: 5, tasks: ['load', 'tests', 'efficiency', 'solve'] },
  med: { name: 'Pre-Medicine', school: 'Heights College', place: ['heights', 'college'], cost: 600, sessions: 6, tasks: ['vitals', 'weightDose', 'nextQ', 'allergy', 'dose'] },
  arch: { name: 'Architecture Studio', school: 'Heights College', place: ['heights', 'college'], cost: 400, sessions: 4, tasks: ['room', 'scale', 'client'] },
  law: { name: 'Law Foundations', school: 'Heights College', place: ['heights', 'college'], cost: 500, sessions: 5, tasks: ['clause', 'evidence', 'brief'] },
};
export async function school(G, where) {
  const s = G.state; s.courses = s.courses || {};
  const list = Object.entries(COURSES).filter(([, c]) => c.place[1] === where);
  const pickId = await UI.sheet(list[0][1].school, (close) => h('div', { class: 'act' },
    h('p', { class: 'lead' }, 'Study opens professional careers. One class session per course per day. No grades, no timers.'),
    h('div', { class: 'bill-list' }, list.map(([id, c]) => { const st = s.courses[id]; return h('div', { class: 'bill' + (st && st.done ? ' paid' : '') },
      h('div', {}, h('b', {}, c.name), h('small', {}, st ? (st.done ? 'Completed ✓ Certificate earned' : `Session ${st.n + 1} of ${c.sessions}`) : `${money(c.cost)} tuition · ${c.sessions} sessions`)),
      st && st.done ? h('span', { class: 'ok' }, '✓') : h('button', { class: 'primary sm', onclick: () => close(id) }, st ? 'Attend' : 'Enroll')); })),
    h('p', { class: 'tip' }, 'Tuition is an investment: you pay now so you can earn more later. Financial aid lowers the cost if you’ve been building your education.')), { icon: '🎓' });
  if (!pickId) return;
  const c = COURSES[pickId];
  if (!s.courses[pickId]) {
    const edu = G.life().scores.education, aid = edu >= 4 ? 0.5 : edu >= 2 ? 0.25 : 0, cost = Math.round(c.cost * (1 - aid));
    const ok = await UI.sheet('Enrollment', (close) => h('div', { class: 'act' },
      h('div', { class: 'budget' }, h('div', {}, h('small', {}, 'TUITION'), h('b', {}, money(c.cost))), h('div', {}, h('small', {}, 'FINANCIAL AID'), h('b', { class: 'pos' }, aid ? `−${aid * 100}%` : '—')), h('div', {}, h('small', {}, 'YOU PAY'), h('b', {}, money(cost)))),
      h('p', {}, aid ? 'Your learning record earned you financial aid.' : 'Keep practising in the Learn app: a stronger education record unlocks financial aid next time.'),
      h('button', { class: 'primary', onclick: () => close(true) }, `Pay ${money(cost)} and enroll`), h('button', { class: 'ghost', onclick: () => close(false) }, 'Not yet')), { icon: '🎓' });
    if (!ok) return;
    if (s.money < cost) { UI.toast(`You need ${money(cost)}. Save up and come back.`, 'warn'); return; }
    G.spend(cost, `${c.school}: ${c.name}`); s.courses[pickId] = { n: 0, last: 0 };
  }
  const st = s.courses[pickId];
  if (st.last === s.day) { UI.toast('You already attended this class today. Come back tomorrow.', 'info'); return; }
  if (s.time > 21) { UI.toast('Classes are over for tonight.', 'info'); return; }
  await UI.say(`Professor · ${c.school}`, pick(['Today we build on last time. Questions are welcome.', 'Mistakes are how we learn. Let’s begin.', 'Real professionals check their work. So will we.']));
  for (const k of shuffle(c.tasks).slice(0, 3)) await runTask(G, T[k], 'class', c.name, '🎓');
  G.advance(3); st.n++; st.last = s.day; s.stats.classes = (s.stats.classes || 0) + 1;
  if (st.n >= c.sessions) { st.done = true; G.sfx('level'); G.achieve('graduate'); await UI.say(`Professor · ${c.school}`, `Congratulations, ${s.name}. You’ve completed ${c.name}. Your certificate opens new careers.`); }
  else UI.toast(`Session ${st.n} of ${c.sessions} complete.`, 'good');
  G.save();
}
