// REAL — how each learner likes to learn. Everyone gets every way; a preference only changes what comes first.
//   see   👀 pictures and a worked example first
//   hear  👂 lessons and worked steps read aloud to me
//   steps 🧩 show me how, step by step, before I try (and right away when I'm stuck)
//   try   ✋ let me try first; help only when I ask
//   other 🔄 explain it a different way when I miss
export const STYLES = [
  ['see', '👀', 'Show me pictures and an example'],
  ['hear', '👂', 'Read it to me'],
  ['steps', '🧩', 'Show me step by step'],
  ['try', '✋', 'Let me try it first'],
  ['other', '🔄', 'Explain it another way when I miss'],
];
export const styles = (G) => { const s = G && G.state && G.state.settings; return (s && s.learn) || []; };
export const likes = (G, k) => styles(G).includes(k);
export function toggleStyle(G, k) {
  const s = G.state.settings || (G.state.settings = {});
  const l = new Set(s.learn || []);
  if (l.has(k)) l.delete(k); else l.add(k);
  if (k === 'try' && l.has('try')) l.delete('steps');   // these two pull opposite ways
  if (k === 'steps' && l.has('steps')) l.delete('try');
  s.learn = [...l];
  if (G.save) G.save();
}
