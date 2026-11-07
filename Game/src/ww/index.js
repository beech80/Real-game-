// Why-not reasons for each wrong option of the fixed multiple-choice questions, keyed by question text then option.
// Shown (by the person you were talking to) the moment a learner picks that option; see reasonFor() in learnkit.js.
import a from './a.json' with { type: 'json' };
import b from './b.json' with { type: 'json' };
import c from './c.json' with { type: 'json' };
import d from './d.json' with { type: 'json' };
import e from './e.json' with { type: 'json' };
import f from './f.json' with { type: 'json' };
import g from './g.json' with { type: 'json' };   // questions worded alike but about different texts: keyed “question|answer”
export const WW = Object.assign({}, a, b, c, d, e, f, g);
