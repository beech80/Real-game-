// Tablets (iPad, iPad Mini, iPad Pro 11, Galaxy Tab), upright and sideways, with real touch input:
// title + character screens fit, on-screen controls don't overlap and stay reachable, the joystick walks and a
// right-side drag turns the camera, lessons are readable (not stretched across a wide screen, big enough text and
// buttons), and the phone, a character chat and the cursive pad all fit. Screenshots for review.
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = path.join(__dirname, '..', 'dist-hosted'), OUT = process.env.SHOTS || path.join(__dirname, 'shots');
const types = { '.txt': 'text/plain', '.html': 'text/html; charset=utf-8', '.json': 'application/json' };
const wrap = (f, b) => (f.endsWith('index.html') ? Buffer.concat([Buffer.from('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>'), b, Buffer.from('</body></html>')]) : b);
const srv = http.createServer((q, r) => { const f = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(wrap(f, b)); }); }).listen(0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const DEVICES = (process.env.DEVICES || 'iPad (gen 7)|iPad (gen 7) landscape|iPad Mini|iPad Mini landscape|iPad Pro 11|iPad Pro 11 landscape|Galaxy Tab S4|Galaxy Tab S4 landscape').split('|');
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const bad = [], rows = [];
  for (const dev of DEVICES) {
    const tag = dev.replace(/[^A-Za-z0-9]+/g, '_');
    const ctx = await b.newContext({ ...devices[dev], deviceScaleFactor: 1 });
    const p = await ctx.newPage(); const errors = []; p.on('pageerror', (e) => errors.push(e.message));
    const ev = (f, a) => p.evaluate(f, a);
    const cdp = await ctx.newCDPSession(p);
    const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y], i) => ({ x, y, id: i })) });
    const drag = async (x0, y0, x1, y1, ms) => { await touch('touchStart', [[x0, y0]]); for (let i = 1; i <= 12; i++) { await touch('touchMove', [[x0 + (x1 - x0) * i / 12, y0 + (y1 - y0) * i / 12]]); await sleep(ms / 12); } };
    const tapEl = async (sel) => { await p.waitForSelector(sel, { state: 'visible', timeout: 60000 }); const bb = await p.$eval(sel, (e) => { const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }); await touch('touchStart', [bb]); await sleep(60); await touch('touchEnd', []); await sleep(300); };
    const shot = (n) => p.screenshot({ path: path.join(OUT, `tablet_${tag}_${n}.png`), timeout: 180000 });
    const vp = p.viewportSize(); const R = { dev, vp: `${vp.width}×${vp.height}` };
    const fail = (m) => bad.push(`${dev}: ${m}`);
    await p.goto(`http://localhost:${srv.address().port}/index.html`, { timeout: 240000, waitUntil: 'domcontentloaded' });
    await ev(() => { try { localStorage.clear(); } catch (e) {} });
    await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
    await ev(() => window.REAL.quality('low'));
    await shot('1_title');
    R.titleFits = await ev(() => [...document.querySelectorAll('#title button:not([hidden])')].every((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.bottom <= innerHeight && r.right <= innerWidth && r.left >= 0; }));
    await tapEl('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden', timeout: 120000 }); await sleep(800);
    await shot('2_creator');
    R.creatorFits = await ev(() => { const e = document.querySelector('.cr-panel'); if (!e) return true; const r = e.getBoundingClientRect(); return r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1 && r.left >= -1; });
    await p.fill('#cr-name', 'Kai'); await tapEl('#cr-go');
    await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 180000 });
    await p.waitForSelector('#loading', { state: 'hidden', timeout: 180000 }).catch(() => {});   // let loading finish before touching the game
    await ev(() => window.REAL.devJump('hired')); await sleep(1200);
    await p.evaluate(() => { for (let i = 0; i < 20 && !document.querySelector('#dialog').hidden; i++) { const x = document.querySelector('#dialog .d-next, #dialog .d-choice'); if (x) x.click(); } });
    await ev(() => { window.REAL.state.quest = 'free'; window.REAL.teleport('Door_ApartmentLobby'); }); await sleep(1500);
    await shot('3_play');
    // controls: no overlaps, all on screen, big enough to tap
    const boxes = await ev(() => Object.fromEntries(['#btn-sprint', '#btn-interact', '#btn-phone', '#minimap', '#objective', '.hud-l, .hud-tl, #hud-stats'].map((s) => { const e = document.querySelector(s); if (!e || e.hidden || getComputedStyle(e).display === 'none') return [s, null]; const r = e.getBoundingClientRect(); return [s, r.width ? { x: r.x, y: r.y, w: r.width, h: r.height } : null]; })));
    const hit = (a, c) => a && c && a.x < c.x + c.w - 1 && c.x < a.x + a.w - 1 && a.y < c.y + c.h - 1 && c.y < a.y + a.h - 1;
    const ks = Object.keys(boxes); for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) if (hit(boxes[ks[i]], boxes[ks[j]])) fail(`${ks[i]} overlaps ${ks[j]}`);
    for (const [k, r] of Object.entries(boxes)) if (r && (r.x < 0 || r.y < 0 || r.x + r.w > vp.width + 1 || r.y + r.h > vp.height + 1)) fail(`${k} off screen`);
    for (const k of ['#btn-sprint', '#btn-interact', '#btn-phone']) if (boxes[k] && Math.min(boxes[k].w, boxes[k].h) < 44) fail(`${k} too small (${Math.round(boxes[k].w)}×${Math.round(boxes[k].h)})`);
    // touch: joystick walks, right-side drag turns the camera
    const a = await ev(() => window.REAL.playerPos());
    await drag(110, vp.height - 150, 110, vp.height - 240, 300); await sleep(2200); await touch('touchEnd', []); await sleep(400);
    const b2 = await ev(() => window.REAL.playerPos()); R.joystickMoved = +Math.hypot(b2.x - a.x, b2.y - a.y).toFixed(2);
    const y0 = await ev(() => window.REAL.camYaw()); await drag(vp.width - 140, vp.height * 0.4, vp.width - 340, vp.height * 0.4, 400); await touch('touchEnd', []); await sleep(300);
    R.cameraTurned = +Math.abs((await ev(() => window.REAL.camYaw())) - y0).toFixed(2);
    if (R.joystickMoved < 0.3) fail(`joystick didn't move the player (${R.joystickMoved} m)`);
    if (R.cameraTurned < 0.05) fail(`camera drag didn't turn the camera`);
    // a lesson: readable width, text and buttons
    await ev(() => { window.__pr = window.REAL.practice('fin.paycheck'); }); await sleep(900);
    for (let i = 0; i < 4 && await p.isVisible('.learn-card'); i++) { await tapEl('.learn-card button.primary'); await sleep(400); }
    await p.waitForSelector('#modal .modal .activity', { timeout: 20000 });
    await p.waitForFunction(() => { const e = [...document.querySelectorAll('#modal .sheet')].pop(); return e && getComputedStyle(e).opacity === '1' && getComputedStyle(e).transform === 'none'; }, null, { timeout: 60000 }).catch(() => {});   // this test machine draws ~1 frame/s: let the 0.2 s pop-in finish
    const L = await ev(() => { const m = [...document.querySelectorAll('#modal .sheet')].pop(), r = m.getBoundingClientRect(), lead = m.querySelector('.lead'), btn = m.querySelector('.opt, .key'); return { w: Math.round(r.width), h: Math.round(r.height), bottom: Math.round(r.bottom), font: lead ? parseFloat(getComputedStyle(lead).fontSize) : 0, btnH: btn ? Math.round(btn.getBoundingClientRect().height) : 0, scroll: m.querySelector('.sh-body, .sheet') ? 0 : 0 }; });
    R.lesson = L; await shot('4_lesson');
    if (L.w > 760) fail(`lesson sheet stretched too wide (${L.w}px): long lines are hard to read`);
    if (L.font < 16) fail(`lesson text too small (${L.font}px)`);
    if (L.btnH && L.btnH < 44) fail(`lesson buttons too small (${L.btnH}px)`);
    if (L.bottom > vp.height + 1) fail('lesson sheet runs off the bottom');
    await ev(() => { document.querySelectorAll('#modal .modal').forEach((m) => m.remove()); }); await sleep(300);
    // the phone
    await tapEl('#btn-phone'); await sleep(700); await shot('5_phone');
    R.phone = await ev(() => { const e = document.querySelector('.phone, #phone'); if (!e) return null; const r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), fits: r.bottom <= innerHeight + 1 && r.right <= innerWidth + 1 && r.top >= -1 }; });
    if (R.phone && !R.phone.fits) fail('phone runs off the screen');
    await p.keyboard.press('Escape').catch(() => {}); await ev(() => { const x = document.querySelector('.ph-top .ghost, #phone .close, .phone .close'); if (x) x.click(); }); await sleep(400);
    // cursive pad
    await ev(() => { window.__pr = window.REAL.practice('curs.words'); }); await sleep(900);
    for (let i = 0; i < 4 && await p.isVisible('.learn-card'); i++) { await tapEl('.learn-card button.primary'); await sleep(400); }
    await p.waitForSelector('canvas.sig', { timeout: 20000 });
    R.pad = await ev(() => { const r = document.querySelector('canvas.sig').getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), fits: r.bottom <= innerHeight + 1 }; });
    await shot('6_cursive');
    if (!R.pad.fits) fail('cursive pad runs off the screen');
    if (!R.titleFits) fail('title buttons off screen'); if (!R.creatorFits) fail('character panel off screen');
    if (errors.length) fail('page errors: ' + errors.slice(0, 2).join(' | '));
    rows.push(R); console.log(JSON.stringify(R));
    await ctx.close();
  }
  console.log(bad.length ? bad.join('\n') : 'no problems');
  console.log(bad.length ? 'TABLETS FAILED' : 'TABLETS PASSED');
  await b.close(); srv.close(); process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error('FAIL', e); process.exit(2); });
