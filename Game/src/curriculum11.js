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
  'write.tense': [() => { const n = pick(NAMES), [base, past, fut] = pick([['walk', 'walked', 'will walk'], ['play', 'played', 'will play'], ['go', 'went', 'will go'], ['eat', 'ate', 'will eat'], ['write', 'wrote', 'will write'], ['run', 'ran', 'will run']]); const when = pick([['Yesterday', past], ['Tomorrow', fut]]);
    return ch('write.tense', `Which word fits? “${when[0]}, ${n} ___ to school.”`, when[1], [base + 's', when[1] === past ? fut : past, base + 'ing'], `“${when[0]}” tells us the time, so use ${when[0] === 'Yesterday' ? 'past' : 'future'} tense: “${when[1]}”.`, { dok: 2 }); }],
  'write.commas': [() => { const items = shuffle(['apples', 'bread', 'milk', 'eggs', 'rice', 'beans']).slice(0, 3); return ch('write.commas', 'Which sentence uses commas correctly in a list?', `We bought ${items[0]}, ${items[1]}, and ${items[2]}.`, [`We bought ${items[0]} ${items[1]} and ${items[2]}.`, `We bought, ${items[0]} ${items[1]}, and ${items[2]}.`, `We, bought ${items[0]}, ${items[1]} and, ${items[2]}.`], 'Put commas between items in a list. (The comma before “and” is common in school writing.)', { dok: 2 }); },
    () => { const d = pick(DAYS), n = ri(1, 28); return ch('write.commas', 'Which date is written correctly?', `${d}, May ${n}, 2026`, [`${d} May ${n} 2026`, `${d}, May, ${n} 2026`, `${d} May, ${n}, 2026`], 'Put a comma after the day of the week and between the date and the year.', { dok: 2 }); }],
  'write.forms': bank('write.forms', [
    ['A form asks for your “Date of birth.” What do you write?', 'The day you were born, with the month, day and year, like April 12, 2018', ['Today’s date', 'Your age only', 'Write today’s date'], 'Date of birth is your birthday with the year.', 2],
    ['A form says “Print your name.” What should you do?', 'Write your name in clear separate letters, not cursive', ['Sign in cursive', 'Type it on your phone', 'Draw a picture'], 'Print means clear, separate letters so anyone can read it.', 2],
    ['Why should you read a whole form before filling it in?', 'So you know what each box wants and don’t make mistakes', ['To waste time', 'Forms are all the same', 'Only the first line matters'], 'Reading first prevents errors, like putting information in the wrong box.', 3],
    ['A box says “Leave blank – office use only.” What do you do?', 'Leave it empty', ['Write your name', 'Write “blank”', 'Sign it'], 'Some boxes are for the people who process the form.', 1],
  ]),
  'write.messages': bank('write.messages', [
    ['Which text to a teacher is most polite and clear?', 'Hi Ms. Lee, I was sick today. Could you tell me the homework? Thank you, Ava', ['hw???', 'WHAT IS THE HOMEWORK', 'u forgot to send it'], 'A clear message greets the person, says what you need, and thanks them.', 2],
    ['What should go at the end of a message to an adult?', 'Thank you and your name', ['Nothing', 'Lots of emojis', 'A joke'], 'Closing politely and signing your name shows respect.', 1],
    ['Why should you reread a message before sending it?', 'To fix mistakes and make sure it says what you mean', ['It isn’t needed', 'To make it longer', 'To add more capital letters'], 'Messages can’t be unsent. Checking prevents confusion.', 3],
  ]),
  'write.paragraph': bank('write.paragraph', [
    ['What is a topic sentence?', 'The sentence that tells what the paragraph is about', ['The last word', 'A sentence with a question', 'The title'], 'A topic sentence states the main idea, usually first.', 1],
    ['Which sentence does NOT belong in a paragraph about dogs as pets?', 'Cats like to climb trees.', ['Dogs need daily walks.', 'Dogs can learn tricks.', 'Many dogs love to play fetch.'], 'Every sentence should support the topic.', 2],
    ['Which word helps connect ideas in a paragraph?', 'Also', ['Big', 'Run', 'Happy'], 'Linking words like also, then, because and finally connect sentences.', 2],
  ]),
  'write.email': bank('write.email', [
    ['Which greeting is best for an email to a new boss?', 'Dear Ms. Park,', ['Yo!', 'Hey dude', 'sup'], 'Use a professional greeting for work emails.', 2],
    ['Your email asks two questions. How should you write them?', 'As two short, separate sentences or a numbered list', ['As one very long sentence', 'In all capital letters', 'Only in the subject line'], 'Clear, separate questions get clear answers.', 2],
    ['Why should you check who is in the “To” line before sending?', 'So the email goes only to the right people', ['It doesn’t matter', 'To add more people', 'To make it faster'], 'Sending to the wrong person can share private information.', 3],
  ]),
  'write.resume': bank('write.resume', [
    ['Which skill would you list for a cashier job?', 'Counting change correctly', ['Sleeping late', 'Watching movies', 'Eating fast'], 'List skills the job actually needs.', 2],
    ['Why should a résumé be one page for a first job?', 'Employers skim quickly; short and clear stands out', ['Longer is always better', 'The law requires it', 'To save paper only'], 'Hiring managers spend seconds on each résumé.', 3],
    ['Which email address is best for a résumé?', 'One made from your real name', ['A silly nickname with numbers', 'A gaming username', 'A joke about pizza'], 'Use an email address with your name so you look professional.', 2],
  ]),
  'write.professional': bank('write.professional', [
    ['You’ll be late to work. Which message is best?', 'Hi Rosa, my bus is delayed. I’ll arrive by 9:15. Sorry for the trouble.', ['late', 'not coming in', 'whatever'], 'Say the problem, the new time, and apologize briefly.', 2],
    ['Which word is more professional than “stuff”?', 'Items', ['Things and stuff', 'Junk', 'Whatchamacallits'], 'Precise words sound professional and clear.', 1],
    ['Why keep work messages short and specific?', 'Busy readers understand and act faster', ['Short messages are rude', 'Long ones are always better', 'It doesn’t matter'], 'Clarity respects the reader’s time.', 3],
  ]),
  'write.report': bank('write.report', [
    ['Which sentence belongs in the “findings” part of a report?', 'Sales rose 20% in March.', ['We should hire more staff.', 'I think March is a nice month.', 'Thank you for reading.'], 'Findings state what the data shows.', 2],
    ['Why include a chart in a report?', 'It shows patterns in data quickly', ['To make it longer', 'Charts replace all words', 'Only for decoration'], 'Visuals help readers see trends.', 2],
    ['A report says “sales dropped” with no numbers. How could you improve it?', 'Add how much and when, like “sales dropped 15% in June”', ['Add more adjectives', 'Remove the sentence', 'Make it all capitals'], 'Specific numbers make findings believable.', 3],
  ]),
  'write.persuasive': bank('write.persuasive', [
    ['Which is the strongest reason to add a school garden?', 'Students could learn science by growing food, and the cafeteria could use it', ['Gardens are cool', 'Because I said so', 'Everyone wants one'], 'Strong reasons explain real benefits.', 3],
    ['What is a counterargument?', 'A point the other side might make, which you answer', ['Your main reason', 'A math problem', 'The title'], 'Answering the other side makes your argument stronger.', 2],
    ['Which closing sentence is most persuasive?', 'A garden would help us learn, eat healthier and enjoy our school more, so let’s start one this spring.', ['That’s all.', 'The end.', 'I don’t know.'], 'A strong closing restates the main point and calls for action.', 2],
  ]),
  'write.proposal': bank('write.proposal', [
    ['What should a proposal include first?', 'The problem it solves', ['The price only', 'A thank-you note', 'Your favorite color'], 'Readers need to know why the idea matters.', 2],
    ['Why include a budget in a proposal?', 'So decision-makers know what it will cost', ['To make it longer', 'Budgets are optional', 'Only big projects need one'], 'Cost is part of deciding yes or no.', 2],
    ['Which line shows a measurable goal?', 'Serve 50 customers a day by June', ['Be the best', 'Make people happy', 'Do a lot'], 'Measurable goals can be checked.', 3],
  ]),
  'write.analytical': bank('write.analytical', [
    ['Which sentence explains WHY, not just WHAT?', 'Attendance rose after the bus route changed, likely because more students could get to school on time.', ['Attendance rose.', 'There is a bus.', 'School starts at 8.'], 'Analysis links evidence to a cause.', 3],
    ['What makes an analysis stronger?', 'Evidence for each claim', ['More exclamation points', 'Longer words', 'Only opinions'], 'Claims need evidence to be convincing.', 2],
  ]),
  'write.research': bank('write.research', [
    ['Why should you cite sources in a research paper?', 'To give credit and let readers check your facts', ['To make it longer', 'It’s optional', 'Only teachers care'], 'Citations show where information came from.', 2],
    ['Which is paraphrasing?', 'Explaining the idea in your own words and citing the source', ['Copying a paragraph word for word', 'Changing one word', 'Leaving out the source'], 'Paraphrasing restates ideas in new words; you still cite it.', 3],
    ['What is a research question?', 'A focused question your research tries to answer', ['A random fact', 'The title page', 'A yes-or-no quiz'], 'A good question guides what you look for.', 1],
  ]),
  'write.argument': bank('write.argument', [
    ['Which claim is debatable (good for an argument)?', 'Schools should have later start times', ['The sun is hot', 'Water is wet', 'There are 7 days in a week'], 'An argument needs a claim people could disagree with.', 2],
    ['Which shows reasoning that connects evidence to a claim?', 'Because teens who sleep more do better in class, later starts could raise grades', ['Grades are numbers', 'Schools have bells', 'I like mornings'], 'Reasoning explains how the evidence supports the claim.', 3],
  ]),
  'write.bizplan': bank('write.bizplan', [
    ['What is a “target market” in a business plan?', 'The specific customers you plan to sell to', ['Every person on Earth', 'Your competitors', 'A store’s location'], 'Knowing your customers shapes your product and ads.', 2],
    ['Why does a business plan include a competitor section?', 'To show how your business will be different or better', ['To copy them', 'To ignore them', 'Plans don’t need it'], 'Investors want to know why customers would choose you.', 3],
    ['Which number shows if a business can survive?', 'Expected profit after all costs', ['The number of colors in the logo', 'How many friends like it', 'The owner’s age'], 'A business must earn more than it spends.', 2],
  ]),
  // ================================================================ reading
  'read.vocab': [() => { const [w, m, wrong] = pick([['enormous', 'very big', ['very small', 'very fast', 'very old']], ['tiny', 'very small', ['very big', 'loud', 'shiny']], ['glad', 'happy', ['sad', 'angry', 'sleepy']], ['rapid', 'fast', ['slow', 'quiet', 'wet']], ['chilly', 'cold', ['hot', 'dry', 'sunny']], ['shout', 'yell loudly', ['whisper', 'sleep', 'walk']], ['begin', 'start', ['end', 'stop', 'wait']], ['silent', 'quiet', ['noisy', 'bright', 'happy']]]);
    return ch('read.vocab', `What does “${w}” mean?`, m, wrong, `“${w}” means ${m}.`, { dok: 1 }); }],
  'read.wordparts': [() => { const [w, part, mean, wrong] = pick([['unhappy', 'un-', 'not happy', ['very happy', 'happy again', 'happy before']], ['redo', 're-', 'do again', ['not do', 'do before', 'do wrong']], ['careful', '-ful', 'full of care', ['without care', 'care again', 'not care']], ['fearless', '-less', 'without fear', ['full of fear', 'fear again', 'more fear']], ['preview', 'pre-', 'view before', ['view again', 'not view', 'view after']], ['misspell', 'mis-', 'spell wrongly', ['spell again', 'spell before', 'spell well']], ['teacher', '-er', 'a person who teaches', ['teaching again', 'not teaching', 'more teaching']]]);
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
    ['Why might reading all the steps first help?', 'You know what supplies you need and avoid surprises', ['It wastes time', 'Steps never change', 'Only the first step matters'], 'Previewing steps helps you plan.', 3],
  ]),
  'read.compare': bank('read.compare', [
    ['Ad A: “Bike $120, free helmet.” Ad B: “Bike $110, helmet $20.” Which costs less in total with a helmet?', 'Ad A ($120)', ['Ad B ($110)', 'They cost the same', 'You can’t tell'], 'B costs $110 + $20 = $130. A is $120 with the helmet.', 3],
    ['Two articles disagree about a fact. What should you do?', 'Check a third reliable source', ['Believe the longer one', 'Believe the first one you read', 'Ignore both'], 'Comparing sources helps find what’s accurate.', 3],
  ]),
  'read.technical': bank('read.technical', [
    ['A manual says “Unplug before cleaning.” Why is this step first?', 'To prevent electric shock', ['To save power', 'It’s optional', 'To make cleaning faster'], 'Safety steps come before the task.', 2],
    ['A diagram labels a part “A.” The text says “Insert tab A into slot B.” What should you do?', 'Match the labeled part A to the slot labeled B', ['Ignore the labels', 'Insert B into A', 'Throw away part A'], 'Technical texts use labels that match the diagram.', 2],
  ]),
  'read.contracts': bank('read.contracts', [
    ['A phone contract says “24-month term, $200 early cancellation fee.” What happens if you cancel after 12 months?', 'You pay $200', ['Nothing', 'They pay you', 'You get a free phone'], 'Canceling before the term ends triggers the fee.', 2],
    ['Why read the “fine print” before signing?', 'It can contain fees, limits or rules you agree to', ['It is only decoration', 'It’s never important', 'It’s for lawyers only'], 'Signing means you agree to everything, including the small print.', 3],
  ]),
  'read.main': bank('read.main', [
    ['A paragraph tells how bees carry pollen, make honey and help plants grow. What is the main idea?', 'Bees do important jobs', ['Honey is sweet', 'Plants are green', 'Bees can sting'], 'The main idea covers all the details.', 2],
  ]),
  'read.bias': bank('read.bias', [
    ['A review of a restaurant is written by the restaurant’s owner. What should a reader think?', 'It may be biased; look for reviews from customers', ['It must be fair', 'It is the most reliable review', 'Owners never exaggerate'], 'People who benefit may present one side.', 2],
  ]),
  'read.research': bank('read.research', [
    ['You find two studies with opposite results. What should you look at to decide which to trust more?', 'Sample size, who paid for it, and whether others repeated it', ['Which one has a nicer title', 'Which is newer only', 'Which agrees with you'], 'Quality and independence of research matter more than which result you prefer.', 3],
  ]),
  'read.figurative': bank('read.figurative', [
    ['“The classroom was a zoo.” What does this mean?', 'The classroom was wild and noisy', ['There were animals in class', 'The class went to the zoo', 'The classroom was quiet'], 'This metaphor compares the class to a noisy zoo.', 2],
  ]),
  // ================================================================ money
  'fin.needs': bank('fin.needs', [
    ['Which is a need?', 'A warm coat in winter', ['A video game', 'Candy', 'A toy car'], 'Needs keep you safe and healthy. A coat keeps you warm.', 1],
    ['Which is a want?', 'A new phone case', ['Food', 'Water', 'A place to live'], 'You can live without it, so it’s a want.', 1],
    ['You have $10. You need lunch ($6) and want a comic ($5). What should you do first?', 'Buy lunch, then save the rest for the comic later', ['Buy the comic first', 'Buy nothing', 'Borrow money'], 'Pay for needs first, then plan for wants.', 2],
    ['Why can something be a need for one person and a want for another?', 'It depends on their life. A car can be a need with no bus to work.', ['Needs and wants are the same for everyone', 'Wants are always cheaper', 'It can’t'], 'A car is a need if you can’t get to work without it.', 3],
    ['Which is a need for most families?', 'Electricity for the home', ['A second TV', 'A trip to a theme park', 'A new game'], 'Electricity runs lights, the fridge and heat.', 2],
  ]),
  'fin.saving': [
    () => { const per = pick([1, 2, 5]), weeks = ri(2, 5), goal = per * weeks; return { type: 'number', skill: 'fin.saving', q: `You save $${per} each week for a $${goal} toy. How many weeks until you have enough?`, a: weeks, why: Array.from({ length: weeks }, (_, i) => `Week ${i + 1}: $${per * (i + 1)}`).join('. ') + `. So ${weeks} weeks.`, suffix: 'weeks', dok: 2 }; },
    ...bank('fin.saving', [
      ['Where is a safe place to keep savings?', 'A bank or a piggy bank at home', ['In your coat pocket', 'Loose in your backpack', 'With a stranger'], 'A bank or a piggy bank at home keeps money safe.', 1],
      ['Why save some of your birthday money?', 'So you can buy something bigger later', ['So it disappears', 'So you can’t use it', 'Because saving is only for grown-ups'], 'Saving a little at a time adds up to something bigger.', 2],
    ]),
  ],
  'fin.score': bank('fin.score', [
    ['What has the biggest effect on a credit score?', 'Paying bills on time', ['Your age', 'Your favorite store', 'Your height'], 'Payment history is the largest part of a credit score.', 1],
    ['Using a lot of your credit limit can…', 'Lower your score', ['Raise your score a lot', 'Have no effect', 'Erase your debt'], 'Using less than 30% of your limit is a common guideline.', 2],
    ['Why might a landlord check your credit score?', 'To see whether you usually pay what you owe on time', ['To learn your hobbies', 'To set your grades', 'It never happens'], 'A good score suggests you’ll pay rent reliably.', 3],
  ]),
  'fin.investing': bank('fin.investing', [
    ['What is a stock?', 'A small piece of ownership in a company', ['A loan to a friend', 'A savings account', 'A type of bond'], 'Owning stock means you own part of a company.', 1],
    ['Why do investors keep money invested for many years?', 'Over long periods, markets have tended to grow despite ups and downs', ['Prices never go down', 'Money must be locked away', 'Short-term investing is guaranteed'], 'Time helps smooth out bad years, but nothing is guaranteed.', 3],
    ['What is an index fund?', 'A fund that holds many companies to match a whole market', ['One single stock', 'A bank loan', 'A lottery ticket'], 'Index funds spread risk across many companies.', 2],
  ]),
  'fin.expansion': bank('fin.expansion', [
    ['Before opening a second location, what should a business check?', 'Whether the first one is reliably profitable and there’s demand in the new area', ['Only the paint color', 'Nothing', 'Whether the owner wants to'], 'Expansion multiplies risks as well as rewards.', 3],
    ['Why can expanding too fast hurt a business?', 'Costs and debt can grow faster than income', ['It always helps', 'More stores always mean more profit', 'Customers dislike growth'], 'Cash flow problems are a top reason growing businesses fail.', 3],
  ]),
  'fin.diversify': bank('fin.diversify', [
    ['Why not put all your savings in one company’s stock?', 'If that company struggles, you could lose a lot', ['One company is always safer', 'It earns more for sure', 'Diversifying is illegal'], 'Spreading money out reduces the damage from any one failure.', 2],
    ['Which portfolio is most diversified?', 'Funds holding many companies, plus some bonds and cash', ['One tech stock', 'Two stocks in the same industry', 'All cash under the bed'], 'Different kinds of investments rise and fall at different times.', 3],
  ]),
  'fin.debt': bank('fin.debt', [
    ['You owe $500 on a card and can pay $25 or $100 this month. Which saves the most money?', 'Paying $100', ['Paying $25', 'Paying nothing', 'They cost the same'], 'Paying more lowers the balance that interest is charged on.', 2],
  ]),
  'fin.fraud': bank('fin.fraud', [
    ['A caller says they are from your bank and asks for your PIN. What should you do?', 'Hang up and call the number on the back of your card', ['Give the PIN', 'Give half the PIN', 'Ask them to call back later'], 'Real banks never ask for your PIN. Contact the bank directly.', 2],
  ]),
  // ================================================================ math
  'math.shapes': bank('math.shapes', [
    ['How many sides does a triangle have?', '3', ['4', '5', '6'], 'Tri- means three.', 1],
    ['How many corners does a square have?', '4', ['3', '5', '0'], 'A square has 4 sides and 4 corners.', 1],
    ['Which shape has no corners?', 'A circle', ['A square', 'A triangle', 'A rectangle'], 'A circle is one curved line with no corners.', 1],
    ['How are a square and a rectangle alike?', 'Both have 4 sides and 4 square corners', ['Both are round', 'Both have 3 sides', 'They are not alike'], 'A square is a special rectangle with all sides equal.', 2],
  ]),
  'math.finmath': [() => { const P = pick([200, 500, 1000, 2000]), r = pick([3, 4, 5, 6]), n = pick([2, 3]); const A = Math.round(P * (1 + r / 100) ** n * 100) / 100;
    return { type: 'number', skill: 'math.finmath', q: `You invest $${P} at ${r}% a year, compounded yearly, for ${n} years. About how much will you have? (to the cent)`, a: A, decimals: 2, prefix: '$', dok: 2, why: `Multiply by ${(1 + r / 100).toFixed(2)} each year: $${P} × ${(1 + r / 100).toFixed(2)}${n === 3 ? ' × ' + (1 + r / 100).toFixed(2) : ''} × ${(1 + r / 100).toFixed(2)} ≈ $${A.toFixed(2)}.` }; },
    () => { const P = pick([1000, 5000]), r = pick([6, 8, 9]); return ch('math.finmath', `Using the rule of 72, about how many years for $${P} to double at ${r}% a year?`, `About ${Math.round(72 / r)} years`, [`About ${r} years`, `About ${72 - r} years`, `About ${Math.round(72 / r) * 2} years`], `72 ÷ ${r} ≈ ${Math.round(72 / r)} years.`, { dok: 2 }); }],
  // ================================================================ cursive (more words and sentences to trace)
  'curs.fluent': [() => ({ type: 'trace', skill: 'curs.fluent', word: pick(['Have a nice day', 'Thank you so much', 'See you at noon', 'We can do this', 'Meet me at five', 'Best wishes', 'Call me later', 'All is well']), q: 'Trace the sentence in cursive.', why: 'Keep an even slant and steady spacing between words.', dok: 2 })],
  'curs.reading': [() => { const [note, q, a, w] = pick([[['Milk, eggs', 'and bread'], 'What is on the list?', 'Milk, eggs and bread', ['Milk and juice', 'Eggs and rice', 'Bread and jam']], [['Back at 3:30', '— Mom'], 'When will Mom be back?', '3:30', ['3:00', '5:30', '1:30']], [['Feed the cat', 'before school'], 'What should you do before school?', 'Feed the cat', ['Walk the dog', 'Wash the car', 'Call the cat']], [['Happy birthday,', 'Leo!'], 'Who is the card for?', 'Leo', ['Mom', 'Theo', 'Kai']]]);
    return { ...ch('curs.reading', `Read the cursive note. ${q}`, a, w, 'Read each word slowly. Cursive letters join, but the shapes are the same letters you know.', { dok: 2 }), cursive: note }; }],
  'curs.styles': [() => { const n = ri(2, 9), day = pick(DAYS); return { ...ch('curs.styles', 'Read the handwritten note. Which day is the delivery?', day, DAYS.filter((d) => d !== day).slice(0, 3), `The note says “Delivery: ${day}.” If a word is messy, use the letters you can read.`, { dok: 2 }), cursive: [`Delivery: ${day}`, `${n} boxes`, '— Rosa'] }; }],
  'curs.documents': [() => { const amt = pick(['$45.00', '$120.50', '$18.75']); return { ...ch('curs.documents', 'A handwritten receipt shows the total. How much?', amt, ['$4.50', '$12.05', '$187.50'], 'Read the numbers carefully: the decimal point separates dollars and cents.', { dok: 2 }), cursive: ['Garden supplies', `Total: ${amt}`, 'Paid in full'] }; }],
  'curs.varied': [() => { const nm = pick(['Margaret', 'Theodore', 'Eleanor', 'Benjamin']); return { ...ch('curs.varied', 'An old letter is signed at the bottom. Who wrote it?', nm, ['Martha', 'Thomas', 'Edward', 'Bernard'].filter((x) => x[0] === nm[0]).concat(['Rosa']).slice(0, 3), 'Old signatures can be fancy. Match the first letter and the length of the name.', { dok: 3 }), cursive: ['With warm regards,', nm] }; }],
};
