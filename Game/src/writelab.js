// REAL — Writing and Thinking Lab (the ✏️ Writing Lab app on the phone). Three tracks, each from easy to hard:
//  ✏️ Sentences: complete sentences → simple → compound (and, but, so) → complex (because, when, although) → fixing
//     run-ons and fragments → strong sentences
//  📄 Paragraphs: the parts → topic sentences → details that belong → transition words → closing sentences → writing a
//     whole paragraph of your own with a step-by-step builder
//  🧠 Critical thinking: fact or opinion → claim, evidence, reason → good and weak reasons → asking good questions →
//     two sides of a choice → spotting tricks
// Every lesson: a short teaching card with examples (Heart reads it), practice questions, then you write your own.
// Progress: state.wlab = { done: { lessonId: day } }
import { h, UI } from './ui.js';
import { tr } from './i18n.js';
import { runActivity } from './learnkit.js';
import { celebrate } from './rewards.js';

const ch = (skill, q, a, wrong, why) => ({ type: 'choice', skill, q, a, o: [a, ...wrong], why });
const so = (skill, q, bins, items) => ({ type: 'sort', skill, q, bins, items });
const or = (skill, q, items) => ({ type: 'order', skill, q, items });
const wr = (skill, q, minWords, rubric, model) => ({ type: 'write', skill, q, minWords, rubric, model });
const S = 'write.sentences', C = 'write.commas', G2 = 'write.grammar', P = 'write.paragraph', E = 'think.evidence', V = 'think.evaluate', R = 'think.persuasion', O = 'think.observe', CMP = 'think.compare';
const JOIN = /,\s*(and|but|so|or|yet)\s+\w/i, SUB = /\b(because|when|although|though|if|since|after|before|while|until|unless)\b/i;

export const TRACKS = [['sent', '✏️', 'Sentences'], ['para', '📄', 'Paragraphs'], ['think', '🧠', 'Critical thinking']];
export const LAB = [
  // ------------------------------------------------------------------ ✏️ SENTENCES
  { id: 's1', t: 'sent', title: 'What makes a sentence', teach: ['A sentence tells a whole idea.', 'It needs who (the subject) and what they do (the verb).', 'It starts with a capital letter and ends with a period, a question mark or an exclamation mark.'],
    ex: [['✓ Sentence', 'Rosa opens the store.'], ['✗ Not yet', 'Opens the store.'], ['Why?', 'Who opens the store? The second one does not say.']],
    qs: [ch(S, 'Which one is a complete sentence?', 'The bus stops at the park.', ['Stops at the park.', 'The bus at the park.'], 'It says who (the bus) and what it does (stops).'),
      so(S, 'Sentence or not yet?', ['Sentence', 'Not yet'], [['Dee makes coffee.', 'Sentence'], ['After my shift.', 'Not yet'], ['The dog runs fast.', 'Sentence'], ['A big red truck.', 'Not yet']]),
      ch(S, 'What is missing? “Fixes bikes every day.”', 'Who fixes the bikes', ['A period', 'A capital letter'], 'We need to know who does it: “Sam fixes bikes every day.”'),
      ch(S, 'Which one is written correctly?', 'We saved ten dollars.', ['we saved ten dollars.', 'We saved ten dollars'], 'A capital at the start and a period at the end.')],
    write: wr(S, 'Write one complete sentence about your day. Say who, and what they did.', 4, [['Has a verb (an action word)', /\b(\w+ed|is|was|am|are|went|go|goes|made|make|ate|saw|got|get|had|have|has|did|do|does|ran|run|work\w*|play\w*|cook\w*|walk\w*|help\w*)\b/i, 'I worked…']], 'I worked at Fresh Mart this morning.') },
  { id: 's2', t: 'sent', title: 'Simple sentences', teach: ['A simple sentence has one idea.', 'Subject + verb + more details.', 'Put the words in the right order so it makes sense.'],
    ex: [['Subject', 'The baker'], ['Verb', 'bakes'], ['Details', 'fresh bread every morning.'], ['Together', 'The baker bakes fresh bread every morning.']],
    qs: [or(S, 'Put the words in order to make a sentence.', ['The', 'cat', 'sleeps', 'on', 'the', 'mat.']),
      or(S, 'Put the words in order to make a sentence.', ['My', 'friend', 'rides', 'the', 'bus.']),
      ch(S, 'What is the subject (who) in: “The tall nurse helps people.”', 'The tall nurse', ['helps', 'people'], 'The subject is who the sentence is about.'),
      ch(S, 'What is the verb (action) in: “Jax runs to the park.”', 'runs', ['Jax', 'park'], 'The verb is what the subject does.')],
    write: wr(S, 'Write a simple sentence about a place in the city. One idea, with a subject and a verb.', 5, [], 'The library has many good books.') },
  { id: 's3', t: 'sent', title: 'Joining ideas: and, but, so', teach: ['A compound sentence joins two whole sentences.', 'Put a comma, then a joining word:', 'and (adds more) · but (shows a difference) · so (shows what happens next).'],
    ex: [['Two sentences', 'I was hungry. I made a sandwich.'], ['Joined', 'I was hungry, so I made a sandwich.'], ['With but', 'I wanted the bike, but it cost too much.']],
    qs: [ch(C, 'Pick the best joining word: “It started to rain, ___ I opened my umbrella.”', 'so', ['but', 'and'], 'The rain is the reason, so the umbrella comes next.'),
      ch(C, 'Pick the best joining word: “I like apples, ___ I do not like pears.”', 'but', ['so', 'and'], '“But” shows a difference.'),
      ch(C, 'Which compound sentence is written correctly?', 'Rosa counted the money, and Dee locked the door.', ['Rosa counted the money and, Dee locked the door.', 'Rosa counted the money Dee locked the door.'], 'Comma before the joining word.'),
      ch(C, 'Join these: “The store opens at 8. I get there at 7:50.”', 'The store opens at 8, so I get there at 7:50.', ['The store opens at 8 so, I get there at 7:50.', 'The store opens at 8, I get there at 7:50.'], 'Two whole ideas, a comma, and “so”.')],
    write: wr(C, 'Write one compound sentence. Join two ideas with a comma and “and”, “but” or “so”.', 7, [['Joins two ideas with “, and” “, but” or “, so”', JOIN, 'I saved my money, so I…']], 'I saved my money, so I bought a new bike.') },
  { id: 's4', t: 'sent', title: 'Harder sentences: because, when, although', teach: ['A complex sentence has a main idea and a helper idea.', 'The helper idea starts with a word like because, when, if, after or although.', 'If the helper idea comes first, put a comma after it.'],
    ex: [['Main idea', 'I wear a coat'], ['Helper idea', 'because it is cold.'], ['Together', 'I wear a coat because it is cold.'], ['Helper first', 'Because it is cold, I wear a coat.']],
    qs: [ch(G2, 'Pick the best word: “I go to bed early ___ I have work in the morning.”', 'because', ['although', 'but'], '“Because” gives the reason.'),
      ch(G2, 'Pick the best word: “___ it was raining, we still went to the park.”', 'Although', ['Because', 'So'], '“Although” shows something surprising.'),
      ch(C, 'Where does the comma go?', 'When the bus came, we got on.', ['When the bus came we, got on.', 'When, the bus came we got on.'], 'The comma goes after the helper idea when it comes first.'),
      or(G2, 'Put the parts in order to make a complex sentence.', ['After I finish my shift,', 'I will', 'cook dinner.'])],
    write: wr(G2, 'Write a sentence that uses “because”, “when” or “although”.', 7, [['Uses because, when, although, if, after or before', SUB, 'I was happy because…']], 'I was proud because I paid all my bills on time.') },
  { id: 's5', t: 'sent', title: 'Fixing run-ons and fragments', teach: ['A run-on crams two sentences together with nothing between them.', 'Fix it with a period, or with a comma + and, but or so.', 'A fragment is only part of a sentence. Fix it by adding what is missing.'],
    ex: [['Run-on', 'I was late I missed the bus.'], ['Fixed', 'I was late. I missed the bus.'], ['Also fixed', 'I was late, so I missed the bus.'], ['Fragment', 'Because I was tired.'], ['Fixed', 'I went to bed because I was tired.']],
    qs: [ch(S, 'Which one fixes this run-on? “The shop was closed we went home.”', 'The shop was closed, so we went home.', ['The shop was closed we, went home.', 'The shop was closed we went home!'], 'A comma and “so” join the two ideas.'),
      so(S, 'Is each one a run-on, a fragment, or correct?', ['Run-on', 'Fragment', 'Correct'], [['I cooked dinner I washed the dishes.', 'Run-on'], ['When the bell rang.', 'Fragment'], ['The bakery smells great.', 'Correct'], ['She paid the bill it was due.', 'Run-on']]),
      ch(S, 'Fix the fragment: “Because the bus was late.”', 'I was late for work because the bus was late.', ['Because the bus was late!', 'Because. The bus was late.'], 'Add the main idea so the sentence is whole.'),
      ch(S, 'Which sentence is correct?', 'My phone died, but I found a charger.', ['My phone died I found a charger.', 'My phone died, I found a charger.'], 'Two ideas need a comma and a joining word, or a period.')],
    write: wr(S, 'Fix this run-on and write it correctly: “I love the park it has a big pond.”', 8, [['Fixes the run-on (a period, or a comma + and/but/so/because)', (t) => /park[.!]\s+[A-Z]/.test(t) || /park,\s*(and|so|but)\b/i.test(t) || /park\s+because\b/i.test(t), 'I love the park because…']], 'I love the park because it has a big pond.') },
  { id: 's6', t: 'sent', title: 'Strong sentences', teach: ['Strong sentences use exact words.', '“Good” and “thing” are weak. “Crunchy” and “toolbox” paint a picture.', 'Start your sentences in different ways so they do not all sound the same.'],
    ex: [['Weak', 'The food was good.'], ['Strong', 'The warm bread was soft and buttery.'], ['Weak', 'He did a thing.'], ['Strong', 'He fixed the flat bike tire.']],
    qs: [ch(G2, 'Which sentence is stronger?', 'The tiny puppy chewed my blue sock.', ['The dog did something.', 'The puppy was there.'], 'Exact words help us see it.'),
      ch(G2, 'Pick the strongest word: “The soup was ___.”', 'steaming', ['good', 'nice'], '“Steaming” tells exactly how it was.'),
      ch(G2, 'Which one starts in a new way (not “I”)?', 'Every morning, I water the plants.', ['I water the plants.', 'I water the plants every morning.'], 'Starting with “Every morning” adds variety.'),
      ch(G2, 'Which sentence gives the most detail?', 'At noon, Rosa stacked forty red apples by the door.', ['Rosa stacked apples.', 'Rosa did some work.'], 'When, who, how many, what, where: lots of detail.')],
    write: wr(G2, 'Make this sentence stronger: “The store was nice.” Use exact words.', 7, [['Uses describing words (more than “nice” or “good”)', (t) => !/^\s*the store was (nice|good)\.?\s*$/i.test(t) && t.split(/\s+/).length >= 7, 'The bright little store…']], 'The bright little store smelled like fresh oranges.') },
  // ------------------------------------------------------------------ 📄 PARAGRAPHS
  { id: 'p1', t: 'para', title: 'The parts of a paragraph', teach: ['A paragraph is a group of sentences about one topic.', 'Topic sentence: tells the main idea.', 'Details: two or three sentences that explain or give examples.', 'Closing sentence: wraps it up.'],
    ex: [['Topic', 'Saving money helps you in many ways.'], ['Detail', 'First, you are ready when something breaks.'], ['Detail', 'Also, you can buy bigger things later.'], ['Closing', 'That is why I save a little every week.']],
    qs: [so(P, 'Which part of the paragraph is each sentence?', ['Topic', 'Detail', 'Closing'], [['Dogs make great pets.', 'Topic'], ['They love to play with you.', 'Detail'], ['They also keep you safe.', 'Detail'], ['A dog can be your best friend.', 'Closing']]),
      ch(P, 'What is a paragraph?', 'Sentences that all tell about one topic', ['One very long sentence', 'Sentences about many different topics'], 'One topic, many sentences.'),
      ch(P, 'Which sentence usually comes first?', 'The topic sentence', ['The closing sentence', 'A detail'], 'The topic sentence tells what the paragraph is about.'),
      ch(P, 'What does a closing sentence do?', 'It wraps up the main idea', ['It starts a new topic', 'It asks a random question'], 'It reminds the reader of the main idea.')],
    write: null },
  { id: 'p2', t: 'para', title: 'Topic sentences', teach: ['A topic sentence tells the main idea of the whole paragraph.', 'It is not too small (one detail) and not too big (everything in the world).'],
    ex: [['Too small', 'Bread costs two dollars.'], ['Too big', 'There are lots of things.'], ['Just right', 'The bakery is the busiest shop in Newtown.']],
    qs: [ch(P, 'Pick the best topic sentence for a paragraph about the park.', 'Brighter Park is a great place to relax.', ['There is a bench.', 'Things are good.'], 'It tells the main idea, not one small detail.'),
      ch(P, 'Details: “You can run there. You can have a picnic. You can play ball.” Best topic sentence?', 'There are many fun things to do at the park.', ['I like ball.', 'Picnics need food.'], 'It covers all three details.'),
      ch(P, 'Which is too small to be a topic sentence?', 'My bike has a bell.', ['Riding a bike is good for you.', 'Bikes help people get around the city.'], 'A bell is just one tiny detail.'),
      ch(P, 'Pick the best topic sentence about saving money.', 'Saving money can help you reach your goals.', ['Money is green.', 'I have a wallet.'], 'It tells the main idea the details can explain.')],
    write: wr(P, 'Write a topic sentence for a paragraph about your favorite food.', 6, [['Names the topic (food)', /\b(food|eat|pizza|taco|rice|soup|bread|pasta|apple|meal|favorite|favourite|dish|snack|burger|noodle|chicken|fruit)\w*/i, 'My favorite food is…']], 'My favorite food is my grandma’s chicken soup.') },
  { id: 'p3', t: 'para', title: 'Details that belong', teach: ['Every detail must be about the topic.', 'Good details give reasons, facts or examples.', 'Take out any sentence that wanders off the topic.'],
    ex: [['Topic', 'Pets need care every day.'], ['✓ Belongs', 'They need fresh water.'], ['✓ Belongs', 'They need food and walks.'], ['✗ Off topic', 'My cousin likes trains.']],
    qs: [ch(P, 'Topic: “Exercise keeps you healthy.” Which detail does not belong?', 'My favorite color is blue.', ['It makes your heart strong.', 'It helps you sleep better.'], 'Colors are not about exercise.'),
      so(P, 'Topic: “A good worker is on time.” Does each detail belong?', ['Belongs', 'Off topic'], [['They set an alarm.', 'Belongs'], ['They plan their bus ride.', 'Belongs'], ['Pizza is tasty.', 'Off topic'], ['They leave home early.', 'Belongs']]),
      ch(P, 'Which is the best detail for: “The city library is helpful.”', 'You can use the computers for free.', ['The sky was cloudy today.', 'I lost my shoe.'], 'It shows how the library helps.'),
      ch(P, 'Which detail gives an example?', 'For example, you can borrow books for free.', ['The library is a building.', 'Libraries.'], '“For example” gives a clear example.')],
    write: wr(P, 'Topic: “Breakfast is important.” Write two detail sentences that belong.', 12, [['Two sentences', (t) => (t.match(/[.!?]/g) || []).length >= 2, 'It gives you energy. Also,…'], ['Stays on breakfast / food / energy', /\b(energy|eat|food|morning|hungry|healthy|breakfast|focus|strong)\b/i]], 'It gives you energy for the morning. It also helps you focus at school or work.') },
  { id: 'p4', t: 'para', title: 'Transition words', teach: ['Transition words link your sentences like a bridge.', 'Order: first, next, then, finally.', 'Adding more: also, another, in addition.', 'Examples: for example, for instance.'],
    ex: [['First', 'First, wash your hands.'], ['Next', 'Next, cut the bread.'], ['Finally', 'Finally, add the cheese and eat!']],
    qs: [or(P, 'Put the paragraph in order using the transition words.', ['First, I wake up at 7.', 'Next, I eat breakfast.', 'Then, I catch the bus.', 'Finally, I clock in at work.']),
      ch(P, 'Pick the best transition: “I like the park. ___, it has a big pond.”', 'Also', ['First', 'Finally'], '“Also” adds another reason.'),
      ch(P, 'Pick the best transition: “Many jobs need reading. ___, a cashier reads prices.”', 'For example', ['Finally', 'Then'], '“For example” introduces an example.'),
      or(P, 'Put the steps of paying a bill in order.', ['First, open the Bills app.', 'Next, pick the bill that is due.', 'Then, check the amount.', 'Finally, tap Pay.'])],
    write: wr(P, 'Write three sentences about how to make a sandwich. Use First, Next and Finally.', 15, [['Uses First', /\bfirst\b/i, 'First, …'], ['Uses Next or Then', /\b(next|then)\b/i, 'Next, …'], ['Uses Finally', /\b(finally|last)\b/i, 'Finally, …']], 'First, get two slices of bread. Next, add cheese and turkey. Finally, put the bread on top and enjoy.') },
  { id: 'p5', t: 'para', title: 'Closing sentences', teach: ['A closing sentence ends the paragraph.', 'It says the main idea again in new words, or tells why it matters.', 'Words like “That is why”, “In the end” and “Now you know” can help.'],
    ex: [['Topic', 'Bikes are a great way to get around.'], ['Closing', 'That is why a bike is my favorite way to travel.']],
    qs: [ch(P, 'Topic: “Reading helps you every day.” Best closing?', 'That is why reading is a skill worth practicing.', ['I like cats.', 'Books have pages.'], 'It repeats the main idea and why it matters.'),
      ch(P, 'Which is a closing sentence?', 'In the end, hard work pays off.', ['First, I start the job.', 'For example, I fix a tire.'], '“In the end” wraps up.'),
      ch(P, 'Paragraph about helping neighbors. Best closing?', 'When we help each other, the whole city gets better.', ['Next, I walked home.', 'My bag is red.'], 'It sums up why helping matters.'),
      ch(P, 'What should a closing sentence not do?', 'Start a brand new topic', ['Repeat the main idea in new words', 'Tell why the idea matters'], 'A closing sentence ends the topic. It does not start a new one.')],
    write: wr(P, 'Topic: “Saving money helps you.” Write a closing sentence.', 6, [['Wraps up with a closing phrase or the main idea', /\b(that is why|that's why|in the end|so|now|this is why|saving|save)\b/i, 'That is why…']], 'That is why I save a little money every week.') },
  { id: 'p6', t: 'para', title: 'Write your own paragraph', builder: true, teach: ['Now put it all together!', 'One topic sentence, two or three details with transition words, and a closing sentence.', 'Build it one box at a time. Then read it all together.'],
    ex: [['Topic', 'The city is a good place to grow.'], ['Detail', 'First, there are many jobs to learn.'], ['Detail', 'Also, City School teaches new skills.'], ['Closing', 'That is why I am glad I came here.']], qs: [], write: null },
  // ------------------------------------------------------------------ 🧠 CRITICAL THINKING
  { id: 'c1', t: 'think', title: 'Fact or opinion?', teach: ['A fact can be checked and proved true.', 'An opinion is what someone thinks or feels.', 'Words like best, worst, should and I think often mean opinion.'],
    ex: [['Fact', 'The bus comes every 15 minutes.'], ['Opinion', 'The bus is the best way to travel.'], ['How to tell', 'Can you check it? Then it is a fact.']],
    qs: [so(O, 'Fact or opinion?', ['Fact', 'Opinion'], [['The bakery opens at 6 a.m.', 'Fact'], ['Bread is the best food.', 'Opinion'], ['Rent is due on Friday.', 'Fact'], ['Mondays are boring.', 'Opinion'], ['The park has a pond.', 'Fact']]),
      ch(O, 'Which one is a fact?', 'Water freezes at 32 °F.', ['Winter is the worst season.', 'Snow is beautiful.'], 'You can measure and prove it.'),
      ch(O, 'Which word is a clue for an opinion?', 'best', ['Tuesday', 'seven'], '“Best” tells what someone thinks.'),
      ch(O, 'Jax says: “This phone is the coolest one ever.” Is that a fact or an opinion?', 'Opinion', ['Fact', 'Both'], 'It is how Jax feels. It cannot be proved.')],
    write: wr(O, 'Write one fact and one opinion about your city.', 10, [['Two sentences', (t) => (t.match(/[.!?]/g) || []).length >= 2, 'The city has… I think…'], ['Has an opinion word (I think, best, should, love…)', /\b(i think|best|worst|should|love|favorite|favourite|great|boring|fun|beautiful|feel)\b/i, 'I think…']], 'The city has three bus routes. I think the park is the best place in town.') },
  { id: 'c2', t: 'think', title: 'Claim, evidence, reason', teach: ['A claim is what you think is true.', 'Evidence is a fact that supports it.', 'The reason explains how the evidence proves the claim.', 'Claim + evidence + reason = a strong answer.'],
    ex: [['Claim', 'The bike workshop is a good business.'], ['Evidence', 'It made $90 profit every day this week.'], ['Reason', 'Steady profit means it earns more than it costs.']],
    qs: [so(E, 'Is each sentence a claim, evidence or a reason?', ['Claim', 'Evidence', 'Reason'], [['Dee is a great friend.', 'Claim'], ['She helped me move on Saturday.', 'Evidence'], ['Friends help when it is hard, and she did.', 'Reason']]),
      ch(E, 'Claim: “The park needs more trash cans.” Best evidence?', 'Trash was on the ground in 12 places today.', ['I like the park a lot.', 'Trash cans are green.'], 'A fact you counted supports the claim.'),
      ch(E, 'Which is evidence (a fact), not a claim?', 'The store sold 60 coffees today.', ['The store is amazing.', 'Everyone should drink coffee.'], 'A number you can check is evidence.'),
      ch(E, 'Claim: “Saving is smart.” Evidence: “Mia saved $500 and fixed her car without a loan.” Best reason?', 'Saving let her pay for a surprise without owing money.', ['Cars are fast.', 'Mia likes blue.'], 'The reason connects the evidence to the claim.')],
    write: wr(E, 'Write a claim, then give evidence. Use “I think…” and “because…” or “For example…”.', 12, [['Makes a claim (I think / I believe)', /\b(i think|i believe|in my opinion|should)\b/i, 'I think…'], ['Gives evidence (because / for example)', /\b(because|for example|since|for instance)\b/i, 'because…']], 'I think buses are good for the city because one bus can carry fifty people.') },
  { id: 'c3', t: 'think', title: 'Good reasons and weak reasons', teach: ['A good reason gives facts or clear thinking.', 'A weak reason is just a feeling, a guess, or “everyone does it”.', 'Ask: does this reason really prove the point?'],
    ex: [['Claim', 'You should wear a helmet.'], ['Good reason', 'Helmets protect your head in a crash.'], ['Weak reason', 'Because I said so.']],
    qs: [ch(V, 'Claim: “Eat vegetables.” Which is the strongest reason?', 'They have vitamins that keep your body healthy.', ['My friend eats them.', 'They are green.'], 'It explains a real benefit.'),
      so(V, 'Good reason or weak reason? Claim: “Get to work on time.”', ['Good reason', 'Weak reason'], [['You could lose pay if you are late.', 'Good reason'], ['Everyone else is on time.', 'Weak reason'], ['Your team counts on you to open.', 'Good reason'], ['Because the clock is round.', 'Weak reason']]),
      ch(V, 'Which reason is just a feeling?', 'I just know it is right.', ['Tests showed it works 9 times out of 10.', 'The receipt shows the price.'], 'A feeling is not proof.'),
      ch(V, '“Everybody is buying these shoes, so you should too.” What is wrong with this reason?', 'Lots of people doing it does not make it right for you', ['Nothing, it is a great reason', 'Shoes are not real'], 'Think for yourself: do you need them, and can you afford them?')],
    write: wr(V, 'Claim: “Kids should learn to save money.” Write a good reason.', 8, [['Gives a real reason (because, so, helps, can…)', /\b(because|so|helps?|can|will|when|if)\b/i, 'Because saving helps…']], 'Because saving helps you pay for important things without borrowing.') },
  { id: 'c4', t: 'think', title: 'Asking good questions', teach: ['Thinkers ask questions before they decide.', 'Who says so? How do they know? What is missing? What else could be true?', 'A good question helps you find the truth.'],
    ex: [['You hear', '“This job pays $500 a day, no work needed!”'], ['Good question', 'Who is offering it, and how do they make the money?']],
    qs: [ch(V, 'A message says: “You won $1,000! Send $50 to claim it.” Best question to ask?', 'Why would a real prize ask me to pay money first?', ['What color is the money?', 'Can I win again tomorrow?'], 'That question uncovers the trick.'),
      ch(V, 'Your friend says the bakery closes at noon. Best question?', 'How do you know? Did you see the sign?', ['Do you like bread?', 'Is noon early?'], 'Asking how they know checks the facts.'),
      ch(V, 'A news story only talks to one person. What is missing?', 'Other people’s side of the story', ['More pictures', 'A longer title'], 'Fair stories hear from more than one side.'),
      ch(V, 'Before buying a used car, which question matters most?', 'Has it been in a crash, and can a mechanic check it?', ['Is the radio loud?', 'Is it shiny?'], 'Ask about the things that cost you later.')],
    write: wr(V, 'A store says: “Best price in the city!” Write a question you would ask to check.', 6, [['Is a question (ends with ?)', /\?\s*$/, 'How do you know…?']], 'How do your prices compare to the other stores?') },
  { id: 'c5', t: 'think', title: 'Two sides of a choice', teach: ['Most choices have good parts (pros) and bad parts (cons).', 'List both sides before you decide.', 'Then choose, and explain why the pros are worth more than the cons.'],
    ex: [['Choice', 'Buy a bike?'], ['Pros', 'Faster than walking. No bus fare. Good exercise.'], ['Cons', 'Costs $300. Needs repairs.'], ['Decision', 'Yes, because I save $10 a week on bus fare.']],
    qs: [so(CMP, 'Choice: take a second job. Pro or con?', ['Pro', 'Con'], [['More money for savings', 'Pro'], ['Less time to rest', 'Con'], ['Learn new skills', 'Pro'], ['Less time with friends', 'Con']]),
      ch(CMP, 'What should you do before choosing?', 'Look at the pros and the cons', ['Pick the first idea', 'Do what a stranger says'], 'Seeing both sides leads to better choices.'),
      ch(CMP, 'Choice: buy the $5 snack every day, or save it. Which is a con of buying it?', 'That is $35 a week you cannot save', ['It tastes good', 'It is quick'], 'A cost is a con.'),
      ch(CMP, 'Which decision explains WHY?', 'I will save it, because $35 a week adds up to a lot.', ['I will save it.', 'I don’t know.'], 'A decision with a reason is stronger.')],
    write: wr(CMP, 'Choice: should you buy a car or ride the bus? Write a pro, a con, and your decision with a reason.', 18, [['A pro (good part)', /\b(pro|good|faster|easier|freedom|cheaper|save|fast)\b/i, 'A pro is…'], ['A con (bad part)', /\b(con|bad|cost|expensive|gas|insurance|repairs?|slow|but)\b/i, 'A con is…'], ['A decision with a reason (because)', /\bbecause\b/i, 'I will… because…']], 'A pro of a car is that it is faster. A con is that gas and insurance cost a lot. I will ride the bus because it saves money.') },
  { id: 'c6', t: 'think', title: 'Spotting tricks', teach: ['Some messages try to trick you into buying or believing.', 'Watch for: “Too good to be true”, “Hurry, today only!”, “Everyone is doing it”, and famous people selling things.', 'Slow down, ask questions, and check the facts.'],
    ex: [['Trick', '“Hurry! Only 2 left! Buy now!”'], ['Why', 'Rushing you so you do not think.'], ['Smart move', 'Wait a day. If you still need it, check the price at other stores.']],
    qs: [so(R, 'Which tricks are these?', ['Hurry up', 'Everyone does it', 'Too good to be true'], [['“Sale ends in 5 minutes!”', 'Hurry up'], ['“All the cool kids have one.”', 'Everyone does it'], ['“Free phone, just pay shipping!”', 'Too good to be true'], ['“Get rich in one week!”', 'Too good to be true']]),
      ch(R, 'An ad shows a famous player wearing shoes. What should you remember?', 'They are paid to say it, so check the shoes yourself', ['The shoes will make you a famous player', 'Famous people never sell things'], 'Being famous does not make an ad true.'),
      ch(R, '“Only today! Sign up now or miss out forever!” What is the best move?', 'Slow down and check the details first', ['Sign up right away', 'Tell everyone to hurry'], 'Pressure to hurry is a warning sign.'),
      ch(R, 'Which message is most likely a trick?', '“Send us your bank password to get your prize.”', ['“Your library book is due Friday.”', '“Your shift starts at 9.”'], 'Real companies never ask for your password.')],
    write: wr(R, 'Write what you would say to a friend who wants to answer a “You won a prize! Pay $20 to get it” message.', 12, [['Warns them (don’t, careful, trick, scam, fake)', /\b(don'?t|do not|careful|trick|scam|fake|never|stop|wait)\b/i, 'Don’t pay, because…'], ['Gives a reason (because…)', /\b(because|since|real prizes|never ask)\b/i, 'because real prizes…']], 'Don’t pay it, because real prizes never ask you to send money first.') },
];
const done = (s) => ((s.wlab = s.wlab || { done: {} }).done);
export const labProgress = (s) => ({ done: LAB.filter((L) => done(s)[L.id]).length, total: LAB.length });
const unlocked = (s, L) => { const list = LAB.filter((x) => x.t === L.t), i = list.indexOf(L); return i === 0 || !!done(s)[list[i - 1].id]; };

/** the Writing Lab app: three tracks, lessons open one after another */
export function writingLab(G, close) {
  const s = G.state, pr = labProgress(s);
  return h('div', { class: 'act wlab' },
    h('p', { class: 'lead' }, `${tr('Learn to write clear sentences, build strong paragraphs and think for yourself.')} (${pr.done}/${pr.total})`),
    ...TRACKS.map(([t, ic, name]) => h('div', { class: 'wlab-track' }, h('h3', {}, `${ic} ${tr(name)}`),
      h('div', { class: 'wlab-list' }, ...LAB.filter((L) => L.t === t).map((L, i) => {
        const ok = !!done(s)[L.id], open = unlocked(s, L);
        return h('button', { class: 'opt wlab-item' + (ok ? ' done' : '') + (open ? '' : ' locked'), id: `wlab-${L.id}`, disabled: !open, onclick: () => { close && close(); runLesson(G, L); } },
          `${ok ? '✓' : open ? i + 1 + '.' : '🔒'} ${tr(L.title)}`);
      })))));
}

/** one lesson: the teaching card, the practice, then your own writing */
export async function runLesson(G, L) {
  const s = G.state;
  const go = await UI.sheet(L.title, (close) => h('div', { class: 'act wlab-teach' },
    ...L.teach.map((t) => h('p', { class: 'readable' }, tr(t))),
    h('div', { class: 'wlab-ex' }, ...L.ex.map(([k, v]) => h('div', {}, h('b', {}, tr(k)), h('span', { class: 'readable' }, tr(v))))),
    h('button', { class: 'primary', id: 'wlab-start', onclick: () => close(true) }, '▶ ' + tr(L.builder ? 'Build my paragraph' : 'Practice'))), { icon: TRACKS.find((x) => x[0] === L.t)[1] });
  if (!go) return;
  for (const Q of L.qs) { const r = await runActivity(G, () => ({ ...Q }), 'school', L.title, '✏️'); if (!r) return; }
  if (L.builder) { const ok = await paragraphBuilder(G); if (!ok) return; }
  else if (L.write) { const r = await runActivity(G, () => ({ ...L.write }), 'school', tr('Your turn'), '✍️'); if (!r) return; }
  const first = !done(s)[L.id]; done(s)[L.id] = s.day;
  if (first) {
    G.earn && G.earn(10, `Writing Lab: ${L.title}`);
    const track = LAB.filter((x) => x.t === L.t), all = track.every((x) => done(s)[x.id]);
    if (all) celebrate(G, `🏅 ${tr(TRACKS.find((x) => x[0] === L.t)[2])}: ${tr('track complete!')}`, tr('You finished every lesson in this track.'), { big: true });
    else UI.toast(`✏️ ${tr(L.title)}: ${tr('done!')} +$10`, 'good', 2800);
  }
  G.save();
}

/** the paragraph builder: four boxes, each with a starter, then the whole paragraph is checked */
export function paragraphBuilder(G) {
  const TOPICS = ['Why I like my city', 'How to have a good day', 'Why saving money matters', 'My favorite place', 'What makes a good friend', 'A job I would like'];
  const TR = /\b(first|second|next|then|also|another|in addition|for example|for instance|finally|last|besides)\b/i;
  return UI.sheet('Write your own paragraph', (close) => {
    let topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    const box = (id, label, hint) => { const ta = h('textarea', { class: 'writebox', id, rows: 2, placeholder: tr(hint), maxlength: 240 }); return [h('label', { class: 'wlab-lbl', for: id }, tr(label)), ta]; };
    const [l1, t1] = box('pb-topic', '1. Topic sentence: the main idea', 'Start with the topic…');
    const [l2, t2] = box('pb-d1', '2. First detail (start with First, or For example)', 'First, …');
    const [l3, t3] = box('pb-d2', '3. Another detail (start with Also, Next or Another)', 'Also, …');
    const [l4, t4] = box('pb-close', '4. Closing sentence (That is why…, In the end…)', 'That is why…');
    const preview = h('p', { class: 'wlab-preview readable' });
    const checks = h('ul', { class: 'rubric' });
    const topicEl = h('b', {}, tr(topic));
    const sent = (t) => t.trim() && /^[A-Z“"]/.test(t.trim()) && /[.!?]["”]?$/.test(t.trim()) && t.trim().split(/\s+/).length >= 4;
    const check = () => {
      const parts = [t1, t2, t3, t4].map((t) => t.value.trim()), all = parts.filter(Boolean).join(' ');
      preview.textContent = all || tr('Your paragraph will appear here.');
      const list = [['A topic sentence', sent(parts[0])], ['Two detail sentences', sent(parts[1]) && sent(parts[2])], ['Transition words (First, Also, Next…)', TR.test(parts[1]) || TR.test(parts[2])], ['A closing sentence', sent(parts[3])], ['Every sentence starts with a capital and ends with a period', parts.every(sent)]];
      checks.replaceChildren(...list.map(([l, ok]) => h('li', { class: ok ? 'ok' : 'todo' }, `${ok ? '✓' : '○'} ${tr(l)}`)));
      return list.every((x) => x[1]);
    };
    [t1, t2, t3, t4].forEach((t) => t.addEventListener('input', check)); check();
    return h('div', { class: 'act wlab-build' },
      h('p', { class: 'lead' }, tr('Your topic:'), ' ', topicEl, ' ', h('button', { class: 'ghost sm', onclick: () => { topic = TOPICS[(TOPICS.indexOf(topic) + 1) % TOPICS.length]; topicEl.textContent = tr(topic); } }, '↻ ' + tr('Another topic'))),
      l1, t1, l2, t2, l3, t3, l4, t4,
      h('h4', {}, tr('Your paragraph')), preview, checks,
      h('div', { class: 'row' },
        h('button', { class: 'ghost sm', id: 'pb-example', onclick: () => { t1.value = 'My city is a great place to grow.'; t2.value = 'First, there are many jobs where I can learn new skills.'; t3.value = 'Also, City School teaches me something new every week.'; t4.value = 'That is why I am glad I live here.'; check(); } }, tr('See an example')),
        h('button', { class: 'primary', id: 'pb-done', onclick: () => { if (check()) { G.edu.record('write.paragraph', true, { ctx: 'school' }); G.sfx('good'); close(true); } else UI.toast(tr('Almost! Finish the parts with ○, then tap Done.'), 'info', 3000); } }, '✓ ' + tr('Done'))));
  }, { icon: '📄' });
}
