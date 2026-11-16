// Pack the full-quality masters (hq/<id>.flac, made by gen2.mjs / gen_es2.py) as Opus clips:
//   public/voice/h<n>.ogg  +  an "o" table in manifest.json  { <voiceId(key)>: [pack, byteOffset, byteLength, ms] }
// Every clip is mastered on the way (see CHAIN below). Opus at 20 kbps is far cleaner than the old 24 kbps MP3 at a smaller size. The MP3 packs stay for devices without Opus.
// node packopus.mjs            (GAME=<path to Game/> when run from a copy outside the repo)
globalThis.document = { createElement: () => ({ getContext: () => ({}), style: {} }), querySelector: () => null, addEventListener: () => {}, createTreeWalker: () => ({ nextNode: () => null }) };
globalThis.window = globalThis; globalThis.localStorage = { getItem: () => null, setItem: () => {} };
import fs from 'fs'; import crypto from 'crypto'; import { spawn } from 'child_process'; import os from 'os';
const DIR = new URL('./', import.meta.url).pathname, GAME = process.env.GAME || new URL('../../', import.meta.url).pathname;
const OUT = GAME + 'public/voice/';
const { voiceId } = await import(GAME + 'src/readalong.js');
const KBPS = process.env.KBPS || '20', N = +(process.env.PACKS || 44);
const LISTS = (process.env.LISTS || 'sentences.json few_en.json new_en.json r2_en.json words.json new_w.json r2_w.json r3_en.json sentences_es.json few_es.json new_es.json r2_es.json r3_es.json words_es.json words_es_tpl.json').split(' ').filter((f) => fs.existsSync(DIR + f));
const sha = (k) => crypto.createHash('sha1').update(k).digest('hex').slice(0, 14);
fs.mkdirSync(DIR + 'opusm', { recursive: true });
const TRIM = 'silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.02,areverse,silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.03,areverse';
const seen = new Set(), jobs = [];
for (const f of LISTS) for (const [k] of JSON.parse(fs.readFileSync(DIR + f))) {
  const id = voiceId(k); if (seen.has(id)) continue; const src = `${DIR}hq/${sha(k)}.flac`; if (!fs.existsSync(src)) continue;
  seen.add(id); jobs.push({ id, k, src, out: `${DIR}opusm/${sha(k)}.ogg` });
}
// encode (resumable), a few at a time; single words lose the silence before and after so Heart can read word by word
const todo = jobs.filter((j) => !fs.existsSync(j.out)); let done = 0;
// Mastering, the same for every clip so Heart sounds like one steady voice in English and Spanish:
//   rumble cut, a little warmth, softer "s" sounds, gentle levelling inside the clip, then every clip brought to the same loudness
//   (measured on the voiced parts only) with a ceiling so nothing clips, and a 6 ms fade at each end so joined clips never click.
const CHAIN = 'highpass=f=70,bass=g=1.5:f=180:w=0.7,deesser=i=0.3:m=0.5:f=0.5:s=o,acompressor=threshold=-20dB:ratio=2:attack=8:release=140:makeup=1';
const SR = 24000, TARGET = +(process.env.TARGET || -19), CEIL = 0.84;
const run = (args, input) => new Promise((res, rej) => { const p = spawn('ffmpeg', args, { stdio: ['pipe', 'pipe', 'ignore'] }); const out = []; p.stdout.on('data', (d) => out.push(d)); p.on('error', rej); p.on('close', (c) => (c ? rej(new Error('ffmpeg ' + c)) : res(Buffer.concat(out)))); p.stdin.on('error', () => {}); p.stdin.end(input || undefined); });
const master = (raw) => {
  const x = new Float32Array(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength - (raw.byteLength % 4))), fr = 480, e = [];
  for (let i = 0; i + fr <= x.length; i += fr) { let s = 0; for (let j = 0; j < fr; j++) s += x[i + j] * x[i + j]; e.push(s / fr); }
  const top = Math.max(1e-9, ...e), v = e.filter((q) => q > top * 0.01), rms = 10 * Math.log10(Math.max(1e-9, v.reduce((a, q) => a + q, 0) / Math.max(1, v.length)));
  const g = Math.pow(10, Math.max(-14, Math.min(12, TARGET - rms)) / 20), knee = CEIL * 0.8, fade = Math.min(144, x.length >> 2);
  for (let i = 0; i < x.length; i++) { let y = x[i] * g; const a = Math.abs(y); if (a > knee) y = Math.sign(y) * (knee + (CEIL - knee) * Math.tanh((a - knee) / (CEIL - knee))); x[i] = y; }   // soft ceiling
  let last = e.length - 1; while (last > 0 && e[last] < top * 0.0005) last--;   // Kokoro leaves up to a second of silence after a line: keep a quarter second, so the next line follows naturally
  const end = Math.min(x.length, (last + 1) * fr + Math.round(0.25 * SR));
  for (let i = 0; i < fade; i++) { const f = i / fade; x[i] *= f; x[end - 1 - i] *= f; }
  return Buffer.from(x.buffer, 0, 4 * end);
};
const enc = async (j) => {
  try {
    const raw = await run(['-loglevel', 'error', '-i', j.src, '-af', CHAIN + (/^(w|esw):/.test(j.k) ? ',' + TRIM : ''), '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-']);
    if (raw.length < 4 * 240) throw new Error('empty');
    await run(['-loglevel', 'error', '-y', '-f', 'f32le', '-ar', String(SR), '-ac', '1', '-i', '-', '-c:a', 'libopus', '-b:a', KBPS + 'k', '-application', 'voip', '-frame_duration', '20', '-map_metadata', '-1', '-f', 'ogg', j.out + '.tmp'], master(raw));
    fs.renameSync(j.out + '.tmp', j.out);
  } catch (e) { console.log('failed', j.k.slice(0, 60), String(e.message).slice(0, 120)); }
  if (++done % 2000 === 0) console.log(`encoded ${done}/${todo.length}`);
};
await Promise.all([...Array(Math.max(2, os.cpus().length))].map(async () => { for (let j; (j = todo.pop());) await enc(j); }));
// length of an Ogg Opus clip in ms: the last page's granule position (48 kHz samples) minus the pre-skip
const ms = (b) => { const last = b.lastIndexOf('OggS'); const gp = Number(b.readBigUInt64LE(last + 6)); const head = b.indexOf('OpusHead'); const skip = head >= 0 ? b.readUInt16LE(head + 10) : 312; return Math.max(60, Math.round((gp - skip) / 48)); };
for (const f of fs.readdirSync(OUT)) if (/^h\d+\.ogg$/.test(f)) fs.rmSync(OUT + f);
const buckets = [...Array(N)].map(() => []); for (const j of jobs) if (fs.existsSync(j.out)) buckets[parseInt(j.id.slice(-4), 36) % N].push(j);
const o = {}; let bytes = 0, clips = 0, total = 0;
for (let p = 0; p < N; p++) {
  const parts = []; let off = 0;
  for (const j of buckets[p]) { const b = fs.readFileSync(j.out); const d = ms(b); o[j.id] = [p, off, b.length, d]; parts.push(b); off += b.length; clips++; total += d; }
  fs.writeFileSync(`${OUT}h${p}.ogg`, Buffer.concat(parts)); bytes += off;
}
const man = JSON.parse(fs.readFileSync(OUT + 'manifest.json')); man.o = o; man.v = 2;
fs.writeFileSync(OUT + 'manifest.json', JSON.stringify(man));
const missing = Object.keys(man.c).filter((id) => !o[id]).length;
console.log(`${clips} Opus clips · ${(total / 3.6e6).toFixed(1)} hours · ${N} packs · ${(bytes / 1048576).toFixed(1)} MB · ${missing} clips still only in MP3`);
