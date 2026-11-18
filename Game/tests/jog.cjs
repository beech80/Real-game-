// Park Jog, gentler side quests and the 🎤 Say it button: the jog game starts, moves between lanes, scores and finishes;
// a side-quest question has three choices; and on a phone 🎤 Say it and ✨ Ask Heart do not overlap.
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
  const shot = (n) => p.screenshot({ path: path.join(OUT, `jog_${n}.png`), timeout: 240000 });
  await p.goto(`http://localhost:${srv.address().port}/index.html`, { timeout: 240000, waitUntil: 'domcontentloaded' });
  await ev(() => { try { localStorage.clear(); } catch (e) {} });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
  await ev(() => window.REAL.quality('low'));
  await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden', timeout: 120000 });
  await p.fill('#cr-name', 'Kai'); await p.click('#cr-go');
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 180000 });
  await ev(() => window.REAL.devJump('hired')); await sleep(1500);
  await ev(() => { for (let i = 0; i < 20 && !document.querySelector('#dialog').hidden; i++) { const x = document.querySelector('#dialog .d-next, #dialog .d-choice'); if (x) x.click(); } window.REAL.state.quest = 'free'; });
  // 0) 🧭 Go: the REAL walks to the goal by itself
  await p.waitForSelector('#obj-go:not([hidden])', { timeout: 60000 }).catch(() => fail('no 🧭 Go button next to the goal'));
  const g0 = await ev(() => ({ p: window.REAL.playerPos(), d: parseFloat(document.getElementById('obj-dist').textContent) }));
  await p.click('#obj-go'); await sleep(8000); await shot('0_go');
  const g1 = await ev(() => ({ p: window.REAL.playerPos(), d: parseFloat(document.getElementById('obj-dist').textContent) || 0 }));
  console.log('🧭 go →', JSON.stringify({ before: g0.d, after: g1.d }));
  if (!(g1.d < g0.d - 1)) fail('🧭 Go did not bring the REAL closer to the goal');
  // 1) the 🎤 Say it and ✨ Ask Heart buttons on a question
  ev(() => window.REAL.takeClass('science')).catch(() => {}); await p.waitForSelector('.activity .mic', { timeout: 60000 }); await sleep(1200); await shot('1_question_buttons');
  const ov = await ev(() => { const a = document.querySelector('.activity .mic').getBoundingClientRect(), b = document.querySelector('.activity .ask').getBoundingClientRect(), m = document.querySelector('.activity .mic');
    return { overlap: !(a.right <= b.left + 1 || b.right <= a.left + 1 || a.bottom <= b.top + 1 || b.bottom <= a.top + 1), spill: m.scrollWidth > m.clientWidth + 2, mic: [a.left, a.right, a.top].map(Math.round), ask: [b.left, b.right, b.top].map(Math.round) }; });
  console.log('buttons →', JSON.stringify(ov));
  if (ov.overlap) fail('🎤 Say it overlaps ✨ Ask Heart'); if (ov.spill) fail('the 🎤 Say it label spills out of its button');
  for (let i = 0; i < 6 && await p.isVisible('#modal .modal'); i++) { await p.$eval('#modal .modal:last-child .sh-x', (e) => e.click()).catch(() => {}); await sleep(400); }
  await ev(() => { const d = document.querySelector('#modal'); d && d.querySelectorAll('.modal').forEach((m) => m.remove()); window.REAL.game().busy = false; });
  // 2) a side-quest question offers three choices
  ev(() => window.REAL.game().advTalk('race')).catch(() => {}); await sleep(2500);
  for (let i = 0; i < 12 && !(await p.$('.activity .opt')); i++) { await ev(() => { const x = document.querySelector('#dialog:not([hidden]) .d-choice, #dialog:not([hidden]) .d-next'); if (x) x.click(); }); await sleep(900); }
  const n = await p.$$eval('.activity .opt', (o) => o.length).catch(() => 0); console.log('side-quest choices:', n);
  if (n !== 3) fail('a side-quest question should show 3 choices, shows ' + n);
  await shot('2_side_quest');
  await ev(() => { document.querySelectorAll('#modal .modal').forEach((m) => m.remove()); const D = document.querySelector('#dialog'); if (D) D.hidden = true; window.REAL.game().busy = false; });
  // 3) Park Jog
  const done = ev(() => window.REAL.parkJog()); await p.waitForSelector('#jog-start', { timeout: 30000 }); await sleep(800); await shot('3_jog_start');
  await p.click('#jog-start'); await sleep(1500);
  const lane0 = await ev(() => window.__jog.lane); await p.keyboard.press('ArrowLeft'); await sleep(600); const lane1 = await ev(() => window.__jog.lane);
  if (lane1 !== lane0 - 1) fail(`the arrow key did not move the runner (lane ${lane0} → ${lane1})`);
  // put a water bottle right in front of the runner and a cone after it
  await ev(() => { const S = window.__jog; S.items.push({ k: { e: '💧', pts: 1, good: true }, lane: S.lane, y: 520 - 85 }); });
  await p.waitForFunction(() => window.__jog.score >= 1, null, { timeout: 30000 }).catch(() => fail('collecting water did not score'));
  await ev(() => { const S = window.__jog; S.items.push({ k: { e: '🚧', good: false }, lane: S.lane, y: 520 - 85 }); });
  await p.waitForFunction(() => window.__jog.bumps >= 1, null, { timeout: 30000 }).catch(() => fail('a cone did not make the runner stumble'));
  await shot('4_jog_running');
  await ev(() => { window.__jog.t = 39.95; }); await p.waitForSelector('#jog-done', { timeout: 30000 }).catch(() => fail('the run did not finish after 40 seconds'));
  await shot('5_jog_done'); await p.click('#jog-done');
  const res = await done; console.log('jog result →', JSON.stringify(res));
  if (!res || res.score < 1) fail('the jog did not return a score');
  console.log('page errors', errors.length, errors.slice(0, 3)); if (errors.length) fail('page errors');
  console.log(bad.length ? 'JOG FAILED' : 'JOG PASSED');
  await b.close(); srv.close(); process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error('FAIL', e.message.split('\n')[0]); srv.close(); process.exit(2); });
