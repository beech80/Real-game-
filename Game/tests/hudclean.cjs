// Clean phone HUD during a Fresh Mart shift (iPhone portrait): money, goal and jobs stack in one left column
// without overlapping each other or the map; the jobs chip opens and closes; the goal text is fully visible.
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = path.join(__dirname, '..', 'dist-hosted'), OUT = process.env.SHOTS || path.join(__dirname, 'shots');
const types = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.mp3': 'audio/mpeg' };
const wrap = (f, b) => (f.endsWith('index.html') ? Buffer.concat([Buffer.from('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>'), b, Buffer.from('</body></html>')]) : b);
const srv = http.createServer((q, r) => { const f = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(wrap(f, b)); }); }).listen(0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 2 })).newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  const bad = []; const fail = (m) => { bad.push(m); console.log('FAIL', m); };
  const ev = (f, a) => p.evaluate(f, a);
  await p.goto(`http://localhost:${srv.address().port}/index.html`, { timeout: 240000, waitUntil: 'domcontentloaded' });
  await ev(() => { try { localStorage.clear(); } catch (e) {} window.__voiceOff = true; });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 240000 });
  await ev(() => window.REAL.quality('low'));
  await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden', timeout: 120000 });
  await p.fill('#cr-name', 'Kai'); await p.click('#cr-go');
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 400000 });
  await p.waitForSelector('#loading', { state: 'hidden', timeout: 180000 }).catch(() => {});
  await ev(() => window.REAL.devJump('hired')); await sleep(1500);
  for (let i = 0; i < 25 && await p.isVisible('#dialog'); i++) { await ev(() => { const c = document.querySelector('#dialog .d-choice, #dialog .d-next'); if (c) c.click(); }); await sleep(300); }
  // start a shift at the register, like the screenshot
  await ev(() => { const s = window.REAL.state; s.quest = 'shift'; s.shift = { register: 0, stock: 0, inv: 0, need: { register: 1, stock: 2, inv: 1 }, mistakesAtStart: 0, product: ['Rice', 'aisle 3', 'rice', 'Pantry'] }; s.todayEarned = 60; });
  await p.waitForFunction(() => { const e = document.querySelector('#taskpanel'); return e && !e.hidden && e.offsetParent && /register/i.test(document.getElementById('obj-text').textContent); }, null, { timeout: 120000 }).catch(() => {});
  await sleep(1500);
  const box = (sel) => ev((s) => { const e = document.querySelector(s); if (!e || e.hidden || !e.offsetParent) return null; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, r: r.right, b: r.bottom }; }, sel);
  const L = { status: await box('.hud-tl'), goal: await box('#objective'), jobs: await box('#taskpanel'), map: await box('#minimap'), phone: await box('#btn-voice') };
  console.log(JSON.stringify(L));
  const overlap = (a, c) => a && c && a.x < c.r && c.x < a.r && a.y < c.b && c.y < a.b;
  for (const [n1, n2] of [['status', 'goal'], ['goal', 'jobs'], ['status', 'jobs'], ['goal', 'map'], ['jobs', 'map'], ['goal', 'phone'], ['jobs', 'phone']]) if (overlap(L[n1], L[n2])) fail(`${n1} overlaps ${n2}`);
  if (!L.goal) fail('goal banner not shown');
  const goalText = await ev(() => document.getElementById('obj-text').textContent); console.log('goal:', goalText);
  if (/Serve customers|Register 1/.test(goalText)) fail('goal still uses the old harder words');
  const goalFits = await ev(() => { const e = document.getElementById('obj-text'); return e.scrollWidth <= e.clientWidth + 1; }); if (!goalFits) fail('goal text is cut off');
  const jobsH = L.jobs && L.jobs.h; console.log('jobs chip height', jobsH);
  if (!L.jobs || jobsH > 60) fail('jobs should be a small chip until tapped');
  await p.screenshot({ path: path.join(OUT, 'hud_clean_closed.png'), timeout: 240000 });
  await p.click('#taskpanel .tp-chip'); await sleep(800);
  const open = await box('#taskpanel'); const rows = await ev(() => [...document.querySelectorAll('#taskpanel .tp-label')].map((e) => e.textContent));
  console.log('jobs open:', open && open.h, rows);
  if (!open || open.h < 80 || rows.length !== 3) fail('tapping the jobs chip did not open the list');
  if (rows.some((r) => /inventory|Stock shelves|customers/.test(r))) fail('job words are still the harder ones');
  await p.screenshot({ path: path.join(OUT, 'hud_clean_open.png'), timeout: 240000 });
  const covered = (open.r * open.b) / (390 * 844); console.log('screen covered by the left column when open:', Math.round(covered * 100) + '%');
  if (errors.length) fail('page errors: ' + errors.slice(0, 3).join(' | '));
  console.log(bad.length ? 'HUD FAILED' : 'HUD PASSED');
  await b.close(); srv.close(); process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error('FAIL', e); process.exit(2); });
