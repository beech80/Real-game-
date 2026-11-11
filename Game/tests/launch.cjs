// Launch pieces: the version shows on the title, the big learning data loads from assets/learn.json, lines built
// from a pattern ("Help shoppers at the register (0/1)") show in Spanish, and Heart's voice can be saved on the
// device and is then read from there (no network) — and removed again.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = path.join(__dirname, '..', 'dist-hosted');
const types = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.mp3': 'audio/mpeg' };
const wrap = (f, b) => (f.endsWith('index.html') ? Buffer.concat([Buffer.from('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>'), b, Buffer.from('</body></html>')]) : b);
let voiceHits = 0;
const srv = http.createServer((q, r) => { const f = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); if (/\/voice\/p\d+\.mp3/.test(q.url)) voiceHits++; fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); }
  const m = /bytes=(\d+)-(\d+)/.exec(q.headers.range || '');
  if (m) { r.writeHead(206, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream', 'Content-Range': `bytes ${m[1]}-${m[2]}/${b.length}` }); return r.end(b.subarray(+m[1], +m[2] + 1)); }
  r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(wrap(f, b)); }); }).listen(0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 900, height: 700 } })).newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  const bad = []; const fail = (m) => { bad.push(m); console.log('FAIL', m); };
  const ev = (f, a) => p.evaluate(f, a);
  await p.goto(`http://localhost:${srv.address().port}/index.html`, { timeout: 240000, waitUntil: 'domcontentloaded' });
  await ev(() => { try { localStorage.clear(); } catch (e) {} });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 240000 });
  const tag = await ev(() => (document.getElementById('version-tag') || {}).textContent || ''); console.log('version tag:', tag);
  if (!/\d+\.\d+\.\d+/.test(tag)) fail('version not shown on the title');
  const links = await ev(() => [...document.querySelectorAll('.legal-links a')].map((a) => a.getAttribute('href'))); console.log('links:', links);
  for (const l of ['about.html', 'privacy.html', 'terms.html']) if (!links.includes(l)) fail('missing link ' + l);
  // Spanish, then start a game and go to a register shift
  await p.click('#btn-lang'); await sleep(400);
  await ev(() => window.REAL.quality('low'));
  await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden', timeout: 120000 });
  await p.fill('#cr-name', 'Kai'); await p.click('#cr-go');
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 400000 });
  await p.waitForSelector('#loading', { state: 'hidden', timeout: 180000 }).catch(() => {});
  const n = await ev(() => window.__learnCount && window.__learnCount()); console.log('learning data entries:', n);
  if (!(n > 2000)) fail('learning data (why-not reasons, Heart’s knowledge) did not load');
  await ev(() => window.REAL.devJump('hired')); await sleep(1500);
  for (let i = 0; i < 25 && await p.isVisible('#dialog'); i++) { await ev(() => { const c = document.querySelector('#dialog .d-choice, #dialog .d-next'); if (c) c.click(); }); await sleep(300); }
  await ev(() => { const s = window.REAL.state; s.quest = 'shift'; s.shift = { register: 0, stock: 0, inv: 0, need: { register: 1, stock: 2, inv: 1 }, mistakesAtStart: 0, product: ['Rice', 'aisle 3', 'rice', 'Pantry'] }; });
  let goal = '';
  for (let i = 0; i < 15 && !/caja|register/i.test(goal); i++) { await sleep(2000); goal = await ev(() => { const s = window.REAL.state; if (s.quest !== 'shift') { s.quest = 'shift'; s.shift = { register: 0, stock: 0, inv: 0, need: { register: 1, stock: 2, inv: 1 }, mistakesAtStart: 0, product: ['Rice', 'aisle 3', 'rice', 'Pantry'] }; } return document.getElementById('obj-text').textContent; }); } console.log('goal in Spanish:', goal);
  if (/Help shoppers/.test(goal) || !/caja/.test(goal)) fail('a pattern line stayed in English');
  // save Heart's voice on this device
  await ev(() => { document.getElementById('btn-voice').click(); }); await sleep(1500);
  const row = await ev(() => (document.querySelector('.voicesave') || {}).textContent || ''); console.log('save row:', row);
  if (!row) fail('no Save Heart’s voice option');
  else {
    const t0 = Date.now(); await p.click('.voicesave button');
    await p.waitForFunction(() => /✓/.test((document.querySelector('.voicesave') || {}).textContent || ''), null, { timeout: 600000 }).catch(() => fail('saving the voice did not finish'));
    const st = await ev(async () => { const c = await caches.open('real-voice'); return (await c.keys()).length; }); console.log('saved files:', st, 'in', Math.round((Date.now() - t0) / 1000), 's');
    if (st < 49) fail('not every voice pack was saved');
    // now Heart reads from the device: no voice downloads
    await ev(() => { const P = HTMLMediaElement.prototype.play; window.__played = []; HTMLMediaElement.prototype.play = function () { window.__played.push(this.src); return P.call(this); }; });
    voiceHits = 0; await ev(() => window.__narrate('Tienes 7319 manzanas y 4271 peras.')); await sleep(3000);
    const played = await ev(() => window.__played.length); console.log('after saving: played', played, '· voice downloads', voiceHits);
    if (!played) fail('Heart did not read from the saved voice'); if (voiceHits) fail('Heart still downloaded voice packs after saving');
    await ev(() => { document.querySelector('.voicesave button').click(); }); await sleep(1500);
    const left = await ev(async () => (await caches.keys()).includes('real-voice')); if (left) fail('Remove did not delete the saved voice');
  }
  if (errors.length) fail('page errors: ' + errors.slice(0, 3).join(' | '));
  console.log(bad.length ? 'LAUNCH FAILED' : 'LAUNCH PASSED');
  await b.close(); srv.close(); process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error('FAIL', e); process.exit(2); });
