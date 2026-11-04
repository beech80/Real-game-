// REAL — Pet Championship (agility course) and Robot Builders (programmable robot arena).
// Both are real-time 3D activities. Pets run faster when they are fed, rested, trained with rewards and loved;
// robots succeed when their parts suit the terrain and their program is logical.
import * as THREE from 'three';
import { P2W } from './world.js';
import { makePet } from './pets.js';
import { textTexture } from './scenes.js';

const std = (c, r = 0.8, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });

// ============================================================================ PET AGILITY
const PX = -9000, PY = 0;
const COURSE = [['start', 0], ['hurdle', 18], ['tunnel', 38], ['weave', 58], ['hurdle', 78], ['ramp', 96], ['finish', 114]];
export const CUES = { hurdle: 'Jump!', tunnel: 'Tunnel!', weave: 'Weave!', ramp: 'Climb!' };

export class PetCourse {
  constructor(scene) { this.scene = scene; this.g = null; this.active = false; }
  _build() {
    if (this.g) return;
    const g = this.g = new THREE.Group();
    const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.copy(P2W(PX + x, PY + y, z)); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; };
    add(new THREE.BoxGeometry(60, 0.2, 150), std(0x5a9a40, 0.95), 0, 57, -0.1);
    for (let lane = 0; lane < 4; lane++) add(new THREE.BoxGeometry(0.15, 0.02, 120), std(0xffffff), -6 + lane * 4 + 2, 57, 0.01);
    for (const [kind, y] of COURSE) for (let lane = 0; lane < 4; lane++) {
      const x = -6 + lane * 4;
      if (kind === 'hurdle') { add(new THREE.BoxGeometry(2.6, 0.12, 0.12), std(0xd23b2a, 0.6), x, y, 0.55); for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.12, 0.12, 0.7), std(0xf1f1f1), x + s * 1.3, y, 0.35); }
      if (kind === 'tunnel') { const t = add(new THREE.CylinderGeometry(0.75, 0.75, 4, 16, 1, true), std(0x2a5bd2, 0.7), x, y, 0.75); t.rotation.x = Math.PI / 2; t.material.side = THREE.DoubleSide; }
      if (kind === 'weave') for (let k = 0; k < 5; k++) add(new THREE.CylinderGeometry(0.05, 0.05, 1.1, 8), std(k % 2 ? 0xe8b23a : 0xf1f1f1), x + (k % 2 ? 0.3 : -0.3), y - 4 + k * 2, 0.55);
      if (kind === 'ramp') { const r = add(new THREE.BoxGeometry(1.6, 0.15, 6), std(0xe8823a, 0.8), x, y, 0.6); r.rotation.x = 0.22; }
      if (kind === 'finish' || kind === 'start') add(new THREE.BoxGeometry(3.6, 0.03, 0.4), std(kind === 'finish' ? 0xffffff : 0xe8b23a), x, y, 0.02);
    }
    for (const s of [-1, 1]) { add(new THREE.BoxGeometry(0.2, 1, 140), std(0xf1f1f1), s * 12, 57, 0.5); for (let r = 0; r < 3; r++) add(new THREE.BoxGeometry(2, 0.6, 120), std(0x8a8f99), s * (15 + r * 2), 57, 0.3 + r * 0.6); }
    const sign = textTexture(['BRIGHTER PARK', 'PET CHAMPIONSHIP'], { w: 1024, h: 256, bg: '#2f8f5a', font: 'bold 72px "Barlow Condensed", Arial' });
    const b = add(new THREE.PlaneGeometry(14, 3.5), new THREE.MeshStandardMaterial({ map: sign, emissive: 0xffffff, emissiveMap: sign, emissiveIntensity: 0.25 }), 0, 122, 5); b.rotation.y = Math.PI;
    g.visible = false; this.scene.add(g);
  }
  /** pet = save object {type, name, bond, training, ...}; care = 0.6..1.2 multiplier; rivals = [{name,type,color,skill}] */
  start(pet, care, rivals, camera, hud) {
    this._build(); this.g.visible = true; this.camera = camera; this.hud = hud;
    const mk = (type, color, lane, speed, name) => { const m = makePet(type, color); m.scale.multiplyScalar(1.6); this.scene.add(m); return { m, lane, y: 0, v: 0, base: speed, name, phase: Math.random() * 6, slowT: 0 }; };
    const base = 7.2 * care * (1 + (pet.training || 0) * 0.025);
    this.me = mk(pet.type, pet.color, 1, base, pet.name);
    this.rivals = rivals.map((r, i) => mk(r.type, r.color, [0, 2, 3][i], r.speed, r.name));
    this.all = [this.me, ...this.rivals];
    this.t = -3; this.active = true; this._snap = true; this.cueHit = 0; this.cueMiss = 0; this.pending = null; this.done = [];
    return new Promise((res) => (this._res = res));
  }
  /** called when the player taps the cue button */
  cue() {
    const P = this.pending; if (!P) return false;
    P.hit = true; this.cueHit++; this.pending = null; return true;
  }
  update(dt) {
    if (!this.active) return null;
    this.t += dt;
    for (const p of this.all) {
      if (this.t < 0) { p.v = 0; } else if (p.y < 114) {
        p.v += ((p.slowT > 0 ? p.base * 0.45 : p.base) - p.v) * Math.min(1, dt * 3);
        p.slowT -= dt; p.y += p.v * dt;
        // NPC pets clear obstacles on their own skill; the player's pet waits for your cue
        const obs = COURSE.find(([k, y]) => CUES[k] && p.y > y - 3 && p.y < y + 0.5 && !(p.cleared || []).includes(y));
        if (obs) {
          p.cleared = p.cleared || [];
          if (p === this.me) {
            if (!this.pending || this.pending.y !== obs[1]) this.pending = { y: obs[1], kind: obs[0], hit: false };
            if (p.y > obs[1] - 0.6 && !this.pending.hit) { p.slowT = 1.2; this.cueMiss++; p.cleared.push(obs[1]); this.pending = null; }
            else if (this.pending && this.pending.hit) { p.cleared.push(obs[1]); this.pending = null; }
          } else { p.cleared.push(obs[1]); if (Math.random() > p.base / 9) p.slowT = 0.8; }
        }
        if (p.y >= 114 && !this.done.includes(p)) this.done.push(p);
      }
      const hop = COURSE.some(([k, y]) => (k === 'hurdle' || k === 'ramp') && Math.abs(p.y - y) < 1.2) ? Math.sin(Math.min(1, Math.abs(p.y) % 1) * Math.PI) * 0.6 : 0;
      p.phase += dt * (6 + p.v);
      const x = -6 + p.lane * 4 + 2 + Math.sin(p.phase * 0.5) * (COURSE.some(([k, y]) => k === 'weave' && Math.abs(p.y - y) < 4) ? 0.35 : 0.05);
      p.m.position.copy(P2W(PX + x, PY + p.y, hop)); p.m.rotation.y = Math.PI;
      const U = p.m.userData; U.legs.forEach((l, i) => { l.rotation.x = p.v > 0.5 ? Math.sin(p.phase + (i % 2 ? Math.PI : 0)) * 0.8 : 0; }); U.tail.rotation.y = Math.sin(p.phase * 1.5) * 0.5;
    }
    const me = this.me, cw = P2W(PX + 2 - 6 + me.lane * 4, PY + me.y, 0);
    if (this._snap) { this.camera.position.copy(cw.clone().add(new THREE.Vector3(6, 4.2, 7))); this._snap = false; } else this.camera.position.lerp(cw.clone().add(new THREE.Vector3(6, 4.2, 7)), 1 - Math.exp(-dt * 4)); this.camera.lookAt(cw.clone().add(new THREE.Vector3(0, 0.6, -4)));
    const place = [...this.all].sort((a, b) => (this.done.includes(b) - this.done.includes(a)) || (this.done.indexOf(a) - this.done.indexOf(b)) || b.y - a.y).indexOf(me) + 1;
    this.hud({ count: this.t < 0 ? Math.ceil(-this.t) : this.t < 0.8 ? 'GO!' : '', cue: this.pending ? CUES[this.pending.kind] : null, pos: place, of: this.all.length });
    if (this.done.length === this.all.length || (this.done.includes(me) && this.t > 60)) {
      this.active = false;
      const order = this.done.concat(this.all.filter((p) => !this.done.includes(p)));
      setTimeout(() => { for (const p of this.all) this.scene.remove(p.m); this.g.visible = false; this._res({ place: order.indexOf(me) + 1, order: order.map((p) => (p === me ? me.name : p.name)), hits: this.cueHit, misses: this.cueMiss }); }, 900);
    }
    return cw;
  }
}

// ============================================================================ ROBOT ARENA
export const ROBOT_PARTS = {
  frame: [{ id: 'light', name: 'Light frame', cost: 0, weight: 1, note: 'Uses little power.' }, { id: 'standard', name: 'Standard frame', cost: 60, weight: 1.4, note: 'Balanced and stable.' }, { id: 'heavy', name: 'Heavy frame', cost: 90, weight: 2, note: 'Never tips over, but power-hungry.' }],
  move: [{ id: 'wheels', name: 'Wheels', cost: 0, note: 'Fast on flat floors. Can’t climb stairs.' }, { id: 'tracks', name: 'Tracks', cost: 80, note: 'Good on rubble and ramps.' }, { id: 'legs', name: 'Legs', cost: 120, note: 'Slow, but can climb stairs.' }],
  arm: [{ id: 'gripper', name: 'Gripper', cost: 0, note: 'Picks up boxes.' }, { id: 'scoop', name: 'Scoop', cost: 40, note: 'Picks up loose balls.' }, { id: 'magnet', name: 'Magnet', cost: 60, note: 'Picks up metal parts.' }],
  battery: [{ id: 'small', name: 'Small battery', cost: 0, energy: 14, note: '14 energy.' }, { id: 'large', name: 'Large battery', cost: 70, energy: 24, note: '24 energy, a bit heavier.' }],
};
// tile: . flat, r rubble, s stairs, ^ ramp, # wall, O object, G goal
export const ROBOT_LEVELS = [
  { name: 'First steps', grid: ['....G', '.....', '..O..', '.....', 'S....'], obj: 'box', par: 12, story: 'Pick up the box and bring it to the goal.' },
  { name: 'Rubble run', grid: ['##..G', '..rr.', '.O.r.', '...r.', 'S....'], obj: 'ball', par: 14, story: 'Rubble slows wheels. Bring the ball to the goal.' },
  { name: 'Stairway', grid: ['G.s..', '#.s..', '##sO.', '##s..', '##s.S'], obj: 'metal', par: 14, story: 'The goal is across a staircase. Only some robots can climb.' },
];
const COST = { wheels: { '.': 1, '^': 1.5, r: 3, s: null }, tracks: { '.': 1.2, '^': 1.2, r: 1.5, s: null }, legs: { '.': 1.6, '^': 1.6, r: 1.8, s: 2 } };
const RX = -10000, RY = 0, TILE = 2.2;

export function robotMesh(b) {
  const g = new THREE.Group(), col = std(b.color || 0x2a9fd6, 0.4, 0.5), dark = std(0x2a2d33, 0.5, 0.4), glow = new THREE.MeshStandardMaterial({ color: 0x9fe8ff, emissive: 0x6fd8ff, emissiveIntensity: 1.6 });
  const w = b.frame === 'heavy' ? 1.2 : b.frame === 'standard' ? 1.0 : 0.85;
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, 0.6, w), col); body.position.y = 0.75; g.add(body);
  const head = new THREE.Mesh(new THREE.BoxGeometry(w * 0.6, 0.35, w * 0.5), dark); head.position.y = 1.25; g.add(head);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), glow); e.position.set(s * 0.13, 1.28, w * 0.26); g.add(e); }
  if (b.move === 'wheels') for (const x of [-1, 1]) for (const z of [-1, 1]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.15, 14), dark); wh.rotation.z = Math.PI / 2; wh.position.set(x * (w / 2 + 0.05), 0.25, z * w * 0.3); g.add(wh); }
  if (b.move === 'tracks') for (const x of [-1, 1]) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.4, w * 1.05), dark); t.position.set(x * (w / 2 + 0.1), 0.22, 0); g.add(t); }
  if (b.move === 'legs') { g.userData.legs = []; for (const x of [-1, 1]) for (const z of [-1, 1]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 8), dark); l.position.set(x * w * 0.4, 0.3, z * w * 0.3); g.add(l); g.userData.legs.push(l); } }
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.7), dark); arm.position.set(0, 0.85, w / 2 + 0.3); g.add(arm);
  const tool = b.arm === 'scoop' ? new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), col) : b.arm === 'magnet' ? new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.05, 6, 12, Math.PI), std(0xd23b2a)) : new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.12), dark);
  tool.position.set(0, 0.85, w / 2 + 0.7); g.add(tool);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

export class RobotArena {
  constructor(scene) { this.scene = scene; this.active = false; this.g = null; }
  /** prog: array of 'F','L','R','P' (pick up), 'D' (drop). Resolves {ok, reason, steps, energyLeft, time} */
  run(level, build, prog, camera, hud) {
    if (this.g) this.scene.remove(this.g);
    const L = ROBOT_LEVELS[level], g = this.g = new THREE.Group(), n = L.grid.length;
    let start = null, objPos = null, goal = null;
    L.grid.forEach((row, ry) => [...row].forEach((ch, cx) => {
      const y = n - 1 - ry, h = ch === 's' ? 0.5 : ch === '^' ? 0.25 : 0;
      const m = new THREE.Mesh(new THREE.BoxGeometry(TILE - 0.08, 0.2 + h, TILE - 0.08), std(ch === '#' ? 0x55607e : ch === 'r' ? 0x8a7a66 : ch === 's' ? 0xb8b2a6 : ch === 'G' ? 0x2f8f5a : (cx + y) % 2 ? 0xd8dde4 : 0xc6ccd5, 0.85));
      m.position.copy(P2W(RX + cx * TILE, RY + y * TILE, (0.2 + h) / 2 - 0.1)); m.receiveShadow = true; g.add(m);
      if (ch === '#') { const wl = new THREE.Mesh(new THREE.BoxGeometry(TILE - 0.1, 1.2, TILE - 0.1), std(0x3a4258, 0.7)); wl.position.copy(P2W(RX + cx * TILE, RY + y * TILE, 0.6)); wl.castShadow = true; g.add(wl); }
      if (ch === 'r') for (let k = 0; k < 4; k++) { const rk = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22), std(0x6a5a48)); rk.position.copy(P2W(RX + cx * TILE + (Math.random() - 0.5) * 1.4, RY + y * TILE + (Math.random() - 0.5) * 1.4, 0.15)); g.add(rk); }
      if (ch === 'S') start = { x: cx, y }; if (ch === 'O') objPos = { x: cx, y }; if (ch === 'G') goal = { x: cx, y };
    }));
    const objMesh = L.obj === 'box' ? new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), std(0xb88a55)) : L.obj === 'ball' ? new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10), std(0xe8b23a)) : new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.1, 8, 16), std(0x8a8f99, 0.3, 0.9));
    objMesh.position.copy(P2W(RX + objPos.x * TILE, RY + objPos.y * TILE, 0.4)); objMesh.castShadow = true; g.add(objMesh);
    const bot = robotMesh(build); g.add(bot); this.scene.add(g);
    const tileAt = (x, y) => (x < 0 || y < 0 || x >= n || y >= n ? '#' : L.grid[n - 1 - y][x]);
    const fitArm = { box: 'gripper', ball: 'scoop', metal: 'magnet' }[L.obj] === build.arm;
    const energy0 = ROBOT_PARTS.battery.find((b) => b.id === build.battery).energy, wt = ROBOT_PARTS.frame.find((f) => f.id === build.frame).weight + (build.battery === 'large' ? 0.2 : 0);
    const st = { x: start.x, y: start.y, d: 0, carrying: false, energy: energy0, steps: 0, time: 0 };
    const DIRS = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    this.camera = camera; this.hud = hud; this.active = true;
    const place = () => { const h = ({ s: 0.5, '^': 0.25 })[tileAt(st.x, st.y)] || 0; bot.position.copy(P2W(RX + st.x * TILE, RY + st.y * TILE, h)); bot.rotation.y = Math.PI - st.d * Math.PI / 2; if (st.carrying) objMesh.position.copy(bot.position).add(new THREE.Vector3(0, 1.6, 0)); };
    place();
    const center = P2W(RX + (n - 1) * TILE / 2, RY + (n - 1) * TILE / 2, 0);
    camera.position.copy(center.clone().add(new THREE.Vector3(5, 10, 9))); camera.lookAt(center);
    return new Promise(async (res) => {
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      let reason = null;
      for (let i = 0; i < prog.length && !reason; i++) {
        const c = prog[i]; hud({ step: i, prog, energy: st.energy, energy0 });
        if (c === 'L') st.d = (st.d + 3) % 4; else if (c === 'R') st.d = (st.d + 1) % 4;
        else if (c === 'F') {
          const nx = st.x + DIRS[st.d][0], ny = st.y + DIRS[st.d][1], t = tileAt(nx, ny);
          const cost = t === '#' ? null : COST[build.move][t === 'O' || t === 'G' || t === 'S' ? '.' : t];
          if (t === '#') reason = 'wall';
          else if (cost == null) reason = 'stairs';
          else {
            const use = cost * wt * 0.6; if (st.energy < use) { reason = 'battery'; break; }
            st.energy -= use; st.time += cost; st.x = nx; st.y = ny;
            if (build.frame === 'light' && t === '^' && build.move !== 'tracks' && Math.random() < 0.35) { reason = 'tipped'; }
          }
        } else if (c === 'P') { if (st.x === objPos.x && st.y === objPos.y && !st.carrying) { if (!fitArm) reason = 'arm'; else st.carrying = true; } }
        else if (c === 'D') { if (st.carrying) { st.carrying = false; objMesh.position.copy(bot.position).add(new THREE.Vector3(0, 0.4, 0)); objPos.x = st.x; objPos.y = st.y; } }
        st.steps++;
        // animate the move
        const from = bot.position.clone(), fromR = bot.rotation.y; place(); const to = bot.position.clone(), toR = bot.rotation.y; bot.position.copy(from); bot.rotation.y = fromR;
        for (let k = 1; k <= 12; k++) { bot.position.lerpVectors(from, to, k / 12); bot.rotation.y = fromR + (toR - fromR) * (k / 12); if (st.carrying) objMesh.position.copy(bot.position).add(new THREE.Vector3(0, 1.6, 0)); if (bot.userData.legs) bot.userData.legs.forEach((l, j) => (l.rotation.x = Math.sin(k + j) * 0.5)); await wait(28); }
      }
      const ok = !reason && objPos.x === goal.x && objPos.y === goal.y && !st.carrying;
      hud({ step: prog.length, prog, energy: st.energy, energy0 });
      await wait(700);
      this.active = false; this.scene.remove(g); this.g = null;
      res({ ok, reason: reason || (ok ? null : st.carrying ? 'notdropped' : 'notgoal'), steps: prog.length, par: L.par, energyLeft: Math.round(st.energy * 10) / 10, time: st.time });
    });
  }
}
