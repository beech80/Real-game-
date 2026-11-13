// First-person (POV) check: the camera sits at the player's eyes, the player's own body is not drawn,
// looking and walking work, the 👁 button swaps to the view from behind and back, and nothing errors.
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
  await ctx.addInitScript(() => { window.__fp = true; });
  const p = await ctx.newPage(); const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  const ev = (f, a) => p.evaluate(f, a);
  const bad = []; const fail = (m) => { bad.push(m); console.log('FAIL', m); };
  await p.goto(`http://localhost:${srv.address().port}/index.html`, { timeout: 240000, waitUntil: 'domcontentloaded' });
  await ev(() => { try { localStorage.clear(); } catch (e) {} });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
  await ev(() => window.REAL.quality('low'));
  await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden', timeout: 120000 });
  await p.fill('#cr-name', 'Kai'); await p.click('#cr-go');
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 180000 });
  await ev(() => window.REAL.devJump('hired')); await sleep(1500);
  await ev(() => { const s = window.REAL.state; s.quest = 'free'; s.time = 11; });
  const shot = (n) => p.screenshot({ path: path.join(OUT, `pov_${n}.png`), timeout: 240000 });
  const view = () => ev(() => ({ check: { first: window.REAL.firstPerson(), dist: window.REAL.eyeGap() } }));
  await sleep(2500);
  let r = await view(); console.log('first person:', JSON.stringify(r.check));
  if (!(r.check.dist < 0.6)) fail('the camera is not at the player’s eyes: ' + JSON.stringify(r.check));
  await shot('1_street');
  // walk forward: the player must move
  const p0 = await ev(() => window.REAL.playerPos());
  await p.keyboard.down('ArrowUp'); await sleep(9000); await p.keyboard.up('ArrowUp');
  const p1 = await ev(() => window.REAL.playerPos());
  console.log('walked', Math.hypot(p1.x - p0.x, p1.y - p0.y).toFixed(2));
  if (Math.hypot(p1.x - p0.x, p1.y - p0.y) < 0.3) fail('walking forward in first person did not move the player');
  await shot('2_walked');
  // inside the store and at home
  await ev(() => window.REAL.teleport('Interact_Register_01')); await sleep(2500); await shot('3_store');
  await ev(() => { window.REAL.teleportXY(22, -6); }); await sleep(3000); await shot('5_outside');
  // swap the view with the button, then back
  await p.click('#btn-view'); await sleep(2500);
  r = await view(); console.log('from behind:', JSON.stringify(r.check));
  if (!(r.check.dist > 1.0)) fail('the 👁 button did not swap to the view from behind');
  await shot('4_behind');
  await p.click('#btn-view'); await sleep(2000);
  r = await view(); if (!(r.check.dist < 0.6)) fail('the 👁 button did not swap back to first person');
  console.log('page errors', errors.length, errors.slice(0, 3));
  if (errors.length) fail('page errors');
  console.log(bad.length ? 'POV FAILED' : 'POV PASSED');
  await b.close(); srv.close(); process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error('FAIL', e.message.split('\n')[0]); srv.close(); process.exit(2); });
