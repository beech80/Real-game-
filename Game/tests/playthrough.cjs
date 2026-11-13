// Full natural playthrough: a bot plays REAL like a normal player, from character creation to the epilogue,
// with NO shortcuts (no devJump, no edits to the save, no skipping). It reads the on-screen goal, goes where it
// points, uses what is there, answers lessons like a real learner (sometimes wrong at first), works shifts, eats,
// pays bills, sleeps, and fills free time with learning and activities, like a player would.
// Travel uses teleport, but each trip is timed as walking (3.3 m/s) or a bus ride, so the report estimates real time.
// Report: estimated real minutes and in-game days per story part, and any place the bot got stuck or had no clear goal.
// Env: MAX_ACTIONS (default 1500), MAX_DAYS (default 40), MISTAKES (wrong-first rate, default 0.2), SHOTS dir.
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const traceSteps = require('./trace.cjs');
const DIST = path.join(__dirname, '..', 'dist-hosted'), OUT = process.env.SHOTS || path.join(__dirname, 'shots');
const types = { '.txt': 'text/plain', '.html': 'text/html; charset=utf-8', '.json': 'application/json' };
const wrap = (f, b) => (f.endsWith('index.html') ? Buffer.concat([Buffer.from('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>'), b, Buffer.from('</body></html>')]) : b);
const srv = http.createServer((q, r) => { const f = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(wrap(f, b)); }); }).listen(0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MAX_ACTIONS = +(process.env.MAX_ACTIONS || 1500), MAX_DAYS = +(process.env.MAX_DAYS || 40), MISTAKES = +(process.env.MISTAKES || 0.2);
let seed = 7; const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const RESUME = !!process.env.RESUME, PROFILE = path.join(OUT, 'profile');
  const ctx = await chromium.launchPersistentContext(PROFILE, { ...devices['iPhone 13'], deviceScaleFactor: 1, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });   // same phone layout; 1× pixels; the profile keeps the save so a long run can resume
  const b = { close: () => ctx.close() };
  const p = await ctx.newPage(); const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  const ev = (f, a) => p.evaluate(f, a);
  const vis = (sel) => p.isVisible(sel).catch(() => false);
  const shot = (n) => p.screenshot({ path: path.join(OUT, `play_${n}.png`), timeout: 180000 }).catch(() => {});
  // ---------------------------------------------------------------- real-time estimate for a human player (seconds)
  const T = { walk: 0, bus: 0, lessons: 0, dialog: 0, screens: 0, captions: 0 };
  const parts = []; let part = null;   // story parts, by quest/chapter
  const mark = (name, s) => { if (part && part.name === name) return; const now = Object.values(T).reduce((a, v) => a + v, 0); if (part) { part.secs = now - part.t0; part.days = s.day - part.d0; } part = { name, t0: now, d0: s.day, actions: 0 }; parts.push(part); };
  const total = () => Object.values(T).reduce((a, v) => a + v, 0);
  const issues = []; const issue = (kind, detail) => { issues.push({ kind, detail, at: part && part.name }); console.log('ISSUE', kind, detail); };

  await p.goto(`http://localhost:${srv.address().port}/index.html`, { timeout: 240000, waitUntil: 'domcontentloaded' });
  if (!RESUME) await ev(() => { try { localStorage.clear(); } catch (e) {} });
  await p.waitForFunction(() => window.REAL && window.REAL.mode === 'title', null, { timeout: 180000 });
  await ev(() => window.REAL.quality('low'));
  if (RESUME && await vis('#btn-continue')) { const prev = JSON.parse(fs.readFileSync(path.join(OUT, 'playthrough.json'), 'utf8')); Object.assign(T, prev.T); await p.click('#btn-continue'); console.log('resumed from the saved game'); }
  else { await p.click('#btn-new'); await p.waitForSelector('#cr-loading', { state: 'hidden', timeout: 120000 }); await p.fill('#cr-name', 'Nova'); T.screens += 40; await p.click('#cr-go'); }   // ~40 s to make a character
  await p.waitForFunction(() => window.REAL.mode === 'play', null, { timeout: 180000 });

  const S = () => ev(() => { const s = window.REAL.state, o = window.REAL.objective() || {}; return { quest: s.quest, chapter: s.chapter, loc: s.location, time: +s.time.toFixed(2), day: s.day, money: +s.money.toFixed(2), hunger: Math.round(s.hunger), energy: Math.round(s.energy), ll: window.REAL.life().level, ending: s.ending || null, obj: o.text || '', key: o.target || null, pos: o.pos || null, inDistrict: o.inDistrict, inRoom: o.inRoom, busy: !!window.REAL.game().busy, pos0: { ...window.REAL.playerPos() }, shift: s.shift ? { product: s.shift.product } : null, worked: !!s.flags[`worked${s.day}`], room: s.room && s.room.key }; });
  const top = async () => { const m = await p.$$('#modal .modal'); return m[m.length - 1] || null; };
  const walkSecs = (d) => (d > 150 ? 15 : d / 3.3);   // a jump between spaces (home ↔ street, district ↔ district) is a door or bus, not a walk
  const goTo = async (x, y, from) => { const d = Math.hypot(x - from.x, y - from.y); T.walk += walkSecs(d); await ev(([x, y]) => window.REAL.teleportXY(x, y), [x, y]); await sleep(700); };
  const goSock = async (key, where, from) => { const so = await ev(([k, w]) => { const r = window.REAL.teleport(k, w); return r ? { ...window.REAL.playerPos() } : null; }, [key, where || 'district']); if (so) T.walk += walkSecs(Math.hypot(so.x - from.x, so.y - from.y)); await sleep(700); return !!so; };
  const tapInteract = async () => { for (let i = 0; i < 12; i++) { if (await vis('#btn-interact')) { await p.click('#btn-interact', { timeout: 5000 }).catch(() => {}); await sleep(600); return true; } await sleep(400); } return false; };
  const triedOpts = new Map();

  // ---------------------------------------------------------------- answering any screen like a person
  const handleUI = async () => {
    if (await vis('#caption') && !(await ev(() => document.querySelector('#caption').hidden))) { T.captions += 3; if (await vis('.skip')) await p.click('.skip').catch(() => {}); else await sleep(700); return true; }
    if (await vis('.learn-card')) { T.screens += 8; await p.click('.learn-card button.primary').catch(() => {}); await sleep(300); return true; }
    if (await vis('#dialog') && !(await ev(() => document.querySelector('#dialog').hidden))) {
      const ch = await p.$$('#dialog .d-choice');
      if (ch.length) {   // a player reads the choices; this one picks thoughtfully: usually the first, sometimes another
        const texts = await Promise.all(ch.map((c) => c.textContent()));
        let i = 0; const rebuild = texts.findIndex((t) => /Rebuild/.test(t)); if (rebuild >= 0) i = rebuild; else if (rand() < 0.25) i = Math.floor(rand() * ch.length);
        T.dialog += 6; await ch[i].click().catch(() => {});
      } else { T.dialog += 3.5; await p.$eval('#dialog .d-text', (e) => e.click()).catch(() => {}); await p.click('#dialog .d-next').catch(() => {}); }
      await sleep(250); return true;
    }
    const m = await top(); if (!m) return false;
    const title = await m.$eval('.sh-title', (e) => e.textContent).catch(() => '');
    if (await vis('.dictate textarea')) { await p.fill('.dictate textarea', 'Hello! Welcome to Fresh Mart. How can I help you today?'); await p.click('.dictate button:text-is("Done ✓")').catch(() => {}); T.screens += 20; return true; }
    if (await m.$('canvas.sig')) { T.screens += 35; await traceSteps(p, '#modal .modal:last-child'); await sleep(600); return true; }
    const cont = await m.$('button.primary:text-is("Continue")');
    if (cont && await cont.isVisible()) { await cont.click(); await sleep(300); return true; }
    if (await m.$('.activity')) {   // a lesson: answer from understanding; sometimes a wrong try first
      const Q = await ev(() => { const q = window.__lastQ; return q && { type: q.type, a: q.a, items: q.items, word: q.word, decimals: q.decimals, total: q.total, cats: q.cats, o: q.o }; });
      T.lessons += 22;
      if (!Q) { await p.click('#modal .modal:last-child .sh-x').catch(() => {}); return true; }
      if (Q.type === 'choice') {
        if (rand() < MISTAKES) { const w = (Q.o || []).find((o) => String(o) !== String(Q.a)); if (w != null) { const wb = await m.$(`.opt:text-is(${JSON.stringify(String(w))})`); if (wb && !(await wb.isDisabled())) { await wb.click(); await sleep(300); T.lessons += 8; } } }
        const o = await m.$(`.opt:text-is(${JSON.stringify(String(Q.a))})`); if (o && !(await o.isDisabled())) await o.click();
      } else if (Q.type === 'number') { const s = Q.decimals ? String(Math.round(Q.a * 100)) : String(Q.a); for (const d of s) { const k = await m.$(`.key:text-is("${d}")`); if (k) await k.click(); } const ok = await m.$('.key.ok'); if (ok) await ok.click(); }
      else if (Q.type === 'order') { for (const it of Q.items) { const e = await m.$(`.opt:text-is(${JSON.stringify(it)})`); if (e) await e.click(); } }
      else if (Q.type === 'sort') { for (const [t, bin] of Q.items) { const e = await m.$(`.sort-items .opt:text-is(${JSON.stringify(t)})`); if (e) await e.click(); const bb = await m.$(`.bin:has(b:text-is(${JSON.stringify(bin)}))`); if (bb) await bb.click(); } }
      else if (Q.type === 'write') { const ex = await m.$('button:text-is("See an example")'); if (ex) await ex.click(); const ck = await m.$('button:text-is("Check my writing")'); if (ck) await ck.click(); T.lessons += 60; }
      else if (Q.type === 'budget') { const extra = Q.total - Q.cats.reduce((a, c) => a + c.min, 0); for (let k = 0; k < extra / 10; k++) { const rows = await m.$$('.brow'); const keys = await rows[rows.length - 1].$$('.key'); if (keys[1]) await keys[1].click(); } const sb = await m.$('button.primary.sm'); if (sb) await sb.click(); T.lessons += 25; }
      else if (Q.type === 'trace') { const ti = await m.$('button:has-text("Type instead")'); if (ti) { await ti.click(); await (await m.$('input.writebox')).fill(Q.word); await (await m.$('button.primary.sm:text-is("Done")')).click(); } }
      await sleep(400); return true;
    }
    // story/job screens built by hand (register, change, inventory, pay stub, budget, bills, menus…)
    const foods = await m.$$('.food.btn:not([disabled])');   // a menu or the kitchen: pick a meal like a careful spender (cheapest)
    if (foods.length) { let best = foods[0], bp = 1e9; for (const f of foods) { const t = await f.$eval('.amt', (e) => parseFloat(e.textContent.replace(/[^0-9.]/g, ''))).catch(() => 0); if (t < bp) { bp = t; best = f; } } await best.click().catch(() => {}); T.screens += 8; await sleep(500); return true; }
    const rows = await m.$$('.sortrow:not(.done)');
    if (rows.length) { const r0 = rows[0]; const bs = await r0.$$('button'); if (bs[0]) { await bs[0].click(); await sleep(250); } if (!(await r0.evaluate((e) => e.classList.contains('done'))) && bs[1]) { await bs[1].click(); await sleep(250); } T.screens += 5; return true; }
    const items = await m.$$('.belt .item:not([disabled])'); if (items.length) { for (const it of items) await it.click(); T.screens += 8; await sleep(500); return true; }
    if (await m.$('.tray .cash')) { const ch = await ev(() => window.__change); if (ch != null) { let left = Math.round(ch * 100); for (const v of [2000, 1000, 500, 100, 25, 10, 5, 1]) while (left >= v) { const btn = await m.$(`.tray .cash:text-is("${v >= 100 ? '$' + v / 100 : v + '¢'}")`); if (!btn) break; await btn.click(); left -= v; } await (await m.$('button.primary:text-is("Give change")')).click(); T.screens += 20; await sleep(500); return true; } }
    if (await m.$('.key')) { const a = await ev(() => window.__keyAns); if (a != null) { const dec = await m.$eval('.keypad-disp', (e) => /\.\d\d/.test(e.textContent)).catch(() => false); const s = dec ? String(Math.round(a * 100)) : String(a); for (const d of s) { const k = await m.$(`.key:text-is("${d}")`); if (k) await k.click(); } await (await m.$('.key.ok')).click(); await ev(() => { window.__keyAns = null; }); T.screens += 20; await sleep(500); return true; } }
    const dep = await m.$('button.primary:has-text("Deposit")'); if (dep) { await dep.click(); T.screens += 6; return true; }
    const wake = await m.$('button.primary:has-text("Wake up")'); if (wake) { await wake.click(); T.screens += 6; return true; }
    if (/Bus schedule/.test(title)) {   // read the timetable: go where the goal says (The Club, a new district), otherwise home
      const st = await S(); const want = /The Club/.test(st.obj) ? 'The Club' : (st.obj.match(/Midtown|Opportunity District|The Heights/) || [])[0] || (st.loc !== 'district' ? 'Starting District' : null);
      if (want) for (const row of await m.$$('.bill')) { if (!(await row.textContent()).includes(want)) continue; const btn = await row.$('button.primary'); if (btn) { await btn.click(); T.bus += 30; await sleep(1500); return true; } }
      const x = await m.$('.sh-x'); if (x) { await x.click().catch(() => {}); await sleep(300); return true; }
    }
    if (/Bills/.test(title)) {   // pay each bill it can, once; then close (a bill it can't afford yet waits for payday)
      const paid = triedOpts.get('bills|' + (await S()).day) || new Set(); triedOpts.set('bills|' + (await S()).day, paid);
      for (const row of await m.$$('.bill')) { const t = (await row.textContent()).trim().slice(0, 40), btn = await row.$('button.primary'); if (btn && !paid.has(t)) { paid.add(t); await btn.click().catch(() => {}); T.screens += 6; await sleep(300); return true; } }
      const x = await m.$('.sh-x'); if (x) { await x.click().catch(() => {}); await sleep(300); return true; }
    }
    // menus: try the options a player would (an untried one each time), else the main button, else close
    const key = title + '|' + (await m.$eval('.lead', (e) => e.textContent).catch(() => ''));
    const tried = triedOpts.get(key) || new Set(); triedOpts.set(key, tried);
    const opts = await m.$$('.opt:not([disabled]), .card.job, .card:not(.locked)');
    for (const o of opts) { const t = (await o.textContent()).trim(); if (tried.has(t) || /Browse every subject|Cancel|Leave|Not now|Close/i.test(t)) continue; tried.add(t); T.screens += 6; await o.click().catch(() => {}); await sleep(450); return true; }
    const prim = await m.$('button.primary:not([disabled])'); if (prim && await prim.isVisible()) { const t = (await prim.textContent()).trim(); if (!tried.has('P:' + t)) { tried.add('P:' + t); T.screens += 5; await prim.click().catch(() => {}); await sleep(450); return true; } }
    const x = await m.$('.sh-x'); if (x) { await x.click().catch(() => {}); await sleep(300); return true; }
    const ghost = await m.$('button.ghost'); if (ghost) { await ghost.click().catch(() => {}); await sleep(300); return true; }
    return false;
  };

  // ---------------------------------------------------------------- what a player does when there is no screen open
  let freeTurn = 0; const roomTried = new Set(), visits = new Map();
  const practice = async () => {   // open the Learn app and practise a skill at their level, like a player choosing a lesson
    await ev(() => { const E = window.REAL.game().edu; const subs = ['reading', 'math', 'finance', 'writing', 'science', 'thinking', 'social', 'health', 'tech']; window.__ps = ((window.__ps || 0) + 1) % subs.length; const subj = subs[window.__ps]; const b = E.band(subj);
      const all = E.progress(subj).list.filter((k) => !/^curs\./.test(k.id)).sort((x, y) => Math.abs(x.band - b) - Math.abs(y.band - b) || E.state(x.id) - E.state(y.id)); const k = all[0]; if (k) window.__pr = window.REAL.practice(k.id); });
    T.screens += 6; await sleep(500);
  };
  const act = async (s) => {
    // story targets first: go where the goal points and use what's there
    if (/Stock the shelf/.test(s.obj) && s.shift) { await goSock(`Interact_StockShelf_A${s.shift.product[1]}`, 'district', s.pos0); return tapInteract(); }
    if (/Pay your bill/.test(s.obj)) { await ev(() => { const it = window.REAL.game().interaction({ key: 'Interact_Bills' }); if (it) it.run(); }); T.screens += 8; return true; }   // Bills app on the phone
    const visitKey = s.day + '|' + s.obj; visits.set(visitKey, (visits.get(visitKey) || 0) + 1);
    if (s.pos && /Grow your Life Level/.test(s.obj) && visits.get(visitKey) > 4) s.pos = null;   // tried that suggestion a few times today: do something else
    if (s.pos) { await goTo(s.pos.x, s.pos.y - (s.inDistrict ? 0 : 0.2), s.pos0); if (!(await tapInteract())) { await goTo(s.pos.x + 0.8, s.pos.y - 0.8, s.pos); if (!(await tapInteract())) return false; } if (s.key === 'Interact_BusStop' || s.key === 'D:bus') T.bus += 25; return true; }
    if (s.quest === 'find_way') { const to = { x: 0, y: -80 }; await goTo(s.pos0.x, s.pos0.y + 60, s.pos0); return true; }   // follow the road toward the city
    // in a room or another district with nothing to do here: head out
    if (s.inRoom) {   // inside a building: hungry at a food place → order at the counter; otherwise head back out
      if (s.hunger < 35 && s.money > 10 && /diner|cafe|coffee|kitchen/i.test(s.room || '') && !roomTried.has(s.day + ':' + s.room)) {
        roomTried.add(s.day + ':' + s.room);
        const c = await ev(() => { const q = window.REAL.roomPoints().find((pt) => pt.act === 'counter'); if (q) window.REAL.teleportXY(q.x, q.y - 0.4); return !!q; });
        T.walk += 4; await sleep(700); if (c && await tapInteract()) return true;
      }
      await ev(() => window.REAL.leave()); T.walk += 6; await sleep(800); return true;
    }
    if (s.inDistrict) { const ok = await ev(() => { const pt = window.REAL.districtPoints().find((q) => q.key === 'bus'); if (pt) window.REAL.teleportXY(pt.x, pt.y); return !!pt; }); T.walk += 25; await sleep(700); if (ok && await tapInteract()) { T.bus += 25; return true; } return false; }
    // free time: night → home and sleep; hungry → eat; otherwise learn and stay active
    if (s.loc === 'apartment') { if (s.time >= 20.5 || s.energy < 15) { await goSock('Interact_Sleep', 'apartment', s.pos0); return tapInteract(); } if (s.hunger < 35) { await goSock('Interact_Fridge', 'apartment', s.pos0); if (await tapInteract()) return true; } await goSock('Interact_ExitDoor', 'apartment', s.pos0); return tapInteract(); }
    if (s.time >= 20.5 || s.energy < 15) { await goSock('Door_ApartmentLobby', 'district', s.pos0); return tapInteract(); }
    if (s.hunger < 35 && s.money > 12) { await goSock('Door_Diner', 'district', s.pos0); return tapInteract(); }
    freeTurn++;
    if (freeTurn % 3 === 0) { await goSock(freeTurn % 6 === 0 ? 'Interact_ParkJog' : 'Interact_ParkBench_01', 'district', s.pos0); if (await tapInteract()) return true; }
    await practice(); return true;
  };

  // ---------------------------------------------------------------- the loop
  let actions = 0, last = '', same = 0, prevSig = '', clockAt = 0; const trail = [];
  const t0 = Date.now();
  while (actions < MAX_ACTIONS) {
    let s; try { s = await S(); } catch (e) { await sleep(1000); continue; }
    if (s.day > MAX_DAYS) { issue('too-long', `still not finished after ${MAX_DAYS} game days (Life Level ${s.ll})`); break; }
    const partName = s.ending ? 'epilogue' : s.chapter === 'prologue' ? 'prologue (The Club)' : s.chapter === 'nowhere' ? 'countryside walk' : s.quest === 'invite' ? 'invitation' : ({ find_help: 'arrival & home', job: 'first job: applying', clockin: 'first job: shifts', shift: 'first job: shifts', jax1: 'Jax', home: 'first evening at home' })[s.quest] || `free play (Life Level ${s.ll})`;
    mark(partName, s); part.actions++;
    if (s.ending && !s.busy && !(await vis('#caption'))) { console.log('reached the epilogue'); break; }
    actions++;
    let did = false, how = '';
    try { did = await handleUI(); how = did ? 'ui' : ''; if (!did) { did = await act(s); how = 'act'; } } catch (e) { console.log('step error', e.message.slice(0, 120)); await p.keyboard.press('Escape').catch(() => {}); }
    const label = await p.textContent('#btn-interact').catch(() => '');
    const topTitle = await p.$eval('#modal .modal:last-child .sh-title', (e) => e.textContent).catch(() => '');
    trail.push(`${how}/${did} loc=${s.loc} key=${s.key} pos=${s.pos ? Math.round(s.pos.x) + ',' + Math.round(s.pos.y) : '-'} me=${Math.round(s.pos0.x)},${Math.round(s.pos0.y)} btn=“${(label || '').trim().slice(0, 30)}” sheet=“${topTitle}” $${s.money}`); if (process.env.TRAIL) console.log(trail[trail.length - 1]); if (trail.length > 15) trail.shift();
    { const now = total(), dt = now - clockAt; clockAt = now; if (dt > 0 && !s.busy && s.chapter !== 'prologue') await ev((h) => { const g = window.REAL.game(); if (!g.busy && window.REAL.mode === 'play') g.tick(h); }, Math.min(dt, 600) / 360).catch(() => {}); }
    // stuck detection: nothing meaningful changes for many actions
    const sig = JSON.stringify([s.quest, s.ll, s.day, Math.round(s.money), s.obj, /Grow your Life Level|Free time/.test(s.obj) ? Math.floor(s.time) : 0]);   // ignore location: going back and forth between places is still a stall
    if (sig === prevSig) same++; else { same = 0; prevSig = sig; }
    if (same === 40) { issue('stuck', `no progress for 40 actions: “${s.obj}” (${s.quest}, ${s.loc}, ${s.time}h)`); console.log(trail.join('\n')); await shot('stuck_' + issues.length); for (let k = 0; k < 6; k++) { const x = await p.$('#modal .modal:last-child .sh-x'); if (x) await x.click().catch(() => {}); } }
    if (same > 120) { issue('gave-up', `abandoned at “${s.obj}”`); break; }
    if (actions % 120 === 0) console.log('   life scores:', JSON.stringify(await ev(() => window.REAL.life().scores)));
    if (actions % 40 === 0) fs.writeFileSync(path.join(OUT, 'playthrough.json'), JSON.stringify({ T, parts, issues }, null, 1));
    if (actions % 40 === 0) console.log(`#${actions} day ${s.day} ${s.time}h · LL ${s.ll} · $${s.money} · ${partName} · goal: ${s.obj.slice(0, 70)} · est ${Math.round(total() / 60)} min · wall ${Math.round((Date.now() - t0) / 60000)} min`);
  }
  const fin = await S();
  mark('end', fin); parts.pop();
  console.log('\n=== PLAYTHROUGH REPORT ===');
  console.log(`finished: ${fin.ending ? 'yes, ending “' + fin.ending + '”' : 'NO'} · game days: ${fin.day} · Life Level ${fin.ll} · money $${fin.money} · actions ${actions}`);
  console.log(`estimated real play time: ${Math.round(total() / 60)} minutes (walking ${Math.round(T.walk / 60)}, bus ${Math.round(T.bus / 60)}, lessons ${Math.round(T.lessons / 60)}, talking ${Math.round(T.dialog / 60)}, screens ${Math.round(T.screens / 60)}, story scenes ${Math.round(T.captions / 60)})`);
  for (const pt of parts) console.log(`  ${pt.name.padEnd(34)} ${String(Math.round((pt.secs || 0) / 60)).padStart(4)} min · ${pt.days || 0} day(s) · ${pt.actions} actions`);
  console.log('issues:', issues.length ? '' : 'none'); for (const i of issues) console.log(`  ${i.kind} @ ${i.at}: ${i.detail}`);
  console.log('page errors:', errors.length, errors.slice(0, 5));
  fs.writeFileSync(path.join(OUT, 'playthrough.json'), JSON.stringify({ fin, T, parts, issues, errors: errors.slice(0, 20) }, null, 1));
  await shot('final');
  await b.close(); srv.close(); process.exit(fin.ending && !issues.some((i) => i.kind !== 'stuck') ? 0 : 1);
})().catch((e) => { console.error('FAIL', e); process.exit(2); });
