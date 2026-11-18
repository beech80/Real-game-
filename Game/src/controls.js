import { screenOpen } from './keyboard.js';
// REAL — input (touch joystick + camera drag, keyboard/mouse), third-person camera, player controller.
import * as THREE from 'three';
import { P2W } from './world.js';

export class Input {
  constructor(el) {
    this.el = el;
    this.move = new THREE.Vector2();   // x right, y forward
    this.look = new THREE.Vector2();   // accumulated drag delta
    this.keys = new Set();
    this.sprint = false;
    this.enabled = true;
    this.joy = { id: null, ox: 0, oy: 0, x: 0, y: 0 };
    this.cam = { id: null, x: 0, y: 0 };
    this.zoom = 0; this.pad = { on: false, x: 0, y: 0 };
    const base = document.getElementById('joy-base'), knob = document.getElementById('joy-knob');
    this.base = base; this.knob = knob;
    el.addEventListener('pointerdown', (e) => this._down(e));
    addEventListener('pointermove', (e) => this._moveP(e));
    addEventListener('pointerup', (e) => this._up(e));
    addEventListener('pointercancel', (e) => this._up(e));
    el.addEventListener('wheel', (e) => { this.zoom += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
    addEventListener('keydown', (e) => { if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return; if (screenOpen()) { this.keys.clear(); return; }   // menus get the keyboard first
      this.keys.add(e.code); if (e.code === 'KeyE' || e.code === 'Space') { e.preventDefault(); this.onInteract && this.onInteract(); } if (e.code === 'KeyP' || e.code === 'Tab') { e.preventDefault(); this.onPhone && this.onPhone(); } });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
  }
  _down(e) {
    if (!this.enabled) return;
    const r = this.el.getBoundingClientRect();
    const left = (e.clientX - r.left) < r.width * 0.45;   // relative to the game view, robust to any page zoom/embedding
    if (left && this.joy.id === null && e.pointerType !== 'mouse') {
      this.joy = { id: e.pointerId, ox: e.clientX, oy: e.clientY, x: 0, y: 0 };
      this.base.style.left = (e.clientX - r.left) + 'px'; this.base.style.top = (e.clientY - r.top) + 'px'; this.base.classList.add('on');
    } else if (this.cam.id === null) {
      this.cam = { id: e.pointerId, x: e.clientX, y: e.clientY };
    }
  }
  _moveP(e) {
    if (e.pointerId === this.joy.id) {
      let dx = e.clientX - this.joy.ox, dy = e.clientY - this.joy.oy;
      const R = 56, d = Math.hypot(dx, dy);
      if (d > R) { dx *= R / d; dy *= R / d; }
      this.joy.x = dx / R; this.joy.y = -dy / R;
      this.knob.style.transform = `translate(${dx}px, ${dy}px)`;
    } else if (e.pointerId === this.cam.id) {
      const k = e.pointerType === 'mouse' ? 1 : Math.max(0.6, Math.min(1.25, 430 / Math.min(innerWidth, innerHeight)));   // a swipe across a tablet turns you as far as the same swipe across a phone
      this.look.x += (e.clientX - this.cam.x) * k; this.look.y += (e.clientY - this.cam.y) * k;
      this.cam.x = e.clientX; this.cam.y = e.clientY;
    }
  }
  _up(e) {
    if (e.pointerId === this.joy.id) { this.joy = { id: null, x: 0, y: 0 }; this.knob.style.transform = ''; this.base.classList.remove('on'); this.base.style.left = ''; this.base.style.top = ''; }
    if (e.pointerId === this.cam.id) this.cam = { id: null };
  }
  /** game controller (Xbox / PlayStation / Switch layouts): left stick moves, right stick looks, A talks or uses, B or a trigger runs, Start opens the phone */
  _pad() {
    const P = this.pad; P.on = false;
    let g = null; try { for (const x of navigator.getGamepads ? navigator.getGamepads() : []) if (x && x.connected && x.axes.length >= 2) { g = x; break; } } catch (e) {}
    if (!g || !this.enabled) { P.x = P.y = 0; P.sprint = false; return; }
    const now = performance.now(), dt = Math.min(0.05, (now - (P.t || now)) / 1000); P.t = now;
    const dead = (v) => (Math.abs(v) < 0.18 ? 0 : (v - Math.sign(v) * 0.18) / 0.82), b = (i) => !!(g.buttons[i] && g.buttons[i].pressed);
    P.on = true; P.x = dead(g.axes[0]); P.y = -dead(g.axes[1]);
    if (b(12)) P.y = 1; if (b(13)) P.y = -1; if (b(14)) P.x = -1; if (b(15)) P.x = 1;   // d-pad
    if (g.axes.length >= 4) { const lx = dead(g.axes[2]), ly = dead(g.axes[3]); this.look.x += lx * Math.abs(lx) * 420 * dt; this.look.y += ly * Math.abs(ly) * 300 * dt; }
    P.sprint = b(1) || b(7) || b(10);
    const a = b(0), st = b(9) || b(3);
    if (a && !P.a && !screenOpen()) this.onInteract && this.onInteract();
    if (st && !P.st && !screenOpen()) this.onPhone && this.onPhone();
    P.a = a; P.st = st;
  }
  read() {
    const k = this.keys;
    let x = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
    let y = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
    if (this.joy.id !== null) {   // thumb stick: a small dead zone so a resting thumb does not drift, then a smooth ramp to full speed
      const m = Math.hypot(this.joy.x, this.joy.y), dz = 0.14, k = m <= dz ? 0 : Math.min(1, (m - dz) / (0.94 - dz)) / m;
      x = this.joy.x * k; y = this.joy.y * k;
    }
    this._pad();
    if (this.pad.on) { if (Math.hypot(this.pad.x, this.pad.y) > Math.hypot(x, y)) { x = this.pad.x; y = this.pad.y; } }
    this.move.set(x, y);
    if (this.move.length() > 1) this.move.normalize();
    this.sprint = k.has('ShiftLeft') || k.has('ShiftRight') || (this.joy.id !== null && Math.hypot(this.joy.x, this.joy.y) > 0.7 && this.sprintLatch) || (this.pad.on && this.pad.sprint);
    if (!this.enabled) this.move.set(0, 0);
    return this.move;
  }
}

export class FollowCamera {
  constructor(camera) {
    this.cam = camera;
    this.yaw = 0;              // camera south of the player, looking north (+plan y)
    this.pitch = 0.32;
    this.dist = 5.2;
    this.target = new THREE.Vector3();
    this.cur = new THREE.Vector3();
    this.mode = 'follow';
    this.minDist = 2.2; this.maxDist = 9;
  }
  update(dt, focus, input, indoor) {
    if (this.mode !== 'follow') return;
    const now = performance.now();
    if (input) {
      if (input.look.x || input.look.y || input.zoom) this.lastLook = now;
      this.yaw -= input.look.x * 0.006; this.pitch = THREE.MathUtils.clamp(this.pitch + input.look.y * 0.004, this.first ? -0.9 : 0.05, 1.1);
      input.look.set(0, 0);
      if (input.zoom) { this.dist = THREE.MathUtils.clamp(this.dist + input.zoom * 0.5, this.minDist, this.maxDist); input.zoom = 0; }
    }
    // walking: ease back behind the player unless they've just turned the camera themselves
    if (this.follow != null && now - (this.lastLook || 0) > 1500) {
      const dy = Math.atan2(Math.sin(-this.follow - this.yaw), Math.cos(-this.follow - this.yaw));
      if (Math.abs(dy) < 2.3) this.yaw += dy * Math.min(1, dt * 1.4);
    }
    const portrait = this.cam.aspect < 1;   // tall phone screens: step back a little outdoors so you see around you
    const d = indoor ? Math.min(this.dist, typeof indoor === 'number' ? indoor : 3.6) : this.dist * (portrait ? 1.12 : 1);
    // glide the look-at point instead of snapping to every footstep: steady, smooth camera on slow phones too
    const goal = focus.clone().add(new THREE.Vector3(0, 1.15, 0));
    if (!this.tSm || this.snap || this.tSm.distanceTo(goal) > 6) this.tSm = goal.clone(); else this.tSm.lerp(goal, 1 - Math.exp(-dt * 14));
    this.target.copy(this.tSm);
    if (this.first) {   // first person: the camera is the player's eyes
      if (!this.wasFirst) { this.wasFirst = true; this.pitch = Math.min(this.pitch, 0.08); }
      const p = this.pitch, fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw);
      this.cur.set(this.tSm.x + fx * 0.12, this.tSm.y + (this.eye || 0.3), this.tSm.z + fz * 0.12); this.snap = false;
      this.cam.position.copy(this.cur);
      this.target.set(this.cur.x + fx * Math.cos(p), this.cur.y - Math.sin(p), this.cur.z + fz * Math.cos(p));
      this.cam.lookAt(this.target); this.pitchNow = p;
      return;
    }
    if (this.wasFirst) { this.wasFirst = false; this.pitch = Math.max(this.pitch, 0.25); this.snap = true; }
    // some spaces need a higher view (over shelves): ease toward it without overwriting the player's own tilt
    this.pitchNow = this.pitchNow == null ? this.pitch : this.pitchNow + (Math.max(this.pitch, this.minPitch || 0) - this.pitchNow) * Math.min(1, dt * 6);
    const pitch = this.pitchNow;
    // the view glides to where you turned it (a very short ease), so small thumb movements do not jitter the picture
    if (this.yawNow == null || this.snap || Math.abs(this.yaw - this.yawNow) > 1.2) this.yawNow = this.yaw; else this.yawNow += (this.yaw - this.yawNow) * (1 - Math.exp(-dt * 28));
    const yw = this.yawNow;
    const off = new THREE.Vector3(Math.sin(yw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yw) * Math.cos(pitch)).multiplyScalar(d);
    const want = this.target.clone().add(off);
    if (this.clamp) this.clamp(want, this.target);
    const reach = want.distanceTo(this.target);
    if (reach < 1.3) {   // tight spot (wall right behind): look down over the shoulder instead of into the back of the head
      const hz = new THREE.Vector3(off.x, 0, off.z).normalize(); let best = reach + 0.1;
      const cands = [this.target.clone().addScaledVector(hz, 0.6).add(new THREE.Vector3(0, 1.5, 0)), this.target.clone().add(new THREE.Vector3(hz.x * 0.25, 1.9, hz.z * 0.25))];
      for (const a of [0.9, -0.9]) { const y = this.yaw + a; cands.push(this.target.clone().add(new THREE.Vector3(Math.sin(y) * Math.cos(pitch), Math.sin(pitch), Math.cos(y) * Math.cos(pitch)).multiplyScalar(d))); }
      for (const alt of cands) { if (this.clamp) this.clamp(alt, this.target); const r = alt.distanceTo(this.target); if (r > best + 0.15) { best = r; want.copy(alt); } }
    }
    // pull in fast when something blocks the view, glide back out gently
    const pullIn = want.distanceTo(this.target) < this.cur.distanceTo(this.target) - 0.05;
    if (this.snap) { this.cur.copy(want); this.snap = false; } else this.cur.lerp(want, 1 - Math.exp(-dt * (pullIn ? 22 : 7)));
    if (this.cur.distanceTo(want) > 12) this.cur.copy(want);
    this.cam.position.copy(this.cur);
    this.cam.lookAt(this.target);
  }
  // camera-relative movement basis
  basis() {
    const f = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const r = new THREE.Vector3(-f.z, 0, f.x);
    return { f, r };
  }
}

export class Player {
  constructor(character) {
    this.ch = character;
    this.pos = { x: 22, y: -6.0 };      // plan coords
    this.h = 0.13;
    this.heading = 0;
    this.vel = new THREE.Vector2();
    this.radius = 0.3;
    this.speedMul = 1;
  }
  update(dt, input, cam, collision, groundFn, bounds) {
    const m = input.read();
    const { f, r } = cam.basis();
    let dir = new THREE.Vector3().addScaledVector(f, m.y).addScaledVector(r, m.x);
    if (input.autoDir && dir.lengthSq() < 0.02) dir = new THREE.Vector3(input.autoDir.x, 0, -input.autoDir.y).normalize().multiplyScalar(0.92);   // 🧭 walking to the goal by itself
    const mag = Math.min(1, dir.length());
    const top = (input.sprint ? 5.4 : 0.6 + 2.7 * mag * mag * (3 - 2 * mag)) * this.speedMul;   // a gentle push walks, a full push jogs: one smooth ramp, no sudden jump
    const want = new THREE.Vector2(dir.x, -dir.z);   // plan space
    if (want.lengthSq() > 1e-4) want.normalize().multiplyScalar(mag < 0.05 ? 0 : top);
    else want.set(0, 0);
    this.vel.lerp(want, 1 - Math.exp(-dt * 9));
    const p = { x: this.pos.x + this.vel.x * dt, y: this.pos.y + this.vel.y * dt };
    collision.resolve(p, this.radius);
    if (typeof bounds === 'function') bounds(p);
    else if (bounds) { p.x = THREE.MathUtils.clamp(p.x, bounds[0], bounds[2]); p.y = THREE.MathUtils.clamp(p.y, bounds[1], bounds[3]); }
    const moved = Math.hypot(p.x - this.pos.x, p.y - this.pos.y) / Math.max(dt, 1e-4);
    this.pos = p;
    const gh = groundFn ? groundFn(p.x, p.y) : 0;
    this.h += (gh - this.h) * Math.min(1, dt * 14);
    if (this.vel.lengthSq() > 0.05) {
      const targetHeading = Math.atan2(this.vel.x, this.vel.y);   // plan: 0 = facing +y
      let d = targetHeading - this.heading; d = Math.atan2(Math.sin(d), Math.cos(d));
      this.heading += d * Math.min(1, dt * 12);
    }
    this.ch.locomote(Math.min(moved, this.vel.length()), dt);
    this.apply();
    return moved;
  }
  apply() {
    this.ch.root.position.copy(P2W(this.pos.x, this.pos.y, this.h));
    // model faces -Y (Blender) == +Z three ... plan heading 0 = +y plan = -z three
    this.ch.root.rotation.y = Math.PI - this.heading;
  }
  world() { return P2W(this.pos.x, this.pos.y, this.h); }
}
