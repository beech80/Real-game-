// Reading help for kids who can't read yet: "Read to me" on the title screen, 🔊 on dialogs / the goal / sheets,
// tap any word to hear it and sound it out (parts light up), My Words app with a listen-and-find word game,
// and press-and-hold a button to hear it. Speech is recorded (not played) so the test can check what was said.
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
  const ctx = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
  await ctx.addInitScript(() => {   // record speech instead of playing it; finish each utterance quickly
    window.__said = [];
    const fake = { speaking: false, cancel() {}, getVoices: () => [], addEventListener() {}, speak(u) { window.__said.push(u.text); setTimeout(() => { if (u.onboundary) { let i = 0; for (const w of u.text.split(' ')) { u.onboundary({ name: 'word', charIndex: i }); i += w.length + 1; } } if (u.onend) u.onend(); }, 30); } };
    Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true });
    if (!window.SpeechSynthesisUtterance) window.SpeechSynthesisUtterance = function (t) { this.text = t; };
  });
  const p = await ctx.newPage(); const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  const ev = (f, a) => p.evaluate(f, a); const bad = []; const fail = (m) => { bad.push(m); console.log('FAIL', m); };
  const said = () => ev(() => window.__said.slice()); const clearSaid = () => ev(() => { window.__said.length = 0; });
  const shot = (n) => p.screenshot({ path: path.join(OUT, `reading_${n}.png`), timeout: 180000 });
  await p.goto(`http://localhost:${srv.address().port}/index.html`, { timeout: 240000, waitUntil: 'domcontentloaded' });
  await ev(() => { try { localStorage.clear(); } catch (e) {} });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
  await ev(() => window.REAL.quality('low'));
  // title: Read to me switch
  if (!(await p.isVisible('#btn-readtome'))) fail('no Read to me button on the title screen');
  await p.click('#btn-readtome'); await sleep(300);
  if (!(await ev(() => localStorage.getItem('real.readToMe') === '1'))) fail('Read to me did not turn on');
  if (!(await said()).some((t) => /read everything/i.test(t))) fail('Read to me did not confirm out loud');
  await shot('1_title');
  await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden', timeout: 120000 });
  await p.fill('#cr-name', 'Kai'); await p.click('#cr-go');
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 180000 });
  await p.waitForSelector('#loading', { state: 'hidden', timeout: 180000 }).catch(() => {});
  // a dialog: read automatically, 🔊 button, tap a word
  await clearSaid();
  await ev(() => { window.__dlg = window.REAL.say ? window.REAL.say('Ms. Ada', 'Welcome to the community garden. Plants need water and sunlight.') : null; });
  await sleep(1500);
  const hasDialog = await p.isVisible('#dialog .d-text');
  if (!hasDialog) fail('could not open a dialog');
  else {
    const s1 = await said(); console.log('auto-read:', JSON.stringify(s1).slice(0, 160));
    if (!s1.some((t) => /community garden/.test(t))) fail('Read to me did not read the dialog');
    if (!(await p.isVisible('#dialog .d-say .say-btn'))) fail('no 🔊 on the dialog');
    await clearSaid(); await p.click('#dialog .d-say .say-btn'); await sleep(800);
    if (!(await said()).some((t) => /Plants need water/.test(t))) fail('🔊 on the dialog did not read it');
    // tap the word "community"
    const pt = await ev(() => { const el = document.querySelector('#dialog .d-text'); const sp = [...el.querySelectorAll('.rw')].find((s) => /community/.test(s.textContent)); if (!sp) return null; const r = sp.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
    if (!pt) fail('dialog words not set up for tapping');
    else {
      await clearSaid(); await p.mouse.click(pt[0], pt[1]); await sleep(600);
      const card = await ev(() => { const c = document.querySelector('.wcard'); return c && { parts: [...c.querySelectorAll('.wc-part')].map((x) => x.textContent), btns: [...c.querySelectorAll('button')].map((x) => x.textContent) }; });
      console.log('word card:', JSON.stringify(card));
      if (!card) fail('tapping a word did not open the word card');
      else {
        if (card.parts.join('') !== 'community' || card.parts.length < 3) fail(`bad sound-out parts ${card.parts}`);
        if (!(await said()).includes('community')) fail('word card did not say the word');
        await clearSaid(); await p.click('.wcard button:has-text("Sound it out")'); await sleep(2500);
        const s3 = await said(); console.log('sound out:', JSON.stringify(s3));
        if (s3.length < card.parts.length + 1 || s3[s3.length - 1] !== 'community') fail('sound it out did not say each part then the word');
        await shot('2_wordcard');
        await p.click('.wcard button:has-text("Close")');
      }
    }
    const saved = await ev(() => window.REAL.state.words || []);
    if (!saved.includes('community')) fail('tapped word not saved to My Words');
    await p.click('#dialog .d-next').catch(() => {}); await sleep(400);
  }
  await ev(() => window.REAL.devJump('hired')); await sleep(1500);
  await ev(() => { for (let i = 0; i < 20 && !document.querySelector('#dialog').hidden; i++) { const x = document.querySelector('#dialog .d-next, #dialog .d-choice'); if (x) x.click(); } });
  // goal bar 🔊
  await ev(() => { const s = window.REAL.state; s.quest = 'free'; }); await sleep(1200);
  await clearSaid(); await p.click('#obj-say').catch(() => fail('no 🔊 on the goal bar')); await sleep(600);
  const goal = await ev(() => document.getElementById('obj-text').textContent);
  if (!(await said()).some((t) => t.length > 5 && goal.replace(/[^\w ]/g, '').includes(t.split(' ')[0]))) fail('goal 🔊 did not read the goal');
  // My Words app + word game
  await p.click('#btn-phone'); await sleep(800);
  await p.click('.app:has-text("Words")'); await sleep(800);
  if (!(await p.isVisible('.wchip:has-text("community")'))) fail('My Words does not list the tapped word');
  await p.click('button:has-text("Word game")'); await sleep(800);
  let right = 0;
  for (let i = 0; i < 3; i++) {
    const last = (await said()).filter((t) => /^[a-z']+$/.test(t)).pop();
    const ok = await ev((w) => { const b = [...document.querySelectorAll('.wp-opt')].find((x) => x.textContent === w); if (b) { b.click(); return true; } return false; }, last);
    if (ok) right++; await sleep(1500);
  }
  await shot('3_wordgame');
  if (right < 3) fail(`word game: could only match ${right}/3 heard words to buttons`);
  // sheet 🔊
  await clearSaid(); await p.click('.sh-head .say-btn').catch(() => fail('no 🔊 on the sheet')); await sleep(800);
  if (!(await said()).length) fail('sheet 🔊 read nothing');
  // press and hold a button to hear it
  await clearSaid();
  const bb = await p.$eval('.sh-x', (e) => { const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
  await p.mouse.move(bb[0], bb[1]); await p.mouse.down(); await sleep(2600); await p.mouse.up(); await sleep(300);
  if (!(await said()).some((t) => /close/i.test(t))) fail('press-and-hold did not read the button');
  if (!(await p.isVisible('.sh-x'))) fail('press-and-hold also pressed the button');
  if (errors.length) fail('page errors: ' + errors.slice(0, 3).join(' | '));
  console.log(bad.length ? 'READING FAILED' : 'READING PASSED');
  await b.close(); srv.close(); process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error('FAIL', e); process.exit(2); });
