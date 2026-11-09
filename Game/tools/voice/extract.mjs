// Extract user-visible English string literals from the game's UI and story files (not the question banks).
import fs from 'fs';
const SRC = new URL('../../src/', import.meta.url).pathname;
const skip = /^(curriculum\d*|edu|standards|glossary|readlevel|engine|world|city|lookfx|characters|race|arenas|mapview|multiplayer|interiors|districts|audio|controls|manip)\.js$/;
const files = fs.readdirSync(SRC).filter((f) => f.endsWith('.js') && !skip.test(f));
const out = new Set();
const lit = /'((?:[^'\\\n]|\\.){2,400})'/g;
for (const f of files) {
  const s = fs.readFileSync(SRC + f, 'utf8');
  for (const m of s.matchAll(lit)) {
    let t = m[1].replace(/\\'/g, "'");
    if (!/[A-Za-z]{2}/.test(t)) continue;
    if (/^[a-z0-9_.\-/#:\[\]=>*$]+$/i.test(t) && !/ /.test(t)) { if (!/^[A-Z][a-z]+$/.test(t)) continue; }   // ids, selectors, keys
    if (/^(\.|#|[a-z-]+:|data-|aria-|http|assets\/|src\/|Interact_|SOCKET_|real\.|https?:)/.test(t)) continue;
    if (/[{}<>;]|=>|\bfunction\b|\bconst\b/.test(t)) continue;
    if (/^[a-z]+( [a-z-]+)*$/.test(t) && t.split(' ').length <= 3 && !/ /.test(t) ) continue;   // single lowercase word: css class/key
    if (/^(primary|ghost|sm|big|tip|lead|act|row|bill|opt|key|chip|card|wide|hidden|button|div|span|small|textarea|input|p|b|h3|i|q|li|ul|ol|label|summary|details|svg|line|text|circle|path)( |$)/.test(t)) continue;
    out.add(t.trim());
  }
}
const arr = [...out].sort();
fs.writeFileSync(process.argv[2], JSON.stringify(arr, null, 0).replace(/","/g, '",\n"'));
console.log(arr.length, 'strings', arr.reduce((a, t) => a + t.length, 0), 'chars');
