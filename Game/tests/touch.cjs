// Real-touch playtest (iPhone 13 portrait): joystick walking, camera drag, tapping the interact button.
// Also removes DecompressionStream to prove the pure-JS fallback works on older iPhones.
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = process.env.DIST || path.join(__dirname, '..', 'dist-hosted'), OUT = path.join(__dirname, 'shots');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.txt': 'text/plain' };
const wrap = (f, b) => (f.endsWith('index.html') && !b.slice(0, 200).toString().includes('<!doctype') ? Buffer.concat([Buffer.from('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>'), b, Buffer.from('</body></html>')]) : b);
const srv = http.createServer((q, r) => { let f = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html';
  fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(wrap(f, b)); }); }).listen(0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ ...devices['iPhone 13'] });
  await ctx.addInitScript(() => { delete window.DecompressionStream; });
  const p = await ctx.newPage(); global.__p = p;
  const errors = []; p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const cdp = await ctx.newCDPSession(p);
  const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y], i) => ({ x, y, id: i })) });
  const drag = async (x0, y0, x1, y1, ms) => { await touch('touchStart', [[x0, y0]]); const n = 12; for (let i = 1; i <= n; i++) { await touch('touchMove', [[x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n]]); await sleep(ms / n); } };
  const tapEl = async (sel) => {
    console.log('tap', sel);
    await p.waitForSelector(sel, { state: 'visible', timeout: 60000 });
    const bb = await p.$eval(sel, (e) => { const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
    await touch('touchStart', [bb]); await sleep(60); await touch('touchEnd', []); await sleep(250);
  };
  const t0 = Date.now();
  await p.goto(`http://localhost:${srv.address().port}/index.html`);
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
  console.log('loaded without DecompressionStream in', ((Date.now() - t0) / 1000).toFixed(1), 's');
  await p.evaluate(() => window.REAL.quality('low'));
  await tapEl('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden' });
  await tapEl('#cr-next'); await p.waitForSelector('#cr-loading', { state: 'hidden' }); await sleep(800);
  await p.fill('#cr-name', 'Kai'); await tapEl('#cr-go'); await sleep(1500);
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 90000 }); await p.waitForFunction(() => document.querySelector('#caption').hidden, null, { timeout: 60000 }); await sleep(1500);
  const vp = p.viewportSize();
  const before = await p.evaluate(() => ({ ...window.REAL.game().state, pos: null }) && window.REAL.game() && { x: 0 });
  const pos0 = await p.evaluate(() => { const s = window.REAL; return s.npcPos ? JSON.stringify(window.REAL.game().state.pos) : ''; });
  const getPos = () => p.evaluate(() => { const r = window.REAL; return r.playerPos(); });
  const a = await getPos();
  // thumb on the joystick: push "up" for ~2.5 s
  await drag(80, vp.height - 120, 80, vp.height - 200, 300); await sleep(2500);
  await p.screenshot({ path: path.join(OUT, 'touch_walking.png'), timeout: 150000 });
  await touch('touchEnd', []); await sleep(500);
  const b2 = await getPos();
  console.log('joystick moved player', Math.hypot(b2.x - a.x, b2.y - a.y).toFixed(2), 'm');
  // right-side drag rotates the camera
  console.log('under right-drag point:', await p.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e && (e.id || e.className || e.tagName); }, [vp.width - 80, 300]));
  await p.evaluate(() => { window.__pd = []; addEventListener('pointerdown', (e) => window.__pd.push([e.pointerType, e.pointerId, Math.round(e.clientX), e.target.id || e.target.tagName]), true); addEventListener('pointermove', (e) => { window.__pm = (window.__pm || 0) + 1; }, true); });
  const yaw0 = await p.evaluate(() => window.REAL.camYaw());
  await drag(vp.width - 80, 300, vp.width - 220, 300, 400); await touch('touchEnd', []); await sleep(300);
  const yaw1 = await p.evaluate(() => window.REAL.camYaw());
  console.log('pointerdowns', JSON.stringify(await p.evaluate(() => window.__pd)), 'moves', await p.evaluate(() => window.__pm), 'look', await p.evaluate(() => JSON.stringify(window.REAL.lookState && window.REAL.lookState())));
  console.log('camera drag changed yaw by', (yaw1 - yaw0).toFixed(2), 'rad');
  // skip ahead to Chapter 1 and tap the gold button at the first road sign
  await p.evaluate(() => window.REAL.skipPrologue());
  await p.waitForFunction(() => window.REAL.state.chapter === 'nowhere' && document.querySelector('#caption').hidden, null, { timeout: 90000 });
  await p.evaluate(() => { const s = window.REAL.wildSign(0); window.REAL.teleportXY(s.x - 1.5, s.y - 1); }); await sleep(800);
  await tapEl('#btn-interact'); await sleep(800);
  if (await p.isVisible('.learn-card')) await tapEl('.learn-card button.primary');
  await sleep(500);
  const opened = await p.isVisible('.signcard');
  console.log('tapping interact opened the road sign:', opened);
  await p.screenshot({ path: path.join(OUT, 'touch_sign.png'), timeout: 150000 });
  console.log('errors', errors.length, errors.slice(0, 5));
  const ok = Math.hypot(b2.x - a.x, b2.y - a.y) > 2 && Math.abs(yaw1 - yaw0) > 0.2 && opened && !errors.length;
  console.log(ok ? 'TOUCH TEST PASSED' : 'TOUCH TEST FAILED');
  await b.close(); srv.close(); process.exit(ok ? 0 : 1);
})().catch(async (e) => { console.error('FAILED', e.message.split('\n')[0]); try { await global.__p.screenshot({ path: path.join(OUT, 'touch_FAIL.png'), timeout: 120000 }); } catch (x) {} srv.close(); process.exit(1); });
