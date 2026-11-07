// Story, goal, message and pop-up text: every long word (4+ syllables) a young reader meets is either a common word
// or has a tap-to-see meaning in the glossary; and no story line reads above grade 10 (ignoring place names).
import fs from 'fs';
import { grade, hardWords } from '../src/readlevel.js';
import { lookup } from '../src/glossary.js';
const EASY = new Set(['everything', 'everybody', 'everyone', 'interesting', 'carefully', 'everyday', 'actually', 'usually', 'probably', 'especially', 'immediately', 'unbelievable', 'definitely', 'absolutely', 'eventually', 'already']);
const PLACES = /Opportunity District|Small Business Center|Community Center|Starter Apartments|Starting District|Brighter Park|Main St|Fresh Mart|Daily Grind|The Heights|Midtown|Opportunity/g;
const ADULT = /Grown-ups|claude\.ai|Learning records|skills in six levels|age-appropriate/;   // parent/teacher notes
const files = ['game.js', 'expansion.js', 'adventures.js', 'main.js', 'careers.js', 'events.js', 'arenas.js', 'pets.js', 'race.js'];
const bad = []; let n = 0;
for (const f of files) {
  const src = fs.readFileSync(new URL('../src/' + f, import.meta.url), 'utf8');
  const re = /(UI\.say\([^,]+,\s*|UI\.toast\(|T\(|message\([^,]+,\s*|caption\(\[|intro: |text: |\[)(['`])((?:\\.|(?!\2)[^\n]){25,}?)\2/g; let m;
  while ((m = re.exec(src))) {
    const t = m[3].replace(/\$\{[^}]*\}/g, 'X');
    if (!/[a-z]{3,} [a-z]{3,} [a-z]{2,}/i.test(t) || /=>|\bconst\b|class:|rgba|\bq: /.test(t) || ADULT.test(t)) continue;
    n++;
    const line = src.slice(0, m.index).split('\n').length;
    const hw = hardWords(t).filter((w) => !lookup(w) && !EASY.has(w.toLowerCase().replace(/[’'].*$/, '')) && !/-/.test(w));
    if (hw.length) bad.push(`${f}:${line} unexplained hard word(s) ${hw.join(', ')}: ${t.slice(0, 90)}`);
    const g = grade(t.replace(PLACES, 'park'));
    if (g > 10 && t.split(' ').length > 6) bad.push(`${f}:${line} reads at grade ${g.toFixed(1)}: ${t.slice(0, 90)}`);
  }
}
console.log(`checked ${n} lines of story text`);
for (const b of bad) console.log(b);
console.log(bad.length ? 'STORYTEXT FAILED' : 'STORYTEXT PASSED');
process.exit(bad.length ? 1 : 0);
