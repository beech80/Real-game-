// REAL — Learn • Live • Grow. Boot, title, creator, prologue, wilderness, city, invitation, endings, loop.
import * as THREE from 'three';
import { Engine, makeSurfaceTextures, isMobile } from './engine.js';
import { loadGLB, mergeStatic, Collision, districtGround, P2W } from './world.js';
import { Character, loadSpecies, SPECIES, JACKETS, HOODIES, FUR_SHIFT } from './characters.js';
import { Input, FollowCamera, Player } from './controls.js';
import { Traffic, populate, StoryNPC } from './city.js';
import { UI, Minimap, h, $, wait, setSfx, money } from './ui.js';
import { Audio } from './audio.js';
import { Game, newState, loadSave, openPhone } from './game.js';
import { buildWilderness, wildHeight, WILD, buildClub, CLUB, setGate } from './scenes.js';

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
document.addEventListener('gesturestart', (e) => e.preventDefault());
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

const W = { district: null, apartment: null, wild: null, club: null, data: null, lamps: [] };
let player = null, game = null, input = null, fcam = null, traffic = null, peds = [], npcs = {}, coll = null, aptColl = null, clubColl = null, members = [];
var mode = 'loading';
let beacon = null, minimap = null;

// ------------------------------------------------------------------------------------------ loading
function progress(p, label) { $('#load-bar').style.width = Math.round(p * 100) + '%'; if (label) $('#load-label').textContent = label; }
function addColliders(c, list) { for (const x of list) c.items.push({ ...x, cos: Math.cos(x.r || 0), sin: Math.sin(x.r || 0) }); }

async function boot() {
  progress(0.02, 'Loading the city…');
  const data = W.data = await (await fetch('assets/world.json')).json();
  const g = await loadGLB('assets/district.glb.gz', (p) => progress(0.05 + p * 0.62, 'Loading the Starting District…'));
  progress(0.7, 'Building streets…');
  await wait(30);
  W.district = mergeStatic(g.scene, textures, 40);
  scene.add(W.district);
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
    startGame(st, true);
  };
  show();
}

// ------------------------------------------------------------------------------------------ game start
async function startGame(state, isNew) {
  mode = 'intro';
  const ch = new Character(await loadSpecies(state.species), { outfit: state.outfit });
  scene.add(ch.root);
  player = new Player(ch);
  input = new Input($('#view'));
  fcam = new FollowCamera(camera);
  game = new Game(state, {
    sfx: (n) => audio.play(n),
    enterApartment: (silent) => enterApartment(silent), exitApartment: () => exitApartment(),
    playerAnim: (n, secs) => playerAnim(n, secs), setOutfit: (o) => player.ch.setOutfit(o),
    npcExpr: (n, e) => npcs[n] && npcs[n].ch.expression(e, 3),
    jaxLeave: () => { if (npcs.Jax) npcs.Jax.hidden = true; },
    goToClub: () => invitation(),
    JACKETS, quality: () => engine.quality, setQuality: (q) => engine.setQuality(q),
    toggleSound: () => audio.toggle(), soundOn: () => audio.on,
  });
  input.onInteract = () => doInteract(); input.onPhone = () => phone();
  $('#btn-interact').onclick = () => doInteract(); $('#btn-phone').onclick = () => phone();
  $('#btn-sprint').onclick = (e) => { input.sprintLatch = !input.sprintLatch; e.currentTarget.classList.toggle('on', input.sprintLatch); };
  await spawnStoryNPCs();
  if (state.chapter === 'prologue') { await prologue(); return; }
  if (state.location === 'apartment') await enterApartment(true);
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
function placeJax(x, y, facing) {
  const J = npcs.Jax; if (!J) return;
  J.pos.x = x; J.pos.y = y; J.collider.x = x; J.collider.y = y; J.ch.root.position.copy(P2W(x, y, 0.15)); J.hidden = false; if (facing !== undefined) J.facing = facing;
}

// ------------------------------------------------------------------------------------------ spaces
function setCitySpace(on) {
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
  for (const [sp, j, hd, x, y] of looks) {
    const c = new Character(await loadSpecies(sp), { outfit: { jacket: j, hoodie: hd } });
    c.root.position.copy(P2W(CLUB.ox + x, CLUB.oy + y, 0)); c.root.rotation.y = Math.random() * 6; c.play(Math.random() < 0.6 ? 'Talk' : 'Idle', 0);
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
  await UI.caption(['THE CLUB.', 'Where wealth, influence and opportunity were simply part of everyday life.'], 2600);
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
  await UI.say(R, 'Membership in The Club carries a responsibility. It isn’t enough to be associated with successful people.');
  await UI.say(R, 'A member must demonstrate independence, responsibility, knowledge and personal achievement. You have enjoyed the benefits of The Club without developing those qualities.');
  shot([CLUB.ox + 3.4, CLUB.rep.y - 1.2, 1.75], [CLUB.ox, CLUB.rep.y, 1.3]);
  W.rep.expression('Focused', 6);
  await UI.say(R, 'You’ve experienced what success looks like. But have you ever experienced what it takes?');
  shot([CLUB.ox + 1.4, CLUB.seat.y + 1.6, 1.4], [CLUB.ox, CLUB.seat.y, 1.15]);
  player.ch.expression('Surprised', 4);
  const c = await UI.say(game.state.name, '…', ['But I belong here.', 'What did I do wrong?', 'What happens now?']);
  shot([CLUB.ox + 3.4, CLUB.rep.y - 1.2, 1.75], [CLUB.ox, CLUB.rep.y, 1.3]);
  await UI.say(R, ['Belonging isn’t something you are handed. It is something you build.', 'Nothing wrong. Nothing at all. That is the problem. You never had to do anything.', 'Your privileged access ends tonight.'][c]);
  await UI.say(R, 'You will have an opportunity to return, but only after you prove you can build a meaningful life on your own.');
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
  W.apartment.visible = true; setCitySpace(false);
  game.state.location = 'apartment';
  const sp = sock('Spawn_PlayerHome', 'apartment');
  player.pos = { x: sp.x, y: sp.y + 0.6 }; player.heading = 0; player.h = 0; player.apply();
  if (!silent) await UI.fade(0, 350);
  game.save();
}
async function exitApartment() {
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
  for (const so of W.data[where].sockets) {
    if (!/^SOCKET_(Interact|Door)_/.test(so.n)) continue;
    const d = Math.hypot(so.x - P.x, so.y - P.y);
    const reach = /Door_/.test(so.n) ? 2.6 : /StockShelf/.test(so.n) ? 2.4 : 1.9;
    if (d > reach || d > bd) continue;
    const it = game.interaction({ ...so, key: so.n.replace('SOCKET_', '') });
    if (it) { best = it; bd = d; }
  }
  if (where !== 'district') return best;
  for (const sg of W.wild.signs) if (sg.q && near(sg, 3.2)) best = { label: 'Read the sign', run: () => game.readSign(sg) };
  if (s.quest === 'shift' && s.shift && s.shift.register >= s.shift.need.register && s.shift.stock < s.shift.need.stock) {
    for (let a = 1; a <= 5; a++) { const so = sock(`Interact_StockShelf_A${a}`); if (so && Math.abs(P.x - so.x) < 1.8 && P.y > 30 && P.y < 42) { const it = game.interaction({ key: `Interact_StockShelf_A${a}` }); if (it) best = it; } }
  }
  if (near(npcs.Rosa && npcs.Rosa.pos, 2.4)) best = { label: s.quest === 'job' ? 'Ask about the job' : 'Talk to Rosa', run: () => game.talkManager() };
  const jax = npcs.Jax;
  if (jax && !jax.hidden && near(jax.pos, 2.8)) {
    if (s.quest === 'jax1') best = { label: 'Talk to Jax', run: () => game.jax1() };
    else if (s.flags.jaxStealDue && !s.flags.jaxSteal) best = { label: 'Talk to Jax', run: () => game.jaxSteal() };
    else if (s.flags.jax3due && !s.flags.jax3) best = { label: 'Talk to Jax', run: () => game.jax3() };
  }
  if (near(npcs.Counselor && npcs.Counselor.pos, 2.4)) best = s.flags.housed ? { label: 'Talk to Mr. Okafor', run: () => UI.say('Mr. Okafor · Community Center', pick(['Every career starts with one application.', 'The career board inside shows what each job needs. Every one of them is open to you.', 'You’re doing better than you think.'])) } : { label: 'Ask for help', run: () => game.housing() };
  if (near(npcs.Dee && npcs.Dee.pos, 2)) best = best || { label: 'Talk to Dee', run: () => UI.say('Dee · Daily Grind', 'Best coffee on Main St. Come in any time.') };
  return best;
}
const pick = (a) => a[Math.floor(Math.random() * a.length)];
async function doInteract() {
  if (mode !== 'play' || busy() || !nearest) return;
  audio.play('click');
  game.busy = true; input.enabled = false; UI.interact(null);
  try { await nearest.run(); } finally { game.busy = false; input.enabled = true; }
}
const busy = () => game.busy || UI.anySheet() || !$('#dialog').hidden;
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
function clampCamera(want, target) {
  const s = game && game.state;
  if (s && s.location === 'apartment') { want.x = THREE.MathUtils.clamp(want.x, -3.75, 3.75); want.z = THREE.MathUtils.clamp(want.z, -5.8, -0.3); want.y = THREE.MathUtils.clamp(want.y, -499.6, -497.4); return; }
  if (s && s.location === 'club') { const b = W.club.bounds; want.x = THREE.MathUtils.clamp(want.x, b[0] + 0.5, b[2] - 0.5); want.z = THREE.MathUtils.clamp(want.z, -(b[3] - 0.5), -(CLUB.oy + 0.6)); want.y = THREE.MathUtils.clamp(want.y, 0.5, 10.5); return; }
  if (inWild(player.pos)) { want.y = Math.max(want.y, groundAt(-0, -0) + wildHeight(want.x, -want.z) + 0.6); return; }
  want.y = Math.max(want.y, 0.6);
  if (inFreshMart(player.pos)) { const fm = W.data.district.freshmart; want.x = THREE.MathUtils.clamp(want.x, fm.x - 13.4, fm.x + 13.4); want.z = THREE.MathUtils.clamp(want.z, -(fm.y + 17.6), -(fm.y + 0.7)); want.y = Math.min(want.y, 4.6); return; }
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
  if (s.quest === 'jax1' && !J.hidden && near(J.pos, 4) && !busy() && !s.flags.jaxStarted) { s.flags.jaxStarted = true; nearest = { run: () => game.jax1() }; doInteract(); }
}

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
    lampsUpdate(); engine.render();
    return;
  }
  if (!player) { engine.render(); return; }
  const adapted = engine.adapt(dt);
  if (adapted) UI.toast(`Graphics set to ${adapted} for smoother play (change in 📱 Settings)`, 'info', 3500);
  const s = game.state;
  const playing = mode === 'play' && !busy();
  if (playing) game.tick(dt / 360 * (s.timeScale || 1));   // 1 real minute ≈ 10 game minutes
  const apt = s.location === 'apartment', club = s.location === 'club';
  if (mode === 'play' && fcam.mode === 'follow') {
    if (!busy()) player.update(dt, input, fcam, apt ? aptColl : club ? clubColl : coll, apt || club ? () => 0 : groundAt, apt ? W.data.apartment.bounds : club ? W.club.bounds : boundsFn);
    else player.ch.locomote(0, dt);
    if (apt) player.ch.root.position.y = -500 + player.h;
  }
  player.ch.update(dt);
  for (const m of members) m.update(dt);
  const focus = player.ch.root.position.clone();
  fcam.clamp = clampCamera;
  fcam.update(dt, focus, playing ? input : null, apt || club || inFreshMart(player.pos));
  engine.setTime(apt ? Math.min(Math.max(s.time, 6), 23.9) : s.time % 24, apt ? new THREE.Vector3(0, -500, 0) : focus);
  // wide horizon in the wilderness so the faint skyline shows
  const wild = !apt && !club && inWild(player.pos);
  engine.scene.fog.near = wild ? 160 : club ? 60 : 90; engine.scene.fog.far = wild ? 1150 : club ? 400 : 520;
  audio.wind && audio.wind(wild ? 1 : 0);
  if (!apt && !club) {
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
    let target = null;
    if (obj.target === 'CLUB_COUNCIL') target = CLUB.councilDoor;
    else if (obj.target === 'WILD_SIGN') target = W.wild.signs[0];
    else if (obj.target === 'NPC_Jax') target = npcs.Jax && !npcs.Jax.hidden ? npcs.Jax.pos : null;
    else if (obj.target === 'NPC_Counselor') target = apt ? sock('Interact_ExitDoor', 'apartment') : npcs.Counselor.pos;
    else if (obj.target) {
      const so = /^NPC_Manager/.test(obj.target) && npcs.Rosa ? npcs.Rosa.pos : sock(obj.target, apt ? 'apartment' : 'district') || sock(obj.target, apt ? 'district' : 'apartment');
      const sameSpace = so && (apt ? !!sock(obj.target, 'apartment') : !!sock(obj.target, 'district') || /^NPC_Manager/.test(obj.target));
      if (so && sameSpace) target = so; else if (so && apt) target = sock('Interact_ExitDoor', 'apartment'); else if (so && !apt) target = sock('Door_ApartmentLobby');
    }
    const dist = target ? Math.hypot(target.x - player.pos.x, target.y - player.pos.y) : null;
    UI.objective(fcam.mode === 'follow' ? obj.text : null, dist);
    if (target) { beacon.visible = dist > 2.2; beacon.position.copy(P2W(target.x, target.y, apt ? -500 : target === W.wild.signs[0] ? wildHeight(target.x, target.y) : 0.14)); beacon.userData.ring.scale.setScalar(1 + Math.sin(t * 3) * 0.12); }
    else beacon.visible = false;
    UI.taskPanel(s.quest === 'shift' ? 'JOB PROGRESS' : null, s.quest === 'shift' ? game.taskRows() : null, s.quest === 'shift' ? (s.job ? s.job.rate * s.job.hours : 60) : undefined);
    nearest = busy() ? null : findInteraction();
    UI.interact(nearest ? nearest.label : null);
    minimap.draw(player.pos, player.heading, target, apt ? 'HOME' : club ? 'THE CLUB' : null, peds.map((p) => p.pos), wild);
    saveT += dt;
    if (saveT > 20 && !busy() && !club) { saveT = 0; s.pos = { ...player.pos }; s.heading = player.heading; game.save(); }
  }
  engine.render();
}
function lampsUpdate() {
  const L = engine.lampLevel ?? 0;
  if (W.pools) W.pools.userData.mat.opacity = Math.max(0, L - 0.15) * 0.75;
  for (const m of W.lamps) { const base = m.userData.lamp, isWindow = /GlassLit/.test(m.name), isStreet = /LampEmit/.test(m.name); m.emissiveIntensity = base * (isStreet ? 0.06 + 0.5 * L : isWindow ? 0.35 + 0.75 * L : 0.45 + 0.6 * L); }
}

// Debug / test API (used by automated playtests)
window.REAL = {
  get state() { return game && game.state; }, get mode() { return mode; },
  teleport(key, where = 'district') { const so = sock(key, where); if (so) { player.pos = { x: so.x, y: so.y }; player.apply(); } return !!so; },
  cam(yaw, pitch, dist) { fcam.yaw = yaw; fcam.pitch = pitch; fcam.dist = dist; fcam.cur.set(0, 1e4, 0); },
  playerPos: () => ({ ...player.pos }), camYaw: () => fcam.yaw,
  teleportXY(x, y) { player.pos = { x, y }; player.apply(); },
  npcPos: (n) => npcs[n] && !npcs[n].hidden && { ...npcs[n].pos },
  wildSign: (i) => ({ ...W.wild.signs[i] }), club: () => ({ ...CLUB }),
  skipPrologue: async () => { if (game.state.chapter === 'prologue') { game.state.flags.council = true; game.busy = false; input.enabled = true; await startWilderness(); } },
  game: () => game, setTime: (h) => { game.state.time = h; },
  quality: (q) => engine.setQuality(q),
  life: () => game.life(),
  info: () => ({ draws: engine.renderer.info.render.calls, tris: engine.renderer.info.render.triangles, peds: peds.length, quality: engine.quality }),
};

requestAnimationFrame(loop);
boot().catch((e) => { console.error(e); fatal('Could not load REAL: ' + e.message + '. Check your connection and tap Reload.'); });
