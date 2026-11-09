// Pack the recorded clips into small files the game downloads on demand: public/voice/p<n>.mp3 + manifest.json
// manifest: { v, n, c: { <voiceId(key)>: [pack, byteOffset, byteLength, ms] } }
globalThis.document = { createElement: () => ({ getContext: () => ({}), style: {} }), querySelector: () => null, addEventListener: () => {}, createTreeWalker: () => ({ nextNode: () => null }) };
globalThis.window = globalThis; globalThis.localStorage = { getItem: () => null, setItem: () => {} };
import fs from 'fs'; import crypto from 'crypto'; import { execFileSync } from 'child_process';
const DIR = new URL('./', import.meta.url).pathname, OUT = new URL('../../public/voice/', import.meta.url).pathname;
const { voiceId } = await import('../../src/readalong.js');
const all = ['sentences.json', 'words.json', 'sentences_es.json', 'words_es.json'].filter((f) => fs.existsSync(DIR + f)).flatMap((f) => JSON.parse(fs.readFileSync(DIR + f)));
const sha = (k) => crypto.createHash('sha1').update(k).digest('hex').slice(0, 14);
const N = +(process.env.PACKS || 48);
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const buckets = [...Array(N)].map(() => []); const c = {}; let have = 0, bytes = 0;
fs.mkdirSync(DIR + 'trim', { recursive: true });
// single words: trim the silence before and after, so Heart can read word by word at a natural pace
const trim = (src, k) => { const t = `${DIR}trim/${sha(k)}.mp3`; if (!fs.existsSync(t)) { try { execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', src, '-af', 'silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.02,areverse,silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.03,areverse', '-ac', '1', '-ar', '24000', '-b:a', '24k', t]); } catch (e) { return src; } } return t; };
for (const [k] of all) { let f = `${DIR}clips/${sha(k)}.mp3`; if (!fs.existsSync(f)) continue; if (k.startsWith('w:')) f = trim(f, k); const id = voiceId(k); if (c[id]) continue; buckets[parseInt(id.slice(-4), 36) % N].push([id, f]); c[id] = 1; have++; }
for (let p = 0; p < N; p++) {
  const parts = []; let off = 0;
  for (const [id, f] of buckets[p]) { const b = fs.readFileSync(f); c[id] = [p, off, b.length, Math.round(b.length * 8 / 24)]; parts.push(b); off += b.length; }
  fs.writeFileSync(`${OUT}p${p}.mp3`, Buffer.concat(parts)); bytes += off;
}
fs.writeFileSync(OUT + 'manifest.json', JSON.stringify({ v: 1, voice: 'Kokoro af_heart', n: N, c }));
console.log(`${have} of ${all.length} sentences recorded · ${N} packs · ${(bytes / 1048576).toFixed(1)} MB · manifest ${(fs.statSync(OUT + 'manifest.json').size / 1024).toFixed(0)} KB`);
