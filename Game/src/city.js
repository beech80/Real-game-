// REAL — city life: pedestrians, story NPCs, traffic with signals, the city bus.
import * as THREE from 'three';
import { P2W } from './world.js';
import { Character, loadSpecies, SPECIES, JACKETS, HOODIES } from './characters.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ------------------------------------------------------------------------------------------ pedestrians
function sidewalkRoute(sx, sy, lane) {
  const L = (sx > 0 && sy < 0 ? 7.4 : 6) + lane, E = 68;   // SE side walks behind the bus shelter
  return [{ x: E * sx, y: L * sy }, { x: L * sx, y: L * sy }, { x: L * sx, y: E * sy }];
}

export class Pedestrian {
  constructor(ch, route) {
    this.ch = ch; this.route = route;
    this.seg = Math.floor(Math.random() * (route.length - 1)); this.t = Math.random(); this.dir = Math.random() < 0.5 ? 1 : -1;
    this.speed = rnd(1.0, 1.45); this.pause = 0; this.pos = { x: 0, y: 0 }; this.heading = 0;
    this.collider = { t: 'circle', x: 0, y: 0, r: 0.3, n: 'npc' };
  }
  update(dt, playerPos, camPos, visibleDist) {
    if (this.pause > 0) { this.pause -= dt; this.ch.locomote(0, dt); }
    else {
      const a = this.route[this.seg], b = this.route[this.seg + 1];
      const L = Math.hypot(b.x - a.x, b.y - a.y);
      // yield to the player
      const near = Math.hypot(playerPos.x - this.pos.x, playerPos.y - this.pos.y) < 1.1;
      const v = near ? 0 : this.speed;
      this.t += (v * dt / L) * this.dir;
      if (this.t > 1) { if (this.seg < this.route.length - 2) { this.seg++; this.t = 0; } else { this.t = 1; this.dir = -1; this.pause = rnd(0.5, 3); } }
      if (this.t < 0) { if (this.seg > 0) { this.seg--; this.t = 1; } else { this.t = 0; this.dir = 1; this.pause = rnd(0.5, 3); } }
      if (Math.random() < dt * 0.02) this.pause = rnd(2, 6);
      const A = this.route[this.seg], B = this.route[this.seg + 1];
      this.pos = { x: A.x + (B.x - A.x) * this.t, y: A.y + (B.y - A.y) * this.t };
      const hx = (B.x - A.x) * this.dir, hy = (B.y - A.y) * this.dir;
      const th = Math.atan2(hx, hy);
      let d = th - this.heading; d = Math.atan2(Math.sin(d), Math.cos(d)); this.heading += d * Math.min(1, dt * 6);
      this.ch.locomote(v, dt);
    }
    this.collider.x = this.pos.x; this.collider.y = this.pos.y;
    const wp = P2W(this.pos.x, this.pos.y, 0.13);
    this.ch.root.position.copy(wp);
    this.ch.root.rotation.y = Math.PI - this.heading;
    const dist = camPos.distanceTo(wp);
    this.ch.root.visible = dist < visibleDist;
    if (this.ch.root.visible) this.ch.update(dist > 28 ? dt : dt);
  }
}

// ------------------------------------------------------------------------------------------ vehicles
const CAR_COLORS = [0xd23b2a, 0x2a5bd2, 0xf1f1f1, 0x1b1b1f, 0xe8b23a, 0x2f8f5a, 0x8a8d96, 0x7b3fb0];

export function carMesh(color, bus = false) {
  const g = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color, metalness: 0.55, roughness: 0.32 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x1a2433, metalness: 0.4, roughness: 0.08 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
  const head = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff2d0, emissiveIntensity: 2 });
  const tail = new THREE.MeshStandardMaterial({ color: 0x550000, emissive: 0xff2010, emissiveIntensity: 1.6 });
  const L = bus ? 10.5 : 4.2, W = bus ? 2.5 : 1.85, H = bus ? 2.9 : 0.75;
  const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, L), paint); body.position.y = 0.35 + H / 2; g.add(body);
  if (bus) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(W + 0.02, 0.9, L - 1.2), glass); win.position.set(0, 2.1, 0.2); g.add(win);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(W + 0.03, 0.18, L), new THREE.MeshStandardMaterial({ color: 0xe8a33a, metalness: 0.6, roughness: 0.3 }));
    stripe.position.y = 1.35; g.add(stripe);
    const front = new THREE.Mesh(new THREE.BoxGeometry(W - 0.2, 1.3, 0.05), glass); front.position.set(0, 2.0, L / 2 + 0.01); g.add(front);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 0.05), new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xe8a33a, emissiveIntensity: 2.5 }));
    sign.position.set(0, 2.95, L / 2 + 0.03); g.add(sign);
  } else {
    const cab = new THREE.Mesh(new THREE.BoxGeometry(W - 0.15, 0.6, L * 0.5), glass); cab.position.set(0, 0.35 + H + 0.3, -0.15); g.add(cab);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(W - 0.25, 0.08, L * 0.42), paint); roof.position.set(0, 0.35 + H + 0.62, -0.15); g.add(roof);
  }
  const wr = bus ? 0.5 : 0.36;
  const wg = new THREE.CylinderGeometry(wr, wr, 0.28, 16); wg.rotateZ(Math.PI / 2);
  for (const z of bus ? [L / 2 - 1.8, -L / 2 + 2] : [L / 2 - 0.85, -L / 2 + 0.85]) for (const x of [W / 2 - 0.1, -W / 2 + 0.1]) {
    const w = new THREE.Mesh(wg, dark); w.position.set(x, wr, z); g.add(w);
  }
  for (const x of [W / 2 - 0.35, -W / 2 + 0.35]) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.14, 0.05), head); h.position.set(x, 0.8, L / 2 + 0.01); g.add(h);
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.14, 0.05), tail); t.position.set(x, 0.85, -L / 2 - 0.01); g.add(t);
  }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.userData = { L, W, head, tail };
  return g;
}

export class Traffic {
  constructor(scene, collision) {
    this.scene = scene; this.collision = collision; this.cars = []; this.phase = 0; this.timer = 0;
    // lanes: axis, dir, fixed coordinate (right-hand traffic)
    const lanes = [{ ax: 'x', dir: 1, c: -1.75 }, { ax: 'x', dir: -1, c: 1.75 }, { ax: 'y', dir: 1, c: 1.75 }, { ax: 'y', dir: -1, c: -1.75 }];
    for (const lane of lanes) for (let i = 0; i < 3; i++) this.addCar(lane, -70 + i * 50 + rnd(-6, 6));
    this.lights = this._signals();
  }
  addCar(lane, s, bus = false) {
    const m = carMesh(bus ? 0x14234f : pick(CAR_COLORS), bus);
    this.scene.add(m);
    const car = { m, lane, s, v: rnd(8, 11), vmax: bus ? 9 : rnd(9, 12), bus, col: { t: 'box', x: 0, y: 0, hx: 0, hy: 0, r: 0, n: 'car', cos: 1, sin: 0 } };
    this.collision.dynamic.push(car.col);
    this.cars.push(car);
    return car;
  }
  _signals() {
    const out = [];
    const mk = (x, y, rot, axis) => {
      const g = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 4.2, 8), new THREE.MeshStandardMaterial({ color: 0x1c1d22, metalness: 0.6, roughness: 0.4 }));
      pole.position.y = 2.1; g.add(pole);
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.95, 0.3), new THREE.MeshStandardMaterial({ color: 0x15161a }));
      box.position.set(0, 3.9, 0); g.add(box);
      const mats = {};
      [['r', 0xff2a1a, 4.2], ['y', 0xffb21a, 3.9], ['g', 0x2aff7a, 3.6]].forEach(([k, c, y]) => {
        const m = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: c, emissiveIntensity: 0 });
        const l = new THREE.Mesh(new THREE.CircleGeometry(0.1, 16), m); l.position.set(0, y, 0.16); g.add(l); mats[k] = m;
      });
      g.position.copy(P2W(x, y, 0.15)); g.rotation.y = rot;
      this.scene.add(g);
      out.push({ axis, mats });
    };
    mk(4.8, -4.8, 0, 'x'); mk(-4.8, 4.8, Math.PI, 'x'); mk(-4.8, -4.8, -Math.PI / 2, 'y'); mk(4.8, 4.8, Math.PI / 2, 'y');
    return out;
  }
  green(axis) { return (this.phase === 0 && axis === 'x') || (this.phase === 2 && axis === 'y'); }
  update(dt, player) {
    this.timer += dt;
    const durs = [14, 3, 14, 3];
    if (this.timer > durs[this.phase]) { this.timer = 0; this.phase = (this.phase + 1) % 4; }
    for (const L of this.lights) {
      const g = this.green(L.axis), yellow = (this.phase === 1 && L.axis === 'x') || (this.phase === 3 && L.axis === 'y');
      L.mats.g.emissiveIntensity = g ? 3 : 0; L.mats.y.emissiveIntensity = yellow ? 3 : 0; L.mats.r.emissiveIntensity = !g && !yellow ? 3 : 0;
    }
    for (const c of this.cars) {
      const { lane } = c;
      let target = c.vmax;
      // signal: stop line at 6.5 m before centre
      const along = c.s * lane.dir;
      const toStop = -6.5 - along;
      if (!this.green(lane.ax) && toStop > 0 && toStop < 25) target = Math.min(target, Math.max(0, (toStop - 0.5) * 0.9));
      // queue behind leading car
      for (const o of this.cars) if (o !== c && o.lane === lane) {
        const gap = (o.s - c.s) * lane.dir;
        if (gap > 0 && gap < 22) target = Math.min(target, Math.max(0, (gap - (o.m.userData.L + c.m.userData.L) / 2 - 2.5) * 1.2));
      }
      // pedestrian (player) ahead in lane
      const px = lane.ax === 'x' ? player.x : player.y, py = lane.ax === 'x' ? player.y : player.x;
      const pg = (px - c.s) * lane.dir;
      if (Math.abs(py - lane.c) < 1.8 && pg > 0 && pg < 14) target = Math.min(target, Math.max(0, (pg - c.m.userData.L / 2 - 1.6) * 1.0));
      c.v += THREE.MathUtils.clamp(target - c.v, -14 * dt, 4 * dt);
      c.s += c.v * dt * lane.dir;
      if (c.s * lane.dir > 82) c.s = -82 * lane.dir;
      const x = lane.ax === 'x' ? c.s : lane.c, y = lane.ax === 'x' ? lane.c : c.s;
      c.m.position.copy(P2W(x, y, 0));
      const heading = lane.ax === 'x' ? (lane.dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (lane.dir > 0 ? 0 : Math.PI);
      c.m.rotation.y = Math.PI - heading;
      c.m.userData.tail.emissiveIntensity = target < c.v - 0.5 ? 4 : 1.2;
      Object.assign(c.col, { x, y, hx: lane.ax === 'x' ? c.m.userData.L / 2 : c.m.userData.W / 2, hy: lane.ax === 'x' ? c.m.userData.W / 2 : c.m.userData.L / 2 });
    }
  }
  setNight(level) { for (const c of this.cars) c.m.userData.head.emissiveIntensity = 0.6 + level * 3; }
}

// ------------------------------------------------------------------------------------------ population
export async function populate(scene, collision, count = 14) {
  const peds = [];
  const species = SPECIES.map((s) => s.id);
  const slots = [];
  for (const sx of [1, -1]) for (const sy of [1, -1]) for (const lane of [0.5, 1.2]) slots.push(sidewalkRoute(sx, sy, lane));
  for (let i = 0; i < count; i++) {
    const sp = species[i % species.length];
    try {
      const g = await loadSpecies(sp);
      const ch = new Character(g, { outfit: { jacket: pick(JACKETS).color, hoodie: pick(HOODIES).color } });
      scene.add(ch.root);
      const p = new Pedestrian(ch, slots[i % slots.length]);
      collision.dynamic.push(p.collider);
      peds.push(p);
    } catch (e) { console.warn('npc load', sp, e); }
  }
  return peds;
}

/** Story NPC standing at a socket; turns to face the player when near. */
export class StoryNPC {
  constructor(ch, sock, name, role) {
    this.ch = ch; this.name = name; this.role = role;
    this.pos = { x: sock.x, y: sock.y }; this.base = sock.r || 0; this.h = sock.z ?? 0.13;
    this.ch.root.position.copy(P2W(sock.x, sock.y, this.h));
    this.heading = Math.PI - this.base;   // socket faces its -Y axis: plan dir (sin r, -cos r)
    this.collider = { t: 'circle', x: sock.x, y: sock.y, r: 0.35, n: name };
    this.idleClip = 'Idle';
  }
  update(dt, playerPos, camPos) {
    const dx = playerPos.x - this.pos.x, dy = playerPos.y - this.pos.y, d = Math.hypot(dx, dy);
    let want = this.facing ?? this.heading;
    if (d < 6) want = Math.atan2(dx, dy);
    let dd = want - this.heading; dd = Math.atan2(Math.sin(dd), Math.cos(dd)); this.heading += dd * Math.min(1, dt * 4);
    this.ch.root.rotation.y = Math.PI - this.heading;
    if (!this.ch.lock) this.ch.play(d < 4 && this.idleClip === 'Idle' ? 'Talk' : this.idleClip, 0.4);
    const vis = camPos.distanceTo(this.ch.root.position) < 70;
    this.ch.root.visible = vis && !this.hidden;
    if (vis) this.ch.update(dt);
  }
}
