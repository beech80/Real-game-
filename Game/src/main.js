// REAL — Learn • Live • Grow. Boot, title, creator, intro, game loop.
import * as THREE from 'three';
import { Engine, makeSurfaceTextures, isMobile } from './engine.js';
import { loadGLB, mergeStatic, Collision, districtGround, buildInteractions, P2W } from './world.js';
import { Character, loadSpecies, SPECIES, JACKETS, HOODIES, FUR_SHIFT } from './characters.js';
import { Input, FollowCamera, Player } from './controls.js';
import { Traffic, populate, StoryNPC } from './city.js';
import { UI, Minimap, h, $, wait, setSfx, money } from './ui.js';
import { Audio } from './audio.js';
import { Game, newState, loadSave, openPhone } from './game.js';

// ---------------------------------------------------------------- crash/diagnostic panel (never a silent black screen)
function fatal(msg) {
  const el = document.getElementById('crash');
  if (!el) return;
  el.querySelector('p').textContent = msg;
  el.hidden = false;
  const b = document.getElementById('crash-reload'); if (b) b.onclick = () => location.reload();
}
addEventListener('error', (e) => { if (mode === 'loading') fatal('REAL hit a problem while loading: ' + (e.message || 'unknown error')); });
addEventListener('unhandledrejection', (e) => { if (mode === 'loading') fatal('REAL hit a problem while loading: ' + ((e.reason && e.reason.message) || e.reason)); });
document.addEventListener('gesturestart', (e) => e.preventDefault());   // iOS pinch-zoom
document.addEventListener('dblclick', (e) => e.preventDefault());

let engine;
try { engine = new Engine($('#view')); }
catch (e) { fatal(e.message); throw e; }
engine.onContextLost = () => { try { game && game.save(); } catch (e) {} fatal('Your phone paused the 3D graphics (this can happen when memory runs low). Your progress is saved — tap Reload to continue.'); };
const audio = new Audio();
setSfx((n) => audio.play(n));
UI.init();
const textures = makeSurfaceTextures();
const scene = engine.scene, camera = engine.camera;

const W = { district: null, apartment: null, data: null, lamps: [] };
let player = null, game = null, input = null, fcam = null, traffic = null, peds = [], npcs = {}, coll = null, aptColl = null;
var mode = 'loading';    // loading | title | creator | intro | play
let beacon = null, minimap = null;

// ------------------------------------------------------------------------------------------ loading
function progress(p, label) { $('#load-bar').style.width = Math.round(p * 100) + '%'; if (label) $('#load-label').textContent = label; }

async function boot() {
  progress(0.02, 'Loading the city…');
  const data = W.data = await (await fetch('assets/world.json')).json();
  const g = await loadGLB('assets/district.glb.gz', (p) => progress(0.05 + p * 0.65, 'Loading the Starting District…'));
  progress(0.72, 'Building streets…');
  await wait(30);
  W.district = mergeStatic(g.scene, textures, 40);
  scene.add(W.district);
  W.lamps = W.district.userData.lamps;
  for (const m of W.lamps) m.userData.lamp = m.emissiveIntensity;
  coll = new Collision(data.district.colliders);
  progress(0.85, 'Waking up the residents…');
  await loadSpecies('Fox');
  traffic = new Traffic(scene, coll);
  beacon = makeBeacon(); scene.add(beacon);
  W.pools = makeLightPools(data.district.colliders.filter((c) => c.n === 'PROP_StreetLight'));
  scene.add(W.pools);
  minimap = new Minimap($('#minimap'), data.district);
  progress(1, 'Ready');
  await wait(250);
  $('#loading').hidden = true;
  title();
  // background: residents
  populate(scene, coll, isMobile ? 8 : 16).then((p) => { peds = p; });
}

function makeLightPools(lights) {
  // warm light pools under street lamps (additive decals; fade in at dusk)
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,200,130,1)'); gr.addColorStop(0.45, 'rgba(255,170,90,.45)'); gr.addColorStop(1, 'rgba(255,150,70,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const mat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
  const geo = new THREE.PlaneGeometry(7, 7); geo.rotateX(-Math.PI / 2);
  const inst = new THREE.InstancedMesh(geo, mat, lights.length);
  const m = new THREE.Matrix4();
  lights.forEach((l, i) => {
    // lamp head hangs ~1.2 m toward the road from the pole
    const toward = Math.abs(l.y) < Math.abs(l.x) ? { x: 0, y: -Math.sign(l.y) * 1.2 } : { x: -Math.sign(l.x) * 1.2, y: 0 };
    m.makeTranslation(l.x + toward.x, 0.17, -(l.y + toward.y)); inst.setMatrixAt(i, m);
  });
  inst.renderOrder = 2;
  inst.userData.mat = mat;
  return inst;
}

function makeBeacon() {
  const g = new THREE.Group();
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.6, 40, 20, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xe8a33a, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  beam.position.y = 20; g.add(beam);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.85, 40), new THREE.MeshBasicMaterial({ color: 0xffc35a, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.2; g.add(ring);
  g.userData.ring = ring;
  g.visible = false;
  return g;
}

// ------------------------------------------------------------------------------------------ title
let titleT = 0;
function title() {
  mode = 'title';
  const save = loadSave();
  const T = $('#title');
  T.hidden = false;
  $('#btn-continue').hidden = !save;
  if (save) $('#btn-continue').querySelector('small').textContent = `${save.name} · Day ${save.day} · ${money(save.money)}`;
  $('#btn-new').onclick = () => { audio.start(); audio.play('click'); T.hidden = true; creator(); };
  $('#btn-continue').onclick = () => { audio.start(); audio.play('click'); T.hidden = true; startGame(save, false); };
}

// ------------------------------------------------------------------------------------------ creator
const creatorState = { i: 0, fur: 0, jacket: 0, hoodie: 0, name: '' };
let preview = null;
async function creator() {
  mode = 'creator';
  const C = $('#creator');
  C.hidden = false;
  const nameEl = $('#cr-name');
  const show = async () => {
    const sp = SPECIES[creatorState.i];
    $('#cr-species').textContent = sp.name.toUpperCase();
    $('#cr-quote').textContent = `“${sp.quote}”`;
    $('#cr-traits').textContent = sp.traits;
    $('#cr-loading').hidden = false;
    const g = await loadSpecies(sp.id);
    if (SPECIES[creatorState.i] !== sp) return;
    if (preview) scene.remove(preview.root);
    preview = new Character(g);
    preview.root.position.copy(P2W(26, -9.5, 0.13));
    preview.root.rotation.y = 0.5;
    scene.add(preview.root);
    applyLook();
    preview.play('Idle', 0);
    setTimeout(() => preview && preview.oneShot('Wave'), 300);
    preview.expression('Happy', 2);
    $('#cr-loading').hidden = true;
  };
  const applyLook = () => preview && preview.setOutfit({ jacket: JACKETS[creatorState.jacket].color, hoodie: HOODIES[creatorState.hoodie].color, fur: FUR_SHIFT[creatorState.fur].mul });
  const chips = (id, list, key) => {
    const el = $(id);
    el.replaceChildren(...list.map((it, k) => h('button', { class: 'chip-btn' + (creatorState[key] === k ? ' on' : ''), title: it.name, 'aria-label': it.name,
      onclick: () => { creatorState[key] = k; audio.play('click'); chips(id, list, key); applyLook(); } })));
    [...el.children].forEach((b, k) => b.style.setProperty('--c', '#' + ((list[k].color ?? list[k].mul) >>> 0).toString(16).padStart(6, '0')));
  };
  chips('#cr-fur', FUR_SHIFT, 'fur'); chips('#cr-jacket', JACKETS, 'jacket'); chips('#cr-hoodie', HOODIES, 'hoodie');
  $('#cr-prev').onclick = () => { creatorState.i = (creatorState.i + SPECIES.length - 1) % SPECIES.length; audio.play('click'); show(); };
  $('#cr-next').onclick = () => { creatorState.i = (creatorState.i + 1) % SPECIES.length; audio.play('click'); show(); };
  $('#cr-go').onclick = () => {
    const name = (nameEl.value || '').trim().replace(/[^\p{L}\p{N} '\-]/gu, '').slice(0, 14);
    if (!name) { nameEl.focus(); UI.toast('Give your REAL a name.', 'warn'); return; }
    C.hidden = true;
    camera.clearViewOffset();
    audio.play('good');
    const st = newState({ name, species: SPECIES[creatorState.i].id,
      outfit: { jacket: JACKETS[creatorState.jacket].color, hoodie: HOODIES[creatorState.hoodie].color, fur: FUR_SHIFT[creatorState.fur].mul } });
    st.wardrobe = [...new Set(['black', 'navy', JACKETS[creatorState.jacket].id])];
    if (preview) { scene.remove(preview.root); preview = null; }
    startGame(st, true);
  };
  show();
}

// ------------------------------------------------------------------------------------------ game start
async function startGame(state, intro) {
  mode = 'intro';
  const g = await loadSpecies(state.species);
  const ch = new Character(g, { outfit: state.outfit });
  scene.add(ch.root);
  player = new Player(ch);
  input = new Input($('#view'));
  fcam = new FollowCamera(camera);
  game = new Game(state, {
    sfx: (n) => audio.play(n),
    enterApartment: (silent) => enterApartment(silent),
    exitApartment: () => exitApartment(),
    playerAnim: (n, secs) => playerAnim(n, secs),
    setOutfit: (o) => player.ch.setOutfit(o),
    npcExpr: (n, e) => npcs[n] && npcs[n].ch.expression(e, 3),
    npcReact: () => {},
    jaxLeave: () => { if (npcs.Jax) npcs.Jax.hidden = true; },
    JACKETS,
    quality: () => engine.quality, setQuality: (q) => engine.setQuality(q),
    toggleSound: () => audio.toggle(), soundOn: () => audio.on,
  });
  input.onInteract = () => doInteract();
  input.onPhone = () => phone();
  $('#btn-interact').onclick = () => doInteract();
  $('#btn-phone').onclick = () => phone();
  $('#btn-sprint').onclick = (e) => { input.sprintLatch = !input.sprintLatch; e.currentTarget.classList.toggle('on', input.sprintLatch); };
  await spawnStoryNPCs();
  if (state.location === 'apartment') { await enterApartment(true); }
  else if (state.pos) { player.pos = { ...state.pos }; player.heading = state.heading || 0; }
  else { const sp = sock('Spawn_DistrictArrival'); player.pos = { x: sp.x + 4.5, y: sp.y }; player.heading = 0; }   // step off the bus, clear of the shelter
  player.apply();
  if (intro) await introCinematic();
  mode = 'play';
  UI.showHUD(true);
  if (intro) { await wait(400); UI.toast('Drag the left side to move · drag the right side to look', 'info', 5000); }
}

const sock = (key, where = 'district') => W.data[where].sockets.find((s) => s.n === 'SOCKET_' + key);

async function spawnStoryNPCs() {
  const make = async (id, key, name, outfit, facing) => {
    const s = sock(key); if (!s) return null;
    const ch = new Character(await loadSpecies(id), { outfit });
    scene.add(ch.root);
    const n = new StoryNPC(ch, s, name);
    if (facing !== undefined) n.facing = facing;
    coll.dynamic.push(n.collider);
    npcs[name] = n; return n;
  };
  await make('Cow', 'NPC_Manager_Idle', 'Rosa', { jacket: 0x1f6b35, hoodie: 0xf0b3c0 });
  const jax = await make('Jax', 'NPC_Jax_Hangout', 'Jax');
  if (jax) jax.hidden = !game.state.flags.jax2due;
  await make('Elephant', 'Door_CareerCenter', 'Counselor', { jacket: 0x13214a });
  await make('Dog', 'Door_CoffeeShop', 'Dee', { jacket: 0x0f5c5c, hoodie: 0xe6dccb });
  // nudge door-standing NPCs off the doorway
  for (const k of ['Counselor', 'Dee']) { const n = npcs[k]; if (n) { n.pos.x += 1.6; n.collider.x = n.pos.x; n.ch.root.position.copy(P2W(n.pos.x, n.pos.y, 0.13)); } }
}

async function introCinematic() {
  UI.showHUD(false);
  $('#skip').hidden = false;
  fcam.mode = 'script';
  engine.setTime(18.6);
  const club = new THREE.Vector3(0, 70, -300);
  const path = [
    { p: new THREE.Vector3(0, 9, 30), t: club, d: 6.5 },
    { p: new THREE.Vector3(0, 22, -40), t: club, d: 6.5 },
    { p: new THREE.Vector3(34, 6, 14), t: P2W(26.5, -4, 1.2), d: 6 },
  ];
  const lines = [['THE CLUB.', 'Status. Comfort. Everything handed to you.'], ['Until the day it wasn’t.', 'Membership revoked. Account frozen.'], ['$100 and a bus ticket.', 'Start with almost nothing. Build something that’s yours.']];
  player.ch.root.visible = false;
  for (let i = 0; i < path.length; i++) {
    const from = i ? path[i - 1] : { p: new THREE.Vector3(0, 6, 60), t: club };
    const to = path[i];
    const capP = UI.caption(lines[i], to.d * 1000 / 2);
    const t0 = performance.now();
    if (i === 2) arrivalBus();
    await new Promise((res) => {
      const step = () => {
        const k = Math.min(1, (performance.now() - t0) / (to.d * 1000)), e = k * k * (3 - 2 * k);
        camera.position.lerpVectors(from.p, to.p, e);
        const tgt = from.t.clone().lerp(to.t, e); camera.lookAt(tgt);
        if (k < 1 && !skipIntro) requestAnimationFrame(step); else res();
      };
      step();
    });
    await capP;
    if (skipIntro) break;
  }
  player.ch.root.visible = true;
  player.ch.oneShot('Wave');
  fcam.mode = 'follow'; fcam.cur.copy(camera.position);
  $('#skip').hidden = true;
}
let skipIntro = false;
$('#skip').onclick = () => { skipIntro = true; };

function arrivalBus() {
  const bus = traffic.addCar({ ax: 'x', dir: 1, c: -1.75 }, -40, true);
  const cruise = 10;
  let stopped = 0;
  // pull in at the bus stop (x ~ 22), wait while the player steps off, then drive on as regular traffic
  bus.hold = (dt) => { if (bus.s > 17 && stopped < 4) { stopped += dt; return 0; } if (stopped >= 4) traffic.busHold = null; return cruise; };
  traffic.busHold = bus;
}

// ------------------------------------------------------------------------------------------ apartment
async function enterApartment(silent) {
  if (!silent) { audio.play('door'); await UI.fade(1, 350); }
  if (!W.apartment) {
    const g = await loadGLB('assets/apartment.glb.gz');
    W.apartment = mergeStatic(g.scene, textures, 100);
    W.apartment.position.set(0, -500, 0);   // separate space, far below the city
    const lights = new THREE.Group();
    for (const [x, y, z, i, c] of [[0.5, 3.2, 2.6, 30, 0xffe2b8], [-2, 4.3, 2.6, 22, 0xffe2b8], [3.6, 5.7, 1.6, 14, 0xffb070], [-2.9, 1.1, 2.6, 12, 0xf0f4ff]]) {
      const l = new THREE.PointLight(c, i, 9, 1.6); l.position.copy(P2W(x, y, z)); lights.add(l);
    }
    W.apartment.add(lights);
    scene.add(W.apartment);
    aptColl = new Collision(W.data.apartment.colliders);
  }
  W.apartment.visible = true;
  W.district.visible = false; if (W.pools) W.pools.visible = false;
  for (const p of peds) p.ch.root.visible = false;
  for (const n of Object.values(npcs)) n.ch.root.visible = false;
  for (const c of traffic.cars) c.m.visible = false;
  game.state.location = 'apartment';
  const sp = sock('Spawn_PlayerHome', 'apartment');
  player.pos = { x: sp.x, y: sp.y + 0.6 }; player.heading = 0; player.h = 0;
  player.apply();
  if (!silent) await UI.fade(0, 350);
  game.save();
}
async function exitApartment() {
  audio.play('door'); await UI.fade(1, 350);
  W.apartment.visible = false; W.district.visible = true; if (W.pools) W.pools.visible = true;
  for (const c of traffic.cars) c.m.visible = true;
  game.state.location = 'district';
  const d = sock('Door_ApartmentLobby');
  player.pos = { x: d.x, y: d.y - 1.2 }; player.heading = Math.PI; player.h = 0.13;
  player.apply(); fcam.yaw = Math.PI;
  await UI.fade(0, 350);
  game.save();
}

// ------------------------------------------------------------------------------------------ interactions
let nearest = null;
function findInteraction() {
  const s = game.state, where = s.location;
  const P = player.pos;
  let best = null, bd = 1e9;
  for (const so of W.data[where].sockets) {
    if (!/^SOCKET_(Interact|Door)_/.test(so.n)) continue;
    const d = Math.hypot(so.x - P.x, so.y - P.y);
    const reach = /Door_/.test(so.n) ? 2.6 : /StockShelf/.test(so.n) ? 2.4 : 1.9;
    if (d > reach || d > bd) continue;
    const it = game.interaction({ ...so, key: so.n.replace('SOCKET_', '') });
    if (it) { best = it; bd = d; }
  }
  if (where === 'district') {
    // aisle stocking: anywhere along the aisle counts
    if (s.quest === 'shift' && s.shift && s.shift.register >= s.shift.need.register && s.shift.stock < s.shift.need.stock) {
      for (let a = 1; a <= 5; a++) { const so = sock(`Interact_StockShelf_A${a}`); if (so && Math.abs(P.x - so.x) < 1.8 && P.y > 30 && P.y < 42) { const it = game.interaction({ key: `Interact_StockShelf_A${a}` }); if (it) { best = it; bd = 0; } } }
    }
    const rosa = npcs.Rosa;
    if (rosa && Math.hypot(rosa.pos.x - P.x, rosa.pos.y - P.y) < 2.4) { best = { label: 'Talk to Rosa', run: () => game.talkManager() }; }
    const jax = npcs.Jax;
    if (jax && !jax.hidden && Math.hypot(jax.pos.x - P.x, jax.pos.y - P.y) < 2.6) {
      if (s.quest === 'jax') best = { label: 'Talk to Jax', run: () => game.jax1() };
      else if (s.flags.jax2due) best = { label: 'Talk to Jax', run: () => game.jax2() };
    }
    for (const k of ['Counselor', 'Dee']) { const n = npcs[k]; if (n && Math.hypot(n.pos.x - P.x, n.pos.y - P.y) < 2) best = best || { label: `Talk to ${k === 'Dee' ? 'Dee' : 'the counselor'}`, run: () => UI.say(k === 'Dee' ? 'Dee · Daily Grind' : 'Mr. Okafor · Career Center', k === 'Dee' ? 'Best coffee on Main St. Come in any time.' : 'Every career starts with one application. Come inside when you’re ready.') }; }
  }
  return best;
}
async function doInteract() {
  if (mode !== 'play' || busy() || !nearest) return;
  audio.play('click');
  game.busy = true; input.enabled = false; UI.interact(null);
  try { await nearest.run(); } finally { game.busy = false; input.enabled = true; }
}
const busy = () => game.busy || !$('#modal').hidden || !$('#dialog').hidden;
function phone() { if (mode !== 'play' || busy()) return; game.busy = true; input.enabled = false; openPhone(game).finally(() => { game.busy = false; input.enabled = true; }); }

function playerAnim(name, secs) {
  if (name === 'Sit') { player.ch.lock = true; player.ch.play('Sit', 0.3); setTimeout(() => { player.ch.lock = false; }, (secs || 3) * 1000); }
  else player.ch.oneShot(name);
}

// ------------------------------------------------------------------------------------------ camera collision
function clampCamera(want, target) {
  const s = game && game.state;
  if (s && s.location === 'apartment') {
    want.x = THREE.MathUtils.clamp(want.x, -3.75, 3.75); want.z = THREE.MathUtils.clamp(want.z, -5.8 - 500 * 0, -0.3); want.y = THREE.MathUtils.clamp(want.y, -500 + 0.4, -500 + 2.6);
    return;
  }
  want.y = Math.max(want.y, 0.6);
  if (inFreshMart(player.pos)) {
    const fm = W.data.district.freshmart;
    want.x = THREE.MathUtils.clamp(want.x, fm.x - 13.4, fm.x + 13.4);
    want.z = THREE.MathUtils.clamp(want.z, -(fm.y + 17.6), -(fm.y + 0.7));
    want.y = Math.min(want.y, 4.6);
    return;
  }
  // pull in if the camera ends up inside a building
  const dir = want.clone().sub(target);
  const L = dir.length();
  for (let k = 0.15; k <= 1.0001; k += 0.08) {
    const p = target.clone().addScaledVector(dir, k);
    const x = p.x, y = -p.z;
    for (const b of W.data.district.buildings) {
      if (Math.abs(x - b.x) < b.hx + 0.3 && Math.abs(y - b.y) < b.hy + 0.3 && p.y < 18) { want.copy(target).addScaledVector(dir, Math.max(0.1, k - 0.1)); return; }
    }
  }
}
function inFreshMart(p) { const fm = W.data.district.freshmart; return p.x > fm.x - fm.w / 2 && p.x < fm.x + fm.w / 2 && p.y > fm.y + 0.3 && p.y < fm.y + fm.d; }

// ------------------------------------------------------------------------------------------ loop
let saveT = 0, last = performance.now();
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
    lampsUpdate();
    engine.render();
    return;
  }
  if (!player) { engine.render(); return; }
  const adapted = engine.adapt(dt);
  if (adapted) UI.toast(`Graphics set to ${adapted} for smoother play (change in 📱 Settings)`, 'info', 3500);
  const s = game.state;
  const playing = mode === 'play' && !busy();
  if (playing) game.tick(dt / 60);     // 1 real second = 1 game minute
  const apt = s.location === 'apartment';
  if (mode === 'play') {
    if (!busy()) player.update(dt, input, fcam, apt ? aptColl : coll, apt ? () => 0 : (x, y) => districtGround(x, y, W.data.district), apt ? W.data.apartment.bounds : W.data.district.bounds);
    else player.ch.locomote(0, dt);
    if (apt) { player.ch.root.position.y = -500 + player.h; }
  }
  player.ch.update(dt);
  const focus = player.ch.root.position.clone();
  fcam.clamp = clampCamera;
  fcam.update(dt, focus, playing ? input : null, apt || inFreshMart(player.pos));
  engine.setTime(apt ? Math.min(Math.max(s.time, 6), 23.9) : s.time % 24, apt ? new THREE.Vector3(0, -500, 0) : focus);
  if (!apt) {
    // traffic + residents + story NPCs
    if (traffic.busHold) { const b = traffic.busHold; b.vmax = b.hold(dt); }
    traffic.update(dt, player.pos); traffic.setNight(engine.lampLevel);
    for (const p of peds) p.update(dt, player.pos, camera.position, isMobile ? 48 : 75);
    for (const n of Object.values(npcs)) n.update(dt, player.pos, camera.position);
    if (s.quest === 'jax' && npcs.Jax && !npcs.Jax.hidden && Math.hypot(npcs.Jax.pos.x - player.pos.x, npcs.Jax.pos.y - player.pos.y) < 3.2 && !busy() && !s.flags.jaxStarted) {
      s.flags.jaxStarted = true; nearest = { run: () => game.jax1() }; doInteract();
    }
    if (s.quest === 'jax' && npcs.Jax && !s.flags.jax1placed) {
      // Jax waits outside Fresh Mart's doors, on the parking lot
      const fm = W.data.district.freshmart, J = npcs.Jax;
      J.pos.x = fm.x + 9.5; J.pos.y = fm.y - 3.0; J.collider.x = J.pos.x; J.collider.y = J.pos.y;
      J.ch.root.position.copy(P2W(J.pos.x, J.pos.y, 0.15)); J.hidden = false; J.facing = 0; s.flags.jax1placed = true;
    }
    if (s.flags.jax2due && npcs.Jax && npcs.Jax.hidden && !s.flags.jax2placed) {
      const hs = sock('NPC_Jax_Hangout'); Object.assign(npcs.Jax.pos, { x: hs.x, y: hs.y }); npcs.Jax.collider.x = hs.x; npcs.Jax.collider.y = hs.y;
      npcs.Jax.ch.root.position.copy(P2W(hs.x, hs.y, 0.13)); npcs.Jax.hidden = false; s.flags.jax2placed = true;
    }
  }
  lampsUpdate();
  // HUD
  if (mode === 'play') {
    UI.updateHUD(s);
    const obj = game.objective();
    let target = null;
    if (obj.target) {
      const so = /^NPC_Manager/.test(obj.target) && npcs.Rosa ? { x: npcs.Rosa.pos.x, y: npcs.Rosa.pos.y } : sock(obj.target, apt ? 'apartment' : 'district') || sock(obj.target, apt ? 'district' : 'apartment');
      const sameSpace = so && (apt ? !!sock(obj.target, 'apartment') : !!sock(obj.target, 'district') || /^NPC_Manager/.test(obj.target));
      if (obj.target === 'NPC_Jax_Appear' && npcs.Jax) target = { x: npcs.Jax.pos.x, y: npcs.Jax.pos.y };
      else if (so && sameSpace) target = so;
      else if (so && apt) target = sock('Interact_ExitDoor', 'apartment');
      else if (so && !apt) target = sock('Door_ApartmentLobby');
    }
    const dist = target ? Math.hypot(target.x - player.pos.x, target.y - player.pos.y) : null;
    UI.objective(obj.text, dist);
    if (target) {
      beacon.visible = dist > 2.2;
      beacon.position.copy(P2W(target.x, target.y, apt ? -500 : 0.14));
      beacon.userData.ring.scale.setScalar(1 + Math.sin(t * 3) * 0.12);
    } else beacon.visible = false;
    UI.taskPanel(s.quest === 'shift' ? 'JOB PROGRESS' : null, s.quest === 'shift' ? game.taskRows() : null, s.quest === 'shift' ? 60 : undefined);
    nearest = busy() ? null : findInteraction();
    UI.interact(nearest ? nearest.label : null);
    minimap.draw(player.pos, player.heading, target, apt, peds.map((p) => p.pos));
    saveT += dt;
    if (saveT > 20 && !busy()) { saveT = 0; s.pos = { ...player.pos }; s.heading = player.heading; game.save(); }
  }
  engine.render();
}

function lampsUpdate() {
  const L = engine.lampLevel ?? 0;
  if (W.pools) W.pools.userData.mat.opacity = Math.max(0, L - 0.15) * 0.75;
  for (const m of W.lamps) {
    const base = m.userData.lamp;
    const isWindow = /GlassLit/.test(m.name), isStreet = /LampEmit/.test(m.name);
    const k = isStreet ? 0.06 + 0.5 * L : isWindow ? 0.35 + 0.75 * L : 0.45 + 0.6 * L;
    m.emissiveIntensity = base * k;
  }
}

// Debug / test API (used by automated playtests)
window.REAL = {
  get state() { return game && game.state; }, get mode() { return mode; },
  skip() { skipIntro = true; },
  teleport(key, where = 'district') { const so = sock(key, where); if (so) { player.pos = { x: so.x, y: so.y }; player.apply(); } return !!so; },
  cam(yaw, pitch, dist) { fcam.yaw = yaw; fcam.pitch = pitch; fcam.dist = dist; fcam.cur.set(0, 1e4, 0); },
  playerPos: () => ({ ...player.pos }), camYaw: () => fcam.yaw, lookState: () => ({ cam: input.cam, joy: input.joy.id, look: [input.look.x, input.look.y], enabled: input.enabled, busy: busy(), mode }),
  teleportXY(x, y) { player.pos = { x, y }; player.apply(); },
  npcPos: (n) => npcs[n] && { ...npcs[n].pos },
  game: () => game, setTime: (h) => { game.state.time = h; },
  quality: (q) => engine.setQuality(q),
  world: () => { const d = W.district; if (!d) return null; const out = { children: d.children.length, visible: d.visible }; const b = new THREE.Box3().setFromObject(d); out.box = [b.min.toArray().map(Math.round), b.max.toArray().map(Math.round)]; out.mats = [...new Set(d.children.map((m) => m.material.name))].slice(0, 12); out.firstPos = d.children[0] && Array.from(d.children[0].geometry.attributes.position.array.slice(0, 6)); return out; },
  info: () => ({ draws: engine.renderer.info.render.calls, tris: engine.renderer.info.render.triangles, peds: peds.length, quality: engine.quality }),
};

requestAnimationFrame(loop);
boot().catch((e) => { console.error(e); fatal('Could not load REAL: ' + e.message + '. Check your connection and tap Reload.'); });
