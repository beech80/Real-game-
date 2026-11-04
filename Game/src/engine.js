// REAL — rendering engine: renderer, sky + day/night, lighting, post FX, procedural surface textures.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export const isMobile = matchMedia('(pointer: coarse)').matches || /Android|iPhone|iPad/i.test(navigator.userAgent);

export class Engine {
  constructor(canvasHost) {
    this.quality = isMobile ? 'medium' : 'high';
    this.manualQuality = false;
    try { const q = localStorage.getItem('real.quality'); if (q) { this.quality = q; this.manualQuality = true; } } catch (e) {}
    let r;
    try { r = this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); }
    catch (e) { throw new Error('This browser could not start 3D graphics (WebGL). Try updating your browser or turning off Low Power Mode.'); }
    r.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.onContextLost && this.onContextLost(); });
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.0;
    r.shadowMap.enabled = this.quality !== 'low';
    r.shadowMap.type = this.quality === 'high' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
    canvasHost.appendChild(r.domElement);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 1500);
    this.clock = new THREE.Clock();
    const pm = new THREE.PMREMGenerator(r);
    this.envMap = pm.fromScene(new RoomEnvironment(r), 0.04).texture;
    this.scene.environment = this.envMap;
    this._setupLights();
    this._setupSky();
    this._setupPost();
    this.resize();
    addEventListener('resize', () => this.resize());
    this.timeOfDay = 17.5;
  }

  setQuality(q, auto = false) {
    this.quality = q;
    if (!auto) { this.manualQuality = true; try { localStorage.setItem('real.quality', q); } catch (e) {} }
    this.renderer.shadowMap.type = q === 'high' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
    this.renderer.shadowMap.enabled = q !== 'low';
    this.sun.castShadow = q !== 'low';
    const s = q === 'high' ? 2048 : 1024;
    this.sun.shadow.mapSize.set(s, s);
    if (this.sun.shadow.map) { this.sun.shadow.map.dispose(); this.sun.shadow.map = null; }
    this.bloom.enabled = q !== 'low' && this.halfOK;
    this.resize();
  }

  resize() {
    const w = innerWidth, h = innerHeight;
    const maxDpr = this.quality === 'high' ? 2 : this.quality === 'medium' ? 1.5 : 1.25;
    const dpr = Math.min(devicePixelRatio || 1, maxDpr);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h);
    this.composer.setPixelRatio(dpr);
    this.composer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.fov = w < h ? 68 : 55;   // portrait phones see more
    this.camera.updateProjectionMatrix();
  }

  _setupLights() {
    this.hemi = new THREE.HemisphereLight(0xbcd2ff, 0x3b3226, 0.9);
    this.scene.add(this.hemi);
    const sun = this.sun = new THREE.DirectionalLight(0xffd2a0, 2.6);
    sun.castShadow = this.quality !== 'low';
    const s = this.quality === 'high' ? 2048 : 1024;
    sun.shadow.mapSize.set(s, s);
    const c = sun.shadow.camera;
    c.left = -32; c.right = 32; c.top = 32; c.bottom = -32; c.near = 1; c.far = 220;
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.04;
    this.scene.add(sun, sun.target);
  }

  _setupSky() {
    const geo = new THREE.SphereGeometry(900, 32, 16);
    this.skyUniforms = {
      top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, bot: { value: new THREE.Color() },
      sunDir: { value: new THREE.Vector3(0, 1, 0) }, sunCol: { value: new THREE.Color() }, stars: { value: 0 },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.skyUniforms, side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 bot; uniform vec3 sunDir; uniform vec3 sunCol; uniform float stars; varying vec3 vDir;
        float hash(vec3 p){ p = fract(p*0.3183099+.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
        void main(){
          float h = vDir.y;
          vec3 c = h > 0.0 ? mix(mid, top, pow(clamp(h*1.6,0.0,1.0), 0.7)) : mix(mid, bot, clamp(-h*4.0,0.0,1.0));
          float d = max(dot(vDir, normalize(sunDir)), 0.0);
          c += sunCol * (pow(d, 600.0) * 3.0 + pow(d, 12.0) * 0.35 + pow(d, 3.0) * 0.12);
          if (stars > 0.0 && h > 0.05) { vec3 q = floor(vDir*320.0); float s = step(0.9975, hash(q)); c += vec3(s) * stars * smoothstep(0.05, 0.4, h); }
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    this.sky = new THREE.Mesh(geo, mat);
    this.sky.renderOrder = -1;
    this.scene.add(this.sky);
    this.scene.fog = new THREE.Fog(0xd9a7a0, 90, 520);
  }

  _setupPost() {
    // Half-float targets keep bloom smooth, but some mobile GPUs can't render to them: fall back to 8-bit.
    const ext = this.renderer.extensions;
    const halfOK = this.renderer.capabilities.isWebGL2 && (ext.has('EXT_color_buffer_float') || ext.has('EXT_color_buffer_half_float'));
    const rt = new THREE.WebGLRenderTarget(1, 1, { type: halfOK ? THREE.HalfFloatType : THREE.UnsignedByteType, samples: this.renderer.capabilities.isWebGL2 ? 4 : 0 });
    this.composer = new EffectComposer(this.renderer, rt);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.7, 0.45, 2.2);
    this.halfOK = halfOK;
    this.bloom.enabled = this.quality !== 'low' && halfOK;   // bloom's internal targets are half-float
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
  }

  // Keyframed palette for the time of day (hours 0..24). Sunset tuned to the REAL key art (purple/orange dusk).
  static PAL = [
    // h,   top,      mid,      bot,      sunCol,   sunI, hemiSky,  hemiGnd, hemiI, fog,      exposure, lampOn
    [0,    0x050816, 0x101a3a, 0x0a0e1c, 0x000000, 0.0, 0x334477, 0x111111, 0.35, 0x121a33, 1.15, 1],
    [5,    0x0b1230, 0x2a2850, 0x141626, 0x000000, 0.0, 0x405080, 0x151515, 0.4,  0x262848, 1.1,  1],
    [6.5,  0x3a5aa0, 0xf2a37a, 0x6a5560, 0xffb27a, 1.4, 0xb0b8e0, 0x4a3a2a, 0.7,  0xe0a890, 1.0,  0.4],
    [9,    0x3f78d8, 0xbfd8f2, 0x8a8f99, 0xfff1dc, 2.6, 0xcfe0ff, 0x5a4a38, 0.95, 0xc7d8ea, 0.95, 0],
    [13,   0x2f6fd6, 0xb8d6f5, 0x8a8f99, 0xffffff, 3.0, 0xd8e6ff, 0x5a4a38, 1.0,  0xc5d8ec, 0.92, 0],
    [16.5, 0x4a6fc0, 0xe6c9a8, 0x8a7f80, 0xffe0b0, 2.6, 0xd0d6f0, 0x5a4636, 0.9,  0xe0c8b0, 0.95, 0],
    [18.3, 0x3a3f8f, 0xf59a6a, 0x6a4a60, 0xff9a55, 2.1, 0xc8a8d8, 0x4a3226, 0.75, 0xd8907e, 1.0,  0.6],
    [19.4, 0x1c1f55, 0xb05a78, 0x2a2238, 0xff6a4a, 0.6, 0x7a6aa8, 0x2a1e1e, 0.55, 0x6a4060, 1.1,  1],
    [21,   0x070b22, 0x1a2050, 0x0c0f1e, 0x000000, 0.0, 0x3a4a80, 0x141414, 0.4,  0x161c3a, 1.15, 1],
    [24,   0x050816, 0x101a3a, 0x0a0e1c, 0x000000, 0.0, 0x334477, 0x111111, 0.35, 0x121a33, 1.15, 1],
  ];

  setTime(h, focus) {
    this.timeOfDay = h;
    const P = Engine.PAL;
    let i = 0;
    while (i < P.length - 2 && P[i + 1][0] <= h) i++;
    const a = P[i], b = P[i + 1];
    const t = THREE.MathUtils.clamp((h - a[0]) / (b[0] - a[0]), 0, 1);
    const lc = (x, y) => new THREE.Color(x).lerp(new THREE.Color(y), t);
    const ln = (x, y) => x + (y - x) * t;
    const U = this.skyUniforms;
    U.top.value.copy(lc(a[1], b[1])); U.mid.value.copy(lc(a[2], b[2])); U.bot.value.copy(lc(a[3], b[3]));
    // sun path: rises east (+x) ~6:00, sets west ~19:30; azimuth biased south so shadows read well
    const day = THREE.MathUtils.clamp((h - 6) / 13.5, 0, 1);
    const ang = day * Math.PI;
    const elev = Math.sin(ang) * 0.95 + (h < 6 || h > 19.5 ? -0.25 : 0);
    const dir = new THREE.Vector3(Math.cos(ang), Math.max(elev, 0.04), 0.55).normalize();
    U.sunDir.value.copy(dir);
    U.sunCol.value.copy(lc(a[4], b[4]));
    U.stars.value = THREE.MathUtils.clamp(1 - ln(a[5], b[5]) * 2, 0, 1) * (h < 6 || h > 19.5 ? 1 : 0);
    this.sun.color.copy(lc(a[4], b[4]));
    this.sun.intensity = ln(a[5], b[5]);
    this.hemi.color.copy(lc(a[6], b[6])); this.hemi.groundColor.copy(lc(a[7], b[7])); this.hemi.intensity = ln(a[8], b[8]);
    this.scene.fog.color.copy(lc(a[9], b[9]));
    this.renderer.toneMappingExposure = ln(a[10], b[10]);
    this.lampLevel = ln(a[11], b[11]);
    this.scene.environmentIntensity = 0.25 + 0.6 * Math.min(1, this.sun.intensity / 2.5);
    const f = focus || new THREE.Vector3();
    this.sun.position.copy(f).addScaledVector(dir, 120);
    this.sun.target.position.copy(f);
    this.sky.position.copy(this.camera.position);
  }

  /** Frame-rate guard: steps graphics down when the device can't keep up (unless the player chose a level). */
  adapt(dt) {
    if (this.manualQuality || this.quality === 'low') return null;
    this._fa = (this._fa || 0) + dt; this._fn = (this._fn || 0) + 1;
    if (this._fa < 3) return null;
    const fps = this._fn / this._fa; this._fa = 0; this._fn = 0;
    if (this._grace > 0) { this._grace--; return null; }
    if (fps < 26) { this.setQuality(this.quality === 'high' ? 'medium' : 'low', true); this._grace = 1; return this.quality; }
    return null;
  }

  render() {
    if (this.quality === 'low' || this.postFailed) { this.renderer.render(this.scene, this.camera); return; }
    try { this.composer.render(); }
    catch (e) { console.warn('post-processing disabled', e); this.postFailed = true; this.renderer.render(this.scene, this.camera); }
  }
}

// --------------------------------------------------------------------------------------------
// Procedural textures (canvas) — real-world scaled: 1 texture tile = 1 metre (our Blender UVs are metric).
function canvas(n) { const c = document.createElement('canvas'); c.width = c.height = n; return [c, c.getContext('2d')]; }
function rand(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

function noiseFill(g, n, base, amp, seed, size = 2) {
  const r = rand(seed);
  for (let y = 0; y < n; y += size) for (let x = 0; x < n; x += size) {
    const v = base + (r() - 0.5) * amp;
    g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, y, size, size);
  }
}

function heightToNormal(hc, strength = 2.0) {
  const n = hc.width, src = hc.getContext('2d').getImageData(0, 0, n, n).data;
  const [c, g] = canvas(n); const out = g.createImageData(n, n);
  const H = (x, y) => src[(((y + n) % n) * n + ((x + n) % n)) * 4] / 255;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const dx = (H(x + 1, y) - H(x - 1, y)) * strength, dy = (H(x, y + 1) - H(x, y - 1)) * strength;
    const l = Math.hypot(dx, dy, 1), i = (y * n + x) * 4;
    out.data[i] = (-dx / l * 0.5 + 0.5) * 255; out.data[i + 1] = (dy / l * 0.5 + 0.5) * 255; out.data[i + 2] = (1 / l * 0.5 + 0.5) * 255; out.data[i + 3] = 255;
  }
  g.putImageData(out, 0, 0); return c;
}

function tex(c, color = true) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function makeSurfaceTextures() {
  const T = {};
  { // brick: 1 m tile, 0.25 x 0.083 m bricks, running bond
    const n = 256, [c, g] = canvas(n), [hc, hg] = canvas(n); const r = rand(7);
    g.fillStyle = '#c9c4bd'; g.fillRect(0, 0, n, n); hg.fillStyle = '#000'; hg.fillRect(0, 0, n, n);
    const bh = n / 12, bw = n / 4;
    for (let row = 0; row < 12; row++) for (let col = -1; col < 5; col++) {
      const x = col * bw + (row % 2 ? bw / 2 : 0), y = row * bh, v = 215 + (r() - 0.5) * 70;
      g.fillStyle = `rgb(${v},${v * 0.97},${v * 0.95})`; g.fillRect(x + 2, y + 2, bw - 4, bh - 4);
      hg.fillStyle = `rgb(${200 + r() * 40},0,0)`; hg.fillRect(x + 2, y + 2, bw - 4, bh - 4);
    }
    for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.08})`; g.fillRect(r() * n, r() * n, 2, 2); }
    T.brick = tex(c); T.brickN = tex(heightToNormal(hc, 3), false);
  }
  { // paving slabs 1 m with joints
    const n = 256, [c, g] = canvas(n), [hc, hg] = canvas(n);
    noiseFill(g, n, 225, 26, 11); hg.fillStyle = '#fff'; hg.fillRect(0, 0, n, n);
    g.fillStyle = 'rgba(60,60,60,0.55)'; hg.fillStyle = '#000';
    for (const [x, y, w, h] of [[0, 0, n, 3], [0, 0, 3, n], [n / 2, 0, 2, n]]) { g.fillRect(x, y, w, h); hg.fillRect(x, y, w, h); }
    T.paving = tex(c); T.pavingN = tex(heightToNormal(hc, 2), false);
  }
  { // asphalt speckle
    const n = 256, [c, g] = canvas(n); noiseFill(g, n, 215, 60, 13, 2);
    const r = rand(5); for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.25})`; g.fillRect(r() * n, r() * n, 2, 2); }
    T.asphalt = tex(c);
  }
  { // concrete / plaster: soft noise
    const n = 256, [c, g] = canvas(n); noiseFill(g, n, 235, 22, 17, 4); T.concrete = tex(c);
  }
  { // grass: blade noise
    const n = 256, [c, g] = canvas(n); noiseFill(g, n, 200, 70, 19, 2);
    const r = rand(21); for (let i = 0; i < 1800; i++) { const v = 150 + r() * 105; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(r() * n, r() * n, 1, 4); }
    T.grass = tex(c);
  }
  { // wood planks (0.2 m boards) with grain
    const n = 256, [c, g] = canvas(n); const r = rand(23);
    for (let i = 0; i < 5; i++) { const v = 200 + r() * 50; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(0, i * n / 5, n, n / 5); }
    for (let i = 0; i < 300; i++) { g.strokeStyle = `rgba(0,0,0,${r() * 0.12})`; g.beginPath(); const y = r() * n; g.moveTo(0, y); g.bezierCurveTo(n / 3, y + 3, 2 * n / 3, y - 3, n, y); g.stroke(); }
    g.fillStyle = 'rgba(0,0,0,0.35)'; for (let i = 0; i < 5; i++) g.fillRect(0, i * n / 5, n, 2);
    T.wood = tex(c);
  }
  { // tile 0.25 m
    const n = 256, [c, g] = canvas(n), [hc, hg] = canvas(n); noiseFill(g, n, 245, 10, 29, 4); hg.fillStyle = '#fff'; hg.fillRect(0, 0, n, n);
    g.fillStyle = 'rgba(80,80,80,0.5)'; hg.fillStyle = '#000';
    for (let i = 0; i < 4; i++) { g.fillRect(i * n / 4, 0, 2, n); g.fillRect(0, i * n / 4, n, 2); hg.fillRect(i * n / 4, 0, 2, n); hg.fillRect(0, i * n / 4, n, 2); }
    T.tile = tex(c); T.tileN = tex(heightToNormal(hc, 1.5), false);
  }
  { // fabric weave (clothing)
    const n = 128, [c, g] = canvas(n); noiseFill(g, n, 235, 30, 31, 1);
    g.fillStyle = 'rgba(0,0,0,0.06)'; for (let i = 0; i < n; i += 3) { g.fillRect(i, 0, 1, n); g.fillRect(0, i, n, 1); }
    T.fabric = tex(c);
  }
  return T;
}

// Material name -> treatment
export function enhanceMaterial(m, T) {
  const n = m.name || '';
  const set = (map, nrm, rough, rep = 1) => {
    if (map) { m.map = map.clone(); m.map.repeat.set(rep, rep); m.map.needsUpdate = true; }
    if (nrm) { m.normalMap = nrm.clone(); m.normalMap.repeat.set(rep, rep); m.normalMap.needsUpdate = true; m.normalScale = new THREE.Vector2(0.8, 0.8); }
    if (rough !== undefined) m.roughness = rough;
  };
  if (/Brick/.test(n)) set(T.brick, T.brickN, 0.9);
  else if (/Sidewalk/.test(n)) set(T.paving, T.pavingN, 0.85, 0.5);
  else if (/Asphalt/.test(n)) set(T.asphalt, null, 0.92, 0.25);
  else if (/Concrete|Plaster/.test(n)) set(T.concrete, null, 0.85, 0.5);
  else if (/Grass/.test(n)) set(T.grass, null, 0.95, 0.5);
  else if (/Wood/.test(n)) set(T.wood, null, 0.6);
  else if (/Tile/.test(n)) set(T.tile, T.tileN, 0.25);
  else if (/Glass$/.test(n)) { m.transparent = true; m.opacity = 0.32; m.roughness = 0.05; m.metalness = 0.2; m.envMapIntensity = 1.6; m.depthWrite = false; }
  // keep bright paints/tiles below the bloom threshold in full sun
  if (/RoadLine|TileWhite|MAT_REAL_White$|Sidewalk|Plaster$/.test(n) && m.emissive.getHex() === 0) m.color.multiplyScalar(0.82);
  if (/Emit|GlassLit/.test(n)) m.userData.lamp = m.emissiveIntensity || 1;
  return m;
}
