// Mini-game controls: a how-to-play card comes first, and in the race the car helps the player stay on the road:
// holding only GAS (no steering at all) should still go round the track without spending long off it.
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = path.join(__dirname, '..', 'dist-hosted');
const OUT = process.env.SHOTS || path.join(__dirname, 'shots');
const types = { '.txt': 'text/plain', '.html': 'text/html; charset=utf-8', '.json': 'application/json' };
const wrap = (f, b) => (f.endsWith('index.html') ? Buffer.concat([Buffer.from('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>'), b, Buffer.from('</body></html>')]) : b);
const srv = http.createServer((q, r) => { const f = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(wrap(f, b)); }); }).listen(0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ ...devices['iPhone 13'] });
  const p = await ctx.newPage(); const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  const ev = (f, a) => p.evaluate(f, a);
  const bad = []; const fail = (m) => { bad.push(m); console.log('FAIL', m); };
  const shot = (n) => p.screenshot({ path: path.join(OUT, `mini_${n}.png`), timeout: 240000 });
  await p.goto(`http://localhost:${srv.address().port}/index.html`, { timeout: 240000, waitUntil: 'domcontentloaded' });
  await ev(() => { try { localStorage.clear(); } catch (e) {} window.__howTo = true; });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
  await ev(() => window.REAL.quality('low'));
  await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden', timeout: 120000 });
  await p.fill('#cr-name', 'Kai'); await p.click('#cr-go');
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 180000 });
  await ev(() => window.REAL.devJump('hired')); await sleep(1500);
  await ev(() => { for (let i = 0; i < 20 && !document.querySelector('#dialog').hidden; i++) { const x = document.querySelector('#dialog .d-next, #dialog .d-choice'); if (x) x.click(); } });
  const done = ev(() => window.REAL.game().hooks.race('loop', { body: 'hatch', engine: 'stock', tires: 'street', susp: 'stock', color: 0xd23b2a }, { laps: 1 })).catch(() => null);
  await p.waitForSelector('#howto-go', { timeout: 60000 }).catch(() => fail('no how-to-play card before the race')); await sleep(800); await shot('1_howto');
  const items = await p.$$eval('.howto-list li', (x) => x.length).catch(() => 0); if (items < 3) fail('the how-to card should explain the controls');
  await p.click('#howto-go');
  await p.waitForFunction(() => window.__race && window.__race.t > 0.5, null, { timeout: 120000 }).catch(() => fail('the race did not start'));
  await ev(() => { window.__race.gas = 1; });   // hold GAS, never steer
  const t0 = Date.now(); let st;
  while (Date.now() - t0 < 90000) { await sleep(3000); st = await ev(() => ({ t: window.__race.t, off: window.__race.offT || 0, idx: window.__race.player.idx, v: window.__race.player.v })); if (st.t > 25) break; }
  await shot('2_racing');
  console.log('race (gas only, no steering) →', JSON.stringify(st));
  if (!st || st.t < 8) fail('the race did not run long enough to judge');
  else if (st.off / st.t > 0.25) fail(`with no steering the car spent ${Math.round(100 * st.off / st.t)}% of the time off the road`);
  if (st && st.idx < 10) fail('holding GAS did not move the car along the track');
  console.log('page errors', errors.length, errors.slice(0, 3)); if (errors.length) fail('page errors');
  console.log(bad.length ? 'MINI FAILED' : 'MINI PASSED');
  await b.close(); srv.close(); process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error('FAIL', e.message.split('\n')[0]); srv.close(); process.exit(2); });
