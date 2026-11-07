// REAL — bigger question banks (part 3: writing, reading, money, math, cursive) plus top-ups for any skill that
// still had fewer than 12 different questions. Generators build new sentences/numbers each time where that makes
// sense (capitals, commas, tense, homophones, word parts, saving, interest), so these skills never run dry.
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
const bank = (skill, rows) => rows.map(([q, a, w, why, dok, ww]) => () => ({ type: 'choice', skill, q, a, o: [a, ...w], why, dok, whyWrong: ww }));
const ch = (skill, q, a, w, why, extra = {}) => ({ type: 'choice', skill, q, a, o: [a, ...[...new Set(w)].filter((x) => x !== a).slice(0, 3)], why, ...extra });
const $ = (v) => '$' + (Number.isInteger(v) ? v.toLocaleString('en-US') : v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
const NAMES = ['Mia', 'Leo', 'Ava', 'Sam', 'Noor', 'Kai', 'Rosa', 'Theo', 'June', 'Omar'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PLACES = ['the park', 'the library', 'the store', 'the beach', 'the zoo'];

export const BANKS_C = {
  // ================================================================ writing
  'write.sentences': [
    () => { const n = pick(NAMES), v = pick(['runs', 'reads', 'sings', 'jumps']); return ch('write.sentences', 'Which one is a complete sentence?', `${n} ${v} fast.`, [`${n} fast.`, `Runs fast ${n}`, 'Fast and.'], `A sentence has who (${n}) and what they do (${v}).`, { dok: 2 }); },
    ...bank('write.sentences', [
      ['Which group of words is NOT a complete sentence?', 'The big red dog.', ['The dog barks.', 'I see a cat.', 'We play ball.'], '“The big red dog” tells who but not what the dog does.', 2],
      ['What goes at the end of a telling sentence?', 'A period (.)', ['A comma (,)', 'Nothing', 'A capital letter'], 'Telling sentences end with a period.', 1],
    ]),
  ],
  'write.caps': [
    () => { const n = pick(NAMES), d = pick(DAYS), p = pick(PLACES); return ch('write.caps', 'Which sentence uses capital letters correctly?', `${n} went to ${p} on ${d}.`, [`${n.toLowerCase()} went to ${p} on ${d}.`, `${n} went to ${p} on ${d.toLowerCase()}.`, `${n} Went To ${p} On ${d}.`], `Capitals go at the start of a sentence and on names (${n}) and days (${d}).`, { dok: 2 }); },
    ...bank('write.caps', [
      ['Which word always needs a capital letter?', 'I', ['me', 'my', 'you'], 'The word “I” is always a capital.', 1],
      ['Which sentence is an asking sentence with the right mark?', 'Where is my hat?', ['Where is my hat.', 'where is my hat?', 'Where is my hat!'], 'Asking sentences start with a capital and end with a question mark.', 2],
    ]),
  ],
  'write.grammar': [() => { const [w, part, others] = pick([['jumped', 'verb (action)', ['noun (person, place or thing)', 'adjective (describing word)']], ['happy', 'adjective (describing word)', ['verb (action)', 'noun (person, place or thing)']], ['library', 'noun (person, place or thing)', ['verb (action)', 'adjective (describing word)']], ['quickly', 'adverb (tells how)', ['noun (person, place or thing)', 'adjective (describing word)']]]);
    return ch('write.grammar', `In “The kids ${w === 'happy' ? 'were happy' : w === 'library' ? 'went to the library' : w === 'quickly' ? 'ran quickly' : 'jumped'},” what part of speech is “${w}”?`, part, others, `“${w}” is ${/^[aeiou]/.test(part) ? 'an' : 'a'} ${part}.`, { dok: 2 }); }],
  'write.homophones': [() => { const [s, a, w] = pick([['___ going to the park.', 'They’re', ['Their', 'There']], ['The dog wagged ___ tail.', 'its', ['it’s', 'its’']], ['Put the box over ___.', 'there', ['their', 'they’re']], ['I want ___ go too.', 'to', ['two', 'too']], ['___ backpacks are blue.', 'Their', ['There', 'They’re']], ['It’s ___ cold to swim.', 'too', ['to', 'two']], ['___ the best team!', 'You’re', ['Your', 'Youre']], ['Is this ___ coat?', 'your', ['you’re', 'you are']]]);
    const why = { 'They’re': '“They’re” = they are.', its: '“its” shows belonging; “it’s” = it is.', there: '“there” is a place.', to: '“to” goes with a verb or place.', Their: '“Their” shows belonging.', too: '“too” = also, or more than enough.', 'You’re': '“You’re” = you are.', your: '“your” shows belonging.' }[a];
    return ch('write.homophones', `Which word fits? “${s}”`, a, w, why, { dok: 2 }); }],
  'write.tense': [() => { const n = pick(NAMES), [now, past, fut, rest] = pick([['walks', 'walked', 'will walk', 'to school'], ['plays', 'played', 'will play', 'soccer'], ['goes', 'went', 'will go', 'to the park'], ['eats', 'ate', 'will eat', 'an apple'], ['writes', 'wrote', 'will write', 'a letter'], ['runs', 'ran', 'will run', 'around the track'], ['swims', 'swam', 'will swim', 'in the pool'], ['buys', 'bought', 'will buy', 'bread']]);
    const when = pick([['Yesterday', past, 'past'], ['Tomorrow', fut, 'future'], ['Every day', now, 'present']]);
    return ch('write.tense', `Which word fits? “${when[0]}, ${n} ___ ${rest}.”`, when[1], [now, past, fut].filter((x) => x !== when[1]), `“${when[0]}” tells us the time, so use the ${when[2]} tense: “${when[1]}”.`, { dok: 2 }); }],
  'write.commas': [() => { const items = shuffle(['apples', 'bread', 'milk', 'eggs', 'rice', 'beans']).slice(0, 3); return ch('write.commas', 'Which sentence uses commas correctly in a list?', `We bought ${items[0]}, ${items[1]}, and ${items[2]}.`, [`We bought ${items[0]} ${items[1]} and ${items[2]}.`, `We bought, ${items[0]} ${items[1]}, and ${items[2]}.`, `We, bought ${items[0]}, ${items[1]} and, ${items[2]}.`], 'Put commas between items in a list. (The comma before “and” is common in school writing.)', { dok: 2 }); },
    () => { const d = pick(DAYS), n = ri(1, 28); return ch('write.commas', 'Which date is written correctly?', `${d}, May ${n}, 2026`, [`${d} May ${n} 2026`, `${d}, May, ${n} 2026`, `${d} May, ${n}, 2026`], 'Put a comma after the day of the week and between the date and the year.', { dok: 2 }); }],
  'write.forms': bank('write.forms', [
    ['A form asks for your “Date of birth.” What do you write?', 'Your birthday, with the year', ['Today’s date, with the year', 'Your age, like 8 years old', 'The day you started school'], 'Date of birth is your birthday with the month, day and year, like April 12, 2018.', 2],
    ['A form says “Print your name.” What should you do?', 'Write it in clear, separate letters', ['Sign it in joined cursive letters', 'Write your first name only', 'Write it very small and fast'], 'Print means clear, separate letters so anyone can read it. It is not cursive.', 2],
    ['Why should you read a whole form before filling it in?', 'So you know what each box asks for', ['So you can skip the hard boxes', 'Because every form is the same', 'So you only fill in the first line'], 'Reading first prevents errors, like putting information in the wrong box.', 3],
    ['A box says “Leave blank – office use only.” What do you do?', 'Leave it empty', ['Write your name', 'Write “blank”', 'Sign it'], 'Some boxes are for the people who process the form.', 1],
  ]),
  'write.messages': bank('write.messages', [
    ['Which text to a teacher is most polite and clear?', 'Hi Ms. Lee, I was sick today. Could you tell me the homework? Thanks, Ava', ['hey ms lee i was sick today whats the homework?? tell me', 'Ms. Lee, I was sick today. Send me the homework right now. Ava', 'Hi Ms. Lee, I was sick today and I missed class. Thank you, Ava'], 'A clear message greets the person, says what you need, and thanks them.', 2],
    ['What should go at the end of a message to an adult?', 'Thank you and your name', ['A row of smiley faces', 'Just the word “bye”', 'Your phone number only'], 'Closing politely and signing your name shows respect.', 1],
    ['Why should you reread a message before sending it?', 'To fix mistakes and check it is clear', ['To make it as long as you can', 'To add capital letters to every word', 'To add lots of emojis to it'], 'Messages can’t be unsent. Checking prevents confusion.', 3],
  ]),
  'write.paragraph': bank('write.paragraph', [
    ['What is a topic sentence?', 'The sentence that tells the main idea', ['The sentence that ends the paragraph', 'The sentence with the most details', 'The title written above the paragraph'], 'A topic sentence states the main idea, usually first.', 1],
    ['Which sentence does NOT belong in a paragraph about dogs as pets?', 'Cats like to climb trees.', ['Dogs need daily walks.', 'Dogs can learn tricks.', 'Many dogs love to play fetch.'], 'Every sentence should support the topic.', 2],
    ['Which word helps connect ideas in a paragraph?', 'Also', ['Big', 'Run', 'Happy'], 'Linking words like also, then, because and finally connect sentences.', 2],
  ]),
  'write.email': bank('write.email', [
    ['Which greeting is best for an email to a new boss?', 'Dear Ms. Park,', ['Yo!', 'Hey dude', 'sup'], 'Use a professional greeting for work emails.', 2],
    ['Your email asks two questions. How should you write them?', 'As two short, separate sentences or a numbered list', ['As one long sentence joined with “and”', 'Only in the subject line, to save space', 'In all capital letters so they stand out'], 'Clear, separate questions get clear answers.', 2],
    ['Why should you check who is in the “To” line before sending?', 'So the email goes only to the right people', ['So the email sends a little faster', 'So you can add everyone you know', 'So the subject line looks correct'], 'Sending to the wrong person can share private information.', 3],
  ]),
  'write.resume': bank('write.resume', [
    ['Which skill would you list for a cashier job?', 'Counting change correctly', ['Playing video games well', 'Drawing cartoon animals', 'Knowing lots of song lyrics'], 'List skills the job actually needs.', 2],
    ['Why should a résumé be one page for a first job?', 'Employers skim quickly; short and clear stands out', ['The law says a résumé must be one page', 'To save paper and printer ink', 'So you don’t have to list any skills'], 'Hiring managers spend seconds on each résumé.', 3],
    ['Which email address is best for a résumé?', 'One made from your real name', ['A silly nickname with numbers', 'A gaming username', 'A joke about pizza'], 'Use an email address with your name so you look professional.', 2],
  ]),
  'write.professional': bank('write.professional', [
    ['You’ll be late to work. Which message is best?', 'Hi Rosa, my bus is delayed. I’ll arrive by 9:15. Sorry for the trouble.', ['hey rosa bus is late, idk when i’ll get there, sorry', 'Hi Rosa, I’m running late today. Sorry for the trouble.', 'Rosa, my bus is late again. Not my fault. See you soon.'], 'Say the problem, the new time, and apologize briefly.', 2],
    ['Which word is more professional than “stuff”?', 'Items', ['Things and stuff', 'Junk', 'Whatchamacallits'], 'Precise words sound professional and clear.', 1],
    ['Why keep work messages short and specific?', 'Busy readers understand and act faster', ['Short messages sound more serious', 'Long messages are seen as rude', 'It means you can skip a greeting'], 'Clarity respects the reader’s time.', 3],
  ]),
  'write.report': bank('write.report', [
    ['Which sentence belongs in the “findings” part of a report?', 'Sales rose 20% in March.', ['We should hire more staff.', 'I think March is a nice month.', 'Thank you for reading.'], 'Findings state what the data shows.', 2],
    ['Why include a chart in a report?', 'It shows patterns in data quickly', ['It makes the report look longer', 'It can replace all the writing', 'It adds color to fill the page'], 'Visuals help readers see trends.', 2],
    ['A report says “sales dropped” with no numbers. How could you improve it?', 'Add how much and when, like “dropped 15% in June”', ['Add stronger words, like “dropped a lot”', 'Move the sentence to the very end', 'Write “sales dropped” in bold letters'], 'Specific numbers make findings believable.', 3],
  ]),
  'write.persuasive': bank('write.persuasive', [
    ['Which is the strongest reason to add a school garden?', 'Students could learn science by growing food, and the cafeteria could use it', ['Gardens are nice to look at, and lots of other schools have one', 'Everyone I asked said they want one, so we should get one', 'A garden would be fun, and it would make our school cooler'], 'Strong reasons explain real benefits.', 3],
    ['What is a counterargument?', 'A point the other side might make, which you answer', ['The main reason you give for your side', 'A fact you repeat to make your point', 'The sentence that wraps up your essay'], 'Answering the other side makes your argument stronger.', 2],
    ['Which closing sentence is most persuasive?', 'A garden would help us learn and eat better, so let’s start one this spring.', ['That is all I have to say about why a garden would be a good idea.', 'In conclusion, gardens are plants that grow in dirt outside.', 'Maybe we could get a garden someday, but it is up to you.'], 'A strong closing restates the main point and calls for action.', 2],
  ]),
  'write.proposal': bank('write.proposal', [
    ['What should a proposal include first?', 'The problem it solves', ['The price only', 'A thank-you note', 'Your favorite color'], 'Readers need to know why the idea matters.', 2],
    ['Why include a budget in a proposal?', 'So decision-makers know what it will cost', ['To make the proposal look longer', 'To list what the team has bought', 'So no one asks about the plan'], 'Cost is part of deciding yes or no.', 2],
    ['Which line shows a measurable goal?', 'Serve 50 customers a day by June', ['Be the best café in town', 'Make our customers happy', 'Serve lots of people soon'], 'Measurable goals can be checked.', 3],
  ]),
  'write.analytical': bank('write.analytical', [
    ['Which sentence explains WHY, not just WHAT?', 'Attendance rose, likely because the new bus route got more students to school on time.', ['Attendance rose from 88% to 95% after the bus route changed in May.', 'The bus route changed in May, and it now has two more stops.', 'Attendance is important, and every student should come to school.'], 'Analysis links evidence to a cause.', 3],
    ['What makes an analysis stronger?', 'Evidence for each claim', ['More exclamation points', 'Longer words', 'Only opinions'], 'Claims need evidence to be convincing.', 2],
  ]),
  'write.research': bank('write.research', [
    ['Why should you cite sources in a research paper?', 'To give credit and let readers check your facts', ['To make the paper look longer and more serious', 'Because teachers like to see long lists', 'So you don’t need to use your own words'], 'Citations show where information came from.', 2],
    ['Which is paraphrasing?', 'Explaining the idea in your own words and citing the source', ['Copying a paragraph word for word, with the source', 'Changing a few words but keeping the rest the same', 'Putting quotation marks around the author’s words'], 'Paraphrasing restates ideas in new words; you still cite it.', 3],
    ['What is a research question?', 'A focused question your research tries to answer', ['A list of facts you found while reading online', 'The title on your report’s cover', 'A quiz you give readers at the end'], 'A good question guides what you look for.', 1],
  ]),
  'write.argument': bank('write.argument', [
    ['Which claim is debatable (good for an argument)?', 'Schools should have later start times', ['Most schools start before 9 AM', 'Teens need sleep to stay healthy', 'Some schools have changed start times'], 'An argument needs a claim people could disagree with.', 2],
    ['Which shows reasoning that connects evidence to a claim?', 'Because teens who sleep more do better in class, later starts could raise grades', ['Many teens say they feel tired and sleepy in their first class', 'Later start times are a popular idea with most of the students', 'Grades matter a lot, so schools should think hard about start times'], 'Reasoning explains how the evidence supports the claim.', 3],
  ]),
  'write.bizplan': bank('write.bizplan', [
    ['What is a “target market” in a business plan?', 'The specific customers you plan to sell to', ['Every person who might see your ads', 'The stores where you buy supplies', 'The other businesses you compete with'], 'Knowing your customers shapes your product and ads.', 2],
    ['Why does a business plan include a competitor section?', 'To show how your business will be different or better', ['To list every company that sells anything', 'To prove there is no competition at all', 'To copy the prices other businesses use'], 'Investors want to know why customers would choose you.', 3],
    ['Which number shows if a business can survive?', 'Expected profit after all costs', ['The number of colors in the logo', 'How many friends like it', 'The owner’s age'], 'A business must earn more than it spends.', 2],
  ]),
  // ================================================================ reading
  'read.vocab': [() => { const [w, m, wrong] = pick([['enormous', 'very big', ['very small', 'very fast', 'very old']], ['tiny', 'very small', ['very big', 'loud', 'shiny']], ['glad', 'happy', ['sad', 'angry', 'sleepy']], ['rapid', 'fast', ['slow', 'quiet', 'wet']], ['chilly', 'cold', ['hot', 'dry', 'sunny']], ['shout', 'yell loudly', ['whisper', 'sleep', 'walk']], ['begin', 'start', ['end', 'stop', 'wait']], ['silent', 'quiet', ['noisy', 'bright', 'happy']]]);
    return ch('read.vocab', `What does “${w}” mean?`, m, wrong, `“${w}” means ${m}.`, { dok: 1 }); }],
  'read.wordparts': [() => { const [w, part, mean, wrong] = pick([['unhappy', 'un-', 'not happy', ['very happy', 'happy again', 'happy before']], ['redo', 're-', 'do again', ['not do', 'do before', 'do wrong']], ['careful', '-ful', 'full of care', ['without care', 'care again', 'not care']], ['fearless', '-less', 'without fear', ['full of fear', 'fear again', 'more fear']], ['preview', 'pre-', 'view before', ['view again', 'not view', 'view after']], ['misspell', 'mis-', 'spell wrongly', ['spell again', 'spell before', 'spell well']], ['teacher', '-er', 'a person who teaches', ['to teach once again', 'not able to teach', 'a book for teaching']]]);
    return ch('read.wordparts', `The word part “${part}” helps you read “${w}.” What does “${w}” mean?`, mean, wrong, `“${part}” ${({ 'un-': 'means not', 're-': 'means again', '-ful': 'means full of', '-less': 'means without', 'pre-': 'means before', 'mis-': 'means wrongly', '-er': 'means a person who' })[part]}, so “${w}” means ${mean}.`, { dok: 2 }); }],
  'read.context': bank('read.context', [
    ['“The soup was so scalding that Leo waited ten minutes before eating.” What does scalding mean?', 'Very hot', ['Very cold', 'Very salty', 'Very small'], 'He had to wait to eat it, so it must be very hot.', 2],
    ['“Mia was famished after the long hike, so she ate two sandwiches.” Famished means…', 'Very hungry', ['Very tired', 'Very happy', 'Lost'], 'Eating two sandwiches is the clue.', 2],
  ]),
  'read.factopinion': [() => { const items = shuffle([['The library opens at 9 AM.', 'Fact'], ['The library is the best place in town.', 'Opinion'], ['Water boils at 100°C at sea level.', 'Fact'], ['Summer is the most fun season.', 'Opinion'], ['A week has seven days.', 'Fact'], ['Pizza is the tastiest food.', 'Opinion'], ['The bus costs $2.', 'Fact'], ['That movie was boring.', 'Opinion']]); const [t, a] = items[0];
    return ch('read.factopinion', `Fact or opinion? “${t}”`, a, [a === 'Fact' ? 'Opinion' : 'Fact', 'Neither'], a === 'Fact' ? 'You could check it, so it’s a fact.' : 'It’s what someone believes or feels, so it’s an opinion.', { dok: 2 }); }],
  'read.multistep': bank('read.multistep', [
    ['“Wash hands, then put on gloves, then slice the bread.” What do you do right after washing hands?', 'Put on gloves', ['Slice the bread', 'Eat the bread', 'Take off gloves'], 'Follow the order: wash, gloves, slice.', 2],
    ['Directions: “Fill the cup halfway. Add the powder. Stir for 30 seconds.” How long do you stir?', '30 seconds', ['Halfway', 'Until full', '3 minutes'], 'The last step says “Stir for 30 seconds.”', 2],
    ['Why might reading all the steps first help?', 'You know what supplies you need and avoid surprises', ['You can skip the steps that look too easy', 'You can do the last step first', 'You will not need to look back at all'], 'Previewing steps helps you plan.', 3],
  ]),
  'read.compare': bank('read.compare', [
    ['Ad A: “Bike $120, free helmet.” Ad B: “Bike $110, helmet $20.” Which costs less in total with a helmet?', 'Ad A ($120)', ['Ad B ($110)', 'They cost the same', 'You can’t tell'], 'B costs $110 + $20 = $130. A is $120 with the helmet.', 3],
    ['Two articles disagree about a fact. What should you do?', 'Check a third reliable source', ['Believe the longer one', 'Believe the first one you read', 'Ignore both'], 'Comparing sources helps find what’s accurate.', 3],
  ]),
  'read.technical': bank('read.technical', [
    ['A manual says “Unplug before cleaning.” Why is this step first?', 'To prevent electric shock', ['To save power', 'It’s optional', 'To make cleaning faster'], 'Safety steps come before the task.', 2],
    ['A diagram labels a part “A.” The text says “Insert tab A into slot B.” What should you do?', 'Match the labeled part A to the slot labeled B', ['Insert part B into the slot labeled A', 'Put tab A anywhere that it seems to fit', 'Find part B first and set part A aside'], 'Technical texts use labels that match the diagram.', 2],
  ]),
  'read.contracts': bank('read.contracts', [
    ['A phone contract says “24-month term, $200 early cancellation fee.” What happens if you cancel after 12 months?', 'You pay $200', ['Nothing', 'They pay you', 'You get a free phone'], 'Canceling before the term ends triggers the fee.', 2],
    ['Why read the “fine print” before signing?', 'It can contain fees, limits or rules you agree to', ['It only lists the company’s address', 'It just repeats the big print above', 'It only matters if you are a lawyer'], 'Signing means you agree to everything, including the small print.', 3],
  ]),
  'read.main': bank('read.main', [
    ['A paragraph tells how bees carry pollen, make honey and help plants grow. What is the main idea?', 'Bees do important jobs', ['Bees make sweet honey', 'Plants grow in the sun', 'Some bees can sting you'], 'The main idea covers all the details.', 2],
  ]),
  'read.bias': bank('read.bias', [
    ['A review of a restaurant is written by the restaurant’s owner. What should a reader think?', 'It may be biased; look for reviews from customers', ['It is fair, since the owner knows the food best', 'It is the most reliable review you can find', 'It is true, because owners must be honest'], 'People who benefit may present one side.', 2],
  ]),
  'read.research': bank('read.research', [
    ['You find two studies with opposite results. What should you look at to decide which to trust more?', 'Sample size, who paid for it, and whether others repeated it', ['Which one has the clearest title and nicest charts', 'Which one came out most recently, and nothing else', 'Which one agrees with what you already believe'], 'Quality and independence of research matter more than which result you prefer.', 3],
  ]),
  'read.figurative': bank('read.figurative', [
    ['“The classroom was a zoo.” What does this mean?', 'The classroom was wild and noisy', ['There were animals in class', 'The class went to the zoo', 'The classroom was quiet'], 'This metaphor compares the class to a noisy zoo.', 2],
  ]),
  // ================================================================ money
  'fin.needs': bank('fin.needs', [
    ['Which is a need?', 'A warm coat in winter', ['A new video game', 'A bag of candy', 'A toy race car'], 'Needs keep you safe and healthy. A coat keeps you warm.', 1],
    ['Which is a want?', 'A new phone case', ['Food', 'Water', 'A place to live'], 'You can live without it, so it’s a want.', 1],
    ['You have $10. You need lunch ($6) and want a comic ($5). What should you do first?', 'Buy lunch, then save the rest for the comic later', ['Buy the comic first, then get lunch', 'Spend it all on two comics today', 'Borrow money so you can get both'], 'Pay for needs first, then plan for wants.', 2],
    ['Why can something be a need for one person and a want for another?', 'Their lives are not the same', ['Needs are the same for all people', 'Wants always cost less money', 'Some people just like to shop'], 'It depends on their life. A car is a need if there is no bus to work.', 3],
    ['Which is a need for most families?', 'Electricity for the home', ['A second TV', 'A trip to a theme park', 'A new game'], 'Electricity runs lights, the fridge and heat.', 2],
  ]),
  'fin.saving': [
    () => { const per = pick([1, 2, 5]), weeks = ri(2, 5), goal = per * weeks; return { type: 'number', skill: 'fin.saving', q: `You save $${per} each week for a $${goal} toy. How many weeks until you have enough?`, a: weeks, why: Array.from({ length: weeks }, (_, i) => `Week ${i + 1}: $${per * (i + 1)}`).join('. ') + `. So ${weeks} weeks.`, suffix: 'weeks', dok: 2 }; },
    ...bank('fin.saving', [
      ['Where is a safe place to keep savings?', 'A bank or a piggy bank at home', ['In your coat pocket all day', 'Loose in your school backpack', 'With someone you just met'], 'A bank or a piggy bank at home keeps money safe.', 1],
      ['Why save some of your birthday money?', 'So you can buy something bigger later', ['So it disappears', 'So you can’t use it', 'Because saving is only for grown-ups'], 'Saving a little at a time adds up to something bigger.', 2],
    ]),
  ],
  'fin.score': bank('fin.score', [
    ['What has the biggest effect on a credit score?', 'Paying bills on time', ['Your age', 'Your favorite store', 'Your height'], 'Payment history is the largest part of a credit score.', 1],
    ['Using a lot of your credit limit can…', 'Lower your score', ['Raise your score a lot', 'Have no effect', 'Erase your debt'], 'Using less than 30% of your limit is a common guideline.', 2],
    ['Why might a landlord check your credit score?', 'To see whether you usually pay what you owe on time', ['To find out how much money you earn each week', 'To check if you have ever been in trouble at school', 'To see how many bank accounts your family has'], 'A good score suggests you’ll pay rent reliably.', 3],
  ]),
  'fin.investing': bank('fin.investing', [
    ['What is a stock?', 'A small piece of ownership in a company', ['A loan you make to a company', 'A bank account that earns interest', 'A promise from the government to repay'], 'Owning stock means you own part of a company.', 1],
    ['Why do investors keep money invested for many years?', 'Over long periods, markets have tended to grow despite ups and downs', ['Stock prices never go down if you wait a few months', 'The bank locks the money so it can’t be taken out', 'Short-term investing is against the rules for most people'], 'Time helps smooth out bad years, but nothing is guaranteed.', 3],
    ['What is an index fund?', 'A fund that holds many companies to match a whole market', ['A single stock picked by an expert to beat the market', 'A bank loan with a low rate for buying shares', 'A savings account that pays a fixed rate each year'], 'Index funds spread risk across many companies.', 2],
  ]),
  'fin.expansion': bank('fin.expansion', [
    ['Before opening a second location, what should a business check?', 'Whether the first one is reliably profitable and there’s demand in the new area', ['Whether the owner likes the new neighborhood and its shops', 'Whether the new building is bigger and newer than the first', 'Whether friends and family think a second store is a good idea'], 'Expansion multiplies risks as well as rewards.', 3],
    ['Why can expanding too fast hurt a business?', 'Costs and debt can grow faster than income', ['It always helps', 'More stores always mean more profit', 'Customers dislike growth'], 'Cash flow problems are a top reason growing businesses fail.', 3],
  ]),
  'fin.diversify': bank('fin.diversify', [
    ['Why not put all your savings in one company’s stock?', 'If that company struggles, you could lose a lot', ['One company’s stock always grows more slowly', 'You can only buy a few shares of one company', 'It costs more in fees to own just one stock'], 'Spreading money out reduces the damage from any one failure.', 2],
    ['Which portfolio is most diversified?', 'Funds holding many companies, plus some bonds and cash', ['Ten stocks, all from the same tech industry', 'One large company that has done well for years', 'All of it in cash in one savings account'], 'Different kinds of investments rise and fall at different times.', 3],
  ]),
  'fin.debt': bank('fin.debt', [
    ['You owe $500 on a card and can pay $25 or $100 this month. Which saves the most money?', 'Paying $100', ['Paying $25', 'Paying nothing', 'They cost the same'], 'Paying more lowers the balance that interest is charged on.', 2],
  ]),
  'fin.fraud': bank('fin.fraud', [
    ['A caller says they are from your bank and asks for your PIN. What should you do?', 'Hang up and call the number on the back of your card', ['Give the PIN, since they know your name and bank', 'Ask them to call back later and then give the PIN', 'Give only the first two digits of your PIN'], 'Real banks never ask for your PIN. Contact the bank directly.', 2],
  ]),
  // ================================================================ math
  'math.shapes': bank('math.shapes', [
    ['How many sides does a triangle have?', '3', ['4', '5', '6'], 'Tri- means three.', 1],
    ['How many corners does a square have?', '4', ['3', '5', '0'], 'A square has 4 sides and 4 corners.', 1],
    ['Which shape has no corners?', 'A circle', ['A square', 'A triangle', 'A rectangle'], 'A circle is one curved line with no corners.', 1],
    ['How are a square and a rectangle alike?', 'Both have 4 sides and 4 square corners', ['Both have 4 sides that are all the same', 'Both have 3 sides and 3 corners', 'Both are round with no corners'], 'A square is a special rectangle with all sides equal.', 2],
  ]),
  'math.finmath': [() => { const P = pick([200, 500, 1000, 2000]), r = pick([3, 4, 5, 6]), n = pick([2, 3]); const A = Math.round(P * (1 + r / 100) ** n * 100) / 100;
    return { type: 'number', skill: 'math.finmath', q: `You invest $${P} at ${r}% a year, compounded yearly, for ${n} years. How much will you have? Round to the nearest cent.`, a: A, decimals: 2, prefix: '$', dok: 2, why: `Multiply by ${(1 + r / 100).toFixed(2)} each year: $${P} × ${(1 + r / 100).toFixed(2)}${n === 3 ? ' × ' + (1 + r / 100).toFixed(2) : ''} × ${(1 + r / 100).toFixed(2)} ≈ $${A.toFixed(2)}.` }; },
    () => { const P = pick([1000, 5000]), r = pick([6, 8, 9]); return ch('math.finmath', `Using the rule of 72, about how many years for $${P} to double at ${r}% a year?`, `About ${Math.round(72 / r)} years`, [`About ${r} years`, `About ${72 - r} years`, `About ${Math.round(72 / r) * 2} years`], `72 ÷ ${r} ≈ ${Math.round(72 / r)} years.`, { dok: 2 }); }],
  // ================================================================ cursive (more words and sentences to trace)
  'curs.fluent': [() => ({ type: 'trace', skill: 'curs.fluent', word: pick(['Have a nice day', 'Thank you so much', 'See you at noon', 'We can do this', 'Meet me at five', 'Best wishes', 'Call me later', 'All is well']), q: 'Trace the sentence in cursive.', why: 'Keep an even slant and steady spacing between words.', dok: 2 })],
  'curs.reading': [() => { const [note, q, a, w] = pick([[['Milk, eggs', 'and bread'], 'What is on the list?', 'Milk, eggs and bread', ['Milk, eggs and juice', 'Eggs, rice and bread', 'Milk, jam and bread']], [['Back at 3:30', '— Mom'], 'When will Mom be back?', '3:30', ['3:00', '5:30', '1:30']], [['Feed the cat', 'before school'], 'What should you do before school?', 'Feed the cat', ['Walk the dog', 'Wash the car', 'Call the cat']], [['Happy birthday,', 'Leo!'], 'Who is the card for?', 'Leo', ['Mom', 'Theo', 'Kai']]]);
    return { ...ch('curs.reading', `Read the cursive note. ${q}`, a, w, 'Read each word slowly. Cursive letters join, but the shapes are the same letters you know.', { dok: 2 }), cursive: note }; }],
  'curs.styles': [() => { const n = ri(2, 9), day = pick(DAYS); return { ...ch('curs.styles', 'Read the handwritten note. Which day is the delivery?', day, DAYS.filter((d) => d !== day).slice(0, 3), `The note says “Delivery: ${day}.” If a word is messy, use the letters you can read.`, { dok: 2 }), cursive: [`Delivery: ${day}`, `${n} boxes`, '— Rosa'] }; }],
  'curs.documents': [() => { const amt = pick(['$45.00', '$120.50', '$18.75']); return { ...ch('curs.documents', 'A handwritten receipt shows the total. How much?', amt, ['$4.50', '$12.05', '$187.50'], 'Read the numbers carefully: the decimal point separates dollars and cents.', { dok: 2 }), cursive: ['Garden supplies', `Total: ${amt}`, 'Paid in full'] }; }],
  'curs.varied': [() => { const nm = pick(['Margaret', 'Theodore', 'Eleanor', 'Benjamin']); return { ...ch('curs.varied', 'An old letter is signed at the bottom. Who wrote it?', nm, ['Martha', 'Thomas', 'Edward', 'Bernard'].filter((x) => x[0] === nm[0]).concat(['Rosa']).slice(0, 3), 'Old signatures can be fancy. Match the first letter and the length of the name.', { dok: 3 }), cursive: ['With warm regards,', nm] }; }],
};
