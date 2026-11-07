// REAL — curriculum, part 3: more practice for every skill that had too few questions.
// Learning design: many different questions per skill (so players learn the idea, not one answer), everyday contexts
// from the game world, easy and harder versions mixed, and an explanation that states the general rule every time.
// Level-1 questions use short sentences, simple words and pictures for young readers; higher levels use real
// teen and adult situations. Merged into curriculum.js; tests/curriculum.test.mjs and tests/variety.mjs check it all.

const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
const doc = (title, lines) => ({ title, lines });
const ch = (skill, q, a, wrong, why, v) => ({ type: 'choice', skill, q, a, o: [a, ...wrong], why, v });
const num = (skill, q, a, why, v, opts = {}) => ({ type: 'number', skill, q, a, why, v, ...opts });
const bank = (skill, rows) => () => { const [q, a, w, why, v] = pick(rows); return ch(skill, q, a, w, why, v); };
const sorter = (skill, q, bins, pairs, why, n = 5) => () => ({ type: 'sort', skill, q, bins, items: shuffle(pairs).slice(0, n), why });
const orders = (skill, sets) => () => { const [q, items, why] = pick(sets); return { type: 'order', skill, q, items, why }; };
const note = (skill, rows) => () => { const [lines, q, a, w, why] = pick(rows); return { ...ch(skill, q, a, w, why), cursive: lines }; };
const $ = (v) => '$' + (Number.isInteger(v) ? v.toLocaleString('en-US') : v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

export const EXTRA_GEN = {
  // ================================================================ READING
  'read.vocab': [bank('read.vocab', [
    ['🛒 What is a “cart”?', 'A basket on wheels', ['A kind of fruit', 'A bus stop', 'A coat'], 'At the store, a cart is a basket on wheels you push.'],
    ['🚪 The sign says EXIT. What does it mean?', 'The way out', ['The way in', 'Stop here', 'Wash hands'], 'EXIT means the way out. ENTER means the way in.'],
    ['💵 What is a “price”?', 'How much something costs', ['How big it is', 'Who made it', 'Where it is'], 'The price is the money you pay for something.'],
    ['🕐 What is a “shift” at work?', 'The time you work', ['A kind of shirt', 'A break', 'A place'], 'A shift is the hours you work, like 9:00 to 1:00.'],
    ['🧾 What is a “receipt”?', 'Paper that shows what you bought', ['A food', 'A ticket to ride', 'A map'], 'A receipt lists what you bought and what you paid.'],
    ['🔒 The door says “Staff only.” Who can go in?', 'People who work there', ['Anyone', 'Only kids', 'Only pets'], 'Staff means the workers.'],
    ['🚌 What is a “route”?', 'The way a bus goes', ['A tree root', 'A bus driver', 'A ticket'], 'A route is the path from stop to stop.']])],
  'read.main': [bank('read.main', [
    ['What is this note mostly about?', 'The store’s new hours', ['Rosa’s dog', 'The price of milk', 'A lost key'], 'The main idea is what most sentences talk about: the hours.', doc('NOTICE', ['Starting Monday, Fresh Mart opens at 7 AM.', 'We will close at 10 PM.', 'Sunday hours stay the same.'])],
    ['What is this mostly about?', 'How to care for a puppy', ['How to bake bread', 'Bus times', 'Paying rent'], 'Every sentence gives a puppy-care tip.', doc('PUPPY TIPS', ['Give fresh water every day.', 'Walk your puppy twice a day.', 'Let it rest after play.'])],
    ['What is the main idea?', 'The park needs helpers to clean up', ['Parks are green', 'Saturday is a day', 'Bags are free'], 'The big point is the clean-up and needing helpers; the rest are details.', doc('BRIGHTER PARK', ['Help clean the park this Saturday!', 'Bags and gloves are free.', 'Meet at the fountain at 10 AM.'])],
    ['What is this message mostly about?', 'The bus route is changing', ['The driver’s name', 'The weather', 'A new café'], 'Each line explains the route change.', doc('CITY BUS', ['Route 1 will skip Main Street on Friday.', 'Use the stop on Oak Avenue.', 'Normal service returns Saturday.'])],
    ['What is the main idea?', 'Exercise helps your body and mind', ['Running shoes are red', 'The gym opens at 6', 'Water is wet'], 'The sentences all explain benefits of exercise.', doc('HEALTH CORNER', ['Exercise makes your heart stronger.', 'It helps you sleep better.', 'It can also lift your mood.'])],
    ['What is the best title for this?', 'Saving for a Bike', ['My Favorite Color', 'Rainy Days', 'The Bus'], 'A good title names the main idea: saving money to buy a bike.', doc('', ['Maya wanted a bike that cost $120.', 'She saved $10 each week.', 'After 12 weeks, she bought it.'])],
    ['What is the main idea?', 'Recycling helps the city', ['Bins are blue', 'Paper is thin', 'Trucks are loud'], 'The details all support how recycling helps.', doc('GREEN CITY', ['Recycling keeps trash out of parks.', 'It saves materials to make new things.', 'Our city recycled more this year.'])]])],
  'read.inference': [bank('read.inference', [
    ['What can you tell about Theo?', 'He was very hungry', ['He was not hungry', 'He was sleepy', 'He was sad'], 'Clues: his stomach growled and he ate fast. Clues + what you know = inference.', doc('', ['Theo’s stomach growled all morning.', 'At lunch he ate his sandwich in three bites.'])],
    ['Why is Dee holding an umbrella?', 'It is probably raining', ['It is sunny', 'She is at the beach', 'She found it'], 'The text mentions dark clouds and wet streets.', doc('', ['Dark clouds filled the sky.', 'The streets were shiny and wet.', 'Dee opened her umbrella.'])],
    ['How does Sam probably feel?', 'Nervous', ['Bored', 'Sleepy', 'Angry'], 'Shaking hands and practising again and again are clues he is nervous.', doc('', ['Sam’s hands shook as he waited.', 'He read his speech one more time.'])],
    ['What probably happened?', 'Someone forgot to close the freezer', ['The ice cream was eaten', 'It snowed inside', 'Rosa bought more'], 'Melted ice cream and an open door point to the freezer being left open.', doc('', ['In the morning, the freezer door was open.', 'The ice cream had melted.'])],
    ['Where is Priya?', 'At the library', ['At the beach', 'At a gas station', 'At the gym'], 'Quiet, shelves of books and a librarian are library clues.', doc('', ['Priya whispered so she wouldn’t disturb anyone.', 'She pulled a book from the tall shelf', 'and showed the librarian her card.'])],
    ['Why might the customer be upset?', 'They were charged twice', ['They got free food', 'The store was clean', 'They found a dollar'], 'Two identical charges on the receipt explain the frown.', doc('', ['The customer frowned at the receipt.', '“Milk $2.49, Milk $2.49 — I only bought one!”'])]])],
  'read.purpose': [bank('read.purpose', [
    ['Why was this written?', 'To entertain with a story', ['To sell something', 'To give safety rules', 'To list prices'], 'It tells a story with characters and events: entertain.', doc('', ['Once upon a time, a brave little fox', 'set out to find the city of lights.'])],
    ['Why was this written?', 'To inform about safety', ['To entertain', 'To persuade you to buy', 'To tell a joke'], 'It gives facts and steps without opinions: inform.', doc('FIRE SAFETY', ['Know two ways out of every room.', 'Test smoke alarms every month.'])],
    ['Why was this written?', 'To persuade you to vote for a plan', ['To tell a story', 'To list bus times', 'To explain science'], 'It argues for a choice and asks you to act: persuade.', doc('VOTE YES!', ['A new park means cleaner air and happier kids.', 'Vote YES on the park plan Tuesday!'])],
    ['A recipe card is written mainly to…', 'Inform you how to cook something', ['Persuade you to buy a stove', 'Entertain with a mystery', 'Make you sad'], 'Recipes give steps and amounts: inform.'],
    ['A comic strip about a silly cat is mainly to…', 'Entertain', ['Inform', 'Persuade', 'Warn'], 'Jokes and silly stories are written to entertain.'],
    ['An ad saying “Best shoes ever! Buy two, get one free!” is mainly to…', 'Persuade', ['Inform', 'Entertain', 'Teach history'], 'Ads try to change what you do: persuade.']])],
  'read.multistep': [orders('read.multistep', [
    ['Put the closing steps for the register in order.', ['Print the end-of-day report', 'Count the cash in the drawer', 'Compare the count to the report', 'Sign the report and lock the drawer'], 'Follow the order words: you can’t compare before counting, and you lock up last.'],
    ['Follow the recipe: put the steps in order.', ['Wash your hands', 'Measure the rice and water', 'Bring the water to a boil', 'Add the rice and cover', 'Cook 18 minutes, then fluff'], 'Recipes are steps in order: prepare, measure, heat, cook, finish.'],
    ['Put the steps to restock a shelf in order.', ['Check the shelf label', 'Bring the matching box from the back', 'Move older items to the front', 'Put new items behind them', 'Flatten the empty box'], 'Older items go in front so they sell first; cleanup comes last.'],
    ['Order the steps to mail a package.', ['Put the item in a box', 'Tape the box shut', 'Write the address on the label', 'Pay for postage', 'Hand it to the mail clerk'], 'Each step depends on the one before: pack, seal, address, pay, send.'],
    ['Put these steps for changing a flat bike tire in order.', ['Flip the bike over', 'Take the wheel off', 'Remove the old tube', 'Put in the new tube and pump it up', 'Put the wheel back on'], 'You must remove before you replace, and reattach last.'],
    ['Order the steps for washing your hands.', ['Wet your hands', 'Add soap', 'Scrub for 20 seconds', 'Rinse', 'Dry with a clean towel'], 'Wet, soap, scrub, rinse, dry: the order matters for clean hands.'],
    ['Put the steps to sign up for a library card in order.', ['Go to the front desk', 'Fill out the form', 'Show proof of your address', 'Sign your name', 'Get your card'], 'Forms come before signatures; the card comes last.']])],
  'read.evidence': [bank('read.evidence', [
    ['Which sentence proves the bus is often late?', '“Riders waited 15 minutes past the schedule most mornings.”', ['“The bus is blue.”', '“Route 1 goes to Midtown.”', '“The driver waves hello.”'], 'Evidence directly supports the claim with facts about lateness.'],
    ['Which line shows Rosa trusts Nova?', '“Rosa handed Nova the store keys.”', ['“Rosa wears a green apron.”', '“Nova likes apples.”', '“The store opens at 7.”'], 'Giving someone keys is evidence of trust.'],
    ['Which detail best supports “The park is popular”?', '“Hundreds of people visit every weekend.”', ['“The park has a fountain.”', '“It opened in 1990.”', '“Benches are green.”'], 'Counting visitors shows how popular it is.'],
    ['Claim: “Cooking at home saves money.” Which is the best evidence?', '“A home meal costs $3; the same meal out costs $12.”', ['“Cooking is fun.”', '“My kitchen is big.”', '“Restaurants have music.”'], 'Comparing real costs proves the claim; feelings don’t.'],
    ['Which sentence proves Jax wasn’t honest?', '“The ‘free’ sneakers came with a $50 fee.”', ['“Jax wore a cap.”', '“Jax talked fast.”', '“The sneakers were white.”'], 'A hidden fee directly contradicts his “free” claim.'],
    ['Which line proves the clinic is helping?', '“Flu cases dropped by half after free check-ups began.”', ['“The clinic is clean.”', '“Nurse Kim is kind.”', '“It opens at 8.”'], 'A measured drop in cases is evidence of results.']])],
  'read.summarize': [bank('read.summarize', [
    ['Which is the best summary?', 'Maya saved $10 a week for 12 weeks to buy a $120 bike.', ['Maya likes bikes.', 'Bikes have two wheels.', 'Maya saved money.'], 'A summary keeps who, what and the key details, and drops extras.', doc('', ['Maya wanted a bike that cost $120.', 'Every week she saved $10 from her chores.', 'After 12 weeks she finally bought it.'])],
    ['Which is the best summary of a fire drill notice?', 'Leave by the nearest exit and meet at the parking lot when the alarm rings.', ['Fires are hot.', 'There is a parking lot.', 'Alarms are loud.'], 'Keep the main action and the key detail.'],
    ['Which best summarizes the story of the tortoise and the hare?', 'A slow, steady tortoise beats a fast hare who stops to nap.', ['A hare is fast.', 'Animals like races.', 'The tortoise has a shell.'], 'Who, what happened and why it matters: slow and steady wins.'],
    ['Which is the best one-sentence summary of a lease?', 'You pay $600 a month for 12 months and must give 30 days’ notice to leave.', ['It is a paper.', 'The apartment has a door.', 'Leases are long.'], 'Summaries of documents keep the numbers and duties that matter.'],
    ['Which best summarizes a report on park litter?', 'Litter fell 40% after the city added bins, so it plans to add more.', ['Parks have trees.', 'Bins are green.', 'People visit parks.'], 'Main finding + key evidence + what happens next.']])],
  'read.bias': [bank('read.bias', [
    ['A soda company’s study says soda is healthy. Why be careful?', 'The company profits if you believe it', ['Studies are always false', 'Soda is blue', 'It used numbers'], 'When the source gains from the conclusion, look for independent evidence.'],
    ['Which word choice shows bias?', '“The greedy landlord raised rent.”', ['“The landlord raised rent by $50.”', '“Rent went up on May 1.”', '“The rent is now $650.”'], 'Loaded words like “greedy” push an opinion into a fact.'],
    ['A review only lists good things and was written by the owner’s friend. This is…', 'Possibly biased', ['Definitely true', 'A primary source', 'A fact sheet'], 'One-sided and a personal connection both signal bias.'],
    ['A news story quotes only people who support a new road. What is missing?', 'Views from people who oppose it', ['More pictures', 'A longer title', 'Nothing'], 'Fair reporting includes more than one side.'],
    ['Jax says: “Everyone who’s smart is buying this.” What kind of language is this?', 'Biased, persuasive language', ['Neutral facts', 'A scientific result', 'A definition'], 'It pressures with flattery instead of giving evidence.']])],
  'read.sources': [bank('read.sources', [
    ['Which is the best source for bus times?', 'The city transit website, updated this week', ['A friend’s guess', 'A poster from 2015', 'A social media rumor'], 'Official, current sources beat old or second-hand ones.'],
    ['Which source is most reliable for a science report on volcanoes?', 'A science museum article with experts cited', ['A random blog with no author', 'An ad for volcano tours', 'A meme'], 'Expert, cited sources are most trustworthy.'],
    ['Why check the date of a source?', 'Information can become outdated', ['Older is always better', 'Dates don’t matter', 'To find the author’s birthday'], 'Prices, laws and science change; current sources are safer.'],
    ['Two sites disagree about a medicine dose. What should you trust?', 'The label and a pharmacist or doctor', ['Whichever site looks nicer', 'A forum post', 'Your friend'], 'For health, official labels and professionals are the reliable sources.'],
    ['Which question helps judge a source?', '“How does the author know this?”', ['“Is the font pretty?”', '“Is it long?”', '“Is it popular?”'], 'Ask about expertise and evidence, not looks or popularity.']])],
  'read.research': [bank('read.research', [
    ['You want to know if the new bike lane is safer. What is the best first step?', 'Find accident numbers from before and after, from more than one source', ['Ask one friend', 'Guess', 'Read only the bike shop’s ad'], 'Research compares reliable data from several sources.'],
    ['Three sources agree; one disagrees. What should you do?', 'Check the disagreeing source’s evidence and possible bias', ['Ignore all four', 'Trust only the one that disagrees', 'Pick randomly'], 'Look into why sources differ before concluding.'],
    ['Which research question is best?', '“Did the free clinic reduce flu cases in Midtown in 2026?”', ['“Is health good?”', '“Clinics?”', '“Why is everything like that?”'], 'Good research questions are specific and answerable.'],
    ['After gathering sources, what comes next?', 'Take notes and compare what they say', ['Copy one source word for word', 'Stop and guess', 'Delete them'], 'Comparing notes lets you draw your own careful conclusion.'],
    ['How should you use what sources say in your report?', 'Explain it in your words and say where it came from', ['Copy without credit', 'Change the numbers', 'Leave out the sources'], 'Credit sources and use your own words.']])],
  'read.technical': [bank('read.technical', [
    ['The manual says: “Charge the battery 4 hours before first use.” What do you do first?', 'Charge it for 4 hours', ['Use it right away', 'Charge it 4 minutes', 'Throw away the charger'], 'Technical instructions are exact: follow the number and unit.'],
    ['A tire says “Max 35 PSI.” Your gauge reads 40 PSI. What should you do?', 'Let some air out to 35 PSI or less', ['Add more air', 'Ignore it', 'Drive faster'], 'A maximum must not be exceeded.'],
    ['The circuit spec says 12 volts. You have a 120-volt plug. Can you plug it in directly?', 'No, the voltage is too high', ['Yes, more is better', 'Only on weekends', 'Yes if it’s quick'], 'Units and values must match the spec; 10× the voltage can destroy it.'],
    ['WARNING: “Unplug before cleaning.” Why read warnings first?', 'They prevent injury or damage', ['They are decoration', 'They are optional', 'They are jokes'], 'Warnings come first in technical reading.']])],
  'read.story': [bank('read.story', [
    ['Who is the main character in “The Little Red Hen”?', 'The hen', ['The farmer', 'The bread', 'The mill'], 'The main character is who the story is mostly about.'],
    ['“On a snowy night in the mountains, a fox found a lost cub.” What is the setting?', 'A snowy night in the mountains', ['The fox', 'The cub', 'Finding the cub'], 'Setting = where and when.'],
    ['In a story, the part where everything works out is the…', 'Solution (ending)', ['Setting', 'Character', 'Title'], 'Stories move from problem to solution.'],
    ['A character who causes trouble for the hero is often called the…', 'Villain or antagonist', ['Narrator', 'Setting', 'Author'], 'The antagonist creates the problem the hero faces.']])],
  'read.context': [bank('read.context', [
    ['“The soup was so scalding that Ana waited ten minutes to taste it.” Scalding means…', 'Very hot', ['Very cold', 'Delicious', 'Salty'], 'Waiting ten minutes before tasting is the clue.'],
    ['“Rosa was elated, smiling and dancing after her promotion.” Elated means…', 'Very happy', ['Tired', 'Worried', 'Angry'], 'Smiling and dancing show the meaning.'],
    ['“The room was so cluttered we couldn’t see the floor.” Cluttered means…', 'Messy and full of things', ['Clean', 'Dark', 'Empty'], 'Not being able to see the floor is the clue.'],
    ['“Please be punctual; the bus leaves exactly at 8.” Punctual means…', 'On time', ['Late', 'Quiet', 'Polite'], '“Leaves exactly at 8” shows punctual means on time.']])],
  'read.figurative': [bank('read.figurative', [
    ['“Her smile was as bright as the sun.” What does it mean?', 'She had a big, happy smile', ['Her teeth glowed', 'It was very hot', 'She was outside'], 'Similes compare to show a quality, not literal facts.'],
    ['“Break a leg!” before a show means…', 'Good luck', ['Get hurt', 'Run fast', 'Sit down'], 'Idioms have meanings different from their words.'],
    ['“The city never sleeps” is an example of…', 'Personification', ['A simile', 'A fact', 'A question'], 'It gives a city a human action (sleeping).']])],
  'read.wordparts': [bank('read.wordparts', [
    ['What does “preheat” mean?', 'Heat before', ['Heat again', 'Not heat', 'Heat a lot'], 'Pre- means before.'],
    ['What does “misread” mean?', 'Read wrongly', ['Read again', 'Read before', 'Read loudly'], 'Mis- means wrongly.']])],
  // ================================================================ WRITING
  'write.sentences': [bank('write.sentences', [
    ['Which is a complete sentence?', 'The cat sleeps on the mat.', ['The cat on the mat.', 'Sleeps on the mat.', 'On the mat.'], 'A sentence needs who (the cat) + what they do (sleeps), a capital and end punctuation.'],
    ['Which is a complete sentence?', 'Nova walks to work.', ['Walks to work.', 'Nova to work.', 'To work every day.'], 'Who: Nova. Does what: walks. Capital + period.'],
    ['Which is NOT a complete sentence?', 'Running down the street.', ['Sam is running.', 'The bus stops here.', 'I like apples.'], '“Running down the street” is missing who is running.'],
    ['Fix it: “the dog barks”', 'The dog barks.', ['the dog barks.', 'The dog barks', 'the Dog barks'], 'Start with a capital letter and end with a period.'],
    ['Which is a question?', 'Where is the bus stop?', ['The bus stop is here.', 'Go to the bus stop.', 'Wow, a bus!'], 'Questions ask something and end with ?'],
    ['Which sentence ends correctly?', 'I love this game!', ['I love this game', 'i love this game!', 'I love this game,'], 'Strong feeling ends with !'],
    ['Which is a complete sentence?', 'Rosa opens the store.', ['Opens the store.', 'Rosa the store.', 'The store at seven.'], 'It has a subject (Rosa) and a verb (opens).']])],
  'write.caps': [bank('write.caps', [
    ['Which needs a capital letter?', 'midtown (a city place)', ['apple', 'dog', 'table'], 'Names of places, people and days get capitals: Midtown.'],
    ['Which is correct?', 'My friend Sam lives in Midtown.', ['my friend sam lives in midtown.', 'My Friend Sam Lives In Midtown.', 'my friend Sam lives in Midtown'], 'Capitals for the first word and names; end with a period.'],
    ['Which ending mark fits? “What time is it__”', '?', ['.', '!'], 'Questions end with a question mark.'],
    ['Which day is written correctly?', 'Monday', ['monday', 'MONday', 'mondaY'], 'Days of the week start with a capital.'],
    ['Which ending mark fits? “Watch out, a car__”', '!', ['?', ','], 'A warning or strong feeling ends with !'],
    ['Which word should always be a capital?', 'I (talking about yourself)', ['the', 'and', 'is'], 'The word “I” is always a capital.'],
    ['Which is correct?', 'We visited Brighter Park on Saturday.', ['we visited brighter park on saturday.', 'We visited brighter Park on saturday.', 'We Visited Brighter Park On Saturday.'], 'Capitals for the first word, names of places and days.']])],
  'write.forms': [bank('write.forms', [
    ['A form asks for “Date of birth”. What goes there?', 'The day you were born, like 05/14/2010', ['Today’s date', 'Your address', 'Your name'], 'Date of birth is your birthday with the year.'],
    ['The form says “Last name”. For Nova Reyes, what do you write?', 'Reyes', ['Nova', 'Nova Reyes', 'N.R.'], 'Last name = family name.'],
    ['A form says “Please print”. What does that mean?', 'Write in clear capital letters, not cursive', ['Use a printer only', 'Sign your name', 'Draw a picture'], '“Print” on a form means neat separate letters.'],
    ['Which phone number is filled in correctly?', '555-123-4567', ['call me', '5551', 'phone'], 'Fill the exact format asked for.'],
    ['A box says “Signature”. What goes there?', 'Your name written in your own handwriting', ['Your email', 'Today’s date', 'Your age'], 'A signature is your name in your own writing, often cursive.'],
    ['A form asks “Availability”. What should you write?', 'The days and times you can work', ['Your favorite food', 'Your height', 'Your pet’s name'], 'Availability is when you are free.'],
    ['Why fill in every part of a form neatly?', 'So the reader understands and doesn’t reject it', ['It doesn’t matter', 'To use more ink', 'Forms are never read'], 'Missing or messy answers slow things down or get forms rejected.']])],
  'write.messages': [bank('write.messages', [
    ['Which message to your manager is best?', 'Hi Rosa, I’m sick today and can’t make my 9:00 shift. Sorry for the short notice. — Nova', ['not coming', 'sick lol', 'Rosa!!!'], 'Good messages say who, what, when, and stay polite.'],
    ['Which is the best thank-you message?', 'Thank you for helping me move on Saturday, Sam. I really appreciated it!', ['thx', 'ok', 'you helped'], 'Name the person, what they did, and how you feel.'],
    ['Which message is clearest?', 'Can we meet at the library at 3:00 on Friday?', ['meet later?', 'u free?', 'that place, that time'], 'Clear messages give place and time.'],
    ['Which ending is most polite for a message to a teacher?', 'Thank you, Nova', ['bye', 'k', 'whatever'], 'A polite closing shows respect.']])],
  'write.paragraph': [orders('write.paragraph', [
    ['Put the paragraph in order.', ['Dogs make great pets.', 'They are loyal to their families.', 'They also get you outside for walks.', 'That is why many families love dogs.'], 'Topic sentence → details → closing sentence.'],
    ['Put the paragraph in order.', ['Saving money takes planning.', 'First, decide what you are saving for.', 'Next, put aside a little each week.', 'Over time, small savings add up.'], 'Topic sentence, then details in order, then a wrap-up.'],
    ['Put the paragraph in order.', ['Brighter Park is my favorite place.', 'It has a big fountain and shady trees.', 'On weekends there are music shows.', 'I could spend all day there.'], 'Start with the main idea, support it, then close.']]),
    bank('write.paragraph', [['What is a topic sentence?', 'The sentence that states the main idea of a paragraph', ['The last word', 'A question only', 'The title'], 'The topic sentence tells the reader what the paragraph is about.'], ['Which sentence does NOT belong in a paragraph about recycling?', 'My cousin has a red bike.', ['Recycling saves materials.', 'Cans can become new cans.', 'Sort paper from plastic.'], 'Every detail should support the main idea.']])],
  'write.report': [bank('write.report', [
    ['Which is a finding?', 'Bread sold out by noon on 4 of 5 days.', ['We should bake more.', 'I like bread.', 'Bread is tasty.'], 'Findings are facts you measured.'],
    ['Which is a recommendation?', 'Bake 30 more loaves on weekdays.', ['Bread sold out early.', 'Sales were high.', 'There were 5 days.'], 'Recommendations say what to do next.'],
    ['What should a report include with each claim?', 'Evidence, like numbers or observations', ['Jokes', 'Only opinions', 'Nothing'], 'Claims need evidence to be convincing.']]),
    orders('write.report', [['Put the report sections in order.', ['Purpose: why we studied it', 'Findings: what we measured', 'Evidence: the numbers', 'Recommendation: what to do next'], 'Purpose → findings → evidence → recommendation.']])],
  'write.persuasive': [bank('write.persuasive', [
    ['Which reason is most persuasive for a longer lunch break?', 'Workers who rest make 20% fewer mistakes, according to a study', ['I want it', 'Everyone says so', 'Lunch is fun'], 'Evidence beats wanting.'],
    ['Which is the most respectful way to disagree?', 'I see your point, but here is another way to look at it…', ['You’re wrong', 'That’s dumb', 'Whatever'], 'Respect keeps people listening.'],
    ['What should end a persuasive letter?', 'A clear request for what you want', ['A random fact', 'An insult', 'Nothing'], 'Close by asking for the action you want.'],
    ['Which is a counterargument?', 'Some say a park costs too much, but it saves on health costs later.', ['Parks are green.', 'I love parks.', 'Vote now!'], 'A counterargument names the other side and answers it.']])],
  'write.proposal': [bank('write.proposal', [
    ['Which line belongs in the “benefit” part of a proposal?', 'Customers would save 10 minutes waiting in line.', ['The cart costs $350.', 'The park opens at 7.', 'I have a cart.'], 'Benefits explain what the reader gains.'],
    ['Which line is the “problem” in a proposal for a crosswalk?', 'Kids cross a busy street with no crosswalk.', ['A crosswalk costs $2,000.', 'Paint is white.', 'Let’s start Monday.'], 'The problem explains why change is needed.'],
    ['Why include costs in a proposal?', 'So the reader knows what it will take', ['To confuse them', 'Costs don’t matter', 'To fill space'], 'Decision makers need costs to say yes.']])],
  'write.analytical': [bank('write.analytical', [
    ['Which sentence analyzes?', 'The bus was late because of road work, which made 30 riders miss their shifts.', ['The bus was late.', 'Buses are big.', 'It was Tuesday.'], 'Analysis connects causes and effects with “because” and “which means”.'],
    ['Which question does analytical writing answer?', 'Why or how did this happen?', ['What color was it?', 'Who is your friend?', 'What’s for lunch?'], 'Analysis explains why and how.'],
    ['Which shows evidence in analysis?', 'Sales rose 15% after the price dropped $1.', ['Sales were good.', 'People like it.', 'It’s nice.'], 'Numbers make analysis convincing.']])],
  'write.research': [bank('write.research', [
    ['Why do writers cite sources?', 'To give credit and let readers check facts', ['To make it longer', 'Because it looks fancy', 'They don’t need to'], 'Citing is honest and lets readers verify.'],
    ['Which is plagiarism?', 'Copying someone’s words without credit', ['Quoting with credit', 'Summarizing with credit', 'Using your own ideas'], 'Using others’ words or ideas without credit is plagiarism.'],
    ['How should a research paper end?', 'With a conclusion based on the evidence', ['With a new topic', 'With a joke', 'In the middle of a sentence'], 'Conclusions tie the evidence together.']])],
  'write.bizplan': [bank('write.bizplan', [
    ['Which belongs in the “market” section?', 'About 400 people walk past the park entrance every morning.', ['Our logo is blue.', 'I like coffee.', 'We open soon.'], 'The market section describes your customers and how many there are.'],
    ['Which belongs in the “risks” section?', 'Rainy days could cut sales by half; we will sell from a covered spot.', ['Coffee is hot.', 'We sell cups.', 'Our name is Joe’s.'], 'Name a risk and how you will handle it.'],
    ['Why do lenders read the costs section closely?', 'To see if the business can pay back a loan', ['To admire the font', 'To count pages', 'They don’t'], 'Costs and profits show whether a loan is safe.']]),
    orders('write.bizplan', [['Order the pricing steps for a lemonade stand.', ['Add up the cost of one cup', 'Check what others charge', 'Choose a price above your cost', 'Test it and adjust'], 'Know your costs, check the market, price for profit, then test.']])],
  'write.argument': [bank('write.argument', [
    ['What makes an argument strongest?', 'Evidence plus a fair answer to the other side', ['Being loud', 'Repeating yourself', 'Insulting opponents'], 'Evidence and fairness persuade thoughtful readers.'],
    ['Which is a claim?', 'The city should add more bike lanes.', ['Bike lanes are painted.', 'I rode a bike.', 'Bikes have pedals.'], 'A claim is the position you argue for.'],
    ['Which is a weak argument?', '“Everyone knows it’s true.”', ['“Accidents fell 30% after bike lanes were added.”', '“Two studies agree.”', '“The data shows a trend.”'], '“Everyone knows” is not evidence.']])],
  'write.email': [bank('write.email', [
    ['Which greeting is best for an email to a business?', 'Dear Ms. Park,', ['yo', 'hey u', 'Sup'], 'Professional emails start politely.'],
    ['Where should the main request go in an email?', 'In the first sentence or two', ['At the very end', 'In the subject only', 'Nowhere'], 'Busy readers need the point early.'],
    ['Which closing is professional?', 'Best regards, Nova Reyes', ['bye', 'later', 'k'], 'A polite closing and your full name.'],
    ['Which subject line is best for a job application?', 'Application: Cashier position — Nova Reyes', ['hi', 'job', 'pls read'], 'Say what it is and who it’s from.']])],
  'write.resume': [bank('write.resume', [
    ['Which action word best starts a résumé line?', 'Organized', ['Was', 'Did', 'Had'], 'Strong action verbs: organized, served, trained, managed.'],
    ['Which résumé line uses a number well?', 'Trained 3 new cashiers in one month', ['Trained some people', 'Was good at training', 'Training'], 'Numbers show the size of what you did.'],
    ['What belongs in the skills section?', 'Making change, customer service, Spanish', ['My favorite movie', 'My age', 'My pet’s name'], 'Skills are abilities an employer needs.']])],
  'write.professional': [bank('write.professional', [
    ['Which tone fits a message to a customer?', 'Polite and clear', ['Slangy', 'Angry', 'All capitals'], 'Professional writing is respectful and clear.']])],
  'write.letters': [bank('write.letters', [
    ['Which is spelled correctly?', 'friend', ['freind', 'frend', 'fiend'], 'Remember: “i before e” in friend — fr-i-end.'],
    ['Which is spelled correctly?', 'library', ['libary', 'liberry', 'librery'], 'Say all the sounds: li-brar-y.'],
    ['Which is spelled correctly?', 'answer', ['anser', 'ansewr', 'answr'], 'Answer has a silent w.']])],
  'write.tense': [bank('write.tense', [
    ['Which is future tense?', 'Tomorrow I will cook dinner.', ['Yesterday I cooked dinner.', 'I cook dinner.', 'I cooked dinner.'], '“Will” shows the future.'],
    ['Which verb matches? “Each of the boxes ___ heavy.”', 'is', ['are', 'be'], '“Each” is singular, so use “is”.'],
    ['Fix it: “She don’t like rain.”', 'She doesn’t like rain.', ['She not like rain.', 'She don’t likes rain.'], 'She → doesn’t.'],
    ['Which is past tense of “run”?', 'ran', ['runned', 'running', 'runs'], 'Run is irregular: run → ran.']])],
  'write.commas': [bank('write.commas', [
    ['Which uses a comma correctly with a city and state?', 'Austin, Texas', ['Austin Texas,', ',Austin Texas', 'Austin, Texas,'], 'Put a comma between a city and state.'],
    ['Which is correct?', 'Yes, I can work Saturday.', ['Yes I, can work Saturday.', 'Yes I can, work Saturday.'], 'Put a comma after “yes” or “no” at the start.'],
    ['Which joins two sentences correctly?', 'I was tired, but I finished my shift.', ['I was tired but, I finished my shift.', 'I was tired, but, I finished my shift.'], 'Use a comma before but/and/so when joining two full sentences.']])],
  // ================================================================ CURSIVE
  'curs.lower': [() => ({ type: 'trace', skill: 'curs.lower', word: pick(['b', 'd', 'f', 'g', 'h', 'i', 'j', 'k', 'm', 'n', 'p', 'r', 's', 'u', 'w', 'y']), q: 'Trace the lowercase letter in cursive.' })],
  'curs.upper': [() => ({ type: 'trace', skill: 'curs.upper', word: pick(['B', 'C', 'D', 'E', 'H', 'J', 'K', 'N', 'P', 'S', 'T', 'W']), q: 'Trace the uppercase letter in cursive.' })],
  'curs.words': [() => ({ type: 'trace', skill: 'curs.words', word: pick(['city', 'home', 'money', 'park', 'bus', 'store', 'friend', 'work', 'happy', 'kind']), q: 'Trace the word in joined cursive.' })],
  'curs.fluent': [() => ({ type: 'trace', skill: 'curs.fluent', word: pick(['Thank you', 'Have a nice day', 'Back at noon', 'Love, Mom', 'Be kind', 'Dear Rosa']), q: 'Trace the phrase in cursive.' })],
  'curs.styles': [note('curs.styles', [
    [['Meet me at the', 'fountain at 4:30.', '— Sam'], 'Where should you meet Sam?', 'At the fountain', ['At the bus stop', 'At home', 'At the library'], 'Read the place word after “at the”.'],
    [['Buy eggs, milk', 'and bread please!', '— Mom'], 'Which item is NOT on the list?', 'Apples', ['Eggs', 'Milk', 'Bread'], 'Read each item; apples isn’t there.'],
    [['Your order is', 'ready on Friday.', '— June'], 'When is the order ready?', 'Friday', ['Monday', 'Today', 'Sunday'], 'Find the day word at the end of the line.']])],
  'curs.documents': [note('curs.documents', [
    [['Patient: Leo Park', 'Temp: 101°F', 'Next visit: Thursday'], 'What was the patient’s temperature?', '101°F', ['98°F', '110°F', '91°F'], 'Read the number right after “Temp”. Numbers in records must be exact.'],
    [['Received from Ana:', '$45.00 for rent', 'Signed, Mr. Bell'], 'How much did Ana pay?', '$45.00', ['$54.00', '$4.50', '$450'], 'Read the dollar amount carefully; a decimal point changes everything.'],
    [['Deliver 12 boxes', 'to dock 3', 'by 2 PM'], 'Which dock?', 'Dock 3', ['Dock 12', 'Dock 2', 'Dock 8'], 'Match the number to the word “dock”.'],
    [['Shift swap approved:', 'Nova → Sunday 9–1', '— Rosa'], 'What time is Nova’s Sunday shift?', '9–1', ['1–9', '9–5', '10–2'], 'Read the time right after the day.']])],
  'curs.varied': [note('curs.varied', [
    [['Dearest Clara,', 'The harvest fair is', 'on the 3rd of June.'], 'When is the fair?', 'June 3rd', ['June 30th', 'July 3rd', 'January 3rd'], 'Old letters often write dates as “the 3rd of June”.'],
    [['Remember to lock', 'the back gate — it', 'sticks. Thx! — J'], 'What is wrong with the gate?', 'It sticks', ['It is broken off', 'It is new', 'It is painted'], 'Rushed notes use short words like “Thx”; read the rest for meaning.'],
    [['Recieved 3 crates', 'of apples, 2 of pears'], 'How many crates of pears?', '2', ['3', '5', '1'], 'Even with a spelling slip (“recieved”), the numbers are clear.'],
    [['Ye olde mill opens', 'at dawn each morn'], 'When does the mill open?', 'At dawn (sunrise)', ['At night', 'At noon', 'Never'], 'Old-fashioned words: “morn” means morning, “dawn” is sunrise.'],
    [['Mtg moved to Weds', '@ 10 in rm 4'], 'Where is the meeting?', 'Room 4', ['Room 10', 'Wednesday', 'Room 1'], 'Decode shorthand: mtg = meeting, rm = room, @ = at.'],
    [['Please pay the', 'balance of $12.50', 'by the 15th'], 'How much is owed?', '$12.50', ['$125.0', '$1.25', '$15'], 'Read the decimal carefully.'],
    [['Your grandmother’s', 'recipe: 2 cups flour,', '1 cup sugar'], 'How much sugar?', '1 cup', ['2 cups', '3 cups', 'none'], 'Match the amount to the ingredient.']])],
  // ================================================================ MATH
  'math.statsadv': [() => { const base = ri(20, 40); const a = [0, 1, 2, 3, 4].map(() => base + ri(-5, 5)); const out = base + ri(30, 60); const withOut = [...a, out]; const mean = withOut.reduce((x, y) => x + y) / 6; const med = [...withOut].sort((x, y) => x - y); const median = (med[2] + med[3]) / 2;
      return ch('math.statsadv', `Daily customers: ${withOut.join(', ')}. One day had a big festival. Which number better describes a typical day?`, 'The median', ['The mean', 'The highest day', 'The range'], `The festival day (${out}) pulls the mean up to about ${Math.round(mean)}. The median (${median}) ignores extreme values, so it is more typical.`); },
    bank('math.statsadv', [['A survey asked only gym members if people like exercise. What is the problem?', 'The sample is biased', ['The sample is too random', 'Nothing', 'Surveys can’t use questions'], 'A fair sample represents everyone, not just one group.'], ['Ice cream sales and sunburns both rise in summer. Does ice cream cause sunburn?', 'No — both are caused by hot, sunny weather', ['Yes', 'Only on weekends', 'Ice cream prevents sunburn'], 'Correlation is not causation; look for a hidden cause.'], ['Which sample size gives more reliable results?', '500 random people', ['5 friends', '1 person', '10 people in one room'], 'Larger random samples give more reliable results.']])],
  'math.optimize': [() => { const p = pick([2, 3, 4, 5]), c = pick([1, 1.5, 2]); const rows = [p, p + 1, p + 2].map((price, i) => [price, [100, 70, 45][i]]); const best = rows.reduce((b, r) => ((r[0] - c) * r[1] > (b[0] - c) * b[1] ? r : b));
      return ch('math.optimize', `Each cup costs you $${c} to make. Which price earns the most profit?`, `$${best[0]}`, rows.filter((r) => r !== best).map((r) => `$${r[0]}`), rows.map((r) => `$${r[0]}: (${r[0]} − ${c}) × ${r[1]} = $${(r[0] - c) * r[1]}`).join('; ') + '. Pick the largest.', doc('PRICE TEST', rows.map((r) => `Price $${r[0]} → sells ${r[1]} cups`))); },
    () => { const w = ri(10, 30); return num('math.optimize', `You have ${2 * w + 20} feet of fence for a rectangle against a wall (fence on 3 sides). If the side facing the wall is 20 ft, how long is each of the other two sides?`, w, `Fence used: 20 + 2 × side = ${2 * w + 20}, so side = (${2 * w + 20} − 20) ÷ 2 = ${w} ft.`); }],
  'math.algebra2': [() => { const b = ri(2, 3), e = ri(2, 4); return num('math.algebra2', `What is ${b}^${e} (${b} to the power ${e})?`, b ** e, `${b}^${e} means ${Array(e).fill(b).join(' × ')} = ${b ** e}.`); },
    () => { const x = ri(2, 9), y = ri(1, 6); return num('math.algebra2', `x + y = ${x + y} and x − y = ${x - y}. What is x?`, x, `Add the equations: 2x = ${2 * x}, so x = ${x}.`); }],
  'math.finmath': [() => { const P = pick([100, 200, 500, 1000]), r = pick([5, 10]); return num('math.finmath', `You save $${P} at ${r}% interest per year, compounded yearly. How much after 2 years?`, Math.round(P * (1 + r / 100) ** 2 * 100) / 100, `Year 1: ${P} × ${(1 + r / 100).toFixed(2)} = ${(P * (1 + r / 100)).toFixed(2)}. Year 2: × ${1 + r / 100} again = ${Math.round(P * (1 + r / 100) ** 2 * 100) / 100}.`, null, { prefix: '$', decimals: 2 }); }],
  // ================================================================ MONEY
  'fin.needs': [sorter('fin.needs', 'Sort each one: need or want?', ['Need', 'Want'], [['🍞 Food', 'Need'], ['🏠 A place to live', 'Need'], ['💧 Water', 'Need'], ['🧥 A warm coat in winter', 'Need'], ['🎮 A new game', 'Want'], ['🍬 Candy', 'Want'], ['🧢 A fifth hat', 'Want'], ['🚌 Bus fare to work', 'Need'], ['📱 The newest phone', 'Want']], 'Needs keep you healthy, safe and able to work. Wants are nice extras.'),
    bank('fin.needs', [['🍎 Is food a need or a want?', 'A need', ['A want'], 'You need food to live.'], ['🎮 Is a new video game a need or a want?', 'A want', ['A need'], 'Fun things are wants. You can live without them.'], ['You have $20. Which should you buy first?', 'Groceries for the week', ['A toy', 'Concert ticket', 'Candy'], 'Pay for needs first, then wants.']])],
  'fin.budget': [() => { const total = pick([400, 500, 600]); const rent = pick([150, 200, 250]); const food = pick([60, 80, 100]); const save = 20;
      return { type: 'budget', skill: 'fin.budget', q: `You have ${$(total)}. Rent is ${$(rent)} and food is about ${$(food)}. Make a plan: every dollar gets a job.`, total, cats: [{ name: 'Rent', min: rent }, { name: 'Food', min: food }, { name: 'Savings', min: save }, { name: 'Fun', min: 0 }], why: `Needs first: rent ${$(rent)} + food ${$(food)} = ${$(rent + food)}. Save at least ${$(save)}. What’s left (up to ${$(total - rent - food - save)}) can go to fun or more savings.` }; },
    () => { const pay = pick([100, 200, 300, 500]); return num('fin.budget', `With the 50/30/20 rule, how much of ${$(pay)} goes to needs (50%)?`, pay / 2, `50% means half: ${$(pay)} ÷ 2 = ${$(pay / 2)}. 30% goes to wants and 20% to savings.`, null, { prefix: '$' }); },
    () => { const pay = pick([100, 200, 300, 500]); return num('fin.budget', `With the 50/30/20 rule, how much of ${$(pay)} goes to savings (20%)?`, pay / 5, `20% = one fifth: ${$(pay)} ÷ 5 = ${$(pay / 5)}.`, null, { prefix: '$' }); }],
  'fin.bills': [() => { const ord = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th'); const due = ri(5, 25), paid = due + pick([-2, -1, 0, 1, 3, 6]), fee = pick([15, 25, 35]), late = paid > due; return ch('fin.bills', `Your phone bill is due on the ${ord(due)}. You pay on the ${ord(paid)}. The late fee is ${$(fee)}. What happens?`, late ? `You pay a ${$(fee)} late fee` : 'No fee: it was paid on time', late ? ['No fee: it was paid on time', `You pay a ${$(fee * 2)} late fee`, 'The bill is cancelled'] : [`You pay a ${$(fee)} late fee`, 'You get a discount for paying', 'The bill is cancelled'], late ? `Paid ${paid - due} day(s) after the due date, so the ${$(fee)} fee applies. Set reminders to pay on time.` : `Paid ${paid === due ? 'on' : due - paid + ' day(s) before'} the due date, so there’s no fee. Paying by the due date is on time.`); },
    bank('fin.bills', [['Which bill should you pay first if money is tight?', 'Rent (housing)', ['A streaming service', 'Concert tickets', 'A new game'], 'Pay essentials (housing, utilities, food) first.'], ['What helps you never miss a due date?', 'Reminders or automatic payments', ['Hiding the bills', 'Paying when you remember', 'Throwing them away'], 'Systems beat memory.'], ['A bill says “Minimum due $25, balance $200.” If you pay only $25, what happens?', 'The rest carries over and may grow with interest', ['The bill is paid in full', 'The bank forgets it', 'You get $175 back'], 'Minimum payments keep you current but the balance remains.']])],
  'fin.credit': [() => { const P = pick([100, 200, 400]), r = pick([10, 20, 25]); return num('fin.credit', `You borrow ${$(P)} at ${r}% interest for one year. How much interest do you owe?`, P * r / 100, `${r}% of ${$(P)} = ${P} × ${r / 100} = ${$(P * r / 100)}.`, null, { prefix: '$' }); },
    bank('fin.credit', [['What is interest on a loan?', 'Extra money you pay for borrowing', ['A free gift', 'Your savings', 'A tax refund'], 'Borrowing costs money: that cost is interest.'], ['Why can credit card debt grow fast?', 'Interest is added to unpaid balances every month', ['Cards shrink debt', 'Banks forget balances', 'It never grows'], 'Unpaid interest earns more interest.'], ['Which is the smarter way to use a credit card?', 'Pay the full balance every month', ['Pay only the minimum forever', 'Max it out', 'Never check it'], 'Paying in full avoids interest.']])],
  'fin.debt': [() => { const bal = pick([500, 1000, 2000]), r = pick([18, 24]), owe = Math.round(bal * (1 + r / 1200) ** 12); return ch('fin.debt', `A ${$(bal)} credit card balance charges ${r}% a year (${r / 12}% each month, added monthly). You pay nothing for 12 months. About how much do you owe?`, $(owe), [$(bal + bal * r / 100), $(bal), $(bal * 2)], `Card interest is added every month, and next month you pay interest on the interest too. ${$(bal)} × (1 + ${r / 1200})¹² ≈ ${$(owe)}: more than the simple ${r}% (${$(bal + bal * r / 100)}).`); },
    bank('fin.debt', [['You have two debts: 5% and 22% interest. Extra money should go to…', 'The 22% debt first', ['The 5% debt first', 'Neither', 'A new loan'], 'Paying the highest rate first saves the most.'], ['What is a sign debt is becoming a problem?', 'Borrowing to pay other debts', ['Paying on time', 'Saving each month', 'Paying in full'], 'Using new debt to pay old debt is a warning sign.'], ['Why avoid “buy now, pay later” for wants?', 'It makes spending money you don’t have easy', ['It is always free', 'It improves health', 'It pays you'], 'Easy credit can turn wants into debt.']])],
  'fin.score': [bank('fin.score', [
    ['Which helps your credit score most?', 'Paying every bill on time', ['Opening lots of new cards', 'Missing payments', 'Maxing out cards'], 'Payment history is the biggest factor.'],
    ['Which hurts a credit score?', 'Late payments', ['Paying on time', 'Keeping balances low', 'Having a long history'], 'Late payments stay on your record.'],
    ['Why does a good credit score matter?', 'It gets you lower interest rates on loans', ['It’s just a number', 'It raises your rent', 'It lowers your pay'], 'Lenders charge less to people they trust.'],
    ['Using $900 of a $1,000 limit is…', 'High use, which can lower your score', ['Perfect', 'Not allowed', 'Good for your score'], 'Keep balances well below the limit (under about 30%).'],
    ['Who can look at your credit report?', 'You (free), and lenders, landlords or employers with a legal reason', ['Anyone who asks', 'Nobody, not even you', 'Only your friends'], 'You can get your own reports free at AnnualCreditReport.com. Others need a legal reason, such as your loan or rental application.'],
    ['How long does it take to build good credit?', 'Months to years of on-time payments', ['One day', 'One minute', 'It can’t be built'], 'Credit is built slowly by consistent habits.'],
    ['Checking your own credit report…', 'Does not hurt your score', ['Lowers it a lot', 'Is illegal', 'Costs your house'], 'Checking your own report is a “soft” check.']])],
  'fin.planning': [() => { const total = pick([500, 600, 700]); const rent = pick([200, 250, 300]); const food = pick([60, 80]);
      return { type: 'budget', skill: 'fin.planning', q: `Plan ${$(total)} for the month: rent ${$(rent)}, food ${$(food)}, and build an emergency fund.`, total, cats: [{ name: 'Rent', min: rent }, { name: 'Food', min: food }, { name: 'Emergency fund', min: 40 }, { name: 'Goals', min: 0 }, { name: 'Fun', min: 0 }], why: 'Needs first, then emergency fund, then goals, then fun. An emergency fund keeps one bad week from becoming debt.' }; },
    bank('fin.planning', [['How big should an emergency fund be?', 'Start with $500–$1,000, then build to 3–6 months of needs', ['One week of spending money', 'Whatever is left after buying wants', 'You only need one if you have a car'], 'A starter fund covers small surprises like a repair. A full fund of 3–6 months of essential costs covers a lost job.'], ['Your car breaks down. Where should repair money come from?', 'Your emergency fund', ['A high-interest loan', 'Rent money', 'Skipping food'], 'That’s exactly what an emergency fund is for.']])],
  'fin.fraud': [bank('fin.fraud', [
    ['A text says “Your bank account is locked — click this link and enter your PIN.” What is it?', 'A scam (phishing)', ['A real bank message', 'A prize', 'A bill'], 'Banks never ask for PINs by text. Call the number on your card.'],
    ['Someone calls saying you won a prize but must pay a $50 fee first. This is…', 'A scam', ['A real prize', 'A tax', 'A gift'], 'Real prizes don’t ask you to pay to receive them.'],
    ['Which is a red flag?', 'Pressure to act right now', ['A receipt', 'A clear company name', 'Time to think'], 'Scammers rush you so you don’t check.'],
    ['How should you protect your card PIN?', 'Never share it with anyone', ['Tell your best friend', 'Write it on the card', 'Post it online'], 'Your PIN is only for you.'],
    ['A “friend” online asks for gift card codes to help them. What should you do?', 'Don’t send; check with them another way and tell an adult', ['Send them fast', 'Send half', 'Post the codes'], 'Gift card requests are a common scam.'],
    ['You see a charge you didn’t make. What first?', 'Call your bank right away', ['Ignore it', 'Wait a year', 'Close your eyes'], 'Reporting fast limits the damage.'],
    ['Which website is safer for paying?', 'The real company’s site you typed in yourself, with https', ['A link in a pop-up ad', 'A site with spelling mistakes in its name', 'A link a stranger texted you'], 'https only means the connection is encrypted; scam sites can have it too. Type the real address yourself and never pay through links from strangers.']])],
  'fin.investing': [bank('fin.investing', [
    ['Which investment usually has the highest risk?', 'A single new company’s stock', ['A savings account', 'A government bond', 'Cash under a mattress'], 'Higher possible reward usually means higher risk.'],
    ['Why invest for long periods?', 'Ups and downs tend to even out over many years', ['Prices only go up', 'You can’t lose', 'It’s faster'], 'Time helps ride out swings; nothing is guaranteed.'],
    ['Someone promises “guaranteed 50% returns.” What should you think?', 'It’s probably a scam', ['Invest everything', 'Borrow to invest', 'Tell everyone'], 'No real investment guarantees huge returns.'],
    ['What should you have before investing?', 'An emergency fund and no high-interest debt', ['A new car', 'A loan', 'Nothing'], 'Investing comes after a safety cushion.'],
    ['What is a stock?', 'A small share of ownership in a company', ['A loan to a friend', 'A bank fee', 'A type of soup'], 'Owning stock means owning part of a business.'],
    ['An index fund holds…', 'Many companies at once', ['One company', 'Only cash', 'Gold only'], 'Index funds spread risk across many companies.']])],
  'fin.expansion': [bank('fin.expansion', [
    ['When is a good time to open a second location?', 'When the first is steadily profitable and you have savings', ['Right after opening', 'When you’re losing money', 'When you borrow a lot'], 'Expand from strength, not hope.'],
    ['What should you test before expanding?', 'Whether customers in the new area want your product', ['The paint color', 'Your logo', 'Nothing'], 'Demand in a new place isn’t guaranteed.'],
    ['Expanding too fast can cause…', 'Running out of cash', ['More free time', 'Guaranteed profit', 'Lower costs automatically'], 'Growth costs money before it pays back.'],
    ['Which is a lower-risk way to grow?', 'A pop-up stand or short lease first', ['A 10-year lease right away', 'Buying a building with all your savings', 'Borrowing the max'], 'Small tests limit losses.'],
    ['Your business sells out daily. What does that suggest?', 'There may be demand to grow', ['Close the shop', 'Raise prices 10×', 'Nothing'], 'Steady sell-outs are a signal of unmet demand.'],
    ['Before hiring for a new location, check…', 'That expected sales cover the new costs', ['Workers’ favorite colors', 'The weather', 'Nothing'], 'New costs must be covered by new revenue.'],
    ['Why keep cash reserves while expanding?', 'To survive slow months while the new place grows', ['Banks require it always', 'It looks nice', 'To pay for parties'], 'New locations often lose money at first.']])],
  'fin.forecast': [() => { const s = pick([1000, 2000, 5000]), g = pick([5, 10, 20]); return num('fin.forecast', `Sales are ${$(s)} this month and growing ${g}% a month. Forecast next month’s sales.`, s * (1 + g / 100), `${$(s)} × ${1 + g / 100} = ${$(s * (1 + g / 100))}.`, null, { prefix: '$' }); },
    bank('fin.forecast', [['Why make a best-case and worst-case forecast?', 'To be ready whatever happens', ['To confuse investors', 'Forecasts are always exact', 'For fun'], 'Ranges help you plan for uncertainty.'], ['Which data makes a better forecast?', 'Several months of past sales', ['One good day', 'A guess', 'A friend’s opinion'], 'More history gives more reliable trends.']])],
  'fin.diversify': [bank('fin.diversify', [
    ['What does diversification mean?', 'Spreading money across different investments', ['Putting it all in one stock', 'Keeping it all in cash', 'Spending it'], 'If one investment drops, others may hold up.'],
    ['Which portfolio is more diversified?', 'Some stocks, some bonds, some savings', ['All in one company', 'All in one friend’s business', 'All in lottery tickets'], 'Different types react differently to events.'],
    ['“Don’t put all your eggs in one basket” means…', 'Spread your risk', ['Buy more eggs', 'Hide your money', 'Never invest'], 'One dropped basket shouldn’t break everything.'],
    ['Your only investment is your employer’s stock. What’s the risk?', 'If the company struggles, you could lose your job and savings', ['None', 'You get paid twice', 'It’s guaranteed'], 'Concentration risk: too much in one place.'],
    ['Does diversification guarantee you won’t lose money?', 'No, but it lowers the risk of big losses', ['Yes, always', 'It doubles money', 'It stops all taxes'], 'Diversifying reduces risk; it can’t remove it.'],
    ['Which spreads risk across many companies at once?', 'An index fund', ['One stock', 'A single bond', 'A gold coin'], 'Funds hold many investments.'],
    ['A 30-year-old and a 70-year-old investor. Who can usually take more stock risk?', 'The 30-year-old', ['The 70-year-old', 'Both equally', 'Neither ever'], 'More years to recover from dips allows more risk.']])],
  'fin.saving': [bank('fin.saving', [
    ['🐷 You get $10. Save $2. How much can you spend?', '$8', ['$12', '$2', '$10'], '10 − 2 = 8.'],
    ['Why save some money?', 'For later needs and goals', ['To lose it', 'Because it’s heavy', 'No reason'], 'Saving gets you ready for surprises and goals.'],
    ['Where is money safest for saving?', 'In a bank account', ['Under a rock', 'In your pocket on the bus', 'Lent to Jax'], 'Banks keep money safe and can pay interest.'],
    ['What is a good saving habit?', 'Save a little every payday', ['Save only once a year', 'Spend first, save never', 'Hide it and forget'], 'Small, regular saving adds up.']])],
  'fin.paycheck': [() => { const h = pick([10, 15, 20, 25]), r = pick([15, 16, 17]); const gross = h * r, tax = Math.round(gross * 0.1); return num('fin.paycheck', `You worked ${h} hours at $${r}/hour. Taxes take ${$(tax)}. What is your net (take-home) pay?`, gross - tax, `Gross = ${h} × $${r} = ${$(gross)}. Net = gross − deductions = ${$(gross)} − ${$(tax)} = ${$(gross - tax)}.`, null, { prefix: '$' }); },
    bank('fin.paycheck', [['What is “gross pay”?', 'Pay before taxes and deductions', ['Pay after taxes', 'Your tips only', 'Your savings'], 'Gross is the total before anything is taken out.'], ['Why is net pay less than gross pay?', 'Taxes and deductions are taken out', ['The bank keeps a tip', 'It’s a mistake', 'It isn’t'], 'Net = gross − deductions.']])],
  'fin.insurance': [bank('fin.insurance', [
    ['A deductible of $500 means…', 'You pay the first $500 of a claim', ['Insurance pays you $500 a month', 'You never pay', 'The car costs $500'], 'After the deductible, insurance pays the rest (up to limits).'],
    ['A premium is…', 'What you pay regularly to keep insurance', ['Money insurance pays you', 'A fine', 'A type of car'], 'Premiums are the monthly or yearly cost.'],
    ['Why have insurance?', 'To protect against big costs you couldn’t afford', ['To make money', 'It’s a game', 'To avoid driving'], 'Insurance spreads big risks across many people.'],
    ['A higher deductible usually means…', 'A lower premium', ['A higher premium', 'No coverage', 'Free repairs'], 'You take more risk, so you pay less each month.']])],
  'fin.margins': [() => { const cost = pick([1, 2, 3]), price = cost + pick([1, 2, 3, 4]); return num('fin.margins', `A sandwich costs $${cost} to make and sells for $${price}. What is the gross profit margin (profit as a percent of the price)? Round to the nearest whole percent.`, Math.round((price - cost) / price * 100), `Profit = $${price} − $${cost} = $${price - cost}. Margin = ${price - cost} ÷ ${price} = ${Math.round((price - cost) / price * 100)}%.`, null, { suffix: '%' }); },
    bank('fin.margins', [['Which has a better margin: profit $2 on a $4 item, or $3 on a $12 item?', '$2 on $4 (50%)', ['$3 on $12 (25%)', 'They’re equal', 'Neither has a margin'], 'Margin compares profit to price: 2/4 = 50%, 3/12 = 25%.']])],
  // ================================================================ CRITICAL THINKING
  'think.observe': [bank('think.observe', [
    ['👀 Look: ☁️🌧️☔. What do you notice?', 'It is rainy', ['It is sunny', 'It is snowy', 'It is night'], 'Look at each picture: clouds, rain and an umbrella.'],
    ['🐶🦴🥣 What does the dog probably want?', 'Food', ['A bath', 'A hat', 'A car'], 'A bone and a bowl are clues about food.'],
    ['The shop door has a sign: 🔒 CLOSED. What is true?', 'You can’t go in right now', ['It is open', 'It is a bus', 'It is free'], 'Read the sign before you try the door.'],
    ['You see 🚶‍♀️ lit up at the crosswalk. What does it mean?', 'You may cross carefully', ['Stop', 'Run fast', 'Turn around'], 'The walking person means you may cross; still look both ways.'],
    ['Which is an observation, not a guess?', 'The milk carton is empty', ['Sam drank all the milk', 'Milk is the best drink', 'Someone was greedy'], 'An observation is what you see, not who did it.'],
    ['🍌🍌🍎 Which one is different?', '🍎', ['🍌'], 'Two are bananas; the apple is the odd one out.'],
    ['The floor is wet and there is a ⚠️ sign. What should you do?', 'Walk carefully around it', ['Run across', 'Jump in it', 'Ignore it'], 'Notice the warning and act safely.']])],
  'think.consequence': [bank('think.consequence', [
    ['You stay up very late before work. What will likely happen?', 'You’ll be tired at work', ['You’ll get a raise', 'Nothing', 'You’ll sleep at work and be fine'], 'Choices lead to results: little sleep → tired.'],
    ['You spend your rent money on shoes. What could happen?', 'You may not be able to pay rent', ['Rent becomes free', 'The landlord gives you more shoes', 'Nothing changes'], 'Spending needed money now causes problems later.'],
    ['You practise the register every day. What will likely happen?', 'You’ll get faster and make fewer mistakes', ['You’ll forget everything', 'You’ll be fired', 'Nothing'], 'Practice makes you better.'],
    ['You forget to water your plants for two weeks. What happens?', 'They may wilt or die', ['They grow faster', 'They turn into trees', 'Nothing'], 'Plants need water; skipping it has a cost.'],
    ['You’re kind to a new coworker. What might happen later?', 'They may help you when you need it', ['They will be mean', 'Nothing ever', 'You will lose your job'], 'Kindness often comes back.'],
    ['You ignore a small leak under the sink. What could happen?', 'It could become a bigger, costlier problem', ['It fixes itself', 'It becomes juice', 'Nothing'], 'Small problems left alone can grow.'],
    ['You save $5 every week for a year. What happens?', 'You’ll have $260', ['$5', '$52', '$0'], '5 × 52 weeks = $260. Small choices add up.']])],
  'think.opportunity': [bank('think.opportunity', [
    ['You can work an extra shift ($60) or go to a free class. If you choose the class, what is the opportunity cost?', 'The $60 you could have earned', ['Nothing', 'The class', '$120'], 'Opportunity cost = the best thing you gave up.'],
    ['You spend Saturday playing games instead of studying. What is the opportunity cost?', 'The study time you gave up', ['The games', 'Nothing', 'Sunday'], 'Every choice gives up something else.'],
    ['You buy a $40 jacket instead of saving it. What did you give up?', '$40 of savings', ['Nothing', 'The jacket', '$4'], 'The cost of buying is also what that money could have done.'],
    ['You choose the bus ($2, 40 min) over a taxi ($15, 15 min). What did you give up?', '25 minutes of time', ['$13', 'Nothing', 'The bus'], 'You saved money but gave up time.'],
    ['Why think about opportunity cost?', 'To compare what you gain with what you give up', ['To feel bad', 'To avoid choosing', 'It’s only for banks'], 'Good choices weigh both sides.'],
    ['You can go to the movies or a friend’s game, same time. You pick the movies. The opportunity cost is…', 'The friend’s game', ['The movies', 'Nothing', 'The ticket price only'], 'The next-best option you didn’t pick.'],
    ['College costs money now. What is a possible long-term gain?', 'Better job options and pay later', ['Nothing', 'Guaranteed riches', 'Less learning'], 'Weigh today’s cost against future benefits.']])],
  'think.directions': [orders('think.directions', [
    ['Put the steps in order to brush your teeth.', ['Wet the toothbrush', 'Add toothpaste', 'Brush for 2 minutes', 'Rinse your mouth'], 'Order words: first, next, then, last.'],
    ['Put the steps in order. Rosa says: wash hands, put on an apron, go to register 2.', ['Wash your hands', 'Put on your apron', 'Go to register 2'], 'Do the steps in the order they were said.'],
    ['Put the steps in order to make a sandwich.', ['Get two slices of bread', 'Add the filling', 'Put the bread together', 'Cut it in half'], 'Bread first, filling, close it, cut.'],
    ['Put the steps in order to get on the bus.', ['Wait at the stop', 'Let people get off', 'Step on', 'Pay or tap your card'], 'Wait, let others off, get on, pay.'],
    ['Put the steps to plant a seed in order.', ['Fill a pot with soil', 'Make a small hole', 'Drop in the seed', 'Cover it and water it'], 'Soil, hole, seed, cover and water.'],
    ['Put the morning steps in order.', ['Wake up', 'Get dressed', 'Eat breakfast', 'Leave for work'], 'Follow the order that makes sense.']])],
  'think.risk': [bank('think.risk', [
    ['Which choice has the most risk?', 'Spending your rent on lottery tickets', ['Saving $10', 'Paying rent on time', 'Buying groceries'], 'Risk = how much you could lose and how likely it is.'],
    ['A new job pays more but is only for 2 weeks. Your current job is steady. What should you think about?', 'What happens after 2 weeks', ['Only the pay', 'Nothing', 'The color of the uniform'], 'Weigh reward against the risk of no income later.'],
    ['When is a risk worth taking?', 'When you can afford the worst case and the reward is worth it', ['Always', 'Never', 'When someone pressures you'], 'Never risk what you can’t afford to lose.'],
    ['Jax offers to double your money by tomorrow. What is the best response?', 'No — quick “double your money” deals are usually scams', ['Give him everything', 'Give him half', 'Borrow money to join'], 'If it sounds too good to be true, it usually is.'],
    ['Riding a bike without a helmet saves time but…', 'Risks a serious head injury', ['Is perfectly safe', 'Makes you faster', 'Is required'], 'Small savings aren’t worth big risks.'],
    ['Which lowers risk when starting a small business?', 'Start small and test before spending a lot', ['Spend all your savings day one', 'Borrow the maximum', 'Skip planning'], 'Small tests limit losses.']])],
  'think.evidence': [bank('think.evidence', [
    ['Claim: “This shampoo makes hair grow 2× faster.” Best evidence?', 'A careful test comparing two groups over months', ['A celebrity says so', 'The bottle says “Amazing!”', 'One person’s story'], 'Controlled comparisons beat opinions and stories.'],
    ['Which is the weakest evidence?', '“My cousin said so.”', ['A study of 1,000 people', 'Official city data', 'Several experts agreeing'], 'Hearsay is weak evidence.'],
    ['A study was paid for by the company selling the product. What should you do?', 'Look for independent studies too', ['Trust it completely', 'Ignore all studies', 'Buy two'], 'Funding can create bias.'],
    ['What makes evidence stronger?', 'It can be checked and repeated by others', ['It is loud', 'It is secret', 'It is popular'], 'Repeatable, checkable evidence is strongest.'],
    ['One person won the lottery after wearing red socks. Does that prove red socks are lucky?', 'No, one case is not evidence of cause', ['Yes', 'Only on Fridays', 'Red is always lucky'], 'Coincidences aren’t causes.'],
    ['Which is a fact you can check?', 'The bus runs every 20 minutes', ['The bus is the best', 'Buses are boring', 'Everyone loves buses'], 'Facts can be verified; opinions can’t.']])],
  'think.problem': [orders('think.problem', [
    ['The coffee cart’s machine won’t heat. Put the troubleshooting steps in order.', ['Describe the problem: no heat', 'Check the simplest cause: is it plugged in?', 'Test one fix at a time', 'Check if the problem is solved'], 'Define, check simple causes first, test one change, verify.'],
    ['Your phone won’t charge. Put the steps in order.', ['Try a different outlet', 'Try a different cable', 'Clean the charging port', 'Ask for repair help'], 'Start with the easiest, cheapest checks.'],
    ['Customers complain the line is slow. Put the steps in order.', ['Watch where the line gets stuck', 'List possible causes', 'Try one change, like opening a second register', 'Measure if wait times dropped'], 'Observe, list causes, test, measure.'],
    ['Your robot turns the wrong way. Put the steps in order.', ['Watch the robot run', 'Find the step where it goes wrong', 'Change that step only', 'Run it again to check'], 'Isolate the problem and change one thing.']]),
    bank('think.problem', [['Why change only one thing at a time when fixing a problem?', 'So you know which change worked', ['It’s faster to change everything', 'It doesn’t matter', 'Rules say so'], 'Changing many things hides the real cause.'], ['What is the first step in solving a problem?', 'Clearly describe the problem', ['Guess a fix', 'Give up', 'Blame someone'], 'You can’t fix what you haven’t defined.']])],
  'think.longterm': [bank('think.longterm', [
    ['Which helps your future most?', 'Putting $20 a week into savings', ['Buying snacks daily', 'Skipping work', 'Lending to Jax'], 'Small steady choices grow over time.'],
    ['A course takes 3 months but leads to a $3/hour raise. Is it worth it?', 'Likely yes — the raise pays off over many months', ['No, 3 months is forever', 'Only if it’s free', 'Never take courses'], 'Long-term thinking compares now vs. later.'],
    ['Which is a short-term choice that costs later?', 'Skipping sleep to play games all week', ['Exercising', 'Saving', 'Learning a skill'], 'Feels good now, hurts later.'],
    ['You want a car in a year. What’s a good plan?', 'Save a set amount each month toward it', ['Hope', 'Borrow the max today', 'Spend everything now'], 'Goals need a plan and steady steps.'],
    ['Why do healthy habits matter for the long term?', 'They protect your health for years', ['They don’t', 'Only for athletes', 'They cost too much'], 'Today’s habits shape future health.'],
    ['You can take a slightly lower-paying job with training and promotions, or a higher-paying dead-end job. Long-term thinking suggests…', 'The job with training and promotions', ['The dead-end job', 'No job', 'Flip a coin'], 'Future growth can beat today’s pay.']])],
  'think.persuasion': [bank('think.persuasion', [
    ['“Only 3 left — buy now!” is which technique?', 'Urgency', ['Evidence', 'Flattery', 'Facts'], 'Urgency rushes you so you don’t think.'],
    ['“Smart people like you choose our phone.” is which technique?', 'Flattery', ['Urgency', 'Evidence', 'Fear'], 'Flattery makes you feel good so you agree.'],
    ['“Don’t be the only one without it!” is which technique?', 'Fear of missing out', ['Evidence', 'Flattery', 'Discount'], 'FOMO pressures you to fit in.'],
    ['What is the best defense against pressure tactics?', 'Slow down and compare options', ['Decide fast', 'Trust the seller', 'Buy two'], 'Time and comparison beat pressure.'],
    ['A celebrity says a drink is great. This uses…', 'Celebrity endorsement, not evidence', ['A scientific study', 'Official data', 'A fact check'], 'Fame isn’t proof.'],
    ['Jax says, “Trust me, I’d never steer you wrong.” What should you do?', 'Ask for facts and think it through', ['Trust him completely', 'Give him money', 'Stop thinking'], 'Trust is earned with evidence, not words.']])],
  'think.negotiate': [bank('think.negotiate', [
    ['Before negotiating a price, what should you know?', 'Your highest price (your limit)', ['Nothing', 'The seller’s birthday', 'Only their name'], 'Knowing your limit protects you.'],
    ['What makes a win-win deal?', 'Both sides get something they value', ['One side gets everything', 'Nobody agrees', 'Yelling'], 'Good deals meet both sides’ needs.'],
    ['A landlord won’t lower rent. What else might you negotiate?', 'A longer lease for a small discount, or free parking', ['Nothing', 'A free house', 'Threats'], 'Trade things that matter to each side.'],
    ['The car price is $8,000. Your budget is $7,000. A good first move?', 'Offer a bit below $7,000 and explain why', ['Pay $9,000', 'Walk out silently', 'Insult the car'], 'Start below your limit, with reasons.'],
    ['When should you walk away from a deal?', 'When it goes past your limit', ['Never', 'Always immediately', 'When it’s fair'], 'Walking away is your strongest tool.'],
    ['Why listen carefully in a negotiation?', 'To learn what the other side really needs', ['To waste time', 'To look polite only', 'It doesn’t help'], 'Understanding needs finds solutions.']])],
  'think.strategy': [bank('think.strategy', [
    ['Your goal is a better job in a year. Which strategy fits?', 'Pick a skill employers need and practise it every week', ['Wait and hope', 'Apply nowhere', 'Change goals daily'], 'Strategy links your goal to steady actions.'],
    ['A rival store lowers prices. What smart strategy fits a small shop?', 'Compete on service and quality', ['Lower prices below cost forever', 'Close immediately', 'Copy their logo'], 'Play to your strengths.'],
    ['What should every strategy include?', 'A plan for what could go wrong', ['Only best-case hopes', 'No goals', 'Secrets'], 'Plan B makes plans stronger.'],
    ['You have limited money. Where should a new business spend first?', 'On what customers value most', ['On fancy signs', 'On parties', 'Equally on everything'], 'Focus resources where they matter.'],
    ['How do you know a strategy is working?', 'Measure results against your goal', ['Guess', 'Ask Jax', 'Never check'], 'Track results and adjust.']])],
  'think.systems': [orders('think.systems', [
    ['You cut staff to save money. Put the likely chain of effects in order.', ['Fewer staff on shift', 'Longer lines', 'Some customers leave', 'Sales drop', 'Savings are smaller than expected'], 'Changing one part ripples through the system.'],
    ['A new bus route opens. Put the effects in order.', ['More people can reach Midtown', 'Shops there get more customers', 'Shops hire more workers', 'More people have jobs'], 'Systems connect transport, business and jobs.'],
    ['The city plants trees on Main Street. Put the effects in order.', ['More shade on the street', 'Sidewalks stay cooler', 'More people walk there', 'Shops get more visitors'], 'One change spreads through connected parts.']]),
    bank('think.systems', [['Raising prices a lot could lead to…', 'Fewer customers, which might lower total sales', ['Always more money', 'Nothing', 'More customers'], 'Parts of a system push back on each other.']])],
  'think.uncertainty': [bank('think.uncertainty', [
    ['The weather might be stormy for your outdoor event. What’s wise?', 'Book a backup indoor space', ['Hope for sun', 'Cancel everything forever', 'Ignore the forecast'], 'Plan for the bad case while hoping for the good one.'],
    ['You’re not sure a new product will sell. Best first step?', 'Make a small batch and test it', ['Make 10,000', 'Never try', 'Borrow to make lots'], 'Small tests reduce uncertainty cheaply.'],
    ['Why keep savings when the future is uncertain?', 'They protect you if things go badly', ['They don’t help', 'To show off', 'Banks require it'], 'A cushion lets you handle surprises.'],
    ['A job offer pays more but the company is new and unstable. What should you weigh?', 'Higher pay vs. the chance the job ends soon', ['Only the pay', 'Only the office color', 'Nothing'], 'Compare outcomes and how likely they are.'],
    ['What does “keep options open” mean?', 'Avoid choices you can’t undo until you know more', ['Never decide', 'Say yes to everything', 'Close all doors'], 'Flexible choices help when the future is unclear.']])],
  'think.ethics': [bank('think.ethics', [
    ['You find a wallet with ID and $50. What is right?', 'Return it to the owner or the police', ['Keep the money', 'Throw it away', 'Keep the wallet'], 'Honesty when no one is watching.'],
    ['A coworker asks you to lie about their late arrival. What should you do?', 'Say no kindly; you won’t lie', ['Lie for them', 'Tell everyone', 'Lie and charge them'], 'Being fair includes being honest.'],
    ['You notice a cashier undercharged you $5. What is ethical?', 'Point it out and pay the right amount', ['Say nothing', 'Ask for more discount', 'Leave quickly'], 'Fairness applies even when it costs you.'],
    ['Your team project: one member did most of the work. What’s fair?', 'Give them credit', ['Take the credit', 'Say nothing', 'Blame them'], 'Credit should match effort.']])],
  'think.leadership': [bank('think.leadership', [
    ['A good leader…', 'Listens to the team and shares credit', ['Takes all the credit', 'Never listens', 'Blames others'], 'Leaders lift others up.'],
    ['Your team disagrees. What should a leader do?', 'Hear each side, then decide and explain why', ['Pick a favorite', 'Ignore it', 'Yell'], 'Fair process builds trust.'],
    ['How can a leader create opportunity for others?', 'Mentor newcomers and share what they know', ['Keep knowledge secret', 'Only help friends', 'Do everything alone'], 'Leadership means helping others grow.'],
    ['A mistake happened on your team. A good leader…', 'Takes responsibility and fixes it', ['Blames someone', 'Hides it', 'Quits'], 'Responsibility earns respect.'],
    ['Which shows leadership at work?', 'Training a new coworker without being asked', ['Arriving late', 'Ignoring problems', 'Gossiping'], 'Leaders act to help the team.']])],
  'think.planning': [bank('think.planning', [
    ['You have homework, chores and a friend’s party. What should you plan first?', 'The things that must be done, then fun', ['Fun first, always', 'Nothing', 'Only chores'], 'Plan musts first.'],
    ['Why make a to-do list?', 'So you don’t forget steps and can track progress', ['To waste paper', 'It slows you down', 'No reason'], 'Lists make plans visible.']])],
  'think.compare': [bank('think.compare', [
    ['🍎 $1 each or 🍎🍎🍎 3 for $2. Which is cheaper per apple?', '3 for $2', ['$1 each', 'They are the same'], '3 for $2 is less than $1 each.'],
    ['Bus: $2, 30 minutes. Walk: free, 50 minutes. You’re late. Which?', 'The bus', ['Walk', 'Stay home'], 'Compare what matters most right now: time.']])],
};

// keep the content fresh: the same skill avoids the questions it just asked (see learnkit.js)
