// Saving and progress: play for a bit (story step, a lesson, money, a learned word), close the page, reopen and
// Continue: the story, money, skills, words and stats are all still there. The student's Stats page shows their
// learning. Then the save moves to a brand-new device with a save code (Settings › Copy save code → Load a save).
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = path.join(__dirname, '..', 'dist-hosted'), OUT = process.env.SHOTS || path.join(__dirname, 'shots');
const types = { '.html': 'text/html; charset=utf-8', '.json': 'application/json' };
const wrap = (f, b) => (f.endsWith('index.html') ? Buffer.concat([Buffer.from('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>'), b, Buffer.from('</body></html>')]) : b);
const srv = http.createServer((q, r) => { const f = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(wrap(f, b)); }); }).listen(0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const bad = []; const fail = (m) => { bad.push(m); console.log('FAIL', m); };
  const url = `http://localhost:${srv.address().port}/index.html`;
  const ctx = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: url.replace(/\/index.html$/, '') });
  let p = await ctx.newPage(); const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  let ev = (f, a) => p.evaluate(f, a);
  await p.goto(url, { timeout: 240000, waitUntil: 'domcontentloaded' });
  await ev(() => { try { localStorage.clear(); } catch (e) {} });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
  await ev(() => window.REAL.quality('low'));
  await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden', timeout: 120000 });
  await p.fill('#cr-name', 'Nia'); await p.click('#cr-go');
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 180000 });
  await p.waitForSelector('#loading', { state: 'hidden', timeout: 180000 }).catch(() => {});
  await ev(() => window.REAL.devJump('hired')); await sleep(1500);
  await ev(() => { for (let i = 0; i < 20 && !document.querySelector('#dialog').hidden; i++) { const x = document.querySelector('#dialog .d-next, #dialog .d-choice'); if (x) x.click(); } });
  // progress: money, a few skills, a word, lessons and time
  await ev(() => { const s = window.REAL.state, E = window.REAL.game().edu; s.money = 432.1; s.day = 4; s.quest = 'free'; s.words = ['community', 'budget']; s.stats.lessons = 12; s.stats.playSecs = 1500;
    for (const id of ['math.add', 'math.sub', 'read.letters']) for (let i = 0; i < 6; i++) E.record(id, true, { ctx: ['learn', 'work'][i % 2] }); });
  const before = await ev(() => { const s = window.REAL.state, E = window.REAL.game().edu; return { name: s.name, day: s.day, money: s.money, quest: s.quest, chapter: s.chapter, hired: !!s.flags.hired, words: s.words.length, lessons: s.stats.lessons, prof: E.proficientCount(), skills: Object.keys(E.s.skills).length }; });
  console.log('before:', JSON.stringify(before));
  // student stats page
  await p.click('#btn-phone'); await sleep(700); await p.click('.app:has-text("Stats")'); await sleep(700);
  const stats = await ev(() => [...document.querySelectorAll('.statgrid .stat')].map((x) => x.innerText.replace(/\s+/g, ' ')));
  console.log('stats page:', JSON.stringify(stats));
  await p.screenshot({ path: path.join(OUT, 'save_stats.png'), timeout: 180000 });
  if (stats.length < 6 || !stats.some((t) => /12 lessons/.test(t)) || !stats.some((t) => /2 words/.test(t))) fail('Stats page does not show the learning numbers');
  if (!(await p.isVisible('text=My full report'))) fail('no link to the full report from Stats');
  // get a save code from Settings
  await p.click('.ph-top .ghost').catch(() => {}); await sleep(400);
  await p.click('.app:has-text("Settings")'); await sleep(600);
  await p.click('button:has-text("Copy save code")'); await sleep(600);
  const code = await ev(() => navigator.clipboard.readText()).catch(() => '');
  console.log('save code length:', code.length);
  if (!/^REALSAVE1:/.test(code)) fail('no save code copied');
  // close the app (pagehide saves), reopen, Continue
  await p.close(); p = await ctx.newPage(); p.on('pageerror', (e) => errors.push(e.message)); ev = (f, a) => p.evaluate(f, a);
  await p.goto(url, { timeout: 240000, waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
  await ev(() => window.REAL.quality('low'));
  const cont = await p.textContent('#btn-continue'); console.log('continue button:', cont.replace(/\s+/g, ' '));
  if (!(await p.isVisible('#btn-continue')) || !/Nia/.test(cont) || !/Day 4/.test(cont)) fail('Continue button missing or wrong after reopening');
  await p.click('#btn-continue'); await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 180000 }); await sleep(2500);
  const after = await ev(() => { const s = window.REAL.state, E = window.REAL.game().edu; return { name: s.name, day: s.day, money: s.money, quest: s.quest, chapter: s.chapter, hired: !!s.flags.hired, words: s.words.length, lessons: s.stats.lessons, prof: E.proficientCount(), skills: Object.keys(E.s.skills).length }; });
  console.log('after: ', JSON.stringify(after));
  for (const k of Object.keys(before)) if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) fail(`progress lost after reopening: ${k} ${before[k]} → ${after[k]}`);
  // a damaged main save falls back to the backup copy
  const backup = await ev(() => { localStorage.setItem('real.save.v2', '{broken'); return !!localStorage.getItem('real.save.v2.bak'); });
  await p.reload({ waitUntil: 'domcontentloaded', timeout: 240000 }); const okTitle = await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 240000 }).then(() => true).catch(() => false);
  if (!okTitle) { await p.screenshot({ path: path.join(OUT, 'save_reload_stuck.png') }).catch(() => {}); console.log('after reload:', await ev(() => ({ mode: window.REAL && window.REAL.mode, title: !document.getElementById('title').hidden })).catch((e) => e.message)); }
  if (!backup || !(await p.isVisible('#btn-continue'))) fail('a damaged save did not fall back to the backup copy');
  // a new device: load the save code
  const ctx2 = await b.newContext({ ...devices['iPad (gen 7)'], deviceScaleFactor: 1 });
  const q = await ctx2.newPage(); q.on('pageerror', (e) => errors.push(e.message));
  await q.goto(url, { timeout: 240000, waitUntil: 'domcontentloaded' });
  await q.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 420000 });
  if (await q.isVisible('#btn-continue')) fail('new device already had a save');
  await q.click('#btn-load'); await sleep(600);
  await q.fill('.modal textarea.writebox', code); await q.click('button:has-text("Load this game")'); await sleep(1200);
  const c2 = await q.textContent('#btn-continue').catch(() => ''); console.log('new device continue:', c2.replace(/\s+/g, ' '));
  if (!/Nia/.test(c2) || !/Day 4/.test(c2)) fail('save code did not load on the new device');
  if (errors.length) fail('page errors: ' + errors.slice(0, 3).join(' | '));
  console.log(bad.length ? 'SAVE FAILED' : 'SAVE PASSED');
  await b.close(); srv.close(); process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error('FAIL', e); process.exit(2); });
