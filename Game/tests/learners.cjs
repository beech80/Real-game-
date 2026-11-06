// Plays the learning side of the game as two learners, on a phone.
//  • A young child (~7) meeting a new Level-1 skill: help shown up front, big readable text, 🔊 read-aloud,
//    mistakes are gentle (no game over, try again), the worked answer appears after a few tries, and after
//    repeated mistakes the game offers a one-tap step back to the easier skill it builds on.
//  • A teen who already knows the basics: the game moves them up to their level instead of repeating basics,
//    serves real-world higher-level questions, and records progress when they answer well.
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = path.join(__dirname, '..', 'dist-hosted'), OUT = process.env.SHOTS || path.join(__dirname, 'shots');
const types = { '.txt': 'text/plain', '.html': 'text/html; charset=utf-8', '.json': 'application/json' };
const wrap = (f, b) => (f.endsWith('index.html') ? Buffer.concat([Buffer.from('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>'), b, Buffer.from('</body></html>')]) : b);
const srv = http.createServer((q, r) => { const f = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(wrap(f, b)); }); }).listen(0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ ...devices['iPhone SE'] });   // small phone: the hardest screen for little hands
  const p = await ctx.newPage(); const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  const ev = (f, a) => p.evaluate(f, a);
  const shot = (n) => p.screenshot({ path: path.join(OUT, `learner_${n}.png`), timeout: 180000 });
  const R = {};
  await p.goto(`http://localhost:${srv.address().port}/index.html`, { timeout: 240000, waitUntil: 'domcontentloaded' });
  await ev(() => { try { localStorage.clear(); } catch (e) {} });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
  await ev(() => window.REAL.quality('low'));
  await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden', timeout: 120000 });
  await p.fill('#cr-name', 'Kai'); await p.click('#cr-go');
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 180000 });
  await ev(() => window.REAL.devJump('hired')); await sleep(1200);
  await ev(() => { window.REAL.state.quest = 'free'; });
  await p.evaluate(() => { for (let i = 0; i < 20 && !document.querySelector('#dialog').hidden; i++) { const x = document.querySelector('#dialog .d-next, #dialog .d-choice'); if (x) x.click(); } });
  const top = async () => { const m = await p.$$('#modal .modal'); return m[m.length - 1]; };
  const clearCards = async () => { for (let i = 0; i < 6; i++) { if (await p.isVisible('.learn-card')) { await p.click('.learn-card button.primary'); await sleep(400); } else break; } };

  // ---------------------------------------------------------------- the young child: “Phonics” (builds on “Letters & sounds”)
  await ev(() => { window.__pr = window.REAL.practice('read.phonics'); }); await sleep(800);
  R.kidSawIntroCard = await p.isVisible('.learn-card'); if (R.kidSawIntroCard) await shot('kid_0_new_skill_card');
  await clearCards(); await p.waitForSelector('.activity .opt', { timeout: 20000 });
  const T = await top();
  R.kidHelpShownUpFront = await T.$eval('.helpbox', (e) => !e.hidden).catch(() => false);
  R.kidReadAloudButton = !!(await T.$('.say'));
  R.kidQuestionFontPx = await T.$eval('.lead', (e) => parseFloat(getComputedStyle(e).fontSize));
  R.kidTapTargetPx = await T.$eval('.opt', (e) => Math.round(e.getBoundingClientRect().height));
  await shot('kid_1_question');
  // two wrong taps on this question, then the next question two more: the game should offer a step back
  const wrongTap = async () => { const Q = await ev(() => window.__lastQ); const opts = await (await top()).$$('.opt:not([disabled])'); for (const o of opts) if ((await o.textContent()).trim() !== String(Q.a)) { await o.click(); await sleep(500); return true; } return false; };
  await wrongTap(); R.kidStillPlayingAfterMistake = await (await top()).$$eval('.opt:not([disabled])', (e) => e.length) > 0;
  await wrongTap(); await sleep(400);
  R.kidStepBackOffered = await p.isVisible('.stepback'); R.kidStepBackText = R.kidStepBackOffered ? (await p.textContent('.stepback')).trim() : '';
  await shot('kid_2_after_mistakes');
  await wrongTap(); await sleep(500);
  R.kidWorkedAnswerShown = await (await top()).$eval('.whybox', (e) => !e.hidden && e.textContent.length > 10).catch(() => false);
  await shot('kid_3_worked_answer');
  if (R.kidStepBackOffered) {   // take the step back: the easier skill opens on top, right away
    await p.click('.stepback'); await sleep(900); await clearCards();
    R.kidStepBackOpened = await ev(() => window.__lastQ && window.__lastQ.skill);
    await shot('kid_4_step_back');
    for (let k = 0; k < 2; k++) {   // answer the easier questions correctly
      await p.waitForFunction(() => document.querySelectorAll('#modal .modal .opt').length > 0, null, { timeout: 15000 });
      const Q = await ev(() => window.__lastQ); const o = await (await top()).$(`.opt:text-is(${JSON.stringify(String(Q.a))})`); if (o) await o.click();
      await sleep(400); const c = await (await top()).$('button.primary:text-is("Continue")'); if (c) await c.click(); await sleep(600); await clearCards();
    }
  }
  // close remaining sheets
  for (let i = 0; i < 4; i++) { const c = await p.$('#modal .modal:last-child button.primary:text-is("Continue")'); if (c && await c.isVisible()) { await c.click(); await sleep(500); } }
  await ev(() => window.__pr).catch(() => {});

  // ---------------------------------------------------------------- the teen: knows the basics, should be met at their level
  await ev(async () => {
    const G = window.REAL.game(), E = G.edu;
    const list = await (async () => { const out = []; for (const subj of ['finance', 'math', 'thinking', 'social']) out.push(...E.progress(subj).list.filter((s) => s.band <= 3).map((s) => s.id)); return out; })();
    for (const id of list) E.s.skills[id] = { ...E.get(id), st: 3, ok: 6, n: 6, streak: 3 };
  });
  R.teenBands = await ev(() => { const E = window.REAL.game().edu; return { finance: E.band('finance'), math: E.band('math'), thinking: E.band('thinking'), social: E.band('social') }; });
  const teenSkills = ['fin.investing', 'think.persuasion', 'soc.policy', 'tech.ai', 'math.statsadv'];
  R.teenAnswers = [];
  for (const id of teenSkills) {
    await ev((sk) => { window.__pr = window.REAL.practice(sk); }, id); await sleep(700); await clearCards();
    await p.waitForFunction(() => window.__lastQ && document.querySelectorAll('#modal .modal .opt, #modal .modal .key').length > 0, null, { timeout: 20000 });
    const Q = await ev(() => ({ q: window.__lastQ.q, a: window.__lastQ.a, type: window.__lastQ.type, skill: window.__lastQ.skill }));
    if (id === 'think.persuasion') { await shot('teen_question'); R.teenHintBehindButton = await (await top()).$eval('.helpbox', (e) => e.hidden).catch(() => false) && !!(await (await top()).$('button:text-is("Show a hint")')); }
    if (Q.type === 'choice') { const o = await (await top()).$(`.opt:text-is(${JSON.stringify(String(Q.a))})`); if (o) await o.click(); }
    else if (Q.type === 'number') { for (const d of String(Q.a)) await (await (await top()).$(`.key:text-is("${d}")`)).click(); await (await (await top()).$('.key.ok')).click(); }
    await sleep(500); const c = await (await top()).$('button.primary:text-is("Continue")'); if (c) await c.click(); await sleep(500);
    await ev(() => window.__pr);
    R.teenAnswers.push([id, Q.q.slice(0, 70), await ev((sk) => window.REAL.game().edu.state(sk), id)]);
  }
  console.log(JSON.stringify(R, null, 1));
  const ok = R.kidHelpShownUpFront && R.kidReadAloudButton && R.kidQuestionFontPx >= 16 && R.kidTapTargetPx >= 44 && R.kidStillPlayingAfterMistake && R.kidStepBackOffered
    && R.kidWorkedAnswerShown && R.kidStepBackOpened === 'read.letters'
    && R.teenBands.finance >= 4 && R.teenBands.math >= 4 && R.teenHintBehindButton && R.teenAnswers.every((a) => a[2] >= 1) && !errors.length;
  console.log('page errors', errors.slice(0, 3));
  console.log(ok ? 'LEARNERS PASSED' : 'LEARNERS FAILED');
  await b.close(); srv.close(); process.exit(ok ? 0 : 1);
})().catch((e) => { console.error('FAIL', e); process.exit(2); });
