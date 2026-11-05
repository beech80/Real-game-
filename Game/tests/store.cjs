// Fresh Mart: every walkway (behind the aisles, between checkouts and shelves, the stockroom and office doors and
// corridor) is passable, and the camera stays in the same room as the player and can see them.
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
  await ev(() => window.REAL.devJump('hired')); await sleep(1500);
  await ev(() => { const s = window.REAL.state; s.quest = 'free'; s.time = 11; });
  const paths = {
    behindAisles: [[23.5, 41.9], [48.0, 41.9]],
    checkoutToShelves: [[23.5, 32.0], [47.0, 32.0]],
    downEveryAisle: [[26.75, 32.0], [26.75, 41.9], [30.25, 41.9], [30.25, 32.0], [33.75, 32.0], [33.75, 41.9], [37.25, 41.9], [37.25, 32.0]],
    intoStockroom: [[40.0, 41.8], [40.0, 44.3], [24.0, 44.3]],
    stockroomToTimeClock: [[40.0, 44.3], [41.6, 44.6]],
    intoOffice: [[46.0, 41.8], [46.0, 44.4], [48.0, 44.6]],
  };
  const res = {};
  for (const [k, pts] of Object.entries(paths)) res[k] = await ev((q) => window.REAL.pathClear(q), pts);
  console.log('walkways (1 = fully passable):', JSON.stringify(res));
  const bad = [];
  const spots = { aisle: [30.25, 36], behind: [33, 41.9], stockroom: [30, 44.3], timeclock: [41.4, 44.4], office: [47.5, 44.8], entrance: [44, 28] };
  for (const [k, [x, y]] of Object.entries(spots)) for (const yaw of [0, 1.57, 3.14, -1.57]) {
    await ev(([x, y, yw]) => { window.REAL.teleportXY(x, y); window.REAL.cam(yw, 0.3, 6); }, [x, y, yaw]);
    await p.waitForFunction(() => window.REAL.camDebug().cur[1] < 1000, null, { timeout: 60000 }); await sleep(900);
    const r = await ev(() => window.REAL.camCheck());
    const camPlanY = await ev(() => window.REAL.camPlanY());
    const sameRoom = (y > 43.2) === (camPlanY > 43.2);
    if (!r.onScreen || r.dist < 0.9 || !sameRoom) bad.push(`${k} yaw ${yaw}: ${JSON.stringify(r)} camY ${camPlanY}`);
    if (yaw === 0) await p.screenshot({ path: path.join(OUT, `store_${k}.png`), timeout: 180000 });
  }
  console.log(bad.join('\n'));
  const ok = Object.values(res).every((v) => v >= 0.98) && !bad.length && !errors.length;
  console.log(ok ? 'STORE PASSED' : 'STORE FAILED', bad.length, 'bad views', errors.slice(0, 3));
  await b.close(); srv.close(); process.exit(ok ? 0 : 1);
})().catch((e) => { console.error('FAIL', e); process.exit(2); });
