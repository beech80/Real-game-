// Words that grow with the reader (node tests/grow.mjs): at level 1 every line is in its simple wording; each
// richer wording takes over at its own level and is really harder to read;
// and no simple line is missing from the game.
import fs from 'fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { tr, setReadLevel } = await import('../src/i18n.js');
const { grade } = await import('../src/readlevel.js');
const GROW = JSON.parse(fs.readFileSync(new URL('../src/i18n/grow.json', import.meta.url)));
const src = fs.readdirSync(new URL('../src/', import.meta.url)).filter((f) => /\.(js|html)$/.test(f)).map((f) => fs.readFileSync(new URL('../src/' + f, import.meta.url), 'utf8')).join('\n');
let bad = 0; const fail = (m) => { bad++; if (bad < 12) console.log('BAD', m); };
const at = {}; let harder = 0;
for (const [simple, [rich, lv]] of Object.entries(GROW)) {
  if (!src.includes(simple) && !src.includes(simple.replace(/'/g, "\\'"))) fail('not in the game: ' + simple);
  if (!(lv >= 3 && lv <= 6)) fail('level out of range: ' + simple);
  setReadLevel(1); if (tr(simple) !== simple) fail('level 1 is not simple: ' + simple);
  setReadLevel(lv - 1); if (tr(simple) !== simple) fail('grew too early: ' + simple);
  setReadLevel(lv); if (tr(simple) !== rich) fail('did not grow at level ' + lv + ': ' + simple);
  setReadLevel(6); if (tr('  ' + simple + ' ') !== '  ' + rich + ' ') fail('spaces lost: ' + simple);
  at[lv] = (at[lv] || 0) + 1; if (grade(rich) > grade(simple)) harder++;
}
const n = Object.keys(GROW).length;
console.log(n, 'lines grow · by level', JSON.stringify(at), '·', Math.round(harder / n * 100) + '% measure harder in their richer wording');
if (harder / n < 0.8) fail('the richer wordings are not harder');
for (const lv of [1, 3, 4, 5, 6]) { setReadLevel(lv); console.log('level', lv, '→', tr('A budget gives each dollar a job. Needs first. Then savings. Then wants.')); }
console.log(bad ? 'GROW FAILED' : 'GROW PASSED'); process.exit(bad ? 1 : 0);
