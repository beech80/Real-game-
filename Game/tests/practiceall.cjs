// Every skill's practice opens with something to answer (choices, a number pad, a box to write in, a tracing pad,
// steps to order or items to sort). An empty practice screen leaves a learner stuck.
// SKILLS=prefix to check only some (e.g. SKILLS=prek. or SKILLS=col.).
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = path.join(__dirname, '..', 'dist-hosted');
const types = { '.txt': 'text/plain', '.html': 'text/html; charset=utf-8', '.json': 'application/json' };
const wrap = (f, b) => (f.endsWith('index.html') ? Buffer.concat([Buffer.from('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>'), b, Buffer.from('</body></html>')]) : b);
const srv = http.createServer((q, r) => { const f = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(wrap(f, b)); }); }).listen(0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ ...devices['iPhone 13'] });
  const p = await ctx.newPage(); const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  const ev = (f, a) => p.evaluate(f, a);
  await p.goto(`http://localhost:${srv.address().port}/index.html`, { timeout: 240000, waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
  await ev(() => window.REAL.quality('low'));
  await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden', timeout: 120000 });
  await p.fill('#cr-name', 'Kai'); await p.click('#cr-go');
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 180000 });
  await ev(() => window.REAL.devJump('hired')); await sleep(1500);
  await ev(() => { for (let i = 0; i < 20 && !document.querySelector('#dialog').hidden; i++) { const x = document.querySelector('#dialog .d-next, #dialog .d-choice'); if (x) x.click(); } window.REAL.state.quest = 'free'; });
  const closeAll = async () => { for (let i = 0; i < 6 && await p.isVisible('#modal .modal'); i++) { await p.$eval('#modal .modal:last-child .sh-x', (e) => e.click()).catch(() => {}); await sleep(250); } };
  const pre = process.env.SKILLS || '';
  const ids = await ev((x) => window.REAL.skillList().map((k) => k.id).filter((id) => id.startsWith(x) && !/^curs\./.test(id)), pre);
  const bad = [];
  for (const id of ids) {
    for (let k = 0; k < 3; k++) {
      await closeAll();
      await ev((i) => { window.__pp = window.REAL.practice(i); }, id);
      await p.waitForSelector('#modal .modal', { timeout: 5000 }).catch(() => {});
      await sleep(250);
      const r = await ev(() => { const m = [...document.querySelectorAll('#modal .modal')].pop(); if (!m) return 'no screen opened'; const n = m.querySelectorAll('.opt, .key, textarea, canvas, .bin').length; return n ? 'ok' : 'nothing to answer: ' + m.innerText.replace(/\s+/g, ' ').slice(0, 100) + ' | type=' + (window.__lastQ && window.__lastQ.type); });
      if (r !== 'ok') { bad.push(`${id} → ${r}`); break; }
    }
  }
  console.log(`${ids.length} skills checked`); console.log(bad.join('\n'));
  console.log('page errors', errors.length, errors.slice(0, 3));
  const ok = !bad.length && !errors.length; console.log(ok ? 'PRACTICEALL PASSED' : 'PRACTICEALL FAILED');
  await b.close(); srv.close(); process.exit(ok ? 0 : 1);
})().catch((e) => { console.error('FAIL', e.message.split('\n')[0]); process.exit(2); });
