// Conversations teach: a wrong pick gets a reason from the person you were talking to; tap a word in a dialog to get
// its card with “Say the whole sentence”; the phone's Talk log keeps every line and finds a chosen word in all of them.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = path.join(__dirname, '..', 'dist-hosted'), OUT = process.env.SHOTS || path.join(__dirname, 'shots');
const types = { '.html': 'text/html; charset=utf-8', '.json': 'application/json' };
const wrap = (f, b) => (f.endsWith('index.html') ? Buffer.concat([Buffer.from('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>'), b, Buffer.from('</body></html>')]) : b);
const srv = http.createServer((q, r) => { const f = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(wrap(f, b)); }); }).listen(0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 900, height: 760 } })).newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  const bad = []; const fail = (m) => { bad.push(m); console.log('FAIL', m); };
  const ev = (f, a) => p.evaluate(f, a);
  await p.goto(`http://localhost:${srv.address().port}/index.html`, { timeout: 240000, waitUntil: 'domcontentloaded' });
  await ev(() => { try { localStorage.clear(); } catch (e) {} });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
  await ev(() => window.REAL.quality('low'));
  await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden', timeout: 120000 });
  await p.fill('#cr-name', 'Lia'); await p.click('#cr-go');
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 400000 });
  await p.waitForSelector('#loading', { state: 'hidden', timeout: 180000 }).catch(() => {});
  await ev(() => window.REAL.devJump('hired')); await sleep(1200);
  for (let i = 0; i < 25 && await p.isVisible('#dialog'); i++) { const ch = await p.$$('#dialog .d-choice'); if (ch.length) await ch[0].click(); else await p.$eval('#dialog .d-next', (e) => e.click()).catch(() => {}); await sleep(300); }
  await ev(() => { window.REAL.state.quest = 'free'; });
  // 1) tap a word in a dialog → word card with the whole sentence
  const line = 'Count your change back out loud. It avoids mistakes.';
  await ev((t) => { window.__said = window.REAL.say('Rosa · Manager', t); }, line);
  await p.waitForSelector('#dialog .d-text'); await sleep(1500);
  await p.$eval('#dialog .d-text', (e) => e.click());   // finish the typewriter
  await sleep(500);
  const pt = await ev(() => { const el = document.querySelector('#dialog .d-text'); const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = tw.nextNode(); n; n = tw.nextNode()) { const i = n.textContent.indexOf('change'); if (i >= 0) { const r = document.createRange(); r.setStart(n, i + 1); r.setEnd(n, i + 4); const bb = r.getBoundingClientRect(); return { x: bb.left + bb.width / 2, y: bb.top + bb.height / 2 }; } } return null; });
  if (!pt) fail('could not find the word in the dialog'); else await p.mouse.click(pt.x, pt.y);
  await sleep(800);
  const card = await ev(() => { const w = document.querySelector('.wcard-wrap'); return w && { word: w.querySelector('.wc-word').textContent, sent: (w.querySelector('.wc-sline') || {}).textContent, btn: !![...w.querySelectorAll('button')].find((x) => /whole sentence/.test(x.textContent)) }; });
  console.log('word card:', JSON.stringify(card));
  if (!card || !/change/.test(card.word.replace(/·/g, ''))) fail('tapping a word did not open its card');
  else { if (card.sent !== 'Count your change back out loud.') fail('the word card did not show the whole sentence'); if (!card.btn) fail('no “Say the whole sentence” button'); }
  await p.screenshot({ path: path.join(OUT, 'talk_wordcard.png'), timeout: 180000 });
  await p.$eval('.wcard-wrap button.ghost.sm:last-child', (e) => e.click()).catch(() => {});
  await p.$eval('#dialog .d-next', (e) => e.click()); await sleep(400);
  // 2) a wrong pick → a reason, from Rosa
  await ev(() => { window.__pr = window.REAL.practice('sci.plants'); }); await sleep(900);
  for (let i = 0; i < 4 && await p.isVisible('.learn-card'); i++) { await p.$eval('.learn-card button.primary', (e) => e.click()).catch(() => {}); await sleep(500); }
  await p.waitForSelector('#modal .activity .opt', { timeout: 30000 });
  const picked = await ev(() => { const o = [...document.querySelectorAll('#modal .modal:last-child .opt')].find((x) => x.textContent !== String(window.__lastQ.a)); o.click(); return o.textContent; });
  await sleep(700);
  const ww = await ev(() => { const x = document.querySelector('#modal .modal:last-child .wwbox'); return x && !x.hidden ? x.textContent : null; });
  console.log('picked', JSON.stringify(picked), '→', ww);
  if (!ww) fail('a wrong pick showed no reason');
  else { if (!/^🗨️ Rosa: /.test(ww)) fail('the reason did not come from Rosa'); if (/doesn’t fit what the question asks/.test(ww)) fail('the reason was the general one'); }
  await p.screenshot({ path: path.join(OUT, 'talk_reason.png'), timeout: 180000 });
  for (let i = 0; i < 4 && await p.isVisible('#modal .modal'); i++) { await p.$eval('#modal .modal:last-child .sh-x', (e) => e.click()).catch(() => {}); await sleep(600); }
  // 3) the Talk log keeps the line; choosing a word finds it
  await p.click('#btn-phone'); await sleep(1200);
  if (!(await p.isVisible('#modal .phone'))) fail('phone did not open');
  await p.$$eval('#modal .app', (els) => { const a = els.find((e) => /Talks/.test(e.textContent)); if (a) a.click(); });
  await sleep(1000);
  const lines = await ev(() => [...document.querySelectorAll('.talk-line .talk-t')].map((e) => e.textContent));
  console.log('talk log lines:', lines.length, '· newest:', lines[0]);
  if (!lines.includes(line)) fail('the Talk log is missing the conversation line');
  if (lines.length < 3) fail('the Talk log has too few lines from the story');
  await p.fill('.talklog input[type=search]', 'change'); await sleep(500);
  const found = await ev(() => [...document.querySelectorAll('.talk-line .talk-t')].map((e) => [e.textContent, (e.querySelector('b') || {}).textContent]));
  console.log('find “change”:', JSON.stringify(found.slice(0, 3)));
  if (!found.length || found.some(([t]) => !/change/i.test(t)) || found[0][1] !== 'change') fail('finding a word did not show the lines with it highlighted');
  if (!(await p.$('.talk-line button:has-text("Say it all")'))) fail('no “Say it all” button on a line');
  await p.screenshot({ path: path.join(OUT, 'talk_log.png'), timeout: 180000 });
  if (errors.length) fail('page errors: ' + errors.slice(0, 3).join(' | '));
  console.log(bad.length ? 'TALK FAILED' : 'TALK PASSED');
  await b.close(); srv.close(); process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error('FAIL', e); process.exit(2); });
