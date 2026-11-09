// Pull every player-visible template string (`text ${x} more`) from the UI/story files as a pattern "text {0} more".
import fs from 'fs';
const SRC = new URL('../../src/', import.meta.url).pathname;
const skip = /^(curriculum\d*|edu|standards|glossary|readlevel|engine|world|city|lookfx|characters|race|arenas|mapview|multiplayer|interiors|districts|audio|controls|manip|i18n|version)\.js$/;
const out = new Set();
for (const f of fs.readdirSync(SRC).filter((f) => f.endsWith('.js') && !skip.test(f))) {
  const s = fs.readFileSync(SRC + f, 'utf8');
  for (let i = 0; i < s.length; i++) {
    if (s[i] !== '`') continue;
    // scan a template literal, tracking ${ } depth (skip nested templates inside expressions)
    let j = i + 1, pat = '', n = 0, ok = true;
    while (j < s.length && s[j] !== '`') {
      if (s[j] === '\\') { pat += s[j + 1]; j += 2; continue; }
      if (s[j] === '$' && s[j + 1] === '{') { let d = 1; j += 2; while (j < s.length && d) { if (s[j] === '{') d++; else if (s[j] === '}') d--; else if (s[j] === '`') { ok = false; } j++; } pat += `{${n++}}`; continue; }
      pat += s[j]; j++;
    }
    i = j;
    if (!ok || !n) continue;
    const t = pat.trim();
    if (!/[A-Za-z]{3}.*\s/.test(t.replace(/\{\d+\}/g, ''))) continue;   // needs real words
    if (/[<>;=]|=>|\bfunction\b|https?:|^[.#]|\b(px|rgba|var\(|translate|rotate)\b|^\{0\}$/.test(t)) continue;
    if (t.replace(/\{\d+\}/g, '').replace(/[^A-Za-z]/g, '').length < 4) continue;
    out.add(t);
  }
}
const arr = [...out].sort();
fs.writeFileSync(process.argv[2], JSON.stringify(arr).replace(/","/g, '",\n"'));
console.log(arr.length, 'patterns');
