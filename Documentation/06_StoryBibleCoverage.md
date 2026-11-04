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
| 7 — A bigger world | ✅ | `districts.js`: **Midtown** (LL3), **Opportunity District** (LL5), **The Heights** (LL8) as 3D districts with storefronts, signs, pedestrians, friends, bus stops; travel by bus or your own vehicle |
| 8 — Responsibilities of success | ✅ | Life Level (10 categories). Midtown Motors: bike / scooter / used car with financing, weekly fuel + insurance, service every 10 days (skipping it causes a $250 repair). Homes: Midtown Lofts, Heights Residences (income check + lease reading), buying a home (10% down + mortgage). Heights Bank savings with weekly interest |
| 9 — Build something that’s yours | ✅ | Plan → register at the Small Business Center (coffee cart, bake stall, bike repair) → fund with savings or a 10% loan → daily operation (buy supplies, set price, weather & reputation demand, work out profit) → hire up to 3 staff (payroll; they run overnight) → Midtown storefront |
| 10 — Jax’s challenge | ✅ | $300-by-day-N challenge; his tone shifts as you grow |
| 11 — The invitation | ✅ | At Life Level 6, The Club messages you; ride the bus to The Club |
| 12 — The REAL decision | ✅ | Gates open; three endings |
| Epilogue — Your REAL life | ✅ | The empty road, the final message, play continues |

## Educational Teaching & Leveling System

| Requirement | Status | Implementation |
|---|---|---|
| Learn by Living: Discover → Understand → Practice → Apply → Master | ✅ | `edu.js`: `discover()` opens a "New skill" card (Understand); `support()` = guided / hint / independent; mastery requires independent success in **two different contexts on a later day**; `dailyReview()` schedules Review |
| Two systems: Life Level and Education Mastery | ✅ | `life.js` (10 categories, "never a measure of your worth") · `edu.js` (per-skill states) |
| Six internal bands, not grades | ✅ | Foundation → Mastery & Leadership; shown only as "Now exploring…" in Learn; no grade labels anywhere |
| Mastery states | ✅ | Not introduced → Learning → Practicing → Proficient → Mastered → Review |
| Adaptive, private, per-subject | ✅ | `band(subj)`; register moves from whole dollars → cents → coupon %; inventory from counting → multiplication → fractions |
| Hints, alternate explanations, no penalty for support | ✅ | Every activity: "Show a hint"; after a mistake the alternate explanation appears; mistakes drop you to Practicing at worst |
| Never use speed | ✅ | No timers in any activity; evidence = correctness, hints, contexts, days |
| Reading / writing / cursive / math / money / critical thinking | ✅ | ~33 skills across bands 1–6; ~50 task generators across 16 careers, courses, challenge zones and the Learn app |
| Rewards = gameplay, not quiz money | ✅ | Skills unlock promotions, jobs (career requirements) and Life Level; Learn practice gives no money |
| Wilderness / Fresh Mart / apartment first | ✅ | All three have contextual activities |
| Challenge zones | ✅ | Learning Lab (Midtown Library) and The Think Tank: 5 zones × 5 rooms, hints free, no timer, progress saved |
| Pets | ✅ | Paws & Friends: puppy / kitten / bunny that follows you, daily feeding, play, weekly care bill |
| Multiplayer (child-safe) | ✅ | `multiplayer.js`: other players appear as anonymous REALs in the same district (shared link only). Presence only: species, jacket, position, 4 preset gestures. No names, chat or trading |
| Plush companions | 🟡 | Free starter companion that floats beside you and gives tips; a tag-code linking flow (REAL-XXXX, checked on-device). No physical plush product exists yet |
| Relationships | ✅ | Six district friends (Marcus, Ms. Lindqvist, Priya, Coach Bo, Dr. Amara, Theo) with friendship levels and daily favors |

## Honest gaps

1. Buildings in the three new districts are entered through menus (no walk-in interiors except Fresh Mart and your home).
2. Plush companion linking needs a real product and code list; the code check is a placeholder checksum.
3. Multiplayer shows other players live only inside the shared claude.ai link; the PWA build plays solo.
4. Real-device performance across many phones is unverified (tested in phone emulation).
