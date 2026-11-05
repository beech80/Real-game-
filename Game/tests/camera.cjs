// Camera check: walking around the city and inside rooms, the camera must never sit inside a wall or the
// player's head, must keep the player in view, and should swing back behind the player while walking.
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
  await p.goto(`http://localhost:${srv.address().port}/index.html`, { timeout: 240000, waitUntil: 'domcontentloaded' });
  await ev(() => { try { localStorage.clear(); } catch (e) {} });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
  await ev(() => window.REAL.quality('low'));
  await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden', timeout: 120000 });
  await p.fill('#cr-name', 'Kai'); await p.click('#cr-go');
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 180000 });
  await ev(() => window.REAL.devJump('hired')); await sleep(1500);
  await ev(() => { const s = window.REAL.state; s.quest = 'free'; s.time = 11; });
  const cost = await ev(() => { const t = performance.now(); for (let i = 0; i < 50; i++) window.REAL.camCheck(); return (performance.now() - t) / 50; });
  console.log('occlusion ray cost (ms):', cost.toFixed(2));
  const bad = [];
  const check = async (tag) => {
    const r = await ev(() => window.REAL.camCheck());
    if (r.dist < 1.0 || r.blocked || !r.onScreen) bad.push(`${tag}: ${JSON.stringify(r)}`);
    return r;
  };
  const walk = async (key, ms) => { await p.keyboard.down(key); await sleep(ms); await p.keyboard.up(key); };
  const shot = (n) => p.screenshot({ path: path.join(OUT, `cam_${n}.png`), timeout: 180000 });
  // 1. walk forward then turn: camera should end up behind the player
  await ev(() => window.REAL.cam(1.6, 0.32, 5.2)); await sleep(400);   // camera off to the side
  const p0 = await ev(() => window.REAL.playerPos());
  await p.keyboard.down('ArrowUp'); await p.keyboard.down('ArrowLeft'); await sleep(900); await p.keyboard.up('ArrowLeft');   // turn while walking
  for (let i = 0; i < 8; i++) { await sleep(400); await check('street walk ' + i); } await p.keyboard.up('ArrowUp');
  const behind = await ev(() => { const d = window.REAL.camYaw() + window.REAL.playerHeading(); return Math.abs(Math.atan2(Math.sin(d), Math.cos(d))); });
  await shot('street');
  console.log('angle off behind after walking:', behind.toFixed(2), 'moved from', p0, 'to', await ev(() => window.REAL.playerPos()));
  // 2. back up against every nearby building: camera must not go through walls
  for (const key of ['Door_CoffeeShop', 'Door_Clothing', 'Door_Diner', 'Door_Gym', 'Door_CareerCenter', 'Door_ApartmentLobby']) {
    for (const yaw of [0, 1.57, 3.14, -1.57]) { await ev(([k, yw]) => { window.REAL.teleport(k); window.REAL.cam(yw, 0.3, 6); }, [key, yaw]); await sleep(500); await check(`${key} yaw ${yaw}`); }
  }
  await shot('door');
  // 3. inside a room
  await ev(() => window.REAL.teleport('Door_CoffeeShop')); await sleep(900); await p.click('#btn-interact', { timeout: 15000 });
  await p.waitForFunction(() => window.REAL.state.location === 'interior' && window.REAL.roomPoints().length > 0, null, { timeout: 90000 }); await sleep(800);
  for (const yaw of [0, 1.57, 3.14, -1.57]) {
    await ev((yw) => window.REAL.cam(yw, 0.3, 6), yaw);
    await p.keyboard.down('ArrowDown'); await sleep(1200); await p.keyboard.up('ArrowDown'); await sleep(400);
    await check('room yaw ' + yaw); await shot('room_' + Math.round(yaw * 100));
  }
  await ev(() => window.REAL.leave()); await p.waitForFunction(() => window.REAL.state.location !== 'interior', null, { timeout: 90000 });
  // 4. Midtown streets
  await ev(() => window.REAL.travel('midtown')); await sleep(2500);
  const mpts = await ev(() => window.REAL.districtPoints().filter((q) => /^Door_|door/i.test(q.key || '')).slice(0, 4));
  for (const pt of mpts) for (const yaw of [0, 3.14]) { await ev(([x, y, yw]) => { window.REAL.teleportXY(x, y - 0.8); window.REAL.cam(yw, 0.3, 6); }, [pt.x, pt.y, yaw]); await sleep(500); await check(`midtown ${pt.key} yaw ${yaw}`); }
  await shot('midtown');
  const ok = !bad.length && behind < 0.5 && !errors.length;
  console.log(bad.slice(0, 12).join('\n'));
  console.log(ok ? 'CAMERA PASSED' : 'CAMERA FAILED', bad.length, 'bad views', errors.slice(0, 3));
  await b.close(); srv.close(); process.exit(ok ? 0 : 1);
})().catch((e) => { console.error('FAIL', e); process.exit(2); });
