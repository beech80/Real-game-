// REAL — the bigger world: districts, business ownership (Ch.9), vehicles & homes (Ch.8), pets, friends,
// challenge zones, savings, plush companions. Installed onto Game.prototype.
import { UI, h, money, wait } from './ui.js';
import * as A from './activities.js';
import { CAREERS, careerStatus } from './life.js';
import { WORK, T, runTask, workShift, apply, school, COURSES } from './careers.js';
import { DISTRICTS } from './districts.js';
import { readCode } from './plush.js';
import { askNPC } from './voice.js';
import { runActivity } from './learnkit.js';
import { GEN } from './curriculum.js';
import { SKILLS } from './edu.js';

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const r2 = (v) => Math.round(v * 100) / 100;

export const BUSINESSES = {
  coffee: { name: 'Coffee cart', icon: '☕', startup: 2000, unit: 1.2, price: 3.5, demand: 60, perish: true, desc: 'Cart $1,400 + espresso machine $600. Sells cups of coffee.' },
  bakery: { name: 'Bake stall', icon: '🥐', startup: 2500, unit: 0.9, price: 2.5, demand: 50, perish: true, desc: 'Stall $1,500 + oven $1,000. Sells pastries.' },
  bikes: { name: 'Bike repair', icon: '🚲', startup: 3000, unit: 4, price: 15, demand: 8, perish: false, desc: 'Workshop tools $2,200 + stand $800. Fixes bikes.' },
};
export const VEHICLES = {
  bike: { name: 'City bike', icon: '🚲', price: 150, weekly: 0, desc: 'No fuel, no insurance. Free rides between districts. Good exercise.' },
  scooter: { name: 'Electric scooter', icon: '🛵', price: 900, weekly: 14, desc: 'Charging $4/week + insurance $10/week.' },
  car: { name: 'Used car', icon: '🚗', price: 2500, weekly: 43, desc: 'Fuel $15/week + insurance $28/week + an oil change every 10 days.' },
};
export const HOMES = {
  starter: { name: 'The Starter Apartments', district: 'district', rent: 300, door: 'Door_ApartmentLobby' },
  loft: { name: 'Midtown Lofts', district: 'midtown', rent: 450, door: 'lofts', life: 4 },
  heights: { name: 'Heights Residences', district: 'heights', rent: 700, door: 'residences', life: 8 },
  owned: { name: 'Your condo in The Heights', district: 'heights', rent: 0, door: 'residences', price: 120000, down: 12000, mortgage: 226, pi: 166, life: 10 },   // 30-year loan of $108,000 at 7%: ≈ $166/week, plus ≈ $60/week property tax & insurance
};
export const PET_TYPES = { puppy: { name: 'Puppy', icon: '🐶', color: 0xc98a4a }, kitten: { name: 'Kitten', icon: '🐱', color: 0x8a8d96 }, bunny: { name: 'Bunny', icon: '🐰', color: 0xf1ece4 } };
export const PET_NAMES = ['Biscuit', 'Pepper', 'Mochi', 'Scout', 'Juniper', 'Pip', 'Waffles', 'Luna'];
export const ZONES = {
  money: { name: 'Money Maze', icon: '💰', gens: ['moneyQ', 'paycheckQ', 'bizQ', 'tax', 'growth'] },
  logic: { name: 'Logic Lab', icon: '🧠', gens: ['loop', 'bug', 'tests', 'evidence', 'consequence'] },
  words: { name: 'Word Works', icon: '📖', gens: ['vocab', 'forms', 'memo', 'clause', 'brief'] },
  numbers: { name: 'Number Forge', icon: '🔢', gens: ['count', 'pallets', 'measure', 'solve', 'ohm'] },
  life: { name: 'Life Skills Gauntlet', icon: '🏆', gens: ['delivery', 'allergy', 'discount', 'recipe', 'lead'] },
};
export const FRIENDS = {
  Marcus: { lines: ['Midtown never sleeps. Neither do my deliveries.', 'You’re the one who walked in from the old road? Respect.', 'Found a shortcut through the cross street today. Life’s good.'], favor: 'address', ask: 'Help me sort these packages?' },
  'Ms. Lindqvist': { lines: ['The library is free. That’s the best deal in the city.', 'Every book here was written by someone who once knew nothing about it.', 'The Learning Lab upstairs has challenge zones. No timers, I promise.'], favor: 'memo', ask: 'Could you help me read this notice for the board?' },
  Priya: { lines: ['I learned to code at the City Tech Institute at night.', 'Bugs are just puzzles that haven’t been solved yet.', 'Brightline hires people who can think, not people who already know everything.'], favor: 'loop', ask: 'Second pair of eyes on this code?' },
  'Coach Bo': { lines: ['Challenge zones are for growing, not for winning.', 'Hints aren’t cheating. Pros use them every day.', 'Take your time. Speed was never the point.'], favor: 'tests', ask: 'Help me pick the best training plan?' },
  'Dr. Amara': { lines: ['Medicine is years of study. Every one of them was worth it.', 'Rest is part of health. So is a good breakfast.', 'Heights College gives financial aid to people who keep learning.'], favor: 'vitals', ask: 'Can you double-check this chart?' },
  Theo: { lines: ['The Heights looks fancy. It was built by people who measured carefully.', 'Every building starts as a sketch and a question.', 'The view from Overlook Park is worth the bus fare.'], favor: 'scale', ask: 'Help me check a measurement?' },
};

export function installExpansion(Game) {
  const P = Game.prototype;

  // ---------------------------------------------------------------------------------- district doors
  P.districtInteraction = function (loc, pt) {
    const s = this.state, G = this;
    if (pt.key === 'bus') return { label: 'Bus stop', run: () => this.bus() };
    if (pt.key === 'bench') return { label: 'Sit and relax', run: () => { this.hooks.playerAnim('Sit', 4); s.mood = Math.min(100, s.mood + 10); this.advance(0.5); } };
    if (pt.key === 'overlook') return { label: 'Look out over the city', run: () => this.overlook() };
    if (pt.key === 'cart') return { label: `Run your ${s.biz ? BUSINESSES[s.biz.type].name.toLowerCase() : 'business'}`, run: () => this.runBusiness() };
    const careers = CAREERS.filter((c) => WORK[c.id] && WORK[c.id].place[0] === loc && WORK[c.id].place[1] === pt.key);
    const extras = {
      motors: [['🚗 Vehicles for sale', () => this.dealer()], s.vehicle ? ['🔧 Service my vehicle', () => this.serviceVehicle()] : null],
      lofts: [['🏢 Lease a loft', () => this.homeOffer('loft')], s.home === 'loft' ? ['🏠 Go home', () => this.hooks.enterApartment()] : null],
      residences: [['🏛️ Lease a residence', () => this.homeOffer('heights')], ['🔑 Buy a home', () => this.homeOffer('owned')], ['heights', 'owned'].includes(s.home) ? ['🏠 Go home', () => this.hooks.enterApartment()] : null],
      shelter: [[s.pet ? `🐾 Visit the shelter with ${s.pet.name}` : '🐾 Adopt a pet', () => this.shelter()]],
      library: [['🧩 Learning Lab challenge zones', () => this.challengeZones('library')], ['📕 Read a book', () => this.readBook()], ['📚 Study (free practice)', () => A.learn(G)]],
      thinktank: [['🏆 Challenge zones', () => this.challengeZones('thinktank')]],
      sbc: [['🚀 Small Business Center', () => this.sbc()], s.biz ? ['📈 Plan next week (forecast & marketing)', () => this.bizPlanWeek()] : null],
      bootcamp: [['🎓 Classes', () => school(G, 'bootcamp')]],
      college: [['🎓 Classes', () => school(G, 'college')]],
      bank: [['🏦 Banking, investing & credit', () => this.bank()]],
      thread: [['🧥 Shop jackets', () => this.clothing()]],
      kitchen: [['🍳 Eat at Corner Kitchen', () => A.menuBuy(G, 'Corner Kitchen', '🍳', [
        { name: 'Veggie omelette', price: 9.5, icon: '🍳', note: '+50 food, +mood', apply: () => { this.feed(50); s.mood += 6; s.stats.mealsEaten = (s.stats.mealsEaten || 0) + 1; this.advance(0.5); } },
        { name: 'Soup & bread', price: 6, icon: '🥣', note: '+35 food', apply: () => { this.feed(35); this.advance(0.4); } }])]],
      clinic: [['🩺 Free health check-up', () => this.checkup()]],
      medical: [['🩺 Health check-up', () => this.checkup()]],
    }[pt.key] || [];
    const sign = pt.sign, nice = sign.replace(/\b(\w)(\w*)/g, (m, a, b) => a + b.toLowerCase());
    if (pt.menu) return { label: nice, run: () => this.place(sign, careers, extras.filter(Boolean)) };
    return { label: `Enter ${nice}`, run: () => this.hooks.enterBuilding(loc, pt) };
  };
  /** Inside a building: the counter opens the jobs & services menu; stations are shortcuts. */
  P.buildingCounter = function (loc, pt) { const it = this.districtInteraction(loc, { ...pt, menu: true }); return it.run(); };
  P.station = async function (act, loc, key) {
    const s = this.state, G = this;
    const careers = CAREERS.filter((c) => WORK[c.id] && WORK[c.id].place[0] === loc && WORK[c.id].place[1] === key);
    const held = careers.filter((c) => s.jobs.includes(c.id));
    const acts = {
      work: async () => { if (!held.length) { UI.toast(careers.length ? 'You don’t work here yet. Apply at the counter.' : 'Staff only.', 'info', 3000); return; } const c = held.find((x) => !s.flags[`w_${x.id}_${s.day}`]) || held[0]; await workShift(G, c); },
      eat: () => A.menuBuy(G, 'Corner Kitchen', '🍳', [{ name: 'Veggie omelette', price: 9.5, icon: '🍳', note: '+50 food, +mood', apply: () => { this.feed(50); s.mood += 6; s.stats.mealsEaten = (s.stats.mealsEaten || 0) + 1; this.advance(0.5); } }, { name: 'Soup & bread', price: 6, icon: '🥣', note: '+35 food', apply: () => { this.feed(35); this.advance(0.4); } }]),
      cars: () => this.dealer(), checkup: () => this.checkup(), rack: () => this.clothing(), pets: () => this.shelter(),
      home: () => this.homeOffer(key === 'lofts' ? 'loft' : 'heights'), study: () => this.readBook(), zones: () => this.challengeZones(key), savings: () => this.bank(),
      sit: () => { this.hooks.playerAnim('Sit', 4); s.mood = Math.min(100, s.mood + 8); this.advance(0.4); },
      door: () => { const it = this.interaction({ key }); return it && it.run(); },
      class: () => school(G, key), mail: () => UI.toast(s.messages.length ? `Mail: ${s.messages[0].from} — “${s.messages[0].text.slice(0, 60)}…”` : 'No mail today.', 'info', 3600),
    };
    if (acts[act]) await acts[act]();
  };
  P.place = async function (title, careers, extras) {
    const s = this.state, ll = this.life().level, G = this;
    const go = await UI.sheet(title, (close) => h('div', { class: 'act' },
      careers.length ? h('div', { class: 'tier-h' }, 'Jobs here') : null,
      h('div', { class: 'bill-list' }, careers.map((c) => {
        const st = careerStatus(c, s, G.edu, ll), worked = s.flags[`w_${c.id}_${s.day}`], rate = c.rate + ((s.raises || {})[c.id] || 0);
        return h('div', { class: 'bill' + (st.held ? ' paid' : '') }, h('div', {}, h('b', {}, `${c.title} · Tier ${c.tier}`), h('small', {}, st.held ? (worked ? 'Shift done today ✓' : `${money(rate)}/h · ${c.hours || [4, 5, 6, 8][c.tier]}-hour shift`) : st.ready ? c.desc : 'Needs: ' + st.missing.join(' · '))),
          st.held ? (worked ? h('span', { class: 'ok' }, '✓') : h('button', { class: 'primary sm', onclick: () => close(['work', c]) }, 'Work')) : st.ready ? h('button', { class: 'primary sm', onclick: () => close(['apply', c]) }, 'Apply') : h('span', { class: 'amt' }, `$${c.rate}`));
      })),
      extras.length ? h('div', { class: 'opts' }, extras.map(([label, fn]) => h('button', { class: 'opt', onclick: () => close(['x', fn]) }, label))) : null,
      careers.some((c) => !careerStatus(c, s, G.edu, ll).ready && !careerStatus(c, s, G.edu, ll).held) ? h('p', { class: 'tip' }, 'Skills grow by practising in the Learn app and at work. Courses are at the City Tech Institute and Heights College.') : null), { icon: '🏢' });
    if (!go) return;
    if (go[0] === 'work') await workShift(G, go[1]);
    else if (go[0] === 'apply') await apply(G, go[1]);
    else await go[1]();
  };

  // ---------------------------------------------------------------------------------- bus & travel
  P.bus = async function () {
    const s = this.state, ll = this.life().level, here = s.location;
    const v = s.vehicle && VEHICLES[s.vehicle.type];
    const stops = [['district', 'Starting District', 1, 'Home of Fresh Mart, the Community Center and Brighter Park.'], ...Object.entries(DISTRICTS).map(([id, d]) => [id, d.name, d.life, d.tag])];
    const go = await UI.sheet('Route 1 · Bus schedule', (close) => h('div', { class: 'act' },
      h('p', { class: 'lead' }, 'Starting District ⇄ Midtown ⇄ Opportunity District ⇄ The Heights ⇄ The Club'),
      h('div', { class: 'bill-list' }, stops.map(([id, n, lv, tag]) => h('div', { class: 'bill' + (id === here ? ' paid' : '') },
        h('div', {}, h('b', {}, n), h('small', {}, id === here ? 'You are here.' : ll >= lv ? tag : `Grow to Life Level ${lv} to find opportunities here.`)),
        id === here ? h('span', { class: 'ok' }, '●') : ll >= lv ? h('button', { class: 'primary sm', onclick: () => close(id) }, v ? `${v.icon} Go` : '$2.00') : h('span', { class: 'amt' }, `LL ${lv}`))),
        h('div', { class: 'bill' }, h('div', {}, h('b', {}, '♛ The Club'), h('small', {}, s.flags.invited && !s.ending ? 'You have been invited.' : s.ending ? 'You’ve made your decision. The city is your home.' : 'Members and invited guests only.')),
          s.flags.invited && !s.ending ? h('button', { class: 'primary sm', onclick: () => close('club') }, 'Ride') : h('span', { class: 'amt' }, '—'))),
      h('p', { class: 'tip' }, v ? `You own a ${v.name.toLowerCase()}: no bus fare.` : 'Buses run every 20 minutes from 6:00 AM to 11:40 PM. A bus pass costs less than a car, but a car can save time.')), { icon: '🚌' });
    this.edu.discover('read.signs');   // seeing the map introduces the skill; credit comes from answering questions
    if (!go) return;
    if (!v) { if (s.money < 2) { UI.toast('The fare is $2. You don’t have enough.', 'warn'); return; } this.spend(2, 'Bus fare'); }
    if (go === 'club') { await this.hooks.goToClub(); return; }
    this.advance(v && s.vehicle.type === 'car' ? 0.25 : 0.4);
    if (v && s.vehicle.type === 'car') s.vehicle.km = (s.vehicle.km || 0) + 8;
    await this.hooks.travel(go);
    s.visited = s.visited || {}; s.visited[go] = true;
    if (['midtown', 'opportunity', 'heights'].every((k) => s.visited[k])) this.achieve('explorer');
    if (go !== 'district' && !s.flags['intro_' + go]) { s.flags['intro_' + go] = true; const D = DISTRICTS[go]; UI.caption([`${D.name}.`, D.tag, 'Every career here is open to you. What unlocks it is what you learn.'], 2400); }
    this.save();
  };
  P.overlook = async function () {
    const s = this.state; s.mood = Math.min(100, s.mood + 15); this.advance(0.3);
    await UI.caption(['From up here you can see all of it.', 'The Starting District. Midtown. The towers of Opportunity.', 'And far away, the old road where you started.'], 2600);
  };
  /** One short lesson from a subject, at the player's own working level (and not the one they just did). */
  P.lessonIn = async function (subj, ctx, title, icon, filter = () => true) {
    const b = this.edu.band(subj), last = this.state.flags[`lastLesson_${subj}`];
    const pool = Object.values(SKILLS).filter((k) => k.subj === subj && GEN[k.id] && filter(k)).sort((x, y) => Math.abs(x.band - b) - Math.abs(y.band - b) || (this.edu.state(x.id) - this.edu.state(y.id)));
    if (!pool.length) return;
    const near = pool.filter((k) => Math.abs(k.band - pool[0].band) <= 1 && k.id !== last);
    const k = (near.length ? near : pool)[Math.floor(Math.random() * Math.min(3, (near.length ? near : pool).length))];
    this.state.flags[`lastLesson_${subj}`] = k.id;
    await runActivity(this, () => ({ skill: k.id, ...GEN[k.id][Math.floor(Math.random() * GEN[k.id].length)]() }), ctx, title || k.name, icon);
  };
  P.checkup = async function () {
    const s = this.state;
    await UI.say('Nurse Kim · City Clinic', `Energy ${Math.round(s.energy)}, food ${Math.round(s.hunger)}, mood ${Math.round(s.mood)}. ${s.hunger < 40 ? 'Eat regular meals. Cooking at home is cheaper and healthier.' : 'You’re eating well.'} ${s.energy < 40 ? 'Sleep is part of health. Get to bed before midnight.' : 'Rested and ready.'}`);
    s.stats.checkups = (s.stats.checkups || 0) + 1; s.stats.goodNights = (s.stats.goodNights || 0) + 0.5;
    await UI.say('Nurse Kim · City Clinic', 'Before you go, one quick health question. Knowing this keeps you and your friends well.');
    await this.lessonIn('health', 'clinic', 'Health check', '🩺');
  };

  // ---------------------------------------------------------------------------------- Ch.9: owning a business
  P.sbc = async function () {
    const s = this.state, G = this;
    if (s.biz) {
      const b = s.biz, B = BUSINESSES[b.type];
      const c = await UI.sheet('Small Business Center', (close) => h('div', { class: 'act' },
        h('div', { class: 'budget' }, h('div', {}, h('small', {}, 'DAYS OPEN'), h('b', {}, b.days)), h('div', {}, h('small', {}, 'PROFIT'), h('b', { class: b.profit >= 0 ? 'pos' : 'neg' }, money(b.profit))), h('div', {}, h('small', {}, 'REPUTATION'), h('b', {}, '★'.repeat(Math.round(b.rep / 2)) || '—'))),
        h('div', { class: 'opts' },
          h('button', { class: 'opt', onclick: () => close('hire') }, b.staff.length < 3 ? '👥 Hire an employee' : '👥 Team (3/3)'),
          !b.store ? h('button', { class: 'opt', onclick: () => close('store') }, '🏪 Open a storefront in Midtown') : null,
          b.loan > 0 ? h('button', { class: 'opt', onclick: () => close('repay') }, `💳 Repay loan early (${money(b.loan)} left)`) : null,
          h('button', { class: 'opt', onclick: () => close('run') }, `${B.icon} Run today`)),
        h('p', { class: 'tip' }, 'Owners decide: price, supplies, staff and growth. Every decision is a trade-off.')), { icon: '🚀' });
      if (c === 'hire') return this.hire(); if (c === 'store') return this.storefront(); if (c === 'run') return this.runBusiness();
      if (c === 'repay') { const pay = Math.min(s.money, b.loan); if (pay <= 0) return; this.spend(pay, 'Business loan repayment'); b.loan = r2(b.loan - pay); s.bills = s.bills.filter((x) => !(x.id.startsWith('bizloan') && !x.paid) || b.loan > 0); UI.toast(b.loan > 0 ? `${money(b.loan)} left on the loan.` : 'Loan paid off. No more interest!', 'good'); this.save(); }
      return;
    }
    if (!s.achievements.plan) {
      await UI.say('Advisor · Small Business Center', 'Every business here starts with a plan. Write one in your phone’s Business app, then come back and we’ll register it.');
      return;
    }
    const type = await UI.sheet('Start a business', (close) => h('div', { class: 'act' },
      h('p', { class: 'lead' }, 'Pick a business. Registration (license) costs $50.'),
      h('div', { class: 'bill-list' }, Object.entries(BUSINESSES).map(([id, b]) => h('div', { class: 'bill' }, h('div', {}, h('b', {}, `${b.icon} ${b.name}`), h('small', {}, `${b.desc} Startup ${money(b.startup)}.`)), h('button', { class: 'primary sm', onclick: () => close(id) }, 'Choose'))))), { icon: '🚀' });
    if (!type) return;
    const B = BUSINESSES[type], need = B.startup + 50;
    await runTask(G, { skill: 'fin.business', q: `Startup ${money(B.startup)} + license $50. What is the total you need to start?`, a: money(need), o: [money(need), money(B.startup), money(need + 50), money(B.startup - 50)] }, 'business', 'Startup costs', '🧮');
    const how = await UI.sheet('Funding', (close) => h('div', { class: 'act' },
      h('p', { class: 'lead' }, `You need ${money(need)}. You have ${money(s.money)}.`),
      h('div', { class: 'opts' },
        h('button', { class: 'opt', disabled: s.money < need, onclick: () => close('cash') }, `Pay with savings (${money(need)})`),
        h('button', { class: 'opt', disabled: s.money < 200, onclick: () => close('loan') }, `Pay $200 now + small business loan of ${money(need - 200)} (flat 10% fee, 20 weekly payments ≈ 48% APR)`)),
      h('p', { class: 'tip' }, `A loan lets you start sooner, but you pay back more: ${money(r2((need - 200) * 1.1))} in total over 20 weeks. A flat 10% fee on a loan that lasts only 20 weeks works out to about 48% APR: always compare the APR, not just the fee.`)), { icon: '🏦' });
    if (!how) return;
    if (how === 'cash') this.spend(need, `${B.name}: startup + license`);
    else {
      this.spend(200, `${B.name}: down payment`); const owed = r2((need - 200) * 1.1);
      s.bills.push({ id: 'bizloan1', name: 'Business loan payment', amount: r2(owed / 20), due: s.day + 7, paid: false, recur: r2(owed / 20), period: 7, left: 19 });
      this.edu.discover('fin.credit');
      s.bizLoan = owed;
    }
    const name = await UI.sheet('Name your business', (close) => h('div', { class: 'opts' }, [`${s.name}’s ${B.name}`, `REAL ${B.name}`, `Fresh Start ${B.name}`, `${['Sunrise', 'Corner', 'Main St'][ri(0, 2)]} ${B.name}`].map((n) => h('button', { class: 'opt', onclick: () => close(n) }, n))), { icon: '✏️', noClose: true });
    s.biz = { type, name, days: 0, price: B.price, profit: 0, revenue: 0, rep: 3, staff: [], store: false, loan: how === 'loan' ? s.bizLoan : 0, last: 0, log: [] };
    s.stats.businessSteps = (s.stats.businessSteps || 0) + 2; this.achieve('owner'); this.sfx('level');
    await UI.say('Advisor · Small Business Center', `${name} is registered. Your ${B.name.toLowerCase()} is set up in Brighter Park, back in the Starting District. Run it from there, or from the Business app. Hire staff here when you’re ready.`);
    this.hooks.refreshWorld && this.hooks.refreshWorld();
    this.save();
  };
  P.runBusiness = async function () {
    const s = this.state, b = s.biz, G = this; if (!b) return;
    const B = BUSINESSES[b.type];
    if (b.last === s.day) { UI.toast('You already opened today. See the daily report in the Business app.', 'info'); return; }
    if (s.time > 19 || s.time < 6) { UI.toast('Customers come between 6 AM and 7 PM.', 'info'); return; }
    const weather = pick([['☀️ Sunny', 1.15], ['⛅ Cloudy', 1], ['🌧️ Rainy', b.type === 'coffee' ? 1.1 : 0.75], ['🍂 Cool', b.type === 'coffee' ? 1.2 : 0.95]]);
    const expected = Math.round(B.demand * (1 + b.rep * 0.05) * (b.store ? 2.2 : 1) * (1 + b.staff.length * 0.15));
    // 1) supplies
    const qty = await UI.sheet('Buy supplies', (close) => h('div', { class: 'act' },
      h('div', { class: 'doc' }, h('div', { class: 'doc-h' }, `TODAY · ${weather[0]}`), h('div', { class: 'doc-l' }, `Usually about ${expected} customers on a day like this.`), h('div', { class: 'doc-l' }, `Supplies cost ${money(B.unit)} per ${b.type === 'bikes' ? 'repair' : 'item'}.${B.perish ? ' Leftovers spoil tonight.' : ''}`)),
      h('p', { class: 'lead' }, 'How much will you buy?'),
      h('div', { class: 'opts' }, [0.6, 0.85, 1, 1.25].map((f) => { const n = Math.max(2, Math.round(expected * f)); return h('button', { class: 'opt', onclick: () => close(n) }, `${n} · ${money(n * B.unit)}`); }))), { icon: B.icon, noClose: true });
    if (s.money < qty * B.unit) { UI.toast(`Supplies cost ${money(qty * B.unit)}. You have ${money(s.money)}.`, 'warn'); return; }
    // 2) price
    const price = await UI.sheet('Set your price', (close) => h('div', { class: 'act' },
      h('p', { class: 'lead' }, `Each one costs you ${money(B.unit)}. What will you charge?`),
      h('div', { class: 'opts' }, [-0.5, 0, 0.5, 1].map((d) => { const p = r2(B.price * (1 + d * (b.type === 'bikes' ? 0.3 : 0.2))); return h('button', { class: 'opt', onclick: () => close(p) }, `${money(p)} · profit ${money(p - B.unit)} each`); })),
      h('p', { class: 'tip' }, 'Higher prices earn more per sale, but fewer people buy. Lower prices bring more customers.')), { icon: '🏷️', noClose: true });
    this.spend(r2(qty * B.unit), `${b.name}: supplies`);
    const demand = Math.round(expected * weather[1] * Math.pow(B.price / price, 1.6) * (0.9 + Math.random() * 0.2));
    const sold = Math.min(qty, demand), revenue = r2(sold * price), wages = b.staff.reduce((a, e) => a + e.wage * 4, 0), cost = r2(qty * B.unit + wages + (b.store ? 30 : 0));
    const profit = r2(revenue - cost);
    this.advance(b.staff.length ? 1 : 3);
    // 3) the owner works out the day
    await runTask(G, { skill: 'fin.business', v: h('div', { class: 'doc' }, h('div', { class: 'doc-h' }, 'END OF DAY'), h('div', { class: 'doc-l' }, `Sold ${sold} × ${money(price)} = ${money(revenue)}`), h('div', { class: 'doc-l' }, `Costs: supplies ${money(qty * B.unit)}${wages ? ` + wages ${money(wages)}` : ''}${b.store ? ' + store rent $30' : ''} = ${money(cost)}`)),
      q: 'What was today’s profit?', a: money(profit), o: [money(profit), money(revenue), money(r2(profit + 10)), money(r2(-profit))] }, 'business', 'Daily report', '📈');
    this.earn(revenue, `${b.name}: sales`); if (wages) s.stats.payrollRuns = (s.stats.payrollRuns || 0) + 1;
    b.days++; b.last = s.day; b.profit = r2(b.profit + profit); b.revenue = r2(b.revenue + revenue); b.price = price;
    b.rep = Math.max(0, Math.min(10, b.rep + (sold >= demand ? 0.4 : 0.2) - (sold < demand * 0.7 ? 0.3 : 0) + (price <= B.price ? 0.2 : 0)));
    b.log.unshift({ day: s.day, sold, demand, revenue, profit }); b.log = b.log.slice(0, 14);
    s.stats.businessSteps = (s.stats.businessSteps || 0) + 0.5;
    if (b.profit >= 500) this.achieve('profit');
    const lesson = demand > qty ? `You ran out: ${demand - qty} customers left empty-handed. Buy a little more on days like this.` : qty - sold > qty * 0.2 && B.perish ? `${qty - sold} unsold items spoiled. That’s money lost. Buy closer to demand.` : 'Supplies matched demand well.';
    await UI.say(`${B.icon} ${b.name}`, `${sold} sold. Profit today: ${money(profit)}. ${lesson}`);
    this.save();
  };
  P.hire = async function () {
    const s = this.state, b = s.biz, G = this;
    if (b.staff.length >= 3) { UI.toast('Your team is full.', 'info'); return; }
    const cands = [['Sam', 'Reliable, 2 years of café work', 16], ['Ana', 'New to work, eager to learn', 15], ['Lee', 'Great with customers, wants weekends only', 17]].filter(([n]) => !b.staff.some((e) => e.name === n));
    const c = await UI.sheet('Hire an employee', (close) => h('div', { class: 'act' },
      h('p', { class: 'lead' }, 'Employees add capacity and run the business on days you don’t. You pay wages every day they work (4 hours).'),
      h('div', { class: 'bill-list' }, cands.map(([n, d, w]) => h('div', { class: 'bill' }, h('div', {}, h('b', {}, n), h('small', {}, `${d} · ${money(w)}/h`)), h('button', { class: 'primary sm', onclick: () => close([n, w]) }, 'Hire'))))), { icon: '👥' });
    if (!c) return;
    await runTask(G, { skill: 'math.multiply', q: `${c[0]} works 4 hours a day at ${money(c[1])}/h. What is the daily wage?`, a: money(c[1] * 4), o: [money(c[1] * 4), money(c[1]), money(c[1] * 8), money(c[1] + 4)] }, 'payroll', 'Payroll', '🧮');
    b.staff.push({ name: c[0], wage: c[1] }); this.achieve('boss'); this.befriend(c[0], 1);
    UI.toast(`${c[0]} joins ${b.name}. Your business now runs on days you’re busy (from the Business app overnight report).`, 'good', 4200); this.save();
  };
  P.storefront = async function () {
    const s = this.state, b = s.biz;
    if (b.days < 5 || b.rep < 5) { UI.toast(`Landlords want 5+ days of sales and ★★★ reputation first (${b.days} days, ${'★'.repeat(Math.round(b.rep / 2)) || 'no stars'}).`, 'info', 4200); return; }
    if (s.money < 300) { UI.toast('A storefront needs a $300 deposit.', 'warn'); return; }
    this.spend(300, `${b.name}: storefront deposit`); b.store = true; s.stats.businessSteps = (s.stats.businessSteps || 0) + 2;
    UI.toast('Storefront open in Midtown: more than twice the customers, plus $30/day rent.', 'good', 4000); this.save();
  };
  /** Overnight: staff run the business on days you didn't. */
  P.bizOvernight = function () {
    const s = this.state, b = s.biz; if (!b || !b.staff.length || b.last === s.day) return null;
    const B = BUSINESSES[b.type], expected = Math.round(B.demand * (1 + b.rep * 0.05) * (b.store ? 2.2 : 1) * (1 + b.staff.length * 0.15) * (0.85 + Math.random() * 0.25));
    const qty = expected, sold = Math.round(qty * 0.92), revenue = r2(sold * b.price), cost = r2(qty * B.unit + b.staff.reduce((a, e) => a + e.wage * 4, 0) + (b.store ? 30 : 0)), profit = r2(revenue - cost);
    s.money = r2(s.money + profit); s.bank.unshift({ day: s.day, desc: `${b.name}: day run by your team`, amt: profit }); if (profit > 0) s.stats.earned += profit;
    b.days++; b.last = s.day; b.profit = r2(b.profit + profit); b.log.unshift({ day: s.day, sold, demand: expected, revenue, profit, team: true });
    if (b.profit >= 500) this.achieve('profit');
    return `${b.name}: your team sold ${sold}. Profit ${money(profit)}.`;
  };

  // ---------------------------------------------------------------------------------- Ch.8: vehicles
  P.dealer = async function () {
    const s = this.state, G = this;
    const c = await UI.sheet('Midtown Motors', (close) => h('div', { class: 'act' },
      h('p', { class: 'lead' }, 'The price tag is only the start. Fuel, insurance and maintenance cost money every week.'),
      h('div', { class: 'bill-list' }, Object.entries(VEHICLES).map(([id, v]) => h('div', { class: 'bill' + (s.vehicle && s.vehicle.type === id ? ' paid' : '') }, h('div', {}, h('b', {}, `${v.icon} ${v.name} · ${money(v.price)}`), h('small', {}, v.desc)),
        s.vehicle && s.vehicle.type === id ? h('span', { class: 'ok' }, 'Yours') : h('button', { class: 'primary sm', onclick: () => close(id) }, 'Look'))))), { icon: '🚗' });
    if (!c) return;
    const v = VEHICLES[c];
    await runTask(G, { skill: 'fin.budget', q: `${v.name}: ${money(v.weekly)} a week to run. How much is that over 4 weeks?`, a: money(v.weekly * 4), o: [money(v.weekly * 4), money(v.weekly), money(v.weekly * 7), money(v.weekly + 4)] }, 'vehicle', 'Total cost of owning', '🧮');
    const finance = c === 'car';
    const how = await UI.sheet(v.name, (close) => h('div', { class: 'act' },
      h('div', { class: 'opts' },
        h('button', { class: 'opt', disabled: s.money < v.price, onclick: () => close('cash') }, `Pay ${money(v.price)} in full`),
        finance ? h('button', { class: 'opt', disabled: s.money < 300, onclick: () => close('loan') }, 'Finance: $300 down + $55/week for 45 weeks') : null),
      finance ? h('p', { class: 'tip' }, `Financing total: $300 + 45 × $55 = ${money(300 + 45 * 55)}. That’s ${money(300 + 45 * 55 - v.price)} more than the price: the cost of borrowing. This loan’s APR is about 27%, which is high. Car loans from a bank or credit union are often 5–10% APR. Always compare the APR.`) : null,
      s.money < v.price && !finance ? h('p', { class: 'warnline' }, `You need ${money(v.price - s.money)} more. Save up and come back.`) : null), { icon: v.icon });
    if (!how) return;
    if (how === 'loan') { await runTask(G, { skill: 'fin.credit', q: 'Financing costs $2,775 in total. The cash price is $2,500. How much is the interest?', a: '$275', o: ['$275', '$2,775', '$55', '$300'], why: '$2,775 − $2,500 = $275. That extra is the cost of borrowing.' }, 'vehicle', 'Read the loan', '📄'); this.spend(300, 'Car down payment'); s.bills.push({ id: 'carloan1', name: 'Car loan payment', amount: 55, due: s.day + 7, paid: false, recur: 55, period: 7, left: 44 }); }
    else this.spend(v.price, v.name);
    if (s.vehicle) s.bills = s.bills.filter((b) => !(b.id.startsWith('veh') && !b.paid));
    s.vehicle = { type: c, bought: s.day, service: s.day, km: 0 };
    if (v.weekly) s.bills.push({ id: 'veh1', name: `${v.name}: fuel & insurance`, amount: v.weekly, due: s.day + 7, paid: false, recur: v.weekly, period: 7 });
    this.achieve('wheels'); this.sfx('level'); UI.toast(`${v.icon} The ${v.name.toLowerCase()} is yours. No more bus fares.`, 'good', 3800);
    this.hooks.refreshWorld && this.hooks.refreshWorld(); this.save();
  };
  P.serviceVehicle = async function () {
    const s = this.state, v = s.vehicle; if (!v) return;
    const cost = v.type === 'car' ? 40 : v.type === 'scooter' ? 20 : 8, due = s.day - v.service;
    await UI.say('Ray · Midtown Motors', due >= 10 ? 'You’re overdue. Skipping maintenance is how a $40 job becomes a $250 repair.' : 'Regular service keeps small problems small.');
    if (s.money < cost) { UI.toast(`Service costs ${money(cost)}.`, 'warn'); return; }
    this.spend(cost, 'Vehicle service'); v.service = s.day; v.broken = false; s.stats.wiseChoices = (s.stats.wiseChoices || 0) + 0.5; UI.toast('Serviced. Good for 10 days.', 'good'); this.save();
  };

  // ---------------------------------------------------------------------------------- Ch.8: better homes
  P.homeOffer = async function (id) {
    const s = this.state, H = HOMES[id], G = this, ll = this.life().level;
    if (s.home === id) { UI.toast('You already live here.', 'info'); return; }
    if (ll < H.life) { UI.toast(`Grow to Life Level ${H.life} first.`, 'info'); return; }
    const weekIncome = s.bank.filter((t) => t.amt > 0 && t.day > s.day - 7).reduce((a, t) => a + t.amt, 0);
    if (id === 'owned') {
      await UI.say('Agent · Heights Residences', `A condo of your own: ${money(H.price)}. You need 10% down (${money(H.down)}). The bank lends the other ${money(H.price - H.down)} at 7% APR for 30 years: about ${money(H.pi)} a week, plus about $60 a week for property tax and insurance. Save for repairs too: owners pay for them, not a landlord.`);
      await runTask(G, { skill: 'math.percent', q: `10% of ${money(H.price)} is the down payment. How much?`, a: money(H.down), o: [money(H.down), money(H.price / 100), money(H.down * 2), money(H.price - H.down)] }, 'home', 'Down payment', '🧮');
      if (s.money < H.down) { UI.toast(`Save ${money(H.down - s.money)} more for the down payment.`, 'warn'); return; }
      this.spend(H.down, 'Home down payment'); s.mortgage = { bal: H.price - H.down, apr: 7, pi: H.pi };
    } else {
      await UI.say(`Leasing office · ${H.name}`, `Rent is ${money(H.rent)} a week. Like most landlords, we ask that you earn at least 2.5 times the rent (many ask for 3 times). You earned ${money(weekIncome)} in the last 7 days. (Spending more than 30% of income on rent is called being rent-burdened.)`);
      if (weekIncome < H.rent * 2.5) { await UI.say(`Leasing office · ${H.name}`, `Come back when you earn ${money(H.rent * 2.5)} a week. A second job or a better career will get you there.`); return; }
      await runTask(G, T.clause, 'lease', 'Read the lease', '📄');
      if (s.money < H.rent) { UI.toast(`You need a deposit of ${money(H.rent)}.`, 'warn'); return; }
      this.spend(H.rent, `${H.name}: deposit`);
    }
    s.bills = s.bills.filter((b) => !(b.id.startsWith('rent') && !b.paid));
    const n = (s.rentWeek || 2) + 1; s.rentWeek = n;
    const amt = id === 'owned' ? H.mortgage : H.rent;
    s.bills.push({ id: 'rent' + n, name: id === 'owned' ? 'Mortgage + property tax & insurance' : `Rent — ${H.name}`, amount: amt, due: s.day + 7, paid: false, recur: amt, period: 7 });
    s.home = id; s.rent = amt; this.achieve(id === 'owned' ? 'homeowner' : 'moved_up'); this.sfx('level');
    await UI.say(id === 'owned' ? 'Agent · Heights Residences' : `Leasing office · ${H.name}`, 'Here are your keys. Welcome home.');
    this.save(); await this.hooks.enterApartment();
  };

  // ---------------------------------------------------------------------------------- pets
  P.shelter = async function () {
    const s = this.state, G = this;
    if (s.pet) { await UI.say('Jo · Paws & Friends', `${s.pet.name} looks ${s.pet.bond >= 6 ? 'so happy' : 'healthy'}! Keep up the walks, food and play.`); return; }
    await UI.say('Jo · Paws & Friends', 'A pet is a promise: food every day, walks, play and care. It costs $60 to adopt and about $12 a week after that.');
    const t = await UI.sheet('Adopt', (close) => h('div', { class: 'act' }, h('div', { class: 'cards' }, Object.entries(PET_TYPES).map(([id, p]) => h('button', { class: 'card', onclick: () => close(id) }, h('span', { class: 'big-emoji' }, p.icon), h('b', {}, p.name)))),
      h('p', { class: 'tip' }, 'Every pet here needs a good home.')), { icon: '🐾' });
    if (!t) return;
    await runTask(G, { skill: 'fin.budget', q: 'Pet care is $12 a week. How much is that for a year (52 weeks)?', a: '$624', o: ['$624', '$120', '$52', '$1,200'] }, 'pet', 'Can I afford it?', '🧮');
    if (s.money < 60) { UI.toast('Adoption costs $60.', 'warn'); return; }
    const name = await UI.sheet('Name your pet', (close) => h('div', { class: 'opts' }, PET_NAMES.map((n) => h('button', { class: 'opt', onclick: () => close(n) }, n))), { icon: PET_TYPES[t].icon, noClose: true });
    this.spend(60, 'Pet adoption'); s.pet = { type: t, name, bond: 1, fed: s.day, played: 0, walked: 0 };
    s.bills.push({ id: 'pet1', name: `${name}: food & care`, amount: 12, due: s.day + 7, paid: false, recur: 12, period: 7 });
    this.achieve('pet'); this.sfx('level'); this.hooks.refreshWorld && this.hooks.refreshWorld();
    UI.toast(`${name} is coming home with you! Feed ${name} at home every day.`, 'good', 4000); this.save();
  };
  P.petCare = async function (what) {
    const s = this.state, p = s.pet; if (!p) return;
    if (what === 'feed') { if (p.fed === s.day) { UI.toast(`${p.name} already ate today.`, 'info'); return; } p.fed = s.day; p.bond = Math.min(10, p.bond + 0.3); UI.toast(`${p.name} munches happily.`, 'good'); }
    else if (what === 'play') { if (p.played === s.day) { UI.toast(`${p.name} is happily tired.`, 'info'); return; } p.played = s.day; p.bond = Math.min(10, p.bond + 0.6); s.mood = Math.min(100, s.mood + 10); this.advance(0.3); this.hooks.petTrick && this.hooks.petTrick(); UI.toast(`You play with ${p.name}. +Mood`, 'good'); }
    this.save();
  };

  // ---------------------------------------------------------------------------------- friends in the districts
  P.talkFriend = async function (id, role) {
    const s = this.state, F = FRIENDS[id], lvl = s.friends[id] || 0;
    const who = `${id} · ${role}`;
    const c = await UI.say(who, lvl < 1 ? `Hey, I don’t think we’ve met. I’m ${id}.` : pick(F.lines), lvl >= 1 && s.flags[`favor_${id}_${s.day}`] !== true ? ['Chat', F.ask.replace(/\?$/, '') + '? (help out)', '💬 Ask a question', 'See you later'] : ['Chat', '💬 Ask a question', 'See you later']);
    const asked = (lvl >= 1 && s.flags[`favor_${id}_${s.day}`] !== true) ? c === 2 : c === 1;
    if (asked) { await askNPC(this, { name: id }); return; }
    if (c === 0) { await UI.say(who, pick(F.lines)); this.befriend(id, lvl < 1 ? 1 : 0.2); }
    else if (c === 1 && lvl >= 1) { await UI.say(who, F.ask); await runTask(this, T[F.favor], 'friend', `Helping ${id}`, '🤝'); s.flags[`favor_${id}_${s.day}`] = true; this.befriend(id, 1); await UI.say(who, 'Thank you. Really.'); }
    const friends = Object.keys(FRIENDS).filter((k) => (s.friends[k] || 0) >= 3).length;
    if ((s.friends[id] || 0) >= 3 && !s.flags['bff_' + id]) { s.flags['bff_' + id] = true; UI.toast(`${id} is now your friend.`, 'good'); }
    if (friends >= 3) this.achieve('friend3');
    this.save();
  };

  // ---------------------------------------------------------------------------------- educational challenge zones
  P.challengeZones = async function (where) {
    const s = this.state, G = this; s.zones = s.zones || {};
    const z = await UI.sheet(where === 'library' ? 'Learning Lab' : 'The Think Tank', (close) => h('div', { class: 'act' },
      h('p', { class: 'lead' }, 'Five rooms per zone. Each room is a puzzle. Hints are free and there is no timer. Your progress is saved.'),
      h('div', { class: 'bill-list' }, Object.entries(ZONES).map(([id, zn]) => { const n = s.zones[id] || 0; return h('div', { class: 'bill' + (n >= 5 ? ' paid' : '') },
        h('div', {}, h('b', {}, `${zn.icon} ${zn.name}`), h('div', { class: 'locks' }, [0, 1, 2, 3, 4].map((i) => h('span', { class: i < n ? 'lk open' : 'lk' }, i < n ? '🔓' : '🔒')))),
        n >= 5 ? h('span', { class: 'ok' }, '✓') : h('button', { class: 'primary sm', onclick: () => close(id) }, n ? 'Continue' : 'Enter')); }))), { icon: '🏆' });
    if (!z) return;
    const zn = ZONES[z];
    while ((s.zones[z] || 0) < 5) {
      const room = s.zones[z] || 0;
      const r = await runTask(G, T[zn.gens[room]], 'challenge', `${zn.name} · Room ${room + 1} of 5`, zn.icon);
      if (!r) break;
      s.zones[z] = room + 1; this.sfx('coin'); this.save();
      if (room + 1 < 5) { const more = await UI.say(`${zn.icon} ${zn.name}`, `Room ${room + 1} unlocked. Keep going?`, ['Next room', 'Take a break']); if (more !== 0) break; }
    }
    if ((s.zones[z] || 0) >= 5 && !s.flags['zone_' + z]) {
      s.flags['zone_' + z] = true; s.stats.challenges = (s.stats.challenges || 0) + 1; this.achieve('challenge'); this.sfx('level');
      await UI.say(`${zn.icon} ${zn.name}`, 'Zone cleared! You didn’t rush. You understood.');
      if (Object.keys(ZONES).every((k) => (s.zones[k] || 0) >= 5)) this.achieve('allzones');
    }
    this.advance(0.5); this.save();
  };

  // ---------------------------------------------------------------------------------- savings & interest (Heights Bank)
  P.savings = async function () {
    const s = this.state, G = this; s.savings = s.savings || 0;
    if (!s.flags.savingsOpen) { await runTask(G, { skill: 'math.percent', q: 'A real savings account pays 4% interest a year. You save $500. How much interest after one year?', a: '$20', o: ['$20', '$200', '$4', '$2'], why: '4% of $500 = 0.04 × 500 = $20. In this game interest is sped up (1% each game week) so you can watch it grow. In real life, 1% a week would be about 68% a year: anyone promising that is running a scam.' }, 'bank', 'How interest works', '🏦'); s.flags.savingsOpen = true; this.achieve('investor'); }
    const act = await UI.sheet('Heights Bank · Savings', (close) => h('div', { class: 'act' },
      h('div', { class: 'budget' }, h('div', {}, h('small', {}, 'CHECKING'), h('b', {}, money(s.money))), h('div', {}, h('small', {}, 'SAVINGS'), h('b', { class: 'pos' }, money(s.savings))), h('div', {}, h('small', {}, 'RATE'), h('b', {}, '1% / game week'))),
      h('div', { class: 'opts' }, [50, 100, 500].map((v) => h('button', { class: 'opt', disabled: s.money < v, onclick: () => close(v) }, `Deposit ${money(v)}`)), h('button', { class: 'opt', disabled: s.savings <= 0, onclick: () => close(-1) }, 'Withdraw everything')),
      h('p', { class: 'tip' }, 'Interest is paid every 7 game days on what’s in savings. Interest earns interest: that’s compounding. Sped up for the game: real savings accounts pay about 0–5% a year.')), { icon: '🏦' });
    if (!act) return;
    if (act === -1) { this.earn(s.savings, 'Savings withdrawal'); s.stats.earned -= s.savings; s.savings = 0; }
    else { this.spend(act, 'Savings deposit'); s.stats.spent -= act; s.savings = r2(s.savings + act); }
    this.save();
  };

  // ---------------------------------------------------------------------------------- plush companions
  P.companion = async function () {
    const s = this.state;
    const act = await UI.sheet('Plush companion', (close) => h('div', { class: 'act center' },
      h('div', { class: 'big-emoji' }, s.companion ? '🧸' : '✨'),
      s.companion ? h('p', { class: 'lead' }, `${s.companion.name} is with you. Your companion floats beside you and shares tips when you need them.`) : h('p', { class: 'lead' }, 'A plush companion travels with you and gives friendly tips. Every REAL can choose a free starter companion, or link a REAL plush with the code on its tag.'),
      h('div', { class: 'opts' },
        !s.companion ? h('button', { class: 'opt', onclick: () => close('starter') }, 'Choose a free starter companion') : null,
        h('button', { class: 'opt', onclick: () => close('code') }, 'Link a plush with its tag code'),
        s.companion ? h('button', { class: 'opt', onclick: () => close('toggle') }, s.companion.hidden ? 'Show companion' : 'Hide companion') : null),
      h('p', { class: 'tip' }, 'Codes are checked on this device only. No account, no chat, nothing is shared.')), { icon: '🧸' });
    if (act === 'toggle') { s.companion.hidden = !s.companion.hidden; }
    if (act === 'starter') { const n = await UI.sheet('Choose a companion', (close) => h('div', { class: 'opts' }, [['Pip', 'fox'], ['Clover', 'bunny'], ['Mo', 'bear']].map(([n, k]) => h('button', { class: 'opt', onclick: () => close([n, k]) }, `${n} the plush ${k}`))), { icon: '🧸', noClose: true }); s.companion = { name: n[0], kind: n[1] }; this.achieve('companion'); }
    if (act === 'code') {
      const code = await UI.sheet('Enter tag code', (close) => { let v = ''; const disp = h('div', { class: 'keypad-disp' }, 'REAL-______');
        const keys = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'.split('');
        return h('div', { class: 'act' }, disp, h('div', { class: 'keys-alpha' }, keys.map((k) => h('button', { class: 'key sm', onclick: () => { if (v.length < 6) v += k; disp.textContent = 'REAL-' + v.padEnd(6, '_'); } }, k)), h('button', { class: 'key sm', onclick: () => { v = v.slice(0, -1); disp.textContent = 'REAL-' + v.padEnd(6, '_'); } }, '⌫')),
          h('button', { class: 'primary', onclick: () => close(v) }, 'Link')); }, { icon: '🏷️' });
      if (!code) return;
      const got = readCode(code), NAMES = { fox: 'Pip', cat: 'Miso', dog: 'Buddy', horse: 'Dash', bird: 'Sky', elephant: 'Peanut', lion: 'Sunny', cow: 'Clover', dolphin: 'Splash' };
      if (got) { s.companion = { name: NAMES[got.kind], kind: got.kind, linked: got.code }; this.achieve('companion'); UI.toast(`Plush linked! ${NAMES[got.kind]} the ${got.kind} joins you.`, 'good', 3600); }
      else UI.toast('That code didn’t match. Check the tag and try again.', 'warn');
    }
    this.hooks.refreshWorld && this.hooks.refreshWorld(); this.save();
  };
  P.companionTip = function () {
    const s = this.state; if (!s.companion || s.companion.hidden) return null;
    const ob = this.objective();
    return pick([`${s.companion.name}: ${ob.text}`, `${s.companion.name}: Stuck? Every task has a free hint.`, `${s.companion.name}: Pay bills before they’re due to skip late fees.`, `${s.companion.name}: Practising in the Learn app unlocks new careers.`, `${s.companion.name}: Cooking at home costs less than eating out.`]);
  };

  // ---------------------------------------------------------------------------------- weekly / nightly upkeep for new systems
  P.nightly = function () {
    const s = this.state, notes = [];
    const bz = this.bizOvernight(); if (bz) notes.push(bz);
    if (s.portfolio) {   // simulated markets: safe barely moves, risky can swing a lot either way
      const P = s.portfolio, before = P.safe + P.mixed + P.risky;
      // each night = one simulated month. Yearly averages about 4% (bond fund), 6% (mixed), 8% (stock fund); swings grow with risk
      const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
      const move = (v, mean, sd) => Math.max(0, Math.round(v * (1 + (mean + sd * gauss()) / 100) * 100) / 100);
      P.safe = move(P.safe, 0.33, 1.2); P.mixed = move(P.mixed, 0.5, 3); P.risky = move(P.risky, 0.65, 5);
      const after = P.safe + P.mixed + P.risky;
      if (before > 0) notes.push(`Investments: ${after >= before ? '+' : '−'}${money(Math.abs(after - before))} (one simulated month). Values go up and down.`);
    }
    if (s.savings > 0 && s.day % 7 === 0) { const i = r2(s.savings * 0.01); s.savings = r2(s.savings + i); notes.push(`Savings interest: +${money(i)}`); }
    if (s.vehicle && s.vehicle.type !== 'bike' && s.day - s.vehicle.service > 12 && !s.vehicle.broken) { s.vehicle.broken = true; s.bills.push({ id: 'repair' + s.day, name: 'Vehicle repair (skipped maintenance)', amount: 250, due: s.day + 5, paid: false }); notes.push('Your vehicle broke down. Skipped maintenance turned into a $250 repair. Service it at Midtown Motors every 10 days.'); }
    if (s.pet) { const p = s.pet; if (s.day - p.fed >= 2) { p.bond = Math.max(0, p.bond - 0.5); s.mood = Math.max(0, s.mood - 8); notes.push(`${p.name} is hungry. Feed your pet at home every day.`); } }
    return notes;
  };
  // ================================================================================== EDUCATION IN THE WORLD
  const gen = (id) => { const g = GEN[id]; return g ? g[Math.floor(Math.random() * g.length)] : null; };
  /** Mr. Okafor's desk at the Community Center: career board, hardship help, résumé help, mentoring. */
  P.counselor = async function () {
    const s = this.state, G = this, O = 'Mr. Okafor · Community Center', ll = this.life().level;
    const lateRent = s.bills.filter((b) => !b.paid && /^rent/.test(b.id) && b.due < s.day);
    const struggling = s.money < 30 || lateRent.length > 0 || s.hunger < 20;
    const c = await UI.sheet('Community Center', (close) => h('div', { class: 'act' },
      h('p', { class: 'lead' }, 'How can we help today?'),
      h('div', { class: 'opts' },
        h('button', { class: 'opt', onclick: () => close('board') }, '💼 Career board'),
        h('button', { class: 'opt', onclick: () => close('ask') }, '💬 Ask Mr. Okafor a question'),
        h('button', { class: 'opt', onclick: () => close('civics') }, '🏛️ How our city works (rights, laws, voting)'),
        h('button', { class: 'opt', onclick: () => close('resume') }, s.flags.resume ? '📝 Update my résumé' : '📝 Help me write a résumé'),
        struggling ? h('button', { class: 'opt', onclick: () => close('help') }, '🤝 I’m struggling with money') : h('button', { class: 'opt', onclick: () => close('help') }, '🤝 Money help & advice'),
        ll >= 8 || s.ending ? h('button', { class: 'opt', onclick: () => close('mentor') }, '🌱 Mentor a newcomer') : null)), { icon: '🤝' });
    if (c === 'board') return this.careerBoard();
    if (c === 'ask') return askNPC(this, { name: 'Mr. Okafor' });
    if (c === 'civics') { await UI.say(O, 'A city runs on people who understand how it works. Let’s look at one piece of it.'); for (let i = 0; i < 2; i++) await this.lessonIn('social', 'counselor', 'How our city works', '🏛️'); s.stats.wiseChoices = (s.stats.wiseChoices || 0) + 0.25; this.save(); return; }
    if (c === 'resume') {
      await UI.say(O, 'A résumé shows employers what you can do. Start each line with an action word, and use numbers when you can.');
      const r = await runActivity(G, gen('write.resume'), 'resume', 'Your résumé', '📝');
      await runActivity(G, GEN['write.resume'][1], 'resume', 'Your résumé', '📝');
      s.flags.resume = true; s.stats.wiseChoices = (s.stats.wiseChoices || 0) + 0.5;
      await UI.say(O, 'That’s a résumé an employer will read twice. It will help every application you send.'); this.save(); return;
    }
    if (c === 'help') return this.hardship(lateRent);
    if (c === 'mentor') {
      await UI.say(O, 'A young REAL just walked in from the old road, the same way you did. Would you help them get started?');
      for (const k of ['think.leadership', 'think.systems', 'write.bizplan']) await runActivity(G, k === 'think.leadership' ? T.lead : gen(k), 'mentor', 'Mentoring', '🌱');
      s.stats.mentored = (s.stats.mentored || 0) + 1; this.befriend('Okafor', 1); s.mood = Math.min(100, s.mood + 15); this.achieve('mentor');
      await UI.say(O, 'You remember what it was like to have nothing. That’s what makes you a good mentor.'); this.save();
    }
  };
  /** Safe recovery from financial hardship: nobody loses their home over a hard week. */
  P.hardship = async function (lateRent) {
    const s = this.state, O = 'Mr. Okafor · Community Center';
    const opts = [];
    if (s.flags.foodBank !== s.day && (s.flags.foodBankLast || 0) <= s.day - 2) opts.push(['🥫 Food bank (free groceries)', 'food']);
    if (lateRent.length) opts.push(['🏠 Rent payment plan (no late fees)', 'plan']);
    opts.push(['📊 Make a budget with me', 'budget']);
    const c = await UI.sheet('Help is available', (close) => h('div', { class: 'act' },
      h('p', { class: 'lead' }, 'Hard weeks happen to everyone. Using help is a smart move, not a failure.'),
      h('div', { class: 'opts' }, opts.map(([l, k]) => h('button', { class: 'opt', onclick: () => close(k) }, l)))), { icon: '🤝' });
    if (c === 'food') { s.flags.foodBankLast = s.day; s.pantry = s.pantry || {}; s.pantry.rice = (s.pantry.rice || 0) + 3; s.pantry.beans = (s.pantry.beans || 0) + 3; this.feed(25); UI.toast('Free groceries are in your fridge: rice and beans for a few meals.', 'good', 3600); }
    if (c === 'plan') {
      for (const b of lateRent) { const base = b.lateFee ? b.amount - 15 : b.amount; b.paid = true; b.renewed = true; s.bills.push({ id: 'plan' + s.day + 'a', name: `${b.name} (plan 1 of 2)`, amount: Math.round(base / 2 * 100) / 100, due: s.day + 7, paid: false }, { id: 'plan' + s.day + 'b', name: `${b.name} (plan 2 of 2)`, amount: Math.round(base / 2 * 100) / 100, due: s.day + 14, paid: false }); }
      s.stats.lateFees = Math.max(0, (s.stats.lateFees || 0) - lateRent.length);
      await UI.say(O, 'Done. Your late fees are removed and the rent is split into two payments. Your home is safe.');
    }
    if (c === 'budget') { await runActivity(this, GEN['fin.planning'][0], 'counselor', 'Budget with Mr. Okafor', '📊'); s.stats.budgetsPlanned = (s.stats.budgetsPlanned || 0) + 1; }
    this.save();
  };
  /** Midtown Library: adaptive reading. Picks books at the player's working reading level. */
  P.readBook = async function () {
    const s = this.state, b = this.edu.band('reading');
    const shelf = Object.values(SKILLS).filter((k) => k.subj === 'reading' && GEN[k.id]).sort((x, y) => Math.abs(x.band - b) - Math.abs(y.band - b)).slice(0, 4);
    const titles = { 'read.letters': 'ABC City Walk', 'read.phonics': 'Sounds Around Town', 'read.sentences': 'A Day at Fresh Mart', 'read.paragraph': 'Community Notices', 'read.multistep': 'How Things Work', 'read.inference': 'The Mystery of Aisle 5', 'read.compare': 'Which Way to Go?', 'read.technical': 'The Fix-It Manual', 'read.evidence': 'City Stories', 'read.factopinion': 'Ads and Facts', 'read.purpose': 'Why Did They Write That?', 'read.summarize': 'News in Brief', 'read.contracts': 'The Fine Print', 'read.bias': 'Two Sides', 'read.sources': 'Trust the Source', 'read.research': 'The Research Desk' };
    const NF = { social: ['🌍', 'History & the world'], science: ['🔬', 'Science'], tech: ['💻', 'Technology'], health: ['🩺', 'Health'] };
    const pickId = await UI.sheet('Midtown Library', (close) => h('div', { class: 'act' }, h('p', { class: 'lead' }, 'Pick a book. These are picked for where you are right now, but every shelf is open to you.'),
      h('div', { class: 'opts' }, A.PASSAGES.filter((P) => Math.abs(P.band - b) <= 1).slice(0, 4).map((P) => h('button', { class: 'opt', onclick: () => close('p:' + P.id) }, `${P.icon} ${P.title}`)),
        h('div', { class: 'tier-h' }, 'Practice books'), ...shelf.slice(0, 2).map((k) => h('button', { class: 'opt', onclick: () => close(k.id) }, `📕 ${titles[k.id] || k.name}`)),
        h('div', { class: 'tier-h' }, 'Nonfiction shelf'), ...Object.entries(NF).map(([k, [ic, nm]]) => h('button', { class: 'opt', onclick: () => close('nf:' + k) }, `${ic} ${nm}`)),
        h('button', { class: 'opt', onclick: () => close('all') }, '📚 Browse every subject (Learn)'))), { icon: '📚' });
    if (!pickId) return;
    if (pickId === 'all') return A.learn(this);
    if (pickId.startsWith('nf:')) { const k = pickId.slice(3); for (let i = 0; i < 2; i++) await this.lessonIn(k, 'library', NF[k][1], NF[k][0]); s.stats.booksRead = (s.stats.booksRead || 0) + 1; s.mood = Math.min(100, s.mood + 5); this.advance(0.75); this.save(); return; }
    if (pickId.startsWith('p:')) { await A.readPassage(this, pickId.slice(2)); s.stats.booksRead = (s.stats.booksRead || 0) + 1; s.mood = Math.min(100, s.mood + 5); this.advance(0.75); this.save(); return; }
    for (let i = 0; i < 2; i++) await runActivity(this, gen(pickId), 'library', titles[pickId] || 'Reading', '📕');
    s.stats.booksRead = (s.stats.booksRead || 0) + 1; s.mood = Math.min(100, s.mood + 5); this.advance(0.75); this.save();
  };
  /** Heights Bank: savings, simulated investing (risk explained), credit score, scam check, loan comparison. */
  P.bank = async function () {
    const s = this.state, G = this;
    const c = await UI.sheet('Heights Bank', (close) => h('div', { class: 'act' },
      h('div', { class: 'opts' },
        h('button', { class: 'opt', onclick: () => close('save') }, '🏦 Savings account'),
        h('button', { class: 'opt', onclick: () => close('invest') }, '📈 Investing simulator'),
        h('button', { class: 'opt', onclick: () => close('score') }, '⭐ My credit score'),
        h('button', { class: 'opt', onclick: () => close('loans') }, '📄 Compare loans'),
        h('button', { class: 'opt', onclick: () => close('fraud') }, '🛡️ Spot the scam'))), { icon: '🏦' });
    if (c === 'save') return this.savings();
    if (c === 'score') {
      // only credit accounts (loans) are reported; rent and phone bills usually aren't. No credit history → no score yet.
      const credit = s.bills.filter((b) => /^(veh|carloan|bizloan)/.test(b.id) && (b.amount > 0)), onTime = credit.filter((b) => b.paid && !b.lateFee).length + (s.stats.creditOnTime || 0), late = credit.filter((b) => b.lateFee).length + (s.stats.creditLate || 0);
      if (!credit.length && !s.stats.creditOnTime) { await UI.say('Advisor · Heights Bank', 'You don’t have a credit score yet: you have no loans or credit cards, so there’s nothing for the credit bureaus to report. Rent and phone bills usually aren’t reported. Paying them on time still matters: late or unpaid bills can be sent to collections, and that hurts your credit.'); }
      else {
        const months = Math.max(1, Math.round((s.day - (s.vehicle ? s.vehicle.bought : s.day)) / 30));
        const score = Math.max(300, Math.min(850, 640 + Math.min(onTime, 24) * 4 + Math.min(months, 12) * 3 - late * 40));
        s.creditScore = score;
        await UI.say('Advisor · Heights Bank', `Your simulated credit score is ${score}. Scores come mostly from paying credit on time (the biggest part), how much of your credit limit you use, and how long you’ve had credit. ${late ? 'A late payment can stay on your report for up to 7 years.' : 'Keep every loan payment on time and it will keep climbing slowly.'}`);
      }
      await runActivity(G, gen('fin.score'), 'bank', 'Credit scores', '⭐'); return;
    }
    if (c === 'loans') { await runActivity(G, gen('fin.loans'), 'bank', 'Compare loans', '📄'); await runActivity(G, gen('fin.debt'), 'bank', 'Debt', '📄'); return; }
    if (c === 'fraud') { await runActivity(G, gen('fin.fraud'), 'bank', 'Spot the scam', '🛡️'); return; }
    if (c === 'invest') return this.invest();
  };
  P.invest = async function () {
    const s = this.state, G = this; s.portfolio = s.portfolio || { safe: 0, mixed: 0, risky: 0, day: s.day };
    await runActivity(G, gen('fin.investing'), 'bank', 'Before you invest', '📈');
    const P2 = s.portfolio;
    const c = await UI.sheet('Investing simulator', (close) => h('div', { class: 'act' },
      h('p', { class: 'tip' }, 'Simulated money only. Each night is one month of market time. Bond fund (safe): about 4% a year on average, small ups and downs. Mixed: about 6%. Stock fund (risky): about 8%, with big swings. Any of them can lose money. Real stock funds have averaged roughly 7–10% a year over long periods, but have dropped 20–50% in bad years.'),
      h('div', { class: 'budget' }, h('div', {}, h('small', {}, 'SAFE'), h('b', {}, money(P2.safe))), h('div', {}, h('small', {}, 'MIXED'), h('b', {}, money(P2.mixed))), h('div', {}, h('small', {}, 'RISKY'), h('b', {}, money(P2.risky)))),
      h('div', { class: 'opts' }, ['safe', 'mixed', 'risky'].map((k) => h('button', { class: 'opt', disabled: s.money < 50, onclick: () => close(k) }, `Put $50 in ${k}`)), h('button', { class: 'opt', onclick: () => close('sell') }, 'Sell everything back to checking'))), { icon: '📈' });
    if (!c) return;
    if (c === 'sell') { const tot = Math.round((P2.safe + P2.mixed + P2.risky) * 100) / 100; if (tot > 0) { this.earn(tot, 'Investments sold'); s.stats.earned -= tot; } P2.safe = P2.mixed = P2.risky = 0; }
    else { this.spend(50, `Invested ($50 ${c})`); s.stats.spent -= 50; P2[c] = Math.round((P2[c] + 50) * 100) / 100; if (P2.safe && P2.mixed && P2.risky) { s.stats.wiseChoices = (s.stats.wiseChoices || 0) + 1; await runActivity(G, gen('fin.diversify'), 'bank', 'Diversification', '🧺'); } }
    this.save();
  };
  /** Jax's advice: sometimes good, sometimes misleading. The skill is judging it, not ignoring him. */
  const JAX_TIPS = [
    { t: 'Buy the 20-lb bag of rice instead of the little ones. Way cheaper per meal.', good: true, why: 'Unit price: the big bag costs less per pound. If you’ll use it before it spoils, it’s a good tip.', skill: 'think.compare' },
    { t: 'Get the weekly bus pass. You ride every day anyway.', good: true, why: '7 rides × $2 = $14. If the pass costs less than that, it saves money.', skill: 'think.compare' },
    { t: 'Skip the phone bill this week. Nobody pays on time.', good: false, why: 'Late bills add fees and hurt your credit score. “Nobody does it” isn’t evidence.', skill: 'think.consequence' },
    { t: 'My buddy’s new coin is going to the moon. Put your rent money in. Guaranteed!', good: false, why: '“Guaranteed” returns don’t exist, and rent money is money you can’t afford to lose.', skill: 'think.risk' },
    { t: 'Take that night class at City Tech. Brightline hires people who finish it.', good: true, why: 'It costs now but leads to higher pay. That’s long-term thinking.', skill: 'think.longterm' },
    { t: 'Everyone in Midtown has the new phone. You look broke without it.', good: false, why: 'That’s peer pressure (“everyone has it”), not a reason. Check whether it fits your budget.', skill: 'think.persuasion' },
    { t: 'Ask Rosa for more shifts before the holidays. Stores need extra hands.', good: true, why: 'Busy seasons mean more hours are available. Asking politely is smart.', skill: 'think.planning' },
    { t: 'Text your bank PIN to that number. They said it’s to unlock your account.', good: false, why: 'Banks never ask for your PIN. That’s a scam.', skill: 'fin.fraud' },
  ];
  P.jaxAdvice = async function () {
    const s = this.state, tip = JAX_TIPS[(s.day * 7 + (s.stats.shifts || 0)) % JAX_TIPS.length];
    this.edu.discover(tip.skill);
    const c = await UI.say('Jax', tip.t, ['Good advice, I’ll take it', 'Bad advice, I’ll pass', 'Let me think it through'], { tone: 'jax' });
    let judged = c === 0 ? true : c === 1 ? false : null;
    if (c === 2) { s.stats.thoughtThrough = (s.stats.thoughtThrough || 0) + 1; judged = await UI.say('Thinking it through', `Who benefits? Is there evidence? What could go wrong? …So, is Jax right this time?`, ['Yes, it’s good advice', 'No, it’s bad advice']) === 0; }
    const ok = judged === tip.good;
    this.edu.record(tip.skill, ok, { ctx: 'jax' }); this.edu.record('think.evaluate', ok, { ctx: 'jax' });
    if (ok) s.stats.wiseChoices = (s.stats.wiseChoices || 0) + 1;
    await UI.say(ok ? 'Good call' : 'Worth a second look', tip.why);
    this.befriend('Jax', 0.3); this.save();
  };
  /** Calendar → plan the week: scheduling + budget allocation. */
  P.planWeek = async function () {
    await runActivity(this, gen('think.planning'), 'calendar', 'Plan your week', '📅');
    await runActivity(this, GEN['fin.planning'][0], 'calendar', 'Plan your money', '📊');
    this.state.stats.budgetsPlanned = (this.state.stats.budgetsPlanned || 0) + 1; this.save();
  };
  /** Business planning: forecast next week and pick a marketing idea. */
  P.bizPlanWeek = async function () {
    const s = this.state, b = s.biz; if (!b) return;
    await runActivity(this, gen('math.forecast'), 'business', 'Forecast next week', '📈');
    await runActivity(this, gen('fin.cashflow'), 'business', 'Cash flow', '💵');
    const m = await UI.sheet('Marketing', (close) => h('div', { class: 'act' }, h('p', { class: 'lead' }, 'Pick one idea for next week:'),
      h('div', { class: 'opts' }, [['Loyalty card: 10th drink free', 'loyal'], ['Flyers at Fresh Mart ($15)', 'flyers'], ['Pay for fake reviews', 'fake']].map(([l, k]) => h('button', { class: 'opt', onclick: () => close(k) }, l)))), { icon: '📣' });
    if (m === 'fake') { this.edu.record('think.ethics', false, { ctx: 'business' }); b.rep = Math.max(0, b.rep - 1); await UI.say('Advisor · Small Business Center', 'Fake reviews mislead customers, and when people find out, trust is gone. Your reputation dropped. Honest marketing lasts longer.'); }
    else { this.edu.record('think.strategy', true, { ctx: 'business' }); if (m === 'flyers' && s.money >= 15) this.spend(15, `${b.name}: flyers`); b.rep = Math.min(10, b.rep + (m === 'loyal' ? 0.6 : 0.8)); UI.toast('Good plan. Reputation up.', 'good'); }
    s.stats.businessSteps = (s.stats.businessSteps || 0) + 0.5; this.save();
  };
}
