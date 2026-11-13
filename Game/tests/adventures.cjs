// Full-story playtest (iPhone 13 portrait): Prologue → Nowhere → Community Center → Fresh Mart (application, interview,
// shift, paycheck) → Jax → home → sleep → phone → Invitation → ending → epilogue. Drives the real UI.
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = process.env.DIST || path.join(__dirname, '..', 'dist-hosted'), OUT = path.join(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });
const types = { '.txt': 'text/plain', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json' };
const wrap = (f, b) => (f.endsWith('index.html') && !b.slice(0, 200).toString().includes('<!doctype') ? Buffer.concat([Buffer.from('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>'), b, Buffer.from('</body></html>')]) : b);
const srv = http.createServer((q, r) => { let f = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html';
  fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(wrap(f, b)); }); }).listen(0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let step = 0, p;

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ ...devices[process.env.DEVICE || 'iPhone 13'] });
  p = await ctx.newPage();
  const _click = p.click.bind(p); p.click = async (sel, o) => { console.log('  click', sel); return _click(sel, { timeout: 60000, ...(o || {}) }); };
  const errors = [];
  p.on('pageerror', (e) => errors.push('[pageerror] ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const shot = async (n) => { step++; await p.screenshot({ path: path.join(OUT, `adv_${String(step).padStart(2, '0')}_${n}.png`), timeout: 150000 }); console.log('✓', n); };
  const ev = (f, a) => p.evaluate(f, a);
  const vis = (sel) => p.isVisible(sel);
  // close any "New skill" learn cards that pop up (Discover → Understand)
  const settle = async () => { for (let i = 0; i < 6; i++) { if (await vis('.learn-card')) { await p.click('.learn-card button.primary'); await sleep(300); } else break; } };
  const dialog = async (choiceText) => {
    for (let i = 0; i < 14; i++) {
      await sleep(250);
      if (await vis('.learn-card')) { await settle(); continue; }
      if (!(await vis('#dialog'))) return;
      const ch = await p.$$('#dialog .d-choice');
      if (ch.length) {
        let el = ch[0];
        if (choiceText) for (const c of ch) if ((await c.textContent()).includes(choiceText)) el = c;
        await el.click();
      } else { await p.$eval('#dialog .d-text', (e) => e.click()); await p.click('#dialog .d-next'); }
    }
  };
  const waitIdle = async (ms = 60000) => { await p.waitForFunction(() => document.querySelector('#caption').hidden && document.querySelector('#dialog').hidden, null, { timeout: ms }); };
  const interact = async (setPos) => { await ev(setPos); await sleep(900); await p.click('#btn-interact', { timeout: 15000 }); await sleep(600); await settle(); };
  const keypadType = async (str) => { for (const d of str) await p.click(`.sheet .key:text-is("${d}")`); await p.click('.sheet .key.ok'); await sleep(500); await settle(); };

  await p.goto(`http://localhost:${srv.address().port}/index.html`);
  const types = new Set();
  // answer dialogs (preferring a choice containing `want`), activity sheets (using the generated question), and builders
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
        else { await p.$eval('#dialog .d-text', (e) => e.click()).catch(() => {}); await p.click('#dialog .d-next').catch(() => {}); }
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
  const talk = async (id, want, label) => { await ev((k) => { window.__t = window.REAL.game().advTalk(k); }, id); await play(want, 160, label);
    const r = await Promise.race([ev(() => window.__t).then(() => 'ok'), sleep(600000).then(() => 'hung')]);
    if (r === 'hung') {   // say what the game is waiting on, then stop
      console.log('HUNG in', id, JSON.stringify(await ev(() => ({ mini: !!window.REAL.mini(), dialog: !document.querySelector('#dialog').hidden && document.querySelector('#dialog').textContent.slice(0, 200), modals: [...document.querySelectorAll('#modal .modal')].map((m) => m.textContent.slice(0, 200)), caption: !document.querySelector('#caption').hidden && document.querySelector('#caption').textContent, fade: [...document.querySelectorAll('.fade')].map((f) => getComputedStyle(f).opacity), other: [...document.body.children].filter((e) => e.id !== 'modal' && getComputedStyle(e).display !== 'none' && !e.hidden).map((e) => e.tagName + '#' + e.id + '.' + e.className).join(' ') }))));
      await p.screenshot({ path: path.join(OUT, 'adv_HUNG.png'), timeout: 240000 }).catch(() => {});
      throw new Error('adventure ' + id + ' never finished');
    } };
  const S = (f) => ev(f);
  await p.goto(`http://localhost:${srv.address().port}/index.html`);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
  await ev(() => window.REAL.quality('low'));
  await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden' });
  await p.fill('#cr-name', 'Nova'); await p.click('#cr-go');
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 90000 });
  await ev(() => window.REAL.devJump('hired')); await sleep(1500);
  await ev(() => { const s = window.REAL.state; s.quest = 'free'; s.money = 800; s.time = 10; window.__autoDrive = true; window.__testLaps = 1; Object.assign(s.stats, { shifts: 14, promotions: 1, perfectShifts: 5, wiseChoices: 5, workouts: 6, mealsCooked: 6, goodNights: 8, budgetsPlanned: 3, billsOnTime: 4, daysIndependent: 8 }); });
  // the mechanic is visible in the world with a "!" marker
  await ev(() => { const n = window.REAL.npcPos('Rita'); window.REAL.teleportXY(13, -14.2); window.REAL.cam(Math.PI, 0.25, 5); }); await sleep(1500);
  console.log('label near Rita:', await p.textContent('#btn-interact').catch(() => ''));
  await shot('rita_in_world');
  // BUILD & RACE: repair → garage → practice lap → race
  await p.click('#btn-interact'); await play(['Help fix'], 160, 'repair_activity');
  console.log('race stage', await S(() => window.REAL.state.adv.race.stage), 'money', await S(() => window.REAL.state.money));
  await talk('race', ['Build your race car'], 'garage');
  console.log('build', await S(() => JSON.stringify(window.REAL.state.builds.car)), 'race stage', await S(() => window.REAL.state.adv.race.stage));
  // race: screenshot mid-race
  await ev(() => { window.__t = window.REAL.game().advTalk('race'); });
  for (let k = 0; k < 400; k++) { await sleep(300); if (await ev(() => window.REAL.mini())) break; if (await vis('#dialog')) { const ch = await p.$$('#dialog .d-choice'); if (ch.length) { let el = ch[0]; for (const c of ch) if (/Race the|Race as is/.test(await c.textContent())) el = c; await el.click(); } else { await p.$eval('#dialog .d-text', (e) => e.click()).catch(() => {}); await p.click('#dialog .d-next').catch(() => {}); } } }
  await sleep(9000); await shot('race_running'); console.log('race state', await S(() => JSON.stringify(window.REAL.raceState())));
  await play(['Race as is'], 300); await ev(() => window.__t);
  console.log('after race: stage', await S(() => window.REAL.state.adv.race.stage), 'best', await S(() => window.REAL.state.adv.race.best), 'money', await S(() => window.REAL.state.money));
  // PET CHAMPIONSHIP: fun run with Penny’s dog (auto-cue)
  await ev(() => { window.__cueT = setInterval(() => window.REAL.petCue && window.REAL.petCue(), 150); });
  await ev(() => { window.__t = window.REAL.game().advTalk('pets'); });
  for (let k = 0; k < 200; k++) { await sleep(300); if (await ev(() => window.REAL.mini())) break; await play(['fun run', 'Try'], 2); }
  await sleep(6000); await shot('pet_course'); await play([], 300); await ev(() => window.__t);
  console.log('pets stage', await S(() => window.REAL.state.adv.pets.stage));
  // RESCUE: kitten mission in the world
  await talk('rescue', ['kitten']);
  console.log('mission', await S(() => JSON.stringify(window.REAL.state.mission)));
  await ev(() => { const m = window.REAL.state.mission; window.REAL.teleportXY(m.x, m.y - 1); }); await sleep(1200); await shot('mission_marker');
  await p.click('#btn-interact'); await play([], 120);
  console.log('rescue stage', await S(() => window.REAL.state.adv.rescue.stage));
  // MYSTERY: three clues across the district
  await talk('mystery', ['Missing Bus Pass']);
  for (let k = 0; k < 3; k++) { await ev(() => { const m = window.REAL.state.mission; window.REAL.teleportXY(m.x, m.y - 1); }); await sleep(1200); await p.click('#btn-interact'); await play([], 120); }
  console.log('mystery stage', await S(() => window.REAL.state.adv.mystery.stage), 'case', await S(() => JSON.stringify(window.REAL.state.case)));
  // ROBOTS + CONSTRUCTION in the Opportunity District
  await ev(() => window.REAL.travel('opportunity')); await sleep(3000);
  await talk('robots', ['Build your first'], 'robot_bench');
  console.log('robots stage', await S(() => window.REAL.state.adv.robots.stage));
  await talk('construction', ['park bench']);
  console.log('built', await S(() => JSON.stringify(window.REAL.state.built)));
  await talk('inventor', ['planter']);
  console.log('inventor stage', await S(() => window.REAL.state.adv.inventor.stage));
  // MIDTOWN: culinary + medical
  await ev(() => window.REAL.travel('midtown')); await sleep(3000);
  await talk('culinary', ['Pancake']); console.log('culinary stage', await S(() => window.REAL.state.adv.culinary.stage));
  await talk('medical', ['supply']); console.log('medical stage', await S(() => window.REAL.state.adv.medical.stage));
  // back to the park: the bench we built is there
  await ev(() => window.REAL.travel('district')); await sleep(2000);
  await ev(() => { window.REAL.teleportXY(24, -23); window.REAL.cam(Math.PI, 0.3, 5); }); await sleep(1500); await shot('built_bench');
  await p.click('#btn-phone'); await sleep(700); await p.click('.app:has-text("Discover")'); await sleep(600); await shot('discover_app');
  console.log('interests', await S(() => JSON.stringify(window.REAL.state.interests)));
  console.log('activity types', [...types].join(','));
  console.log('ERRORS', errors.length, errors.slice(0, 8).join('\n'));
  await b.close(); srv.close(); process.exit(errors.length ? 1 : 0);
})().catch(async (e) => { console.error('FAIL', e); try { await p.screenshot({ path: path.join(OUT, 'adv_fail.png') }); } catch (x) {} process.exit(2); });
