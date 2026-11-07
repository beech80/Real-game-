// Cursive builds up: each letter on its own first, then the whole word joined. Sentences go word by word, then whole.
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const traceSteps = require('./trace.cjs');
const DIST = path.join(__dirname, '..', 'dist-hosted'), OUT = process.env.SHOTS || path.join(__dirname, 'shots');
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
  await p.goto(`http://localhost:${srv.address().port}/index.html`, { timeout: 240000, waitUntil: 'domcontentloaded' });
  await ev(() => { try { localStorage.clear(); } catch (e) {} });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
  await ev(() => window.REAL.quality('low'));
  await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden', timeout: 120000 });
  await p.fill('#cr-name', 'Kai'); await p.click('#cr-go');
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 180000 });
  await ev(() => window.REAL.devJump('hired')); await sleep(1500);
  await p.evaluate(() => { for (let i = 0; i < 20 && !document.querySelector('#dialog').hidden; i++) { const x = document.querySelector('#dialog .d-next, #dialog .d-choice'); if (x) x.click(); } });
  const res = {};
  const run = async (skill, tag) => {
    await ev((s) => { window.__pr = window.REAL.practice(s); }, skill);
    await p.waitForSelector('.activity canvas.sig', { timeout: 20000 }); await sleep(600);
    const word = await ev(() => window.__lastQ.word);
    const strip = await p.$$eval('.activity .cursive-steps span', (e) => e.map((x) => x.textContent + (x.className ? ':' + x.className : '')));
    await p.screenshot({ path: path.join(OUT, `cursive_${tag}_first.png`), timeout: 180000 });
    const steps = await traceSteps(p, '.activity');
    const cont = await p.waitForSelector('.activity button.primary:text-is("Continue")', { timeout: 10000 }).then(() => true, () => false);
    if (cont) await p.click('.activity button.primary:text-is("Continue")'); await sleep(500);
    return { word, steps, strip, cont };
  };
  res.word = await run('curs.words', 'word');
  res.letter = await run('curs.lower', 'letter');
  res.sentence = await run('curs.fluent', 'sentence');
  res.print = await run('write.print', 'print');
  console.log(JSON.stringify(res, null, 1));
  const w = res.word, l = res.letter, s = res.sentence;
  const ok = w.cont && JSON.stringify(w.steps) === JSON.stringify([...w.word, w.word]) && w.strip[0].endsWith(':now')
    && l.cont && l.steps.length === 1 && l.strip.length === 0
    && res.print.cont && s.cont && JSON.stringify(s.steps) === JSON.stringify([...s.word.split(' '), s.word]) && !errors.length;
  console.log(ok ? 'CURSIVE PASSED' : 'CURSIVE FAILED', errors.slice(0, 3));
  await b.close(); srv.close(); process.exit(ok ? 0 : 1);
})().catch((e) => { console.error('FAIL', e); process.exit(2); });
