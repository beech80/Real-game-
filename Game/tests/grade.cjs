// Starting at your grade: a new player says what grade they are in, and lessons in every subject begin at that level.
// Checks the question shows, the choice is saved, lessons start there, it steps down when too hard, and Settings can change it.
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
  const shot = (n) => p.screenshot({ path: path.join(OUT, `grade_${n}.png`), timeout: 240000 });
  await p.goto(`http://localhost:${srv.address().port}/index.html`, { timeout: 240000, waitUntil: 'domcontentloaded' });
  await ev(() => { try { localStorage.clear(); } catch (e) {} window.__gradeAsk = true; });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
  await ev(() => window.REAL.quality('low'));
  await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden', timeout: 120000 });
  await p.fill('#cr-name', 'Kai'); await p.click('#cr-go');
  await p.waitForSelector('.grade-btn', { timeout: 60000 }); await sleep(800); await shot('1_question');
  const n = await p.$$eval('.grade-btn', (b) => b.length); if (n !== 8) fail('the grade question should offer 8 choices (Pre-K, six grade groups, college prep), found ' + n);
  const fits = await ev(() => { const s = document.querySelector('.sheet'), r = s.getBoundingClientRect(); return [...document.querySelectorAll('.grade-btn')].every((b) => { const q = b.getBoundingClientRect(); return q.left >= r.left - 1 && q.right <= r.right + 1 && b.scrollWidth <= b.clientWidth + 2; }); });
  if (!fits) fail('a grade choice does not fit on the phone screen');
  if (await ev(() => window.REAL.mode) === 'play') fail('the game started before a grade was chosen');
  await p.click('.grade-btn[data-grade="4"]');
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 180000 });
  const st = await ev(() => { const g = window.REAL.game(); return { start: g.edu.start, math: g.edu.band('math'), reading: g.edu.band('reading'), cursive: g.edu.band('cursive'), words: g.wordLevel(), pending: g.state.pendingStart }; });
  console.log('picked 6th–8th grade →', JSON.stringify(st));
  if (st.start !== 4 || st.math !== 4 || st.reading !== 4) fail('lessons did not start at the chosen grade');
  if (st.cursive !== 1) fail('cursive should start at the beginning');
  if (st.words !== 4) fail('the game\'s own words did not rise to the chosen grade');
  // too hard: six misses at that level move math down one level, and only math
  const res = await ev(() => { const g = window.REAL.game(), E = g.edu, all = window.REAL.skillList(); const m4 = all.find((k) => k.subj === 'math' && k.band === 4); for (let i = 0; i < 6; i++) E.record(m4.id, false); return { math: E.band('math'), reading: E.band('reading') }; });
  console.log('after six misses in math →', JSON.stringify(res));
  if (res.math !== 3) fail('math did not step down a level when it was too hard'); if (res.reading !== 4) fail('reading should not move when math is hard');
  // saved, and still there after a reload
  await ev(() => window.REAL.game().save()); await p.reload({ timeout: 240000, waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
  const saved = await ev(() => { try { return (JSON.parse(localStorage.getItem('real.save.v2')).edu || {}).start; } catch (e) { return null; } });
  if (saved !== 4) fail('the grade was not saved: ' + saved);
  console.log('page errors', errors.length, errors.slice(0, 3)); if (errors.length) fail('page errors');
  console.log(bad.length ? 'GRADE FAILED' : 'GRADE PASSED');
  await b.close(); srv.close(); process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error('FAIL', e.message.split('\n')[0]); srv.close(); process.exit(2); });
