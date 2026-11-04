// REAL — pets that follow you, and the floating plush companion.
import * as THREE from 'three';
import { P2W } from './world.js';

const std = (color, rough = 0.85) => new THREE.MeshStandardMaterial({ color, roughness: rough });

export function makePet(type, color) {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const fur = std(color), dark = std(0x1b1b1f, 0.4), pink = std(0xf0a0b0), light = std(new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.45).getHex());
  const m = (geo, mat, x, y, z, parent = body) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.castShadow = true; parent.add(o); return o; };
  const small = type === 'bunny' ? 0.8 : type === 'kitten' ? 0.85 : 1;
  const torso = m(new THREE.SphereGeometry(0.2, 16, 12), fur, 0, 0.3, 0); torso.scale.set(0.9, 0.85, 1.45);
  m(new THREE.SphereGeometry(0.13, 12, 10), light, 0, 0.27, 0.12).scale.set(0.9, 0.8, 1.2);
  const head = new THREE.Group(); head.position.set(0, 0.47, 0.27); body.add(head);
  m(new THREE.SphereGeometry(0.15, 16, 12), fur, 0, 0, 0, head);
  m(new THREE.SphereGeometry(0.075, 12, 8), light, 0, -0.035, 0.11, head).scale.set(1.1, 0.8, 1);
  m(new THREE.SphereGeometry(0.025, 8, 6), type === 'puppy' ? dark : pink, 0, -0.01, 0.18, head);
  for (const s of [-1, 1]) {
    m(new THREE.SphereGeometry(0.024, 8, 6), dark, s * 0.06, 0.04, 0.125, head);
    if (type === 'puppy') { const e = m(new THREE.SphereGeometry(0.06, 10, 8), std(new THREE.Color(color).multiplyScalar(0.7).getHex()), s * 0.13, 0.02, -0.01, head); e.scale.set(0.5, 1.3, 0.9); e.rotation.z = s * 0.3; }
    else if (type === 'kitten') { const e = m(new THREE.ConeGeometry(0.055, 0.11, 4), fur, s * 0.08, 0.14, 0, head); e.rotation.z = -s * 0.25; }
    else { const e = m(new THREE.CapsuleGeometry(0.035, 0.16, 4, 8), fur, s * 0.05, 0.2, -0.02, head); e.rotation.z = -s * 0.15; }
  }
  const legs = [];
  for (const [x, z] of [[-0.09, 0.15], [0.09, 0.15], [-0.09, -0.15], [0.09, -0.15]]) { const l = m(new THREE.CapsuleGeometry(0.045, 0.14, 4, 8), fur, x, 0.12, z); legs.push(l); }
  const tail = type === 'bunny' ? m(new THREE.SphereGeometry(0.07, 10, 8), light, 0, 0.33, -0.3) : m(new THREE.CapsuleGeometry(0.03, type === 'kitten' ? 0.28 : 0.18, 4, 8), fur, 0, 0.4, -0.3);
  if (type !== 'bunny') tail.rotation.x = -0.7;
  g.scale.setScalar(small);
  g.userData = { body, head, legs, tail, type, t: Math.random() * 10 };
  return g;
}

/** Follows a target in plan coordinates, keeps a little distance, wags, hops (bunny). */
export class PetFollower {
  constructor(mesh) { this.m = mesh; this.pos = { x: 0, y: 0 }; this.heading = 0; this.trick = 0; this.speed = 0; }
  place(p) { this.pos = { x: p.x - 1, y: p.y - 1 }; }
  update(dt, target, ground, yOff = 0) {
    const U = this.m.userData; U.t += dt;
    const dx = target.x - this.pos.x, dy = target.y - this.pos.y, d = Math.hypot(dx, dy);
    if (d > 25) { this.place(target); }
    const want = d > 1.6 ? Math.min(6.5, (d - 1.2) * 2.2) : 0;
    this.speed += (want - this.speed) * Math.min(1, dt * 5);
    if (d > 0.01) { this.pos.x += dx / d * this.speed * dt; this.pos.y += dy / d * this.speed * dt; }
    if (this.speed > 0.2) { const th = Math.atan2(dx, dy); let dd = th - this.heading; dd = Math.atan2(Math.sin(dd), Math.cos(dd)); this.heading += dd * Math.min(1, dt * 8); }
    else { const th = Math.atan2(dx, dy); let dd = th - this.heading; dd = Math.atan2(Math.sin(dd), Math.cos(dd)); this.heading += dd * Math.min(1, dt * 2); }
    const moving = this.speed > 0.3, ph = U.t * (8 + this.speed * 2);
    U.legs.forEach((l, i) => { l.rotation.x = moving ? Math.sin(ph + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI / 2 : 0)) * 0.7 : 0; });
    U.tail.rotation.y = Math.sin(U.t * (moving ? 10 : 5)) * 0.5;
    let hop = U.type === 'bunny' && moving ? Math.abs(Math.sin(ph * 0.5)) * 0.15 : 0;
    if (this.trick > 0) { this.trick -= dt; hop = Math.sin((1 - this.trick) * Math.PI) * 0.4; U.body.rotation.y = (1 - this.trick) * Math.PI * 2; } else U.body.rotation.y = 0;
    U.head.rotation.x = moving ? 0 : Math.sin(U.t * 1.3) * 0.08;
    this.m.position.copy(P2W(this.pos.x, this.pos.y, ground(this.pos.x, this.pos.y) + yOff + hop));
    this.m.rotation.y = Math.PI - this.heading;
  }
}

export function makeCompanion(kind) {
  const g = new THREE.Group();
  const colors = { fox: 0xe8823a, bunny: 0xf1ece4, bear: 0xa0704a, cat: 0x8a8d96, dog: 0xc98a4a, horse: 0x7a5230, bird: 0x2a9fd6, elephant: 0x9aa0ab, lion: 0xe0a83a, cow: 0xf1f1f1, dolphin: 0x6fa8dc };
  const fur = new THREE.MeshStandardMaterial({ color: colors[kind] || 0xe8823a, roughness: 1, emissive: colors[kind] || 0xe8823a, emissiveIntensity: 0.15 });
  const cream = new THREE.MeshStandardMaterial({ color: 0xfff4e0, roughness: 1 }), eye = new THREE.MeshStandardMaterial({ color: 0x1b1b1f, roughness: 0.3 });
  const add = (geo, mat, x, y, z) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); g.add(o); return o; };
  add(new THREE.SphereGeometry(0.13, 16, 12), fur, 0, 0.16, 0);
  add(new THREE.SphereGeometry(0.1, 14, 10), fur, 0, 0, 0).scale.set(1, 0.9, 0.85);
  add(new THREE.SphereGeometry(0.06, 10, 8), cream, 0, 0.12, 0.1).scale.set(1.2, 0.8, 0.6);
  for (const s of [-1, 1]) { add(new THREE.SphereGeometry(0.02, 8, 6), eye, s * 0.05, 0.19, 0.115); const e = add(kind === 'bunny' ? new THREE.CapsuleGeometry(0.03, 0.12, 4, 8) : new THREE.SphereGeometry(0.05, 10, 8), fur, s * 0.08, kind === 'bunny' ? 0.33 : 0.27, 0); if (kind === 'fox' || kind === 'cat') { e.scale.set(0.8, 1.4, 0.5); } }
  const glow = new THREE.PointLight(0xffd9a0, 0.6, 2.5, 2); glow.position.y = 0.1; g.add(glow);
  g.userData.t = 0;
  return g;
}
export function updateCompanion(c, dt, playerRoot, heading) {
  c.userData.t += dt; const t = c.userData.t;
  const side = new THREE.Vector3(Math.cos(heading) * 0.55, 0, Math.sin(heading) * 0.55);
  const want = playerRoot.position.clone().add(side).add(new THREE.Vector3(0, 1.55 + Math.sin(t * 2) * 0.06, 0));
  c.position.lerp(want, Math.min(1, dt * 4));
  c.rotation.y = Math.PI - heading + Math.sin(t * 0.7) * 0.3;
}
