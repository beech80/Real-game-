// The first walks are short: The Club hallway to the Council door, and the countryside into the city.
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = path.join(__dirname, '..', 'dist-hosted'), OUT = process.env.SHOTS || path.join(__dirname, 'shots');
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
  await p.goto(`http://localhost:${srv.address().port}/index.html`, { timeout: 240000, waitUntil: 'domcontentloaded' });
  await ev(() => { try { localStorage.clear(); } catch (e) {} });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
  await ev(() => window.REAL.quality('low'));
  await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden', timeout: 120000 });
  await p.fill('#cr-name', 'Kai'); await p.click('#cr-go');
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 180000 });
  await p.waitForFunction(() => document.querySelector('#caption').hidden, null, { timeout: 60000 });
  await p.screenshot({ path: path.join(OUT, 'walk_club_start.png'), timeout: 180000 });
  const club = await ev(() => { const c = window.REAL.club(), q = window.REAL.playerPos(); return Math.hypot(c.councilDoor.x - q.x, c.councilDoor.y - q.y); });
  const clubMul = await ev(() => window.REAL.speedMul());
  await ev(() => window.REAL.devJump('hired')); await sleep(1000);
  await ev(() => window.REAL.teleportXY(0, -402)); await p.keyboard.down('ArrowUp'); await sleep(1500); await p.keyboard.up('ArrowUp');
  const wildMul = await ev(() => window.REAL.speedMul());
  await ev(() => window.REAL.teleportXY(0, 10)); await sleep(800);
  const cityMul = await ev(() => window.REAL.speedMul());
  // at a phone's normal walk (3.3 m/s) without running
  const res = { clubMeters: +club.toFixed(1), clubSecs: +(club / 3.3).toFixed(1), clubMul, wildMul, cityMul, wildSecs: +(318 / (3.3 * wildMul)).toFixed(1) };
  console.log(JSON.stringify(res));
  const ok = res.clubMeters < 30 && wildMul >= 2 && cityMul === 1 && clubMul === 1 && !errors.length;
  console.log(ok ? 'WALKS PASSED' : 'WALKS FAILED', errors.slice(0, 3));
  await b.close(); srv.close(); process.exit(ok ? 0 : 1);
})().catch((e) => { console.error('FAIL', e); process.exit(2); });
