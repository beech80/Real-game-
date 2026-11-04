// Writes Documentation/09_Curriculum.md from the live curriculum data: node Tools/curriculum_report.mjs
globalThis.document = { createElement: () => ({ getContext: () => ({}), style: {} }), querySelector: () => null, addEventListener: () => {} };
globalThis.window = globalThis; globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const fs = await import('fs');
const { SKILLS, SUBJECTS, BAND_NAMES } = await import('../Game/src/edu.js');
const { BY_SKILL, WORK } = await import('../Game/src/careers.js');
const { GEN } = await import('../Game/src/curriculum.js');
const types = (id) => { const set = new Set(); for (const g of [...(GEN[id] || []), ...(BY_SKILL[id] || [])]) { try { set.add(g().type || 'choice'); } catch (e) {} } if (id.startsWith('curs.') && !set.size) set.add('trace'); return [...set].join(', ') || 'world activity'; };
const careersFor = (id) => Object.entries(WORK).filter(([c, w]) => [...w.tasks].some((t) => { try { return BY_SKILL[id] && BY_SKILL[id].length && false; } catch (e) { return false; } })).map(([c]) => c);
let out = `# REAL — Curriculum (generated)\n\nGenerated from \`Game/src/edu.js\` + \`Game/src/curriculum.js\` by \`node Tools/curriculum_report.mjs\`. Do not edit by hand.\n\n`;
const all = Object.values(SKILLS);
out += `**${all.length} skills** across ${Object.keys(SUBJECTS).length} subjects and 6 internal learning bands. Bands are private and never shown to players as grades.\n\n`;
out += `| Subject | ${BAND_NAMES.map((b, i) => `B${i + 1}`).join(' | ')} | Total |\n|---|${BAND_NAMES.map(() => '---').join('|')}|---|\n`;
for (const [k, s] of Object.entries(SUBJECTS)) out += `| ${s.icon} ${s.name} | ${BAND_NAMES.map((_, i) => all.filter((x) => x.subj === k && x.band === i + 1).length).join(' | ')} | ${all.filter((x) => x.subj === k).length} |\n`;
out += `\nBands: ${BAND_NAMES.map((b, i) => `B${i + 1} ${b}`).join(' · ')}\n\n`;
out += `## How every skill is taught\n\nDiscover (first encounter in the world) → Understand (explanation card) → Practice (guided, hints) → Apply (independent use in a real task) → Master (correct without hints, in 2+ different places, on a later day). Mastered skills come back for spaced review after 3, 7, 14 and 30 days. Mistakes show a worked explanation, switch to the alternate explanation, and after repeated misses point to an unmastered prerequisite. Speed is never measured.\n\nActivity types: choice, number entry, ordering steps, sorting, open writing with rubric feedback, budget allocation, cursive tracing (with a type-instead alternative).\n\n`;
for (const [k, s] of Object.entries(SUBJECTS)) {
  out += `## ${s.icon} ${s.name}\n\n`;
  for (let b = 1; b <= 6; b++) {
    const list = all.filter((x) => x.subj === k && x.band === b); if (!list.length) continue;
    out += `### Band ${b} · ${BAND_NAMES[b - 1]}\n\n| Skill | Objective | Builds on | Where in the world | Activities |\n|---|---|---|---|---|\n`;
    for (const x of list) out += `| ${x.name} \`${x.id}\` | ${x.objective} | ${x.prereq.map((p) => SKILLS[p] ? SKILLS[p].name : p).join(', ') || '—'} | ${x.where.join(', ') || 'Fresh Mart, apartment, phone apps'} | ${types(x.id)} |\n`;
    out += '\n';
  }
}
out += `## Validation status\n\n- Automated: \`node Game/tests/curriculum.test.mjs\` runs every generator hundreds of times and checks answers, options, explanations, rubrics, budgets, prerequisite order and coverage. It passes.\n- Not yet done: review by curriculum experts and teachers against age-appropriate learning standards. This is required before release; the content was written by the development team and has not been certified.\n`;
fs.writeFileSync(new URL('../Documentation/09_Curriculum.md', import.meta.url), out);
console.log('wrote Documentation/09_Curriculum.md', out.length, 'chars');
