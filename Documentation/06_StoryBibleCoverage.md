# REAL — Story Bible & Teaching System coverage

This maps each requirement in *The Complete Story, Premise & Narrative Bible* and the *Educational Teaching & Leveling System* to where it lives in the game.

Status key: ✅ playable now · 🟡 partly done · 🔜 planned (needs new districts/systems)

## The 12 story rules

| # | Rule | Status | Where |
|---|---|---|---|
| 1 | Begin alone in the middle of nowhere | ✅ | `scenes.js` `buildWilderness` · `main.js` `startWilderness()`. Empty road, fields, hills, wind, faint skyline, $0, no phone |
| 2 | The Club must feel like something lost | ✅ | Playable prologue in the Club hall → Council Room → representative → access card **REVOKED** → gates close (`prologue()`, `councilScene()`) |
| 3 | First journey into the city is playable | ✅ | "FIND YOUR WAY"; "STARTING DISTRICT — AHEAD" sign; a fork between marked Route 1 and the unmarked field trail with a creek; both lead to the city |
| 4 | Earn independence | ✅ | Community Center → Fresh Start housing (week 1), $100 balance found *in the city*, basic phone, weekly rent $120, utilities, phone bill, groceries, energy/hunger |
| 5 | Education is part of living | ✅ | Every activity is a real task (signs, register, aisles, inventory, pay stub, recipes, bills, applications, Jax) — see below |
| 6 | Jax is a recurring, nuanced rival | ✅ | Ch.4 $40 hoodie (4 choices: buy / save / ask why / walk away); shoplifting temptation (never required; recoverable consequence); real good advice (barista job); $300 savings challenge; message at the invitation |
| 7 | Consequences with recovery | ✅ | Late fees (+$15, catch up any time), shoplifting penalty plus a 2-day store ban, mood dips. No permanent failure states |
| 8 | Nine species, equal opportunity | ✅ | Species only changes identity and presentation; every career and skill is open to all |
| 9 | Freedom | ✅ | Four districts, 19 playable careers, courses, a business, vehicles, homes, pets, challenge zones. Every path optional |
| 10 | Ending reflects choice | ✅ | Invitation → **Return / Reject / Rebuild** with distinct outcomes (`invitation()`) |
| 11 | The game continues after the story | ✅ | After the epilogue the city stays open; save continues |
| 12 | Payoff connects to the opening | ✅ | Epilogue returns you to the same empty road at sunset: "You started with nothing. But you were never nothing. Look at what you’ve built." |

## Chapters

| Chapter | Status | Notes |
|---|---|---|
| Prologue — The life you didn’t earn | ✅ | Representative's lines quoted from the bible, three player responses |
| 1 — Nowhere | ✅ | Reading signs (first educational interaction), observation, the fork decision |
| 2 — The city doesn’t know you | ✅ | Community Center, Fresh Start housing, $100, phone, needs vs wants, first budget |
| 3 — The first dollar | ✅ | Fresh Mart application (main idea, form, sentence, cursive signature) + interview; **$15/h, 4-hour shift**; register (totals then change), aisles, inventory; you calculate your own gross pay; pay stub; emotional first-paycheck moment |
| 4 — The price of choice | ✅ | Jax remembers you; $40 at Thread & Co; shoplifting scene |
| 5 — Learning to live | ✅ | Routines, Calendar app, needs, bills, cooking. **1 real minute ≈ 10 game minutes** (Fast option in Settings) |
| 6 — Finding your path | ✅ | **Every Tier 0–3 career is playable** (`careers.js` `WORK`): apply in person (application + interview), 3 real tasks per shift, pay stub, a raise every 5 shifts. Tier 2–3 need courses at City Tech Institute / Heights College (tuition, financial aid) |
| 7 — A bigger world | ✅ | Every building is a walk-in room (`interiors.js`: 20 room types with staff, counters, work stations, decor). `districts.js`: **Midtown** (LL3), **Opportunity District** (LL5), **The Heights** (LL8) as 3D districts with storefronts, signs, pedestrians, friends, bus stops; travel by bus or your own vehicle |
| 8 — Responsibilities of success | ✅ | Life Level (10 categories). Midtown Motors: bike / scooter / used car with financing, weekly fuel + insurance, service every 10 days (skipping it causes a $250 repair). Homes: Midtown Lofts, Heights Residences (income check + lease reading), buying a home (10% down + mortgage). Heights Bank savings with weekly interest |
| 9 — Build something that’s yours | ✅ | Plan → register at the Small Business Center (coffee cart, bake stall, bike repair) → fund with savings or a 10% loan → daily operation (buy supplies, set price, weather & reputation demand, work out profit) → hire up to 3 staff (payroll; they run overnight) → Midtown storefront |
| 10 — Jax’s challenge | ✅ | $300-by-day-N challenge; his tone shifts as you grow |
| 11 — The invitation | ✅ | At Life Level 6, The Club messages you; ride the bus to The Club |
| 12 — The REAL decision | ✅ | Gates open; three endings |
| Epilogue — Your REAL life | ✅ | The empty road, the final message, play continues |

## Educational Teaching & Leveling System (Complete Educational Game System master prompt)

| Requirement | Status | Implementation |
|---|---|---|
| Curriculum separated from gameplay code | ✅ | `curriculum.js` (skills + generators, pure data/functions) · `edu.js` (mastery engine) · `learnkit.js` (activity runner). Full list: `09_Curriculum.md` (generated) |
| Six subjects × six internal bands | ✅ | 120 skills: Reading 21, Writing 16, Cursive 10, Math 27, Money 28, Critical thinking 18, every subject in all six bands. Bands are never shown as grades |
| Five-step learning cycle | ✅ | Discover → Understand (New-skill card) → Practice (guided, hints) → Apply (real task) → Master (no hints, 2+ contexts, later day) |
| Mastery states and evidence | ✅ | Not introduced → Learning → Practicing → Proficient → Mastered → Review. Evidence: accuracy, hint use, error patterns, contexts, retention. Never speed |
| Spaced review | ✅ | Reviews after 3, 7, 14 and 30 days |
| Adaptive difficulty | ✅ | Private band per subject; advanced players skip foundations they never needed; mastered tasks swapped for harder ones at work; repeated misses point to an unmastered prerequisite |
| Feedback that explains why | ✅ | Every generated activity carries a worked explanation shown after answering; alternate explanation after mistakes; worked solution after 3 tries |
| Interaction types | ✅ | Choice, number entry, ordering steps, sorting/matching, open writing with rubric feedback (not keyword-only), budget allocation, cursive tracing |
| Cursive accessibility | ✅ | Every tracing task has “Type instead”; handwriting never blocks careers or story |
| Accessibility | ✅ | Settings: bigger text, high contrast, read aloud (device voice), reduce motion; 🔊 on every question |
| World integration | ✅ | Wilderness signs; Fresh Mart; apartment bills; Midtown Library books (adaptive); Heights Bank (savings, simulated investing with risk, credit score, loans, scam spotting); 16 careers with skill pools; courses; Community Center résumé help; business forecasting & marketing (ethics); Calendar week planner; Jax advice that is sometimes good, sometimes misleading |
| Failure and recovery | ✅ | Late fees can be undone with a rent payment plan; food bank; budgeting help. No one loses their home over a hard week or a wrong answer |
| Mentoring (band 6) | ✅ | Community Center: mentor a newcomer (Life Level 8+ or after the ending) |
| Privacy & child safety | ✅ | On-device saves only, no accounts, ads or purchases; private learning records; anonymous presence-only neighbors that can be switched off; scripted NPC advice; grown-ups page with privacy notes and progress |
| Content validation | 🟡 | Automated: `node Game/tests/curriculum.test.mjs` checks ~40,000 generated activities (answers, options, explanations, rubrics, budgets, prerequisite order, coverage). **Expert/teacher review against learning standards is still required before release** |
| Automated testing | ✅ | `tests/curriculum.test.mjs`, `tests/edu.cjs` (every activity type + world learning flows in the real UI), plus touch, story, world, rooms, map and neighbors tests |

## Honest gaps

0. The curriculum has passed automated checks but has not been reviewed by teachers or curriculum experts.

1. Live neighbors (multiplayer) work in the shared claude.ai link. The installable PWA build has no game server, so it plays solo.
2. Physical plush toys don't exist yet. The tag-code system and code generator are ready for when they do.
3. Tested in phone emulation (iPhone 13). Performance on a wide range of real phones is unverified; the game lowers graphics quality automatically if frames drop.
