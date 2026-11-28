// The Classroom: a whole sit-down school day for Pre-K, elementary and college prep. The bell rings, you take your seat,
// each class goes I do → we do → you do, the day ends with an exit ticket and a report card, and only one day per game day.
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = path.join(__dirname, '..', 'dist-hosted');
const OUT = process.env.SHOTS || path.join(__dirname, 'shots');
const types = { '.txt': 'text/plain', '.html': 'text/html; charset=utf-8', '.json': 'application/json' };
const wrap = (f, b) => (f.endsWith('index.html') ? Buffer.concat([Buffer.from('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>'), b, Buffer.from('</body></html>')]) : b);
const srv = http.createServer((q, r) => { const f = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(wrap(f, b)); }); }).listen(0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const traceSteps = require('./trace.cjs');
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ ...devices['iPhone 13'] });
  const p = await ctx.newPage(); global.__p = p; const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  const ev = (f, a) => p.evaluate(f, a);
  const bad = []; const fail = (m) => { bad.push(m); console.log('FAIL', m); };
  const shot = (n) => p.screenshot({ path: path.join(OUT, `class_${n}.png`), timeout: 240000 });
  await p.goto(`http://localhost:${srv.address().port}/index.html`, { timeout: 240000, waitUntil: 'domcontentloaded' });
  await ev(() => { try { localStorage.clear(); } catch (e) {} });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
  await ev(() => window.REAL.quality('low'));
  await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden', timeout: 120000 });
  await p.fill('#cr-name', 'Kai'); await p.click('#cr-go');
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 180000 });
  await ev(() => window.REAL.devJump('hired')); await sleep(1500);
  await ev(() => { for (let i = 0; i < 20 && !document.querySelector('#dialog').hidden; i++) { const x = document.querySelector('#dialog .d-next, #dialog .d-choice'); if (x) x.click(); } window.REAL.state.quest = 'free'; });
  const shots = new Set();
  // play a whole day: every card, walkthrough, question, until the report card (or `stopAfter` periods for a quick look)
  const playDay = async (tag, stopAfter = 99) => {
    for (let i = 0; i < 400; i++) {
      await sleep(350);
      if (await p.isVisible('#cr-done')) { await shot(`${tag}_report`); await p.click('#cr-done'); return 'report'; }
      const at = await ev(() => window.REAL.state.school && window.REAL.state.school.today && window.REAL.state.school.today.at);
      if (at >= stopAfter) { await p.click('#modal .modal:last-child .sh-x').catch(() => {}); await sleep(500); return 'left'; }
      if (await p.isVisible('#dialog')) { const c = await p.$$('#dialog .d-choice'); if (c.length) await c[0].click(); else { await p.$eval('#dialog .d-text', (e) => e.click()).catch(() => {}); await p.click('#dialog .d-next').catch(() => {}); } continue; }
      if (await p.isVisible('.learn-card')) { await p.click('.learn-card button.primary').catch(() => {}); continue; }
      const top = (await p.$$('#modal .modal')).pop(); if (!top) continue;
      for (const id of ['#cr-sit', '#cr-show', '#cr-moved', '#cr-start', '#cr-story-done', '#cr-bye']) { const x = await top.$(id); if (x && await x.isVisible()) { const k = `${tag}_${id.slice(4)}`; if (!shots.has(k) && shots.size < 14) { shots.add(k); await shot(k); } await x.click(); break; } }
      if (!(await top.$('.activity'))) { const nx = await top.$('button.primary'); if (nx && await nx.isVisible()) await nx.click(); continue; }
      const c = await top.$('button.primary:text-is("Continue")'); if (c && await c.isVisible()) { await c.click(); continue; }
      const Q = await ev(() => JSON.parse(JSON.stringify({ type: window.__lastQ.type, a: window.__lastQ.a, items: window.__lastQ.items, model: window.__lastQ.model, decimals: window.__lastQ.decimals })));
      if (Q.type === 'choice') { let hit = false; for (const o of await top.$$('.opt:not([disabled])')) if ((await o.textContent()).trim() === String(Q.a)) { await o.click(); hit = true; break; } if (!hit) { const o = await top.$('.opt:not([disabled])'); if (o) await o.click(); } }
      else if (Q.type === 'number') { const v = Q.decimals ? String(Math.round(Q.a * 100)) : String(Q.a); for (const d of v) { const k = await top.$(`.key:text-is("${d}")`); if (k) await k.click(); } const ok = await top.$('.key.ok'); if (ok) await ok.click(); }
      else if (Q.type === 'order') { for (const it of Q.items) { for (const bb of await top.$$('.orderbox .opts .opt')) if ((await bb.textContent()).trim() === it) { await bb.click(); break; } await sleep(120); } }
      else if (Q.type === 'sort') { for (const [it, bin] of Q.items) { for (const bb of await top.$$('.sort-items .opt')) if ((await bb.textContent()).trim() === it) { await bb.click(); break; } await sleep(80); for (const bn of await top.$$('.sort-bins .bin')) if ((await bn.$eval('b', (e) => e.textContent)).trim() === bin) { await bn.click(); break; } await sleep(120); } }
      else if (Q.type === 'trace') { await traceSteps(p, '#modal .modal:last-child'); await sleep(600); }
      else if (Q.type === 'write') { const ta = await top.$('textarea.writebox'); if (ta) { await ta.fill(Q.model); await (await top.$('button.primary.sm')).click(); } }
      else { const any = await top.$('button.primary'); if (any) await any.click(); }
    }
    return 'stuck';
  };
  // elementary: a whole day
  await ev(() => { window.REAL.state.school = { band: 'elem' }; window.REAL.schoolDay(); });
  let r = await playDay('elem'); console.log('elementary day →', r);
  let S = await ev(() => JSON.parse(JSON.stringify(window.REAL.state.school)));
  console.log('school', JSON.stringify({ days: S.days, streak: S.streak, lastDay: S.lastDay }));
  if (r !== 'report' || S.days !== 1) fail('the elementary day did not end with a report card');
  // one day per game day
  await ev(() => { window.REAL.schoolDay(); }); await sleep(1200);
  const again = await ev(() => !!document.querySelector('#modal .modal'));
  if (again) fail('a second school day opened on the same game day');
  // Pre-K: a whole day on the next game day
  await ev(() => { const s = window.REAL.state; s.day++; s.school.band = 'prek'; s.school.today = null; window.REAL.schoolDay(); });
  r = await playDay('prek'); console.log('Pre-K day →', r);
  S = await ev(() => window.REAL.state.school); if (r !== 'report' || S.days !== 2) fail('the Pre-K day did not end with a report card');
  // college prep: the first three periods, then leave and come back to the same place
  await ev(() => { const s = window.REAL.state; s.day++; s.school.band = 'college'; s.school.today = null; window.REAL.schoolDay(); });
  r = await playDay('college', 3); await sleep(1500);
  const at = await ev(() => window.REAL.state.school.today && window.REAL.state.school.today.at); console.log('college prep left at period', at);
  if (!(at >= 1)) fail('college prep did not remember where the learner left');
  console.log('page errors', errors.length, errors.slice(0, 3)); if (errors.length) fail('page errors');
  console.log(bad.length ? 'CLASSROOM FAILED' : 'CLASSROOM PASSED');
  await b.close(); srv.close(); process.exit(bad.length ? 1 : 0);
})().catch(async (e) => { console.error('FAIL', e.message.split('\n')[0]); try { await global.__p.screenshot({ path: path.join(OUT, 'class_FAIL.png') }); } catch (x) {} process.exit(2); });
