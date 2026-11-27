// Writing Lab: the app lists three tracks, a lesson teaches then practises every question type (choice, sort, order,
// writing), progress is saved and the next lesson opens, and the paragraph builder checks a whole paragraph.
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
  const shot = (n) => p.screenshot({ path: path.join(OUT, `wlab_${n}.png`), timeout: 240000 });
  await p.goto(`http://localhost:${srv.address().port}/index.html`, { timeout: 240000, waitUntil: 'domcontentloaded' });
  await ev(() => { try { localStorage.clear(); } catch (e) {} });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
  await ev(() => window.REAL.quality('low'));
  await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden', timeout: 120000 });
  await p.fill('#cr-name', 'Kai'); await p.click('#cr-go');
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 180000 });
  await ev(() => window.REAL.devJump('hired')); await sleep(1500);
  await ev(() => { for (let i = 0; i < 20 && !document.querySelector('#dialog').hidden; i++) { const x = document.querySelector('#dialog .d-next, #dialog .d-choice'); if (x) x.click(); } window.REAL.state.quest = 'free'; });
  const closeAll = async () => { for (let i = 0; i < 5 && await p.isVisible('#modal .modal'); i++) { await p.$eval('#modal .modal:last-child .sh-x', (e) => e.click()).catch(() => {}); await sleep(500); } };
  const answerAll = async (max = 30) => {
    for (let i = 0; i < max; i++) {
      await sleep(600);
      if (await p.isVisible('.learn-card')) { await p.click('.learn-card button.primary').catch(() => {}); continue; }
      const top = (await p.$$('#modal .modal')).pop(); if (!top || !(await top.$('.activity'))) { if (i > 3) return; continue; }
      const c = await top.$('button.primary:text-is("Continue")'); if (c && await c.isVisible()) { await c.click(); continue; }
      const Q = await ev(() => JSON.parse(JSON.stringify({ type: window.__lastQ.type, a: window.__lastQ.a, items: window.__lastQ.items, model: window.__lastQ.model })));
      if (Q.type === 'choice') { for (const o of await top.$$('.opt:not([disabled])')) if ((await o.textContent()).trim() === String(Q.a)) { await o.click(); break; } }
      else if (Q.type === 'order') { for (const it of Q.items) { for (const bb of await top.$$('.orderbox .opts .opt')) if ((await bb.textContent()).trim() === it) { await bb.click(); break; } await sleep(150); } }
      else if (Q.type === 'sort') {
        for (const [it, bin] of Q.items) {
          for (const bb of await top.$$('.sort-items .opt')) if ((await bb.textContent()).trim() === it) { await bb.click(); break; }
          await sleep(100);
          for (const bn of await top.$$('.sort-bins .bin')) if ((await bn.$eval('b', (e) => e.textContent)).trim() === bin) { await bn.click(); break; }
          await sleep(150);
        }
      } else if (Q.type === 'write') { await (await top.$('textarea.writebox')).fill(Q.model); await (await top.$('button.primary.sm')).click(); }
    }
  };
  // the app
  await p.click('#btn-phone'); await p.waitForSelector('#modal .app', { timeout: 60000 }); await sleep(600);
  await p.$$eval('#modal .app', (els) => { const x = els.find((e) => /Writing Lab/.test(e.textContent)); if (x) x.click(); });
  await p.waitForSelector('.wlab', { timeout: 30000 }).catch(() => fail('no Writing Lab app')); await sleep(600); await shot('1_app');
  const n = await p.$$eval('.wlab-item', (x) => x.length); if (n !== 18) fail('expected 18 lessons, saw ' + n);
  const locked = await p.$$eval('.wlab-item.locked', (x) => x.length); if (locked !== 15) fail('only the first lesson of each track should be open, locked: ' + locked);
  await closeAll();
  // three lessons with every kind of practice
  for (const id of ['s3', 'p4', 'c1']) {
    ev((i) => { window.REAL.writeLesson(i); }, id);
    await p.waitForSelector('#wlab-start', { timeout: 30000 }); await sleep(500); await shot(`2_teach_${id}`); await p.click('#wlab-start');
    await answerAll(); await sleep(1000);
    const ok = await ev((i) => !!(window.REAL.state.wlab && window.REAL.state.wlab.done[i]), id);
    console.log(id, ok ? 'done' : 'NOT done'); if (!ok) fail(`lesson ${id} was not finished`);
    await closeAll();
  }
  // the paragraph builder
  ev(() => { window.REAL.writeLesson('p6'); }); await p.waitForSelector('#wlab-start', { timeout: 30000 }); await p.click('#wlab-start');
  await p.waitForSelector('#pb-topic', { timeout: 30000 }); await sleep(400);
  await p.fill('#pb-topic', 'my city'); await p.click('#pb-done'); await sleep(500);
  const notYet = await ev(() => !!(window.REAL.state.wlab.done.p6)); if (notYet) fail('a half paragraph should not pass');
  await p.click('#pb-example'); await sleep(400); await shot('3_builder'); await p.click('#pb-done'); await sleep(1500);
  const p6 = await ev(() => !!window.REAL.state.wlab.done.p6); if (!p6) fail('a full paragraph did not finish the lesson');
  console.log('page errors', errors.length, errors.slice(0, 3)); if (errors.length) fail('page errors');
  console.log(bad.length ? 'WLAB FAILED' : 'WLAB PASSED');
  await b.close(); srv.close(); process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error('FAIL', e.message.split('\n')[0]); process.exit(2); });
