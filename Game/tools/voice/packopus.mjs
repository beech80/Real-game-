// Pack the full-quality masters (hq/<id>.flac, made by gen2.mjs / gen_es2.py) as Opus clips:
//   public/voice/h<n>.ogg  +  an "o" table in manifest.json  { <voiceId(key)>: [pack, byteOffset, byteLength, ms] }
// Opus at 20 kbps is far cleaner than the old 24 kbps MP3 at a smaller size. The MP3 packs stay for devices without Opus.
// node packopus.mjs            (GAME=<path to Game/> when run from a copy outside the repo)
globalThis.document = { createElement: () => ({ getContext: () => ({}), style: {} }), querySelector: () => null, addEventListener: () => {}, createTreeWalker: () => ({ nextNode: () => null }) };
globalThis.window = globalThis; globalThis.localStorage = { getItem: () => null, setItem: () => {} };
import fs from 'fs'; import crypto from 'crypto'; import { execFile } from 'child_process'; import os from 'os';
const DIR = new URL('./', import.meta.url).pathname, GAME = process.env.GAME || new URL('../../', import.meta.url).pathname;
const OUT = GAME + 'public/voice/';
const { voiceId } = await import(GAME + 'src/readalong.js');
const KBPS = process.env.KBPS || '20', N = +(process.env.PACKS || 44);
const LISTS = (process.env.LISTS || 'sentences.json few_en.json new_en.json r2_en.json words.json new_w.json r2_w.json sentences_es.json few_es.json new_es.json r2_es.json words_es.json words_es_tpl.json').split(' ').filter((f) => fs.existsSync(DIR + f));
const sha = (k) => crypto.createHash('sha1').update(k).digest('hex').slice(0, 14);
fs.mkdirSync(DIR + 'opus', { recursive: true });
const TRIM = 'silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.02,areverse,silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.03,areverse';
const seen = new Set(), jobs = [];
for (const f of LISTS) for (const [k] of JSON.parse(fs.readFileSync(DIR + f))) {
  const id = voiceId(k); if (seen.has(id)) continue; const src = `${DIR}hq/${sha(k)}.flac`; if (!fs.existsSync(src)) continue;
  seen.add(id); jobs.push({ id, k, src, out: `${DIR}opus/${sha(k)}.ogg` });
}
// encode (resumable), a few at a time; single words lose the silence before and after so Heart can read word by word
const todo = jobs.filter((j) => !fs.existsSync(j.out)); let done = 0;
const enc = (j) => new Promise((res) => execFile('ffmpeg', ['-loglevel', 'error', '-y', '-i', j.src, ...(/^w:/.test(j.k) ? ['-af', TRIM] : []), '-ac', '1', '-c:a', 'libopus', '-b:a', KBPS + 'k', '-application', 'voip', '-frame_duration', '20', '-map_metadata', '-1', '-f', 'ogg', j.out + '.tmp'], (e) => { if (!e) fs.renameSync(j.out + '.tmp', j.out); else console.log('failed', j.k.slice(0, 60), String(e.message).slice(0, 120)); if (++done % 2000 === 0) console.log(`encoded ${done}/${todo.length}`); res(); }));
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
