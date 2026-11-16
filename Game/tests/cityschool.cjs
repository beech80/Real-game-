// City School: you learn to grow in the city. Classes on the phone teach two skills at the player's level, and passed
// classes (with Life Level) open the bus to the next districts. Checks the bus is closed before, a class can be taken
// and passed, the star is saved, Life Level's Education part rises, and the bus opens after enough classes.
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
  const shot = (n) => p.screenshot({ path: path.join(OUT, `school_${n}.png`), timeout: 240000 });
  await p.goto(`http://localhost:${srv.address().port}/index.html`, { timeout: 240000, waitUntil: 'domcontentloaded' });
  await ev(() => { try { localStorage.clear(); } catch (e) {} window.__learnGate = true; window.__classSkills = ['math.add', 'math.subtract']; });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
  await ev(() => window.REAL.quality('low'));
  await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden', timeout: 120000 });
  await p.fill('#cr-name', 'Kai'); await p.click('#cr-go');
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 180000 });
  await ev(() => window.REAL.devJump('hired')); await sleep(1500);
  await ev(() => { for (let i = 0; i < 20 && !document.querySelector('#dialog').hidden; i++) { const x = document.querySelector('#dialog .d-next, #dialog .d-choice'); if (x) x.click(); } window.REAL.state.quest = 'free'; });
  const closeAll = async () => { for (let i = 0; i < 5 && await p.isVisible('#modal .modal'); i++) { await p.$eval('#modal .modal:last-child .sh-x', (e) => e.click()).catch(() => {}); await sleep(500); } };
  const busText = async () => { ev(() => { window.REAL.game().bus(); }); await p.waitForSelector('#modal .bill-list', { timeout: 60000 }); await sleep(500); return p.$eval('#modal .bill-list', (e) => e.innerText); };
  // before any class: even with a high Life Level, Midtown stays closed until classes are passed
  const edu0 = await ev(() => { const g = window.REAL.game(); const before = g.life().scores.education; const orig = g.life; g.life = function () { const r = orig.call(this); return { ...r, level: 9 }; }; return before; });
  let t = await busText(); await shot('1_bus_closed'); await closeAll();
  if (!/Pass 3 more classes at City School/.test(t)) fail('the bus should ask for 3 classes before Midtown: ' + t.slice(0, 200).replace(/\n/g, ' | '));
  // the School app lists every subject except cursive, and fits the phone
  await p.click('#btn-phone'); await p.waitForSelector('#modal .app', { timeout: 60000 }); await sleep(600);
  await p.$$eval('#modal .app', (els) => { const x = els.find((e) => /School/.test(e.textContent)); if (x) x.click(); }); await p.waitForSelector('.city-school', { timeout: 60000 }); await sleep(800); await shot('2_school');
  const subs = await p.$$eval('.school-list .skillrow', (els) => els.map((x) => x.dataset.subject)); if (subs.length !== 9 || subs.includes('cursive')) fail('School should list 9 subjects (not cursive): ' + subs.join(','));
  const wide = await ev(() => { const s = document.querySelector('.sheet').getBoundingClientRect(); return [...document.querySelectorAll('.city-school *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && (r.right > s.right + 1 || r.left < s.left - 1); }).length; });
  if (wide) fail(wide + ' parts of City School stick out past the phone screen');
  // take a math class from the app, answering every question right
  const answerAll = async (max = 16) => { for (let i = 0; i < max; i++) { await sleep(600);
    if (await p.isVisible('.learn-card')) { await p.click('.learn-card button.primary').catch(() => {}); continue; }
    const top = (await p.$$('#modal .modal')).pop(); if (!top || !(await top.$('.activity'))) { if (i > 2) return; continue; }
    const c = await top.$('button.primary:text-is("Continue")'); if (c && await c.isVisible()) { await c.click(); continue; }
    const Q = await ev(() => ({ type: window.__lastQ.type, a: window.__lastQ.a, decimals: window.__lastQ.decimals }));
    if (Q.type === 'number') { const v = Q.decimals ? String(Math.round(Q.a * 100)) : String(Q.a); for (const d of v) await (await top.$(`.key:text-is("${d}")`)).click(); await (await top.$('.key.ok')).click(); }
    else { const os = await top.$$('.opt:not([disabled])'); for (const o of os) { const tx = (await o.textContent()).trim(); if (tx === String(Q.a)) { await o.click(); break; } } }
  } };
  await p.click('.skillrow[data-subject="math"]'); await sleep(1200); await shot('3_class');
  await answerAll(); await sleep(1500);
  let st = await ev(() => { const g = window.REAL.game(); return { classes: g.state.classes, edu: g.life().scores.education }; });
  console.log('after one class →', JSON.stringify(st));
  if (!st.classes || st.classes.n !== 1 || st.classes.by.math !== 1) fail('passing a class did not earn a class star');
  if (!(st.edu > edu0)) fail('a passed class did not raise the Education part of Life Level');
  // two more classes open Midtown
  for (let k = 0; k < 2; k++) { ev(() => { window.REAL.takeClass('math'); }); await sleep(1200); await answerAll(); await sleep(1500); }
  st = await ev(() => window.REAL.game().state.classes); console.log('after three classes →', JSON.stringify(st));
  if (st.n !== 3) fail('expected 3 classes passed, have ' + st.n);
  await sleep(4000); await closeAll();
  t = await busText(); await shot('4_bus_open'); await closeAll();
  if (/City School/.test(t.split('Opportunity')[0])) fail('Midtown should be open after 3 classes: ' + t.slice(0, 200).replace(/\n/g, ' | '));
  if (!/Pass 5 more classes at City School/.test(t)) fail('Opportunity District should now ask for 5 more classes');
  console.log('page errors', errors.length, errors.slice(0, 3)); if (errors.length) fail('page errors');
  console.log(bad.length ? 'CITY SCHOOL FAILED' : 'CITY SCHOOL PASSED');
  await b.close(); srv.close(); process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error('FAIL', e.message.split('\n')[0]); srv.close(); process.exit(2); });
