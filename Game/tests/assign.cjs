// Teacher assignments: the teacher builds one (subject, stage, skills) and copies the code; a student adds it in
// Settings, takes the 5-question pre-check, practises each skill, takes the post-check; their report code carries
// pre → post into the teacher dashboard.
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
  const url = `http://localhost:${srv.address().port}/index.html`;
  const bad = []; const fail = (m) => { bad.push(m); console.log('FAIL', m); };
  const errors = [];
  // ---- teacher builds an assignment
  const tctx = await b.newContext({ viewport: { width: 1100, height: 800 } });
  await tctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: url.replace(/\/index.html$/, '') });
  const t = await tctx.newPage(); t.on('pageerror', (e) => errors.push(e.message));
  await t.goto(url, { timeout: 240000, waitUntil: 'domcontentloaded' });
  await t.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
  await t.click('#btn-teacher'); await sleep(600);
  await t.click('button:has-text("New assignment")'); await sleep(600);
  await t.fill('.modal:last-child input.writebox', 'Unit 2: Adding and taking away');
  await t.click('.modal:last-child button:has-text("Grades K–1")'); await sleep(300);
  for (const n of ['Adding', 'Taking away']) await t.click(`.modal:last-child label:has-text("${n}") input`);
  await t.screenshot({ path: path.join(OUT, 'assign_builder.png'), timeout: 180000 });
  await t.click('.modal:last-child button:has-text("Create assignment")'); await sleep(500);
  const code = await t.$eval('.modal:last-child .codebox', (e) => e.value);
  console.log('assignment code:', code.slice(0, 40) + '…');
  if (!/^REALA1-/.test(code)) fail('no assignment code');
  // ---- student
  const ctx = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
  const p = await ctx.newPage(); p.on('pageerror', (e) => errors.push(e.message));
  const ev = (f, a) => p.evaluate(f, a);
  await p.goto(url, { timeout: 240000, waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
  await ev(() => window.REAL.quality('low'));
  await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden', timeout: 120000 });
  await p.fill('#cr-name', 'Zoe'); await p.click('#cr-go');
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 240000 });
  await p.waitForSelector('#loading', { state: 'hidden', timeout: 180000 }).catch(() => {});
  await ev(() => window.REAL.devJump('hired')); await sleep(1200);
  await ev(() => { for (let i = 0; i < 20 && !document.querySelector('#dialog').hidden; i++) { const x = document.querySelector('#dialog .d-next, #dialog .d-choice'); if (x) x.click(); } window.REAL.state.quest = 'free'; });
  const phoneApp = async (name) => { if (!(await p.isVisible('#modal .phone'))) { await p.click('#btn-phone'); await sleep(700); } await p.click(`.app:has-text("${name}")`); await sleep(600); };
  await phoneApp('Settings'); await p.click('button:has-text("For grown-ups")'); await sleep(600);
  await p.fill('input[placeholder^="Assignment code"]', code); await p.click('.school-set button:has-text("Add")'); await sleep(600);
  const A = await ev(() => window.REAL.state.assign); console.log('student assignment:', JSON.stringify(A && { n: A.n, k: A.k }));
  if (!A || A.k.length !== 2) fail('assignment code did not add the assignment');
  // answer every activity correctly (or wrong on purpose for the pre-check)
  const answerAll = async (wrong, max = 12) => { for (let i = 0; i < max; i++) { await sleep(500);
    if (await p.isVisible('.learn-card')) { await p.click('.learn-card button.primary').catch(() => {}); continue; }
    const top = (await p.$$('#modal .modal')).pop(); if (!top || !(await top.$('.activity'))) return;
    const c = await top.$('button.primary:text-is("Continue")'); if (c && await c.isVisible()) { await c.click(); continue; }
    const Q = await ev(() => ({ type: window.__lastQ.type, a: window.__lastQ.a, decimals: window.__lastQ.decimals }));
    if (Q.type === 'number') { const v = wrong ? String(Number(Q.a) + 1) : (Q.decimals ? String(Math.round(Q.a * 100)) : String(Q.a)); for (const d of v) await (await top.$(`.key:text-is("${d}")`)).click(); await (await top.$('.key.ok')).click(); }
    else { const os = await top.$$('.opt:not([disabled])'); for (const o of os) { const tx = (await o.textContent()).trim(); if ((tx === String(Q.a)) !== wrong) { await o.click(); break; } } }
    if (wrong) for (let k = 0; k < 3; k++) { const os = await top.$$('.opt:not([disabled])'); const c2 = await top.$('button.primary:text-is("Continue")'); if (c2 && await c2.isVisible()) break; if (os.length) await os[0].click(); else { const ok = await top.$('.key.ok'); if (ok) await ok.click(); } await sleep(300); }
  } };
  await phoneApp('Assignment'); await p.click('button:has-text("Start")'); await answerAll(true, 30);
  const pre = await ev(() => window.REAL.state.assign.pre); console.log('pre-check:', JSON.stringify(pre));
  if (!pre || pre.n !== 5) fail('pre-check did not record 5 questions');
  // practise each skill until practised
  for (const id of A.k) for (let r = 0; r < 3; r++) { await ev((s) => { window.__pr = window.REAL.practice(s); }, id); await answerAll(false, 8); }
  await phoneApp('Assignment'); await p.screenshot({ path: path.join(OUT, 'assign_student.png'), timeout: 180000 });
  await p.click('.bill:has-text("Post-check") button'); await answerAll(false, 30);
  const post = await ev(() => window.REAL.state.assign.post); console.log('post-check:', JSON.stringify(post));
  if (!post || post.right <= pre.right) fail('post-check missing or no growth after practising');
  // report code → dashboard shows pre → post
  const rep = await ev(() => { const G = window.REAL.game(); return null; });
  await phoneApp('Settings'); await p.click('button:has-text("For grown-ups")'); await sleep(500); await p.click('button:has-text("Progress report")'); await sleep(700);
  const rcode = await p.$eval('.codebox', (e) => e.value);
  await t.click('.modal:last-child button:has-text("Done")').catch(() => {}); await sleep(300);
  await t.fill('.modal textarea.writebox', rcode); await t.click('button:has-text("Add reports")'); await sleep(600);
  const cell = await t.$eval('.tdash .trow td:nth-child(6)', (e) => e.textContent).catch(() => '');
  console.log('dashboard pre → post:', cell);
  if (!new RegExp(`${pre.right} → ${post.right}`).test(cell)) fail('dashboard does not show pre → post');
  await t.screenshot({ path: path.join(OUT, 'assign_dashboard.png'), timeout: 180000 });
  if (errors.length) fail('page errors: ' + errors.slice(0, 3).join(' | '));
  console.log(bad.length ? 'ASSIGN FAILED' : 'ASSIGN PASSED');
  await b.close(); srv.close(); process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error('FAIL', e); process.exit(2); });
