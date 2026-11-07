// REAL — reading passages with linked question sets, written for each stage (band 1 ≈ K–1 … band 6 ≈ 10–12).
// Every passage is original. Each question is tagged with the reading skill it practises and the passage's band, so
// the game only shows a passage to learners near that level. Questions ask for main idea, key details, inference,
// word meaning in context, author's purpose, text evidence, structure and (at upper bands) argument and bias.
// Wrong choices are real comprehension errors: a true detail that isn't the main idea, a too-broad statement,
// something the text doesn't say, a word's other meaning. `whyWrong` explains the specific mistake.
// Used in three ways: as items in each skill's bank, as full sets in the Learn app ("Read a passage"),
// and as the books on the library shelf. Pure data; tests/curriculum.test.mjs and tests/readability.mjs check it.

export const PASSAGES = [
  // ================================================================ band 1 (K–1): short, decodable, one idea
  { id: 'p1-pup', band: 1, kind: 'story', title: 'The Big Red Ball', icon: '🐶',
    text: ['Sam has a pup. The pup is Pip.', 'Pip sees a big red ball. Pip runs to get it.', 'The ball rolls in the mud. Now Pip is a mud pup!', 'Sam gets the tub. Pip has a bath.'],
    qs: [
      { skill: 'read.sentences', q: 'Who is Pip?', a: 'A pup', o: ['A big ball', 'Sam', 'A tub'], why: 'The story says: “The pup is Pip.”' },
      { skill: 'read.sentences', q: 'What color is the ball?', a: 'Red', o: ['Blue', 'Green', 'Brown'], why: 'It says “a big red ball.”', ww: { Brown: 'The mud is brown, but the ball is red.' } },
      { skill: 'read.sentences', q: 'Why does Pip need a bath?', a: 'Pip got muddy', o: ['Pip is cold', 'Sam wants to swim', 'The ball is lost'], why: 'The ball rolled in the mud, and Pip became “a mud pup.” Mud means a bath.' },
      { skill: 'read.sentences', q: 'What happens last?', a: 'Pip has a bath', o: ['Pip sees the ball', 'The ball rolls in the mud', 'Sam gets a pup'], why: 'The last sentence is “Pip has a bath.”' },
    ] },
  { id: 'p1-seed', band: 1, kind: 'info', title: 'A Seed Grows', icon: '🌱',
    text: ['A seed is small.', 'Put it in the dirt. Give it sun and water.', 'Soon a stem pops up. Then it gets leaves.', 'One day it can be a big plant!'],
    qs: [
      { skill: 'read.sentences', q: 'What does a seed need to grow?', a: 'Sun and water', o: ['Rocks and sand', 'Toys', 'Snow'], why: 'The text says “Give it sun and water.”' },
      { skill: 'read.sentences', q: 'What comes up first?', a: 'A stem', o: ['Leaves', 'A big plant', 'A flower'], why: '“Soon a stem pops up. Then it gets leaves.” The stem comes first.' },
      { skill: 'read.sentences', q: 'What is this text mostly about?', a: 'How a seed grows into a plant', o: ['How to make dirt', 'Why the sun is hot', 'A girl and her dog'], why: 'Every sentence tells a step in how a seed grows.' },
    ] },
  { id: 'p1-hat', band: 1, kind: 'story', title: 'The Lost Hat', icon: '🎩',
    text: ['Meg had a hat. It was her best hat.', 'The wind went whoosh! The hat flew up.', 'Meg ran and ran. The hat got stuck in a tree.', 'Dad got a step stool. He got the hat. Meg was glad.'],
    qs: [
      { skill: 'read.sentences', q: 'What made the hat fly up?', a: 'The wind', o: ['A bird', 'Dad', 'A dog'], why: '“The wind went whoosh! The hat flew up.”' },
      { skill: 'read.sentences', q: 'Where did the hat get stuck?', a: 'In a tree', o: ['On a car', 'In a pond', 'On the roof'], why: 'It says “The hat got stuck in a tree.”' },
      { skill: 'read.sentences', q: 'How did Meg feel at the end?', a: 'Glad', o: ['Sad', 'Mad', 'Sleepy'], why: 'The last words are “Meg was glad.” She had her hat back.' },
    ] },
  // ================================================================ band 2 (grades 2–3): a few paragraphs, story elements, key details
  { id: 'p2-garden', band: 2, kind: 'story', title: 'The Roof Garden', icon: '🌻',
    text: ['Lena lived on the top floor of a tall building. There was no yard, only a flat gray roof.',
      'One spring, Lena asked the building manager if she could plant a garden up there. He said yes, but only in pots.',
      'Lena and her neighbor Mr. Diaz carried up pots, soil and seeds. They planted beans, tomatoes and sunflowers. Every morning, Lena watered them before school.',
      'In July, the sunflowers grew taller than Lena. People from other floors came up to look. Soon, six families had pots on the roof.'],
    qs: [
      { skill: 'read.story', q: 'What problem does Lena have at the start?', a: 'She has no yard for a garden', o: ['Her plants are dying', 'She is afraid of the roof', 'Mr. Diaz is moving away'], why: 'The story starts by saying there was “no yard, only a flat gray roof.” That is the problem she solves.' },
      { skill: 'read.paragraph', q: 'What did the manager say Lena had to use?', a: 'Pots', o: ['A big wooden box', 'The building’s yard', 'Plastic bags'], why: 'He said yes, “but only in pots.”' },
      { skill: 'read.main', q: 'What is the story mostly about?', a: 'Lena turns a gray roof into a garden that others join', o: ['Sunflowers can grow very tall', 'Lena waters plants before school', 'Buildings have managers'], why: 'The details (asking, planting, watering, neighbors joining) all build to one big idea: Lena made a roof garden that grew a community.', ww: { 'Sunflowers can grow very tall': 'That’s a true detail, but it’s only one part. The main idea covers the whole story.' } },
      { skill: 'read.story', q: 'How did other people feel about the garden? How do you know?', a: 'They liked it, because six families added pots', o: ['They were angry, because it was noisy', 'They did not notice it', 'They liked it, because the manager said so'], why: 'People “came up to look,” and soon six families had pots. Their actions show they liked it.' },
    ] },
  { id: 'p2-bats', band: 2, kind: 'info', title: 'Bats at Night', icon: '🦇',
    text: ['Bats are the only mammals that can really fly. Their wings are made of thin skin stretched over long finger bones.',
      'Most bats sleep during the day and hunt at night. Many of them eat insects. One small bat can catch hundreds of mosquitoes in an hour.',
      'How do bats find bugs in the dark? They make high squeaks that people cannot hear. The sound bounces off a bug and comes back to the bat’s ears. This is called echolocation.',
      'Bats help people by eating insects that bite us and harm crops.'],
    qs: [
      { skill: 'read.paragraph', q: 'What are a bat’s wings made of?', a: 'Thin skin over long finger bones', o: ['Feathers', 'Hard shell', 'Fur and claws'], why: 'Paragraph 1 says the wings are “thin skin stretched over long finger bones.”' },
      { skill: 'read.paragraph', q: 'How do bats find bugs in the dark?', a: 'They listen for their own squeaks bouncing back', o: ['They have bright eyes like flashlights', 'They smell the bugs', 'They wait for bugs to land on them'], why: 'The sound “bounces off a bug and comes back to the bat’s ears.” That is echolocation.' },
      { skill: 'read.main', q: 'What is the last paragraph mostly about?', a: 'How bats help people', o: ['How bats fly', 'When bats sleep', 'What echolocation is'], why: 'It says bats “help people by eating insects that bite us and harm crops.”' },
      { skill: 'read.paragraph', q: 'Which detail shows that bats eat a lot?', a: 'One bat can catch hundreds of mosquitoes in an hour', o: ['Bats sleep during the day', 'Bats are mammals', 'People cannot hear bat squeaks'], why: '“Hundreds of mosquitoes in an hour” is a huge amount for one small bat.' },
    ] },
  { id: 'p2-race', band: 2, kind: 'story', title: 'Second Place', icon: '🏃',
    text: ['Omar practiced running every day after school. He wanted to win the school race.',
      'On race day, Omar ran as fast as he could. Near the end, his friend Kay passed him and crossed the line first. Omar came in second.',
      'At first, Omar felt his face get hot. Then he looked at the clock. He had run faster than ever before.',
      'Omar walked over to Kay. “Great race,” he said, and gave her a high five. “Next year, I’ll be right behind you. Or in front!”'],
    qs: [
      { skill: 'read.story', q: 'What did Omar want at the beginning?', a: 'To win the school race', o: ['To make a new friend', 'To stop running', 'To be the race judge'], why: 'The story says, “He wanted to win the school race.”' },
      { skill: 'read.story', q: '“Omar felt his face get hot.” What does this show?', a: 'He was upset about not winning', o: ['He had a fever', 'The sun was very hot', 'He was happy to win'], why: 'A hot face often means you feel upset or let down. He had just come in second.' },
      { skill: 'read.main', q: 'What lesson does Omar learn?', a: 'Doing your best and improving matters, even if you don’t win', o: ['You should never race your friends', 'Winning is the only thing that matters', 'Practice does not help'], why: 'He sees he ran his fastest ever. Then he gives Kay a high five. He cares about getting better.' },
    ] },
  // ================================================================ band 3 (grades 4–5): longer texts, inference, vocabulary in context, structure
  { id: 'p3-library', band: 3, kind: 'info', title: 'Libraries Without Walls', icon: '📚',
    text: ['Most people picture a library as a quiet building full of shelves. But some libraries travel to their readers.',
      'In parts of Kenya, “camel libraries” carry boxes of books to villages far from any road. A camel can walk through sand and dry land where a truck would get stuck. Each visit, children return the books they borrowed and choose new ones.',
      'In Norway, a library boat sails along the coast every winter, stopping at small islands. In many cities, bookmobiles, which are buses with shelves inside, park at schools and parks.',
      'These libraries share one goal: getting books to people who cannot easily reach a library building. Librarians say that when books come often, children read more and become stronger readers.'],
    qs: [
      { skill: 'read.summarize', q: 'Which sentence best summarizes the article?', a: 'Some libraries travel by camel, boat or bus to bring books to people who can’t reach a library', o: ['Camels can walk through sand better than trucks', 'Norway has many small islands', 'Libraries are quiet buildings full of shelves'], why: 'A summary gives the main idea and the most important support: traveling libraries reach people who are far away.', ww: { 'Camels can walk through sand better than trucks': 'True, but that is one supporting detail, not a summary of the whole article.' } },
      { skill: 'read.context', q: 'In paragraph 3, what is a bookmobile?', a: 'A bus with shelves of books inside', o: ['A phone app for reading', 'A boat that sails to islands', 'A moving staircase'], why: 'The sentence defines it right after the commas: “bookmobiles, which are buses with shelves inside.”' },
      { skill: 'read.inference', q: 'Why would a camel be used instead of a truck in some places?', a: 'There are no roads, and a truck would get stuck in sand', o: ['Camels are faster than trucks', 'Trucks are not allowed in Kenya', 'Children like camels more than trucks'], why: 'The article says the villages are “far from any road” and a truck “would get stuck.” You put those clues together.' },
      { skill: 'read.purpose', q: 'Why did the author mention Kenya, Norway and cities?', a: 'To give examples of different traveling libraries', o: ['To compare the weather in three places', 'To tell a story about one family', 'To persuade you to visit Norway'], why: 'Each place shows another way libraries travel. Examples support the main idea.' },
      { skill: 'read.evidence', q: 'Which sentence best supports the idea that traveling libraries help children?', a: '“When books come often, children read more and become stronger readers.”', o: ['“A camel can walk through sand and dry land.”', '“A library boat sails along the coast every winter.”', '“Most people picture a library as a quiet building.”'], why: 'Only that sentence shows an effect on children’s reading.' },
    ] },
  { id: 'p3-storm', band: 3, kind: 'story', title: 'The Storm Shift', icon: '⛈️',
    text: ['The lights in Fresh Mart flickered twice, then went out. For a moment the store was silent. Then a toddler started to cry.',
      'Theo had only worked at the register for three weeks. His heart pounded, but he remembered what Rosa had taught him: “If the power goes out, stay calm, keep people safe, then help them finish.”',
      '“Everyone, please stay where you are for a moment,” Theo called, switching on his phone’s flashlight. The emergency lights hummed on above the doors. He walked to the crying child’s mom and pointed her toward the bright exit sign.',
      'With no computer, Theo added prices with a pencil and paper. The line moved slowly, but no one left angry. When the power returned, Rosa found him finishing the last receipt. “You were steady as a rock,” she said.'],
    qs: [
      { skill: 'read.inference', q: 'How did Theo feel when the lights went out? Which clue shows it?', a: 'Nervous: “His heart pounded”', o: ['Bored: “The line moved slowly”', 'Angry: “a toddler started to cry”', 'Excited: “the emergency lights hummed on”'], why: 'A pounding heart is a sign of fear or nerves. The other clues describe other people or the store.' },
      { skill: 'read.figurative', q: 'Rosa says Theo was “steady as a rock.” What does she mean?', a: 'He stayed calm and dependable', o: ['He did not move all day', 'He was heavy and slow', 'He was hard and unkind'], why: 'This simile compares Theo to a rock, which doesn’t shake. She means he stayed calm under pressure.' },
      { skill: 'read.story', q: 'What helped Theo solve the problem?', a: 'He remembered Rosa’s training', o: ['A customer took over', 'The power came back right away', 'He closed the store'], why: 'He recalled her rule: stay calm, keep people safe, then help them finish. Then he followed it.' },
      { skill: 'read.summarize', q: 'Which is the best summary of the story?', a: 'During a power outage, new cashier Theo stays calm, keeps customers safe and adds prices by hand', o: ['Theo has worked at Fresh Mart for three weeks', 'A toddler cries in the store', 'Rosa says Theo was steady as a rock'], why: 'A summary tells the main events: the problem, what Theo did, and how it turned out.' },
    ] },
  { id: 'p3-bridge', band: 3, kind: 'info', title: 'Why Bridges Have Triangles', icon: '🌉',
    text: ['Look closely at many bridges, towers and cranes and you will see triangles. Engineers use them on purpose.',
      'Try this: build a square from four straws and pins at the corners. Push one corner, and the square easily squishes into a slanted shape. Now add one straw across the middle from corner to corner. The square becomes two triangles, and it holds its shape.',
      'A triangle is rigid. Its sides can only fit together one way, so pushing on it does not change its shape unless a side bends or breaks. This is why triangles spread a heavy load across a whole bridge instead of letting one spot sag.',
      'Next time you cross a bridge, count the triangles. Each one is doing a job.'],
    qs: [
      { skill: 'read.context', q: 'In paragraph 3, “rigid” most likely means…', a: 'Stiff; it keeps its shape', o: ['Soft and bendy', 'Very colorful', 'Hard to see'], why: 'The next sentence explains it: pushing on it “does not change its shape.”' },
      { skill: 'read.compare', q: 'How is a straw square different from two straw triangles?', a: 'The square squishes when pushed; the triangles hold their shape', o: ['The square is stronger', 'They act exactly the same', 'Triangles need more pins to stand up'], why: 'The experiment shows the square slants but adding one straw makes triangles that hold.' },
      { skill: 'read.purpose', q: 'Why does the author include the straw experiment?', a: 'So readers can test the idea themselves', o: ['To show how to make a toy', 'To prove that straws are strong', 'To describe a famous bridge'], why: 'The experiment lets you see why triangles are rigid, which supports the main idea.' },
      { skill: 'read.inference', q: 'What would probably happen to a bridge built only with squares and no cross pieces?', a: 'It could bend out of shape under a heavy load', o: ['It would be stronger than a triangle bridge', 'Nothing; shape doesn’t matter', 'It would float'], why: 'Squares squish when pushed, so a heavy load could make the bridge sag or lean.' },
    ] },
  // ================================================================ band 4 (grades 6–7): argument, point of view, evidence, technical text
  { id: 'p4-phones', band: 4, kind: 'argument', title: 'Should Phones Be Banned at School?', icon: '📵',
    text: ['Many schools are debating whether students should be allowed to use phones during the day.',
      'Supporters of a ban argue that phones distract students. A study of schools in England found that test scores rose after phones were banned, especially for students who had been struggling. Teachers also report fewer conflicts that start online and spill into the hallway.',
      'Opponents point out that phones can be learning tools: calculators, dictionaries and cameras for science projects. Many parents want to reach their children in an emergency. Some students say a ban treats them as if they cannot make good choices.',
      'A middle path is used by some schools: phones stay in lockers during class but can be used at lunch. Whatever a school decides, the strongest policies are explained clearly and applied fairly to everyone.'],
    qs: [
      { skill: 'read.evidence', q: 'Which evidence do supporters of a ban use?', a: 'Test scores rose in English schools after bans', o: ['Phones can be used as calculators', 'Parents want to reach their children', 'Some schools allow phones at lunch'], why: 'The study about test scores is the supporters’ evidence. The other choices are from opponents or the middle path.' },
      { skill: 'read.purpose', q: 'What is the author’s purpose?', a: 'To explain both sides of the debate fairly', o: ['To convince readers that phones must be banned', 'To sell a new phone', 'To tell a funny story about a student'], why: 'The author gives arguments for, against and a middle path without taking a side. That’s informing, not persuading.', ww: { 'To convince readers that phones must be banned': 'The author includes strong reasons against a ban too, and ends neutrally. A persuasive text would push one side.' } },
      { skill: 'read.factopinion', q: 'Which sentence states an opinion rather than a fact?', a: '“The strongest policies are explained clearly and applied fairly to everyone.”', o: ['“A study of schools in England found that test scores rose.”', '“Some schools keep phones in lockers during class.”', '“Many schools are debating phone use.”'], why: '“Strongest” is a judgment. The others can be checked.' },
      { skill: 'read.sources', q: 'What would make the supporters’ argument stronger?', a: 'Results from more studies in different places', o: ['A louder headline', 'A quote from a phone company ad', 'More adjectives like “terrible”'], why: 'One study is a start. More evidence from more places makes a claim more convincing.' },
      { skill: 'read.compare', q: 'How is the “middle path” different from a full ban?', a: 'Phones are put away in class but allowed at lunch', o: ['Phones are allowed everywhere all day', 'Phones are not allowed in school at all', 'Only teachers may use phones'], why: 'Paragraph 4 describes phones in lockers during class but used at lunch.' },
    ] },
  { id: 'p4-coral', band: 4, kind: 'info', title: 'Reefs in Hot Water', icon: '🪸',
    text: ['Coral reefs look like colorful rocks, but corals are animals. Each coral is a colony of tiny creatures called polyps. Inside their bodies live even tinier algae that make food from sunlight and share it with the coral. The algae also give corals their bright colors.',
      'When ocean water stays too warm for too long, the partnership breaks down. Stressed corals push out their algae and turn white, a change called bleaching. A bleached coral is not dead yet, but it is starving. If the water cools within a few weeks, the algae can return. If the heat lasts, the coral may die.',
      'Reefs cover less than one percent of the ocean floor, yet about a quarter of all ocean species depend on them for food or shelter. Reefs also protect coastlines by breaking up waves during storms.',
      'Scientists are testing ways to help, from growing heat-tolerant corals in nurseries to reducing pollution that makes reefs weaker.'],
    qs: [
      { skill: 'read.technical', q: 'What causes coral bleaching?', a: 'Water stays too warm, so corals push out their algae', o: ['Corals are painted white by pollution', 'Fish eat the coral’s colors', 'Sunlight is too weak'], why: 'Paragraph 2: when water stays too warm, “stressed corals push out their algae and turn white.”' },
      { skill: 'read.inference', q: 'Why does a bleached coral start to starve?', a: 'The algae that made its food are gone', o: ['Fish stop visiting it', 'It forgets how to eat', 'White things cannot absorb water'], why: 'The algae “make food from sunlight and share it.” Without them, the coral loses most of its food.' },
      { skill: 'read.evidence', q: 'Which detail best shows why reefs matter so much?', a: 'About a quarter of all ocean species depend on reefs', o: ['Corals look like colorful rocks', 'Each coral is a colony of polyps', 'Scientists grow corals in nurseries'], why: 'A huge share of ocean life depends on a tiny area of reef. That shows their importance.' },
      { skill: 'read.context', q: 'In paragraph 4, “heat-tolerant” corals are corals that…', a: 'Can survive warmer water', o: ['Make the water warmer', 'Live only in cold water', 'Are kept in heated tanks forever'], why: 'Tolerant means able to put up with something. Heat-tolerant corals can handle more heat.' },
    ] },
  { id: 'p4-letter', band: 4, kind: 'story', title: 'The Letter in the Wall', icon: '✉️',
    text: ['When the old bakery on Cedar Avenue was being turned into a bike shop, a worker named June pried a loose brick from the wall and found a folded letter, brown at the edges.',
      '“To whoever finds this,” it began, in looping cursive. “It is 1952. Today I opened this bakery with my last forty dollars. My mother says I am foolish to risk everything. Perhaps she is right. But if you are reading this, the building is still standing, and so, I hope, is someone’s dream.”',
      'June read it twice. She thought about the bike shop she had been saving for since she was sixteen, and about her own mother’s warnings.',
      'That night, she wrote a letter of her own, sealed it in a jar and tucked it behind the same brick.'],
    qs: [
      { skill: 'read.inference', q: 'Why does June write her own letter at the end?', a: 'The baker’s words inspired her about her own risky dream', o: ['Her boss told her to', 'She wanted to sell the old letter', 'She was angry at the baker'], why: 'She thinks about her own saving and her mother’s warnings. The baker’s hope connects to her bike-shop dream.' },
      { skill: 'read.figurative', q: '“The building is still standing, and so, I hope, is someone’s dream.” What does the baker mean?', a: 'He hopes the reader’s dream is surviving too', o: ['He hopes the building is a dream', 'He wants the reader to stand up', 'He is talking about bricks'], why: 'He compares the building lasting to a dream lasting: both still standing.' },
      { skill: 'read.story', q: 'How are June and the baker alike?', a: 'Both risked their savings on a business despite warnings', o: ['Both are bakers', 'Both lived in 1952', 'Both found letters'], why: 'The baker used his last forty dollars; June saved for years. Both had mothers who warned them.' },
      { skill: 'read.purpose', q: 'Why does the author end with June hiding a letter in a jar?', a: 'To show the hope being passed on to the next person', o: ['To explain how jars are made', 'To show June is careless', 'To prove the bakery was a bad idea'], why: 'Her letter repeats what the baker did, carrying the message forward.' },
    ] },
  // ================================================================ band 5 (grades 8–9): rhetoric, bias, structure, informational analysis
  { id: 'p5-ad', band: 5, kind: 'argument', title: 'Two Messages About an Energy Drink', icon: '⚡',
    text: ['MESSAGE A (advertisement): “BLAST energy drink: the choice of champions! 9 out of 10 athletes who tried BLAST said they felt more energized. Don’t fall behind. Every great day starts with a BLAST.”',
      'MESSAGE B (school nurse’s newsletter): “Energy drinks can contain as much caffeine as three cups of coffee, plus lots of sugar. The American Academy of Pediatrics advises that children and teens avoid them. Side effects can include a racing heart, trouble sleeping and anxiety. For real energy, try sleep, water and a balanced breakfast.”',
      'Both messages are about the same product, but they were written for different reasons, by writers with different goals.'],
    qs: [
      { skill: 'read.bias', q: 'Why should a reader be careful with Message A?', a: 'It was written to sell the drink, so it only shows one side', o: ['It is too short to be true', 'It uses numbers, so it must be wrong', 'It mentions athletes'], why: 'A seller gains if you believe it, so the ad leaves out risks. That’s bias from purpose.' },
      { skill: 'read.evidence', q: 'What is weak about the “9 out of 10 athletes” claim?', a: 'We don’t know how many athletes were asked or who asked them', o: ['Nine is an odd number', 'Athletes never drink anything', 'It should say 10 out of 10'], why: 'Ten athletes chosen by the company is very different from a large, independent study. The ad hides this.' },
      { skill: 'think.persuasion', q: '“Don’t fall behind” is an example of which technique?', a: 'Fear of missing out: making you worry others will get ahead', o: ['Citing an expert', 'Giving a statistic', 'Comparing two products fairly'], why: 'It tries to change what you do by making you anxious, not by giving evidence.' },
      { skill: 'read.sources', q: 'Why is Message B more trustworthy for health advice?', a: 'It cites a medical organization and has nothing to sell', o: ['It is longer', 'It uses capital letters', 'It is written by a coach'], why: 'Message B names an expert group (the American Academy of Pediatrics) and gains nothing if you agree.' },
    ] },
  { id: 'p5-dam', band: 5, kind: 'info', title: 'The River That Came Back', icon: '🐟',
    text: ['For nearly a century, two concrete dams blocked the Elwha River in Washington State. They produced electricity for a nearby mill, but they also cut salmon off from more than seventy miles of the river where the fish once laid their eggs. Salmon runs that had numbered in the hundreds of thousands fell to a few thousand.',
      'The dams also trapped sediment, the sand and gravel a river naturally carries downstream. Without it, the beaches at the river’s mouth shrank, and the shellfish that lived there declined.',
      'Between 2011 and 2014, the dams were removed in what was then the largest dam removal in history. Within months, salmon were swimming above the old dam sites. The released sediment rebuilt beaches, and the river’s estuary, where fresh water meets the sea, began to recover.',
      'Not every dam should come down. Many provide clean energy, flood control or drinking water. But the Elwha shows that when a dam’s costs outweigh its benefits, a river can heal faster than many scientists expected.'],
    qs: [
      { skill: 'read.summarize', q: 'Which statement best summarizes the article?', a: 'Removing two dams on the Elwha River let salmon and beaches recover, showing rivers can heal when a dam’s costs outweigh its benefits', o: ['Dams produce electricity for mills', 'All dams should be removed', 'Salmon lay eggs in rivers'], why: 'A strong summary includes the cause (removal), the effects (salmon, sediment) and the author’s larger point.', ww: { 'All dams should be removed': 'The author says the opposite: “Not every dam should come down.”' } },
      { skill: 'read.technical', q: 'According to the article, what is sediment?', a: 'Sand and gravel a river carries downstream', o: ['Concrete from the dam', 'Salmon eggs', 'Electricity from the mill'], why: 'The text defines it: “the sand and gravel a river naturally carries downstream.”' },
      { skill: 'read.inference', q: 'Why did the beaches shrink while the dams stood?', a: 'Sediment that would rebuild them was trapped behind the dams', o: ['Salmon ate the sand', 'Ocean waves stopped', 'The mill used the sand'], why: 'Without new sediment arriving, waves wore the beaches away. The text links the trapped sediment to shrinking beaches.' },
      { skill: 'read.purpose', q: 'Why does the author include the last paragraph?', a: 'To give a balanced view: some dams are useful, so decisions depend on costs and benefits', o: ['To argue that all dams are bad', 'To describe how concrete is made', 'To tell a story about fishing'], why: 'It qualifies the claim so readers don’t overgeneralize from one example.' },
    ] },
  { id: 'p5-poem', band: 5, kind: 'poem', title: 'First Paycheck (a poem)', icon: '📝',
    text: ['It isn’t much: a slip of paper, / numbers in a narrow box. / But I folded it like a letter / and carried it home in my pocket like a key.',
      'My grandmother laughed and said, / “A key to what?” / I didn’t know yet. / Only that a door was somewhere, / and for the first time, / I had built something that might open it.'],
    qs: [
      { skill: 'read.figurative', q: 'The speaker carries the paycheck “like a key.” What does this simile suggest?', a: 'The paycheck feels like it could open new opportunities', o: ['The paycheck is made of metal', 'The speaker lost their house key', 'The paycheck locks things away'], why: 'Keys open doors. The speaker feels the money they earned could open a door to their future.' },
      { skill: 'read.inference', q: 'How does the speaker feel about the paycheck?', a: 'Proud and hopeful, even though it is small', o: ['Disappointed and angry', 'Bored', 'Afraid of losing it'], why: '“It isn’t much” admits it’s small, but folding it carefully and calling it a key shows pride and hope.' },
      { skill: 'read.story', q: 'What is the theme (big message) of the poem?', a: 'Earning something yourself, however small, can be the start of something bigger', o: ['Grandmothers like to laugh', 'Paychecks should be folded neatly', 'Money is all that matters'], why: 'The poem moves from a small slip of paper to a door the speaker might open: small beginnings matter.' },
    ] },
  // ================================================================ band 6 (grades 10–12): complex argument, rhetoric, synthesis
  { id: 'p6-minwage', band: 6, kind: 'argument', title: 'Raising the Minimum Wage: Two Views', icon: '⚖️',
    text: ['VIEW 1 (an economist who supports a raise): “Workers earning the federal minimum wage of $7.25 an hour, unchanged since 2009, have lost purchasing power every year as prices rose. Several recent studies of state increases found little or no loss of jobs, while workers’ earnings rose. Higher pay can also reduce costly employee turnover, as workers stay longer in their jobs.”',
      'VIEW 2 (a small-business owner who opposes a large raise): “Big companies can absorb higher wages; my eight-person diner cannot. If my labor costs jump by a third, I will raise prices, cut hours or replace a cashier with a kiosk. The research is mixed: some studies find job losses for the youngest, least experienced workers, who most need a first job.”',
      'Both writers agree that workers deserve to earn a living and that businesses must stay open. They disagree about how large an increase the economy can bear, and about which evidence matters most.'],
    qs: [
      { skill: 'read.research', q: 'What is the main point of disagreement between the two writers?', a: 'How large a raise businesses and the job market can handle', o: ['Whether workers deserve to earn a living', 'Whether businesses should stay open', 'What the current federal minimum wage is'], why: 'The last paragraph says they agree on fairness and survival but “disagree about how large an increase the economy can bear.”', ww: { 'Whether workers deserve to earn a living': 'They agree on this. A disagreement has to be something they see differently.' } },
      { skill: 'read.evidence', q: 'How does each writer use evidence differently?', a: 'View 1 cites studies of state increases; View 2 relies mostly on personal business experience, plus mixed research', o: ['Both rely only on personal stories', 'Neither uses any evidence', 'View 2 cites more studies than View 1'], why: 'View 1 leans on studies and data; View 2 leans on the diner’s costs and notes the research is mixed. Recognizing evidence types helps you weigh claims.' },
      { skill: 'read.bias', q: 'Which statement fairly describes both writers?', a: 'Each has a perspective shaped by their role, so a careful reader checks their claims against other sources', o: ['The economist has no point of view', 'The business owner is lying', 'Only one of them can be trusted'], why: 'Perspective isn’t the same as dishonesty. Both bring relevant experience; strong readers compare and verify.' },
      { skill: 'think.evidence', q: 'Which additional information would best help a reader judge the two views?', a: 'Large, independent studies of raises like this one, including effects on small businesses and young workers', o: ['The color of the diner’s sign', 'How many people like the economist', 'Which view has more exclamation points'], why: 'Good judgments come from relevant, independent evidence that addresses both writers’ main concerns.' },
      { skill: 'read.contracts', q: '“Workers … have lost purchasing power every year.” What does purchasing power mean here?', a: 'How much a person’s money can buy', o: ['How many hours a person works', 'The power of a store to set prices', 'A worker’s right to shop'], why: 'If wages stay at $7.25 while prices rise, each dollar buys less: purchasing power falls.' },
    ] },
  { id: 'p6-algorithms', band: 6, kind: 'info', title: 'Who Decides What You See?', icon: '📱',
    text: ['Every time you open a social media app, an algorithm (a set of rules a computer follows) decides which posts appear first. It does not show posts in the order they were made. Instead, it predicts which posts you are most likely to watch, like or share, based on what you and people like you have done before.',
      'Companies design these algorithms to keep users scrolling, because more time on the app means more ads they can sell. Research suggests that posts that provoke strong emotions, especially outrage, tend to spread faster than calm ones. As a result, a feed can gradually tilt toward more extreme content without anyone choosing that on purpose.',
      'Some researchers warn that this can create “filter bubbles,” where people mostly see views they already hold. Others argue the effect is smaller than feared, because many people still encounter different views through friends, news sites and school.',
      'Users are not powerless. Following a wider range of sources, using settings that show posts in time order, and noticing how a post makes you feel before sharing it are small habits that put more choices back in your hands.'],
    qs: [
      { skill: 'read.research', q: 'According to the article, why might a feed tilt toward extreme content?', a: 'Algorithms reward posts that get strong reactions, and outrage spreads faster', o: ['Companies want users to be angry on purpose', 'Users can only follow extreme accounts', 'Algorithms show posts in the order they were made'], why: 'Paragraph 2 explains the chain: keep users scrolling → reward engagement → emotional posts spread → feeds tilt, “without anyone choosing that on purpose.”', ww: { 'Companies want users to be angry on purpose': 'The article says it happens “without anyone choosing that on purpose.” Read carefully for what the text claims.' } },
      { skill: 'read.sources', q: 'How does the author handle the idea of “filter bubbles”?', a: 'Presents the warning and the counterargument that the effect may be smaller', o: ['Proves filter bubbles affect everyone equally', 'Ignores the idea completely', 'Says filter bubbles are a myth with no research'], why: 'Paragraph 3 gives both sides: “Some researchers warn…” and “Others argue…”.' },
      { skill: 'tech.ai', q: 'What does the article mean by an algorithm?', a: 'A set of rules a computer follows to make decisions', o: ['A type of advertisement', 'A person who chooses posts by hand', 'A phone’s battery setting'], why: 'The first paragraph defines it in parentheses.' },
      { skill: 'think.systems', q: 'Which choice describes the system in paragraph 2 as a feedback loop?', a: 'More engagement → more emotional posts shown → more engagement', o: ['Ads → fewer users → no ads', 'Calm posts → more outrage → calm posts', 'Users post → posts disappear'], why: 'In a feedback loop, the result feeds back and strengthens its cause, which is why the tilt can grow over time.' },
    ] },
];

/** each passage question as an item for its skill's bank (tagged with the passage band) */
export const PASSAGE_GEN = {};
for (const P of PASSAGES) P.qs.forEach((Q, i) => {
  (PASSAGE_GEN[Q.skill] = PASSAGE_GEN[Q.skill] || []).push(() => ({ type: 'choice', skill: Q.skill, q: Q.q, a: Q.a, o: [Q.a, ...Q.o], why: Q.why, whyWrong: Q.ww, band: P.band, passage: P.id,
    v: { title: `${P.icon} ${P.title}`, lines: P.text } }));
});
/** passages near a reading level, easiest first */
export const passagesNear = (band) => PASSAGES.filter((P) => Math.abs(P.band - band) <= 1).sort((a, b) => Math.abs(a.band - band) - Math.abs(b.band - band));
