# REAL — Core Gameplay & Adventure System (implementation map)

Source: *REAL — Core Gameplay & Adventure System Master Prompt*.
Engine note: the game runs in three.js as a phone web app. Unreal Engine 5 is not available in this environment, and the owner chose to drop it. Every system below is modular, so it could be ported.

## Frameworks (`Game/src/adventures.js`, `race.js`, `arenas.js`)

| Framework | Implementation |
|---|---|
| Adventure | `ADVENTURES` registry: a character in the world (species, outfit, district, position), interest tags, hint and linked career. `EPISODES` hold each adventure's stages; adventures are repeatable after completion. Characters show a gold "!" when they have something new. Talking always offers **Not right now**: NPCs introduce, they never force. |
| Missions | In-world objectives (`setMission` → minimap and beacon → walk there → `missionArrive`). Used by Rescue and Mystery. |
| Creation | Garage: car parts with trade-offs (power, grip, off-road, weight), budget, paint; builds are saved. Robot workbench: frame, movement, tool, battery, color. Construction: projects become permanent structures in Brighter Park, signed with the player's name. Inventor: sensor, power and action parts tested against a need. |
| Competition | NPC opponents: 3 AI drivers per track, 3 NPC pet teams, robot "lab record". Prizes scale with placing. Multiplayer competitions are future work. Live neighbors exist, but there are no races between players. |
| Career | Every adventure (except Business, which links to entrepreneurship) unlocks a career whose boss is that adventure's character. Finishing an adventure path gives a referral that skips the Life Level requirement. Careers: race mechanic, animal care assistant, firefighter cadet, junior investigator, chef, medical assistant, robotics technician, contractor, product designer. |
| Interest discovery | Only voluntary signals count: choosing to play, replaying, and optional "what did you enjoy?" chats with characters. Stored on the device. The **Discover** app shows "You might enjoy", "Try something new" (always an untried adventure), all adventures, and a button to clear what REAL has learned. Suggestions never block or decide anything. Test scores are never used. |
| Education | Every adventure step is a real task from the curriculum (Science added as a 7th subject: 21 skills, bands 1–6) with worked explanations, and progress feeds Education Mastery. |

## The ten adventures

| # | Adventure | Where / who | Short adventure | Long-term path | Teaches |
|---|---|---|---|---|---|
| 1 | Build & Race | Brighter Park · Rita | Fix a car (diagnose, safe battery swap) | Garage build ($500 credit) → practice lap → 3 tracks (Loop, Midtown Circuit, Old Road Rally with dirt) → race mechanic | Friction/grip, fair tests, budgeting, trade-offs; after-race telemetry explains what the parts did |
| 2 | Pet Championship | Brighter Park · Penny | Fun run with Penny's dog (no pet needed) | Training (reward-timing, positive reinforcement only) → championship → animal care assistant | Animal needs, nutrition; fed, rested, bonded and trained pets run faster |
| 3 | Robot Builders | Opportunity · Dr. Bolt | Build a robot, program it on a grid | Rubble run → Stairway (only legs climb) → robotics technician | Sequencing/programming, design cycle, energy, terrain vs parts |
| 4 | Emergency Rescue | Main St · Capt. Rhodes | Kitten in a tree (park mission) | Smoke-alarm check → lost hiker on the old road → firefighter cadet | Safety, hazards, first steps, circuits, calm communication (non-graphic) |
| 5 | Build Your Business | Opportunity · Advisor Kemi | Upgrade your business (equipment, interior, menu, location) with pay-back math | Best Business award | Margins, pay-back time, ethics, strategy |
| 6 | Inventor's Workshop | Opportunity · Prof. Volt | Self-watering planter | Path night-light → bike-lock alarm → product designer | Sensor/power/action design, testing one change at a time |
| 7 | Medical Missions | Midtown · Nurse Kim | Supply-room sorting | Check-in desk → sniffles puzzle (clearly labeled a puzzle, not medicine) → medical assistant | Body systems, reading charts, health signs, care |
| 8 | Mystery Detectives | Main St · Det. Ivy | The Missing Bus Pass (3 clues around the district) | Night Lights case → quick cases → junior investigator | Observation, inference, evidence over suspicion |
| 9 | Construction Challenge | Opportunity · Jo | Park bench (built in Brighter Park) | Playground → garden shed → contractor | Materials, measurement, geometry, forces |
| 10 | Culinary Adventures | Midtown · Chef Lou | Pancake cook-off | Food-truck menu → Grand Cook-off → chef | Ratios, heat safety, timing, pricing, nutrition |

## Economy targets (master prompt §10)

| Item | Value |
|---|---|
| Starting balance | $100 |
| Wage | $15/h, 4-hour shift = $60 |
| Starter rent | $300/week; Fresh Start covers half for the first 4 weeks |
| Bus fare | $2 |
| Starter car | $2,500, or $300 down + $55/week |
| Businesses | $2,000 / $2,500 / $3,000, with a 10% loan over 20 weeks |
| Loft / Heights / home | $450 / $700 a week; home $60,000 with 10% down |

## Not done

- Multiplayer races and competitions between real players. Presence-only neighbors exist.
- Racing other players' saved builds.
- Unreal Engine 5 implementation.
- The visual overhaul is waiting on approval: see `10_ArtDirection.md` and `Renders/LookDev/`.
