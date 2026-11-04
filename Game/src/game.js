// REAL — game director: state, needs, time, story, interactions, phone apps, save/load.
import { UI, h, money, clock, wait } from './ui.js';
import * as A from './activities.js';

const SAVE_KEY = 'real.save.v1';
const SKILLS = ['math', 'reading', 'writing', 'finance', 'thinking'];
export const SKILL_NAMES = { math: 'Math', reading: 'Reading', writing: 'Writing', finance: 'Money', thinking: 'Critical thinking' };

export function newState(profile) {
  return {
    v: 1, name: profile.name, species: profile.species, outfit: profile.outfit,
    day: 1, time: 8.0, money: 100, energy: 85, hunger: 70, mood: 70,
    xp: Object.fromEntries(SKILLS.map((s) => [s, 0])), pantry: { noodles: 2 }, stats: { shifts: 0, earned: 0, spent: 0, mistakes: 0 },
    quest: 'career', shift: null, flags: {}, location: 'district', pos: null,
    bank: [{ day: 1, desc: 'Opening balance (after leaving The Club)', amt: 100 }],
    bills: [{ id: 'rent', name: 'Rent — The Starter Apartments', amount: 120, due: 3, paid: false },
            { id: 'phone', name: 'Phone plan', amount: 25, due: 5, paid: false }],
    messages: [{ from: 'The Club', text: 'Your membership has been revoked. Your Club account is frozen. You have been issued $100 in personal funds.', day: 1, read: false },
               { from: 'The Starter Apartments', text: 'Welcome to unit 3B! Your key is ready at the lobby. First rent ($120) is due Day 3.', day: 1, read: false }],
    wardrobe: ['black', 'navy'],
  };
}

export function loadSave() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); return s && s.v === 1 ? s : null; } catch (e) { return null; } }
export function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }

export class Game {
  constructor(state, hooks) {
    this.state = state; this.hooks = hooks;   // hooks: sfx, enterApartment, exitApartment, findSocket, npc(name), playerAnim, setOutfit, quality...
    this.busy = false;
  }
  sfx(n) { this.hooks.sfx(n); }
  save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.state)); } catch (e) {} }
  level(k) { return 1 + Math.floor(this.state.xp[k] / 100); }
  xp(k, n) {
    const before = this.level(k); this.state.xp[k] += n; const after = this.level(k);
    if (after > before) { this.sfx('level'); UI.toast(`${SKILL_NAMES[k]} reached Level ${after}!`, 'gold', 3200); }
  }
  spend(amt, desc) { const s = this.state; s.money = Math.round((s.money - amt) * 100) / 100; s.stats.spent += amt; s.bank.unshift({ day: s.day, desc, amt: -amt }); }
  earn(amt, desc) { const s = this.state; s.money = Math.round((s.money + amt) * 100) / 100; s.stats.earned += amt; s.bank.unshift({ day: s.day, desc, amt }); }
  feed(n) { this.state.hunger = Math.min(100, this.state.hunger + n); }
  message(from, text) { this.state.messages.unshift({ from, text, day: this.state.day, read: false }); this.sfx('msg'); UI.toast(`New message · ${from}`, 'info'); }

  // ------------------------------------------------------------------ time & needs
  tick(dtGame) {   // dtGame in hours
    const s = this.state;
    s.time += dtGame;
    s.energy = Math.max(0, s.energy - dtGame * 3.5);
    s.hunger = Math.max(0, s.hunger - dtGame * 5);
    if (s.hunger < 15 && !this._hw) { this._hw = true; UI.toast('You’re hungry. Eat something soon.', 'warn', 3500); }
    if (s.hunger > 30) this._hw = false;
    if (s.energy < 12 && !this._ew) { this._ew = true; UI.toast('You’re exhausted. Head home and sleep.', 'warn', 3500); }
    if (s.energy > 25) this._ew = false;
    if (s.time >= 24.5 && !this.busy) this.passOut();
  }
  advance(hours) { this.tick(hours); }

  // ------------------------------------------------------------------ objectives
  objective() {
    const s = this.state, q = s.quest;
    const T = (text, target) => ({ text, target });
    if (q === 'career') return T('Find a job at the Career Center', 'Door_CareerCenter');
    if (q === 'manager') return T('Meet the manager at Fresh Mart', 'NPC_Manager_Idle');
    if (q === 'clockin') return T('Clock in at the time clock (back room)', 'Interact_TimeClock');
    if (q === 'shift') {
      const sh = s.shift;
      if (sh.register < sh.need.register) return T(`Serve customers at Register 1 (${sh.register}/${sh.need.register})`, 'Interact_Register_01');
      if (sh.stock < sh.need.stock) { const p = sh.product; return T(`Stock the shelf: ${p[0]} ${p[2]}. Find the right aisle.`, null); }
      if (sh.inv < sh.need.inv) return T('Count the inventory in the stockroom', 'Interact_InventoryCount');
      return T('Shift done! See the manager for your pay', 'NPC_Manager_Idle');
    }
    if (q === 'jax') return T('Head outside', 'NPC_Jax_Appear');
    if (q === 'home') return s.location === 'apartment' ? T(s.flags.ate ? (s.flags.billsSeen ? 'Get some sleep' : 'Check your bills at the desk') : 'Eat something (fridge)', s.flags.ate ? (s.flags.billsSeen ? 'Interact_Sleep' : 'Interact_Bills') : 'Interact_Fridge')
      : T('Buy groceries (optional), then go home to The Starter Apartments', 'Door_ApartmentLobby');
    if (q === 'free') {
      if (s.location === 'apartment') return T(s.time > 20 ? 'Get some sleep' : 'Head out and work your shift', s.time > 20 ? 'Interact_Sleep' : 'Interact_ExitDoor');
      if (!s.flags[`worked${s.day}`]) return T('Work today’s shift at Fresh Mart (clock in)', 'Interact_TimeClock');
      const unpaid = s.bills.find((b) => !b.paid && b.due <= s.day + 1);
      if (unpaid) return T(`Pay your bill: ${unpaid.name} (${money(unpaid.amount)})`, null);
      if (s.flags.baristaTip && !s.flags.barista) return T('Ask about the barista job at Daily Grind', 'Door_CoffeeShop');
      return T(`Goal: save ${money(500)} to unlock Midtown`, 'Door_ApartmentLobby');
    }
    return T('', null);
  }

  // ------------------------------------------------------------------ interactions
  /** returns {label, run} or null for a socket */
  interaction(sock) {
    const s = this.state, k = sock.key, q = s.quest;
    const G = this;
    const map = {
      Door_CareerCenter: () => ({ label: q === 'career' ? 'Apply for a job' : 'Career Center', run: () => this.career() }),
      Interact_TimeClock: () => (q === 'clockin' || (q === 'free' && !s.flags[`worked${s.day}`])) ? { label: 'Clock in', run: () => this.clockIn() } : { label: 'Training board', run: () => this.training() },
      Interact_TrainingBoard: () => ({ label: 'Read training board', run: () => this.training() }),
      Interact_Register_01: () => q === 'shift' && s.shift.register < s.shift.need.register ? { label: 'Serve customer', run: () => this.registerTask() } : null,
      Interact_InventoryCount: () => q === 'shift' && s.shift.register >= s.shift.need.register && s.shift.stock >= s.shift.need.stock && s.shift.inv < s.shift.need.inv ? { label: 'Count inventory', run: () => this.inventoryTask() } : null,
      Interact_BasketPickup: () => ({ label: 'Shop for groceries', run: () => A.shop(G).then((ok) => ok && UI.toast('Groceries are in your fridge at home.', 'good')) }),
      Interact_ProduceRestock: () => ({ label: 'Shop for groceries', run: () => A.shop(G) }),
      Interact_ManagerStation: () => null,
      Door_ApartmentLobby: () => ({ label: 'Enter The Starter Apartments', run: () => this.hooks.enterApartment() }),
      Interact_ExitDoor: () => ({ label: 'Go outside', run: () => this.hooks.exitApartment() }),
      Interact_Fridge: () => ({ label: 'Eat', run: () => A.eat(G).then((ok) => { if (ok) { s.flags.ate = true; this.hooks.playerAnim('Pickup'); } }) }),
      Interact_Cook: () => ({ label: 'Cook', run: () => A.eat(G).then((ok) => { if (ok) s.flags.ate = true; }) }),
      Interact_Eat: () => ({ label: 'Sit at the table', run: () => { this.hooks.playerAnim('Sit', 3); this.advance(0.25); } }),
      Interact_Bills: () => ({ label: 'Pay bills', run: () => { s.flags.billsSeen = true; return A.bills(G); } }),
      Interact_Sleep: () => ({ label: 'Sleep', run: () => this.sleep() }),
      Interact_Wardrobe: () => ({ label: 'Change outfit', run: () => this.wardrobe() }),
      Interact_Storage: () => ({ label: 'Storage', run: () => UI.toast('Your stuff from The Club fits in one box. A fresh start.', 'info', 3200) }),
      Interact_Phone: () => ({ label: 'Relax on the couch', run: () => { this.hooks.playerAnim('Sit', 4); s.mood = Math.min(100, s.mood + 8); this.advance(0.5); } }),
      Interact_Shower: () => ({ label: 'Shower', run: () => { s.mood = Math.min(100, s.mood + 10); s.energy = Math.min(100, s.energy + 5); this.advance(0.25); UI.toast('Fresh. +Mood', 'good'); } }),
      Door_CoffeeShop: () => ({ label: 'Daily Grind Coffee', run: () => this.coffee() }),
      Door_Diner: () => ({ label: 'Main St Diner', run: () => A.menuBuy(G, 'Main St Diner', '🍔', [
        { name: 'Burger & fries', price: 11.5, icon: '🍔', note: '+60 food. Fast, but costs 3× more than cooking.', apply: () => { this.feed(60); this.advance(0.6); } },
        { name: 'Soup of the day', price: 6.25, icon: '🍲', note: '+35 food', apply: () => { this.feed(35); this.advance(0.4); } },
        { name: 'Pancake stack', price: 8.75, icon: '🥞', note: '+45 food, +mood', apply: () => { this.feed(45); s.mood += 8; this.advance(0.5); } }]) }),
      Door_Clothing: () => ({ label: 'Thread & Co', run: () => this.clothing() }),
      Door_Gym: () => ({ label: 'Grow Gym', run: () => A.menuBuy(G, 'Grow Gym', '🏋️', [
        { name: 'Day pass workout', price: 5, icon: '🏋️', note: '+15 mood, −10 energy. Fitness pays off later.', apply: () => { s.mood = Math.min(100, s.mood + 15); s.energy = Math.max(0, s.energy - 10); s.stats.workouts = (s.stats.workouts || 0) + 1; this.advance(1); } }]) }),
      Interact_BusStop: () => ({ label: 'Bus schedule', run: () => this.bus() }),
      Interact_ParkJog: () => ({ label: 'Go for a jog', run: () => { s.mood = Math.min(100, s.mood + 12); s.energy = Math.max(0, s.energy - 8); this.advance(0.5); UI.toast('A free workout. +Mood', 'good'); } }),
    };
    if (/^Interact_ParkBench/.test(k)) return { label: 'Sit and relax', run: () => { this.hooks.playerAnim('Sit', 4); s.mood = Math.min(100, s.mood + 10); this.advance(0.5); } };
    if (/^Interact_StockShelf_A/.test(k)) {
      if (q === 'shift' && s.shift.register >= s.shift.need.register && s.shift.stock < s.shift.need.stock) {
        const aisle = parseInt(k.slice(-1), 10);
        return { label: `Stock aisle ${aisle}`, run: () => this.stockTask(aisle) };
      }
      return null;
    }
    const f = map[k];
    return f ? f() : null;
  }

  async career() {
    const s = this.state;
    if (s.quest !== 'career') { UI.toast(s.flags.baristaTip && !s.flags.barista ? 'Ask at Daily Grind about the barista job.' : 'You have a job at Fresh Mart. New postings appear as you level up.', 'info', 3500); return; }
    const ok = await A.jobApplication(this);
    if (ok) {
      s.quest = 'manager'; s.job = { title: 'Cashier', employer: 'Fresh Mart', rate: 12 };
      this.message('Fresh Mart', `Hi ${s.name}! This is Rosa, the store manager. Come see me at the front of Fresh Mart and we’ll get you started.`);
      this.advance(0.75); this.save();
    }
  }

  async talkManager() {
    const s = this.state, N = 'Rosa · Manager';
    if (s.quest === 'manager') {
      await UI.say(N, `Welcome to Fresh Mart, ${s.name}! Good food, stronger people, brighter futures. That’s us.`);
      await UI.say(N, 'Today you’ll run Register 1, stock shelves, and help me count inventory. Accuracy matters more than speed.');
      const c = await UI.say(N, 'First, clock in at the time clock in the back room. Ready?', ['Ready!', 'Where’s the back room?']);
      if (c === 1) await UI.say(N, 'Through the door behind the dairy cases, on the left. The time clock is on the wall.');
      s.quest = 'clockin'; this.save();
    } else if (s.quest === 'shift' && this.shiftComplete()) {
      await this.payday();
    } else if (s.quest === 'shift') {
      await UI.say(N, 'Keep it up! Check your task list at the top of the screen.');
    } else {
      await UI.say(N, pick(['Great work lately. Customers notice when you’re friendly.', 'Remember: count change back out loud. It avoids mistakes.', 'If you ever want more hours, keep your accuracy high.']));
    }
  }

  async clockIn() {
    const s = this.state;
    if (s.quest === 'free' && s.flags[`worked${s.day}`]) return UI.toast('You already worked today. Come back tomorrow.', 'info');
    if (s.quest === 'free' && (s.time < 7 || s.time > 17)) return UI.toast('Shifts run from 7 AM to 5 PM.', 'info');
    const ok = await A.clockIn(this);
    if (!ok) return;
    const lvl = Math.min(3, 1 + Math.floor(s.stats.shifts / 2));
    s.shift = { level: lvl, register: 0, stock: 0, inv: 0, need: { register: 2 + (lvl > 1 ? 1 : 0), stock: 2 + (lvl > 2 ? 1 : 0), inv: 1 }, mistakesAtStart: s.stats.mistakes, product: this.nextProduct() };
    s.quest = 'shift'; this.sfx('good'); UI.toast('Clocked in. Your tasks are on the left.', 'good');
    this.save();
  }
  nextProduct() { return A.PRODUCTS[Math.floor(Math.random() * A.PRODUCTS.length)]; }
  shiftComplete() { const sh = this.state.shift; return sh && sh.register >= sh.need.register && sh.stock >= sh.need.stock && sh.inv >= sh.need.inv; }
  taskRows() {
    const sh = this.state.shift; if (!sh) return null;
    return [{ label: 'Help customers', done: sh.register, need: sh.need.register }, { label: 'Stock shelves', done: sh.stock, need: sh.need.stock },
      { label: 'Count inventory', done: sh.inv, need: sh.need.inv }];
  }
  async registerTask() {
    const r = await A.register(this, this.state.shift.level);
    if (r && r.ok) { this.state.shift.register++; this.advance(0.6); this.hooks.npcReact && this.hooks.npcReact('Happy'); this.save(); }
  }
  async stockTask(aisle) {
    const sh = this.state.shift;
    if (A.stockCheck(this, sh.product, aisle)) {
      this.hooks.playerAnim('Pickup'); sh.stock++; sh.product = this.nextProduct(); this.advance(0.4);
      UI.toast(sh.stock < sh.need.stock ? `Shelf stocked! Next: ${sh.product[0]} ${sh.product[2]}` : 'Shelves done!', 'good');
      this.save();
    }
  }
  async inventoryTask() {
    const ok = await A.inventory(this, this.state.shift.level);
    if (ok) { this.state.shift.inv++; this.advance(0.8); this.save(); }
  }
  async payday() {
    const s = this.state, sh = s.shift;
    const perfect = s.stats.mistakes === sh.mistakesAtStart;
    await UI.say('Rosa · Manager', perfect ? 'Perfect shift: zero mistakes at the register. That earns you a bonus.' : 'Nice work today. A couple of slips at the register, but you fixed them. That’s what matters.');
    const net = await A.paystub(this, 5, s.job.rate, perfect ? 5 : 0);
    this.earn(net, `Fresh Mart paycheck (Day ${s.day})`);
    s.stats.shifts++; s.flags[`worked${s.day}`] = true; s.shift = null;
    s.energy = Math.max(0, s.energy - 18); s.time = Math.max(s.time, 15);
    if (s.stats.shifts === 1) { s.quest = 'jax'; await UI.caption(['Your first paycheck.', 'Earned. Not given.'], 2000); }
    else if (s.stats.shifts === 2 && !s.flags.jax2) { s.quest = 'free'; s.flags.jax2due = true; }
    else s.quest = 'free';
    this.save();
  }

  // ------------------------------------------------------------------ Jax (temptation, competition, shortcuts — not always wrong)
  async jax1() {
    const s = this.state, J = 'Jax';
    this.hooks.npcExpr('Jax', 'Confident');
    await UI.say(J, `Well, well. ${s.name}. Heard The Club kicked you out. Rough.`, null, { tone: 'jax' });
    await UI.say(J, 'Payday, huh? Look — limited sneaker drop at Thread & Co. $80. Everyone who matters will have them.', null, { tone: 'jax' });
    const c = await UI.say(J, 'Come on… you know you want it. You’ve earned it.', ['Buy it', 'Not right now', 'Let me think about it'], { tone: 'jax' });
    let choice = c;
    if (c === 2) {
      const after = s.money - 80, rent = s.bills.find((b) => b.id === 'rent');
      choice = await UI.sheet('Think it through', (close) => h('div', { class: 'act' },
        h('div', { class: 'budget' }, h('div', {}, h('small', {}, 'YOU HAVE'), h('b', {}, money(s.money))), h('div', {}, h('small', {}, 'SNEAKERS'), h('b', { class: 'neg' }, '−$80.00')), h('div', {}, h('small', {}, 'LEFT'), h('b', { class: after < rent.amount ? 'neg' : 'pos' }, money(after)))),
        h('p', {}, `Rent is ${money(rent.amount)}, due on Day ${rent.due}. Food costs about $3 a day if you cook.`),
        h('p', { class: 'q' }, 'Need or want? Can you afford it after your bills?'),
        h('div', { class: 'opts' }, h('button', { class: 'opt', onclick: () => close(0) }, 'Buy them anyway'), h('button', { class: 'opt', onclick: () => close(1) }, 'Skip it. Rent comes first.'))), { icon: '🧠', noClose: true });
      this.xp('thinking', 20);
    }
    if (choice === 0) {
      this.spend(80, 'Limited sneakers (Jax)'); s.mood = Math.min(100, s.mood + 15); s.flags.boughtSneakers = true;
      this.hooks.npcExpr('Jax', 'Happy');
      await UI.say(J, 'Now THAT’S a REAL. Looking expensive. Hope rent is cheap, ha.', null, { tone: 'jax' });
      UI.toast('Bought sneakers. −$80. Watch your rent!', 'warn', 3500);
    } else {
      this.xp('thinking', 25); this.hooks.npcExpr('Jax', 'Surprised');
      await UI.say(J, 'Huh. Saving it? …Respect. Most people can’t say no to me.', null, { tone: 'jax' });
      UI.toast('Smart call. +25 Critical thinking XP', 'good', 3200);
    }
    await UI.say(J, 'See you around, newbie. This city has more angles than you think.', null, { tone: 'jax' });
    s.flags.jax1 = true; s.quest = 'home'; this.hooks.jaxLeave(); this.save();
  }
  async jax2() {
    const s = this.state, J = 'Jax';
    this.hooks.npcExpr('Jax', 'Thinking');
    await UI.say(J, `${s.name}. Not here to sell you anything. Promise.`, null, { tone: 'jax' });
    await UI.say(J, 'Daily Grind needs a weekend barista. Pays $13 an hour, plus tips. You’ve got register experience now. That counts.', null, { tone: 'jax' });
    const c = await UI.say(J, 'Two incomes beat one. Just saying.', ['Thanks, Jax. I’ll check it out.', 'What’s the catch?'], { tone: 'jax' });
    if (c === 1) await UI.say(J, 'No catch. Even I give good advice sometimes. Don’t tell anyone.', null, { tone: 'jax' });
    s.flags.baristaTip = true; s.flags.jax2 = true; s.flags.jax2due = false; this.xp('thinking', 10); this.save();
    this.hooks.jaxLeave();
  }

  async coffee() {
    const s = this.state;
    if (s.flags.baristaTip && !s.flags.barista) {
      await UI.say('Dee · Daily Grind', 'Jax sent you? Ha. If you can make correct change and stay calm, you’re hired for weekend shifts.');
      const r = await A.register(this, 2);
      if (r && r.ok) { s.flags.barista = true; this.message('Daily Grind', 'Welcome to the team! Weekend shifts pay $13/hour. Tap Jobs in your phone for your schedule.'); this.xp('thinking', 10); this.save(); }
      return;
    }
    if (s.flags.barista && (s.day % 7 === 6 || s.day % 7 === 0) && !s.flags[`brew${s.day}`]) {
      const r = await A.register(this, 2);
      if (r && r.ok) { s.flags[`brew${s.day}`] = true; const net = await A.paystub(this, 4, 13, 6); this.earn(net, 'Daily Grind pay + tips'); this.save(); }
      return;
    }
    return A.menuBuy(this, 'Daily Grind Coffee', '☕', [
      { name: 'Drip coffee', price: 2.25, icon: '☕', note: '+12 energy', apply: () => { s.energy = Math.min(100, s.energy + 12); } },
      { name: 'Oat latte', price: 4.75, icon: '🥛', note: '+15 energy, +mood. Twice the price for 3 more energy?', apply: () => { s.energy = Math.min(100, s.energy + 15); s.mood += 5; } },
      { name: 'Bagel', price: 2.5, icon: '🥯', note: '+20 food', apply: () => this.feed(20) }]);
  }

  async clothing() {
    const s = this.state;
    const items = [['navy', 'Navy bomber', 25], ['red', 'Crimson track jacket', 35], ['green', 'Forest varsity', 40], ['cream', 'Cream fleece', 30]].filter(([id]) => !s.wardrobe.includes(id));
    if (!items.length) return UI.toast('You own every jacket in stock. New drops coming soon.', 'info');
    return A.menuBuy(this, 'Thread & Co', '🧥', items.map(([id, n, p]) => ({ name: n, price: p, icon: '🧥', note: 'Adds to your wardrobe at home', apply: () => { s.wardrobe.push(id); UI.toast('Change into it at your wardrobe at home.', 'good'); } })));
  }

  async wardrobe() {
    const s = this.state; const J = this.hooks.JACKETS;
    const pickId = await UI.sheet('Wardrobe', (close) => h('div', { class: 'act' }, h('p', { class: 'lead' }, 'Pick a jacket.'),
      h('div', { class: 'swatches' }, J.filter((j) => s.wardrobe.includes(j.id)).map((j) => h('button', { class: 'swatch', style: { background: '#' + j.color.toString(16).padStart(6, '0') }, onclick: () => close(j.id) }, h('span', {}, j.name))))), { icon: '👕' });
    if (pickId) { s.outfit.jacket = J.find((j) => j.id === pickId).color; this.hooks.setOutfit(s.outfit); this.save(); }
  }

  async bus() {
    await UI.sheet('Bus schedule', (close) => h('div', { class: 'act' },
      h('p', { class: 'lead' }, 'Route 1 — Starting District ⇄ Midtown ⇄ Opportunity District ⇄ The Heights'),
      h('div', { class: 'bill-list' }, [['Midtown', 'Save $500 and reach Level 3 in any skill'], ['Opportunity District', 'Get promoted at work'], ['The Heights', 'Own a business'], ['The Club', '???']].map(([n, r]) =>
        h('div', { class: 'bill' }, h('div', {}, h('b', {}, n), h('small', {}, '🔒 ' + r)), h('span', { class: 'amt' }, '$2.75')))),
      h('p', { class: 'tip' }, 'Reading a schedule: buses leave every 20 minutes, from 6:00 AM to 11:40 PM.')), { icon: '🚌' });
  }

  async training() {
    await UI.sheet('Training board', () => h('div', { class: 'act' },
      h('h3', {}, 'New cashier checklist'),
      h('ol', { class: 'list' }, h('li', {}, 'Greet every customer.'), h('li', {}, 'Scan every item. Check the total.'), h('li', {}, 'Count change back starting from the total.'), h('li', {}, 'Stock items in the aisle that matches the sign.'), h('li', {}, 'Ask your manager when unsure.')),
      h('p', { class: 'tip' }, 'Reading instructions carefully is a skill employers value.')), { icon: '📋' });
    this.xp('reading', 5);
  }

  async sleep() {
    const s = this.state;
    if (s.time < 19 && s.energy > 40) { UI.toast('It’s too early to sleep. Come back tonight.', 'info'); return; }
    this.busy = true;
    await UI.fade(1, 700);
    const earned = s.bank.filter((t) => t.day === s.day && t.amt > 0).reduce((a, t) => a + t.amt, 0);
    const spent = -s.bank.filter((t) => t.day === s.day && t.amt < 0).reduce((a, t) => a + t.amt, 0);
    s.day++; s.time = 7.0; s.energy = 100; s.hunger = Math.max(10, s.hunger - 25); s.flags.ate = false; s.flags.billsSeen = false;
    const late = s.bills.filter((b) => !b.paid && b.due < s.day && !b.lateFee);
    for (const b of late) { b.lateFee = true; b.amount += 15; s.mood -= 10; }
    if (s.quest === 'home') s.quest = 'free';
    this.save();
    await UI.fade(0, 500);
    await UI.sheet(`Day ${s.day - 1} complete`, (close) => h('div', { class: 'act' },
      h('div', { class: 'budget' }, h('div', {}, h('small', {}, 'EARNED'), h('b', { class: 'pos' }, money(earned))), h('div', {}, h('small', {}, 'SPENT'), h('b', { class: 'neg' }, money(spent))), h('div', {}, h('small', {}, 'BALANCE'), h('b', {}, money(s.money)))),
      late.length ? h('p', { class: 'warnline' }, `Late fee: ${late.map((b) => b.name).join(', ')} +$15. Pay bills before their due date.`) : null,
      h('div', { class: 'skills' }, Object.keys(SKILL_NAMES).map((k) => h('div', { class: 'skill' }, h('span', {}, SKILL_NAMES[k]), h('div', { class: 'bar' }, h('i', { style: { width: (s.xp[k] % 100) + '%' } })), h('b', {}, `Lv ${this.level(k)}`)))),
      h('p', { class: 'tip' }, pick(['Small steps lead to big things.', 'Rest today. Stronger tomorrow.', 'Understand the why.', 'From zero to REAL.'])),
      h('button', { class: 'primary', onclick: () => close() }, 'Wake up')), { icon: '🌙', noClose: true });
    this.busy = false;
    if (s.day === 3) this.message('The Starter Apartments', 'Reminder: rent is due today. Pay it from the Bills app or at your desk.');
    if (s.flags.jax2due) this.message('Unknown number', 'Hey. It’s Jax. Meet me by the corner of Main & Fresh. Got some real info for you.');
  }

  async passOut() {
    this.busy = true;
    UI.toast('You stayed out too late and passed out…', 'warn', 3000);
    await wait(1200);
    this.state.energy = 50; this.state.mood -= 10;
    this.hooks.enterApartment(true);
    await this.sleep();
  }
}

function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

// ---------------------------------------------------------------------------------------- phone
export function openPhone(G) {
  const s = G.state;
  G.sfx('phone');
  return UI.sheet('', (close, body) => {
    const apps = [
      ['Bank', '🏦', '#2f5bd2'], ['Jobs', '💼', '#8b2f3c'], ['Map', '📍', '#2f8f5a'], ['Messages', '💬', '#2f8f5a'], ['Bills', '🧾', '#2a9fd6'],
      ['Learn', '📚', '#5a3fd2'], ['Goals', '🎯', '#2a9fd6'], ['Stats', '📊', '#2f5bd2'], ['Club', '♛', '#e8a33a'], ['Settings', '⚙️', '#55607e'],
    ];
    const unread = s.messages.filter((m) => !m.read).length;
    const home = () => body.replaceChildren(h('div', { class: 'phone' },
      h('div', { class: 'ph-top' }, h('b', {}, clock(s.time)), h('small', {}, `Day ${s.day} · ${money(s.money)}`)),
      h('div', { class: 'ph-grid' }, apps.map(([n, ic, c]) => h('button', { class: 'app', onclick: () => { G.sfx('click'); open(n); } },
        h('span', { class: 'app-ic', style: { background: c } }, ic, n === 'Messages' && unread ? h('i', { class: 'badge' }, unread) : null), h('small', {}, n))))));
    const back = h('button', { class: 'ghost', onclick: () => home() }, '‹ Home');
    const open = (n) => {
      if (n === 'Learn') { close(); A.learn(G); return; }
      if (n === 'Bills') { close(); A.bills(G); return; }
      const page = {
        Bank: () => h('div', {}, h('div', { class: 'budget' }, h('div', {}, h('small', {}, 'CHECKING'), h('b', {}, money(s.money))), h('div', {}, h('small', {}, 'EARNED'), h('b', { class: 'pos' }, money(s.stats.earned))), h('div', {}, h('small', {}, 'SPENT'), h('b', { class: 'neg' }, money(s.stats.spent)))),
          h('div', { class: 'tx' }, s.bank.slice(0, 30).map((t) => h('div', { class: 'rline' }, h('span', {}, `Day ${t.day} · ${t.desc}`), h('span', { class: t.amt < 0 ? 'neg' : 'pos' }, money(t.amt)))))),
        Jobs: () => h('div', {}, s.job ? h('div', { class: 'bill' }, h('div', {}, h('b', {}, `${s.job.title} · ${s.job.employer}`), h('small', {}, `${money(s.job.rate)}/hour · Shifts 7 AM – 5 PM · ${s.stats.shifts} shifts worked`))) : h('p', {}, 'No job yet. Visit the Career Center on Main St.'),
          s.flags.barista ? h('div', { class: 'bill' }, h('div', {}, h('b', {}, 'Barista · Daily Grind'), h('small', {}, '$13/hour + tips · Weekends (Day 6, Day 7…)'))) : null),
        Map: () => h('div', { class: 'act' }, h('ul', { class: 'list' }, h('li', {}, '🏠 The Starter Apartments: Main St, northwest'), h('li', {}, '🛒 Fresh Mart: Main St & Fresh Ave, northeast'), h('li', {}, '💼 Career Center: Main St, far west'), h('li', {}, '☕ Daily Grind: under the apartments'), h('li', {}, '🍔 Main St Diner · 🧥 Thread & Co · 🏋️ Grow Gym: south side of Main St'), h('li', {}, '🌳 Brighter Park and the 🚌 bus stop: southeast'), h('li', {}, '♛ The Club: on the hill, north up Fresh Ave'))),
        Messages: () => { s.messages.forEach((m) => (m.read = true)); return h('div', { class: 'msgs' }, s.messages.map((m) => h('div', { class: 'msg' }, h('b', {}, m.from), h('small', {}, `Day ${m.day}`), h('p', {}, m.text)))); },
        Goals: () => h('div', { class: 'act' }, h('p', { class: 'lead' }, 'Now: ' + (G.objective().text || '—')),
          h('div', { class: 'bill-list' }, [['First paycheck', s.stats.shifts >= 1], ['Pay rent on time', s.bills.find((b) => b.id === 'rent').paid], ['Save $500', s.money >= 500], ['Get a second job', !!s.flags.barista], ['Buy your first car ($1,500)', false], ['Start a business', false], ['Return to The Club', false]].map(([t, d]) =>
            h('div', { class: 'bill' + (d ? ' paid' : '') }, h('div', {}, h('b', {}, t)), h('span', { class: 'ok' }, d ? '✓' : '○'))))),
        Stats: () => h('div', { class: 'act' }, h('div', { class: 'skills' }, Object.keys(SKILL_NAMES).map((k) => h('div', { class: 'skill' }, h('span', {}, SKILL_NAMES[k]), h('div', { class: 'bar' }, h('i', { style: { width: (s.xp[k] % 100) + '%' } })), h('b', {}, `Lv ${G.level(k)}`)))),
          h('p', {}, `Mood ${Math.round(s.mood)} · Shifts ${s.stats.shifts} · Cursive signatures ${s.stats.cursive || 0}`)),
        Club: () => h('div', { class: 'act center' }, h('div', { class: 'big-emoji gold' }, '♛'), h('h3', {}, 'Membership revoked'), h('p', {}, 'The Club was everything once. Status. Comfort. A life handed to you.'), h('p', { class: 'tip' }, 'Requirements to return: unknown. Keep building.')),
        Settings: () => h('div', { class: 'act' },
          h('div', { class: 'row' }, h('span', {}, 'Graphics'), ...['low', 'medium', 'high'].map((q) => h('button', { class: G.hooks.quality() === q ? 'primary sm' : 'ghost sm', onclick: () => { G.hooks.setQuality(q); open('Settings'); } }, q))),
          h('div', { class: 'row' }, h('span', {}, 'Sound'), h('button', { class: 'ghost sm', onclick: (e) => { e.currentTarget.textContent = G.hooks.toggleSound() ? 'On' : 'Off'; } }, G.hooks.soundOn() ? 'On' : 'Off')),
          h('div', { class: 'row' }, h('button', { class: 'ghost sm', onclick: () => { G.save(); UI.toast('Game saved.', 'good'); } }, 'Save now'), h('button', { class: 'danger sm', onclick: (e) => {
            if (e.currentTarget.dataset.arm) { clearSave(); location.reload(); } else { e.currentTarget.dataset.arm = 1; e.currentTarget.textContent = 'Tap again to erase'; }
          } }, 'New game'))),
      }[n];
      body.replaceChildren(h('div', { class: 'phone app-page' }, h('div', { class: 'ph-top' }, back, h('b', {}, n)), page()));
    };
    home();
    return h('div');
  }, { cls: 'phone-sheet' });
}
