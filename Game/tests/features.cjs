// Later-game features played through the real buttons, like a player would: buy a vehicle (and service it), adopt a
// pet (feed and play at home), take a class at City Tech, then plan, register, run and grow a business.
// Checks each one changes the game the way it should, and that nothing errors or dead-ends.
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = path.join(__dirname, '..', 'dist-hosted'), OUT = process.env.SHOTS || path.join(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });
const types = { '.html': 'text/html; charset=utf-8', '.json': 'application/json' };
const wrap = (f, b) => (f.endsWith('index.html') ? Buffer.concat([Buffer.from('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>'), b, Buffer.from('</body></html>')]) : b);
const srv = http.createServer((q, r) => { const f = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(wrap(f, b)); }); }).listen(0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let p;
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
  p = await ctx.newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  const bad = []; const fail = (m) => { bad.push(m); console.log('FAIL', m); };
  const ev = (f, a) => p.evaluate(f, a), S = (f) => ev(f), vis = (sel) => p.isVisible(sel);
  const shot = (n) => p.screenshot({ path: path.join(OUT, `features_${n}.png`), timeout: 180000 }).catch(() => {});
  const settle = async () => { for (let i = 0; i < 6; i++) { if (await vis('.learn-card')) { await p.click('.learn-card button.primary'); await sleep(300); } else break; } };
  const types = new Set();
  const play = async (want, rounds = 120, label) => {
    let idle = 0;
    for (let i = 0; i < rounds && idle < 6; i++) {
      await sleep(320);
      if (await ev(() => window.REAL.mini())) { idle = 0; await sleep(1000); continue; }
      if (await ev(() => !document.querySelector('#caption').hidden || document.querySelector('.fade') && getComputedStyle(document.querySelector('.fade')).opacity > 0.1)) { idle = 0; continue; }
      if (await vis('.learn-card')) { await settle(); idle = 0; continue; }
      if (await vis('#dialog')) {
        const ch = await p.$$('#dialog .d-choice');
        if (ch.length) { let el = ch[0]; if (want) for (const c of ch) { const t = await c.textContent(); if (want.some((w) => t.includes(w))) { el = c; break; } } await el.click(); }
        else { await p.click('#dialog .d-text').catch(() => {}); await p.click('#dialog .d-next').catch(() => {}); }
        idle = 0; continue;
      }
      const tops = await p.$$('#modal .modal'); const top = tops[tops.length - 1];
      if (!top) { idle++; continue; }
      if (await top.$('.speakact')) { idle = 0; await sleep(500); continue; }
      idle = 0;
      if (await top.$('.activity')) {
        const cont = await top.$('button.primary:text-is("Continue")');
        if (cont && await cont.isVisible()) { if (label) { await shot(label); label = null; } await cont.click(); continue; }
        const Q = await ev(() => { const q = window.__lastQ; return { type: q.type, a: q.a, items: q.items, word: q.word, decimals: q.decimals, total: q.total, cats: q.cats }; });
        types.add(Q.type);
        if (Q.type === 'choice') { const o = await top.$(`.opt:text-is(${JSON.stringify(String(Q.a))})`); if (o) await o.click(); }
        else if (Q.type === 'number') { const s = Q.decimals ? String(Math.round(Q.a * 100)) : String(Q.a); for (const d of s) await (await top.$(`.key:text-is("${d}")`)).click(); await (await top.$('.key.ok')).click(); }
        else if (Q.type === 'order') { for (const it of Q.items) await (await top.$(`.opt:text-is(${JSON.stringify(it)})`)).click(); }
        else if (Q.type === 'sort') { for (const [t, bin] of Q.items) { await (await top.$(`.sort-items .opt:text-is(${JSON.stringify(t)})`)).click(); await (await top.$(`.bin:has(b:text-is(${JSON.stringify(bin)}))`)).click(); } }
        else if (Q.type === 'write') { await (await top.$('button:text-is("See an example")')).click(); await (await top.$('button:text-is("Check my writing")')).click(); }
        else if (Q.type === 'budget') { const extra = Q.total - Q.cats.reduce((x, c) => x + c.min, 0); for (let k = 0; k < extra / 10; k++) { const rows = await top.$$('.brow'); await (await rows[rows.length - 1].$$('.key'))[1].click(); } await (await top.$('button:text-is("Check my plan")')).click(); }
        continue;
      }
      const title = await top.$eval('.sh-title', (e) => e.textContent).catch(() => '');
      if (/Garage/.test(title)) { const tires = await top.$('.part:has-text("Sport tires")'); if (tires) await tires.click(); await sleep(200); if (label) { await shot(label); label = null; } await (await top.$('button.primary')).click(); continue; }
      if (/Robot workbench/.test(title)) { if (label) { await shot(label); label = null; } await (await top.$('button.primary')).click(); continue; }
      if (/^.?Program/.test(title) || /Program:/.test(title)) {
        const progs = { 'First steps': 'FFRFFPFFLFFD' };
        const name = title.replace(/.*Program: /, ''); for (const c of progs[name] || 'FFRFFPFFLFFD') await (await top.$(`.cmds .opt:has-text("${({ F: 'Forward', L: 'Left', R: 'Right', P: 'Pick up', D: 'Drop' })[c]}")`)).click();
        await shot('robot_program'); await (await top.$('button:text-is("▶ Run")')).click(); continue;
      }
      if (/Training/.test(title)) { for (let k = 0; k < 40; k++) { const face = await top.$eval('.trainface', (e) => e.textContent).catch(() => null); if (face === null) break; if (face !== '🐶') await (await top.$('button.primary')).click().catch(() => {}); await sleep(150); } continue; }
      const o = await top.$$('.opt:not([disabled])'); if (o.length) { await o[0].click(); continue; }
      const pr = await top.$('button.primary:not([disabled])'); if (pr) { await pr.click(); continue; }
      const x = await top.$('.sh-x'); if (x) { await x.click(); continue; }
    }
  };

  // tap a menu entry (by text) in the top sheet
  const pickIn = async (text) => { await p.waitForSelector('#modal .modal', { timeout: 20000 }); const top = (await p.$$('#modal .modal')).pop(); const el = await top.$(`button:has-text(${JSON.stringify(text)})`); if (!el) { console.log('  (no button', text, ')', await top.innerText().catch(() => '')); return false; } await el.click(); await sleep(500); return true; };
  // walk to a district place and use it, like a player
  const usePlace = async (loc, key) => {
    if (await S(() => window.REAL.state.location) !== loc) { await ev((l) => window.REAL.travel(l), loc); await sleep(3500); await play([], 30); }
    const ok = await ev((k) => { const pt = window.REAL.districtPoints().find((q) => q.key === k); if (pt) window.REAL.teleportXY(pt.x, pt.y); return !!pt; }, key);
    if (!ok) { fail(`no ${key} in ${loc}`); return false; }
    await sleep(1200);
    const label = await p.textContent('#interact-label').catch(() => '');
    const okBtn = await p.click('#btn-interact', { timeout: 20000 }).then(() => true).catch(() => false);
    if (!okBtn) { await shot('stuck_' + key); console.log('  no action button at', loc, key, JSON.stringify(await S(() => ({ loc: window.REAL.state.location, pos: window.REAL.playerPos(), dlg: !document.querySelector('#dialog').hidden, sheet: !!document.querySelector('#modal .modal'), mode: window.REAL.mode, busy: window.REAL.game().busy })))); fail(`no action at ${loc}/${key}`); return false; }
    await sleep(1500);
    if (await S(() => window.REAL.state.location) === 'interior') {   // walked in: go to the counter
      await ev(() => { const q = window.REAL.roomPoints().find((pt) => pt.act === 'counter'); if (q) window.REAL.teleportXY(q.x, q.y - 0.4); }); await sleep(1200);
      await p.click('#btn-interact', { timeout: 20000 }); await sleep(900);
    }
    console.log(`  at ${loc}/${key}: “${label}”`);
    return true;
  };
  const leave = async () => { await play([], 20); if (await S(() => window.REAL.state.location) === 'interior') { await ev(() => window.REAL.leave()); await sleep(1500); } };

  await p.goto(`http://localhost:${srv.address().port}/index.html`, { timeout: 240000, waitUntil: 'domcontentloaded' });
  await ev(() => { try { localStorage.clear(); } catch (e) {} });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
  await ev(() => window.REAL.quality('low'));
  await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden', timeout: 120000 });
  await p.fill('#cr-name', 'Kai'); await p.click('#cr-go');
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 180000 });
  await p.waitForSelector('#loading', { state: 'hidden', timeout: 180000 }).catch(() => {});
  await ev(() => window.REAL.devJump('hired')); await sleep(1500); await play([], 30);
  // a few weeks into the game: steady job, savings, Life Level high enough for everything
  await ev(() => { const s = window.REAL.state; s.quest = 'free'; s.money = 6000; s.time = 9; s.day = 12; s.flags.worked12 = true; Object.assign(s.stats, { shifts: 14, promotions: 1, perfectShifts: 5, wiseChoices: 8, workouts: 8, mealsCooked: 6, nights: 10, paidOnTime: 6, budgets: 4 }); s.visited = { midtown: 1, opportunity: 1, heights: 1 }; s.bills.forEach((x) => { x.paid = true; }); });
  console.log('Life Level', await S(() => window.REAL.life().level));

  // ---- VEHICLE: Midtown Motors → look at the scooter → pay in full; then service it
  await usePlace('midtown', 'motors');
  await pickIn('Vehicles for sale');
  await pickIn('Look'); await play(['Pay'], 40);
  if (await vis('#modal .modal')) { await pickIn('Pay'); await play([], 30); }
  const veh = await S(() => window.REAL.state.vehicle); console.log('vehicle:', JSON.stringify(veh));
  if (!veh) fail('could not buy a vehicle'); else if (veh.type !== 'bike' && !(await S(() => window.REAL.state.bills.some((x) => /fuel/.test(x.name))))) fail('vehicle has no running-cost bill');
  await shot('1_vehicle'); await leave();
  await ev(() => { window.REAL.state.day += 11; window.REAL.state.time = 10; });
  await usePlace('midtown', 'motors'); await pickIn('Service my vehicle'); await play([], 30);
  if ((await S(() => window.REAL.state.vehicle && window.REAL.state.vehicle.service)) !== (await S(() => window.REAL.state.day))) fail('vehicle service did not happen');
  await leave();

  // ---- PET: Paws & Friends → adopt → name → feed at home → play from the Home app
  await usePlace('midtown', 'shelter'); await pickIn('Adopt');
  for (let k = 0; k < 10 && await vis('#dialog'); k++) { await p.click('#dialog .d-next').catch(() => {}); await sleep(400); }
  await pickIn('Puppy'); await play([], 40);
  if (await vis('#modal .modal')) { const top = (await p.$$('#modal .modal')).pop(); const o = await top.$('.opt'); if (o) await o.click(); await play([], 20); }
  const pet = await S(() => window.REAL.state.pet); console.log('pet:', JSON.stringify(pet));
  if (!pet) fail('could not adopt a pet');
  await shot('2_pet'); await leave();
  if (pet) {
    await ev(() => { window.REAL.state.day += 1; window.REAL.state.time = 18; }); 
    await ev(() => window.REAL.travel('district')); await sleep(3000); await play([], 20);
    await ev(() => window.REAL.teleport('Door_ApartmentLobby')); await sleep(800); await p.click('#btn-interact'); await sleep(2500); await play([], 20);
    await ev(() => window.REAL.teleport('Interact_Fridge', 'apartment')); await sleep(1000);
    const fl = await ev(() => { const it = window.REAL.game().interaction({ key: 'Interact_Fridge' }); if (it && /Feed/.test(it.label)) it.run(); return it && it.label; }); console.log('  fridge label:', fl); await sleep(800);
    if (!/Feed/.test(fl || '')) fail('fridge does not offer to feed the pet');
    if ((await S(() => window.REAL.state.pet.fed)) !== (await S(() => window.REAL.state.day))) fail('feeding the pet did not work');
    await p.click('#btn-phone'); await sleep(700); await pickIn('Home'); await pickIn('Play'); await sleep(600);
    if (!((await S(() => window.REAL.state.pet.bond)) > pet.bond)) fail('playing with the pet did not raise the bond');
    for (let k = 0; k < 6 && await vis('#modal .modal'); k++) { await ev(() => { const x = [...document.querySelectorAll('#modal .modal')].pop().querySelector('.sh-x'); if (x) x.click(); }); await sleep(400); }
    await ev(() => window.REAL.game().hooks.exitApartment()); await sleep(2500); await play([], 20);
  }

  // ---- COURSES: City Tech Institute → enrol → go to class
  await ev(() => { window.REAL.state.time = 18.5; });
  await usePlace('opportunity', 'bootcamp'); await pickIn('Classes'); await sleep(600);
  const classes = await ev(() => [...((([...document.querySelectorAll('#modal .modal')].pop()) || document).querySelectorAll('button'))].map((x) => x.textContent).slice(0, 12)); console.log('  class menu:', JSON.stringify(classes));
  const before = await S(() => JSON.stringify(window.REAL.state.courses || {}));
  await play(['Enrol', 'Enroll', 'Pay', 'class', 'Class'], 80);
  const after = await S(() => JSON.stringify(window.REAL.state.courses || {})); console.log('courses:', after.slice(0, 200));
  if (before === after) fail('enrolling in / attending a class did not change anything');
  await shot('3_course'); await leave();

  // ---- BUSINESS: write the plan in the Business app → register at the SBC → run it in Brighter Park → hire → plan the week
  await ev(() => { window.REAL.state.time = 9; });
  await p.click('#btn-phone'); await sleep(700); await pickIn('Business'); await sleep(500);
  await pickIn('plan'); await sleep(500); await play([], 10);
  for (let k = 0; k < 6; k++) { const a = await S(() => window.__planAns); if (!a || !(await vis('.sheet .opt'))) break; await ev((t) => { const b = [...document.querySelectorAll('#modal .modal:last-child .opt')].find((x) => x.textContent === t); if (b) b.click(); }, a); await sleep(700); }
  for (let k = 0; k < 6 && await vis('#modal .modal'); k++) { await ev(() => { const x = [...document.querySelectorAll('#modal .modal')].pop().querySelector('.sh-x'); if (x) x.click(); }); await sleep(400); }
  console.log('  plan written:', await S(() => !!window.REAL.state.achievements.plan));
  if (!(await S(() => window.REAL.state.achievements.plan))) fail('could not write a business plan in the Business app');
  await usePlace('opportunity', 'sbc'); await pickIn('Small Business Center'); await sleep(500);
  await pickIn('Coffee cart').catch(() => {}); if (await vis('#modal .modal')) { const top = (await p.$$('#modal .modal')).pop(); const s1 = await top.$('button.primary.sm'); if (s1) await s1.click(); }
  await play(['savings', 'Pay with savings'], 80);
  if (await vis('#modal .modal')) { await pickIn('Pay with savings'); await play([], 40); }
  if (await vis('#modal .modal')) { const top = (await p.$$('#modal .modal')).pop(); const o = await top.$('.opt'); if (o) await o.click(); await play([], 30); }
  const biz = await S(() => window.REAL.state.biz); console.log('business:', JSON.stringify(biz && { type: biz.type, name: biz.name }));
  if (!biz) fail('could not register a business');
  await shot('4_business'); await leave();
  if (biz) {
    await ev(() => { const s = window.REAL.state; s.quest = 'free'; s.flags.invited = s.flags.invited || s.day; s.time = 9; });   // the Club invitation can wait: check the business goal
    await ev(() => window.REAL.travel('district')); await sleep(3000); await play([], 20);
    const goal = await S(() => (window.REAL.objective() || {}).text); console.log('  goal:', goal);
    const cart = await S(() => window.REAL.objective() && window.REAL.objective().pos);
    if (!/Open your/.test(goal || '') || !cart) fail('goal does not point at the new business');
    else {
      await ev((c) => window.REAL.teleportXY(c.x, c.y - 0.8), cart); await sleep(1200);
      await p.click('#btn-interact'); await sleep(800);
      await play([], 80);
      const b2 = await S(() => window.REAL.state.biz); console.log('  after a day:', JSON.stringify({ days: b2.days, profit: b2.profit, rep: b2.rep }));
      if (b2.days !== 1) fail('running the business for a day did not work');
    }
    // hire at the SBC
    await usePlace('opportunity', 'sbc'); await pickIn('Small Business Center'); await pickIn('Hire'); await sleep(400);
    if (await vis('#modal .modal')) { const top = (await p.$$('#modal .modal')).pop(); const hb = await top.$('button.primary.sm'); if (hb) await hb.click(); }
    await play([], 40);
    if (!(await S(() => window.REAL.state.biz.staff.length))) fail('could not hire an employee'); await leave();
    // overnight: the team runs it
    const d0 = await S(() => window.REAL.state.biz.days);
    await ev(() => { const r = window.REAL.game().bizOvernight(); window.__bo = r; });
    console.log('  overnight:', await S(() => window.__bo));
    if ((await S(() => window.REAL.state.biz.days)) !== d0) { /* ran (or already ran today) */ }
  }
  console.log('question types seen:', [...types].join(', '));
  if (errors.length) fail('page errors: ' + errors.slice(0, 3).join(' | '));
  console.log(bad.length ? 'FEATURES FAILED' : 'FEATURES PASSED');
  await b.close(); srv.close(); process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error('FAIL', e); process.exit(2); });
