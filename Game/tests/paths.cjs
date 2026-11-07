// Realistic college and career paths: FAFSA (need-based grant + merit scholarship), a student loan repaid after
// finishing, medical school locked until pre-med is done, a licensing exam you can fail and retake, and a job
// application that can be turned down with feedback and a date to reapply.
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = path.join(__dirname, '..', 'dist-hosted');
const types = { '.html': 'text/html; charset=utf-8', '.json': 'application/json' };
const wrap = (f, b) => (f.endsWith('index.html') ? Buffer.concat([Buffer.from('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>'), b, Buffer.from('</body></html>')]) : b);
const srv = http.createServer((q, r) => { const f = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(wrap(f, b)); }); }).listen(0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 })).newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  const bad = []; const fail = (m) => { bad.push(m); console.log('FAIL', m); };
  const ev = (f, a) => p.evaluate(f, a), S = (f) => ev(f), vis = (s) => p.isVisible(s);
  // answer helper: right (or deliberately wrong) answers to activity sheets; pick menu buttons; continue dialogs
  const answer = async (wrong = false) => { const Q = await ev(() => window.__lastQ && { a: window.__lastQ.a, type: window.__lastQ.type });
    if (!Q) return false; const opts = await p.$$('#modal .modal:last-child .opt:not([disabled])');
    for (const o of opts) { const t = (await o.textContent()).trim(); if ((t === String(Q.a)) !== wrong) { await o.click(); await sleep(300); break; } }
    const c = await p.$('#modal .modal:last-child button.primary:text-is("Continue")'); if (c && await c.isVisible()) { await c.click(); await sleep(400); } return true; };
  const flow = async ({ pick = [], wrong = false, rounds = 60 } = {}) => {
    for (let i = 0; i < rounds; i++) {
      await sleep(350);
      if (await vis('.learn-card')) { await p.click('.learn-card button.primary').catch(() => {}); continue; }
      if (await vis('#dialog')) { const ch = await p.$$('#dialog .d-choice'); if (ch.length) await ch[0].click(); else await p.click('#dialog .d-next').catch(() => {}); continue; }
      if (!(await vis('#modal .modal'))) return;
      if (await p.$('#modal .modal:last-child .activity')) { const done = await p.$('#modal .modal:last-child button.primary:text-is("Continue")'); if (done && await done.isVisible()) { await done.click(); continue; } await answer(wrong); continue; }
      let clicked = false; for (const t of pick) { const el = await p.$(t.startsWith('css:') ? '#modal .modal:last-child ' + t.slice(4) : `#modal .modal:last-child button:has-text(${JSON.stringify(t)})`); if (el && await el.isEnabled()) { await el.click(); clicked = true; break; } }
      if (!clicked) { const x = await p.$('#modal .modal:last-child .sh-x'); if (x) await x.click(); else return; }
    }
  };
  const college = () => ev(() => { window.__t = window.REAL.game().districtInteraction('heights', { key: 'college', sign: 'HEIGHTS COLLEGE', menu: true }).run(); });
  await p.goto(`http://localhost:${srv.address().port}/index.html`, { timeout: 240000, waitUntil: 'domcontentloaded' });
  await ev(() => { try { localStorage.clear(); } catch (e) {} });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
  await ev(() => window.REAL.quality('low'));
  await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden', timeout: 120000 });
  await p.fill('#cr-name', 'Ana'); await p.click('#cr-go');
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 240000 });
  await p.waitForSelector('#loading', { state: 'hidden', timeout: 180000 }).catch(() => {});
  await ev(() => window.REAL.devJump('hired')); await sleep(1500); await flow();
  await ev(() => { const s = window.REAL.state; s.quest = 'free'; s.money = 900; s.day = 20; s.time = 10; s.bank.unshift({ day: 19, desc: 'pay', amt: 300 }); });
  // 1) medical school is locked before pre-med; pre-med enrollment goes through the FAFSA and a student loan
  await college(); await flow({ pick: ['Classes'], rounds: 1 }); await sleep(800);
  const locked = await ev(() => { const r = [...document.querySelectorAll('#modal .modal:last-child .bill')].find((x) => /Medical school/.test(x.textContent)); return r && /First finish/.test(r.textContent); });
  console.log('med school locked before pre-med:', locked);
  if (!locked) fail('medical school was not locked before pre-med');
  await flow({ pick: ['Federal student loan', 'css:.bill:has-text("Pre-medical") button'], rounds: 30 });
  const pre = await S(() => ({ fafsa: !!window.REAL.state.flags.fafsa, course: window.REAL.state.courses.med, money: window.REAL.state.money }));
  console.log('after enrolling in pre-med:', JSON.stringify(pre));
  if (!pre.fafsa) fail('no FAFSA step'); if (!pre.course || !pre.course.loan) fail('pre-med enrollment with a student loan did not work');
  // 2) finish pre-med (last session) → loan repayment starts
  await ev(() => { const st = window.REAL.state.courses.med; st.n = 5; st.last = 0; });
  await college(); await flow({ pick: ['Classes', 'css:.bill:has-text("Pre-medical") button'], rounds: 40 });
  const med = await S(() => ({ done: window.REAL.state.courses.med.done, loanBill: window.REAL.state.bills.some((x) => /Student loan/.test(x.name)) }));
  console.log('pre-med finished:', JSON.stringify(med));
  if (!med.done) fail('pre-med did not finish'); if (!med.loanBill) fail('student loan repayment did not start after finishing');
  // 3) medical school opens; classes done → licensing exam: fail first, retake later and pass
  await ev(() => { const s = window.REAL.state; s.money = 9000; s.courses.medschool = { n: 8, last: 0 }; s.day = 25; });
  await college(); await flow({ pick: ['Classes', 'css:.bill:has-text("Medical school") button'], wrong: true, rounds: 50 });
  const f1 = await S(() => window.REAL.state.courses.medschool); console.log('after a failed exam:', JSON.stringify(f1));
  if (f1.done || !f1.examDay) fail('a failed licensing exam should not pass and should set a retake day');
  await ev(() => { window.REAL.state.day = window.REAL.state.courses.medschool.examDay; });
  await college(); await flow({ pick: ['Classes', 'css:.bill:has-text("Medical school") button'], rounds: 50 });
  const f2 = await S(() => window.REAL.state.courses.medschool); console.log('after the retake:', JSON.stringify(f2));
  if (!f2.done) fail('passing the licensing exam did not complete medical school');
  // 4) a job application with weak answers is turned down, with feedback and a reapply day
  const rej = await ev(async () => { const G = window.REAL.game(), C = G.hooks.CAREERS.find((c) => c.id === 'programmer'); window.__applyP = G.applyFor ? G.applyFor(C) : null; return !!G.applyFor; });
  console.log('applyFor hook available:', rej);
  if (rej) { await flow({ wrong: true, rounds: 50 }); await ev(() => window.__applyP);
    const st = await S(() => ({ jobs: window.REAL.state.jobs, re: window.REAL.state.flags.reapply_programmer, day: window.REAL.state.day }));
    console.log('after a weak application:', JSON.stringify(st));
    if (st.jobs.includes('programmer') || !st.re || st.re <= st.day) fail('a weak application for a professional job was not turned down with a reapply date'); }
  else fail('no way to test job applications');
  if (errors.length) fail('page errors: ' + errors.slice(0, 3).join(' | '));
  console.log(bad.length ? 'PATHS FAILED' : 'PATHS PASSED');
  await b.close(); srv.close(); process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error('FAIL', e); process.exit(2); });
