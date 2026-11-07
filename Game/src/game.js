// REAL — game director: chapters, needs, time, Jax, careers, Life Level, phone, save/load.
import { UI, h, money, clock, wait } from './ui.js';
import * as A from './activities.js';
import { markWords } from './readalong.js';
import { Edu, newEdu, SKILLS, SUBJECTS, STATES } from './edu.js';
import { lifeLevel, LIFE_CATS, CAREERS, TIER_NAMES, careerStatus, setSkillNames, ACHIEVEMENTS, INVITE_LEVEL, INVITE_MIN_DAY } from './life.js';
setSkillNames(SKILLS);

const SAVE_KEY = 'real.save.v2';
const pick = (a) => a[Math.floor(Math.random() * a.length)];

export function newState(profile) {
  return {
    v: 2, name: profile.name, species: profile.species, outfit: profile.outfit,
    chapter: 'prologue', quest: 'prologue_walk', day: 1, time: 17.5, timeScale: 1,
    money: 0, energy: 80, hunger: 60, mood: 55,
    pantry: {}, stats: { shifts: 0, earned: 0, spent: 0, mistakes: 0 }, flags: {}, location: 'club', pos: null,
    bank: [], bills: [], messages: [], wardrobe: ['black', 'navy'],
    edu: newEdu(), jobs: [], job: null, friends: { Rosa: 0, Dee: 0, Okafor: 0, Jax: 0 }, achievements: {}, ending: null,
  };
}
export function loadSave() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); return s && s.v === 2 ? s : null; } catch (e) { return null; } }
export function clearSave() { try { localStorage.removeItem(SAVE_KEY); localStorage.removeItem('real.save.v1'); } catch (e) {} }

export class Game {
  constructor(state, hooks) {
    this.state = state; this.hooks = hooks;
    this.edu = new Edu(state.edu, { day: () => this.state.day, onState: (sk, st) => this.onSkill(sk, st) });
    this.busy = false;
  }
  sfx(n) { this.hooks.sfx(n); }
  save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.state)); } catch (e) {} }
  life() { return lifeLevel(this.state, this.edu); }
  onSkill(sk, st) {
    if (st >= 3) UI.toast(`${SUBJECTS[sk.subj].icon} ${sk.name}: ${STATES[st]}`, st >= 4 ? 'gold' : 'good', 3000);
    if (st === 4) { this.sfx('level'); if (this.edu.masteredCount() >= 5) this.achieve('mastered5'); }
  }
  achieve(id) {
    const s = this.state; if (s.achievements[id]) return;
    s.achievements[id] = s.day; this.sfx('level');
    UI.toast(`🏆 ${ACHIEVEMENTS[id][0]}`, 'gold', 3500);
  }
  befriend(n, v = 1) { this.state.friends[n] = (this.state.friends[n] || 0) + v; }
  spend(amt, desc) { const s = this.state; s.money = Math.round((s.money - amt) * 100) / 100; s.stats.spent += amt; s.bank.unshift({ day: s.day, desc, amt: -amt }); }
  earn(amt, desc) { const s = this.state; s.money = Math.round((s.money + amt) * 100) / 100; s.stats.earned += amt; s.bank.unshift({ day: s.day, desc, amt }); if (s.money >= 300) this.achieve('saver'); }
  feed(n) { this.state.hunger = Math.min(100, this.state.hunger + n); if (n > 0) this.state.flags.ate = true; }
  message(from, text) { this.state.messages.unshift({ from, text, day: this.state.day, read: false }); this.sfx('msg'); if (this.state.flags.phone) UI.toast(`New message · ${from}`, 'info'); }

  // ------------------------------------------------------------------ time & needs (1 real minute ≈ 10 game minutes)
  tick(dtHours) {
    const s = this.state;
    s.time += dtHours;
    if (s.chapter === 'prologue') return;
    s.energy = Math.max(0, s.energy - dtHours * 3.5);
    s.hunger = Math.max(0, s.hunger - dtHours * 4.5);
    if (s.hunger < 15 && !this._hw) { this._hw = true; UI.toast('You’re hungry. Eat something soon.', 'warn', 3500); }
    if (s.hunger > 30) this._hw = false;
    if (s.energy < 12 && !this._ew) { this._ew = true; UI.toast('You’re exhausted. Head home and sleep.', 'warn', 3500); }
    if (s.energy > 25) this._ew = false;
    if (s.time >= 24.5 && !this.busy && s.flags.housed) this.passOut();
    if (this.eventsTick) this.eventsTick();
    this.checkMilestones();
  }
  advance(hours) { this.state.time += hours; this.state.energy = Math.max(0, this.state.energy - hours * 2); this.state.hunger = Math.max(0, this.state.hunger - hours * 3); }

  checkMilestones() {
    const s = this.state; if (this._mt && performance.now() - this._mt < 2000) return; this._mt = performance.now();
    const ll = this.life().level;
    if (ll >= 4 && s.flags.hired && !s.flags.jaxChallenge) {
      s.flags.jaxChallenge = { target: 300, by: s.day + 7 };
      this.message('Jax', `Still at Fresh Mart? Cute. Bet you can’t have $300 in the bank by Day ${s.day + 7}. Loser buys coffee.`);
    }
    if (s.flags.jaxChallenge && !s.flags.jaxChallengeDone && s.money >= s.flags.jaxChallenge.target) {
      s.flags.jaxChallengeDone = 'won'; this.befriend('Jax', 2); s.stats.wiseChoices = (s.stats.wiseChoices || 0) + 1;
      this.message('Jax', 'Okay. $300. You’re for real. Coffee’s on me… this time.');
    }
    if (ll >= INVITE_LEVEL && s.day >= INVITE_MIN_DAY && s.flags.hired && !s.flags.invited && s.chapter !== 'prologue') {
      s.flags.invited = s.day; s.quest = 'invite'; this.achieve('invited');
      this.message('The Club', `${s.name}, the Council has watched you grow. You showed independence, responsibility, knowledge and achievement. The Club wants to talk about letting you back in. Take the bus to The Club when you are ready.`);
      setTimeout(() => this.message('Jax', 'Heard The Club’s calling you back. Funny. I never left… and I’m still not sure I belong there.'), 4000);
    }
    if ((s.jobs || []).length >= 2) this.achieve('two_jobs');
  }

  // ------------------------------------------------------------------ objectives
  objective() {
    const s = this.state, q = s.quest;
    const T = (text, target) => ({ text, target });
    switch (q) {
      case 'prologue_walk': return T('You’ve been summoned. Walk to the Council Room.', 'CLUB_COUNCIL');
      case 'find_way': return T(s.flags.readFirstSign ? 'Follow the road toward the city' : 'FIND YOUR WAY', s.flags.readFirstSign ? null : 'WILD_SIGN');
      case 'find_help': return T('Find help: the Community Center (housing & jobs) on Main St', 'NPC_Counselor');
      case 'job': return T('Fresh Mart is hiring. Talk to the manager.', 'NPC_Manager_Idle');
      case 'clockin': return T('Clock in at the time clock (back room)', 'Interact_TimeClock');
      case 'shift': {
        const sh = s.shift; if (!sh) return T('Great work today!', null);
        if (sh.register < sh.need.register) return T(`Serve customers at Register 1 (${sh.register}/${sh.need.register})`, 'Interact_Register_01');
        if (sh.stock < sh.need.stock) return T(`Stock the shelf: ${sh.product[0]} ${sh.product[2]}. Find the right aisle.`, null);
        if (sh.inv < sh.need.inv) return T('Count the inventory in the stockroom', 'Interact_InventoryCount');
        return T('Shift done! See the manager for your pay', 'NPC_Manager_Idle');
      }
      case 'jax1': return T('Your first paycheck. Walk down Main St.', 'NPC_Jax');
      case 'home': {
        const food = Object.values(s.pantry || {}).some((n) => n > 0);
        if (!s.flags.ate && !food) return T('Your fridge is empty. Get a meal at the Main St Diner (or groceries at Fresh Mart)', s.location === 'apartment' ? 'Interact_ExitDoor' : 'Door_Diner');
        // sleeping only works in the evening: before then, the goal suggests what to do with free time instead
        if (s.flags.ate && s.flags.billsSeen && s.time < 19 && s.energy > 40) return T('Free time until tonight: practise in 📚 Learn, jog in Brighter Park, or relax. Sleep after 7 PM', s.location === 'apartment' ? 'Interact_ExitDoor' : 'Interact_ParkJog');
        return s.location === 'apartment' ? T(s.flags.ate ? (s.flags.billsSeen ? 'Get some sleep' : 'Check your bills at the desk') : 'Eat something (fridge)', s.flags.ate ? (s.flags.billsSeen ? 'Interact_Sleep' : 'Interact_Bills') : 'Interact_Fridge')
        : T('Buy groceries (optional), then go home to The Starter Apartments', 'Door_ApartmentLobby');
      }
      case 'invite': return s.location === 'apartment' ? T('The Club has invited you back. Head out to the bus stop.', 'Interact_ExitDoor') : T('The Club has invited you back. Take the bus to The Club.', 'Interact_BusStop');
      default: {
        if (s.hunger < 22 && s.chapter !== 'prologue') {   // starving: eating comes first, with an arrow to food
          const food = Object.values(s.pantry || {}).some((n) => n > 0);
          if (s.location === 'apartment') return T(food ? 'You’re very hungry. Eat something from the fridge' : 'You’re very hungry and the fridge is empty. Get a meal at the Main St Diner', food ? 'Interact_Fridge' : 'Interact_ExitDoor');
          return T('You’re very hungry. Get a meal at the Main St Diner (or eat at home)', 'Door_Diner');
        }
        if (s.location === 'apartment') return T(s.time > 20 ? 'Get some sleep' : 'Head out and live your day', s.time > 20 ? 'Interact_Sleep' : 'Interact_ExitDoor');
        if (s.mission) return T(`${s.mission.text}${s.mission.loc !== s.location ? ' (' + ({ district: 'Starting District', midtown: 'Midtown', opportunity: 'Opportunity District', heights: 'The Heights' })[s.mission.loc] + ')' : ''}`, 'MISSION');
        if (s.flags.jaxStealDue && !s.flags.jaxSteal) return T('Someone’s waiting by Thread & Co…', 'NPC_Jax');
        if (s.flags.jax3due && !s.flags.jax3) return T('Jax wants to talk at the corner of Main & Fresh', 'NPC_Jax');
        if (!s.flags[`worked${s.day}`] && s.time < 17) return T('Work today’s shift at Fresh Mart (clock in)', 'Interact_TimeClock');
        const unpaid = s.bills.find((b) => !b.paid && b.due <= s.day + 1);
        if (unpaid) return T(`Pay your bill: ${unpaid.name} (${money(unpaid.amount)}) — Bills app`, null);
        if (s.flags.baristaTip && !(s.jobs || []).includes('barista')) return T('Ask Dee about the barista job at Daily Grind', 'Door_CoffeeShop');
        if (s.event && s.location === 'district' && this.constructor.EVENTS && this.constructor.EVENTS[s.event.id]) { const E = this.constructor.EVENTS[s.event.id]; return T(`${E.icon} ${E.title} (optional)`, s.location === 'district' ? s.event.at : null); }
        const ll = this.life();
        const next = [['midtown', 3, 'Midtown'], ['opportunity', 5, 'the Opportunity District'], ['heights', 8, 'The Heights']].find(([k, lv]) => ll.level >= lv && !(s.visited || {})[k]);
        if (next) return T(`New district open: take the bus to ${next[2]}`, s.location === 'district' ? 'Interact_BusStop' : 'D:bus');
        if (s.biz && s.biz.last !== s.day && !s.biz.staff.length && s.time < 18) return T(`Open your ${s.biz.name} for the day (Brighter Park)`, s.location === 'district' ? 'CART' : null);
        if (s.pet && s.pet.fed !== s.day && s.time > 17) return T(`Go home and feed ${s.pet.name}`, null);
        // free time: suggest one concrete step in the area that is furthest behind, so there's always a clear next thing to do
        const home = s.location === 'district';
        const tips = {
          education: ['practise a skill in 📚 Learn on your phone', null],
          career: ['look for a better job on the Career board at the Community Center', 'Door_CareerCenter'],
          financial: ['save some money and pay bills on time (🧾 Bills app)', null],
          health: ['go for a jog in Brighter Park', 'Interact_ParkJog'],
          decisions: ['practise critical thinking in 📚 Learn on your phone', null],
          relationships: ['say hi to Dee at the Daily Grind', 'Door_CoffeeShop'],
          reputation: ['do great work on your next shift', null],
          independence: ['keep paying your own rent on time', null],
          entrepreneurship: ll.level >= 6 ? ['plan a business at the Small Business Center (Opportunity District)', null] : null,
        };
        const behind = Object.entries(ll.scores).filter(([k]) => tips[k]).sort((a, b) => a[1] - b[1]).slice(0, 3);
        const lowest = behind[Math.floor(s.time) % Math.max(1, behind.length)];   // rotate hourly among the three areas furthest behind
        const [tip, key] = lowest ? tips[lowest[0]] : ['explore the city', null];
        return T(`Grow your Life Level (${ll.level} → ${ll.level + 1}): ${tip}`, home ? key : null);
      }
    }
  }

  // ------------------------------------------------------------------ interactions (sockets in the district / apartment)
  interaction(sock) {
    const s = this.state, k = sock.key, q = s.quest, G = this;
    if (!s.flags.housed && !/^Interact_BusStop|^Interact_ParkBench|^Interact_ParkJog/.test(k) && /^Door_|^Interact_/.test(k) && k !== 'Door_CareerCenter') {
      if (/Register|StockShelf|TimeClock|InventoryCount|Basket|Produce|Manager|Training/.test(k)) return null;
      if (/^Door_/.test(k)) return { label: 'Closed to you for now', run: () => UI.toast('You have no money and no account yet. Find the Community Center on Main St first.', 'info', 3800) };
    }
    const map = {
      Door_CareerCenter: () => ({ label: 'Community Center', run: () => s.flags.housed ? this.counselor() : this.housing() }),
      Interact_TimeClock: () => (q === 'clockin' || (q !== 'shift' && s.flags.hired && !s.flags[`worked${s.day}`])) ? { label: 'Clock in', run: () => this.clockIn() } : { label: 'Training board', run: () => this.training() },
      Interact_TrainingBoard: () => ({ label: 'Read training board', run: () => this.training() }),
      Interact_Register_01: () => q === 'shift' && s.shift && s.shift.register < s.shift.need.register ? { label: 'Serve customer', run: () => this.registerTask() } : null,
      Interact_InventoryCount: () => q === 'shift' && s.shift && s.shift.register >= s.shift.need.register && s.shift.stock >= s.shift.need.stock && s.shift.inv < s.shift.need.inv ? { label: 'Count inventory', run: () => this.inventoryTask() } : null,
      Interact_BasketPickup: () => ({ label: 'Shop for groceries', run: () => A.shop(G).then((ok) => ok && UI.toast('Groceries are in your fridge at home.', 'good')) }),
      Interact_ProduceRestock: () => ({ label: 'Shop for groceries', run: () => A.shop(G) }),
      Door_ApartmentLobby: () => (s.home && s.home !== 'starter' ? { label: 'The Starter Apartments', run: () => UI.toast('You moved out. Your home is now ' + this.hooks.HOMES[s.home].name + '.', 'info', 3200) } : { label: 'Enter The Starter Apartments', run: () => this.hooks.enterApartment() }),
      Interact_ExitDoor: () => ({ label: 'Go outside', run: () => this.hooks.exitApartment() }),
      Interact_Fridge: () => s.pet && s.pet.fed !== s.day ? { label: `Feed ${s.pet.name}`, run: () => this.petCare('feed') } : ({ label: 'Eat', run: () => A.eat(G).then((ok) => { if (ok) { s.flags.ate = true; this.hooks.playerAnim('Pickup'); } }) }),
      Interact_Cook: () => ({ label: 'Cook', run: () => A.eat(G).then((ok) => { if (ok) s.flags.ate = true; }) }),
      Interact_Eat: () => ({ label: 'Sit at the table', run: () => { this.hooks.playerAnim('Sit', 3); this.advance(0.25); } }),
      Interact_Bills: () => ({ label: 'Pay bills', run: () => { s.flags.billsSeen = true; return A.bills(G); } }),
      Interact_Sleep: () => ({ label: 'Sleep', run: () => this.sleep() }),
      Interact_Wardrobe: () => ({ label: 'Change outfit', run: () => this.wardrobe() }),
      Interact_Storage: () => ({ label: 'Storage', run: () => UI.toast('Empty. Everything from The Club stayed at The Club.', 'info', 3200) }),
      Interact_Phone: () => ({ label: 'Relax on the couch', run: () => { this.hooks.playerAnim('Sit', 4); s.mood = Math.min(100, s.mood + 8); this.advance(0.5); } }),
      Interact_Shower: () => ({ label: 'Shower', run: () => { s.mood = Math.min(100, s.mood + 10); s.energy = Math.min(100, s.energy + 5); this.advance(0.25); UI.toast('Fresh. +Mood', 'good'); } }),
      Door_CoffeeShop: () => ({ label: 'Daily Grind Coffee', run: () => this.coffee() }),
      Door_Diner: () => ({ label: 'Main St Diner', run: () => A.menuBuy(G, 'Main St Diner', '🍔', [
        { name: 'Burger & fries', price: 11.5, icon: '🍔', note: '+60 food. Fast, but about 4× the cost of cooking.', apply: () => { this.feed(60); s.stats.mealsEaten = (s.stats.mealsEaten || 0) + 1; this.advance(0.6); } },
        { name: 'Soup of the day', price: 6.25, icon: '🍲', note: '+35 food', apply: () => { this.feed(35); this.advance(0.4); } },
        { name: 'Pancake stack', price: 8.75, icon: '🥞', note: '+45 food, +mood', apply: () => { this.feed(45); s.mood += 8; this.advance(0.5); } }]) }),
      Door_Clothing: () => ({ label: 'Thread & Co', run: () => this.clothing() }),
      Door_Gym: () => ({ label: 'Grow Gym', run: () => A.menuBuy(G, 'Grow Gym', '🏋️', [
        { name: 'Day pass workout', price: 5, icon: '🏋️', note: '+15 mood, −10 energy. Fitness pays off later.', apply: () => { s.mood = Math.min(100, s.mood + 15); s.energy = Math.max(0, s.energy - 10); s.stats.workouts = (s.stats.workouts || 0) + 1; this.advance(1); } }]) }),
      Interact_BusStop: () => ({ label: s.quest === 'invite' ? 'Take the bus to The Club' : 'Bus schedule', run: () => this.bus() }),
      Interact_ParkJog: () => ({ label: 'Go for a jog', run: () => { s.mood = Math.min(100, s.mood + 12); s.energy = Math.max(0, s.energy - 8); s.stats.workouts = (s.stats.workouts || 0) + 0.5; this.advance(0.5); UI.toast('A free workout. +Mood', 'good'); } }),
    };
    if (s.event && s.event.at === k && s.location === 'district' && this.constructor.EVENTS && this.constructor.EVENTS[s.event.id]) { const E = this.constructor.EVENTS[s.event.id]; return { label: `${E.icon} ${E.title.replace(/ (in|at) .*$/, '')}`, run: () => this.runEvent() }; }
    if (/^Interact_ParkBench/.test(k)) return { label: 'Sit and relax', run: () => { this.hooks.playerAnim('Sit', 4); s.mood = Math.min(100, s.mood + 10); this.advance(0.5); } };
    if (/^Interact_StockShelf_A/.test(k)) {
      if (q === 'shift' && s.shift && s.shift.register >= s.shift.need.register && s.shift.stock < s.shift.need.stock) { const aisle = parseInt(k.slice(-1), 10); return { label: `Stock aisle ${aisle}`, run: () => this.stockTask(aisle) }; }
      return null;
    }
    const f = map[k];
    return f ? f() : null;
  }

  // ------------------------------------------------------------------ Chapter 1 → 2: arriving, the Community Center
  arrive() {
    const s = this.state;
    if (s.chapter !== 'nowhere') return;
    s.chapter = 'city'; s.quest = 'find_help'; this.achieve('found_way');
    s.stats.daysIndependent = 0;
  }
  async readSign(sign) {
    const ok = await A.readSign(this, sign);
    if (sign.key === 'sign_start') this.state.flags.readFirstSign = true;
    if (sign.key === 'sign_fork') this.state.flags.readFork = true;
  }
  async housing() {
    const s = this.state, O = 'Mr. Okafor · Community Center';
    await UI.say(O, 'Welcome to the Starting District. You look like you walked a long way. Let’s get you sorted out: somewhere to sleep, and a way to earn.');
    const c = await UI.say(O, 'Where are you staying tonight?', ['Nowhere. I just got here.', 'I used to be in The Club.']);
    if (c === 1) await UI.say(O, 'The Club, huh? Doesn’t matter here. Here, everybody starts somewhere. Most people start right where you are.');
    await UI.say(O, 'The Fresh Start program covers your first week in a starter unit at The Starter Apartments, Unit 3B. After that, rent is $300 a week, and Fresh Start pays half of it for your first four weeks, so you pay $150. It’s modest, but it’s yours to keep up.');
    await UI.say(O, 'I also checked your basic bank account. Everything linked to The Club is gone, but there’s a remaining balance of $100. And here’s a basic phone. It’s not fancy, but it works.');
    s.flags.housed = true; s.flags.phone = true; this.achieve('first_home'); this.befriend('Okafor', 2);
    this.earn(100, 'Remaining balance (basic account)');
    s.bills = [{ id: 'phone1', name: 'Phone plan', amount: 25, due: s.day + 4, paid: false }, { id: 'rent1', name: 'Rent — The Starter Apartments (week 2)', amount: 150, due: s.day + 6, paid: false }, { id: 'util1', name: 'Utilities', amount: 20, due: s.day + 6, paid: false }];
    s.messages.unshift({ from: 'The Starter Apartments', text: 'Welcome to Unit 3B! Your first week is covered by Fresh Start. Rent ($300/week, $150 with your Fresh Start subsidy for 4 weeks) is due every 7 days starting Day ' + (s.day + 6) + '.', day: s.day, read: false });
    await UI.say(O, '$100 won’t last long. Before you spend any of it, let’s make sure you know what you need, and what can wait.');
    await A.needsWants(this);
    await A.firstBudget(this);
    await UI.say(O, 'Good. Last thing: you’ll need income. Fresh Mart, across Fresh Ave, is hiring. Talk to Rosa, the manager. Tell her I sent you.');
    s.quest = 'job'; this.save();
  }
  async careerBoard() {
    const s = this.state, ll = this.life().level;
    await UI.sheet('Career board', () => h('div', { class: 'act' },
      h('p', { class: 'lead' }, 'Every career is open to every REAL. What unlocks them is what you learn and how you live.'),
      ...TIER_NAMES.map((tn, t) => h('div', { class: 'tier' }, h('div', { class: 'tier-h' }, `Tier ${t} · ${tn}`),
        CAREERS.filter((c) => c.tier === t).map((c) => { const st = careerStatus(c, s, this.edu, ll);
          return h('div', { class: 'bill' + (st.held ? ' paid' : '') }, h('div', {}, h('b', {}, `${c.title} · ${c.employer}`), h('small', {}, c.desc),
            h('small', { class: st.ready ? 'pos' : '' }, st.held ? 'Your job ✓' : st.ready ? (c.where === 'here' ? 'Ready: apply in person' : c.tier === 4 ? 'Ready: Small Business Center, Opportunity District' : `Ready: apply in person in ${c.where}`) : 'Needs: ' + st.missing.join(' · '))),
            c.rate ? h('span', { class: 'amt' }, `$${c.rate}/h`) : null); })))), { icon: '💼', cls: 'wide' });
  }

  // ------------------------------------------------------------------ Chapter 3: the first dollar
  async talkManager() {
    const s = this.state, N = 'Rosa · Manager';
    this.befriend('Rosa', 0.5);
    if (s.quest === 'job') {
      await UI.say(N, 'Okafor sent you? Then you get a fair shot, same as anyone. Fill out the application.');
      const ok = await A.jobApplication(this);
      if (!ok) return;
      await A.interview(this);
      s.flags.hired = true; s.jobs = ['cashier']; s.job = { id: 'cashier', title: 'Cashier', employer: 'Fresh Mart', rate: 15, hours: 4 };
      this.achieve('hired'); s.quest = 'clockin'; this.save();
    } else if (s.quest === 'shift' && this.shiftComplete()) {
      await this.payday();
    } else if (s.quest === 'shift') {
      await UI.say(N, 'Keep it up! Check your task list on the left.');
    } else {
      const lead = CAREERS.find((c) => c.id === 'shiftlead');
      if (!s.jobs.includes('shiftlead') && careerStatus(lead, s, this.edu, this.life().level).ready) {
        const c = await UI.say(N, `${s.name}, you’ve been reliable and your register is always right. I want to make you Shift Lead: $17 an hour, and more to look after. Want it?`, ['Yes, I’m ready.', 'Not yet.']);
        if (c === 0) { s.jobs = s.jobs.filter((j) => j !== 'cashier').concat('shiftlead'); s.job = { id: 'shiftlead', title: 'Shift Lead', employer: 'Fresh Mart', rate: 17, hours: 4 }; s.stats.promotions = (s.stats.promotions || 0) + 1; this.achieve('promoted'); this.save(); }
        return;
      }
      await UI.say(N, pick(['Great work lately. Customers notice when you’re friendly.', 'Count change back out loud. It avoids mistakes.', 'Read the aisle signs before you guess. Saves everyone time.', 'Shifts run 7 AM to 5 PM. Come by any day.']));
    }
  }
  async clockIn() {
    const s = this.state;
    if (s.flags[`worked${s.day}`]) return UI.toast('You already worked today. Come back tomorrow.', 'info');
    if (s.quest !== 'clockin' && (s.time < 7 || s.time > 17)) return UI.toast('Shifts run from 7 AM to 5 PM.', 'info');
    const ok = await A.clockIn(this);
    if (!ok) return;
    const n = s.stats.shifts;
    s.shift = { register: 0, stock: 0, inv: 0, need: { register: n === 0 ? 1 : 2, stock: 2, inv: 1 }, mistakesAtStart: s.stats.mistakes, product: this.nextProduct() };
    s.quest = 'shift'; this.sfx('good'); UI.toast('Clocked in. Your tasks are on the left.', 'good');
    this.save();
  }
  nextProduct() { return A.PRODUCTS[Math.floor(Math.random() * A.PRODUCTS.length)]; }
  shiftComplete() { const sh = this.state.shift; return sh && sh.register >= sh.need.register && sh.stock >= sh.need.stock && sh.inv >= sh.need.inv; }
  taskRows() {
    const sh = this.state.shift; if (!sh) return null;
    return [{ label: 'Help customers', done: sh.register, need: sh.need.register }, { label: 'Stock shelves', done: sh.stock, need: sh.need.stock }, { label: 'Count inventory', done: sh.inv, need: sh.need.inv }];
  }
  async registerTask() { const r = await A.register(this); if (r && r.ok) { this.state.shift.register++; this.advance(0.5); this.save(); } }
  async stockTask(aisle) {
    const sh = this.state.shift;
    await A.teach(this, 'read.signs', 'Rosa');
    if (A.stockCheck(this, sh.product, aisle)) {
      this.hooks.playerAnim('Pickup'); sh.stock++; sh.product = this.nextProduct(); this.advance(0.4);
      UI.toast(sh.stock < sh.need.stock ? `Shelf stocked! Next: ${sh.product[0]} ${sh.product[2]}` : 'Shelves done!', 'good');
      this.save();
    }
  }
  async inventoryTask() { const ok = await A.inventory(this); if (ok) { this.state.shift.inv++; this.advance(0.6); this.save(); } }
  async payday() {
    const s = this.state, sh = s.shift, job = s.job;
    const perfect = s.stats.mistakes === sh.mistakesAtStart;
    await UI.say('Rosa · Manager', perfect ? 'A perfect shift. Not one mistake. That earns a bonus.' : 'Nice work today. A couple of slips, but you fixed them. That’s what matters.');
    { const { speakTask, SPEAK_TASKS } = await import('./voice.js'); const pool = SPEAK_TASKS[job.id] || SPEAK_TASKS.cashier; await speakTask(this, pool[Math.floor(Math.random() * pool.length)], 'Rosa · Manager'); }
    const net = await A.paystub(this, job.hours, job.rate, perfect ? 5 : 0);
    this.earn(net, `Fresh Mart paycheck (Day ${s.day})`);
    s.stats.shifts++; if (perfect) s.stats.perfectShifts = (s.stats.perfectShifts || 0) + 1;
    s.flags[`worked${s.day}`] = true; s.shift = null;
    s.energy = Math.max(0, s.energy - 15); s.time = Math.max(s.time, 13.5);
    this.befriend('Rosa', 1);
    if (s.stats.shifts === 1) {
      this.achieve('first_pay');
      await UI.caption(['Your first paycheck.', 'It isn’t a fortune.', 'But it’s the first money you ever earned yourself.'], 2300);
      s.quest = 'jax1';
    } else {
      s.quest = 'free';
      if (s.stats.shifts === 2 && !s.flags.jaxSteal) s.flags.jaxStealDue = true;
      if (s.stats.shifts >= 3 && !s.flags.jax3) s.flags.jax3due = true;
    }
    this.save();
  }

  // ------------------------------------------------------------------ Chapter 4: Jax (temptation, competition, shortcuts — and sometimes right)
  upcomingBills(days) { const s = this.state; return s.bills.filter((b) => !b.paid && b.due <= s.day + days).reduce((a, b) => a + b.amount, 0); }
  async jax1() {
    const s = this.state, J = 'Jax', price = 40;
    this.hooks.npcExpr('Jax', 'Confident');
    await UI.say(J, `Well, well. ${s.name}. Last time I saw you, you were sipping sparkling water in the Club lounge.`, null, { tone: 'jax' });
    await UI.say(J, 'Heard they took your card. Rough. Now you’re… stocking shelves? Wow.', null, { tone: 'jax' });
    await UI.say(J, `That hoodie in Thread & Co’s window. You were looking at it. ${money(price)}.`, null, { tone: 'jax' });
    let c = await UI.say(J, 'Come on. It’s just forty dollars. You deserve it. Live a little.', ['Buy it', 'No, I’m saving my money', 'Why do you think it’s worth it?', 'Walk away'], { tone: 'jax' });
    this.edu.discover('think.opportunity');
    if (c === 2) {
      s.stats.thoughtThrough = (s.stats.thoughtThrough || 0) + 1; this.edu.record('think.evaluate', true, { ctx: 'jax' });
      await UI.say(J, 'First impressions. People hire people who look ready. Show up to your next interview in that sad jacket and see what happens.', null, { tone: 'jax' });
      const after = s.money - price, due = this.upcomingBills(7);
      c = await UI.sheet('Think it through', (close) => h('div', { class: 'act' },
        h('div', { class: 'budget' }, h('div', {}, h('small', {}, 'YOU HAVE'), h('b', {}, money(s.money))), h('div', {}, h('small', {}, 'HOODIE'), h('b', { class: 'neg' }, '−' + money(price))), h('div', {}, h('small', {}, 'BILLS THIS WEEK'), h('b', { class: after < due ? 'neg' : '' }, money(due)))),
        h('p', {}, `Jax has a point. Looking ready can matter. But after the hoodie you’d have ${money(after)}, and ${money(due)} in bills are due within a week.`),
        h('p', { class: 'q' }, 'Is it a need or a want? What would you give up for it?'),
        h('div', { class: 'opts' }, h('button', { class: 'opt', onclick: () => close(0) }, 'Buy it. I can cover my bills and it helps me look ready.'), h('button', { class: 'opt', onclick: () => close(1) }, 'Skip it for now. Bills come first.'))), { icon: '🧠', noClose: true });
    }
    if (c === 0) {
      const due = this.upcomingBills(7), canCover = s.money - price >= due * 0.5;
      this.spend(price, 'Thread & Co hoodie (Jax)'); s.mood = Math.min(100, s.mood + 12);
      if (!s.wardrobe.includes('gold')) s.wardrobe.push('gold');
      this.edu.record('think.opportunity', canCover, { ctx: 'jax' });
      if (canCover) s.stats.wiseChoices = (s.stats.wiseChoices || 0) + 1;
      this.hooks.npcExpr('Jax', 'Happy');
      await UI.say(J, 'Now THAT’S a REAL. See? Was that so hard?', null, { tone: 'jax' });
      UI.toast(canCover ? 'You can still cover this week’s bills. A want, but an affordable one.' : `Careful: ${money(due)} in bills are due this week and you now have ${money(s.money)}.`, canCover ? 'info' : 'warn', 4500);
    } else if (c === 1) {
      s.stats.wiseChoices = (s.stats.wiseChoices || 0) + 1; this.edu.record('think.opportunity', true, { ctx: 'jax' }); this.achieve('said_no');
      this.hooks.npcExpr('Jax', 'Surprised');
      await UI.say(J, 'Saving it? Boring. …But fine. Most people can’t say no to me.', null, { tone: 'jax' });
    } else {
      await UI.say(J, 'Running already? Fine. This city has more angles than you think. See you around.', null, { tone: 'jax' });
    }
    this.befriend('Jax', 0.5);
    s.flags.jax1 = true; s.quest = 'home'; this.hooks.jaxLeave(); this.save();
  }
  async jaxSteal() {
    const s = this.state, J = 'Jax';
    this.hooks.npcExpr('Jax', 'Confident');
    await UI.say(J, `${s.name}. The clerk at Thread & Co is in the back. That cap on the rack, $25, nobody’s watching.`, null, { tone: 'jax' });
    const c = await UI.say(J, 'You deserve it. Just get it. You can make the money back.', ['Take it', 'That’s stealing. No.', 'Buy it the normal way ($25)', 'Walk away'], { tone: 'jax' });
    this.edu.discover('think.consequence');
    if (c === 0) {
      s.stats.thefts = (s.stats.thefts || 0) + 1; this.edu.record('think.consequence', false, { ctx: 'jax' });
      this.sfx('bad');
      await UI.say('Store clerk · Thread & Co', 'Hey! That cap isn’t paid for. Put it back. I have to write this up: a $25 penalty, and you can’t shop here for two days.');
      this.spend(25, 'Penalty: Thread & Co'); s.flags.bannedClothing = s.day + 2; s.mood = Math.max(0, s.mood - 15);
      this.hooks.npcExpr('Jax', 'Surprised');
      await UI.say(J, 'Whoa. I didn’t think you’d actually do it.', null, { tone: 'jax' });
      await UI.sheet('What happened', (close) => h('div', { class: 'act' }, h('p', { class: 'lead' }, 'Taking it without paying cost you $25 anyway, plus a store ban and your good name.'),
        h('p', { class: 'tip' }, 'Mistakes don’t define you. The penalty is short, and you can rebuild trust by doing the right thing next time.'), h('button', { class: 'primary', onclick: () => close() }, 'I understand')), { icon: '⚖️', noClose: true });
    } else if (c === 1) {
      s.stats.wiseChoices = (s.stats.wiseChoices || 0) + 1; this.edu.record('think.consequence', true, { ctx: 'jax' }); this.achieve('honest'); this.befriend('Jax', 0.5);
      this.hooks.npcExpr('Jax', 'Thinking');
      await UI.say(J, 'Relax. I was testing you. …Mostly.', null, { tone: 'jax' });
    } else if (c === 2) {
      if (s.money >= 25) { this.spend(25, 'Thread & Co cap'); s.mood = Math.min(100, s.mood + 8); this.edu.record('think.consequence', true, { ctx: 'jax' }); await UI.say(J, 'Paying full price. Look at you, a model citizen.', null, { tone: 'jax' }); }
      else await UI.say(J, 'With what money? Ha. Fine, forget it.', null, { tone: 'jax' });
    }
    s.flags.jaxSteal = true; s.flags.jaxStealDue = false; this.hooks.jaxLeave(); this.save();
  }
  async jax3() {
    const s = this.state, J = 'Jax';
    this.hooks.npcExpr('Jax', 'Thinking');
    await UI.say(J, `${s.name}. Not here to sell you anything. Promise.`, null, { tone: 'jax' });
    await UI.say(J, 'Daily Grind needs a weekend barista. $15 an hour, plus tips. You’ve got register experience now. That counts.', null, { tone: 'jax' });
    const c = await UI.say(J, 'Two incomes beat one. Just saying.', ['Thanks, Jax. I’ll check it out.', 'What’s the catch?', 'Why are you helping me?'], { tone: 'jax' });
    if (c === 1) await UI.say(J, 'No catch. Even I give good advice sometimes. Don’t tell anyone.', null, { tone: 'jax' });
    if (c === 2) await UI.say(J, 'Because watching you start from nothing is… weirdly interesting. Don’t make it weird.', null, { tone: 'jax' });
    s.flags.baristaTip = true; s.flags.jax3 = true; s.flags.jax3due = false; this.befriend('Jax', 1); this.edu.record('think.evaluate', true, { ctx: 'jax' }); this.save();
    this.hooks.jaxLeave();
  }

  async coffee() {
    const s = this.state; this.befriend('Dee', s.flags[`dee${s.day}`] ? 0.1 : 0.8); s.flags[`dee${s.day}`] = true;   // a daily hello builds a real friendship
    if (s.flags.baristaTip && !s.jobs.includes('barista')) {
      await UI.say('Dee · Daily Grind', 'Jax sent you? Ha. If you can work the register and stay calm, you’re hired for weekend shifts.');
      const r = await A.register(this);
      if (r && r.ok) { s.jobs.push('barista'); this.message('Daily Grind', 'Welcome to the team! Weekend shifts (Day 6, 7, 13, 14…) pay $15/hour plus tips.'); this.befriend('Dee', 2); this.save(); }
      return;
    }
    if (s.jobs.includes('barista') && [6, 0].includes(s.day % 7) && !s.flags[`brew${s.day}`]) {
      const r = await A.register(this);
      if (r && r.ok) { s.flags[`brew${s.day}`] = true; const net = await A.paystub(this, 4, 15, 8, 'DAILY GRIND'); this.earn(net, 'Daily Grind pay + tips'); s.stats.shifts++; this.save(); }
      return;
    }
    return A.menuBuy(this, 'Daily Grind Coffee', '☕', [
      { name: 'Drip coffee', price: 2.25, icon: '☕', note: '+12 energy', apply: () => { s.energy = Math.min(100, s.energy + 12); } },
      { name: 'Oat latte', price: 4.75, icon: '🥛', note: '+15 energy, +mood. Twice the price for 3 more energy?', apply: () => { s.energy = Math.min(100, s.energy + 15); s.mood += 5; } },
      { name: 'Bagel', price: 2.5, icon: '🥯', note: '+20 food', apply: () => this.feed(20) }]);
  }
  async clothing() {
    const s = this.state;
    if (s.flags.bannedClothing && s.day < s.flags.bannedClothing) return UI.toast(`Thread & Co won’t serve you until Day ${s.flags.bannedClothing}.`, 'warn');
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
  async training() {
    await A.teach(this, 'read.instructions', 'Training board');
    await UI.sheet('Training board', (close) => h('div', { class: 'act' },
      h('h3', {}, 'New cashier checklist'),
      h('ol', { class: 'list' }, h('li', {}, 'Greet every customer.'), h('li', {}, 'Scan every item. Check the total.'), h('li', {}, 'Count change back starting from the total.'), h('li', {}, 'Stock items in the aisle that matches the sign.'), h('li', {}, 'Ask your manager when unsure.')),
      h('p', { class: 'lead' }, 'What do you do right after scanning every item?'),
      h('div', { class: 'opts' }, ['Check the total', 'Greet the customer', 'Stock the shelves'].map((o) => h('button', { class: 'opt', onclick: (e) => { const ok = o === 'Check the total'; this.edu.record('read.instructions', ok, { ctx: 'training' }); if (ok) { this.sfx('good'); close(); } else { this.sfx('bad'); e.currentTarget.classList.add('wrong'); } } }, o)))), { icon: '📋' });
  }

  async sleep() {
    const s = this.state;
    if (s.time < 19 && s.energy > 40) { UI.toast('It’s too early to sleep. Come back tonight.', 'info'); return; }
    this.busy = true;
    await UI.fade(1, 700);
    const earned = s.bank.filter((t) => t.day === s.day && t.amt > 0).reduce((a, t) => a + t.amt, 0);
    const spent = -s.bank.filter((t) => t.day === s.day && t.amt < 0).reduce((a, t) => a + t.amt, 0);
    if (s.hunger > 25) s.stats.goodNights = (s.stats.goodNights || 0) + 1;
    if (s.flags.housed && s.hunger > 10) s.stats.daysIndependent = (s.stats.daysIndependent || 0) + 1;
    s.day++; s.time = 7.0; s.energy = 100; s.hunger = Math.max(10, s.hunger - 25); s.flags.ate = false; s.flags.billsSeen = false;
    const late = s.bills.filter((b) => !b.paid && b.due < s.day && !b.lateFee);
    for (const b of late) { b.lateFee = true; b.amount += 15; s.mood -= 10; s.stats.lateFees = (s.stats.lateFees || 0) + 1; }
    // recurring weekly bills
    for (const b of s.bills.filter((x) => x.paid && !x.renewed && (x.recur || /^(rent|util|phone)/.test(x.id)) && x.due <= s.day)) {
      b.renewed = true; const kind = b.id.replace(/\d+$/, ''), n = parseInt(b.id.replace(/\D/g, ''), 10) + 1;
      if (kind === 'bizloan' && s.biz) s.biz.loan = Math.max(0, Math.round((s.biz.loan - b.amount) * 100) / 100);
      if (b.left === 0) continue;
      if (kind === 'rent' && !s.home && (s.subsidyWeeks ?? 3) > 0) s.subsidyWeeks = (s.subsidyWeeks ?? 3) - 1;
      const amount = kind === 'rent' ? (s.rent || (s.home && s.home !== 'starter' ? b.recur : (s.subsidyWeeks ?? 3) > 0 ? 150 : 300)) : b.recur || (kind === 'util' ? 20 : 25);
      s.bills.push({ ...b, id: kind + n, name: b.name.replace(/\(week \d+\)/, `(week ${n + 1})`), amount, due: b.due + (b.period || (kind === 'phone' ? 30 : 7)), paid: false, renewed: false, lateFee: false, left: b.left === undefined ? undefined : b.left - 1 });
      if (kind === 'rent') s.stats.rentPaidSelf = (s.stats.rentPaidSelf || 0) + 0;
    }
    const nightNotes = this.nightly ? this.nightly() : [];
    s.bills = s.bills.filter((b) => !b.paid || s.day - b.due < 7);
    this.edu.dailyReview(s.day);
    if (s.quest === 'home') s.quest = 'free';
    this.save();
    const ll = this.life();
    await UI.fade(0, 500);
    await UI.sheet(`Day ${s.day - 1} complete`, (close) => h('div', { class: 'act' },
      h('div', { class: 'budget' }, h('div', {}, h('small', {}, 'EARNED'), h('b', { class: 'pos' }, money(earned))), h('div', {}, h('small', {}, 'SPENT'), h('b', { class: 'neg' }, money(spent))), h('div', {}, h('small', {}, 'BALANCE'), h('b', {}, money(s.money)))),
      ...nightNotes.map((n) => h('p', { class: 'tip' }, n)),
      late.length ? h('p', { class: 'warnline' }, `Late fee: ${late.map((b) => b.name).join(', ')} +$15. Pay bills before their due date. You can catch up.`) : null,
      h('div', { class: 'lifering' }, h('b', {}, `Life Level ${ll.level}`), h('div', { class: 'bar' }, h('i', { style: { width: Math.round(100 * (ll.total % 6) / 6) + '%' } }))),
      h('p', { class: 'tip' }, pick(['Small steps lead to big things.', 'Rest today. Stronger tomorrow.', 'Understand the why.', 'From zero to REAL.', 'Mistakes don’t define you.'])),
      h('button', { class: 'primary', onclick: () => close() }, 'Wake up')), { icon: '🌙', noClose: true });
    this.busy = false;
    const due = s.bills.find((b) => !b.paid && b.due === s.day);
    if (due) this.message('Reminder', `${due.name} (${money(due.amount)}) is due today. Pay it in the Bills app.`);
    if (s.flags.jaxStealDue) this.message('Unknown number', 'Hey. It’s Jax. Swing by Thread & Co after work.');
    if (s.flags.jax3due) this.message('Jax', 'Meet me at the corner of Main & Fresh. Got some real info for you.');
    const broke = s.money < 30 || s.bills.some((b) => !b.paid && /^rent/.test(b.id) && b.due < s.day);
    if (broke && s.flags.housed) this.message('Mr. Okafor', 'Rough week? The Community Center has a food bank, rent payment plans and budgeting help. Come see me any time.');
    if (s.flags.jax1 && !s.flags.jaxStealDue && !s.flags.jax3due && s.day % 3 === 0) { await wait(400); await this.jaxAdvice(); }
  }
  async passOut() {
    this.busy = true;
    UI.toast('You stayed out too late and fell asleep on a bench…', 'warn', 3000);
    await wait(1200);
    this.state.energy = 50; this.state.mood -= 10;
    this.hooks.enterApartment(true);
    this.busy = false;
    await this.sleep();
  }

  // ------------------------------------------------------------------ Chapters 11–12: the Invitation and the REAL decision
  endingText(kind) {
    return {
      return: ['You accept.', 'You walk back into The Club through your own accomplishments.', 'Membership is a resource now, not who you are.'],
      reject: ['You decline.', 'The life you built is already meaningful.', 'Independence was the membership you were looking for.'],
      rebuild: ['You ask for something bigger.', 'Opportunity shouldn’t wait behind a gate for people who already made it.', 'You start a mentorship network for the next REAL who arrives with nothing.'],
    }[kind];
  }
}

// ---------------------------------------------------------------------------------------- phone
export function openPhone(G) {
  const s = G.state;
  if (s.chapter === 'prologue') { UI.toast('Your Club phone buzzes: “Council Room. Now.”', 'gold', 3200); return Promise.resolve(); }
  if (!s.flags.phone) { UI.toast('Your old Club phone has no service. Everything connected to The Club was cut off.', 'warn', 3600); return Promise.resolve(); }
  G.sfx('phone');
  return UI.sheet('', (close, body) => {
    const apps = [['Bank', '🏦', '#2f5bd2'], ['Jobs', '💼', '#8b2f3c'], ['Map', '📍', '#2f8f5a'], ['Messages', '💬', '#2f8f5a'], ['Bills', '🧾', '#2a9fd6'], ['Calendar', '📅', '#d24f2f'],
      ['Learn', '📚', '#5a3fd2'], ['Business', '🚀', '#b2632a'], ['Goals', '🎯', '#2a9fd6'], ['Stats', '📊', '#2f5bd2'], ['Discover', '🧭', '#e8823a'], ['Home', '🏡', '#2f8f5a'], ['Pal', '🧸', '#d24f9a'], ['Neighbors', '👋', '#2a9fd6'], ['Club', '♛', '#e8a33a'], ['Words', '📖', '#b5651d'], ['Settings', '⚙️', '#55607e'], ['Feedback', '📝', '#7a7f99']];
    const unread = s.messages.filter((m) => !m.read).length;
    const home = () => body.replaceChildren(h('div', { class: 'phone' },
      h('div', { class: 'ph-top' }, h('b', {}, clock(s.time)), h('small', {}, `Day ${s.day} · ${money(s.money)}`)),
      h('div', { class: 'ph-grid' }, apps.map(([n, ic, c]) => h('button', { class: 'app', onclick: () => { G.sfx('click'); open(n); } },
        h('span', { class: 'app-ic', style: { background: c } }, ic, n === 'Messages' && unread ? h('i', { class: 'badge' }, unread) : null), h('small', {}, n))))));
    const back = h('button', { class: 'ghost', onclick: () => home() }, '‹ Home');
    const open = (n) => {
      if (n === 'Learn') { close(); A.learn(G); return; }
      if (n === 'Bills') { close(); A.bills(G); return; }
      const ll = G.life();
      const page = {
        Bank: () => h('div', {}, h('div', { class: 'budget' }, h('div', {}, h('small', {}, 'CHECKING'), h('b', {}, money(s.money))), h('div', {}, h('small', {}, 'EARNED'), h('b', { class: 'pos' }, money(s.stats.earned))), h('div', {}, h('small', {}, 'SPENT'), h('b', { class: 'neg' }, money(s.stats.spent)))),
          h('div', { class: 'tx' }, s.bank.slice(0, 30).map((t) => h('div', { class: 'rline' }, h('span', {}, `Day ${t.day} · ${t.desc}`), h('span', { class: t.amt < 0 ? 'neg' : 'pos' }, money(t.amt)))))),
        Jobs: () => h('div', { class: 'act' }, ...TIER_NAMES.map((tn, t) => h('div', { class: 'tier' }, h('div', { class: 'tier-h' }, `Tier ${t} · ${tn}`),
          CAREERS.filter((c) => c.tier === t).map((c) => { const st = careerStatus(c, s, G.edu, ll.level); return h('div', { class: 'bill' + (st.held ? ' paid' : '') }, h('div', {}, h('b', {}, c.title), h('small', {}, st.held ? 'Your job ✓' : st.ready ? (st.playable ? 'Available now' : `Ready · ${c.where}`) : st.missing.slice(0, 2).join(' · '))), c.rate ? h('span', { class: 'amt' }, `$${c.rate}`) : null); })))),
        Map: () => h('div', { class: 'act' }, h('div', { class: 'tier-h' }, 'Starting District'), h('ul', { class: 'list' }, h('li', {}, '🏠 The Starter Apartments · 🛒 Fresh Mart · 🤝 Community Center'), h('li', {}, '☕ Daily Grind · 🍔 Diner · 🧥 Thread & Co · 🏋️ Grow Gym'), h('li', {}, '🌳 Brighter Park and the 🚌 bus stop: southeast'), h('li', {}, '🛣️ The old road south · ♛ The Club on the hill')),
          ...Object.entries(G.hooks.DISTRICTS).map(([id, d]) => h('div', {}, h('div', { class: 'tier-h' }, `${d.name} ${ll.level >= d.life ? '' : '· Life Level ' + d.life}`), h('ul', { class: 'list' }, h('li', {}, d.buildings.map((x) => x.sign ? x.sign[0].replace(/\b(\w)(\w*)/g, (m, p, q) => p + q.toLowerCase()) : 'Overlook Park').join(' · '))))),
          h('p', { class: 'tip' }, 'Ride the bus from any bus stop. Districts open as your Life Level grows, never by wealth.')),
        Messages: () => { s.messages.forEach((m) => (m.read = true)); return h('div', { class: 'msgs' }, s.messages.map((m) => h('div', { class: 'msg' }, h('b', {}, m.from), h('small', {}, `Day ${m.day}`), (() => { const p = h('p', {}, m.text); markWords(p); return p; })()))); },
        Calendar: () => h('div', {}, h('button', { class: 'primary', onclick: () => { close(); G.planWeek(); } }, '🗓️ Plan my week'), h('div', { class: 'bill-list' }, [...Array(7)].map((_, i) => { const d = s.day + i; const ev = [];
          if (s.flags.hired) ev.push('Fresh Mart shift available (7 AM–5 PM)');
          if (s.jobs.includes('barista') && [6, 0].includes(d % 7)) ev.push('Daily Grind weekend shift');
          for (const j of s.jobs.filter((j) => G.hooks.WORK[j])) ev.push(`${G.hooks.CAREERS.find((c) => c.id === j).employer} shift`);
          for (const [cid, c] of Object.entries(s.courses || {})) if (!c.done) ev.push(`Class: ${G.hooks.COURSES[cid].name}`);
          if (s.vehicle && s.vehicle.type !== 'bike' && s.vehicle.service + 10 === d) ev.push('Vehicle service due');
          for (const b of s.bills.filter((b) => !b.paid && b.due === d)) ev.push(`Due: ${b.name} ${money(b.amount)}`);
          if (s.flags.jaxChallenge && !s.flags.jaxChallengeDone && s.flags.jaxChallenge.by === d) ev.push('Jax’s $300 challenge deadline');
          return h('div', { class: 'bill' }, h('div', {}, h('b', {}, i === 0 ? `Today · Day ${d}` : `Day ${d}`), h('small', {}, ev.join(' · ') || 'Free day'))); }))),
        Business: () => s.biz ? h('div', { class: 'act' }, h('div', { class: 'budget' }, h('div', {}, h('small', {}, 'DAYS'), h('b', {}, s.biz.days)), h('div', {}, h('small', {}, 'PROFIT'), h('b', { class: s.biz.profit >= 0 ? 'pos' : 'neg' }, money(s.biz.profit))), h('div', {}, h('small', {}, 'TEAM'), h('b', {}, s.biz.staff.length))),
            h('b', {}, s.biz.name + (s.biz.store ? ' · Midtown storefront' : ' · Brighter Park')), s.biz.loan > 0 ? h('p', { class: 'warnline' }, `Loan balance ${money(s.biz.loan)}`) : null,
            h('div', { class: 'tx' }, s.biz.log.map((l) => h('div', { class: 'rline' }, h('span', {}, `Day ${l.day}${l.team ? ' (team)' : ''} · sold ${l.sold}/${l.demand}`), h('span', { class: l.profit < 0 ? 'neg' : 'pos' }, money(l.profit))))),
            h('button', { class: 'primary', onclick: () => { close(); G.runBusiness(); } }, 'Run today'), h('p', { class: 'tip' }, 'Hire staff and open a storefront at the Small Business Center (Opportunity District).'))
          : h('div', { class: 'act' }, h('p', { class: 'lead' }, 'Tier 4 · Entrepreneurship. Build something that’s yours.'),
            h('div', { class: 'bill' }, h('div', {}, h('b', {}, '1. Write a business plan'), h('small', {}, s.achievements.plan ? 'Plan written ✓' : 'Research customers, calculate startup costs and profit.'))),
            h('div', { class: 'bill' }, h('div', {}, h('b', {}, '2. Register it'), h('small', {}, 'At the Small Business Center in the Opportunity District (Life Level 5).'))),
            h('button', { class: 'primary', onclick: () => { close(); A.businessPlan(G); } }, s.achievements.plan ? 'Revise the plan' : 'Start the plan')),
        Home: () => { const H = G.hooks.HOMES[s.home || 'starter'], v = s.vehicle && G.hooks.VEHICLES[s.vehicle.type]; return h('div', { class: 'act' },
          h('div', { class: 'bill' }, h('div', {}, h('b', {}, '🏠 ' + H.name), h('small', {}, s.home === 'owned' ? `Mortgage ${money(s.rent)}/week` : `Rent ${money(s.rent || ((s.subsidyWeeks ?? 3) > 0 ? 150 : 300))}/week`))),
          h('div', { class: 'bill' }, h('div', {}, h('b', {}, v ? `${v.icon} ${v.name}` : '🚌 Bus rider'), h('small', {}, v ? (s.vehicle.type === 'bike' ? 'No running costs.' : `Last service: Day ${s.vehicle.service}${s.day - s.vehicle.service >= 10 ? ' · SERVICE DUE at Midtown Motors' : ''}`) : 'Vehicles are sold at Midtown Motors.'))),
          s.pet ? h('div', { class: 'bill' }, h('div', {}, h('b', {}, `${G.hooks.PET_TYPES[s.pet.type].icon} ${s.pet.name}`), h('small', {}, `Bond ${'♥'.repeat(Math.max(1, Math.round(s.pet.bond / 2)))} · ${s.pet.fed === s.day ? 'Fed today' : 'Hungry: feed at home'}`)), h('button', { class: 'primary sm', onclick: () => { G.petCare('play'); open('Home'); } }, 'Play')) : h('div', { class: 'bill' }, h('div', {}, h('b', {}, '🐾 No pet yet'), h('small', {}, 'Paws & Friends shelter in Midtown.'))),
          s.savings ? h('div', { class: 'bill' }, h('div', {}, h('b', {}, '🏦 Savings'), h('small', {}, `${money(s.savings)} earning 1% a week`))) : null); },
        Discover: () => G.discoverApp(body, open),
        Pal: () => { setTimeout(() => { close(); G.companion(); }, 0); return h('div'); },
        Neighbors: () => { const n = G.hooks.peers ? G.hooks.peers() : null; return h('div', { class: 'act' },
          h('p', { class: 'lead' }, n === null ? 'Neighbors appear when you play REAL in its shared link. Right now you’re playing solo.' : n ? `${n} other REAL${n === 1 ? '' : 's'} in the city right now.` : 'No other REALs are online right now.'),
          h('p', {}, 'Other players appear as REALs walking in the same district. Everyone stays anonymous: no names, no chat, no trading, only friendly gestures.'),
          h('div', { class: 'opts' }, ['👋 Wave', '🎉 Cheer', '👍 Thumbs up', '💡 Idea!'].map((e, i) => h('button', { class: 'opt', onclick: () => { G.hooks.emote && G.hooks.emote(i); close(); } }, e)))); },
        Goals: () => h('div', { class: 'act' }, h('p', { class: 'lead' }, 'Now: ' + (G.objective().text || '—')),
          h('div', { class: 'bill-list' }, [['Find your way to the city', !!s.achievements.found_way], ['Find a place to live', !!s.flags.housed], ['Get your first job', !!s.flags.hired], ['Earn your first paycheck', s.stats.shifts >= 1], ['Pay rent on time', !!s.achievements.rent_on_time], ['Hold two jobs', s.jobs.length >= 2], ['Save $300', s.money >= 300], ['Earn a promotion', !!s.achievements.promoted], [`Reach Life Level ${INVITE_LEVEL}`, ll.level >= INVITE_LEVEL], ['Make the REAL decision', !!s.ending], ['Visit Midtown, Opportunity and The Heights', !!s.achievements.explorer], ['Get a Tier 2 career', !!s.achievements.career], ['Complete a course', !!s.achievements.graduate], ['Open your own business', !!s.biz], ['Hire an employee', !!s.achievements.boss], ['Buy a vehicle', !!s.vehicle], ['Move to a better home', !!s.achievements.moved_up || !!s.achievements.homeowner], ['Adopt a pet', !!s.pet], ['Make three friends', !!s.achievements.friend3], ['Clear a challenge zone', !!s.achievements.challenge], ['Become a Tier 3 professional', !!s.achievements.professional], ['Buy a home', !!s.achievements.homeowner]].map(([t, d]) =>
            h('div', { class: 'bill' + (d ? ' paid' : '') }, h('div', {}, h('b', {}, t)), h('span', { class: 'ok' }, d ? '✓' : '○'))))),
        Stats: () => h('div', { class: 'act' }, h('div', { class: 'lifering' }, h('b', {}, `Life Level ${ll.level}`), h('small', {}, 'Growth across your whole life. Never a measure of your worth.')),
          h('div', { class: 'skills' }, LIFE_CATS.map(([k, n, ic]) => h('div', { class: 'skill' }, h('span', {}, `${ic} ${n}`), h('div', { class: 'bar' }, h('i', { style: { width: ll.scores[k] * 10 + '%' } })), h('b', {}, ll.scores[k].toFixed(0))))),
          h('div', { class: 'tier-h' }, 'Achievements'), h('div', { class: 'ach' }, Object.keys(s.achievements).map((a) => h('span', { class: 'chip' }, '🏆 ' + ACHIEVEMENTS[a][0])))),
        Club: () => h('div', { class: 'act center' }, h('div', { class: 'big-emoji gold' }, '♛'),
          s.ending ? h('div', {}, h('h3', {}, { return: 'Member (returned)', reject: 'Declined membership', rebuild: 'Founder: Open Door Network' }[s.ending]), h('p', {}, G.endingText(s.ending).join(' ')))
            : s.flags.invited ? h('div', {}, h('h3', {}, 'You have been invited back'), h('p', {}, 'Take the bus to The Club when you are ready.'))
              : h('div', {}, h('h3', {}, 'Membership revoked'), h('p', {}, '“You’ve experienced what success looks like. But have you ever experienced what it takes?”'),
                h('p', { class: 'tip' }, `The Council looks for independence, responsibility, knowledge and personal achievement: Life Level ${ll.level} of ${INVITE_LEVEL}, and at least ${INVITE_MIN_DAY} days on your own (day ${s.day}).`))),
        // playtest notes: write what felt off; each note records where you were, so it can be found and fixed
        Feedback: () => {
          const KEY = 'real.feedback.v1';
          const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } };
          const list = h('div', { class: 'bill-list' });
          const draw = () => { const notes = load(); list.replaceChildren(...(notes.length ? notes.slice().reverse().map((n) => h('div', { class: 'bill' }, h('div', {}, h('b', {}, n.text), h('small', {}, `Day ${n.day} ${n.clock} · ${n.where} · goal: ${n.goal}`)))) : [h('p', { class: 'tip' }, 'No notes yet.')])); };
          const ta = h('textarea', { class: 'writebox', rows: 3, maxlength: 600, placeholder: 'What felt wrong, confusing, too hard, too easy, or fun?' });
          const save = () => {
            const t = ta.value.trim(); if (!t) return UI.toast('Type a note first.', 'info');
            const ob = G.objective();
            const note = { text: t, day: s.day, clock: clock(s.time), where: s.location + (s.room ? ':' + s.room.key : ''), goal: ob.text || '', quest: s.quest, ll: G.life().level, screen: `${innerWidth}×${innerHeight}`, device: navigator.userAgent.slice(0, 120), at: new Date().toISOString() };
            const notes = load(); notes.push(note); try { localStorage.setItem(KEY, JSON.stringify(notes.slice(-200))); } catch (e) {}
            ta.value = ''; UI.toast('Saved. Thank you!', 'good'); draw();
          };
          const asText = () => load().map((n, i) => `${i + 1}. ${n.text}\n   [Day ${n.day} ${n.clock} · ${n.where} · quest ${n.quest} · LL ${n.ll} · goal: ${n.goal} · screen ${n.screen} · ${n.device}]`).join('\n');
          const copy = async () => { const t = asText(); if (!t) return UI.toast('No notes yet.', 'info'); try { await navigator.clipboard.writeText(t); UI.toast('Copied. Paste it into a message to send it.', 'good', 3200); } catch (e) { ta.value = t; ta.select(); UI.toast('Select the text in the box and copy it.', 'info', 3200); } };
          const share = async () => { const t = asText(); if (!t) return UI.toast('No notes yet.', 'info'); if (navigator.share) { try { await navigator.share({ title: 'REAL playtest notes', text: t }); } catch (e) {} } else copy(); };
          draw();
          return h('div', { class: 'act' }, h('p', { class: 'lead' }, 'Playtest notes'), h('p', { class: 'tip' }, 'Write anything that felt off. Each note remembers where you were and what your goal said.'),
            ta, h('div', { class: 'row' }, h('button', { class: 'primary sm', onclick: save }, 'Save note'), h('button', { class: 'ghost sm', onclick: copy }, 'Copy all'), h('button', { class: 'ghost sm', onclick: share }, 'Share')),
            list, h('button', { class: 'ghost sm', onclick: () => { if (confirm('Delete all notes?')) { try { localStorage.removeItem(KEY); } catch (e) {} draw(); } } }, 'Clear notes'));
        },
        Words: () => A.myWords(G),
        Settings: () => h('div', { class: 'act' },
          h('div', { class: 'row' }, h('span', {}, 'Graphics'), ...['low', 'medium', 'high'].map((q) => h('button', { class: G.hooks.quality() === q ? 'primary sm' : 'ghost sm', onclick: () => { G.hooks.setQuality(q); open('Settings'); } }, q))),
          h('div', { class: 'row' }, h('span', {}, 'Time'), ...[[1, 'Normal'], [3, 'Fast']].map(([v, n]) => h('button', { class: (s.timeScale || 1) === v ? 'primary sm' : 'ghost sm', onclick: () => { s.timeScale = v; open('Settings'); } }, n))),
          h('div', { class: 'tier-h' }, 'Accessibility'),
          ...[['smart', 'Smart character replies', true]].map(([k, n]) => { s.settings = s.settings || {}; const on = s.settings[k] !== false; return h('div', { class: 'row' }, h('span', {}, n), h('button', { class: on ? 'primary sm' : 'ghost sm', onclick: () => { s.settings[k] = !on; G.hooks.applyA11y(s.settings); G.save(); open('Settings'); } }, on ? 'On' : 'Off')); }),
          ...[['large', 'Bigger text'], ['contrast', 'High contrast'], ['readAloud', 'Read to me (all text)'], ['calm', 'Reduce motion']].map(([k, n]) => { s.settings = s.settings || {}; return h('div', { class: 'row' }, h('span', {}, n), h('button', { class: s.settings[k] ? 'primary sm' : 'ghost sm', onclick: () => { s.settings[k] = !s.settings[k]; G.hooks.applyA11y(s.settings); G.save(); open('Settings'); } }, s.settings[k] ? 'On' : 'Off')); }),
          h('div', { class: 'row' }, h('span', {}, 'Live neighbors'), h('button', { class: (s.settings || {}).noNeighbors ? 'ghost sm' : 'primary sm', onclick: () => { s.settings = s.settings || {}; s.settings.noNeighbors = !s.settings.noNeighbors; G.save(); open('Settings'); } }, (s.settings || {}).noNeighbors ? 'Off' : 'On')),
          h('button', { class: 'ghost', onclick: () => open('Grown-ups') }, '👪 For grown-ups: privacy & progress'),
          h('div', { class: 'row' }, h('span', {}, 'Sound'), h('button', { class: 'ghost sm', onclick: (e) => { e.currentTarget.textContent = G.hooks.toggleSound() ? 'On' : 'Off'; } }, G.hooks.soundOn() ? 'On' : 'Off')),
          h('div', { class: 'row' }, h('button', { class: 'ghost sm', onclick: () => { G.save(); UI.toast('Game saved.', 'good'); } }, 'Save now'), h('button', { class: 'danger sm', onclick: (e) => {
            if (e.currentTarget.dataset.arm) { clearSave(); location.reload(); } else { e.currentTarget.dataset.arm = 1; e.currentTarget.textContent = 'Tap again to erase'; }
          } }, 'New game'))),
        'Grown-ups': () => h('div', { class: 'act' },
          h('p', { class: 'lead' }, 'REAL teaches reading, writing, cursive, math, money, science, critical thinking, social studies, health & life skills and technology (209 skills in six levels) through everyday life in the game.'),
          h('div', { class: 'tier-h' }, 'Privacy'),
          h('ul', { class: 'list' }, h('li', {}, 'Progress is saved only on this device. No account, no email, no ads, no purchases.'), h('li', {}, 'Learning records are private and never compared with other players.'), h('li', {}, 'Live neighbors (shared link only) see an anonymous character and 4 preset gestures. No names, chat or trading. You can turn it off above.'), h('li', {}, 'Characters never speak out loud; their lines are text. Players only speak in speaking-practice tasks (job interviews, work updates), where the 🎤 turns their words into text. They can always type instead.'), h('li', {}, 'Smart character replies (shared claude.ai link only): a player’s typed or spoken question or answer is sent to Claude with strict instructions to stay age-appropriate, stay in the game world and never ask for personal information. No name, account or save data is sent. Turn it off above to use only built-in answers.')),
          h('div', { class: 'tier-h' }, 'Learning progress'),
          h('div', { class: 'skills' }, Object.entries(SUBJECTS).map(([k, sb]) => { const p = G.edu.progress(k); const m = p.list.filter((x) => G.edu.state(x.id) >= 4).length, pr = p.list.filter((x) => G.edu.state(x.id) === 3).length; return h('div', { class: 'skill' }, h('span', {}, `${sb.icon} ${sb.name}`), h('div', { class: 'bar' }, h('i', { style: { width: p.pct + '%' } })), h('small', {}, `${m} mastered · ${pr} proficient · of ${p.list.length}`)); })),
          h('p', { class: 'tip' }, 'Mastery means the skill was used correctly without hints, in different places, on different days. Speed is never measured.'),
          h('button', { class: 'ghost', onclick: () => open('Settings') }, '‹ Settings')),
      }[n];
      body.replaceChildren(h('div', { class: 'phone app-page' }, h('div', { class: 'ph-top' }, back, h('b', {}, n)), page()));
    };
    home();
    return h('div');
  }, { cls: 'phone-sheet' });
}
