// Cursive Class: the ✍️ Cursive app teaches every letter in stroke groups, then words, sentences and a signature.
// Checks the school cursive font is really loaded, every letter of the alphabet is taught in both cases, a lesson can be
// traced to the end, progress is saved, and everything fits a phone.
const { chromium, devices } = require('playwright');
const traceSteps = require('./trace.cjs');
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
  const shot = (n) => p.screenshot({ path: path.join(OUT, `cursive_${n}.png`), timeout: 240000 });
  await p.goto(`http://localhost:${srv.address().port}/index.html`, { timeout: 240000, waitUntil: 'domcontentloaded' });
  await ev(() => { try { localStorage.clear(); } catch (e) {} });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
  await ev(() => window.REAL.quality('low'));
  await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden', timeout: 120000 });
  await p.fill('#cr-name', 'Kai'); await p.click('#cr-go');
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 180000 });
  await ev(() => window.REAL.devJump('hired')); await sleep(1500);
  // every letter is taught, small and capital
  const cover = await ev(() => { const L = window.REAL.cursiveLessons(), have = new Set(L.flatMap((x) => x[4]).filter((t) => t.length === 1)); return [...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'].filter((c) => !have.has(c)); });
  if (cover.length) fail('letters never taught: ' + cover.join(' '));
  // words in a lesson use only letters already taught
  const early = await ev(() => { const L = window.REAL.cursiveLessons(), known = new Set(), bad = []; for (const x of L) { for (const t of x[4]) if (t.length === 1) known.add(t); for (const t of x[4]) if (t.length > 1 && t !== '@name') for (const c of t.replace(/ /g, '')) if (!known.has(c)) bad.push(`${x[0]}:${t}:${c}`); } return bad; });
  if (early.length) fail('a word uses a letter before it is taught: ' + early.slice(0, 6).join(' '));
  await ev(() => document.getElementById('btn-phone').click()); await p.waitForSelector('#modal .app', { timeout: 60000 }); await sleep(600);
  await p.$$eval('#modal .app', (els) => { const x = els.find((e) => /Cursive/.test(e.textContent)); if (x) x.click(); }); await p.waitForSelector('.cursive-class', { timeout: 60000 }); await sleep(1500);
  const font = await ev(() => document.fonts.load('40px "Playwrite US Trad"').then(() => document.fonts.check('40px "Playwrite US Trad"')));
  if (!font) fail('the school cursive font did not load');
  await shot('1_home');
  const rows = await p.$$eval('.curs-list .skillrow', (b) => b.length); if (rows !== 17) fail('expected 17 lessons, found ' + rows);
  const wide = await ev(() => { const s = document.querySelector('.sheet').getBoundingClientRect(); return [...document.querySelectorAll('.cursive-class *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && (r.right > s.right + 1 || r.left < s.left - 1); }).length; });
  if (wide) fail(wide + ' parts of Cursive Class stick out past the phone screen');
  await p.click('#curs-next'); await p.waitForSelector('canvas.sig', { timeout: 60000 }); await sleep(2200); await shot('2_letter');
  const seen = [];   // each letter and word is its own pad: trace until the lesson list comes back
  for (let n = 0; n < 12 && await p.$('.cursive-class canvas.sig'); n++) { seen.push(...await traceSteps(p, '.cursive-class')); await sleep(900); }
  console.log('traced:', seen.join(' | '));
  await sleep(1500); await shot('3_after_lesson');
  const st = await ev(() => { const g = window.REAL.game(); return { done: (g.state.cursive || {}).done || {}, skill: g.edu.state('curs.strokes') }; });
  console.log('after lesson 1 →', JSON.stringify(st));
  if (!st.done.l1) fail('lesson 1 was not marked done after tracing every step');
  if (st.skill < 1) fail('tracing did not count toward the cursive skill');
  const gold = await p.$$eval('.curs-abc span.low', (b) => b.length); if (gold !== 4) fail('the alphabet should show 4 letters learned, shows ' + gold);
  // a long sentence stays on the pad
  await p.click('.skillrow[data-lesson="s1"]'); await p.waitForSelector('canvas.sig', { timeout: 60000 }); await sleep(1500);
  const fonts = await ev(() => document.querySelector('canvas.sig').dataset.font); console.log('sentence pad font:', fonts);
  await shot('4_sentence');
  console.log('page errors', errors.length, errors.slice(0, 3)); if (errors.length) fail('page errors');
  console.log(bad.length ? 'CURSIVE FAILED' : 'CURSIVE PASSED');
  await b.close(); srv.close(); process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error('FAIL', e.message.split('\n')[0]); srv.close(); process.exit(2); });
