// REAL — curriculum, part 5: final top-up so every skill has at least 8 different questions,
// including practice for cursive strokes and reading cursive notes.

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const ch = (skill, q, a, wrong, why, v) => ({ type: 'choice', skill, q, a, o: [a, ...wrong], why, v });
const bank = (skill, rows) => () => { const [q, a, w, why, v] = pick(rows); return ch(skill, q, a, w, why, v); };
const note = (skill, rows) => () => { const [lines, q, a, w, why] = pick(rows); return { ...ch(skill, q, a, w, why), cursive: lines }; };

export const TOPUP_GEN = {
  'curs.strokes': [() => ({ type: 'trace', skill: 'curs.strokes', word: pick(['lll', 'eee', 'uuu', 'ooo', 'mmm', 'nnn', 'iii', 'www', 'le', 'ee', 'll', 'uu']), q: 'Trace the joined strokes in one smooth line.' })],
  'curs.reading': [note('curs.reading', [
    [['Back in 5 minutes', '— Rosa'], 'What does the note say?', 'Rosa will be back in 5 minutes', ['The store is closed', 'Rosa quit', 'Buy 5 apples'], 'Find the tall letters (B, k, f) first, then read the rest.'],
    [['Happy birthday,', 'Sam!'], 'Who is the card for?', 'Sam', ['Rosa', 'Theo', 'Nova'], 'The name comes after the greeting.'],
    [['Milk', 'Eggs', 'Bread'], 'How many things are on the list?', '3', ['2', '4', '5'], 'Count each line.'],
    [['Thank you', 'for your help!'], 'What is the note saying?', 'Thank you for your help', ['Help me now', 'Go away', 'See you soon'], 'Read word by word: Thank, you, for, your, help.'],
    [['Dinner at 6'], 'When is dinner?', '6', ['8', '5', '9'], 'Numbers look the same in cursive and print.'],
    [['Love, Mom'], 'Who wrote the note?', 'Mom', ['Dad', 'Rosa', 'Sam'], 'The name after “Love,” is who wrote it.'],
    [['Park at 3pm', 'bring a ball'], 'What should you bring?', 'A ball', ['A bike', 'A book', 'Lunch'], 'The second line tells you what to bring.'],
    [['Closed on', 'Sunday'], 'When is it closed?', 'Sunday', ['Monday', 'Saturday', 'Friday'], 'Capital S starts Sunday.']])],
  'write.proposal': [bank('write.proposal', [
    ['Which is a clear “next step” to end a proposal?', 'Approve a 2-week trial starting May 1.', ['Think about it.', 'Maybe someday.', 'Whatever works.'], 'End with a specific action and date.'],
    ['Which timeline is clearest?', 'Week 1: buy supplies. Week 2: open. Week 4: review sales.', ['Soon.', 'Later on.', 'When ready.'], 'Clear timelines give dates or weeks.'],
    ['Who should a proposal be written for?', 'The person who decides, using what they care about', ['Yourself only', 'Nobody', 'Your pet'], 'Know your reader: what problem do they need solved?'],
    ['Which benefit is strongest for a store manager?', 'The plan could raise weekend sales about 10%', ['It would be fun', 'I like it', 'It’s cool'], 'Benefits the reader cares about, with numbers.']])],
  'write.analytical': [bank('write.analytical', [
    ['Which sentence explains a cause?', 'Fewer people rode the bus because fares went up $1.', ['The bus is blue.', 'Fares exist.', 'People ride buses.'], '“Because” links cause to effect.'],
    ['Which sentence draws a conclusion from evidence?', 'Since sales doubled on rainy days, weather affects soup sales.', ['Soup is hot.', 'It rained.', 'Sales happened.'], 'A conclusion follows from the evidence.'],
    ['Which word helps connect evidence to a point?', '“Therefore”', ['“Blue”', '“Sandwich”', '“Hello”'], 'Connecting words: therefore, because, which means, as a result.'],
    ['What is the difference between describing and analyzing?', 'Analyzing explains why or how; describing says what', ['They’re the same', 'Describing is longer', 'Analyzing uses pictures'], 'Description tells what; analysis tells why.']])],
  'write.research': [bank('write.research', [
    ['Which is a good note from a source?', 'City Clinic, 2026: flu cases fell 20% after free check-ups.', ['flu stuff', 'something about clinics', 'a number'], 'Notes should record the fact and where it came from.'],
    ['What is a quotation?', 'Someone’s exact words, in quotation marks, with credit', ['Your own idea', 'A summary', 'A guess'], 'Quote exactly and say who said it.'],
    ['Which is paraphrasing?', 'Putting a source’s idea in your own words, with credit', ['Copying word for word without credit', 'Making up facts', 'Ignoring sources'], 'Paraphrase and still credit the source.'],
    ['Why use more than one source?', 'To check facts and see different views', ['To make it longer', 'Rules say ten', 'One is always enough'], 'Several sources make research stronger.']])],
  'write.argument': [bank('write.argument', [
    ['Which is the best evidence for “Schools should start later”?', 'Studies show teens learn better with more sleep', ['I hate mornings', 'Everyone says so', 'It feels right'], 'Use research, not feelings.'],
    ['What is a rebuttal?', 'Your answer to the other side’s argument', ['Your first sentence', 'A quote', 'The title'], 'Rebuttals show you considered other views.'],
    ['Which ending is strongest for an argument?', 'A clear restatement of the claim and a call to action', ['A random fact', 'An insult', 'A new topic'], 'Close by reminding the reader what to do and why.'],
    ['Which is a logical fallacy?', '“Everyone is doing it, so it must be right.”', ['“Data shows a 20% drop.”', '“Two studies agree.”', '“The law says…”'], 'Popularity isn’t proof (bandwagon fallacy).']])],
  'write.messages': [bank('write.messages', [
    ['Which message is best to cancel plans with a friend?', 'Hi Sam, I’m sorry, I can’t make it today. Can we try Saturday?', ['no', 'cant', 'nevermind'], 'Say sorry, explain briefly and suggest another time.'],
    ['Which message gives all the needed details?', 'Pick-up is at 3:30 at the library’s front door.', ['Pick me up later', 'Come get me', 'You know where'], 'Who, what, when, where.'],
    ['Why reread a message before sending it?', 'To catch mistakes and check the tone', ['To waste time', 'It doesn’t matter', 'To delete it'], 'Rereading prevents misunderstandings.'],
    ['Which emoji use is best in a message to your boss?', 'None or very few', ['Ten emojis', 'Only emojis', 'All caps with emojis'], 'Keep work messages professional.']])],
  'write.resume': [bank('write.resume', [
    ['Which belongs at the top of a résumé?', 'Your name and how to contact you', ['Your favorite food', 'A joke', 'Your pet’s photo'], 'Employers need to reach you.'],
    ['Should a résumé include lies to look better?', 'No, always be truthful', ['Yes, a few', 'Only small ones', 'Everyone does'], 'Lies can cost you the job later.'],
    ['Which résumé line is best for a babysitting job?', 'Cared for two children ages 4 and 7 every weekend for a year', ['Watched kids', 'Did babysitting', 'Kids'], 'Specific details and time show experience.']])],
  'write.report': [bank('write.report', [
    ['Which title fits a report?', 'Weekend Bread Sales: Findings and Recommendations', ['Stuff', 'Bread!!!', 'Hi'], 'Report titles say what the report covers.'],
    ['Which is the most objective sentence for a report?', 'Sales rose 12% in March.', ['Sales were awesome!', 'I think sales were nice.', 'Sales felt good.'], 'Reports use measurable facts.'],
    ['Why include a chart in a report?', 'To show data clearly at a glance', ['To fill space', 'To decorate', 'Charts are required always'], 'Visuals help readers see patterns.']])],
  'write.persuasive': [bank('write.persuasive', [
    ['Who is the audience of a letter asking the mayor for a crosswalk?', 'The mayor', ['Your friend', 'Yourself', 'A pet'], 'Write with your audience’s concerns in mind.'],
    ['Which opening grabs attention best?', 'Every morning, 200 kids cross Oak Street with no crosswalk.', ['Hi.', 'This is a letter.', 'I am writing.'], 'A striking fact pulls readers in.'],
    ['Which is an emotional appeal used fairly?', 'Imagine your own child crossing that busy street.', ['You’re a terrible person if you disagree.', 'Only fools say no.', 'Do it or else.'], 'Fair appeals invite empathy without insults.']])],
  'write.bizplan': [bank('write.bizplan', [
    ['What is a “target customer”?', 'The main group of people you want to sell to', ['Anyone at all', 'Your competitors', 'Your landlord'], 'Knowing your customer shapes your plan.'],
    ['Which is a startup cost?', 'Buying the coffee cart', ['Monthly profit', 'A customer’s tip', 'Next year’s sales'], 'Startup costs come before you open.'],
    ['Why include a competitor section?', 'To explain how you’re different and better', ['To praise rivals', 'To copy them', 'It’s not needed'], 'Know your competition.']])],
  'write.paragraph': [bank('write.paragraph', [
    ['Which is the best closing sentence for a paragraph about saving money?', 'That’s why saving a little each week makes a big difference.', ['I like cats.', 'Money is green.', 'The end.'], 'Closings restate the main idea.'],
    ['How many details should support a topic sentence?', 'Usually two or three', ['Zero', 'Fifty', 'Exactly one hundred'], 'Enough to support, not overwhelm.'],
    ['Which transition word shows the next detail?', 'Also', ['Banana', 'Never', 'Blue'], 'Transitions: also, next, another, finally.']])],
  'write.email': [bank('write.email', [
    ['Before sending an important email, you should…', 'Proofread it and check the recipient', ['Send it fast', 'Add ten exclamation marks', 'Write in all caps'], 'Check spelling, tone and who it goes to.'],
    ['What does “CC” on an email do?', 'Sends a copy to someone else', ['Deletes the email', 'Makes it urgent', 'Adds color'], 'CC keeps others informed.']])],
  'write.professional': [bank('write.professional', [
    ['Which sentence is most professional?', 'I apologize for the delay; your order will ship tomorrow.', ['Sorry lol it’s late', 'not my fault', 'chill'], 'Professional = polite, clear, responsible.'],
    ['How should you reply to an upset customer’s message?', 'Calmly, apologize and offer a solution', ['Argue', 'Ignore it', 'Reply in all caps'], 'Calm and helpful wins trust.']])],
  'write.homophones': [bank('write.homophones', [
    ['Choose the right word: “___ going to love this game!”', 'You’re', ['Your'], 'You’re = you are.'],
    ['Choose the right word: “Is this ___ jacket?”', 'your', ['you’re'], 'Your shows it belongs to you.'],
    ['Choose the right word: “The dog wagged ___ tail.”', 'its', ['it’s'], 'Its = belongs to it. It’s = it is.']])],
  'write.commas': [bank('write.commas', [
    ['Which is correct?', 'After lunch, we went to the park.', ['After lunch we, went to the park.', 'After, lunch we went to the park.'], 'Comma after an introductory phrase.']])],
  'read.summarize': [bank('read.summarize', [
    ['What should a summary leave out?', 'Small, unimportant details', ['The main idea', 'The key events', 'Who it’s about'], 'Summaries keep the big ideas only.'],
    ['How long should a summary be compared with the original?', 'Much shorter', ['Longer', 'Exactly the same', 'Twice as long'], 'A summary condenses.']])],
  'read.bias': [bank('read.bias', [
    ['Which headline is most neutral?', 'City Council Votes 5–4 to Raise Bus Fares', ['Greedy Council Robs Riders!', 'Heroes Save Buses!', 'Outrageous Fare Hike Shocks All!'], 'Neutral headlines report facts without loaded words.'],
    ['A charity ad shows only sad pictures. What should you ask?', 'What the full facts are and how money is used', ['Nothing', 'Give everything now', 'Ignore all charities'], 'Emotion can be fair, but check the facts.'],
    ['How can you spot bias in your own thinking?', 'Look for good evidence against what you believe', ['Only read what agrees with you', 'Never think about it', 'Ask Jax'], 'Checking the other side fights bias.']])],
  'read.sources': [bank('read.sources', [
    ['Which is a red flag for a source?', 'No author, no date and lots of exclamation marks', ['Clear author and date', 'Cited studies', 'A university website'], 'Missing basics and hype are warning signs.'],
    ['A source agrees with three others from different experts. This makes it…', 'More trustworthy', ['Less trustworthy', 'Definitely false', 'Irrelevant'], 'Independent agreement builds confidence.'],
    ['Which is usually more reliable for local news?', 'An established local newspaper', ['An anonymous rumor account', 'A chain message', 'A pop-up ad'], 'Accountable sources with editors are more reliable.']])],
  'read.research': [bank('read.research', [
    ['Why write down where each fact came from?', 'So you can credit and recheck it later', ['To make notes messy', 'No reason', 'To hide it'], 'Track sources as you go.'],
    ['Your sources don’t answer your question. What now?', 'Refine your question or search different sources', ['Make up an answer', 'Quit', 'Copy any website'], 'Research often loops back.'],
    ['Which conclusion is careful?', '“The evidence suggests…, but more data would help.”', ['“This proves everything forever.”', '“I’m 100% sure.”', '“Everyone agrees.”'], 'Careful conclusions match the strength of the evidence.']])],
  'read.technical': [bank('read.technical', [
    ['A recipe says 350°F. Your oven is in °C. What should you do?', 'Convert it (about 175°C)', ['Use 350°C', 'Guess', 'Skip baking'], 'Units matter: 350°C would burn the food.']])],
  'read.evidence': [bank('read.evidence', [
    ['Which is the strongest kind of evidence for a claim about a park?', 'Visitor counts from the city', ['A rumor', 'A guess', 'A feeling'], 'Measured data is strong evidence.'],
    ['Where should evidence come in a written answer?', 'Right after the point it supports', ['At random', 'Only in the title', 'Nowhere'], 'Point, then proof.']])],
  'read.story': [bank('read.story', [
    ['What is the “plot” of a story?', 'The events that happen, in order', ['The title', 'The author', 'The cover'], 'Plot = what happens.'],
    ['What is the “theme” of a story?', 'The lesson or big idea', ['The setting', 'The cover color', 'The first word'], 'The theme is the message, like “kindness matters”.']])],
  'curs.documents': [note('curs.documents', [
    [['Invoice #204', 'Total due: $86.40', 'Due: June 10'], 'When is the payment due?', 'June 10', ['June 4', 'June 20', 'July 10'], 'Find the word “Due” and read the date after it.']])],
  'fin.saving': [bank('fin.saving', [
    ['You save $5 a week. How much after 4 weeks?', '$20', ['$9', '$5', '$40'], '5 × 4 = 20.'],
    ['What is a savings goal?', 'An amount you plan to save for something', ['A soccer goal', 'A bill', 'A loan'], 'Goals give saving a purpose.']])],
  'fin.investing': [bank('fin.investing', [
    ['What is a bond?', 'A loan you give to a government or company that pays interest', ['A piece of a company', 'A savings fee', 'A tax'], 'Bonds are usually lower risk than stocks.']])],
  'think.systems': [bank('think.systems', [
    ['If a town loses its only grocery store, what might happen?', 'People travel farther for food and spend more', ['Nothing', 'Food gets cheaper', 'More stores appear instantly'], 'One change ripples through a system.'],
    ['What is a “ripple effect”?', 'One change causing other changes', ['A wave pool', 'A type of fish', 'A song'], 'Like a stone in a pond.'],
    ['A factory hires 100 people. What else might grow nearby?', 'Cafés and shops serving the workers', ['Nothing', 'Fewer jobs', 'Less traffic'], 'Systems connect jobs and businesses.'],
    ['Why is it hard to fix one part of a system alone?', 'Parts are connected, so changes affect others', ['Systems don’t exist', 'It’s easy always', 'Parts never connect'], 'Think about connections.']])],
  'think.ethics': [bank('think.ethics', [
    ['You promised to help a friend move, but now you’re tired. What’s ethical?', 'Keep your promise or tell them honestly and help another time', ['Ignore their calls', 'Make up an excuse', 'Laugh'], 'Honesty and keeping promises build trust.'],
    ['You see a classmate cheating on a test. What should you think about?', 'Fairness to everyone and telling the teacher', ['Copying them', 'Nothing', 'Helping them cheat'], 'Fairness matters even when it’s awkward.']])],
  'think.strategy': [bank('think.strategy', [
    ['You want to win a race but your car is slow on corners. Best strategy?', 'Upgrade grip and practise cornering', ['Paint it red', 'Ignore corners', 'Quit'], 'Fix your weakest part.'],
    ['What is a SWOT analysis?', 'Listing strengths, weaknesses, opportunities and threats', ['A bug spray', 'A sport', 'A sandwich'], 'A simple strategy tool.']])],
  'think.uncertainty': [bank('think.uncertainty', [
    ['A forecast says 60% chance of rain. Should you bring an umbrella?', 'Yes, rain is more likely than not', ['No, it never rains at 60%', 'Only if it’s sunny', 'Bring two'], '60% means rain is likely.'],
    ['What is a “worst-case scenario”?', 'The worst thing that could reasonably happen', ['The best outcome', 'A movie', 'A promise'], 'Planning for it protects you.']])],
  'think.directions': [bank('think.directions', [
    ['Rosa says “Stock aisle 3, then aisle 1.” Which aisle first?', 'Aisle 3', ['Aisle 1', 'Aisle 2'], 'Follow the order given, not number order.']])],
  'think.risk': [bank('think.risk', [
    ['What is “reward” in risk and reward?', 'What you could gain', ['What you could lose', 'A punishment', 'A fee'], 'Weigh gain against loss.'],
    ['Wearing a seat belt is a way to…', 'Reduce risk', ['Increase risk', 'Win a prize', 'Go faster'], 'Small actions can cut big risks.']])],
  'think.evidence': [bank('think.evidence', [
    ['A chart has no labels or source. How strong is it as evidence?', 'Weak — you can’t check it', ['Strong', 'Perfect', 'Better than data'], 'Evidence must be checkable.'],
    ['Which is an example of a fair comparison?', 'Testing two cleaners on the same kind of stain', ['One on dirt, one on paint', 'Asking one person', 'Guessing'], 'Fair tests compare like with like.']])],
  'think.problem': [bank('think.problem', [
    ['Your bike chain keeps falling off. What’s a good first check?', 'Whether the chain is loose or worn', ['Paint the bike', 'Buy a new bike', 'Ignore it'], 'Check the most likely cause first.']])],
  'think.longterm': [bank('think.longterm', [
    ['Reading for 20 minutes every day for a year adds up to about…', '120 hours of reading', ['2 hours', '20 minutes', '1 day'], '20 × 365 = 7,300 minutes ≈ 120 hours. Small habits compound.'],
    ['Which choice builds your future career?', 'Taking a free skills course', ['Skipping work', 'Ignoring feedback', 'Quitting without a plan'], 'Learning opens doors.']])],
  'think.persuasion': [bank('think.persuasion', [
    ['“Doctors recommend…” with no doctor named is…', 'A vague appeal to authority', ['Strong evidence', 'A law', 'A fact you can check'], 'Ask: which doctors? What evidence?'],
    ['Free trial that auto-charges later is a tactic to…', 'Get you to pay without noticing', ['Help you save', 'Give you gifts', 'Teach you'], 'Read the fine print and set reminders.']])],
  'think.negotiate': [bank('think.negotiate', [
    ['What is a “compromise”?', 'Both sides give a little to agree', ['One side wins everything', 'No agreement', 'A fight'], 'Compromise finds the middle.'],
    ['Why prepare facts before asking for a raise?', 'Evidence of your work makes a stronger case', ['To scare the boss', 'It doesn’t help', 'To fill time'], 'Show value with facts.']])],
  'sci.observe': [bank('sci.observe', [
    ['Which tool measures how heavy something is?', 'A scale', ['A ruler', 'A thermometer', 'A clock'], 'Use the right tool for each measurement.'],
    ['Which is the best way to observe a bird without scaring it?', 'Watch quietly from a distance with binoculars', ['Chase it', 'Shout', 'Throw things'], 'Careful observation doesn’t disturb what you study.']])],
  'sci.method': [bank('sci.method', [
    ['In a plant-and-light test, what is the variable you change?', 'The amount of light', ['The plant type', 'The water', 'The pot size'], 'Change one variable; measure the result.'],
    ['What is a conclusion?', 'What the results tell you about your question', ['The first step', 'A guess before testing', 'The materials list'], 'Conclusions come from evidence.']])],
  'sci.nutrition': [bank('sci.nutrition', [
    ['Which snack has the least added sugar?', 'An apple', ['A candy bar', 'A soda', 'A frosted donut'], 'Whole fruit has natural sugar plus fiber.'],
    ['Why is breakfast helpful?', 'It gives energy to start the day', ['It’s not', 'It makes you sleepy forever', 'Only on weekends'], 'Food is fuel.']])],
  'sci.body': [bank('sci.body', [
    ['What do muscles do?', 'Move your body', ['Pump air', 'Think', 'Digest food'], 'Muscles pull on bones to move you.'],
    ['What carries messages between your brain and body?', 'Nerves', ['Bones', 'Hair', 'Teeth'], 'Nerves send signals fast.']])],
  'sci.friction': [bank('sci.friction', [
    ['Why do people put sand on icy sidewalks?', 'Sand adds friction so you don’t slip', ['To melt ice instantly', 'For color', 'To make it slippery'], 'Rough sand gives grip.'],
    ['Air resistance is a kind of…', 'Friction from air', ['Gravity', 'Magnetism', 'Heat'], 'Air pushes against moving things.'],
    ['Why do swimmers wear smooth swimsuits?', 'Less friction (drag) with the water', ['More friction', 'To stay warm only', 'For fashion only'], 'Smooth surfaces move through water more easily.']])],
  'sci.energy': [bank('sci.energy', [
    ['A solar panel turns sunlight into…', 'Electricity', ['Water', 'Wind', 'Food'], 'Solar panels convert light energy.'],
    ['Why does a battery run down faster with the screen at full brightness?', 'A brighter screen uses more energy', ['Brightness is free', 'Batteries hate light', 'It doesn’t'], 'More power used = faster drain.']])],
  'sci.machines': [bank('sci.machines', [
    ['A doorknob is which simple machine?', 'A wheel and axle', ['A wedge', 'A pulley', 'A ramp'], 'Turning the large knob turns the small axle.'],
    ['Why do wheelchair ramps zig-zag?', 'A longer path makes the slope gentler', ['To look nice', 'To be faster', 'No reason'], 'Longer ramps need less force.']])],
  'sci.heat': [bank('sci.heat', [
    ['Why does a metal spoon in hot soup get hot?', 'Metal conducts heat', ['Soup is magic', 'Spoons make heat', 'It doesn’t'], 'Heat moves through conductors.'],
    ['Steam can burn you because…', 'It’s hotter than boiling water', ['It’s cold', 'It’s just air', 'It isn’t dangerous'], 'Steam carries a lot of heat.']])],
  'sci.materials': [bank('sci.materials', [
    ['Which is the best material for a rope?', 'Strong, flexible fibers like nylon', ['Glass', 'Clay', 'Paper'], 'Ropes must bend and hold weight.'],
    ['Why are tires made of rubber?', 'Rubber grips the road and absorbs bumps', ['Rubber is shiny', 'Rubber is heavy', 'Rubber is cheap only'], 'Choose materials for their properties.']])],
  'sci.forces': [bank('sci.forces', [
    ['A ball rolls farther on a smooth floor than on carpet. Why?', 'Carpet has more friction', ['Carpet has less gravity', 'The ball is tired', 'Smooth floors push balls'], 'Friction slows motion.'],
    ['Why do you lean forward when pushing a heavy cart?', 'To push with more force', ['To look tired', 'It’s a rule', 'No reason'], 'Body position changes force.']])],
  'sci.circuits': [bank('sci.circuits', [
    ['In a parallel circuit, if one bulb breaks…', 'The others stay lit', ['All go out', 'All get brighter', 'It explodes'], 'Parallel circuits have more than one path.'],
    ['Why should you never poke things into outlets?', 'You could get a dangerous shock', ['It breaks the TV', 'It’s fine', 'It charges you'], 'Outlets carry strong electricity.']])],
  'sci.ecosystems': [bank('sci.ecosystems', [
    ['Wolves return to a park and eat more deer. What might happen to plants?', 'More plants grow back', ['Plants disappear', 'Nothing', 'Plants turn into deer'], 'Changes ripple through food webs.'],
    ['What is a habitat?', 'The natural home of a living thing', ['A habit', 'A zoo only', 'A house'], 'Habitats provide food, water and shelter.']])],
  'sci.design': [bank('sci.design', [
    ['How do engineers decide which design is best?', 'Test each one against the goals', ['Pick the prettiest', 'Flip a coin', 'Ask Jax'], 'Data from tests guides choices.'],
    ['Why sketch ideas before building?', 'It’s cheap and fast to explore options', ['Sketches are required by law', 'To waste time', 'Building is never needed'], 'Plan before spending materials.'],
    ['What is a “trade-off” in design?', 'Gaining one thing by giving up another', ['A free upgrade', 'A broken part', 'A sale'], 'Lighter may mean weaker; designers balance.']])],
  'sci.systems': [bank('sci.systems', [
    ['In the human body, which systems work together to deliver oxygen?', 'The lungs and the heart with blood vessels', ['Bones and hair', 'Skin and nails', 'Teeth and tongue'], 'Respiratory + circulatory systems team up.'],
    ['A traffic jam on one road makes others busier. This shows…', 'Parts of a system are connected', ['Roads are independent', 'Cars are slow', 'Nothing'], 'Changes spread across connections.'],
    ['What does an ecosystem, a city and a car have in common?', 'They’re all systems of connected parts', ['They’re all alive', 'They’re all made of metal', 'Nothing'], 'Systems thinking applies everywhere.']])],
  'sci.health': [bank('sci.health', [
    ['What is a good reason to see a doctor for a cough?', 'It lasts more than a couple of weeks or you can’t breathe well', ['It lasted one second', 'You sneezed once', 'You’re bored'], 'Long or serious symptoms need checking.'],
    ['Why wash hands before touching a wound?', 'To keep germs out', ['To make it heal slower', 'No reason', 'To make it hurt'], 'Clean hands prevent infection.']])],
  'sci.innovation': [bank('sci.innovation', [
    ['What does “iterate” mean in invention?', 'Improve a design step by step through testing', ['Give up', 'Copy someone', 'Build once'], 'Each version gets better.'],
    ['Many inventions start by asking…', '“What problem do people have?”', ['“What’s the coolest gadget?”', '“How can I be famous?”', '“What’s easiest?”'], 'Needs drive useful inventions.']])],
  'sci.ethics': [bank('sci.ethics', [
    ['Why do scientists get permission before studying people?', 'People have the right to choose', ['It’s faster', 'It’s not needed', 'For fun'], 'Consent respects people.'],
    ['A study’s results could help a company sell more. What should readers check?', 'Who paid for the study', ['The font', 'The cover color', 'Nothing'], 'Funding can create bias.']])],
  'hl.medicine': [bank('hl.medicine', [
    ['What should you do if you feel sick after taking a medicine?', 'Tell a trusted adult right away', ['Take more', 'Hide it', 'Ignore it'], 'Side effects should be reported.']])],
  'tech.design': [bank('tech.design', [
    ['Why do good apps use big buttons on phones?', 'Fingers need large targets to tap', ['Big is always ugly', 'To slow users', 'No reason'], 'Design for how people really use devices.']])],
};
