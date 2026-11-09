// Add newly recorded clips WITHOUT rewriting the existing packs (so git history doesn't grow by the whole voice):
// node addpack.mjs <list.json> ...  → clips not yet in manifest.json go into one new pack p<n>.mp3.
globalThis.document = { createElement: () => ({ getContext: () => ({}), style: {} }), querySelector: () => null, addEventListener: () => {}, createTreeWalker: () => ({ nextNode: () => null }) };
globalThis.window = globalThis; globalThis.localStorage = { getItem: () => null, setItem: () => {} };
import fs from 'fs'; import crypto from 'crypto';
const DIR = new URL('./', import.meta.url).pathname, OUT = new URL('../../public/voice/', import.meta.url).pathname;
const { voiceId } = await import('../../src/readalong.js');
const man = JSON.parse(fs.readFileSync(OUT + 'manifest.json'));
const sha = (k) => crypto.createHash('sha1').update(k).digest('hex').slice(0, 14);
const p = 1 + Math.max(...Object.values(man.c).map((v) => v[0]));
const parts = []; let off = 0;
for (const f of process.argv.slice(2)) for (const [k] of JSON.parse(fs.readFileSync(f))) {
  const clip = `${DIR}clips/${sha(k)}.mp3`, id = voiceId(k);
  if (man.c[id] || !fs.existsSync(clip)) continue;
  const b = fs.readFileSync(clip); man.c[id] = [p, off, b.length, Math.round(b.length * 8 / 24)]; parts.push(b); off += b.length;
}
if (!parts.length) { console.log('nothing new'); process.exit(0); }
fs.writeFileSync(`${OUT}p${p}.mp3`, Buffer.concat(parts)); man.n = p + 1;
fs.writeFileSync(OUT + 'manifest.json', JSON.stringify(man));
console.log(`${parts.length} clips → p${p}.mp3 (${(off / 1024).toFixed(0)} KB)`);
