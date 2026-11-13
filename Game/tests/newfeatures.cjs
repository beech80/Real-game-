// The learning upgrades, end to end in the browser: spaced review (a skill used 2 days ago comes back), Say it on
// questions, math tools (blocks / number line / fraction bars / coins), the writing workshop (plan → draft → check →
// publish), the family view, Español (title, dialog, Settings, a Spanish lesson, the 🌎 question button), and the
// bolder look (ink edges on buildings, outlines on characters).
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
  const p = await (await b.newContext({ viewport: { width: 900, height: 800 } })).newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  const bad = []; const fail = (m) => { bad.push(m); console.log('FAIL', m); };
  const ev = (f, a) => p.evaluate(f, a);
  const top = '#modal .modal:last-child';
  const closeAll = async () => { for (let i = 0; i < 6 && await p.isVisible('#modal .modal'); i++) { await p.$eval(`${top} .sh-x`, (e) => e.click()).catch(() => {}); await sleep(500); } };
  // answer whatever question is open (any type) until Continue shows, then continue
  const finishActivity = async () => { for (let i = 0; i < 8 && await p.$(`${top} .activity`); i++) {
    const cont = await p.$(`${top} button.primary:text-is("Continue"):not([hidden])`); if (cont) { await cont.click(); await sleep(700); continue; }
    await ev((t) => { const Q = window.__lastQ, m = document.querySelector(t); const opts = [...m.querySelectorAll('.opt:not([disabled])')];
      const right = opts.find((x) => x.textContent === String(Q.a)); if (right) return right.click(); if (opts.length) return opts[0].click();
      if (Q.type === 'number') { for (const d of String(Q.decimals ? Math.round(Q.a * 100) : Q.a)) { const k = [...m.querySelectorAll('.key')].find((x) => x.textContent === d); if (k) k.click(); } const ok = m.querySelector('.key.ok'); if (ok) ok.click(); } }, top);
    await sleep(700); } };
  const phone = async (app) => { await closeAll(); await ev(() => document.getElementById('btn-phone').click()); await sleep(1200); await p.$$eval('#modal .app', (els, a) => { const x = els.find((e) => e.textContent.replace(/\d+|🔁/g, '').trim().endsWith(a)); if (x) x.click(); }, app); await sleep(1000); };
  await p.goto(`http://localhost:${srv.address().port}/index.html`, { timeout: 240000, waitUntil: 'domcontentloaded' });
  await ev(() => { try { localStorage.clear(); } catch (e) {} });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
  await ev(() => window.REAL.quality('medium'));
  // --- Español on the title screen, then back
  await p.click('#btn-lang'); await sleep(500);
  const titleEs = await ev(() => document.getElementById('btn-new').textContent);
  console.log('title in Spanish:', titleEs);
  if (/New game/.test(titleEs)) fail('the title screen did not switch to Spanish');
  await p.click('#btn-lang'); await sleep(400);
  if (!/New game/.test(await ev(() => document.getElementById('btn-new').textContent))) fail('switching back to English did not restore the title');
  await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden', timeout: 120000 });
  await p.fill('#cr-name', 'Ivy'); await p.click('#cr-go');
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 400000 });
  await p.waitForSelector('#loading', { state: 'hidden', timeout: 180000 }).catch(() => {});
  await ev(() => window.REAL.devJump('hired')); await sleep(1200);
  for (let i = 0; i < 25 && await p.isVisible('#dialog'); i++) { const ch = await p.$$('#dialog .d-choice'); if (ch.length) await ch[0].click(); else await p.$eval('#dialog .d-next', (e) => e.click()).catch(() => {}); await sleep(300); }
  await ev(() => { window.REAL.state.quest = 'free'; });
  // --- bolder look
  const look = await ev(() => { let ink = 0, ol = 0; window.REAL.game().hooks && 0; const sc = window.__scene || null; const walk = (o) => { if (o.userData && o.userData.lkInk && o.isLineSegments) ink++; if (o.name && /_outline$/.test(o.name)) ol++; (o.children || []).forEach(walk); }; if (sc) walk(sc); return { ink, ol, has: !!sc }; });
  console.log('look:', JSON.stringify(look));
  if (look.has && (look.ink < 5 || look.ol < 1)) fail('buildings have no ink edges or characters no outline');
  // --- math tools on a math question (blocks for whole numbers, coins for money)
  for (const [skill, want] of [['math.add', /Blocks|Number line/], ['fin.money', /Coins/], ['math.fractions', /Fraction/]]) {
    await ev((s) => { window.__pr = window.REAL.practice(s); }, skill); await sleep(900);
    for (let i = 0; i < 4 && await p.isVisible('.learn-card'); i++) { await p.$eval('.learn-card button.primary', (e) => e.click()).catch(() => {}); await sleep(500); }
    const tb = await p.$(`${top} button.tool`);
    if (!tb) { fail(`no math tool button on ${skill}`); }
    else {
      await tb.evaluate((b) => b.click()); await sleep(600);
      const on = await ev((t) => { const x = document.querySelector(`${t} .manip-tabs .on`); return x && x.textContent; }, top);
      console.log(skill, 'tool opened:', on);
      if (!on || !want.test(on)) fail(`${skill}: the fitting tool did not open first (got ${on})`);
      if (/Blocks/.test(on || '')) { await p.$eval(`${top} .manip-btns button`, (e) => e.click()); await sleep(300); const r = await ev((t) => document.querySelector(`${t} .manip-read`).textContent, top); if (!/=\s*\d+/.test(r)) fail('blocks did not count'); }
      if (/Coins/.test(on || '')) { await p.$$eval(`${top} .cm-tray .cm-piece`, (els) => { els[0].click(); els[4].click(); }); await sleep(300); const r = await ev((t) => document.querySelector(`${t} .manip-read`).textContent, top); console.log('coins:', r); if (!/\$20\.25/.test(r)) fail('coins did not add up ($20 + 25¢)'); }
      if (/Fraction/.test(on || '')) { const before = await ev((t) => document.querySelectorAll(`${t} .fb-part`).length, top); await p.$eval(`${top} .fb-row button.ghost`, (e) => e.click()); await sleep(300); const after = await ev((t) => document.querySelectorAll(`${t} .fb-part`).length, top); if (after <= before) fail('fraction Split did not cut the parts'); }
      await p.screenshot({ path: path.join(OUT, `nf_tool_${skill}.png`), timeout: 180000 });
    }
    if (!(await p.$(`${top} button.mic`))) fail(`no Say it button on ${skill}`);
    await finishActivity();
    await closeAll();
  }
  // --- spaced review: a proficient skill last used 2 days ago (first gap is 1 day) is due
  const due = await ev(() => { const E = window.REAL.game().edu, k = E.get('math.add'); k.st = 3; k.lastSeenAt = Date.now() - 2 * 864e5; k.reviews = 0; E.s.skills['math.add'] = k; return E.dueReviews(); });
  console.log('due for review:', due);
  if (!due.includes('math.add')) fail('a skill unused for 2 days was not due for review');
  await phone('Learn'); await sleep(800);
  if (!(await p.$(`${top} .review-card`))) fail('the Learn app shows no review card');
  await closeAll();
  // --- writing workshop: plan → draft → check → publish
  await ev(() => { window.__ww = import('./writing.js').catch(() => null); });
  await phone('Learn'); await p.$$eval(`${top} .card`, (els) => { const w = els.find((e) => /Writing/.test(e.textContent)); if (w) w.click(); }); await sleep(800);
  await p.$$eval(`${top} button`, (els) => { const w = els.find((e) => /Writing (work)?shop/.test(e.textContent)); if (w) w.click(); }); await sleep(1200);
  if (!(await p.$(`${top} .skillrow`))) fail('the writing workshop did not open');
  else {
    await p.$$eval(`${top} .skillrow`, (els) => { const x = els.find((e) => /favorite animal/.test(e.textContent)) || els[0]; x.click(); }); await sleep(800);
    const boxes = await p.$$(`${top} .plan-box`); for (const [i, bx] of boxes.entries()) await bx.fill(['dog', 'brown fur', 'runs fast', 'friends'][i] || 'more');
    await p.$eval(`${top} button.primary:has-text("Start my draft")`, (e) => e.click()); await sleep(800);
    await p.fill(`${top} .draft-box`, 'i like dogs. my dog has soft brown fur');
    await p.$eval(`${top} button.primary:has-text("Check my writing")`, (e) => e.click()); await sleep(700);
    const r1 = await ev((t) => [...document.querySelectorAll(`${t} .rub-row.todo`)].map((x) => x.textContent), top);
    console.log('first check, to fix:', r1.length, r1[0]);
    if (!r1.length) fail('a weak draft got no notes');
    await p.fill(`${top} .draft-box`, 'I like dogs. My dog has soft brown fur and a long tail. It can run fast and catch a ball. I love my dog because it is fun to play with.');
    await p.$eval(`${top} button.primary:has-text("Check my writing")`, (e) => e.click()); await sleep(700);
    const r2 = await ev((t) => ({ todo: document.querySelectorAll(`${t} .rub-row.todo`).length, head: document.querySelector(`${t} .rubric .tier-h`).textContent }), top);
    console.log('after revising:', r2.head, 'to fix:', r2.todo);
    if (r2.todo) fail('a revised good draft still has notes');
    await p.screenshot({ path: path.join(OUT, 'nf_writing.png'), timeout: 180000 });
    await p.$$eval(`${top} button.primary`, (els) => { const x = els.find((e) => /Publish/.test(e.textContent) && !e.hidden); if (x) x.click(); }); await sleep(900);
    const folio = await ev(() => (window.REAL.state.portfolio || []).length);
    if (folio < 1) fail('publishing did not save to the portfolio');
  }
  await closeAll();
  // --- family view
  await phone('Settings'); await p.$$eval(`${top} button`, (els) => { const x = els.find((e) => /For grown-ups/.test(e.textContent)); if (x) x.click(); }); await sleep(800);
  await p.$$eval(`${top} button`, (els) => { const x = els.find((e) => /Family view/.test(e.textContent)); if (x) x.click(); }); await sleep(900);
  const fam = await ev((t) => { const m = document.querySelector(`${t} .family`); return m && { text: m.innerText.slice(0, 300), bars: m.querySelectorAll('.fam-bar').length }; }, top);
  console.log('family view:', fam && fam.text.replace(/\n+/g, ' | ').slice(0, 220));
  if (!fam || fam.bars !== 7) fail('the family view did not show the week');
  else if (!/Writing this week|favorite animal/i.test(fam.text + (await ev((t) => document.querySelector(`${t} .family`).innerText, top)))) fail('the family view does not show this week’s writing');
  await p.screenshot({ path: path.join(OUT, 'nf_family.png'), timeout: 180000 });
  // --- Español in play: Settings switch, a dialog, a Spanish lesson, the 🌎 button
  await phone('Settings'); await p.$$eval(`${top} button`, (els) => { const x = els.find((e) => e.textContent === 'Español'); if (x) x.click(); }); await sleep(900);
  const setEs = await ev((t) => document.querySelector(t).innerText.slice(0, 200), top);
  console.log('settings in Spanish:', setEs.replace(/\n+/g, ' | ').slice(0, 120));
  if (!/Idioma|Gráficos|Sonido|Accesibilidad/.test(setEs)) fail('Settings did not switch to Spanish');
  await closeAll();
  await ev(() => { window.__s = window.REAL.say('Rosa · Manager', 'Keep it up! Check your task list on the left.'); }); await sleep(1500);
  await p.$eval('#dialog .d-text', (e) => e.click()).catch(() => {}); await sleep(400);
  const dlg = await ev(() => document.querySelector('#dialog .d-text').textContent);
  console.log('dialog in Spanish:', dlg);
  if (/Keep it up/.test(dlg)) fail('a story line did not show in Spanish');
  await p.$eval('#dialog .d-next', (e) => e.click()).catch(() => {}); await sleep(400);
  await ev(() => { window.__pr = window.REAL.practice('math.add'); }); await sleep(900);
  for (let i = 0; i < 4 && await p.isVisible('.learn-card'); i++) { await p.$eval('.learn-card button.primary', (e) => e.click()).catch(() => {}); await sleep(500); }
  const esBtn = await p.$(`${top} button:has-text("En español")`);
  if (!esBtn) fail('no 🌎 En español button on a question');
  else { await esBtn.click(); await sleep(1500); const box = await ev((t) => { const x = document.querySelector(`${t} .esbox`); return x && !x.hidden ? x.innerText : null; }, top); console.log('🌎 box:', box && box.slice(0, 120)); if (!box || box.length < 10) fail('the 🌎 button showed nothing'); }
  const qEn = await ev((t) => document.querySelector(`${t} .qrow .lead`).textContent, top);
  if (/¿|¡/.test(qEn)) fail('the question itself should stay in English');
  await p.screenshot({ path: path.join(OUT, 'nf_spanish.png'), timeout: 180000 });
  if (errors.length) fail('page errors: ' + errors.slice(0, 3).join(' | '));
  console.log(bad.length ? 'NEWFEATURES FAILED' : 'NEWFEATURES PASSED');
  await b.close(); srv.close(); process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error('FAIL', e); process.exit(2); });
