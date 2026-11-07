// REAL — Learn • Live • Grow. Boot, title, creator, prologue, wilderness, city, invitation, endings, loop.
import * as THREE from 'three';
import { Engine, makeSurfaceTextures, isMobile } from './engine.js';
import { loadGLB, mergeStatic, Collision, districtGround, P2W } from './world.js';
import { Character, loadSpecies, SPECIES, JACKETS, HOODIES, FUR_SHIFT } from './characters.js';
import { Input, FollowCamera, Player } from './controls.js';
import { Traffic, populate, StoryNPC } from './city.js';
import { UI, Minimap, h, $, wait, setSfx, money } from './ui.js';
import { Audio } from './audio.js';
import { Game, newState, loadSave, openPhone, saveFromText } from './game.js';
import { buildWilderness, wildHeight, WILD, buildClub, CLUB, setGate } from './scenes.js';
import { DISTRICTS, buildDistrict, clampToWalk, districtHeight } from './districts.js';
import { installExpansion, HOMES, VEHICLES, PET_TYPES, FRIENDS } from './expansion.js';
import { WORK, COURSES } from './careers.js';
import { CAREERS } from './life.js';
import { makePet, PetFollower, makeCompanion, updateCompanion } from './pets.js';
import { Neighbors } from './multiplayer.js';
import { Voice, Brain, askNPC } from './voice.js';
import { buildInterior, BUILDING_ROOMS, ROOM } from './interiors.js';
import { MapView } from './mapview.js';
import { installEvents } from './events.js';
import { scatterFlora, updateLook } from './lookfx.js';
import { schoolFromLink, enableSchool, teacherDashboard, assignFromLink, setAssignment } from './school.js';
import { installKeyboard } from './keyboard.js';
import { initReadAlong, readEls, readToMe, setReadToMe, say as sayText, logLine } from './readalong.js';
import { installAdventures, installAdventureHelpers, ADVENTURES } from './adventures.js';
import { Race } from './race.js';
import { PetCourse, RobotArena } from './arenas.js';
import { runActivity, forgetRecent } from './learnkit.js';
import { PRACTICE } from './activities.js';
import { carMesh, Pedestrian } from './city.js';
installExpansion(Game); installEvents(Game); installAdventures(Game); installAdventureHelpers(Game);

// ---------------------------------------------------------------- crash/diagnostic panel (never a silent black screen)
function fatal(msg) {
  const el = document.getElementById('crash');
  if (!el) return;
  el.querySelector('p').textContent = msg;
  el.hidden = false;
  const b = document.getElementById('crash-reload'); if (b) b.onclick = () => location.reload();
}
addEventListener('error', (e) => { if (mode === 'loading' || mode === 'intro') fatal('REAL hit a problem while starting: ' + (e.message || 'unknown error') + '. Your character is saved. Tap Reload and choose Continue.'); });
addEventListener('unhandledrejection', (e) => { const m = (e.reason && e.reason.message) || e.reason; if (mode === 'loading' || mode === 'intro') fatal('REAL hit a problem while starting: ' + m + '. Your character is saved. Tap Reload and choose Continue.'); else console.warn('async error', m); });
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault());

let engine;
try { engine = new Engine($('#view')); }
catch (e) { fatal(e.message); throw e; }
engine.onContextLost = () => { try { game && game.save(); } catch (e) {} fatal('Your phone paused the 3D graphics (this can happen when memory runs low). Your progress is saved — tap Reload to continue.'); };
const audio = new Audio();
setSfx((n) => audio.play(n));
UI.init();
const saveNow = () => { try { if (game && mode === 'play' && player && !game.state.ending) { if (!game.busy) { game.state.pos = { ...player.pos }; game.state.heading = player.heading; } game.save(); } } catch (e) {} };
document.addEventListener('visibilitychange', () => { if (document.hidden) saveNow(); });
window.addEventListener('pagehide', saveNow);
initReadAlong(() => game && game.state);
UI.onLine = (who, text) => logLine(who, text);   // the Talk log in the phone
installKeyboard();
// 🔊 on the goal bar, and the "Read to me" switch on the title screen
document.getElementById('obj-say').onclick = (e) => { e.stopPropagation(); readEls([document.getElementById('obj-text')]); };
{ const b = document.getElementById('btn-readtome'); const show = () => { b.querySelector('b').textContent = readToMe() ? 'On' : 'Off'; b.setAttribute('aria-pressed', readToMe()); b.classList.toggle('primary', readToMe()); b.classList.toggle('ghost', !readToMe()); };
  b.onclick = () => { setReadToMe(!readToMe()); show(); if (readToMe()) sayText('Okay! I will read everything to you. You can also tap any word to hear it.'); }; show(); }
// press and hold any button to hear what it says (for players who can't read it yet). Hold vs tap is decided from the
// real press and release times, so a quick tap on a slow device is never mistaken for a hold.
{ let t = null, held = false, down = null;
  document.addEventListener('pointerdown', (e) => { const b = e.target.closest && e.target.closest('button'); held = false; down = null; if (navigator.webdriver && !window.__allowHold) return;   // automated tests opt in
    if (!b || b.closest('#btn-sprint, #btn-interact, .joy, #joystick, [data-noread], .decode')) return; down = { b, ts: e.timeStamp, x: e.clientX, y: e.clientY }; clearTimeout(t);
    t = setTimeout(() => { const txt = (b.getAttribute('aria-label') || b.innerText || '').trim(); if (txt && down && down.b === b) sayText(txt); }, 600); }, true);
  document.addEventListener('pointerup', (e) => { clearTimeout(t); held = !!down && e.timeStamp - down.ts >= 700 && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 12; down = null; }, true);
  document.addEventListener('pointercancel', () => { clearTimeout(t); down = null; held = false; }, true);
  document.addEventListener('click', (e) => { if (held && e.target.closest && e.target.closest('button')) { held = false; e.stopPropagation(); e.preventDefault(); } else held = false; }, true); }
UI.voiceHooks = { canListen: () => Voice.canListen(), speak: (t, who) => Voice.speak(t, who), stop: () => Voice.stop(), listenPick: async (q, choices) => { const said = await Voice.ask({ prompt: q }); if (!said) return null; UI.toast(`Heard “${said}” — checking…`, 'info', 1600); const i = await Brain.pick(q, choices, said); if (i == null) UI.toast(`I heard “${said}”. Which answer did you mean? Tap it, or say it again.`, 'info', 4200); return i; } };
const textures = makeSurfaceTextures();
const scene = engine.scene, camera = engine.camera;

const W = { district: null, apartment: null, wild: null, club: null, data: null, lamps: [], d: {}, rooms: {} };
let pet = null, companion = null, cart = null, myCar = null, neighbors = null, tipT = 60, mini = null, race = null, petCourse = null, arena = null, markT = 0;
let player = null, game = null, input = null, fcam = null, traffic = null, peds = [], npcs = {}, coll = null, aptColl = null, clubColl = null, members = [];
var mode = 'loading';
let beacon = null, minimap = null, mapView = null, lastTarget = null;

// ------------------------------------------------------------------------------------------ loading
function progress(p, label) { $('#load-bar').style.width = Math.round(p * 100) + '%'; if (label) $('#load-label').textContent = label; }
function addColliders(c, list) { for (const x of list) c.items.push({ ...x, cos: Math.cos(x.r || 0), sin: Math.sin(x.r || 0) }); }

// Fresh Mart was built tight (under 1 m behind the aisles, 1.2 m in the stockroom). Shift a few fixtures so every
// walkway is about 1.5 m wide. Moves the 3D model, its collider and any interaction points together.
function roomierFreshMart(root, D) {
  const moves = [[/^PROP_REAL_GroceryShelf_Aisle/, 0, -0.6], [/^PROP_REAL_Checkout_/, 0, -0.6], [/^PROP_REAL_StockPallet_/, 0, 0.5],
    [/^PROP_REAL_Table_Break$/, 0.6, 0.4], [/^PROP_REAL_Chair_Break_01$/, 0.3, 0.3], [/^PROP_REAL_Chair_Break_02$/, 1.2, 1.0]];
  const sockMoves = [[/StockShelf_A|CustomerBrowse_A/, 0, -0.6], [/Register_0|CustomerQueue_0/, 0, -0.6], [/InventoryCount/, 0, 0.5]];
  try {
    root.updateMatrixWorld(true);
    const v = new THREE.Vector3();
    for (const [re, dx, dy] of moves) {
      const hits = []; root.traverse((o) => { if (o.name && re.test(o.name) && !(o.parent && re.test(o.parent.name || ''))) hits.push(o); });
      for (const o of hits) { o.getWorldPosition(v); v.x += dx; v.z -= dy; o.parent.worldToLocal(v); o.position.copy(v); }
      for (const c of D.colliders) if (re.test(c.n || '')) { c.x += dx; c.y += dy; }
    }
    for (const [re, dx, dy] of sockMoves) for (const so of D.sockets) if (re.test(so.n)) { so.x += dx; so.y += dy; }
    root.updateMatrixWorld(true);
  } catch (e) { console.warn('fresh mart layout kept', e); }
}

async function boot() {
  progress(0.02, 'Loading the city…');
  const data = W.data = await (await fetch('assets/world.json')).json();
  const g = await loadGLB('assets/district.glb.gz', (p) => progress(0.05 + p * 0.62, 'Loading the Starting District…'));
  progress(0.7, 'Building streets…');
  await wait(30);
  roomierFreshMart(g.scene, data.district);
  W.district = mergeStatic(g.scene, textures, 40);
  scene.add(W.district);
  try { const fl = scatterFlora(W.district, isMobile ? { tufts: 2200, flowers: 450 } : {}); if (fl) W.district.add(W.flora = fl); } catch (e) { console.warn('flora off', e); }
  W.lamps = W.district.userData.lamps;
  for (const m of W.lamps) m.userData.lamp = m.emissiveIntensity;
  coll = new Collision(data.district.colliders);
  progress(0.8, 'Laying the old road…');
  await wait(20);
  W.wild = buildWilderness(textures);
  scene.add(W.wild.group);
  addColliders(coll, W.wild.colliders);
  progress(0.88, 'Waking up the residents…');
  await loadSpecies('Fox');
  traffic = new Traffic(scene, coll);
  beacon = makeBeacon(); scene.add(beacon);
  W.pools = makeLightPools(data.district.colliders.filter((c) => c.n === 'PROP_StreetLight'));
  scene.add(W.pools);
  minimap = new Minimap($('#minimap'), data.district); minimap.wildRoad = WILD.road; minimap.wildTrail = WILD.trail;
  mapView = new MapView(data.district, { wildRoad: WILD.road, wildTrail: WILD.trail });
  mapView.onClose = () => { if (game) { game.busy = false; if (input) input.enabled = true; } };
  $('#minimap').addEventListener('click', () => openMap());
  W.ccSign = floatingSign(['COMMUNITY CENTER', 'HOUSING · JOBS · HELP']);
  const cc = sock('Door_CareerCenter'); W.ccSign.position.copy(P2W(cc.x, cc.y - 0.4, 4.6)); scene.add(W.ccSign);
  progress(1, 'Ready');
  await wait(250);
  $('#loading').hidden = true;
  title();
  populate(scene, coll, isMobile ? 8 : 16).then((p) => { peds = p; });
}

function floatingSign(lines) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 160; const g = c.getContext('2d');
  g.fillStyle = '#13214a'; g.fillRect(0, 0, 512, 160); g.strokeStyle = '#e9a93a'; g.lineWidth = 8; g.strokeRect(6, 6, 500, 148);
  g.fillStyle = '#ffd27a'; g.textAlign = 'center'; g.font = 'bold 54px "Barlow Condensed", Arial'; g.fillText(lines[0], 256, 70);
  g.fillStyle = '#f4ead7'; g.font = '600 34px "Barlow Condensed", Arial'; g.fillText(lines[1], 256, 122);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.12), new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.6 }));
  return m;
}

function makeLightPools(lights) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,200,130,1)'); gr.addColorStop(0.45, 'rgba(255,170,90,.45)'); gr.addColorStop(1, 'rgba(255,150,70,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const mat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
  const geo = new THREE.PlaneGeometry(7, 7); geo.rotateX(-Math.PI / 2);
  const inst = new THREE.InstancedMesh(geo, mat, lights.length);
  const m = new THREE.Matrix4();
  lights.forEach((l, i) => { const toward = Math.abs(l.y) < Math.abs(l.x) ? { x: 0, y: -Math.sign(l.y) * 1.2 } : { x: -Math.sign(l.x) * 1.2, y: 0 }; m.makeTranslation(l.x + toward.x, 0.17, -(l.y + toward.y)); inst.setMatrixAt(i, m); });
  inst.renderOrder = 2; inst.userData.mat = mat;
  return inst;
}
function makeBeacon() {
  const g = new THREE.Group();
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.6, 40, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0xe8a33a, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  beam.position.y = 20; g.add(beam);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.85, 40), new THREE.MeshBasicMaterial({ color: 0xffc35a, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.2; g.add(ring);
  g.userData.ring = ring; g.visible = false;
  return g;
}

// ------------------------------------------------------------------------------------------ title + creator
let titleT = 0;
function title() {
  mode = 'title';
  const save = loadSave();
  const T = $('#title');
  T.hidden = false;
  $('#btn-continue').hidden = !save;
  if (save) $('#btn-continue').querySelector('small').textContent = `${save.name} · Day ${save.day} · ${money(save.money)}`;
  $('#btn-teacher').onclick = () => { audio.play('click'); teacherDashboard(); };
  $('#btn-load').onclick = () => { audio.play('click'); UI.sheet('Load a save', (close) => {
    const ta = h('textarea', { class: 'writebox', rows: 4, placeholder: 'Paste a save code (REALSAVE1:…), or choose a save file.' });
    const file = h('input', { type: 'file', accept: '.txt,text/plain', onchange: async () => { const f = file.files[0]; if (f) ta.value = await f.text(); } });
    return h('div', { class: 'act' }, h('p', { class: 'lead' }, 'Bring your game from another device.'), file, ta,
      h('button', { class: 'primary', onclick: () => { const st = saveFromText(ta.value); if (!st) return UI.toast('That isn’t a REAL save. Check the code or file.', 'warn');
        const cur = loadSave(); if (cur && cur.name && !confirm(`Replace ${cur.name}'s game (Day ${cur.day}) with ${st.name}'s game (Day ${st.day})?`)) return;
        try { localStorage.setItem('real.save.v2', JSON.stringify(st)); } catch (e) {} close(); UI.toast(`Loaded ${st.name}, Day ${st.day}.`, 'good'); title(); } }, 'Load this game'));
  }, { icon: '📂' }); };
  $('#btn-new').onclick = () => { audio.start(); audio.play('click'); T.hidden = true; creator(); };
  $('#btn-continue').onclick = () => { audio.start(); audio.play('click'); T.hidden = true; startGame(save, false); };
}
const creatorState = { i: 0, fur: 0, jacket: 0, hoodie: 0 };
let preview = null;
async function creator() {
  mode = 'creator';
  const C = $('#creator'); C.hidden = false;
  const nameEl = $('#cr-name');
  const show = async () => {
    const sp = SPECIES[creatorState.i];
    $('#cr-species').textContent = sp.name.toUpperCase(); $('#cr-quote').textContent = `“${sp.quote}”`; $('#cr-traits').textContent = sp.traits;
    $('#cr-loading').hidden = false;
    const g = await loadSpecies(sp.id);
    if (SPECIES[creatorState.i] !== sp) return;
    if (preview) scene.remove(preview.root);
    preview = new Character(g); preview.root.position.copy(P2W(26, -9.5, 0.13)); preview.root.rotation.y = 0.5; scene.add(preview.root);
    applyLook(); preview.play('Idle', 0); setTimeout(() => preview && preview.oneShot('Wave'), 300); preview.expression('Happy', 2);
    $('#cr-loading').hidden = true;
  };
  const applyLook = () => preview && preview.setOutfit({ jacket: JACKETS[creatorState.jacket].color, hoodie: HOODIES[creatorState.hoodie].color, fur: FUR_SHIFT[creatorState.fur].mul });
  const chips = (id, list, key) => {
    const el = $(id);
    el.replaceChildren(...list.map((it, k) => h('button', { class: 'chip-btn' + (creatorState[key] === k ? ' on' : ''), title: it.name, 'aria-label': it.name, onclick: () => { creatorState[key] = k; audio.play('click'); chips(id, list, key); applyLook(); } })));
    [...el.children].forEach((b, k) => b.style.setProperty('--c', '#' + ((list[k].color ?? list[k].mul) >>> 0).toString(16).padStart(6, '0')));
  };
  chips('#cr-fur', FUR_SHIFT, 'fur'); chips('#cr-jacket', JACKETS, 'jacket'); chips('#cr-hoodie', HOODIES, 'hoodie');
  $('#cr-prev').onclick = () => { creatorState.i = (creatorState.i + SPECIES.length - 1) % SPECIES.length; audio.play('click'); show(); };
  $('#cr-next').onclick = () => { creatorState.i = (creatorState.i + 1) % SPECIES.length; audio.play('click'); show(); };
  $('#cr-go').onclick = () => {
    const name = (nameEl.value || '').trim().replace(/[^\p{L}\p{N} '\-]/gu, '').slice(0, 14);
    if (!name) { nameEl.focus(); UI.toast('Give your REAL a name.', 'warn'); return; }
    C.hidden = true; camera.clearViewOffset(); audio.play('good');
    const st = newState({ name, species: SPECIES[creatorState.i].id, outfit: { jacket: JACKETS[creatorState.jacket].color, hoodie: HOODIES[creatorState.hoodie].color, fur: FUR_SHIFT[creatorState.fur].mul } });
    st.wardrobe = [...new Set(['black', 'navy', JACKETS[creatorState.jacket].id])];
    if (preview) { scene.remove(preview.root); preview = null; }
    try { localStorage.setItem('real.save.v2', JSON.stringify(st)); } catch (e) {}
    startGame(st, true);
  };
  show();
}

// ------------------------------------------------------------------------------------------ game start
function applyA11y(st) { if (game) window.__playerName = game.state.name; window.__voiceOff = st.voices === false; window.__smartOff = st.smart === false; window.__micOff = st.mic === false; if (window.__voiceOff) Voice.stop(); document.body.classList.toggle('a11y-large', !!st.large); document.body.classList.toggle('a11y-contrast', !!st.contrast); document.body.classList.toggle('a11y-calm', !!st.calm); }
function startLoader(on, p, label) {
  const L = $('#loading'); if (!L) return;
  L.hidden = !on; if (on) progress(p, label);
}
let startWatch = null;
async function startGame(state, isNew) {
  mode = 'intro';
  startLoader(true, 0.1, 'Getting your REAL ready…');
  clearTimeout(startWatch);
  startWatch = setTimeout(() => {
    if (mode === 'intro') {
      const el = $('#load-label'); if (!el) return;
      el.replaceChildren(document.createTextNode('Still loading. A slow connection can take a minute. '));
      const b = document.createElement('button'); b.className = 'primary sm'; b.textContent = 'Reload'; b.onclick = () => location.reload(); el.appendChild(b);
    }
  }, 30000);
  try { await startGameInner(state, isNew); }
  catch (e) { console.error(e); fatal('REAL could not start: ' + (e && e.message || e) + '. Your character is saved. Tap Reload and choose Continue.'); }
  finally { clearTimeout(startWatch); startLoader(false); }
}
async function startGameInner(state, isNew) {
  const ch = new Character(await loadSpecies(state.species), { outfit: state.outfit });
  scene.add(ch.root);
  player = new Player(ch);
  input = new Input($('#view'));
  fcam = new FollowCamera(camera);
  window.__playerName = state.name;
  applyA11y(state.settings || {});
  game = new Game(state, {
    sfx: (n) => audio.play(n),
    enterApartment: (silent) => enterApartment(silent), exitApartment: () => exitApartment(),
    playerAnim: (n, secs) => playerAnim(n, secs), setOutfit: (o) => player.ch.setOutfit(o),
    npcExpr: (n, e) => npcs[n] && npcs[n].ch.expression(e, 3),
    jaxLeave: () => { if (npcs.Jax) npcs.Jax.hidden = true; },
    goToClub: () => invitation(),
    JACKETS, quality: () => engine.quality, setQuality: (q) => engine.setQuality(q),
    toggleSound: () => audio.toggle(), soundOn: () => audio.on, applyA11y: (st) => applyA11y(st),
    race: (trk, build, opts) => runMini('race', trk, build, opts), petRace: (p, care, tier) => runMini('pet', p, care, tier), robotRun: (lv, build, prog) => runMini('robot', lv, build, prog),
    travel: (loc) => travelTo(loc), enterBuilding: (loc, pt) => enterBuilding(loc, pt), refreshWorld: () => refreshWorld(), petTrick: () => { if (pet) pet.trick = 1; },
    DISTRICTS, HOMES, VEHICLES, PET_TYPES, WORK, CAREERS, COURSES,
    peers: () => (game.state.settings && game.state.settings.noNeighbors ? null : neighbors && neighbors.room ? neighbors.count : null), emote: (i) => { if (neighbors) neighbors.emote(i); player.ch.oneShot && player.ch.oneShot('Wave'); UI.toast(['👋', '🎉', '👍', '💡'][i], 'info', 1200); },
  });
  { const sc = schoolFromLink(); if (sc && !(state.school && state.school.on)) enableSchool(game, sc); }   // #school=CLASS in the link
  { const a = assignFromLink(); if (a && !(state.assign && state.assign.n === a.n)) setAssignment(game, a); }   // #assign=CODE in the link
  neighbors = new Neighbors(scene); if (!(state.settings && state.settings.noNeighbors)) neighbors.connect();
  input.onInteract = () => doInteract(); input.onPhone = () => phone();
  $('#btn-interact').onclick = () => doInteract(); $('#btn-phone').onclick = () => phone();
  $('#btn-sprint').onclick = (e) => { input.sprintLatch = !input.sprintLatch; e.currentTarget.classList.toggle('on', input.sprintLatch); };
  startLoader(true, 0.35, 'Meeting the residents…');
  await spawnStoryNPCs();
  if (state.chapter === 'prologue') { startLoader(true, 0.7, 'Opening The Club…'); await prologue(); return; }
  spawnAdventureNPCs();
  refreshWorld();
  if (state.location === 'apartment') await enterApartment(true);
  else if (state.location === 'interior' && state.room) { const r = state.room; state.room = null; if (DISTRICTS[r.loc]) await travelTo(r.loc, true); else { state.location = 'district'; setCitySpace(true); } player.pos = { ...r.door }; player.apply(); }
  else if (DISTRICTS[state.location]) { const pos = state.pos; await travelTo(state.location, true); if (pos) { player.pos = { ...pos }; player.heading = state.heading || 0; } }
  else if (state.pos) { player.pos = { ...state.pos }; player.heading = state.heading || 0; }
  else { player.pos = { ...WILD.start }; player.heading = 0; }
  player.apply();
  mode = 'play'; UI.showHUD(true);
}

const sock = (key, where = 'district') => W.data[where].sockets.find((s) => s.n === 'SOCKET_' + key);

async function spawnStoryNPCs() {
  const make = async (id, key, name, outfit) => {
    const s = sock(key); if (!s) return null;
    const ch = new Character(await loadSpecies(id), { outfit });
    scene.add(ch.root);
    const n = new StoryNPC(ch, s, name);
    coll.dynamic.push(n.collider);
    npcs[name] = n; return n;
  };
  await make('Cow', 'NPC_Manager_Idle', 'Rosa', { jacket: 0x1f6b35, hoodie: 0xf0b3c0 });
  const jax = await make('Jax', 'NPC_Jax_Hangout', 'Jax'); if (jax) jax.hidden = true;
  await make('Elephant', 'Door_CareerCenter', 'Counselor', { jacket: 0x13214a });
  await make('Dog', 'Door_CoffeeShop', 'Dee', { jacket: 0x0f5c5c, hoodie: 0xe6dccb });
  for (const k of ['Counselor', 'Dee']) { const n = npcs[k]; if (n) { n.pos.x += 1.6; n.collider.x = n.pos.x; n.ch.root.position.copy(P2W(n.pos.x, n.pos.y, 0.13)); } }
}
let advSpawned = false;
async function spawnAdventureNPCs() {
  if (advSpawned) return; advSpawned = true;
  try {
  for (const [id, A] of Object.entries(ADVENTURES)) if (A.npc.loc === 'district') {
    try { const ch = new Character(await loadSpecies(A.npc.species), { outfit: A.npc.outfit }); scene.add(ch.root); const n = new StoryNPC(ch, { x: A.npc.x, y: A.npc.y, r: 0, z: 0.13 }, A.npc.name, A.npc.role); n.advId = id; coll.dynamic.push(n.collider); npcs['adv:' + id] = n; n.mark = advMarker(); ch.root.add(n.mark); } catch (e) {}
  }
  } catch (e) { console.warn('adventure NPCs', e); }
}
function placeJax(x, y, facing) {
  const J = npcs.Jax; if (!J) return;
  J.pos.x = x; J.pos.y = y; J.collider.x = x; J.collider.y = y; J.ch.root.position.copy(P2W(x, y, 0.15)); J.hidden = false; if (facing !== undefined) J.facing = facing;
}

// ------------------------------------------------------------------------------------------ spaces
function setCitySpace(on) {
  for (const D of Object.values(W.d)) showDistrict(D, false);
  if (cart) cart.visible = on; for (const m of Object.values(W.built || {})) m.visible = on;
  W.district.visible = on; W.wild.group.visible = on; if (W.pools) W.pools.visible = on; W.ccSign.visible = on;
  for (const c of traffic.cars) c.m.visible = on;
  for (const p of peds) p.ch.root.visible = on && p.ch.root.visible;
  for (const n of Object.values(npcs)) n.ch.root.visible = on && !n.hidden;
}
function enterClubSpace() {
  if (!W.club) { W.club = buildClub(textures); scene.add(W.club.group); clubColl = new Collision([]); addColliders(clubColl, W.club.colliders); }
  W.club.group.visible = true; setCitySpace(false);
  if (W.apartment) W.apartment.visible = false;
  game.state.location = 'club';
}
function leaveClubSpace() {
  if (W.club) W.club.group.visible = false;
  for (const m of members) scene.remove(m.root); members = [];
  setCitySpace(true); game.state.location = 'district';
}
async function spawnMembers(withRep = true) {
  const looks = [['Lion', 0x14204a, 0xe9a93a, 6, 12], ['Horse', 0x0b0b0e, 0xe6dccb, -6, 14], ['Bird', 0x14204a, 0xe6dccb, -11, 22], ['Cat', 0x5a1020, 0xe9a93a, 11, 26], ['Elephant', 0x0b0b0e, 0xe9a93a, -12, 36], ['Dolphin', 0x14204a, 0xf0b3c0, 12, 40], ['Cow', 0x0b0b0e, 0xe6dccb, 6, 46]];
  for (const [sp, j, hd, x, y] of (isMobile ? looks.slice(0, 4) : looks)) {
    const c = new Character(await loadSpecies(sp), { outfit: { jacket: j, hoodie: hd } });
    c.root.position.copy(P2W(CLUB.ox + x, CLUB.oy + (y < 24 ? y + 10 : y), 0)); c.root.rotation.y = Math.random() * 6;   // grouped along the (shorter) walk to the Council c.play(Math.random() < 0.6 ? 'Talk' : 'Idle', 0);
    scene.add(c.root); members.push(c);
  }
  if (withRep) {
    const rep = new Character(await loadSpecies('Lion'), { outfit: { jacket: 0x0b0b0e, hoodie: 0xe9a93a } });
    rep.root.position.copy(P2W(CLUB.rep.x, CLUB.rep.y, 0)); rep.root.rotation.y = 0; rep.play('Idle', 0);
    scene.add(rep.root); members.push(rep); W.rep = rep;
  }
}

// ------------------------------------------------------------------------------------------ PROLOGUE — The life you didn't earn
async function prologue() {
  enterClubSpace();
  await spawnMembers(true);
  game.state.time = 19.0; game.state.quest = 'prologue_walk';
  player.pos = { ...CLUB.hallStart }; player.heading = 0; player.apply();
  fcam.yaw = 0; fcam.pitch = 0.22; fcam.cur.set(0, 1e4, 0);
  mode = 'play'; UI.showHUD(true); $('#hud').classList.add('prologue');
  await UI.caption(['THE CLUB.', 'Where money, power and big chances were part of every day.'], 2600);
  UI.toast('Drag the left side to move · drag the right side to look', 'info', 5000);
}
async function councilScene() {
  if (game.state.flags.council) return; game.state.flags.council = true;
  game.busy = true; input.enabled = false;
  await UI.fade(1, 500);
  player.pos = { ...CLUB.seat }; player.heading = 0; player.apply();
  fcam.mode = 'script';
  const shot = (cam, look) => { camera.position.copy(P2W(cam[0], cam[1], cam[2])); camera.lookAt(P2W(look[0], look[1], look[2])); };
  shot([CLUB.ox + 2.2, CLUB.seat.y - 2.6, 1.9], [CLUB.ox, CLUB.rep.y, 1.25]);
  await UI.fade(0, 500);
  const R = 'Council Representative';
  W.rep.play('Talk', 0.3);
  await UI.say(R, `${game.state.name}. Thank you for coming. Please, sit.`);
  await UI.say(R, 'Being in The Club comes with a responsibility. Knowing successful people is not enough.');
  await UI.say(R, 'A member must show four things: independence, responsibility, knowledge and achievement. You enjoyed The Club, but you never built those things yourself.');
  shot([CLUB.ox + 3.4, CLUB.rep.y - 1.2, 1.75], [CLUB.ox, CLUB.rep.y, 1.3]);
  W.rep.expression('Focused', 6);
  await UI.say(R, 'You have seen what success looks like. But do you know what it takes?');
  shot([CLUB.ox + 1.4, CLUB.seat.y + 1.6, 1.4], [CLUB.ox, CLUB.seat.y, 1.15]);
  player.ch.expression('Surprised', 4);
  const c = await UI.say(game.state.name, '…', ['But I belong here.', 'What did I do wrong?', 'What happens now?']);
  shot([CLUB.ox + 3.4, CLUB.rep.y - 1.2, 1.75], [CLUB.ox, CLUB.rep.y, 1.3]);
  await UI.say(R, ['Belonging isn’t something you are handed. It is something you build.', 'Nothing wrong. Nothing at all. That is the problem. You never had to do anything.', 'Your special pass ends tonight.'][c]);
  await UI.say(R, 'You can come back one day. First, show that you can build a good life on your own.');
  // card revoked
  player.ch.expression('Sad', 6);
  const card = h('div', { class: 'clubcard' }, h('div', { class: 'cc-top' }, h('span', {}, '♛'), h('b', {}, 'THE CLUB')), h('div', { class: 'cc-name' }, game.state.name.toUpperCase()), h('div', { class: 'cc-num' }, 'MEMBER · 0047-REAL'), h('div', { class: 'cc-stamp' }, 'ACCESS REVOKED'));
  document.getElementById('root').append(card);
  audio.play('bad');
  await wait(2600); card.classList.add('out'); await wait(500); card.remove();
  await UI.say(R, 'Your access card. Your accounts. Everything connected to The Club. Security will see you out.');
  // escorted out — the gates close
  await UI.fade(1, 700);
  W.rep.play('Idle', 0);
  player.pos = { ...CLUB.gateOut }; player.heading = Math.PI; player.apply();
  setGate(W.club.gate, 1);
  camera.position.copy(P2W(CLUB.ox + 3, CLUB.gateOut.y - 7, 2.2)); camera.lookAt(P2W(CLUB.ox, CLUB.oy - 22, 2.2));
  game.state.time = 21.0;
  await UI.fade(0, 700);
  const t0 = performance.now();
  await new Promise((res) => { const step = () => { const k = Math.min(1, (performance.now() - t0) / 3200); setGate(W.club.gate, 1 - k); if (k < 1) requestAnimationFrame(step); else res(); }; step(); });
  audio.play('door');
  await UI.caption(['The gates close behind you.'], 2400);
  await UI.fade(1, 1200);
  await UI.caption(['…'], 1200);
  game.busy = false; input.enabled = true;
  await startWilderness();
}

// ------------------------------------------------------------------------------------------ CHAPTER 1 — Nowhere
async function startWilderness() {
  setTimeout(() => spawnAdventureNPCs(), 4000);
  const s = game.state;
  leaveClubSpace();
  $('#hud').classList.remove('prologue');
  s.chapter = 'nowhere'; s.quest = 'find_way'; s.location = 'district'; s.time = 6.0;
  player.pos = { ...WILD.start }; player.heading = 0; player.h = wildHeight(WILD.start.x, WILD.start.y); player.apply();
  player.ch.expression('Worried', 5);
  fcam.mode = 'follow'; fcam.yaw = 0; fcam.pitch = 0.16; fcam.dist = 5.5; fcam.cur.set(0, 1e4, 0);
  game.save();
  await UI.fade(0, 2200);
  await UI.caption(['Nowhere.', 'No house. No car. No job. No one to tell you where to go.', 'Just you, the clothes you’re wearing, and a city on the horizon.'], 2600);
  mode = 'play'; UI.showHUD(true);
}

// ------------------------------------------------------------------------------------------ CHAPTERS 11–12 — The Invitation, the REAL decision, the epilogue
async function invitation() {
  const s = game.state;
  game.busy = true; input.enabled = false;
  await UI.fade(1, 700);
  enterClubSpace();
  await spawnMembers(true);
  setGate(W.club.gate, 0);
  s.time = 18.4;
  player.pos = { ...CLUB.gateOut }; player.heading = 0; player.apply();
  fcam.mode = 'script';
  camera.position.copy(P2W(CLUB.ox - 2.5, CLUB.gateOut.y - 6, 2.0)); camera.lookAt(P2W(CLUB.ox, CLUB.oy - 22, 2.4));
  await UI.fade(0, 900);
  await UI.caption(['The same gates that once closed behind you…'], 2200);
  const t0 = performance.now();
  await new Promise((res) => { const step = () => { const k = Math.min(1, (performance.now() - t0) / 3000); setGate(W.club.gate, k); if (k < 1) requestAnimationFrame(step); else res(); }; step(); });
  await UI.caption(['…now stand open.'], 1800);
  await UI.fade(1, 600);
  player.pos = { ...CLUB.seat }; player.apply();
  camera.position.copy(P2W(CLUB.ox + 3.4, CLUB.rep.y - 1.2, 1.75)); camera.lookAt(P2W(CLUB.ox, CLUB.rep.y, 1.3));
  await UI.fade(0, 600);
  const R = 'Council Representative';
  W.rep.play('Talk', 0.3); W.rep.expression('Happy', 6);
  await UI.say(R, `${s.name}. You’ve accomplished what we asked. You’ve proven that you can build a life of your own.`);
  const ll = game.life();
  await UI.say(R, `A job you earned. Bills you paid. Skills you mastered: ${game.edu.masteredCount()} of them. Life Level ${ll.level}. We are offering you membership.`);
  camera.position.copy(P2W(CLUB.ox + 1.4, CLUB.seat.y + 1.6, 1.4)); camera.lookAt(P2W(CLUB.ox, CLUB.seat.y, 1.15));
  await UI.caption(['You remember the empty road.', 'The first apartment. The first grocery trip.', 'The first paycheck. The first mistake.'], 2200);
  const c = await UI.say(s.name, 'What will you do?', ['Accept: return to The Club, through my own accomplishments', 'Decline: the life I built is already meaningful', 'Rebuild: open a pathway for people who are starting with nothing'], { crown: false });
  const kind = ['return', 'reject', 'rebuild'][c];
  camera.position.copy(P2W(CLUB.ox + 3.4, CLUB.rep.y - 1.2, 1.75)); camera.lookAt(P2W(CLUB.ox, CLUB.rep.y, 1.3));
  await UI.say(R, {
    return: 'Welcome back. This time, the door opened because of you.',
    reject: 'Few people have ever said no to us. Perhaps that is the clearest proof you no longer need us.',
    rebuild: (game.state.friends.Rosa + game.state.friends.Okafor + game.state.friends.Jax) >= 4 ? 'Rosa, Mr. Okafor, even Jax spoke for you. The Council will fund your mentorship network. Let’s change who gets a chance.' : 'Bold. The Council will listen. Build your network of mentors, and we will help it grow.',
  }[kind]);
  s.ending = kind; game.achieve('ending');
  await UI.fade(1, 900);
  for (const l of [game.endingText(kind)]) await UI.caption(l, 2600);
  // EPILOGUE — the empty road
  leaveClubSpace();
  s.quest = 'free'; s.time = 18.6;
  player.pos = { x: WILD.start.x, y: WILD.start.y + 4 }; player.heading = 0; player.h = wildHeight(player.pos.x, player.pos.y); player.apply();
  fcam.mode = 'follow'; fcam.yaw = 0; fcam.pitch = 0.12; fcam.dist = 6; fcam.cur.set(0, 1e4, 0);
  await UI.fade(0, 2000);
  await UI.caption(['The same empty landscape. The same road. The same skyline.', 'But you see it differently now.'], 2800);
  await UI.caption(['You started with nothing.', 'But you were never nothing.', 'Look at what you’ve built.'], 2600);
  await UI.caption(['REAL', 'LEARN • LIVE • GROW', 'YOUR STORY. YOUR FUTURE. REAL.'], 2600);
  game.busy = false; input.enabled = true; game.save();
  UI.toast('Your story continues. The city is yours to keep building.', 'gold', 5000);
}

// ------------------------------------------------------------------------------------------ apartment
// ------------------------------------------------------------------------------------------ Chapter 7: the bigger world
function showDistrict(D, on) {
  D.group.visible = on;
  for (const p of D.peds) p.ch.root.visible = on && p.ch.root.visible;
  for (const f of D.friends) f.ch.root.visible = on;
}
async function ensureDistrict(id) {
  if (W.d[id]) return W.d[id];
  UI.toast(`Arriving in ${DISTRICTS[id].name}…`, 'info', 1500);
  await wait(30);
  const D = buildDistrict(id, textures);
  D.coll = new Collision(D.colliders); D.peds = []; D.friends = [];
  D.pools = makeLightPools(D.lamps); D.group.add(D.pools);
  try { const fl = scatterFlora(D.group, { tufts: isMobile ? 1500 : 2500, flowers: isMobile ? 300 : 500, seed: id.length * 7 }); if (fl) D.group.add(fl); } catch (e) { console.warn('flora off', e); }
  scene.add(D.group); W.d[id] = D;
  const pk = (a) => a[Math.floor(Math.random() * a.length)];
  for (let i = 0; i < (isMobile ? 6 : 10); i++) {
    const sp = SPECIES[(i * 3 + id.length) % SPECIES.length].id;
    try { const ch = new Character(await loadSpecies(sp), { outfit: { jacket: pk(JACKETS).color, hoodie: pk(HOODIES).color } }); scene.add(ch.root); const p = new Pedestrian(ch, D.routes[i % D.routes.length]); D.coll.dynamic.push(p.collider); D.peds.push(p); } catch (e) {}
  }
  for (const [aid, A] of Object.entries(ADVENTURES)) if (A.npc.loc === id) {
    try { const ch = new Character(await loadSpecies(A.npc.species), { outfit: A.npc.outfit }); scene.add(ch.root); const n = new StoryNPC(ch, { x: DISTRICTS[id].ox + A.npc.x, y: A.npc.y, r: A.npc.x > 0 ? Math.PI / 2 : -Math.PI / 2, z: 0.13 }, A.npc.name, A.npc.role); n.advId = aid; D.coll.dynamic.push(n.collider); n.mark = advMarker(); ch.root.add(n.mark); D.friends.push(n); } catch (e) {}
  }
  for (const f of DISTRICTS[id].friends) {
    try { const ch = new Character(await loadSpecies(f.species), { outfit: f.outfit }); scene.add(ch.root); const n = new StoryNPC(ch, { x: DISTRICTS[id].ox + f.x, y: f.y, r: f.x > 0 ? Math.PI / 2 : -Math.PI / 2, z: 0.13 }, f.id, f.role); D.coll.dynamic.push(n.collider); D.friends.push(n); } catch (e) {}
  }
  return D;
}
// ------------------------------------------------------------------------------------------ walk-in interiors
const ROOM_KEYS = Object.keys(BUILDING_ROOMS);
async function ensureRoom(key, name) {
  if (W.rooms[key]) return W.rooms[key];
  const R = buildInterior(key, name, 20000 + ROOM_KEYS.indexOf(key) * 40, textures);
  R.coll = new Collision(R.colliders); scene.add(R.group); R.group.visible = false;
  try { const ch = new Character(await loadSpecies(R.staff), { outfit: { jacket: BUILDING_ROOMS[key][4], hoodie: 0xe6dccb } }); scene.add(ch.root); R.npc = new StoryNPC(ch, { x: R.staffPos.x, y: R.staffPos.y, r: 0, z: 0 }, 'Staff'); R.npc.h = 0; ch.root.position.y = 0; R.coll.dynamic.push(R.npc.collider); } catch (e) {}
  W.rooms[key] = R; return R;
}
function hideRooms() { for (const R of Object.values(W.rooms)) { R.group.visible = false; if (R.npc) R.npc.ch.root.visible = false; } }
async function enterBuilding(loc, pt) {
  const s = game.state, name = (pt.sign || pt.label || '').replace(/\b(\w)(\w*)/g, (m, a, b) => a + b.toUpperCase() === m ? a + b.toLowerCase() : m);
  audio.play('door'); await UI.fade(1, 300);
  const key = pt.room || pt.key;
  let R;
  try { R = await ensureRoom(key, (pt.sign || pt.label || key).toUpperCase()); }
  catch (e) { console.error('room', key, e); await UI.fade(0, 300); UI.toast('This building is closed right now.', 'warn'); return; }
  s.room = { loc, key, door: { x: player.pos.x, y: player.pos.y }, sign: pt.sign || pt.label, doorKey: pt.doorKey || null, heading: player.heading };
  if (loc === 'district') setCitySpace(false); else if (W.d[loc]) showDistrict(W.d[loc], false);
  if (myCar) myCar.visible = false;
  hideRooms(); R.group.visible = true; if (R.npc) R.npc.ch.root.visible = true;
  s.location = 'interior';
  player.pos = { ...R.spawn }; player.heading = 0; player.h = 0; player.apply(); fcam.yaw = 0; fcam.pitch = 0.28;
  if (pet) pet.place(player.pos);
  await UI.fade(0, 300);
  s.stats.placesVisited = (s.stats.placesVisited || 0) + (s.flags['in_' + key] ? 0 : 1); s.flags['in_' + key] = true;
}
async function leaveBuilding() {
  const s = game.state, r = s.room; if (!r) return;
  audio.play('door'); await UI.fade(1, 300);
  hideRooms();
  if (r.loc === 'district') setCitySpace(true); else { const D = await ensureDistrict(r.loc); setCitySpace(false); showDistrict(D, true); }
  s.location = r.loc;
  player.pos = { x: r.door.x, y: r.door.y }; player.heading = (r.heading || 0) + Math.PI; player.h = 0.13; player.apply(); fcam.yaw = -player.heading;
  if (pet) pet.place(player.pos);
  s.room = null; placeCar();
  await UI.fade(0, 300); game.save();
}
const curRoom = () => game.state.location === 'interior' && game.state.room ? W.rooms[game.state.room.key] : null;

async function travelTo(loc, silent) {
  if (!silent) { audio.play('door'); await UI.fade(1, 400); }
  if (W.apartment) W.apartment.visible = false;
  hideRooms();
  const s = game.state; s.room = null;
  if (loc === 'district') {
    setCitySpace(true); s.location = 'district';
    const b = sock('Interact_BusStop'); player.pos = { x: b.x - 1.2, y: b.y + 1.6 }; player.heading = 0;
  } else {
    const D = await ensureDistrict(loc);
    setCitySpace(false); showDistrict(D, true); s.location = loc;
    player.pos = { ...D.spawn }; player.heading = 0;
  }
  player.h = 0.13; player.apply(); fcam.yaw = 0;
  placeCar(); if (pet) pet.place(player.pos);
  if (!silent) await UI.fade(0, 400);
  game.save();
}
function placeCar() {
  const s = game.state;
  if (myCar) { scene.remove(myCar); myCar = null; }
  if (!s.vehicle || s.vehicle.type === 'bike' || s.location === 'apartment' || s.location === 'club') return;
  myCar = carMesh(s.vehicle.type === 'car' ? 0x2f8f5a : 0xe8a33a, false);
  if (s.vehicle.type === 'scooter') myCar.scale.set(0.45, 0.9, 0.5);
  const D = W.d[s.location];
  const at = D ? { x: D.spawn.x - 3.4, y: D.spawn.y + 5 } : { x: sock('Interact_BusStop').x - 9, y: -3.2 };
  myCar.position.copy(P2W(at.x, at.y, 0)); myCar.rotation.y = D ? 0 : Math.PI / 2; scene.add(myCar);
}
function advMarker() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.fillStyle = '#e8a33a'; g.beginPath(); g.arc(64, 64, 54, 0, Math.PI * 2); g.fill(); g.fillStyle = '#14204a'; g.font = 'bold 92px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('!', 64, 70);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false })); sp.scale.set(0.55, 0.55, 1); sp.position.y = 2.45; sp.renderOrder = 6; return sp;
}
const BUILT_AT = { bench: [24, -20], playground: [56, -22], shed: [62, -64] };
function builtMesh(key) {
  const g = new THREE.Group(), wood = new THREE.MeshStandardMaterial({ color: 0x8a5a3a, roughness: 0.7 }), metal = new THREE.MeshStandardMaterial({ color: 0x2a5bd2, roughness: 0.4, metalness: 0.5 }), red = new THREE.MeshStandardMaterial({ color: 0xd23b2a, roughness: 0.6 }), y = new THREE.MeshStandardMaterial({ color: 0xe8b23a, roughness: 0.6 });
  const b = (w, hh, d, m, x, yy, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), m); o.position.set(x, yy, z); o.castShadow = true; g.add(o); return o; };
  if (key === 'bench') { b(2.2, 0.08, 0.5, wood, 0, 0.48, 0); b(2.2, 0.5, 0.06, wood, 0, 0.8, -0.24); for (const x of [-0.9, 0.9]) b(0.08, 0.48, 0.5, metal, x, 0.24, 0); }
  if (key === 'playground') { b(3, 0.2, 3, wood, 0, 1.8, 0); for (const x of [-1.4, 1.4]) for (const z of [-1.4, 1.4]) b(0.15, 1.9, 0.15, metal, x, 0.95, z); const sl = b(0.9, 0.08, 3.6, y, 2.6, 0.95, 0); sl.rotation.x = 0; sl.rotation.z = -0.5; b(0.1, 1.8, 0.1, red, -1.4, 2.7, -1.4); const roof = new THREE.Mesh(new THREE.ConeGeometry(2.3, 1.2, 4), red); roof.position.y = 3.3; roof.rotation.y = Math.PI / 4; g.add(roof); for (let k = 0; k < 3; k++) { const sw = b(0.5, 0.06, 0.25, y, -3.2 + k * 0.9, 0.6, 2.4); } b(3.2, 0.1, 0.1, metal, -2.3, 2.1, 2.4); }
  if (key === 'shed') { b(3, 2.2, 2.4, wood, 0, 1.1, 0); const roof = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1, 4), red); roof.position.y = 2.7; roof.rotation.y = Math.PI / 4; g.add(roof); b(0.9, 1.8, 0.05, y, 0, 0.9, 1.22); }
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.4), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture((() => { const c = document.createElement('canvas'); c.width = 512; c.height = 128; const x = c.getContext('2d'); x.fillStyle = '#1f6b35'; x.fillRect(0, 0, 512, 128); x.fillStyle = '#fff'; x.font = 'bold 44px Arial'; x.textAlign = 'center'; x.fillText('Built by ' + (game.state.name || 'you'), 256, 80); return c; })()) }));
  sign.position.set(0, 0.5, key === 'bench' ? 0.6 : 2.2); g.add(sign);
  return g;
}

// ------------------------------------------------------------------------------------------ minigames (race, pet agility, robot arena)
function hideForMini(on) {
  const s = game.state;
  if (on) { W.prevVis = { apt: W.apartment && W.apartment.visible }; setCitySpace(false); hideRooms(); if (W.apartment) W.apartment.visible = false; }
  else {
    if (s.location === 'apartment' && W.apartment) W.apartment.visible = true;
    else if (s.location === 'interior') { const R = curRoom(); if (R) { R.group.visible = true; if (R.npc) R.npc.ch.root.visible = true; } }
    else if (W.d[s.location]) { setCitySpace(false); showDistrict(W.d[s.location], true); }
    else setCitySpace(true);
  }
  player.ch.root.visible = !on; if (pet) pet.m.visible = !on; if (companion) companion.visible = !on && !(s.companion && s.companion.hidden); if (myCar) myCar.visible = !on; if (beacon) beacon.visible = false;
}
function miniHud(kind) {
  let el = document.getElementById('minihud');
  if (!el) { el = document.createElement('div'); el.id = 'minihud'; document.body.appendChild(el); }
  el.className = 'minihud ' + kind; el.hidden = false;
  el.innerHTML = '<div class="mh-top"><b class="mh-a"></b><b class="mh-b"></b><b class="mh-c"></b></div><div class="mh-count"></div><div class="mh-tip"></div>' +
    (kind === 'race' ? '<button class="mh-brake">BRAKE</button><button class="mh-gas">GAS</button>' : '') + (kind === 'pet' ? '<button class="mh-cue">Cue!</button>' : '');
  const hold = (sel, key) => { const b = el.querySelector(sel); if (!b) return; const on = (e) => { e.preventDefault(); race[key] = 1; }, off = () => { race[key] = 0; }; b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off); };
  hold('.mh-gas', 'gas'); hold('.mh-brake', 'brake');
  const cue = el.querySelector('.mh-cue'); if (cue) cue.onclick = () => { if (petCourse.cue()) audio.play('good'); };
  return el;
}
async function runMini(kind, a, b, c) {
  const s = game.state;
  await UI.fade(1, 350);
  hideForMini(true); UI.showHUD(false); mode = 'mini'; input.enabled = true;
  const el = miniHud(kind), q = (k) => el.querySelector(k);
  let res;
  const start = () => {
    if (kind === 'race') {
      race = race || new Race(scene, textures);
      const hud = (d) => { q('.mh-a').textContent = `LAP ${d.lap}/${d.laps}`; q('.mh-b').textContent = `POS ${d.pos}/${d.of}`; q('.mh-c').textContent = `${d.kmh} km/h`; q('.mh-count').textContent = d.count; q('.mh-tip').textContent = d.slide ? 'Sliding! Ease off the steering' : d.off ? 'Off the track!' : d.dirt ? 'Dirt section' : ''; };
      const p = race.start(a, b, input, camera, hud, c && c.laps);
      mini = race; return p;
    }
    if (kind === 'pet') {
      petCourse = petCourse || new PetCourse(scene);
      const tier = c || 0, rivals = [['Dash', 'puppy', 0xc98a4a], ['Mochi', 'kitten', 0x8a8d96], ['Bun', 'bunny', 0xf1ece4]].map(([n, t, col], i) => ({ name: n, type: t, color: col, speed: 6.4 + tier * 0.6 + i * 0.25 }));
      const hud = (d) => { q('.mh-a').textContent = `${b >= 1 ? 'Happy & healthy' : 'Needs care'}`; q('.mh-b').textContent = `POS ${d.pos}/${d.of}`; q('.mh-c').textContent = ''; q('.mh-count').textContent = d.count; const cb = q('.mh-cue'); cb.textContent = d.cue || 'Cue!'; cb.classList.toggle('ready', !!d.cue); q('.mh-tip').textContent = d.cue ? `Tap “${d.cue}” now!` : ''; };
      const p = petCourse.start(a, b, rivals, camera, hud); mini = petCourse; return p;
    }
    if (kind === 'robot') {
      arena = arena || new RobotArena(scene);
      const hud = (d) => { q('.mh-a').textContent = `STEP ${Math.min(d.step + 1, d.prog.length)}/${d.prog.length}`; q('.mh-b').textContent = `⚡ ${Math.max(0, d.energy).toFixed(1)}/${d.energy0}`; q('.mh-c').textContent = ''; };
      mini = { update: () => arena.g ? P2W(-10000 + 4.4, 4.4, 0) : null }; return arena.run(a, b, c, camera, hud);
    }
  };
  const p = start();
  await UI.fade(0, 350);
  res = await p;
  await UI.fade(1, 350);
  el.hidden = true; mini = null; mode = 'play'; hideForMini(false); UI.showHUD(true); fcam.cur.set(0, 1e4, 0);
  await UI.fade(0, 350);
  return res;
}

function refreshWorld() {
  const s = game.state;
  W.built = W.built || {};
  for (const k of s.built || []) if (!W.built[k]) { const m = builtMesh(k); const [x, y] = BUILT_AT[k]; m.position.copy(P2W(x, y, 0.13)); scene.add(m); W.built[k] = m; coll.items.push({ t: 'circle', x, y, r: k === 'bench' ? 1.1 : 2.2, cos: 1, sin: 0, n: 'built' }); }
  for (const m of Object.values(W.built)) m.visible = s.location === 'district';
  if (s.biz && !cart) {
    cart = new THREE.Group();
    const wood = new THREE.MeshStandardMaterial({ color: 0x7a5230, roughness: 0.7 }), cloth = new THREE.MeshStandardMaterial({ color: 0x2f8f5a, roughness: 0.8 }), metal = new THREE.MeshStandardMaterial({ color: 0xcfd3d8, metalness: 0.8, roughness: 0.3 });
    const b = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.0, 0.9), wood); b.position.y = 0.75; cart.add(b);
    const top = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 1.4), cloth); top.position.y = 2.3; top.rotation.z = 0.08; cart.add(top);
    for (const x of [-0.9, 0.9]) { const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.1, 8), metal); pl.position.set(x, 1.8, 0.4); cart.add(pl); const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.08, 16), metal); wh.rotation.x = Math.PI / 2; wh.position.set(x * 0.7, 0.25, 0.48); cart.add(wh); }
    const tex = new THREE.CanvasTexture((() => { const c = document.createElement('canvas'); c.width = 512; c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#1f6b35'; g.fillRect(0, 0, 512, 128); g.fillStyle = '#fff'; g.font = 'bold 54px Arial'; g.textAlign = 'center'; g.fillText(s.biz.name.toUpperCase().slice(0, 22), 256, 82); return c; })());
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.42), new THREE.MeshStandardMaterial({ map: tex })); sign.position.set(0, 0.8, 0.46); cart.add(sign);
    cart.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    W.cartPos = { x: 38, y: -25 }; cart.position.copy(P2W(38, -25, 0.13)); scene.add(cart);
    coll.items.push({ t: 'box', x: 38, y: -25, hx: 1, hy: 0.6, r: 0, cos: 1, sin: 0, n: 'cart' });
    cart.visible = s.location === 'district';
  }
  if (s.pet && !pet) { const m = makePet(s.pet.type, PET_TYPES[s.pet.type].color); scene.add(m); pet = new PetFollower(m); pet.place(player.pos); }
  if (companion && (!s.companion || s.companion.kind !== companion.userData.kind)) { scene.remove(companion); companion = null; }
  if (s.companion && !companion) { companion = makeCompanion(s.companion.kind); companion.userData.kind = s.companion.kind; scene.add(companion); }
  if (companion) companion.visible = !s.companion.hidden;
  placeCar();
}

async function enterApartment(silent) {
  if (!silent) { audio.play('door'); await UI.fade(1, 350); }
  if (!W.apartment) {
    const g = await loadGLB('assets/apartment.glb.gz');
    W.apartment = mergeStatic(g.scene, textures, 100);
    W.apartment.position.set(0, -500, 0);
    const lights = new THREE.Group();
    for (const [x, y, z, i, c] of [[0.5, 3.2, 2.6, 30, 0xffe2b8], [-2, 4.3, 2.6, 22, 0xffe2b8], [3.6, 5.7, 1.6, 14, 0xffb070], [-2.9, 1.1, 2.6, 12, 0xf0f4ff]]) { const l = new THREE.PointLight(c, i, 9, 1.6); l.position.copy(P2W(x, y, z)); lights.add(l); }
    W.apartment.add(lights); scene.add(W.apartment);
    aptColl = new Collision(W.data.apartment.colliders);
  }
  W.apartment.visible = true; setCitySpace(false); hideRooms(); game.state.room = null;
  game.state.location = 'apartment'; placeCar();
  if (W.homeDecor) W.homeDecor.visible = true; homeDecor();
  const sp = sock('Spawn_PlayerHome', 'apartment');
  player.pos = { x: sp.x, y: sp.y + 0.6 }; player.heading = 0; player.h = 0; player.apply();
  if (!silent) await UI.fade(0, 350);
  game.save();
}
function homeDecor() {
  const s = game.state, lvl = { loft: 1, heights: 2, owned: 3 }[s.home] || 0;
  if (W.homeDecor && W.homeDecor.userData.lvl === lvl) return;
  if (W.homeDecor) W.apartment.remove(W.homeDecor);
  const g = new THREE.Group(); g.userData.lvl = lvl;
  const pot = new THREE.MeshStandardMaterial({ color: 0xc46a3a, roughness: 0.8 }), leaf = new THREE.MeshStandardMaterial({ color: 0x3d7a34, roughness: 0.9 }), gold = new THREE.MeshStandardMaterial({ color: 0xe0a83a, metalness: 1, roughness: 0.3 });
  const spots = [[-3.2, 0.9], [3.3, 4.4], [-3.3, 5.4], [2.9, 0.6]];
  for (let i = 0; i < Math.min(4, lvl * 2); i++) { const [x, y] = spots[i]; const p = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.35, 12), pot); p.position.copy(P2W(x, y, 0.17)); g.add(p); const l = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 1), leaf); l.position.copy(P2W(x, y, 0.62)); g.add(l); }
  if (lvl >= 1) { const rug = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.02, 1.4), new THREE.MeshStandardMaterial({ color: lvl >= 2 ? 0x5a1020 : 0x2a5bd2, roughness: 1 })); rug.position.copy(P2W(0.4, 3.0, 0.01)); g.add(rug); }
  if (lvl >= 2) for (const y of [2.2, 4.4]) { const art = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.6, 0.8), gold); art.position.copy(P2W(-3.9, y, 1.7)); g.add(art); }
  W.homeDecor = g; W.apartment.add(g);
}
async function exitApartment() {
  const H = HOMES[game.state.home || 'starter'];
  if (H.district !== 'district') {
    await travelTo(H.district);
    const pt = W.d[H.district].points.find((p) => p.key === H.door); if (pt) { player.pos = { x: pt.x, y: pt.y - 1.5 }; player.apply(); if (pet) pet.place(player.pos); }
    return;
  }
  audio.play('door'); await UI.fade(1, 350);
  W.apartment.visible = false; setCitySpace(true);
  game.state.location = 'district';
  const d = sock('Door_ApartmentLobby');
  player.pos = { x: d.x, y: d.y - 1.2 }; player.heading = Math.PI; player.h = 0.13; player.apply(); fcam.yaw = Math.PI;
  await UI.fade(0, 350);
  game.save();
}

// ------------------------------------------------------------------------------------------ interactions
let nearest = null;
const near = (o, r) => o && Math.hypot(o.x - player.pos.x, o.y - player.pos.y) < r;
function findInteraction() {
  const s = game.state, where = s.location, P = player.pos;
  if (where === 'club') return null;
  let best = null, bd = 1e9;
  const IR = curRoom();
  if (IR) {
    for (const pt of IR.points) { const d = Math.hypot(pt.x - P.x, pt.y - P.y); if (d < (pt.act === 'counter' ? 2.0 : 1.9) && d < bd) { bd = d;
      const r = s.room;
      if (pt.act === 'exit') best = { label: 'Go outside', run: () => leaveBuilding() };
      else if (pt.act === 'counter') best = r.doorKey ? (() => { const it = game.interaction({ key: r.doorKey }); return it ? { label: it.label, run: it.run, npc: IR.npc } : null; })() : { label: `Talk to the staff`, run: () => game.buildingCounter(r.loc, { key: r.key, sign: r.sign }), npc: IR.npc };
      else best = { label: pt.label, run: () => game.station(pt.act, r.loc, r.doorKey || r.key) };
    } }
    if (!best && pet && near(pet.pos, 1.6)) best = { label: `Play with ${s.pet.name}`, run: () => game.petCare('play') };
    return best;
  }
  const D = W.d[where];
  if (D) {
    for (const pt of D.points) { const d = Math.hypot(pt.x - P.x, pt.y - P.y); if (d < 2.6 && d < bd) { const it = game.districtInteraction(where, pt); if (it) { best = it; bd = d; } } }
    for (const f of D.friends) if (near(f.pos, 2.4)) best = f.advId ? { label: `Talk to ${f.name}`, run: () => game.advTalk(f.advId), npc: f } : { label: `Talk to ${f.name}`, run: () => game.talkFriend(f.name, f.role), npc: f };
    const M = s.mission; if (M && M.loc === where && near({ x: D.def.ox + M.x, y: M.y }, 2.4)) best = { label: M.label, run: () => game.missionArrive() };
    if (!best && pet && near(pet.pos, 2)) best = { label: `Play with ${s.pet.name}`, run: () => game.petCare('play') };
    return best;
  }
  for (const so of W.data[where].sockets) {
    if (!/^SOCKET_(Interact|Door)_/.test(so.n)) continue;
    const d = Math.hypot(so.x - P.x, so.y - P.y);
    const reach = /Door_/.test(so.n) ? 2.6 : /StockShelf/.test(so.n) ? 2.4 : 1.9;
    if (d > reach || d > bd) continue;
    const k = so.n.replace('SOCKET_', '');
    let it = game.interaction({ ...so, key: k });
    if (it && BUILDING_ROOMS[k] && s.flags.housed && !(k === 'Door_Clothing' && s.flags.bannedClothing && s.day < s.flags.bannedClothing)) { const lbl = it.label; it = { label: 'Enter ' + lbl, run: () => enterBuilding('district', { room: k, doorKey: k, sign: lbl.toUpperCase(), label: lbl }) }; }
    if (it) { best = it; bd = d; }
  }
  if (where !== 'district') return best || (pet && near(pet.pos, 1.8) ? { label: `Play with ${s.pet.name}`, run: () => game.petCare('play') } : null);
  if (cart && W.cartPos && near(W.cartPos, 2.4)) best = { label: `Run ${s.biz.name}`, run: () => game.runBusiness() };
  for (const sg of W.wild.signs) if (sg.q && near(sg, 3.2)) best = { label: 'Read the sign', run: () => game.readSign(sg) };
  if (s.quest === 'shift' && s.shift && s.shift.register >= s.shift.need.register && s.shift.stock < s.shift.need.stock) {
    for (let a = 1; a <= 5; a++) { const so = sock(`Interact_StockShelf_A${a}`); if (so && Math.abs(P.x - so.x) < 1.8 && P.y > 30 && P.y < 42) { const it = game.interaction({ key: `Interact_StockShelf_A${a}` }); if (it) best = it; } }
  }
  if (near(npcs.Rosa && npcs.Rosa.pos, 2.4)) best = { label: s.quest === 'job' ? 'Ask about the job' : 'Talk to Rosa', run: () => game.talkManager(), npc: npcs.Rosa };
  const jax = npcs.Jax;
  if (jax && !jax.hidden && near(jax.pos, 2.8)) {
    if (s.quest === 'jax1') best = { label: 'Talk to Jax', run: () => game.jax1(), npc: jax };
    else if (s.flags.jaxStealDue && !s.flags.jaxSteal) best = { label: 'Talk to Jax', run: () => game.jaxSteal(), npc: jax };
    else if (s.flags.jax3due && !s.flags.jax3) best = { label: 'Talk to Jax', run: () => game.jax3(), npc: jax };
  }
  if (near(npcs.Counselor && npcs.Counselor.pos, 2.4)) best = s.flags.housed ? { label: 'Talk to Mr. Okafor', run: () => game.counselor(), npc: npcs.Counselor } : { label: 'Ask for help', run: () => game.housing(), npc: npcs.Counselor };
  if (near(npcs.Dee && npcs.Dee.pos, 2)) best = best || { label: 'Talk to Dee', run: () => askNPC(game, { name: 'Dee' }), npc: npcs.Dee };
  for (const n of Object.values(npcs)) if (n.advId && !n.hidden && near(n.pos, 2.4)) best = { label: `Talk to ${n.name}`, run: () => game.advTalk(n.advId), npc: n };
  if (s.mission && s.mission.loc === 'district' && near(s.mission, 2.6)) best = { label: s.mission.label, run: () => game.missionArrive() };
  if (!best && pet && near(pet.pos, 1.8)) best = { label: `Play with ${s.pet.name}`, run: () => game.petCare('play') };
  return best;
}
const pick = (a) => a[Math.floor(Math.random() * a.length)];
function faceNPC(n) {
  if (!n) return;
  const dx = n.pos.x - player.pos.x, dy = n.pos.y - player.pos.y;
  player.heading = Math.atan2(dx, dy); player.apply();
  fcam.yaw = -player.heading + 0.45; fcam.pitch = 0.18; fcam.dist = Math.min(fcam.dist, 4.2);
}
async function doInteract() {
  if (mode !== 'play' || busy() || !nearest) return;
  audio.play('click');
  if (nearest.npc) faceNPC(nearest.npc);
  game.busy = true; input.enabled = false; UI.interact(null);
  try { await nearest.run(); } finally { game.busy = false; input.enabled = true; }
}
const busy = () => game.busy || UI.anySheet() || !$('#dialog').hidden;
function openMap() {
  if (!game || mode !== 'play' || busy() || !mapView) return;
  const s = game.state;
  if (s.location === 'club' || s.chapter === 'prologue') { UI.toast('The Club grounds. No map needed here.', 'info'); return; }
  let area = s.location, x = player.pos.x, y = player.pos.y, inside = null;
  if (s.location === 'interior' && s.room) { area = s.room.loc; x = s.room.door.x; y = s.room.door.y; inside = (s.room.sign || '').replace(/\b(\w)(\w*)/g, (m, a, b) => a + b.toLowerCase()); }
  if (s.location === 'apartment') { const H = HOMES[s.home || 'starter']; area = H.district; inside = 'your home'; const pt = H.district === 'district' ? sock('Door_ApartmentLobby') : W.d[H.district] && W.d[H.district].points.find((q) => q.key === H.door); if (pt) { x = pt.x; y = pt.y; } }
  game.busy = true; if (input) input.enabled = false; audio.play('click');
  mapView.show({ area, x, y, heading: inside ? 0 : player.heading, inside }, inside ? null : lastTarget, { life: game.life().level, cart: W.cartPos });
}
function phone() { if (mode !== 'play' || busy()) return; game.busy = true; input.enabled = false; Promise.resolve(openPhone(game)).finally(() => { game.busy = false; input.enabled = true; }); }
function playerAnim(name, secs) {
  if (name === 'Sit') { player.ch.lock = true; player.ch.play('Sit', 0.3); setTimeout(() => { player.ch.lock = false; }, (secs || 3) * 1000); }
  else player.ch.oneShot(name);
}

// ------------------------------------------------------------------------------------------ space rules: ground, bounds, camera
const inWild = (p) => p.y < WILD.edge;
function groundAt(x, y) { return y < WILD.edge ? wildHeight(x, y) + 0.02 : districtGround(x, y, W.data.district); }
function boundsFn(p) {
  if (p.y < -80) { const b = WILD.bounds; p.x = THREE.MathUtils.clamp(p.x, b.x0, b.x1); p.y = Math.max(p.y, b.y0); }
  else { const b = W.data.district.bounds; p.x = THREE.MathUtils.clamp(p.x, b[0], b[2]); p.y = Math.min(p.y, b[3]); if (p.y < b[1] && Math.abs(p.x) > 9) p.y = b[1]; }
}
// anything solid between the player and the camera (walls, buildings, trees, hills) pulls the camera in front of it
const camRay = new THREE.Raycaster(); let camBlk = { key: null, list: [] };
function camBlockers() {
  const s = game.state, IR = curRoom(), DD = W.d[s.location];
  const key = IR ? 'in:' + s.room.key : s.location === 'apartment' ? 'apt' : s.location === 'club' ? 'club' : DD ? 'd:' + s.location : inWild(player.pos) ? 'wild' : 'district';
  if (camBlk.key === key && performance.now() - camBlk.t < 4000) return camBlk.list;
  const roots = IR ? [IR.group] : key === 'apt' ? [W.apartment] : key === 'club' ? [W.club && W.club.group] : DD ? [DD.group] : key === 'wild' ? [W.wild && W.wild.group, W.district] : [W.district];
  const list = [];
  for (const r of roots) if (r) r.traverse((o) => { if (o.isMesh && !o.isSkinnedMesh && o.castShadow && o.material && !o.material.transparent) list.push(o); });
  camBlk = { key, list, t: performance.now() }; return list;
}
function occludeCamera(want, target) {
  const dir = want.clone().sub(target), len = dir.length(); if (len < 0.05) return;
  dir.divideScalar(len); camRay.set(target, dir); camRay.near = 0.25; camRay.far = len + 0.3;
  const hit = camRay.intersectObjects(camBlockers(), false)[0];
  if (hit) want.copy(target).addScaledVector(dir, Math.max(0.3, Math.min(len, hit.distance - 0.3)));
}
function clampCamera(want, target) {
  if (clampCameraBounds(want, target) === 'fm') return;   // the store has its own bounds; shelves shouldn't make the camera jump
  try { occludeCamera(want, target); } catch (e) { console.warn('camera occlusion off', e); camBlk = { key: '__off', list: [], t: 1e15 }; }
}
function clampCameraBounds(want, target) {
  const s = game && game.state;
  if (s && s.location === 'apartment') { want.x = THREE.MathUtils.clamp(want.x, -3.75, 3.75); want.z = THREE.MathUtils.clamp(want.z, -5.8, -0.3); want.y = THREE.MathUtils.clamp(want.y, -499.6, -497.4); return; }
  if (s && s.location === 'club' && W.club) { const b = W.club.bounds; want.x = THREE.MathUtils.clamp(want.x, b[0] + 0.5, b[2] - 0.5); want.z = THREE.MathUtils.clamp(want.z, -(b[3] - 0.5), -(CLUB.oy + 0.6)); want.y = THREE.MathUtils.clamp(want.y, 0.5, 10.5); return; }
  const IRc = s && curRoom();
  if (IRc) { const b = IRc.bounds; want.x = THREE.MathUtils.clamp(want.x, b[0] + 0.1, b[2] - 0.1); want.z = THREE.MathUtils.clamp(want.z, -(b[3] - 0.1), -(b[1] + 0.1)); want.y = THREE.MathUtils.clamp(want.y, 0.6, ROOM.h - 0.35); return; }
  const DD = s && W.d[s.location];
  if (DD) {
    want.y = Math.max(want.y, 0.6);
    const dir = want.clone().sub(target);
    for (let k = 0.15; k <= 1.0001; k += 0.08) { const p = target.clone().addScaledVector(dir, k), x = p.x, y = -p.z; for (const b of DD.buildings) if (Math.abs(x - b.x) < b.hx + 0.3 && Math.abs(y - b.y) < b.hy + 0.3) { want.copy(target).addScaledVector(dir, Math.max(0.1, k - 0.1)); return; } }
    return;
  }
  if (inWild(player.pos)) { want.y = Math.max(want.y, groundAt(-0, -0) + wildHeight(want.x, -want.z) + 0.6); return; }
  want.y = Math.max(want.y, 0.6);
  if (inFreshMart(player.pos)) {   // keep the camera in the same part of the store as the player: shop floor, stockroom or office
    const fm = W.data.district.freshmart, P = player.pos, wall = fm.y + fm.boh - 0.5, back = P.y > wall, office = back && P.x > fm.x + 7;
    const x0 = office ? fm.x + 7.2 : fm.x - fm.w / 2 + 0.35, x1 = back && !office ? fm.x + 6.8 : fm.x + fm.w / 2 - 0.35;
    const y0 = back ? wall + 0.65 : fm.y + 0.45, y1 = back ? fm.y + fm.d - 0.3 : wall - 0.25;
    want.x = THREE.MathUtils.clamp(want.x, x0, x1); want.z = THREE.MathUtils.clamp(want.z, -y1, -y0); want.y = Math.min(want.y, back ? 4.2 : 4.4);
    return 'fm';
  }
  const dir = want.clone().sub(target);
  for (let k = 0.15; k <= 1.0001; k += 0.08) {
    const p = target.clone().addScaledVector(dir, k), x = p.x, y = -p.z;
    for (const b of W.data.district.buildings) if (Math.abs(x - b.x) < b.hx + 0.3 && Math.abs(y - b.y) < b.hy + 0.3 && p.y < 18) { want.copy(target).addScaledVector(dir, Math.max(0.1, k - 0.1)); return; }
  }
}
function inFreshMart(p) { const fm = W.data.district.freshmart; return p.x > fm.x - fm.w / 2 && p.x < fm.x + fm.w / 2 && p.y > fm.y + 0.3 && p.y < fm.y + fm.d; }

// ------------------------------------------------------------------------------------------ story triggers (per frame)
function storyTriggers() {
  const s = game.state, P = player.pos;
  if (s.location === 'club' && s.quest === 'prologue_walk' && near(CLUB.councilDoor, 2.8) && !busy()) { councilScene(); return; }
  if (s.chapter === 'nowhere') {
    if (!s.flags.path && P.y > WILD.fork.y + 22 && P.y < WILD.join.y) {
      const trail = Math.abs(P.x - (-12)) < Math.abs(P.x - 30);
      s.flags.path = trail ? 'trail' : 'road';
      game.edu.record('think.compare', true, { ctx: 'wilderness' });
      UI.toast(trail ? 'You took the shorter, unmarked trail.' : 'You followed the marked public road.', 'info', 3000);
    }
    if (P.y > WILD.edge + 2) {
      game.arrive();
      UI.caption(['The city doesn’t know you.', 'No one recognises you. No one gives you special treatment.', 'Everything here costs something. Earning it takes effort.'], 2600);
    }
  }
  const J = npcs.Jax; if (!J) return;
  if (s.quest === 'jax1' && !s.flags.jax1placed) { const d = sock('Door_Clothing'); placeJax(d.x + 2.2, d.y + 1.6, Math.PI); s.flags.jax1placed = true; }
  if (s.flags.jaxStealDue && !s.flags.jaxSteal && !s.flags.jaxStealPlaced && s.time > 11) { const d = sock('Door_Clothing'); placeJax(d.x - 2.2, d.y + 1.6, Math.PI); s.flags.jaxStealPlaced = true; }
  if (s.flags.jax3due && !s.flags.jax3 && !s.flags.jax3placed) { const hs = sock('NPC_Jax_Hangout'); placeJax(hs.x, hs.y); s.flags.jax3placed = true; }
  // Jax starts the first conversation himself when you walk past
  if (s.quest === 'jax1' && !J.hidden && near(J.pos, 4) && !busy() && !s.flags.jaxStarted) { s.flags.jaxStarted = true; nearest = { run: () => game.jax1(), npc: J }; doInteract(); }
}

// ------------------------------------------------------------------------------------------ loop
let saveT = 0, last = performance.now(), lastObjective = null;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  const t = now / 1000;
  if (mode === 'title' || mode === 'loading' || mode === 'creator') {
    titleT += dt;
    const focus = mode === 'creator' ? P2W(26, -9.5, 0.13) : P2W(10, 0, 0);
    if (mode === 'creator') {
      camera.position.copy(focus).add(new THREE.Vector3(-1.0, 1.0, 3.0)); camera.lookAt(focus.clone().add(new THREE.Vector3(0, 0.8, 0)));
      const w = innerWidth, hh = innerHeight, land = w > hh;
      camera.setViewOffset(w, hh, land ? w * 0.22 : 0, land ? 0 : hh * 0.26, w, hh);
    } else { camera.clearViewOffset(); const a = titleT * 0.05; camera.position.set(Math.sin(a) * 46 + 10, 16 + Math.sin(titleT * 0.2) * 2, Math.cos(a) * 46); camera.lookAt(P2W(12, 18, 6)); }
    engine.setTime(18.4, focus);
    if (preview) preview.update(dt);
    if (traffic) traffic.update(dt, { x: 999, y: 999 });
    for (const p of peds) p.update(dt, { x: 999, y: 999 }, camera.position, 70);
    lampsUpdate(); engine.render();
    return;
  }
  if (!player) { engine.render(); return; }
  if (mode === 'mini' && mini) { const f = mini.update(dt); engine.setTime(12.5, f || new THREE.Vector3()); engine.scene.fog.near = 120; engine.scene.fog.far = 700; engine.render(); return; }
  if ((markT -= dt) < 0) try { markT = 0.5; for (const n of [...Object.values(npcs), ...Object.values(W.d).flatMap((D) => D.friends)]) if (n.mark) n.mark.visible = game.state.flags.housed && game.advOffer(n.advId); } catch (e) { markT = 1e9; console.warn('markers off', e); }
  updateLook(engine, dt);
  const adapted = engine.adapt(dt);
  if (adapted) UI.toast(`Graphics set to ${adapted} for smoother play (change in 📱 Settings)`, 'info', 3500);
  const s = game.state;
  const playing = mode === 'play' && !busy();
  if (mode === 'play') s.stats.playSecs = (s.stats.playSecs || 0) + Math.min(dt, 1);
  if (playing) game.tick(dt / 360 * (s.timeScale || 1));   // 1 real minute ≈ 10 game minutes
  const apt = s.location === 'apartment', club = s.location === 'club' && !!W.club, DD = W.d[s.location], IR = curRoom();
  const gfn = DD ? (x, y) => districtHeight(x, y, DD.def) : apt || club || IR ? () => 0 : groundAt;
  if (mode === 'play' && fcam.mode === 'follow') {
    player.speedMul = !apt && !club && !IR && !DD && inWild(player.pos) ? 2 : 1;
    const inFM = !apt && !club && !IR && !DD && inFreshMart(player.pos);
    player.radius = inFM || IR ? 0.22 : 0.3;   // indoors: slip between shelves and through doorways more easily
    if (inFM && !busy()) for (const k of ['Door_Stockroom', 'Door_Office']) {   // ease the player into narrow back-room doorways
      const d = sock(k); const P = player.pos;
      if (d && Math.abs(P.y - d.y) < 1.4 && Math.abs(P.x - d.x) < 1.0 && Math.hypot(input.move.x, input.move.y) > 0.2) P.x += (d.x - P.x) * Math.min(1, dt * 5);
    }   // the countryside walk into the city goes by twice as fast
    if (!busy()) player.update(dt, input, fcam, IR ? IR.coll : apt ? aptColl : club ? clubColl : DD ? DD.coll : coll, gfn, IR ? IR.bounds : apt ? W.data.apartment.bounds : club ? W.club.bounds : DD ? (p) => clampToWalk(p, DD.walk) : boundsFn);
    else player.ch.locomote(0, dt);
    if (apt) player.ch.root.position.y = -500 + player.h;
  }
  player.ch.update(dt);
  for (const m of members) m.update(dt);
  const focus = player.ch.root.position.clone();
  fcam.clamp = clampCamera;
  { const fmNow = !apt && !club && !IR && !DD && inFreshMart(player.pos), fm = W.data.district.freshmart; fcam.minPitch = fmNow ? (player.pos.y > fm.y + fm.boh - 0.5 ? 0.95 : 0.5) : 0;
    // walking through a doorway: jump the camera into the new room rather than gliding through the wall
    const zone = fmNow ? (player.pos.y > fm.y + fm.boh - 0.5 ? (player.pos.x > fm.x + 7 ? 'office' : 'stock') : 'floor') : 'out';
    if (fcam.zone && zone !== fcam.zone) fcam.snap = true; fcam.zone = zone; }   // look over the shelves; near-overhead in the small back rooms
  const mv = input && input.move; fcam.follow = playing && mv && mv.y > 0.2 && Math.hypot(mv.x, mv.y) > 0.3 ? player.heading : null;
  fcam.update(dt, focus, playing ? input : null, IR ? 5.6 : apt || club || (inFreshMart(player.pos) ? 4.6 : false));
  engine.setTime(IR ? 12.5 : apt ? Math.min(Math.max(s.time, 6), 23.9) : s.time % 24, apt ? new THREE.Vector3(0, -500, 0) : focus);
  if (IR) { engine.sun.intensity *= 0.4; engine.renderer.toneMappingExposure *= 0.9; }
  if (IR && IR.npc) IR.npc.update(dt, player.pos, camera.position);
  // wide horizon in the wilderness so the faint skyline shows
  const wild = !apt && !club && !IR && inWild(player.pos);
  engine.scene.fog.near = wild ? 160 : club || IR ? 60 : 90; engine.scene.fog.far = wild ? 1150 : club ? 400 : 520;
  audio.wind && audio.wind(wild ? 1 : 0);
  if (pet) { pet.m.visible = !club && !(s.location === 'interior' && !IR); if (!club) pet.update(dt, player.pos, apt ? () => 0 : gfn, apt ? -500 : 0); }
  if (companion && !s.companion.hidden) updateCompanion(companion, dt, player.ch.root, player.heading);
  if (neighbors && !(s.settings && s.settings.noNeighbors)) try { neighbors.update(dt, { pos: player.pos, heading: player.heading, species: s.species, jacket: s.outfit.jacket, hoodie: s.outfit.hoodie, moving: input && (Math.abs(input.move?.x || 0) + Math.abs(input.move?.y || 0)) > 0.1 }, IR ? 'in:' + s.room.key : s.location); } catch (e) { console.warn('neighbors off', e); neighbors = null; }
  if (companion && mode === 'play' && !busy() && (tipT -= dt) < 0) { tipT = 90; const tip = game.companionTip(); if (tip) UI.toast(tip, 'info', 3800); }
  if (DD) {
    for (const p of DD.peds) p.update(dt, player.pos, camera.position, isMobile ? 48 : 75);
    for (const n of DD.friends) n.update(dt, player.pos, camera.position);
  } else if (!apt && !club && !IR) {
    if (traffic.busHold) { const b = traffic.busHold; b.vmax = b.hold(dt); }
    traffic.update(dt, player.pos); traffic.setNight(engine.lampLevel);
    for (const c of traffic.cars) c.m.visible = Math.abs(c.s) < 74;
    for (const p of peds) p.update(dt, player.pos, camera.position, isMobile ? 48 : 75);
    for (const n of Object.values(npcs)) n.update(dt, player.pos, camera.position);
  }
  if (mode === 'play') storyTriggers();
  lampsUpdate();
  if (mode === 'play') {
    UI.updateHUD(s);
    const obj = game.objective();
    let target = null; lastObjective = obj;
    if (obj.target === 'CLUB_COUNCIL') target = CLUB.councilDoor;
    else if (obj.target === 'MISSION' && s.mission) target = s.mission.loc === s.location ? (DD ? { x: DD.def.ox + s.mission.x, y: s.mission.y } : s.mission) : null;
    else if (obj.target === 'D:bus') target = DD ? DD.points.find((p) => p.key === 'bus') : null;
    else if (obj.target === 'CART') target = W.cartPos || null;
    else if (IR) {   // inside a building: point at the counter if the goal is this place, otherwise at the way out
      const here = s.room && obj.target && (s.room.doorKey === obj.target || s.room.key === obj.target);
      target = obj.target ? (IR.points.find((q) => q.act === (here ? 'counter' : 'exit')) || null) : null;
    }
    else if (DD) target = null;
    else if (obj.target === 'WILD_SIGN') target = W.wild.signs[0];
    else if (obj.target === 'NPC_Jax') target = npcs.Jax && !npcs.Jax.hidden ? npcs.Jax.pos : null;
    else if (obj.target === 'NPC_Counselor') target = apt ? sock('Interact_ExitDoor', 'apartment') : npcs.Counselor.pos;
    else if (obj.target) {
      const so = /^NPC_Manager/.test(obj.target) && npcs.Rosa ? npcs.Rosa.pos : sock(obj.target, apt ? 'apartment' : 'district') || sock(obj.target, apt ? 'district' : 'apartment');
      const sameSpace = so && (apt ? !!sock(obj.target, 'apartment') : !!sock(obj.target, 'district') || /^NPC_Manager/.test(obj.target));
      if (so && sameSpace) target = so; else if (so && apt) target = sock('Interact_ExitDoor', 'apartment'); else if (so && !apt) target = sock('Door_ApartmentLobby');
    }
    lastTarget = target;
    lastObjective = { ...obj, pos: target ? { x: target.x, y: target.y } : null, inDistrict: !!DD, inRoom: !!IR };
    const dist = target ? Math.hypot(target.x - player.pos.x, target.y - player.pos.y) : null;
    UI.objective(fcam.mode === 'follow' ? obj.text : null, dist);
    if (target) { beacon.visible = dist > 2.2; beacon.position.copy(P2W(target.x, target.y, apt ? -500 : target.y < WILD.edge ? wildHeight(target.x, target.y) : 0.14)); beacon.userData.ring.scale.setScalar(1 + Math.sin(t * 3) * 0.12); }
    else beacon.visible = false;
    UI.taskPanel(s.quest === 'shift' ? 'JOB PROGRESS' : null, s.quest === 'shift' ? game.taskRows() : null, s.quest === 'shift' ? (s.job ? s.job.rate * s.job.hours : 60) : undefined);
    nearest = busy() ? null : findInteraction();
    UI.interact(nearest ? nearest.label : null);
    if (DD) minimap.drawPlan(DD, player.pos, player.heading, target, DD.peds.map((p) => p.pos));
    else minimap.draw(player.pos, player.heading, target, IR ? 'INSIDE' : apt ? 'HOME' : club ? 'THE CLUB' : null, peds.map((p) => p.pos), wild);
    saveT += dt;
    if (saveT > 20 && !busy() && !club && !IR) { saveT = 0; s.pos = { ...player.pos }; s.heading = player.heading; game.save(); }
  }
  if (mapView && mapView.open) mapView.draw(t);
  engine.render();
}
function lampsUpdate() {
  const L = engine.lampLevel ?? 0;
  if (W.pools) W.pools.userData.mat.opacity = Math.max(0, L - 0.15) * 0.75;
  for (const D of Object.values(W.d)) { if (D.pools) D.pools.userData.mat.opacity = Math.max(0, L - 0.15) * 0.75; for (const m of D.lampMats) { if (m.userData.lamp === undefined) m.userData.lamp = m.emissiveIntensity; const base = m.userData.lamp, isWindow = /GlassLit/.test(m.name), isStreet = /LampEmit/.test(m.name); m.emissiveIntensity = base * (isStreet ? 0.06 + 0.5 * L : isWindow ? 0.35 + 0.75 * L : 0.45 + 0.6 * L); } }
  for (const m of W.lamps) { const base = m.userData.lamp, isWindow = /GlassLit/.test(m.name), isStreet = /LampEmit/.test(m.name); m.emissiveIntensity = base * (isStreet ? 0.06 + 0.5 * L : isWindow ? 0.35 + 0.75 * L : 0.45 + 0.6 * L); }
}

// Debug / test API (used by automated playtests)
window.REAL = {
  get state() { return game && game.state; }, get mode() { return mode; },
  teleport(key, where = 'district') { const so = sock(key, where); if (so) { player.pos = { x: so.x, y: so.y }; player.apply(); } return !!so; },
  cam(yaw, pitch, dist) { fcam.yaw = yaw; fcam.pitch = pitch; fcam.dist = dist; fcam.cur.set(0, 1e4, 0); },
  playerPos: () => ({ ...player.pos }), camYaw: () => fcam.yaw, playerHeading: () => player.heading, speedMul: () => player.speedMul, objective: () => lastObjective, forgetRecent: () => forgetRecent(), camPlanY: () => -camera.position.z, camDebug: () => { const w = fcam.cur.clone(); const r = clampCameraBounds(w, fcam.target.clone()); return { cur: fcam.cur.toArray().map((v) => +v.toFixed(2)), target: fcam.target.toArray().map((v) => +v.toFixed(2)), pitchNow: fcam.pitchNow, minPitch: fcam.minPitch, zone: fcam.zone, mode: fcam.mode, ret: r, clamped: w.toArray().map((v) => +v.toFixed(2)), loc: game.state.location, room: !!curRoom(), pos: { ...player.pos } }; },
  // walk a path in small steps against the real colliders; returns how far along it got (1 = all the way)
  pathClear: (pts, r = 0.22) => { let done = 0, total = 0; for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    let p = { x: pts[0][0], y: pts[0][1] }; for (let i = 1; i < pts.length; i++) { const [tx, ty] = pts[i]; for (let k = 0; k < 4000; k++) { const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy); if (d < 0.05) break; const st = Math.min(0.05, d), q = { x: p.x + dx / d * st, y: p.y + dy / d * st }; coll.resolve(q, r); const moved = Math.hypot(q.x - p.x, q.y - p.y); done += Math.max(0, (dx * (q.x - p.x) + dy * (q.y - p.y)) / d); p = q; if (moved < 0.002) return +(done / total).toFixed(2); } } return +Math.min(1, done / total).toFixed(2); },
  camCheck: () => { const t = fcam.target.clone(), c = camera.position.clone(), dir = t.clone().sub(c), len = dir.length(); camRay.set(c, dir.normalize()); camRay.near = 0.05; camRay.far = Math.max(0.06, len - 0.35); const hit = camRay.intersectObjects(camBlockers(), false)[0]; camRay.near = 0.25; const n = t.project(camera); return { dist: +len.toFixed(2), blocked: !!hit, onScreen: Math.abs(n.x) < 1 && Math.abs(n.y) < 1 && n.z < 1, where: game.state.location }; },
  say: (who, text, choices) => UI.say(who, text, choices),
  teleportXY(x, y) { player.pos = { x, y }; player.apply(); },
  npcPos: (n) => npcs[n] && !npcs[n].hidden && { ...npcs[n].pos },
  wildSign: (i) => ({ ...W.wild.signs[i] }), club: () => ({ ...CLUB }),
  skip: async () => { await window.REAL.devJump(); },   // older tests: straight into the city
  skipPrologue: async () => { if (game.state.chapter === 'prologue') { game.state.flags.council = true; game.busy = false; input.enabled = true; await startWilderness(); } },
  // test-only: jump to a story checkpoint (skips the parts already covered by the full saga run)
  devJump: async (stage) => {
    const s = game.state;
    if (s.chapter === 'prologue') { s.flags.council = true; game.busy = false; input.enabled = true; leaveClubSpace(); $('#hud').classList.remove('prologue'); }
    Object.assign(s, { chapter: 'city', location: 'district', money: 100, time: 8.5 });
    Object.assign(s.flags, { housed: true, phone: true, readFirstSign: true, path: 'road' });
    s.bills = [{ id: 'phone1', name: 'Phone plan', amount: 25, due: s.day + 4, paid: false }, { id: 'rent1', name: 'Rent — The Starter Apartments (week 2)', amount: 120, due: s.day + 6, paid: false }];
    s.quest = 'job';   // arrived and housed: next, find a job
    if (stage === 'hired') { s.flags.hired = true; s.jobs = ['cashier']; s.job = { id: 'cashier', title: 'Cashier', employer: 'Fresh Mart', rate: 15, hours: 4 }; s.quest = 'clockin'; }
    fcam.mode = 'follow'; mode = 'play'; UI.showHUD(true); await spawnAdventureNPCs();
    const d = sock('Spawn_StoreEntry'); player.pos = { x: d.x, y: d.y + 2 }; player.apply();
  },
  sheets: () => [...document.querySelectorAll('#modal .sh-title')].map((e) => e.textContent),
  game: () => game, setTime: (h) => { game.state.time = h; },
  quality: (q) => engine.setQuality(q),
  life: () => game.life(),
  practice: (sk) => runActivity(game, () => ({ skill: sk, ...PRACTICE[sk]() }), 'learn', 'Practice', '📚'),
  travel: (loc) => travelTo(loc, true), districtPoints: () => (W.d[game.state.location] || { points: [] }).points.map((p) => ({ ...p })),
  refresh: () => refreshWorld(), askNPC: (n) => askNPC(game, { name: n }), speakPractice: async (k = 'cashier', i = 0) => { const V = await import('./voice.js'); return V.speakTask(game, V.SPEAK_TASKS[k][i], 'Rosa · Manager'); }, camPos: () => camera.position.toArray().map((v) => Math.round(v)), mini: () => mode === 'mini', raceState: () => race && race.player && { x: race.player.x, y: race.player.y, v: race.player.v, lap: race.player.lap, idx: race.player.idx, t: race.t }, petCue: () => petCourse && petCourse.cue(), openMap: () => openMap(), mapOpen: () => !!(mapView && mapView.open), roomPoints: () => { const R = curRoom(); return R ? R.points.map((p) => ({ ...p })) : []; }, leave: () => leaveBuilding(),
  info: () => ({ draws: engine.renderer.info.render.calls, tris: engine.renderer.info.render.triangles, peds: peds.length, quality: engine.quality }),
};

requestAnimationFrame(loop);
boot().catch((e) => { console.error(e); fatal('Could not load REAL: ' + e.message + '. Check your connection and tap Reload.'); });
