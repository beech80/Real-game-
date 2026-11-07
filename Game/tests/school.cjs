// School basics: a #school=CLASS link turns on school mode (AI replies + live neighbors off, locked), a student's
// progress report shows subjects, skills and standards, and its report code loads into the teacher dashboard
// (class table, standards, student detail, CSV). Two students: one fresh, one with practised skills.
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
  const codes = [];
  for (const [who, practise] of [['Mia', true], ['Leo', false]]) {
    const ctx = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
    const p = await ctx.newPage(); const errors = []; p.on('pageerror', (e) => errors.push(e.message));
    const ev = (f, a) => p.evaluate(f, a);
    await p.goto(url + '#school=room12', { timeout: 240000, waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
    await ev(() => window.REAL.quality('low'));
    await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden', timeout: 120000 });
    await p.fill('#cr-name', who); await p.click('#cr-go');
    await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 180000 });
    await p.waitForSelector('#loading', { state: 'hidden', timeout: 180000 }).catch(() => {});
    const sc = await ev(() => ({ school: window.REAL.state.school, smart: window.REAL.state.settings.smart, nb: window.REAL.state.settings.noNeighbors, smartOff: window.__smartOff }));
    console.log(who, 'school:', JSON.stringify(sc));
    if (!sc.school || !sc.school.on || sc.school.cls !== 'ROOM12') fail(`${who}: school link did not turn on school mode`);
    if (sc.smart !== false || !sc.nb || !sc.smartOff) fail(`${who}: school mode left AI replies or neighbors on`);
    await ev(() => window.REAL.devJump('hired')); await sleep(1200);
    await ev(() => { for (let i = 0; i < 20 && !document.querySelector('#dialog').hidden; i++) { const x = document.querySelector('#dialog .d-next, #dialog .d-choice'); if (x) x.click(); } });
    if (practise) await ev(() => { const E = window.REAL.game().edu; for (const id of ['math.add', 'math.sub', 'fin.money', 'read.vocab', 'read.letters']) { for (let i = 0; i < 8; i++) E.record(id, true, { ctx: ['work', 'home', 'store'][i % 3], day: 1 + i }); } window.REAL.state.stats.lessons = 14; });
    // settings › for grown-ups: locked toggles, school panel, progress report
    await p.click('#btn-phone'); await sleep(700); await p.click('.app:has-text("Settings")'); await sleep(600);
    if (!(await p.isVisible('button:has-text("Off (school)")'))) fail(`${who}: AI replies toggle not locked in school mode`);
    await p.click('button:has-text("For grown-ups")'); await sleep(600);
    if (!(await p.isVisible('text=School mode is ON'))) fail(`${who}: grown-ups page doesn't show school mode`);
    await p.click('button:has-text("Progress report")'); await sleep(900);
    const rep = await ev(() => ({ code: (document.querySelector('.codebox') || {}).value, rows: document.querySelectorAll('.report .rtable tr').length, skills: document.querySelectorAll('.rskill').length, std: (document.querySelector('.rskill small') || {}).textContent }));
    console.log(who, 'report:', JSON.stringify({ ...rep, code: rep.code && rep.code.slice(0, 30) + '…' + rep.code.length }));
    if (!rep.code || !/^REAL1-/.test(rep.code)) fail(`${who}: no report code`);
    if (rep.rows < 11) fail(`${who}: report missing subjects`);
    if (practise && (!rep.skills || !/CCSS|Jump\$tart/.test(rep.std || ''))) fail(`${who}: report skills don't show standards`);
    await p.screenshot({ path: path.join(OUT, `school_report_${who}.png`), timeout: 180000 });
    codes.push(rep.code);
    if (errors.length) fail(`${who}: page errors: ` + errors.slice(0, 2).join(' | '));
    await ctx.close();
  }
  // teacher dashboard on another device
  const ctx = await b.newContext({ viewport: { width: 1100, height: 760 } });
  const p = await ctx.newPage(); const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  const ev = (f, a) => p.evaluate(f, a);
  await p.goto(url, { timeout: 240000, waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
  await p.click('#btn-teacher'); await sleep(800);
  await p.fill('.modal textarea.writebox', `Mia sent: ${codes[0]}\nLeo: ${codes[1]}\nnot a code`);
  await p.click('button:has-text("Add reports")'); await sleep(800);
  const dash = await ev(() => ({ rows: [...document.querySelectorAll('.tdash .trow')].map((r) => r.querySelector('b').textContent), cls: [...document.querySelectorAll('.tdash .trow td:nth-child(2)')].map((x) => x.textContent), std: document.querySelectorAll('.rtable:not(.tdash) tr').length }));
  console.log('dashboard:', JSON.stringify(dash));
  if (dash.rows.join() !== 'Mia,Leo') fail('dashboard did not list both students');
  if (dash.cls.some((c) => c !== 'ROOM12')) fail('dashboard lost the class code');
  if (dash.std < 2) fail('dashboard has no standards table');
  await p.screenshot({ path: path.join(OUT, 'school_dashboard.png'), timeout: 180000 });
  // saved across reloads; adding the same code again doesn't duplicate
  await p.fill('.modal textarea.writebox', codes[0]); await p.click('button:has-text("Add reports")'); await sleep(500);
  if ((await ev(() => document.querySelectorAll('.tdash .trow').length)) !== 2) fail('same report added twice');
  // student detail + CSV
  await p.click('.tdash .trow >> nth=0'); await sleep(500);
  if ((await ev(() => document.querySelectorAll('.rskill').length)) < 5) fail('student detail missing skills');
  await p.click('button:has-text("Class")'); await sleep(400);
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 10000 }).catch(() => null), p.click('button:has-text("CSV")')]);
  if (!dl) fail('CSV did not download');
  else { const f = await dl.path(); const csv = fs.readFileSync(f, 'utf8'); const lines = csv.trim().split('\n'); console.log('csv lines', lines.length, lines[0].slice(0, 120)); if (lines.length !== 3) fail('CSV should have a header and 2 students'); }
  if (errors.length) fail('teacher page errors: ' + errors.slice(0, 2).join(' | '));
  console.log(bad.length ? 'SCHOOL FAILED' : 'SCHOOL PASSED');
  await b.close(); srv.close(); process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error('FAIL', e); process.exit(2); });
