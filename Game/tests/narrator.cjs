// The recorded narrator: a recorded sentence plays from the voice packs (not the device voice), a sentence with no
// recording (random numbers) uses the device voice, and choosing a device voice in Settings turns the narrator off.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = path.join(__dirname, '..', 'dist-hosted');
const types = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.mp3': 'audio/mpeg' };
const wrap = (f, b) => (f.endsWith('index.html') ? Buffer.concat([Buffer.from('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>'), b, Buffer.from('</body></html>')]) : b);
const srv = http.createServer((q, r) => { const f = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(wrap(f, b)); }); }).listen(0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const man = JSON.parse(fs.readFileSync(path.join(DIST, 'voice', 'manifest.json')));
  // a sentence that has a recording (the recorder's list maps keys → spoken text)
  const SENT = process.env.SENTENCES || '/tmp/claude-0/-home-user-Real-game-/bf8dcf28-d602-589e-b7f8-93f3d75d0be0/scratchpad/tts/sentences.json';
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 800, height: 600 } })).newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  const bad = []; const fail = (m) => { bad.push(m); console.log('FAIL', m); };
  const ev = (f, a) => p.evaluate(f, a);
  await p.goto(`http://localhost:${srv.address().port}/index.html`, { timeout: 240000, waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 240000 });
  // find recorded sentences using the page's own id function
  const list = JSON.parse(fs.readFileSync(SENT)).slice(0, 4000);
  const rec = await ev(({ list, ids }) => list.filter(([k]) => ids.includes(window.__voiceId ? window.__voiceId(k) : '')).slice(0, 3), { list, ids: Object.keys(man.c) }).catch(() => []);
  await ev(() => { const P = HTMLMediaElement.prototype.play; window.__played = []; HTMLMediaElement.prototype.play = function () { window.__played.push(this.src); return P.call(this); };
    window.__synth = []; const S = speechSynthesis.speak.bind(speechSynthesis); speechSynthesis.speak = (u) => { window.__synth.push(u.text); try { S(u); } catch (e) {} }; });
  const target = rec[0] && rec[0][1];
  console.log('recorded sentences in packs:', Object.keys(man.c).length, '· testing with:', target);
  if (!target) fail('no recorded sentence found to test');
  else {
    await ev((t) => window.__narrate(t), target); await sleep(2500);
    let st = await ev(() => ({ played: window.__played.length, synth: window.__synth.length }));
    if (!st.played) { await ev((t) => window.__narrate(t), target); await sleep(2500); st = await ev(() => ({ played: window.__played.length, synth: window.__synth.length })); }   // first call loads the list of recordings
    console.log('recorded sentence →', JSON.stringify(st));
    if (!st.played) fail('a recorded sentence did not play the recording');
  }
  await ev(() => { window.__played = []; window.__synth = []; });
  await ev(() => window.__narrate('You have 7319 apples and 4271 pears.')); await sleep(1500);
  const st2 = await ev(() => ({ played: window.__played.length, synth: window.__synth.length }));
  console.log('unrecorded sentence →', JSON.stringify(st2));
  if (st2.played || !st2.synth) fail('a sentence without a recording should use the device voice');
  if (errors.length) fail('page errors: ' + errors.slice(0, 3).join(' | '));
  console.log(bad.length ? 'NARRATOR FAILED' : 'NARRATOR PASSED');
  await b.close(); srv.close(); process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error('FAIL', e); process.exit(2); });
