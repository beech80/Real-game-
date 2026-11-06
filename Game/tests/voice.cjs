// Voice + start-up test (iPhone 13). Speech recognition and the viewer's Claude/room services are replaced by
// scripted stand-ins: recognition returns window.__say; sample returns canned replies; room never answers.
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = path.join(__dirname, '..', 'dist-hosted'), OUT = path.join(__dirname, 'shots');
const types = { '.txt': 'text/plain', '.html': 'text/html; charset=utf-8', '.json': 'application/json' };
const wrap = (f, b) => (f.endsWith('index.html') ? Buffer.concat([Buffer.from('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>'), b, Buffer.from('</body></html>')]) : b);
const srv = http.createServer((q, r) => { const f = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(wrap(f, b)); }); }).listen(0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MOCK = () => {
  window.__samples = [];
  class FakeSR { start() { if (window.__srBlocked) return setTimeout(() => { this.onerror && this.onerror({ error: 'not-allowed' }); this.onend && this.onend(); }, 100); this.onaudiostart && this.onaudiostart(); setTimeout(() => { const t = window.__say; if (t && this.onresult) { const w = t.split(' '), half = w.slice(0, Math.ceil(w.length / 2)).join(' '); this.onresult({ results: [[{ transcript: half }]] }); this.onresult({ results: [[{ transcript: t }]] }); } else if (this.onerror) this.onerror({ error: 'no-speech' }); this.onend && this.onend(); }, 400); } stop() {} abort() {} }
  window.webkitSpeechRecognition = FakeSR; window.SpeechRecognition = FakeSR;
  const S = async (msgs) => { window.__samples.push('answer'); return { text: 'Great question! Tires grip the road with friction, so better tires help you corner.', truncated: false }; };
  S.json = async (prompt) => { window.__samples.push(/option index/.test(prompt) ? 'pick' : 'grade'); return /option index/.test(prompt) ? { index: 0 } : { stars: 4, feedback: 'Lovely warm greeting!', tip: '' }; };
  window.claude = { use: (n) => (n === 'sample' ? Promise.resolve(S) : new Promise(() => {})) };
};
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ ...devices['iPhone 13'] });
  await ctx.addInitScript(MOCK);
  const p = await ctx.newPage(); const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  const ev = (f, a) => p.evaluate(f, a);
  const shot = (n) => p.screenshot({ path: path.join(OUT, `voice_${n}.png`), timeout: 150000 });
  const results = {};
  await p.goto(`http://localhost:${srv.address().port}/index.html`, { timeout: 240000, waitUntil: 'domcontentloaded' });
  await ev(() => { try { localStorage.clear(); } catch (e) {} });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
  await ev(() => window.REAL.quality('low'));
  await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden', timeout: 120000 });
  await p.fill('#cr-name', 'Kai'); await p.click('#cr-go');
  await sleep(800);
  results.loaderShown = await p.isVisible('#loading');
  results.savedOnCreate = await ev(() => !!localStorage.getItem('real.save.v2'));
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 180000 });
  results.reachedPrologue = await ev(() => window.REAL.state.location === 'club');
  // walk to the council: the representative's question can be answered out loud
  await p.waitForFunction(() => document.querySelector('#caption').hidden, null, { timeout: 60000 });
  await ev(() => { const c = window.REAL.club(); window.REAL.teleportXY(c.councilDoor.x, c.councilDoor.y - 1.5); });
  let micInDialog = false, sawChoices = false;
  for (let i = 0; i < 40; i++) {
    await sleep(500);
    if (await p.isVisible('#dialog .d-mic')) micInDialog = true;
    const ch = await p.$$('#dialog .d-choice'); if (ch.length) { sawChoices = true; await ch[0].click(); } else if (await p.isVisible('#dialog .d-next')) await p.click('#dialog .d-next').catch(() => {});
  }
  results.noMicInDialog = sawChoices && !micInDialog;
  // into the city
  await ev(() => window.REAL.devJump('hired')); await sleep(1500);
  await p.evaluate(() => { while (!document.querySelector('#dialog').hidden) document.querySelector('#dialog .d-next, #dialog .d-choice') && document.querySelector('#dialog .d-next, #dialog .d-choice').click(); });
  // ask a character a question (typed here; the 🎤 uses the same path)
  await ev(() => { window.__a = window.REAL.askNPC('Rita'); });
  await p.waitForSelector('.chatlog'); await p.fill('.microw input', 'How do I corner faster in a race?'); await p.click('button:text-is("Ask")');
  await p.waitForFunction(() => [...document.querySelectorAll('.bubble.npc')].some((b) => /friction/.test(b.textContent)), null, { timeout: 30000 });
  results.npcAnsweredQuestion = true; await shot('ask_npc');
  results.noMicInAsk = !(await p.$('.chatlog ~ .microw .mic'));
  await p.click('button:text-is("Thanks, bye!")');
  // speaking practice, graded
  await ev(() => { window.__manualSpeak = true; window.__say = 'Hello, welcome to Fresh Mart! How can I help you today?'; window.__sp = window.REAL.speakPractice('cashier', 0); });
  await p.waitForSelector('.speakact .mic'); await p.click('.speakact .mic');
  await p.waitForSelector('.speakact .stars', { timeout: 30000 }); results.speakingStars = await p.textContent('.speakact .stars'); await shot('speaking_graded');
  await p.click('.speakact button.primary:text-is("Continue")');
  // learning questions are tapped, not spoken
  await ev(() => { window.__pr = window.REAL.practice('fin.prices'); });
  await p.waitForSelector('.activity .opt'); results.noMicInTasks = !(await p.$('.activity .mic'));
  await p.click('.activity .opt'); await sleep(400);
  await p.evaluate(() => { const b = document.querySelector('.activity button.primary'); if (b) b.click(); }); await sleep(500);
  // the phone/app blocks the browser mic: the 🎤 opens an answer box for the keyboard's own dictation instead
  await ev(() => { window.__srBlocked = true; window.__say = 'Hello! Welcome to Fresh Mart, how can I help you?'; window.__sp = window.REAL.speakPractice('cashier', 0); });
  await p.waitForSelector('.speakact .mic'); await p.click('.speakact .mic');
  await p.waitForSelector('.dictate textarea', { timeout: 10000 }); results.dictationBoxWhenBlocked = true; await shot('dictate_box');
  await p.fill('.dictate textarea', 'Hello! Welcome to Fresh Mart, how can I help you?'); await p.click('.dictate button:text-is("Done ✓")', { timeout: 5000 }).catch(() => {});   // it may already have sent itself
  await p.waitForSelector('.speakact .stars', { timeout: 30000 }); results.gradedFromDictation = await p.textContent('.speakact .stars');
  await p.click('.speakact button.primary:text-is("Continue")');
  // no speech recognition at all (e.g. inside an app): speaking practice opens the box with the keyboard straight away
  await ev(() => { window.webkitSpeechRecognition = undefined; window.SpeechRecognition = undefined; window.__sp = window.REAL.speakPractice('cashier', 0); });
  await p.waitForSelector('.speakact .mic'); await p.click('.speakact .mic');
  await p.waitForSelector('.dictate textarea', { timeout: 5000 }); results.dictateFocused = await ev(() => document.activeElement && document.activeElement.closest('.dictate') != null);
  await p.fill('.dictate textarea', 'Hi there, welcome! How can I help you today?');   // dictated words arrive; nobody taps Done
  results.speakByDictation = await p.waitForSelector('.speakact .stars', { timeout: 15000 }).then(() => true, () => false);
  results.claudeCalls = await ev(() => window.__samples.join(','));
  console.log(JSON.stringify(results, null, 1));
  console.log('page errors', errors.length, errors.slice(0, 5));
  const ok = results.loaderShown && results.savedOnCreate && results.reachedPrologue && results.noMicInDialog && results.noMicInAsk && results.noMicInTasks && results.npcAnsweredQuestion && results.speakingStars && results.dictationBoxWhenBlocked && results.gradedFromDictation && results.dictateFocused && results.speakByDictation && !errors.length;
  console.log(ok ? 'VOICE TEST PASSED' : 'VOICE TEST FAILED');
  await b.close(); srv.close(); process.exit(ok ? 0 : 1);
})().catch(async (e) => { console.error('FAIL', e); process.exit(2); });
