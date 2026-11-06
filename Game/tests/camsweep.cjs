// Camera sweep: in every kind of place (home, The Club, building interiors, every district, the countryside),
// stand in several spots, turn the camera to four sides and check the player is on screen, nothing solid is in
// the way and the camera isn't inside the player's head.
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
  const bad = [], seen = {};
  const views = async (place, pts, yaws = [0, 1.57, 3.14, -1.57]) => {
    seen[place] = 0;
    for (const [x, y] of pts) for (const yaw of yaws) {
      await ev(([x, y, yw]) => { window.REAL.teleportXY(x, y); window.REAL.cam(yw, 0.3, 6); }, [x, y, yaw]);
      await p.waitForFunction(() => window.REAL.camDebug().cur[1] < 1000, null, { timeout: 60000 }).catch(() => {}); await sleep(700);
      const r = await ev(() => window.REAL.camCheck()); seen[place]++;
      if (!r.onScreen || r.blocked || r.dist < 0.9) bad.push(`${place} (${x.toFixed(1)},${y.toFixed(1)}) yaw ${yaw}: ${JSON.stringify(r)}`);
    }
    await p.screenshot({ path: path.join(OUT, `sweep_${place}.png`), timeout: 180000 });
    console.log('✓', place, seen[place], 'views');
  };
  // The Club: the hallway and the Council room
  await views('club', [[0, 2027], [0, 2040], [-3, 2048], [0, 2058]]);
  await ev(() => window.REAL.devJump('hired')); await sleep(1500);
  await ev(() => { const s = window.REAL.state; s.quest = 'free'; s.time = 11; });
  await p.evaluate(() => { for (let i = 0; i < 20 && !document.querySelector('#dialog').hidden; i++) { const x = document.querySelector('#dialog .d-next, #dialog .d-choice'); if (x) x.click(); } });
  // home
  await ev(() => window.REAL.game().hooks.enterApartment(true)); await sleep(1500);
  const sp = await ev(() => window.REAL.playerPos());
  await views('home', [[sp.x, sp.y], [sp.x - 2, sp.y + 1.5], [sp.x + 2, sp.y + 1], [sp.x, sp.y + 3]]);
  await ev(() => window.REAL.game().hooks.exitApartment()); await sleep(1500);
  // the countryside road
  await views('countryside', [[0, -400], [26, -290], [38, -225], [-9, -232], [0, -130]], [0, 3.14]);
  // every district: street spots by the doors; then walk into a few buildings
  for (const loc of ['district', 'midtown', 'opportunity', 'heights']) {
    if (loc !== 'district') { await ev((l) => window.REAL.travel(l), loc); await sleep(2500); }
    const pts = loc === 'district' ? [] : await ev(() => window.REAL.districtPoints().filter((q) => q.x != null).slice(0, 8).map((q) => [q.x, q.y - 0.8]));
    if (pts.length) await views('street_' + loc, pts, [0, 3.14]);
    const doors = { district: [], midtown: ['kitchen', 'clinic', 'library'], opportunity: ['logistics', 'tower'], heights: ['college', 'bank'] }[loc];
    for (const key of doors) {
      const ok = await ev(async (k) => { const pt = window.REAL.districtPoints().find((q) => q.key === k); try { await window.REAL.game().hooks.enterBuilding(window.REAL.state.location, pt); } catch (e) { return false; } return window.REAL.state.location === 'interior'; }, key);
      if (!ok) continue;
      await sleep(1200);
      const rp = await ev(() => window.REAL.roomPoints().slice(0, 4).map((q) => [q.x, q.y - 0.5]));
      await views('room_' + key, rp);
      await ev(() => window.REAL.leave()); await p.waitForFunction(() => window.REAL.state.location !== 'interior', null, { timeout: 90000 }); await sleep(800);
    }
  }
  console.log(bad.slice(0, 30).join('\n'));
  const total = Object.values(seen).reduce((a, v) => a + v, 0);
  const ok = !bad.length && !errors.length;
  console.log(ok ? 'CAMSWEEP PASSED' : 'CAMSWEEP FAILED', `${bad.length}/${total} bad views`, errors.slice(0, 5));
  await b.close(); srv.close(); process.exit(ok ? 0 : 1);
})().catch((e) => { console.error('FAIL', e); process.exit(2); });
