// REAL — draft standards alignment for schools (for educator review).
// Each skill maps to the U.S. standards it practises. Codes are at the cluster / standard level:
//   CCSS ELA & Math (Common Core), NGSS (science), Jump$tart National Standards for Personal Financial Education (2021, by area and grade 4/8/12 benchmark),
//   C3 Framework (social studies), CSTA K-12 CS Standards (2017), NHES (National Health Education Standards, 2007 numbering: check against your district's edition).
// A skill's band suggests a grade range: 1 ≈ K–1, 2 ≈ 2–3, 3 ≈ 4–5, 4 ≈ 6–7, 5 ≈ 8–9, 6 ≈ 10–12.
export const GRADES = { 1: 'K–1', 2: '2–3', 3: '4–5', 4: '6–7', 5: '8–9', 6: '10–12' };
export const FRAMEWORKS = {
  CCSS: 'Common Core State Standards (ELA & Math)', NGSS: 'Next Generation Science Standards',
  JS: 'Jump$tart National Standards for Personal Financial Education (2021): area and grade benchmark (4, 8 or 12)', C3: 'C3 Framework for Social Studies',
  CSTA: 'CSTA K-12 Computer Science Standards', NHES: 'National Health Education Standards',
};
export const STANDARDS = {
  // ---- reading
  'read.letters': ['CCSS.ELA-LITERACY.RF.K.1', 'CCSS.ELA-LITERACY.RF.K.3'], 'read.phonics': ['CCSS.ELA-LITERACY.RF.1.3', 'CCSS.ELA-LITERACY.RF.2.3'],
  'read.sentences': ['CCSS.ELA-LITERACY.RF.1.4', 'CCSS.ELA-LITERACY.RF.1.3'], 'read.sounds': ['CCSS.ELA-LITERACY.RF.K.2', 'CCSS.ELA-LITERACY.RF.1.2'], 'read.signs': ['CCSS.ELA-LITERACY.RF.K.3.C', 'CCSS.ELA-LITERACY.RI.K.7'], 'read.vocab': ['CCSS.ELA-LITERACY.L.1.4', 'CCSS.ELA-LITERACY.RF.1.3.G'],
  'read.instructions': ['CCSS.ELA-LITERACY.RI.2.3'], 'read.main': ['CCSS.ELA-LITERACY.RI.2.2'], 'read.paragraph': ['CCSS.ELA-LITERACY.RI.2.1', 'CCSS.ELA-LITERACY.RI.3.2'],
  'read.story': ['CCSS.ELA-LITERACY.RL.2.5', 'CCSS.ELA-LITERACY.RL.3.3'], 'read.documents': ['CCSS.ELA-LITERACY.RI.4.1', 'CCSS.ELA-LITERACY.RI.5.1'], 'read.multistep': ['CCSS.ELA-LITERACY.RI.4.3'],
  'read.inference': ['CCSS.ELA-LITERACY.RL.4.1', 'CCSS.ELA-LITERACY.RI.4.1'], 'read.compare': ['CCSS.ELA-LITERACY.RI.4.7', 'CCSS.ELA-LITERACY.RI.5.7'],
  'read.wordparts': ['CCSS.ELA-LITERACY.L.3.4.B', 'CCSS.ELA-LITERACY.L.3.4.C', 'CCSS.ELA-LITERACY.L.4.5.C'], 'read.context': ['CCSS.ELA-LITERACY.L.4.4.A'],
  'read.figurative': ['CCSS.ELA-LITERACY.L.4.5.A', 'CCSS.ELA-LITERACY.L.4.5.B', 'CCSS.ELA-LITERACY.L.5.5.A'], 'read.technical': ['CCSS.ELA-LITERACY.RST.6-8.3'], 'read.evidence': ['CCSS.ELA-LITERACY.RI.6.1', 'CCSS.ELA-LITERACY.RI.7.1'],
  'read.factopinion': ['CCSS.ELA-LITERACY.RI.6.8', 'CCSS.ELA-LITERACY.RST.6-8.8'], 'read.purpose': ['CCSS.ELA-LITERACY.RI.6.6'], 'read.summarize': ['CCSS.ELA-LITERACY.RL.4.2', 'CCSS.ELA-LITERACY.RI.5.2', 'CCSS.ELA-LITERACY.RI.8.2'],
  'read.contracts': ['CCSS.ELA-LITERACY.RI.9-10.4', 'CCSS.ELA-LITERACY.RI.9-10.5'], 'read.bias': ['CCSS.ELA-LITERACY.RI.8.6', 'CCSS.ELA-LITERACY.RI.9-10.6'],
  'read.sources': ['CCSS.ELA-LITERACY.RI.11-12.7', 'CCSS.ELA-LITERACY.W.11-12.8'], 'read.research': ['CCSS.ELA-LITERACY.W.11-12.7'],
  // ---- writing
  'write.letters': ['CCSS.ELA-LITERACY.L.K.1.A', 'CCSS.ELA-LITERACY.L.1.2.D'], 'write.caps': ['CCSS.ELA-LITERACY.L.1.2.A', 'CCSS.ELA-LITERACY.L.1.2.B'], 'write.sentences': ['CCSS.ELA-LITERACY.L.1.1.J'],
  'write.messages': ['CCSS.ELA-LITERACY.W.2.2'], 'write.paragraph': ['CCSS.ELA-LITERACY.W.3.2'], 'write.forms': ['CCSS.ELA-LITERACY.L.2.2', 'CCSS.ELA-LITERACY.W.4.4'], 'write.grammar': ['CCSS.ELA-LITERACY.L.2.1', 'CCSS.ELA-LITERACY.L.3.1.A'],
  'write.homophones': ['CCSS.ELA-LITERACY.L.4.1.G'], 'write.email': ['CCSS.ELA-LITERACY.W.4.4'], 'write.resume': ['CCSS.ELA-LITERACY.W.5.4'], 'write.professional': ['CCSS.ELA-LITERACY.W.5.4', 'CCSS.ELA-LITERACY.L.5.3'],
  'write.tense': ['CCSS.ELA-LITERACY.L.3.1.E', 'CCSS.ELA-LITERACY.L.3.1.F', 'CCSS.ELA-LITERACY.L.5.1.C'], 'write.commas': ['CCSS.ELA-LITERACY.L.3.2.B', 'CCSS.ELA-LITERACY.L.5.2.A', 'CCSS.ELA-LITERACY.L.5.2.B', 'CCSS.ELA-LITERACY.L.5.2.C'],
  'write.report': ['CCSS.ELA-LITERACY.W.6.2'], 'write.persuasive': ['CCSS.ELA-LITERACY.W.6.1'], 'write.proposal': ['CCSS.ELA-LITERACY.W.7.1', 'CCSS.ELA-LITERACY.WHST.6-8.1'],
  'write.analytical': ['CCSS.ELA-LITERACY.W.8.2', 'CCSS.ELA-LITERACY.W.9-10.9'], 'write.research': ['CCSS.ELA-LITERACY.W.8.7', 'CCSS.ELA-LITERACY.W.9-10.7'],
  'write.bizplan': ['CCSS.ELA-LITERACY.WHST.11-12.2'], 'write.argument': ['CCSS.ELA-LITERACY.W.11-12.1'],
  // ---- cursive (many states require it; Common Core does not)
  'write.print': ['CCSS.ELA-LITERACY.L.K.1.A', 'CCSS.ELA-LITERACY.L.1.1.A'],
  'curs.strokes': ['State cursive standards (e.g. CA EC 49866, TX TEKS 2.9(A))'], 'curs.lower': ['TX TEKS 2.9(A)', 'State cursive standards'], 'curs.upper': ['TX TEKS 3.9(A)'],
  'curs.words': ['TX TEKS 3.9(A)'], 'curs.signature': ['State cursive standards: signature'], 'curs.reading': ['State cursive standards: read cursive'],
  'curs.fluent': ['TX TEKS 4.9(A)'], 'curs.styles': ['State cursive standards: legibility'], 'curs.documents': ['State cursive standards: documents'], 'curs.varied': ['State cursive standards: historical documents'],
  // ---- math
  'math.numbers': ['CCSS.MATH.CONTENT.K.CC.A.3', 'CCSS.MATH.CONTENT.K.CC.B.4'], 'math.count': ['CCSS.MATH.CONTENT.K.CC.A.1', 'CCSS.MATH.CONTENT.1.NBT.A.1'],
  'math.add': ['CCSS.MATH.CONTENT.1.OA.A.1', 'CCSS.MATH.CONTENT.2.OA.B.2'], 'math.sub': ['CCSS.MATH.CONTENT.1.OA.A.1', 'CCSS.MATH.CONTENT.2.NBT.B.5'],
  'math.shapes': ['CCSS.MATH.CONTENT.K.G.A.2', 'CCSS.MATH.CONTENT.1.G.A.1'], 'math.patterns': ['CCSS.MATH.CONTENT.K.CC.A.2', 'CCSS.MATH.CONTENT.3.OA.D.9', 'CCSS.MATH.CONTENT.4.OA.C.5'],
  'math.place': ['CCSS.MATH.CONTENT.1.NBT.B.2', 'CCSS.MATH.CONTENT.2.NBT.A.1', 'CCSS.MATH.CONTENT.2.NBT.A.4'], 'math.decimals': ['CCSS.MATH.CONTENT.2.MD.C.8', 'CCSS.MATH.CONTENT.4.MD.A.2', 'CCSS.MATH.CONTENT.5.NBT.B.7'], 'math.change': ['CCSS.MATH.CONTENT.2.MD.C.8', 'CCSS.MATH.CONTENT.4.MD.A.2'],
  'math.multiply': ['CCSS.MATH.CONTENT.3.OA.A.1', 'CCSS.MATH.CONTENT.3.OA.C.7'], 'math.divide': ['CCSS.MATH.CONTENT.3.OA.A.2', 'CCSS.MATH.CONTENT.3.OA.B.6'],
  'math.time': ['CCSS.MATH.CONTENT.1.MD.B.3', 'CCSS.MATH.CONTENT.2.MD.C.7'], 'math.rounding': ['CCSS.MATH.CONTENT.3.NBT.A.1'],
  'math.fractions': ['CCSS.MATH.CONTENT.4.NF.A.2', 'CCSS.MATH.CONTENT.4.NF.B.3', 'CCSS.MATH.CONTENT.4.NF.B.4', 'CCSS.MATH.CONTENT.5.NF.A.1'], 'math.percent': ['CCSS.MATH.CONTENT.6.RP.A.3.C', 'CCSS.MATH.CONTENT.7.RP.A.3'], 'math.ratio': ['CCSS.MATH.CONTENT.6.RP.A.3'],
  'math.measure': ['CCSS.MATH.CONTENT.4.MD.A.1', 'CCSS.MATH.CONTENT.5.MD.A.1'], 'math.geometry': ['CCSS.MATH.CONTENT.3.MD.C.7', 'CCSS.MATH.CONTENT.3.MD.D.8', 'CCSS.MATH.CONTENT.4.MD.A.3'], 'math.graphs': ['CCSS.MATH.CONTENT.3.MD.B.3', 'CCSS.MATH.CONTENT.4.MD.B.4', 'CCSS.MATH.CONTENT.6.SP.B.4'],
  'math.algebra': ['CCSS.MATH.CONTENT.6.EE.B.7', 'CCSS.MATH.CONTENT.7.EE.B.4'], 'math.prealgebra': ['CCSS.MATH.CONTENT.5.OA.A.1', 'CCSS.MATH.CONTENT.6.EE.A.2.C'],
  'math.geometry2': ['CCSS.MATH.CONTENT.5.MD.C.5', 'CCSS.MATH.CONTENT.7.G.B.6', 'CCSS.MATH.CONTENT.8.G.B.7'], 'math.stats': ['CCSS.MATH.CONTENT.6.SP.B.5'], 'math.negatives': ['CCSS.MATH.CONTENT.6.NS.C.5', 'CCSS.MATH.CONTENT.7.NS.A.1'],
  'math.coords': ['CCSS.MATH.CONTENT.5.G.A.1', 'CCSS.MATH.CONTENT.5.G.A.2'], 'math.algebra2': ['CCSS.MATH.CONTENT.6.EE.A.1', 'CCSS.MATH.CONTENT.8.EE.A.1', 'CCSS.MATH.CONTENT.8.EE.C.8.B'], 'math.probability': ['CCSS.MATH.CONTENT.7.SP.C.5', 'CCSS.MATH.CONTENT.HSS.CP.A.1'],
  'math.statsadv': ['CCSS.MATH.CONTENT.7.SP.A.1', 'CCSS.MATH.CONTENT.6.SP.B.5.D'], 'math.finmath': ['CCSS.MATH.CONTENT.7.RP.A.3', 'CCSS.MATH.CONTENT.HSF.LE.A.2'],
  'math.modeling': ['CCSS.MATH.PRACTICE.MP4', 'CCSS.MATH.CONTENT.HSF.BF.A.1'], 'math.forecast': ['CCSS.MATH.CONTENT.HSS.ID.B.6'], 'math.optimize': ['CCSS.MATH.CONTENT.HSA.CED.A.3'], 'math.precalc': ['CCSS.MATH.CONTENT.HSF.IF.B.6'],
  // ---- money (Jump$tart: SS = Spending & Saving, EI = Earning Income, CD = Managing Credit / Debt, IN = Investing, RM = Managing Risk, FD = Financial Decision Making)
  'fin.money': ['CCSS.MATH.CONTENT.2.MD.C.8', 'Jump$tart Spending/Saving 4'], 'fin.needs': ['Jump$tart Spending/Saving 4', 'Jump$tart Financial Decision Making 4'], 'fin.prices': ['Jump$tart Spending/Saving 4'], 'fin.saving': ['Jump$tart Spending/Saving 4'],
  'fin.goals': ['Jump$tart Spending/Saving 4', 'Jump$tart Financial Decision Making 4'], 'fin.records': ['Jump$tart Spending/Saving 8'], 'fin.paycheck': ['Jump$tart Earning Income 8'], 'fin.budget': ['Jump$tart Spending/Saving 8'],
  'fin.bills': ['Jump$tart Spending/Saving 8', 'Jump$tart Managing Credit 8'], 'fin.banking': ['Jump$tart Spending/Saving 8'], 'fin.interest': ['Jump$tart Spending/Saving 8', 'Jump$tart Managing Credit 8'], 'fin.credit': ['Jump$tart Managing Credit 8', 'Jump$tart Managing Credit 8'],
  'fin.debt': ['Jump$tart Managing Credit 8'], 'fin.loans': ['Jump$tart Managing Credit 12'], 'fin.score': ['Jump$tart Managing Credit 12'], 'fin.insurance': ['Jump$tart Managing Risk 8', 'Jump$tart Managing Risk 12'],
  'fin.taxes': ['Jump$tart Earning Income 8', 'Jump$tart Earning Income 12'], 'fin.planning': ['Jump$tart Financial Decision Making 12'], 'fin.fraud': ['Jump$tart Managing Risk 8', 'Jump$tart Managing Credit 12'],
  'fin.investing': ['Jump$tart Investing 12', 'Jump$tart Investing 12'], 'fin.cashflow': ['Jump$tart Spending/Saving 12'], 'fin.payroll': ['Jump$tart Earning Income 12'], 'fin.margins': ['C3 D2.Eco.2.9-12', 'Jump$tart Earning Income 12'], 'fin.business': ['C3 D2.Eco.2.9-12', 'Jump$tart Earning Income 12'],
  'fin.expansion': ['C3 D2.Eco.2.9-12'], 'fin.forecast': ['Jump$tart Financial Decision Making 12'], 'fin.diversify': ['Jump$tart Investing 12'], 'fin.assets': ['Jump$tart Investing 12', 'Jump$tart Managing Risk 12'],
  // ---- critical thinking (taught across subjects: CCSS Math Practices, ELA argument, C3 inquiry)
  'think.observe': ['NGSS K-2 SEP: Planning & carrying out investigations'], 'think.compare': ['CCSS.MATH.CONTENT.K.MD.B.3', 'C3 D2.Eco.1.K-2'], 'think.directions': ['CCSS.ELA-LITERACY.SL.1.2'],
  'think.consequence': ['C3 D2.Eco.1.3-5', 'NHES 5.2.2'], 'think.planning': ['CCSS.MATH.PRACTICE.MP1'], 'think.opportunity': ['C3 D2.Eco.1.3-5', 'Jump$tart Financial Decision Making 4'],
  'think.evaluate': ['CCSS.ELA-LITERACY.RI.4.8'], 'think.risk': ['Jump$tart Managing Risk 4'], 'think.evidence': ['CCSS.ELA-LITERACY.RI.6.8', 'CCSS.MATH.PRACTICE.MP3'],
  'think.ethics': ['C3 D2.Civ.10.6-8'], 'think.problem': ['CCSS.MATH.PRACTICE.MP1', 'NGSS MS-ETS1-1'], 'think.longterm': ['Jump$tart Financial Decision Making 8'],
  'think.persuasion': ['CCSS.ELA-LITERACY.RI.8.8', 'CCSS.ELA-LITERACY.SL.8.3'], 'think.negotiate': ['CCSS.ELA-LITERACY.SL.9-10.1'], 'think.strategy': ['Jump$tart Financial Decision Making 12'],
  'think.systems': ['NGSS Crosscutting: Systems & system models'], 'think.uncertainty': ['CCSS.MATH.CONTENT.7.SP.C.7', 'CCSS.MATH.CONTENT.HSS.MD.B.5'], 'think.leadership': ['C3 D2.Civ.10.9-12'],
  // ---- science
  'sci.safety': ['NGSS K-2 SEP; classroom safety'], 'sci.animals': ['NGSS K-LS1-1'], 'sci.observe': ['NGSS K-2 SEP 3: Planning & carrying out investigations'], 'sci.weather': ['NGSS K-ESS2-1', 'NGSS K-ESS3-2'], 'sci.plants': ['NGSS K-LS1-1', 'NGSS 3-LS1-1'],
  'sci.motion': ['NGSS 3-PS2-2', 'CCSS.MATH.CONTENT.6.RP.A.3.B'], 'sci.method': ['NGSS 3-5-ETS1-3'], 'sci.nutrition': ['NGSS 5-PS3-1', 'NHES 1.5.1'], 'sci.body': ['NGSS 4-LS1-1'],
  'sci.matter': ['NGSS 2-PS1-1', 'NGSS 2-PS1-4'], 'sci.water': ['NGSS 2-ESS2-3', 'NGSS 5-ESS2-1', 'NGSS MS-ESS2-4'], 'sci.space': ['NGSS 1-ESS1-1', 'NGSS 5-ESS1-2', 'NGSS MS-ESS1-1'],
  'sci.friction': ['NGSS 3-PS2-1'], 'sci.energy': ['NGSS 4-PS3-2', 'NGSS 4-PS3-4'], 'sci.machines': ['NGSS 3-5-ETS1-2'], 'sci.heat': ['NGSS 4-PS3-2', 'NGSS MS-PS3-3', 'NHES 7.5.2'],
  'sci.materials': ['NGSS 2-PS1-2'], 'sci.planets': ['NGSS MS-ESS1-3'], 'sci.magnets': ['NGSS 3-PS2-3', 'NGSS 3-PS2-4'], 'sci.sound': ['NGSS 1-PS4-1', 'NGSS 1-PS4-3', 'NGSS 4-PS4-2'],
  'sci.forces': ['NGSS MS-PS2-2'], 'sci.circuits': ['NGSS 4-PS3-2', 'NGSS 4-PS3-4'], 'sci.health': ['NGSS MS-LS1-3', 'NHES 1.8.1'], 'sci.cells': ['NGSS MS-LS1-1', 'NGSS MS-LS1-2'],
  'sci.design': ['NGSS MS-ETS1-1', 'NGSS MS-ETS1-4'], 'sci.ecosystems': ['NGSS 5-LS2-1', 'NGSS MS-LS2-1', 'NGSS MS-LS2-4'], 'sci.data': ['NGSS MS-ETS1-3', 'NGSS SEP 4: Analyzing data'], 'sci.chem': ['NGSS 5-PS1-3', 'NGSS 5-PS1-4', 'NGSS MS-PS1-2'],
  'sci.innovation': ['NGSS HS-ETS1-2'], 'sci.systems': ['NGSS HS-LS2-6', 'NGSS HS-ESS3-6'], 'sci.ethics': ['NGSS HS-ETS1-3'],
  // ---- social studies
  'soc.community': ['C3 D2.Civ.2.K-2'], 'soc.rules': ['C3 D2.Civ.8.K-2', 'C3 D2.Civ.12.K-2'], 'soc.maps': ['C3 D2.Geo.1.K-2', 'C3 D2.Geo.3.K-2'],
  'soc.geography': ['C3 D2.Geo.2.3-5'], 'soc.timeline': ['C3 D2.His.1.K-2'], 'soc.cultures': ['C3 D2.Geo.6.K-2', 'C3 D2.His.2.3-5'],
  'soc.government': ['C3 D2.Civ.1.3-5', 'C3 D2.Civ.3.3-5'], 'soc.rights': ['C3 D2.Civ.7.3-5'], 'soc.economics': ['C3 D2.Eco.1.3-5', 'C3 D2.Eco.4.6-8'],
  'soc.history': ['C3 D2.His.2.6-8'], 'soc.sources': ['C3 D2.His.9.6-8', 'C3 D2.His.10.6-8'], 'soc.civics': ['C3 D2.Civ.3.6-8', 'C3 D2.Civ.4.9-12'],
  'soc.trade': ['C3 D2.Eco.14.9-12', 'C3 D2.Eco.15.9-12'], 'soc.policy': ['C3 D2.Civ.13.9-12'], 'soc.citizenship': ['C3 D4.8.9-12', 'C3 D2.Civ.10.9-12'],
  // ---- health & life skills
  'hl.hygiene': ['NHES 1.2.1', 'NHES 7.2.1'], 'hl.feelings': ['NHES 1.2.2', 'NHES 4.2.1'], 'hl.safety': ['NHES 7.2.2', 'NHES 5.2.1'], 'hl.sleep': ['NHES 1.2.1', 'NHES 7.5.1'],
  'hl.exercise': ['NHES 1.5.1', 'NHES 6.5.1'], 'hl.kindness': ['NHES 4.2.1', 'NHES 4.5.1'], 'hl.firstaid': ['NHES 7.5.2'], 'hl.foodsafety': ['NHES 7.5.2', 'NHES 1.5.1'],
  'hl.stress': ['NHES 7.5.1', 'NHES 7.8.2'], 'hl.medicine': ['NHES 1.8.1', 'NHES 5.8.1'], 'hl.habits': ['NHES 6.8.1', 'NHES 6.8.3'], 'hl.mental': ['NHES 3.8.4', 'NHES 4.8.4'],
  'hl.relationships': ['NHES 4.8.1', 'NHES 4.8.2'], 'hl.wellbeing': ['NHES 6.12.1', 'NHES 7.12.1'], 'hl.publichealth': ['NHES 8.12.1', 'NHES 2.12.6'],
  // ---- technology
  'tech.basics': ['CSTA 1A-CS-01', 'CSTA 1A-CS-02'], 'tech.sequence': ['CSTA 1A-AP-08', 'CSTA 1A-AP-10'], 'tech.safety': ['CSTA 1A-NI-04', 'CSTA 1A-IC-18'], 'tech.passwords': ['CSTA 1A-NI-04', 'CSTA 1B-NI-05'],
  'tech.loops': ['CSTA 1B-AP-10'], 'tech.search': ['CSTA 1B-IC-21'], 'tech.citizenship': ['CSTA 1B-IC-19', 'CSTA 2-IC-23'], 'tech.conditionals': ['CSTA 2-AP-12'], 'tech.debug': ['CSTA 1B-AP-15', 'CSTA 2-AP-17'],
  'tech.variables': ['CSTA 2-AP-11'], 'tech.privacy': ['CSTA 2-NI-05', 'CSTA 3A-IC-29'], 'tech.internet': ['CSTA 2-NI-04', 'CSTA 3A-NI-05'], 'tech.ai': ['CSTA 3A-IC-24', 'CSTA 3B-AP-08'], 'tech.design': ['CSTA 3A-AP-19', 'CSTA 3A-IC-25'],
};
