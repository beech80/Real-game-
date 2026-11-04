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
  const shot = async (n) => { step++; await p.screenshot({ path: path.join(OUT, `rooms_${String(step).padStart(2, '0')}_${n}.png`), timeout: 150000 }); console.log('✓', n); };
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
      } else { await p.click('#dialog .d-text'); await p.click('#dialog .d-next'); }
    }
  };
  const waitIdle = async (ms = 60000) => { await p.waitForFunction(() => document.querySelector('#caption').hidden && document.querySelector('#dialog').hidden, null, { timeout: ms }); };
  const interact = async (setPos) => { await ev(setPos); await sleep(900); await p.click('#btn-interact', { timeout: 15000 }); await sleep(600); await settle(); };
  const keypadType = async (str) => { for (const d of str) await p.click(`.sheet .key:text-is("${d}")`); await p.click('.sheet .key.ok'); await sleep(500); await settle(); };

  await p.goto(`http://localhost:${srv.address().port}/index.html`);
  // generic driver: answers dialogs, task cards (tries options until correct), keypads, primary buttons
  const drive = async (opts = {}, rounds = 60) => {
    let idle = 0;
    for (let i = 0; i < rounds && idle < 4; i++) {
      await sleep(350);
      if (await vis('.learn-card')) { await settle(); idle = 0; continue; }
      if (await vis('#dialog')) {
        const ch = await p.$$('#dialog .d-choice');
        if (ch.length) { let el = ch[0]; if (opts.choice) for (const c of ch) if ((await c.textContent()).includes(opts.choice)) el = c; await el.click(); }
        else { await p.click('#dialog .d-text').catch(() => {}); await p.click('#dialog .d-next').catch(() => {}); }
        idle = 0; continue;
      }
      const tops = await p.$$('#modal .modal'); const top = tops[tops.length - 1];
      if (!top) { idle++; continue; }
      const lead = (await top.$eval('.lead', (e) => e.textContent).catch(() => '')) || '';
      const pad = await top.$('.keypad');
      const isAct = !!(await top.$('.activity'));
      if (isAct) { const cont = await top.$('button.primary:text-is("Continue")'); if (cont && await cont.isVisible()) { await cont.click(); idle = 0; continue; } }
      if (pad && isAct) { const Q = await ev(() => ({ a: window.__lastQ.a, d: window.__lastQ.decimals })); const v = Q.d ? String(Math.round(Q.a * 100)) : String(Q.a); for (const d of v) await (await top.$(`.key:text-is("${d}")`)).click(); await (await top.$('.key.ok')).click(); idle = 0; continue; }
      if (isAct && !(await top.$('.opt:not([disabled]):not(.wrong)'))) {
        const Q = await ev(() => ({ type: window.__lastQ.type, items: window.__lastQ.items, word: window.__lastQ.word, total: window.__lastQ.total, cats: window.__lastQ.cats }));
        if (Q.type === 'order') { for (const it of Q.items) await (await top.$(`.opt:text-is(${JSON.stringify(it)})`)).click(); idle = 0; continue; }
        if (Q.type === 'sort') { for (const [t, bin] of Q.items) { await (await top.$(`.sort-items .opt:text-is(${JSON.stringify(t)})`)).click(); await (await top.$(`.bin:has(b:text-is(${JSON.stringify(bin)}))`)).click(); } idle = 0; continue; }
        if (Q.type === 'write') { await (await top.$('button:text-is("See an example")')).click(); await (await top.$('button:text-is("Check my writing")')).click(); idle = 0; continue; }
        if (Q.type === 'budget') { const extra = Q.total - Q.cats.reduce((x, c) => x + c.min, 0); for (let k = 0; k < extra / 10; k++) { const rows = await top.$$('.brow'); await (await rows[rows.length - 1].$$('.key'))[1].click(); } await (await top.$('button:text-is("Check my plan")')).click(); idle = 0; continue; }
        if (Q.type === 'trace') { await (await top.$('button:has-text("Type instead")')).click(); await (await top.$('input.writebox')).fill(Q.word); await (await top.$('button.primary.sm:text-is("Done")')).click(); idle = 0; continue; }
      }
      if (pad) { const m = lead.match(/worked (\d+) hours at \$([\d.]+)/); const v = m ? String(Math.round(+m[1] * +m[2])) : '0'; for (const d of v) await (await top.$(`.key:text-is("${d}")`)).click(); await (await top.$('.key.ok')).click(); idle = 0; continue; }
      if (opts.pick) { const want = await top.$(`button:has-text("${opts.pick}")`); if (want && await want.isEnabled()) { await want.click(); opts.pick = null; idle = 0; continue; } }
      const o = await top.$$('.opt:not([disabled]):not(.wrong), .card');
      if (o.length) { await o[0].click(); idle = 0; continue; }
      const pr = await top.$('button.primary:not([disabled])');
      if (pr) { await pr.click(); idle = 0; continue; }
      const cl = await top.$('.sh-x'); if (cl) { await cl.click(); idle = 0; continue; }
      idle++;
    }
  };
  const near = async (key) => { await ev((k) => { const pt = window.REAL.districtPoints().find((q) => q.key === k); window.REAL.teleportXY(pt.x, pt.y - 0.6); }, key); await sleep(900); };
  const tap = async () => { await p.click('#btn-interact', { timeout: 15000 }); await sleep(700); };
  const label = () => p.textContent('#btn-interact').catch(() => '');
  const S = (f) => ev(f);
  const inRoom = () => p.waitForFunction(() => window.REAL.state.location === 'interior' && window.REAL.roomPoints().length > 0, null, { timeout: 90000 });
  const outside = () => p.waitForFunction(() => window.REAL.state.location !== 'interior', null, { timeout: 90000 });

  await p.goto(`http://localhost:${srv.address().port}/index.html`);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
  await ev(() => window.REAL.quality('low'));
  await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden' });
  await p.fill('#cr-name', 'Nova'); await p.click('#cr-go');
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 90000 });
  await ev(() => window.REAL.devJump('hired')); await sleep(1500);
  await ev(() => { const s = window.REAL.state, G = window.REAL.game();
    Object.assign(s.stats, { shifts: 14, promotions: 1, perfectShifts: 5, wiseChoices: 5, thoughtThrough: 3, workouts: 6, mealsCooked: 6, goodNights: 8, budgetsPlanned: 3, billsOnTime: 4, daysIndependent: 8, rentPaidSelf: 2 });
    s.money = 3000; s.quest = 'free'; s.time = 10;
    for (const id of ['read.signs', 'math.time', 'read.instructions']) G.edu.s.skills[id] = { ...G.edu.get(id), st: 3, ok: 5, n: 5 };
  });
  // Starting District: walk into Daily Grind through the real door button
  await ev(() => window.REAL.teleport('Door_CoffeeShop')); await sleep(900);
  console.log('door label:', await label()); await tap(); await inRoom(); await sleep(800);
  console.log('location', await S(() => window.REAL.state.location));
  await shot('daily_grind');
  await ev(() => { const c = window.REAL.roomPoints().find((q) => q.act === 'counter'); window.REAL.teleportXY(c.x, c.y - 0.4); }); await sleep(900);
  console.log('counter label:', await label()); await tap(); await drive({}, 12);
  console.log('money after coffee', await S(() => window.REAL.state.money));
  await ev(() => { const c = window.REAL.roomPoints().find((q) => q.act === 'exit'); window.REAL.teleportXY(c.x, c.y + 0.3); }); await sleep(900);
  console.log('exit label:', await label()); await tap(); await outside(); await sleep(800);
  console.log('back outside', await S(() => window.REAL.state.location));
  // Midtown: enter Midtown Express, apply at the counter, then work at the station
  await ev(() => window.REAL.travel('midtown')); await sleep(2500);
  await near('express'); console.log('label:', await label()); await tap(); await inRoom(); await sleep(1000); await shot('express_inside');
  await ev(() => { const c = window.REAL.roomPoints().find((q) => q.act === 'counter'); window.REAL.teleportXY(c.x, c.y - 0.4); }); await sleep(900);
  await tap(); await drive({ pick: 'Apply' });
  console.log('jobs', await S(() => JSON.stringify(window.REAL.state.jobs)));
  await ev(() => { const c = window.REAL.roomPoints().find((q) => q.act === 'work'); window.REAL.teleportXY(c.x, c.y - 0.4); }); await sleep(900);
  console.log('station:', await label()); await tap(); await drive({});
  console.log('shifts', await S(() => window.REAL.state.stats.shifts));
  await ev(() => window.REAL.leave()); await outside(); console.log('after leave', await S(() => window.REAL.state.location));
  // a gallery of every room type
  const rooms = [['midtown', 'kitchen'], ['midtown', 'motors'], ['midtown', 'clinic'], ['midtown', 'thread'], ['midtown', 'lofts'], ['midtown', 'shelter'], ['midtown', 'library'],
    ['opportunity', 'logistics'], ['opportunity', 'buildright'], ['opportunity', 'tower'], ['opportunity', 'brightline'], ['opportunity', 'lumen'], ['opportunity', 'thinktank'], ['opportunity', 'bootcamp'],
    ['heights', 'college'], ['heights', 'bank'], ['heights', 'residences']];
  if (process.env.QUICK) rooms.splice(3);
  let cur = 'midtown';
  for (const [loc, key] of rooms) {
    if (loc !== cur) { await ev((l) => window.REAL.travel(l), loc); await sleep(2000); cur = loc; }
    await ev((k) => { const pt = window.REAL.districtPoints().find((q) => q.key === k); return window.REAL.game().hooks.enterBuilding(window.REAL.state.location, pt); }, key);
    await inRoom(); await sleep(1000); await ev(() => window.REAL.cam(0.5, 0.42, 3.6)); await sleep(800); await shot('room_' + key);
    await ev(() => window.REAL.leave()); await outside(); await sleep(600);
  }
  await ev(() => window.REAL.travel('district')); await sleep(1500);
  for (const k of ['Door_Diner', 'Door_Gym']) { await ev((kk) => window.REAL.teleport(kk), k); await sleep(900); await tap(); await inRoom(); await sleep(1000); await shot('sd_' + k); await ev(() => window.REAL.leave()); await outside(); await sleep(600); }
  console.log('ERRORS', errors.length, errors.slice(0, 8).join('\n'));
  await b.close(); srv.close(); process.exit(errors.length ? 1 : 0);
})().catch(async (e) => { console.error('FAIL', e); try { await p.screenshot({ path: path.join(OUT, 'rooms_fail.png') }); } catch (x) {} process.exit(2); });
