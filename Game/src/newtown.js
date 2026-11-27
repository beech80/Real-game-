// REAL — Newtown: grow the city with your money. South of the Starting District, where the empty road meets the city,
// there are eight empty lots. Buy one and build a workshop, shop, daycare or apartment building; hire people to work there;
// every night each building earns money, pays its team, and the profit is yours. Upgrade buildings to level 3. As more
// people work and live in Newtown, the neighborhood grows: street lamps, trees, benches, and a sign with its population.
// state.town = { lots: { [i]: { b, lvl, staff: [{ name, wage, skill, trait }], days, profit, last } }, built: n, told }
import { h, UI, money } from './ui.js';
import { tr } from './i18n.js';

const r2 = (v) => Math.round(v * 100) / 100;
const pick = (a) => a[Math.floor(Math.random() * a.length)];

// plan coordinates of the lots: two rows on each side of the road south of the city (the door faces the road)
export const LOTS = [[-14, -96], [14, -96], [-30, -96], [30, -96], [-14, -114], [14, -114], [-30, -114], [30, -114]];
export const doorOf = ([x, y]) => ({ x: x - Math.sign(x) * 5.6, y });

// cost to build · jobs at level 1 · what one worker brings in each day · what one worker is paid each day
export const BUILDS = {
  plants: { name: 'Plant nursery', icon: '🌱', cost: 800, jobs: 2, earn: 70, wage: 48, color: 0x5f9e57, roof: 0x2f5d2c, h: 4.2, what: 'Grows and sells plants and flowers.' },
  bike: { name: 'Bike workshop', icon: '🚲', cost: 1500, jobs: 3, earn: 95, wage: 60, color: 0x3d7fc4, roof: 0x1f3f66, h: 4.6, what: 'Fixes and sells bikes.' },
  bakery: { name: 'Bakery', icon: '🥐', cost: 2200, jobs: 3, earn: 110, wage: 64, color: 0xe0a85a, roof: 0x7a4a22, h: 4.8, what: 'Bakes bread every morning.' },
  sew: { name: 'Sewing studio', icon: '🧵', cost: 2600, jobs: 3, earn: 120, wage: 66, color: 0xc96fa6, roof: 0x6b2f55, h: 4.8, what: 'Makes and fixes clothes.' },
  wood: { name: 'Woodworking workshop', icon: '🪚', cost: 3000, jobs: 3, earn: 130, wage: 72, color: 0x9b6b3d, roof: 0x4d3219, h: 5.2, what: 'Builds tables, chairs and shelves.' },
  daycare: { name: 'Daycare', icon: '🧸', cost: 3800, jobs: 4, earn: 125, wage: 70, color: 0xf0c94a, roof: 0xd2643c, h: 4.6, what: 'Cares for little kids while families work.', grow: 6 },
  garage: { name: 'Car repair garage', icon: '🔧', cost: 4500, jobs: 4, earn: 160, wage: 88, color: 0x8a8f98, roof: 0x3a3f48, h: 5.6, what: 'Fixes cars and changes tires.' },
  tech: { name: 'Tech repair shop', icon: '💻', cost: 5000, jobs: 4, earn: 170, wage: 92, color: 0x4b5bd6, roof: 0x232b6b, h: 5.4, what: 'Fixes phones and computers.' },
  homes: { name: 'Apartment building', icon: '🏢', cost: 7000, jobs: 1, earn: 260, wage: 80, color: 0xb9694a, roof: 0x5a3324, h: 9.5, what: 'Homes for 12 families. They pay rent; one building manager keeps it running.', residents: 12 },
};
const NAMES = ['Maya', 'Omar', 'Jin', 'Sofia', 'Eli', 'Priya', 'Tomas', 'Zoe', 'Malik', 'Lucia', 'Ben', 'Aisha', 'Leo', 'Nia', 'Hugo', 'Grace', 'Ravi', 'Ivy', 'Dante', 'Mei', 'Owen', 'Rosa J.', 'Kofi', 'Lena'];
export const lvlMul = (l) => 1 + (l - 1) * 0.15;
export const jobsAt = (B, l) => B.jobs + (l - 1);
export const upgradeCost = (B, l) => Math.round(B.cost * 0.6 * l);
const town = (s) => (s.town = s.town || { lots: {}, built: 0 });
/** how many people work and live in Newtown */
export function population(s) {
  const T = town(s); let n = 0;
  for (const L of Object.values(T.lots)) { const B = BUILDS[L.b]; n += L.staff.length + 2 + (B.residents ? B.residents * L.lvl : 0) + (B.grow || 0); }
  return n;
}
export const STAGES = [[0, 'Empty lots'], [1, 'Newtown'], [12, 'Growing town'], [30, 'Busy neighborhood'], [55, 'Thriving town']];
export const stageOf = (s) => { const p = population(s), n = Object.keys(town(s).lots).length; let k = 0; STAGES.forEach(([min], i) => { if (n && p >= min) k = i; }); return k; };

/** one worker's expected day: what they bring in, minus their pay */
const dayOf = (B, L) => { let rev = 0, pay = 0; for (const w of L.staff) { rev += B.earn * w.skill * lvlMul(L.lvl); pay += w.wage; } return { rev: r2(rev), pay: r2(pay), upkeep: r2(B.cost * 0.004 * L.lvl) }; };

export function installNewtown(Game) {
  const P = Game.prototype;

  /** the Builder: every lot, what is on it, and what you can do */
  P.townApp = function (close) {
    const s = this.state, T = town(s), G = this;
    const st = stageOf(s), pop = population(s);
    if (!s.flags.hired) return h('div', { class: 'act town' }, h('p', { class: 'lead' }, 'Get your first job, and then you can start building Newtown.'));
    return h('div', { class: 'act town' },
      h('p', { class: 'lead' }, `🏗️ ${tr(STAGES[st][1])} · ${tr('population')} ${pop}`),
      h('p', { class: 'tip' }, 'Newtown is the open land at the south edge of the city, where the road comes in. Buy a lot, build, and hire people. Every night your buildings earn money and pay their team.'),
      h('div', { class: 'town-lots' }, ...LOTS.map((_, i) => {
        const L = T.lots[i], B = L && BUILDS[L.b];
        if (!L) return h('button', { class: 'opt town-lot empty', id: `lot-${i}`, onclick: () => { close && close(); G.buildAt(i); } }, h('b', {}, `${tr('Lot')} ${i + 1}`), h('small', {}, tr('Empty: tap to build')));
        const d = dayOf(B, L);
        return h('button', { class: 'opt town-lot', id: `lot-${i}`, onclick: () => { close && close(); G.manageLot(i); } },
          h('b', {}, `${B.icon} ${tr(B.name)}`), h('small', {}, `${tr('Level')} ${L.lvl} · ${L.staff.length}/${jobsAt(B, L.lvl)} ${tr('workers')} · ${tr('about')} ${money(d.rev - d.pay - d.upkeep)} ${tr('a day')}`));
      })));
  };

  /** build on an empty lot: choose a building, see the plan, answer one money question, build */
  P.buildAt = async function (i) {
    const s = this.state, T = town(s), G = this;
    if (T.lots[i]) return this.manageLot(i);
    if (!s.flags.hired) { UI.toast('Get your first job first. Then you can build in Newtown.', 'info', 3200); return; }
    const kind = await UI.sheet(`${tr('Lot')} ${i + 1}: ${tr('what will you build?')}`, (close) => h('div', { class: 'act town' },
      h('p', { class: 'lead' }, `${tr('You have')} ${money(s.money)}.`),
      ...Object.entries(BUILDS).map(([k, B]) => {
        const ok = s.money >= B.cost;
        return h('button', { class: 'opt town-pick' + (ok ? '' : ' short'), id: `build-${k}`, onclick: () => close(k) },
          h('b', {}, `${B.icon} ${tr(B.name)} · ${money(B.cost)}`), h('small', {}, `${tr(B.what)} ${B.jobs} ${tr('jobs')}. ${ok ? '' : tr('You need') + ' ' + money(B.cost - s.money) + ' ' + tr('more.')}`));
      })), { icon: '🏗️' });
    if (!kind) return;
    const B = BUILDS[kind];
    if (s.money < B.cost) { UI.toast(`${tr('You need')} ${money(B.cost - s.money)} ${tr('more to build a')} ${tr(B.name)}. ${tr('Save up, or grow your other buildings first.')}`, 'info', 4200); return; }
    // the plan: what one worker brings in and costs, and how long until the building pays for itself
    const per = B.earn - B.wage, perDay = per * B.jobs - B.cost * 0.004, payback = Math.ceil(B.cost / Math.max(1, perDay));
    const opts = [`$${per}`, `$${B.earn + B.wage}`, `$${B.wage}`].sort(() => Math.random() - 0.5);
    const c = await UI.say('Heart', `${tr('Quick plan!')} ${tr('One worker at the')} ${tr(B.name)} ${tr('brings in about')} $${B.earn} ${tr('a day and is paid')} $${B.wage}. ${tr('What is the profit from one worker each day?')}`, opts);
    if (opts[c] === `$${per}`) { G.sfx('good'); await UI.say('Heart', `${tr('Yes!')} $${B.earn} − $${B.wage} = $${per}. ${tr('With every job filled, it pays for itself in about')} ${payback} ${tr('days.')}`); }
    else await UI.say('Heart', `${tr('Profit is what comes in minus what goes out:')} $${B.earn} − $${B.wage} = $${per}. ${tr('With every job filled, it pays for itself in about')} ${payback} ${tr('days.')}`);
    const go = await UI.say('Heart', `${tr('Build a')} ${tr(B.name)} ${tr('for')} ${money(B.cost)}?`, [tr('Build it!'), tr('Not now')]);
    if (go !== 0) return;
    this.spend(B.cost, `Newtown: built a ${B.name}`);
    T.lots[i] = { b: kind, lvl: 1, staff: [], days: 0, profit: 0, last: s.day }; T.built = (T.built || 0) + 1;
    s.stats.townBuilt = (s.stats.townBuilt || 0) + 1; this.achieve && this.achieve('builder');
    G.sfx('level'); this.hooks.refreshWorld && this.hooks.refreshWorld();
    await UI.say('Heart', `${tr('Your')} ${tr(B.name)} ${tr('is built! Now hire people to work there. No workers, no sales.')}`);
    this.save();
    return this.hireFor(i);
  };

  /** hire for a building: three people with different experience and pay asks */
  P.hireFor = async function (i) {
    const s = this.state, L = town(s).lots[i], B = L && BUILDS[L.b], G = this; if (!L) return;
    if (L.staff.length >= jobsAt(B, L.lvl)) { UI.toast(`${tr(B.name)}: ${tr('every job is filled. Upgrade it for more jobs.')}`, 'info', 3000); return; }
    const used = new Set(Object.values(town(s).lots).flatMap((x) => x.staff.map((w) => w.name)));
    const free = NAMES.filter((n) => !used.has(n)).sort(() => Math.random() - 0.5);
    const cands = [
      { name: free[0] || 'Sam', skill: 1.15, wage: B.wage + 12, trait: 'Lots of experience. Asks for more pay.' },
      { name: free[1] || 'Ana', skill: 1.0, wage: B.wage, trait: 'Some experience. Asks the usual pay.' },
      { name: free[2] || 'Lee', skill: 0.8, wage: B.wage - 10, trait: 'New to this work. Asks for less pay, and gets better every day.' },
    ];
    const k = await UI.sheet(`${tr('Hire for the')} ${tr(B.name)}`, (close) => h('div', { class: 'act town' },
      h('p', { class: 'lead' }, `${L.staff.length}/${jobsAt(B, L.lvl)} ${tr('jobs filled')}. ${tr('Who will you hire?')}`),
      ...cands.map((c, n) => h('button', { class: 'opt', id: `hire-${n}`, onclick: () => close(n + 1) },
        h('b', {}, `${c.name} · ${money(c.wage)} ${tr('a day')}`), h('small', {}, `${tr(c.trait)} ${tr('Brings in about')} ${money(B.earn * c.skill * lvlMul(L.lvl))} ${tr('a day')}.`))),
      h('p', { class: 'tip' }, 'Experienced people cost more but bring in more. New people cost less and learn on the job.')), { icon: '👥' });
    if (!k) return;
    const c = cands[k - 1];
    L.staff.push(c); this.befriend && this.befriend(c.name, 0.5); this.achieve && this.achieve('boss');
    G.sfx('good'); UI.toast(`${c.name} ${tr('joins your')} ${tr(B.name)}!`, 'good', 2800);
    this.hooks.refreshWorld && this.hooks.refreshWorld(); this.save();
  };

  /** manage a building: its numbers, hire, upgrade, let someone go */
  P.manageLot = async function (i) {
    const s = this.state, L = town(s).lots[i], B = L && BUILDS[L.b], G = this; if (!L) return this.buildAt(i);
    const d = dayOf(B, L), up = L.lvl < 3 ? upgradeCost(B, L.lvl) : 0;
    const what = await UI.sheet(`${tr(B.name)} · ${tr('Level')} ${L.lvl}`, (close) => h('div', { class: 'act town' },
      h('div', { class: 'town-nums' },
        h('div', {}, h('small', {}, tr('Comes in each day')), h('b', {}, money(d.rev))),
        h('div', {}, h('small', {}, tr('Pay for the team')), h('b', {}, '−' + money(d.pay))),
        h('div', {}, h('small', {}, tr('Upkeep')), h('b', {}, '−' + money(d.upkeep))),
        h('div', { class: 'tot' }, h('small', {}, tr('Profit each day')), h('b', {}, money(d.rev - d.pay - d.upkeep)))),
      h('p', { class: 'tip' }, `${tr('Total profit so far')}: ${money(L.profit)} · ${L.days} ${tr('days open')}`),
      h('ul', { class: 'town-staff' }, ...(L.staff.length ? L.staff.map((w) => h('li', {}, `👤 ${w.name} · ${money(w.wage)} ${tr('a day')} · ${tr('skill')} ${Math.round(w.skill * 100)}%`)) : [h('li', {}, tr('No one works here yet. Hire someone to open.'))])),
      L.staff.length < jobsAt(B, L.lvl) ? h('button', { class: 'primary', id: 'town-hire', onclick: () => close('hire') }, `👥 ${tr('Hire someone')}`) : null,
      up ? h('button', { class: 'ghost', id: 'town-up', onclick: () => close('up') }, `⬆️ ${tr('Upgrade to level')} ${L.lvl + 1} · ${money(up)} (${tr('one more job, more sales')})`) : h('p', { class: 'tip' }, tr('Top level. This building is as big as it gets.')),
      L.staff.length ? h('button', { class: 'ghost sm', id: 'town-fire', onclick: () => close('fire') }, tr('Let someone go')) : null), { icon: B.icon });
    if (what === 'hire') return this.hireFor(i);
    if (what === 'up') {
      if (s.money < up) { UI.toast(`${tr('You need')} ${money(up - s.money)} ${tr('more to upgrade.')}`, 'info', 3000); return; }
      this.spend(up, `Newtown: upgraded the ${B.name}`); L.lvl++; G.sfx('level');
      UI.toast(`${B.icon} ${tr(B.name)}: ${tr('level')} ${L.lvl}! ${tr('One more job, and more sales.')}`, 'good', 3200);
      this.hooks.refreshWorld && this.hooks.refreshWorld(); this.save(); return;
    }
    if (what === 'fire') {
      const n = await UI.say('Heart', tr('Who will you let go? It is kind to give them a good reference.'), [...L.staff.map((w) => w.name), tr('Keep everyone')]);
      if (n < L.staff.length) { const w = L.staff.splice(n, 1)[0]; UI.toast(`${w.name} ${tr('moves on. You wrote them a good reference.')}`, 'info', 3000); this.save(); }
    }
  };

  /** every night: each building with a team earns, pays its people and its upkeep; new workers learn */
  P.townNightly = function () {
    const s = this.state, T = town(s), notes = []; let total = 0, any = false;
    for (const [i, L] of Object.entries(T.lots)) {
      const B = BUILDS[L.b]; if (!L.staff.length || L.last === s.day) continue;
      const d = dayOf(B, L), luck = 0.85 + Math.random() * 0.3, rev = r2(d.rev * luck), profit = r2(rev - d.pay - d.upkeep);
      L.days++; L.last = s.day; L.profit = r2(L.profit + profit); total = r2(total + profit); any = true;
      for (const w of L.staff) w.skill = Math.min(1.3, r2(w.skill + 0.01));
    }
    if (!any) return null;
    s.money = r2(s.money + total); s.bank.unshift({ day: s.day, desc: 'Newtown: your buildings (sales − pay − upkeep)', amt: total });
    if (total > 0) s.stats.earned = r2((s.stats.earned || 0) + total);
    s.stats.townProfit = r2((s.stats.townProfit || 0) + total);
    const st = stageOf(s); if (st > (T.stage || 0)) { T.stage = st; notes.push(`🏗️ ${tr('Newtown grew')}: ${tr(STAGES[st][1])}! ${tr('population')} ${population(s)}.`); }
    notes.unshift(`🏗️ Newtown: ${total >= 0 ? tr('profit') : tr('loss')} ${money(total)}.`);
    return notes.join(' ');
  };

  /** tell the player once that Newtown exists */
  P.townTell = function () {
    const s = this.state, T = town(s);
    if (T.told || !s.flags.hired || s.money < 700 || s.chapter !== 'city') return;
    T.told = s.day;
    this.message('City Hall', '🏗️ The city is growing! Empty lots are for sale in Newtown, south of the city where the road comes in. Build a shop or a workshop and hire people. Open 🏗️ Builder on your phone.');
  };
}

// ------------------------------------------------------------------------------------------------ 3D
/** draw Newtown: lot markers, buildings (taller with each level), a sign at the entrance, and more trees, lamps and benches as it grows */
export function syncTown(T3, s, ctx) {
  const { THREE, scene, P2W, ground, coll, textTexture } = ctx;
  const T = town(s), st = stageOf(s);
  T3.group = T3.group || (() => { const g = new THREE.Group(); g.name = 'newtown'; scene.add(g); return g; })();
  T3.lots = T3.lots || {}; T3.deco = T3.deco || null;
  const mat = (c, e = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, emissive: e ? c : 0, emissiveIntensity: e });
  LOTS.forEach(([x, y], i) => {
    const L = T.lots[i], key = L ? `${L.b}:${L.lvl}:${L.staff.length ? 1 : 0}` : 'empty';
    if (T3.lots[i] && T3.lots[i].key === key) return;
    if (T3.lots[i]) { T3.group.remove(T3.lots[i].g); }
    const g = new THREE.Group(), gy = ground(x, y), face = -Math.sign(x);   // the door faces the road
    if (!L) {   // an empty lot: a dirt pad, four corner stakes and a For sale sign
      const pad = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.08, 8.5), mat(0x9c8463)); pad.position.y = 0.04; g.add(pad);
      for (const [dx, dz] of [[-4.6, -4.1], [4.6, -4.1], [-4.6, 4.1], [4.6, 4.1]]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.7, 0.12), mat(0xe8b23a)); p.position.set(dx, 0.35, dz); g.add(p); }
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.6, 0.12), mat(0x6b4a2a)); post.position.set(face * 4.4, 0.8, 0); g.add(post);
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.9), new THREE.MeshStandardMaterial({ map: textTexture([`Lot ${i + 1}`, 'For sale'], { w: 384, h: 192, bg: '#1d6b3a', font: 'bold 54px "Barlow Condensed", Arial' }) }));
      sign.position.set(face * 4.5, 1.6, 0); sign.rotation.y = face > 0 ? Math.PI / 2 : -Math.PI / 2; g.add(sign);
    } else {
      const B = BUILDS[L.b], H = B.h * (1 + (L.lvl - 1) * 0.28), W = 8.6, D = 7.6, open = L.staff.length > 0;
      const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), mat(B.color)); body.position.y = H / 2; body.castShadow = true; body.receiveShadow = true; g.add(body);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(W + 0.5, 0.45, D + 0.5), mat(B.roof)); roof.position.y = H + 0.22; roof.castShadow = true; g.add(roof);
      // the front faces the road (+x or -x in plan → rotate the group)
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.2, 1.4), mat(0x2b2118)); door.position.set(W / 2 + 0.03, 1.1, 0); g.add(door);
      const winM = mat(0xfff1b8, open ? 0.55 : 0.05);
      for (let f = 0; f < Math.max(1, Math.floor(H / 3)); f++) for (const dz of [-2.4, 2.4]) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.1, 1.6), winM); w.position.set(W / 2 + 0.03, 1.6 + f * 3, dz); g.add(w); }
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 1.05), new THREE.MeshStandardMaterial({ map: textTexture([`${B.icon} ${B.name}`], { w: 1024, h: 192, bg: open ? '#14204a' : '#4a4f5c', border: '#e8a33a', font: 'bold 70px "Barlow Condensed", Arial' }) }));
      sign.position.set(W / 2 + 0.06, Math.min(H - 0.7, 3.2), 0); sign.rotation.y = Math.PI / 2; g.add(sign);
      g.rotation.y = face > 0 ? 0 : Math.PI;
    }
    g.position.copy(P2W(x, y, gy)); T3.group.add(g);
    if (L && !T3.lots[i]?.solid) coll.items.push({ t: 'box', x, y, hx: 4.4, hy: 3.9, r: 0, cos: 1, sin: 0, n: 'newtown' + i });
    T3.lots[i] = { g, key, solid: !!L || (T3.lots[i] && T3.lots[i].solid) };
  });
  // the neighborhood grows: an entrance sign with the population, then lamps, trees and benches along the road
  const dkey = `${st}:${population(s)}`;
  if (T3.dkey !== dkey) {
    if (T3.deco) T3.group.remove(T3.deco);
    const d = new THREE.Group();
    const name = st ? `Newtown · population ${population(s)}` : 'Newtown · lots for sale';
    const board = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.1), new THREE.MeshStandardMaterial({ map: textTexture([name], { w: 1024, h: 256, bg: '#14204a', border: '#e8a33a', font: 'bold 64px "Barlow Condensed", Arial' }) }));
    board.position.copy(P2W(6.5, -88, ground(6.5, -88) + 2.4)); board.rotation.y = 0; d.add(board);
    for (const px of [4.6, 8.4]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.4, 0.15), mat(0x3a3f48)); p.position.copy(P2W(px, -88, ground(px, -88) + 1.2)); d.add(p); }
    const along = [-92, -100, -108, -116, -124];
    if (st >= 2) for (const yy of along) for (const xx of [-6, 6]) {   // street lamps
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 4, 8), mat(0x2a2f38)); pole.position.copy(P2W(xx, yy, ground(xx, yy) + 2)); d.add(pole);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), mat(0xfff1b8, 0.9)); bulb.position.copy(P2W(xx, yy, ground(xx, yy) + 4.1)); d.add(bulb);
    }
    if (st >= 3) for (const yy of along) for (const xx of [-22, 22]) {   // trees between the buildings
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 1.8, 8), mat(0x6b4a2a)); tr.position.copy(P2W(xx, yy, ground(xx, yy) + 0.9)); d.add(tr);
      const top = new THREE.Mesh(new THREE.SphereGeometry(1.3, 10, 8), mat(0x3f8f4f)); top.position.copy(P2W(xx, yy, ground(xx, yy) + 2.5)); d.add(top);
    }
    if (st >= 4) for (const yy of [-104, -120]) for (const xx of [-7.5, 7.5]) {   // benches
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 1.6), mat(0x8a5a2b)); seat.position.copy(P2W(xx, yy, ground(xx, yy) + 0.5)); d.add(seat);
    }
    T3.group.add(d); T3.deco = d; T3.dkey = dkey;
  }
  T3.group.visible = s.location === 'district';
  return T3;
}
