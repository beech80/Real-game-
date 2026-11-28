// Newtown: build on a lot, hire people, earn overnight, upgrade, and see the town grow in 3D.
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = process.env.DIST || path.join(__dirname, '..', 'dist-hosted'), OUT = process.env.SHOTS || path.join(__dirname, 'shots');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.txt': 'text/plain' };
const wrap = (f, b) => (f.endsWith('index.html') && !b.slice(0, 200).toString().includes('<!doctype') ? Buffer.concat([Buffer.from('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>'), b, Buffer.from('</body></html>')]) : b);
const srv = http.createServer((q, r) => { let f = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html';
  fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(wrap(f, b)); }); }).listen(0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const bad = []; const fail = (m) => { console.log('FAIL', m); bad.push(m); };
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ ...devices['iPhone 13'] }); const p = await ctx.newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push(m.text()); });
  const ev = (f, a) => p.evaluate(f, a); const shot = (n) => p.screenshot({ path: path.join(OUT, `town_${n}.png`), timeout: 240000 });
  const say = async (pick) => {
    for (let i = 0; i < 25; i++) {
      await sleep(400); if (!(await p.isVisible('#dialog'))) continue;
      const ch = await p.$$('#dialog .d-choice');
      if (ch.length) { const t = await Promise.all(ch.map((c) => c.textContent())); const k = Math.max(0, t.findIndex((x) => x.includes(pick))); await ch[k].click(); return t; }
      await p.$eval('#dialog .d-text', (e) => e.click()).catch(() => {}); await p.click('#dialog .d-next').catch(() => {});
    }
  };
  await p.goto(`http://localhost:${srv.address().port}/index.html`);
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
  await ev(() => window.REAL.quality('low'));
  await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden' }); await p.click('#cr-next'); await p.waitForSelector('#cr-loading', { state: 'hidden' }); await sleep(800);
  await p.fill('#cr-name', 'Kai'); await p.click('#cr-go');
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 240000 });
  await ev(() => window.REAL.devJump('hired')); await sleep(2500);
  for (let i = 0; i < 10; i++) { if (await p.isVisible('#dialog')) await p.click('#dialog .d-next').catch(() => {}); await sleep(300); }
  await ev(() => { const g = window.REAL.game(); g.state.money = 12000; g.state.quest = 'free'; });
  // walk up to lot 1 and build a bakery
  await ev(() => window.REAL.teleportXY(-7.6, -95)); await p.waitForFunction(() => /Build on lot 1/.test(document.querySelector('#btn-interact').textContent) && !document.querySelector('#btn-interact').hidden, null, { timeout: 20000 }).catch(() => {});
  const lbl = await p.textContent('#btn-interact').catch(() => ''); console.log('at the lot →', lbl.trim());
  if (!/Build on lot 1/.test(lbl)) fail('no “Build on lot” button at an empty lot');
  await shot('1_empty_lot');
  await p.click('#btn-interact'); await p.waitForSelector('#build-bakery', { timeout: 30000 }); await sleep(500); await shot('2_pick');
  await p.click('#build-bakery');
  const q = await say('$46'); console.log('plan question choices', JSON.stringify(q));
  await say('Build it!');
  for (let i = 0; i < 40 && !(await p.isVisible('#hire-1')); i++) { await sleep(400); if (await p.isVisible('#dialog')) { await p.$eval('#dialog .d-text', (e) => e.click()).catch(() => {}); await p.click('#dialog .d-next').catch(() => {}); } }
  await p.waitForSelector('#hire-1', { timeout: 60000 }).catch(() => fail('no hiring after building')); await sleep(400); await shot('3_hire');
  await p.click('#hire-1'); await sleep(1500);
  const st = await ev(() => JSON.stringify(window.REAL.state.town.lots)); console.log('lots', st);
  if (!/bakery/.test(st) || !/"staff":\[\{/.test(st)) fail('the bakery was not built with a worker');
  for (let k = 0; k < 2; k++) { await ev(() => { window.REAL.game().hireFor(0); }); await p.waitForSelector('#hire-0', { timeout: 30000 }); await p.click('#hire-0'); await sleep(800); }
  const m0 = await ev(() => window.REAL.state.money);
  const notes = await ev(() => { const g = window.REAL.game(), r = []; for (let n = 0; n < 3; n++) { g.state.day++; r.push(g.townNightly()); } return r; });
  const m1 = await ev(() => window.REAL.state.money); console.log('nights', JSON.stringify(notes), 'money', m0, '→', m1);
  if (!(m1 > m0)) fail('the bakery did not make a profit overnight');
  // more buildings so the town grows, then upgrade the bakery
  await ev(() => { const T = window.REAL.state.town; T.lots[1] = { b: 'homes', lvl: 2, staff: [{ name: 'Ivy', wage: 80, skill: 1, trait: '' }], days: 0, profit: 0, last: 0 }; T.lots[2] = { b: 'garage', lvl: 1, staff: [{ name: 'Ravi', wage: 88, skill: 1, trait: '' }, { name: 'Mei', wage: 88, skill: 1, trait: '' }], days: 0, profit: 0, last: 0 }; T.lots[3] = { b: 'daycare', lvl: 1, staff: [{ name: 'Owen', wage: 70, skill: 1, trait: '' }], days: 0, profit: 0, last: 0 }; window.REAL.refresh(); });
  await ev(() => { window.REAL.game().manageLot(0); }); await p.waitForSelector('#town-up', { timeout: 30000 }); await sleep(400); await shot('4_manage'); await p.click('#town-up'); await sleep(1200);
  const lvl = await ev(() => window.REAL.state.town.lots[0].lvl); if (lvl !== 2) fail('upgrade did not raise the level');
  const stage = await ev(() => { const g = window.REAL.game(); g.state.day++; g.townNightly(); return g.state.town.stage; }); console.log('town stage', stage);
  if (!(stage >= 3)) fail('the town did not grow');
  await ev(() => window.REAL.refresh());
  await ev(() => document.getElementById('btn-phone').click()); await p.waitForSelector('#modal .app', { timeout: 60000 }); await sleep(500);
  await p.$$eval('#modal .app', (els) => { const x = els.find((e) => /Builder/.test(e.textContent)); if (x) x.click(); });
  await p.waitForSelector('.town-lots', { timeout: 30000 }).catch(() => fail('no Builder app')); await sleep(500); await shot('5_app');
  await p.click('#modal .sh-x').catch(() => {}); await sleep(600);
  await p.setViewportSize({ width: 844, height: 390 }); await ev(() => { window.REAL.teleportXY(0, -134); window.REAL.setCamYaw(0); }); await sleep(3500); await shot('6_newtown'); await ev(() => { window.REAL.teleportXY(-3, -105); window.REAL.setCamYaw(-Math.PI / 2); }); await sleep(3000); await shot('7_street');
  console.log('page errors', errors.length, errors.slice(0, 3)); if (errors.length) fail('page errors');
  console.log(bad.length ? 'NEWTOWN FAILED' : 'NEWTOWN PASSED');
  await b.close(); srv.close(); process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error('FAIL', e.message.split('\n')[0]); srv.close(); process.exit(2); });
