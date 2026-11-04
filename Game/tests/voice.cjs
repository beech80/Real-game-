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
  class FakeSR { start() { setTimeout(() => { const t = window.__say; if (t && this.onresult) this.onresult({ results: [[{ transcript: t }]] }); else if (this.onerror) this.onerror({ error: 'no-speech' }); this.onend && this.onend(); }, 400); } stop() {} }
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
  let spoke = false;
  for (let i = 0; i < 40 && !spoke; i++) {
    await sleep(500);
    if (await p.isVisible('#dialog .d-mic')) {
      const before = await p.textContent('#dialog .d-text'); const choices = await p.$$eval('#dialog .d-choice', (e) => e.map((x) => x.textContent));
      await ev((t) => { window.__say = t; }, choices[0].slice(1, 30)); await shot('dialog_mic');
      await p.click('#dialog .d-mic'); await sleep(1500);
      const after = await p.$eval('#dialog', (d) => (d.hidden ? '(closed)' : d.querySelector('.d-text').textContent));
      spoke = after !== before; results.dialogAnsweredByVoice = spoke;
    } else if (await p.isVisible('#dialog .d-next')) { await p.click('#dialog .d-next'); }
  }
  // into the city
  await ev(() => window.REAL.devJump('hired')); await sleep(1500);
  await p.evaluate(() => { while (!document.querySelector('#dialog').hidden) document.querySelector('#dialog .d-next, #dialog .d-choice') && document.querySelector('#dialog .d-next, #dialog .d-choice').click(); });
  // ask a character a question (typed here; the 🎤 uses the same path)
  await ev(() => { window.__a = window.REAL.askNPC('Rita'); });
  await p.waitForSelector('.chatlog'); await p.fill('.microw input', 'How do I corner faster in a race?'); await p.click('button:text-is("Ask")');
  await p.waitForFunction(() => [...document.querySelectorAll('.bubble.npc')].some((b) => /friction/.test(b.textContent)), null, { timeout: 30000 });
  results.npcAnsweredQuestion = true; await shot('ask_npc');
  await ev(() => window.__say = 'what time does fresh mart close'); await p.click('.chatlog ~ .microw .mic').catch(() => {}); await sleep(1500);
  results.askByVoice = await ev(() => [...document.querySelectorAll('.bubble.me')].some((b) => /fresh mart/i.test(b.textContent)));
  await p.click('button:text-is("Thanks, bye!")');
  // speaking practice, graded
  await ev(() => { window.__manualSpeak = true; window.__say = 'Hello, welcome to Fresh Mart! How can I help you today?'; window.__sp = window.REAL.speakPractice('cashier', 0); });
  await p.waitForSelector('.speakact .mic'); await p.click('.speakact .mic');
  await p.waitForSelector('.speakact .stars', { timeout: 30000 }); results.speakingStars = await p.textContent('.speakact .stars'); await shot('speaking_graded');
  await p.click('.speakact button.primary:text-is("Continue")');
  // a learning task answered out loud
  await ev(() => { window.__pr = window.REAL.practice('fin.prices'); });
  await p.waitForSelector('.activity .mic'); await ev(() => { window.__say = String(window.__lastQ.a); }); await p.click('.activity .mic'); await sleep(1200);
  results.taskAnsweredByVoice = await p.isVisible('.activity button.primary:text-is("Continue")'); await shot('task_by_voice');
  results.claudeCalls = await ev(() => window.__samples.join(','));
  console.log(JSON.stringify(results, null, 1));
  console.log('page errors', errors.length, errors.slice(0, 5));
  const ok = results.loaderShown && results.savedOnCreate && results.reachedPrologue && results.dialogAnsweredByVoice && results.npcAnsweredQuestion && results.speakingStars && results.taskAnsweredByVoice && !errors.length;
  console.log(ok ? 'VOICE TEST PASSED' : 'VOICE TEST FAILED');
  await b.close(); srv.close(); process.exit(ok ? 0 : 1);
})().catch(async (e) => { console.error('FAIL', e); process.exit(2); });
