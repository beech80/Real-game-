// REAL — audio: synthesized SFX + generative lo-fi soundtrack (no files to download).
export class Audio {
  constructor() { this.ctx = null; this.on = true; try { this.on = localStorage.getItem('real.sound') !== 'off'; } catch (e) {} }
  start() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.gain.value = this.on ? 0.8 : 0; this.master.connect(this.ctx.destination);
    this.musicBus = this.ctx.createGain(); this.musicBus.gain.value = 0.22;
    const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1600;
    this.musicBus.connect(lp); lp.connect(this.master);
    this._music();
  }
  toggle() { this.on = !this.on; try { localStorage.setItem('real.sound', this.on ? 'on' : 'off'); } catch (e) {} if (this.master) this.master.gain.value = this.on ? 0.8 : 0; return this.on; }
  tone(f, t0, dur, type = 'sine', vol = 0.2, bus) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(bus || this.master); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  /** Wind across the empty fields (Chapter 1). level 0..1, smoothed. */
  wind(level) {
    if (!this.ctx) return;
    if (!this.windNode) {
      const c = this.ctx, len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
      let b = 0; for (let i = 0; i < len; i++) { b = 0.985 * b + 0.015 * (Math.random() * 2 - 1); d[i] = b * 3; }
      const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 500; bp.Q.value = 0.6;
      const lfo = c.createOscillator(); lfo.frequency.value = 0.13; const lg = c.createGain(); lg.gain.value = 220; lfo.connect(lg); lg.connect(bp.frequency); lfo.start();
      this.windGain = c.createGain(); this.windGain.gain.value = 0;
      src.connect(bp); bp.connect(this.windGain); this.windGain.connect(this.master); src.start(); this.windNode = src;
    }
    const g = this.windGain.gain; g.value += ((level ? 0.5 : 0) - g.value) * 0.02;
    if (this.musicBus) this.musicBus.gain.value += ((level ? 0.06 : 0.22) - this.musicBus.gain.value) * 0.02;
  }
  play(name) {
    if (!this.ctx || !this.on) return;
    const t = this.ctx.currentTime;
    const S = {
      click: () => this.tone(880, t, 0.06, 'triangle', 0.08),
      scan: () => { this.tone(1760, t, 0.09, 'square', 0.05); },
      coin: () => { this.tone(1318, t, 0.12, 'triangle', 0.12); this.tone(1975, t + 0.07, 0.3, 'triangle', 0.1); },
      cash: () => { [1046, 1318, 1568, 2093].forEach((f, i) => this.tone(f, t + i * 0.06, 0.35, 'triangle', 0.1)); },
      good: () => { this.tone(659, t, 0.15, 'sine', 0.15); this.tone(988, t + 0.1, 0.3, 'sine', 0.15); },
      bad: () => { this.tone(220, t, 0.18, 'sawtooth', 0.06); this.tone(185, t + 0.12, 0.25, 'sawtooth', 0.06); },
      level: () => { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, t + i * 0.09, 0.4, 'triangle', 0.12)); },
      door: () => { this.tone(330, t, 0.25, 'sine', 0.1); this.tone(247, t + 0.1, 0.3, 'sine', 0.08); },
      phone: () => { this.tone(1200, t, 0.05, 'sine', 0.08); this.tone(1600, t + 0.06, 0.08, 'sine', 0.08); },
      msg: () => { this.tone(1046, t, 0.12, 'sine', 0.1); this.tone(1568, t + 0.12, 0.2, 'sine', 0.1); },
    };
    S[name] && S[name]();
  }
  _music() {
    // Lo-fi progression: Fmaj7 – Em7 – Dm7 – Cmaj7 at 76 BPM; soft keys + bass + gentle hat
    const c = this.ctx, beat = 60 / 76;
    const chords = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]];
    const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
    let bar = 0, next = c.currentTime + 0.2;
    const noise = c.createBuffer(1, c.sampleRate * 0.05, c.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const sched = () => {
      while (next < c.currentTime + 1.5) {
        const ch = chords[bar % 4];
        ch.forEach((m, i) => this.tone(mtof(m + 12), next + i * 0.015, beat * 3.6, 'triangle', 0.05, this.musicBus));
        this.tone(mtof(ch[0] - 12), next, beat * 1.8, 'sine', 0.14, this.musicBus);
        this.tone(mtof(ch[2] - 12), next + beat * 2, beat * 1.6, 'sine', 0.11, this.musicBus);
        for (let k = 0; k < 8; k++) {
          const s = c.createBufferSource(); s.buffer = noise; const g = c.createGain(); g.gain.value = k % 2 ? 0.015 : 0.03;
          const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 6000;
          s.connect(hp); hp.connect(g); g.connect(this.musicBus); s.start(next + k * beat / 2 + (k % 2 ? 0.03 : 0));
        }
        if (bar % 2 === 1) [0, 1.5, 2.5].forEach((b, i) => this.tone(mtof(ch[(i + 1) % 4] + 24), next + b * beat, beat * 0.9, 'sine', 0.03, this.musicBus));
        next += beat * 4; bar++;
      }
      setTimeout(sched, 400);
    };
    sched();
  }
}
