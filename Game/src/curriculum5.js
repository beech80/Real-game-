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
    [['Thank you', 'for your help!'], 'What is the note saying?', 'Thank you for your help', ['Please help me right now', 'Go away and let me rest', 'See you soon at the shop'], 'Read word by word: Thank, you, for, your, help.'],
    [['Dinner at 6'], 'When is dinner?', '6', ['8', '5', '9'], 'Numbers look the same in cursive and print.'],
    [['Love, Mom'], 'Who wrote the note?', 'Mom', ['Dad', 'Rosa', 'Sam'], 'The name after “Love,” is who wrote it.'],
    [['Park at 3pm', 'bring a ball'], 'What should you bring?', 'A ball', ['A bike', 'A book', 'Lunch'], 'The second line tells you what to bring.'],
    [['Closed on', 'Sunday'], 'When is it closed?', 'Sunday', ['Monday', 'Saturday', 'Friday'], 'Capital S starts Sunday.']])],
  'write.proposal': [bank('write.proposal', [
    ['Which is a clear “next step” to end a proposal?', 'Approve a 2-week trial starting May 1.', ['Think about it and let me know.', 'Maybe we can try this someday.', 'Whatever works best for you.'], 'End with a specific action and date.'],
    ['Which timeline is clearest?', 'Week 1: buy supplies. Week 2: open. Week 4: review sales.', ['Soon: buy supplies, then open the stand.', 'Later on, after we get ready, we open.', 'When ready, we will start and see.'], 'Clear timelines give dates or weeks.'],
    ['Who should a proposal be written for?', 'The person who decides, using what they care about', ['Yourself, so you can explain what you want', 'Anyone who might read it someday', 'Your friends, so they can give you ideas'], 'Know your reader: what problem do they need solved?'],
    ['Which benefit is strongest for a store manager?', 'The plan could raise weekend sales about 10%', ['It would be fun for the staff', 'I really like this new plan', 'Other stores might try it too'], 'Benefits the reader cares about, with numbers.']])],
  'write.analytical': [bank('write.analytical', [
    ['Which sentence explains a cause?', 'Fewer people rode the bus because fares went up $1.', ['The bus is blue and has 40 seats.', 'Bus fares went up $1 last month.', 'Many people ride the bus each day.'], '“Because” links cause to effect.'],
    ['Which sentence draws a conclusion from evidence?', 'Since sales doubled on rainy days, weather affects soup sales.', ['Soup is hot, so people like it on cold, rainy days.', 'It rained four days this month, more than last month.', 'We sold 30 bowls of soup on Monday and 60 on Tuesday.'], 'A conclusion follows from the evidence.'],
    ['Which word helps connect evidence to a point?', '“Therefore”', ['“Blue”', '“Sandwich”', '“Hello”'], 'Connecting words: therefore, because, which means, as a result.'],
    ['What is the difference between describing and analyzing?', 'Analyzing explains why or how; describing says what', ['They’re the same, just with different words', 'Describing is longer and has more details', 'Analyzing uses pictures and charts instead'], 'Description tells what; analysis tells why.']])],
  'write.research': [bank('write.research', [
    ['Which is a good note from a source?', 'City Clinic, 2026: flu cases fell 20% after free check-ups.', ['clinic report, flu cases fell a lot', 'something about free check-ups helping', '20% (I think it was about the flu)'], 'Notes should record the fact and where it came from.'],
    ['What is a quotation?', 'Someone’s exact words, in quotation marks, with credit', ['Your own idea, written in your words', 'A short summary of what a source said', 'A guess about what someone meant'], 'Quote exactly and say who said it.'],
    ['Which is paraphrasing?', 'Putting a source’s idea in your own words, with credit', ['Copying word for word without credit', 'Making up facts', 'Ignoring sources'], 'Paraphrase and still credit the source.'],
    ['Why use more than one source?', 'To check facts and see different views', ['To make the report longer', 'Because teachers say to use ten', 'One good source is always enough'], 'Several sources make research stronger.']])],
  'write.argument': [bank('write.argument', [
    ['Which is the best evidence for “Schools should start later”?', 'Studies show teens learn better with more sleep', ['I hate getting up early in the morning', 'Everyone at school says it should', 'It just feels right to most students'], 'Use research, not feelings.'],
    ['What is a rebuttal?', 'Your answer to the other side’s argument', ['The first sentence of an argument', 'A quote from an expert you trust', 'The title at the top of the essay'], 'Rebuttals show you considered other views.'],
    ['Which ending is strongest for an argument?', 'A clear restatement of the claim and a call to action', ['A fun fact the reader may not know', 'A joke about the people who disagree', 'A new topic to think about next time'], 'Close by reminding the reader what to do and why.'],
    ['Which is a logical fallacy?', '“Everyone is doing it, so it must be right.”', ['“Data shows a 20% drop in crashes.”', '“Two separate studies agree on this.”', '“The law says drivers must stop here.”'], 'Popularity isn’t proof (bandwagon fallacy).']])],
  'write.messages': [bank('write.messages', [
    ['Which message is best to cancel plans with a friend?', 'Hi Sam, I’m sorry, I can’t make it today. Can we try Saturday?', ['no sorry cant come today maybe another time', 'Can’t make it. Something came up. Bye.', 'nevermind about today, just forget it lol'], 'Say sorry, explain briefly and suggest another time.'],
    ['Which message gives all the needed details?', 'Pick-up is at 3:30 at the library’s front door.', ['Pick me up later, okay? Thanks!', 'Come get me after school today.', 'You know where. See you then!'], 'Who, what, when, where.'],
    ['Why reread a message before sending it?', 'To catch mistakes and check the tone', ['To make the message longer', 'It doesn’t matter, just send it', 'To decide if you should delete it'], 'Reading it again helps you catch mistakes.'],
    ['Which emoji use is best in a message to your boss?', 'None or very few', ['Ten emojis', 'Only emojis', 'All caps with emojis'], 'Keep work messages polite and simple.']])],
  'write.resume': [bank('write.resume', [
    ['Which belongs at the top of a résumé?', 'Your name and how to contact you', ['Your favorite foods and hobbies', 'A fun joke to get attention', 'A photo of you and your pet'], 'Employers need to reach you.'],
    ['Should a résumé include lies to look better?', 'No, always be truthful', ['Yes, a few', 'Only small ones', 'Everyone does'], 'Lies can cost you the job later.'],
    ['Which résumé line is best for a babysitting job?', 'Cared for two children ages 4 and 7 every weekend for a year', ['Watched some kids for a while when I was free', 'Did babysitting on weekends for some families', 'Good with kids and fun to be around, very nice'], 'Specific details and time show experience.']])],
  'write.report': [bank('write.report', [
    ['Which title fits a report?', 'Weekend Bread Sales: Findings and Recommendations', ['Some Stuff About the Bread We Sold This Weekend', 'Bread!!! The Best Weekend Ever at the Bakery', 'Hi, This Is My Report on What Happened'], 'Report titles say what the report covers.'],
    ['Which is the most objective sentence for a report?', 'Sales rose 12% in March.', ['Sales were awesome!', 'I think sales were nice.', 'Sales felt good.'], 'Reports use measurable facts.'],
    ['Why include a chart in a report?', 'To show data clearly at a glance', ['To fill space', 'To decorate', 'Charts are required always'], 'Visuals help readers see patterns.']])],
  'write.persuasive': [bank('write.persuasive', [
    ['Who is the audience of a letter asking the mayor for a crosswalk?', 'The mayor', ['Your friend', 'Yourself', 'A pet'], 'Write with your audience’s concerns in mind.'],
    ['Which opening grabs attention best?', 'Every morning, 200 kids cross Oak Street with no crosswalk.', ['Hi, my name is Nova and I live here.', 'This is a letter about a crosswalk.', 'I am writing to you about Oak Street.'], 'A striking fact pulls readers in.'],
    ['Which is an emotional appeal used fairly?', 'Imagine your own child crossing that busy street.', ['You’re a terrible person if you disagree.', 'Only fools say no.', 'Do it or else.'], 'Fair appeals invite empathy without insults.']])],
  'write.bizplan': [bank('write.bizplan', [
    ['What is a “target customer”?', 'The main group of people you want to sell to', ['Anyone at all who has money', 'The other shops that sell the same thing', 'The landlord who rents you the space'], 'Knowing your customer shapes your plan.'],
    ['Which is a startup cost?', 'Buying the coffee cart', ['Monthly profit', 'A customer’s tip', 'Next year’s sales'], 'Startup costs come before you open.'],
    ['Why include a competitor section?', 'To explain how you’re different and better', ['To praise rivals so you seem friendly', 'To copy what the rivals already do', 'It’s not needed if your idea is good'], 'Know your competition.']])],
  'write.paragraph': [bank('write.paragraph', [
    ['Which is the best closing sentence for a paragraph about saving money?', 'That’s why saving a little each week makes a big difference.', ['I like cats, and my cat likes to sleep a lot.', 'Money is green and comes in coins and bills.', 'The end. Thank you for reading my paragraph.'], 'Closings restate the main idea.'],
    ['How many details should support a topic sentence?', 'Usually two or three', ['Zero', 'Fifty', 'Exactly one hundred'], 'Enough to support, not overwhelm.'],
    ['Which transition word shows the next detail?', 'Also', ['Banana', 'Never', 'Blue'], 'Transitions: also, next, another, finally.']])],
  'write.email': [bank('write.email', [
    ['Before sending an important email, you should…', 'Proofread it and check the recipient', ['Send it fast', 'Add ten exclamation marks', 'Write in all caps'], 'Check spelling, tone and who it goes to.'],
    ['What does “CC” on an email do?', 'Sends a copy to someone else', ['Deletes the email after reading', 'Marks the email as urgent', 'Adds color to the email text'], 'CC keeps others informed.']])],
  'write.professional': [bank('write.professional', [
    ['Which sentence is most professional?', 'I apologize for the delay; your order will ship tomorrow.', ['Sorry lol it’s late, it’ll get there.', 'Not my fault, the truck was late.', 'Chill, your order is coming soon.'], 'Professional = polite, clear, responsible.'],
    ['How should you reply to an upset customer’s message?', 'Calmly, apologize and offer a solution', ['Argue that it was not your fault', 'Ignore it until they calm down', 'Reply in all caps so they notice'], 'Calm and helpful wins trust.']])],
  'write.homophones': [bank('write.homophones', [
    ['Choose the right word: “___ going to love this game!”', 'You’re', ['Your'], 'You’re = you are.'],
    ['Choose the right word: “Is this ___ jacket?”', 'your', ['you’re'], 'Your shows it belongs to you.'],
    ['Choose the right word: “The dog wagged ___ tail.”', 'its', ['it’s'], 'Its = belongs to it. It’s = it is.']])],
  'write.commas': [bank('write.commas', [
    ['Which is correct?', 'After lunch, we went to the park.', ['After lunch we, went to the park.', 'After, lunch we went to the park.'], 'Put a comma after an opening phrase.']])],
  'read.summarize': [bank('read.summarize', [
    ['What should a summary leave out?', 'Small, unimportant details', ['The main idea of the text', 'The key events in order', 'Who the text is about'], 'Summaries keep the big ideas only.'],
    ['How long should a summary be compared with the original?', 'Much shorter', ['Longer', 'Exactly the same', 'Twice as long'], 'A summary condenses.']])],
  'read.bias': [bank('read.bias', [
    ['Which headline is most neutral?', 'City Council Votes 5–4 to Raise Bus Fares', ['Greedy Council Robs Riders!', 'Heroes Save Buses!', 'Outrageous Fare Hike Shocks All!'], 'Neutral headlines report facts without loaded words.'],
    ['A charity ad shows only sad pictures. What should you ask?', 'What the full facts are and how money is used', ['Nothing, since charities are good', 'Whether to give everything you have now', 'Whether to stop giving to all charities'], 'Emotion can be fair, but check the facts.'],
    ['How can you spot bias in your own thinking?', 'Look for good evidence against what you believe', ['Only read what agrees with you', 'Never think about it', 'Ask Jax'], 'Checking the other side fights bias.']])],
  'read.sources': [bank('read.sources', [
    ['Which is a red flag for a source?', 'No author, no date and lots of exclamation marks', ['A clear author and a recent date', 'Links to studies that it cites', 'A college or university website'], 'Missing basics and hype are warning signs.'],
    ['A source agrees with three others from different experts. This makes it…', 'More trustworthy', ['Less trustworthy', 'Definitely false', 'Irrelevant'], 'Independent agreement builds confidence.'],
    ['Which is usually more reliable for local news?', 'An established local newspaper', ['An anonymous rumor account', 'A chain message', 'A pop-up ad'], 'Accountable sources with editors are more reliable.']])],
  'read.research': [bank('read.research', [
    ['Why write down where each fact came from?', 'So you can credit and recheck it later', ['To make your notes look messy', 'There is no real reason to', 'So you can hide where it came from'], 'Track sources as you go.'],
    ['Your sources don’t answer your question. What now?', 'Refine your question or search different sources', ['Make up an answer that sounds right', 'Quit and pick a new topic', 'Copy the first website you find'], 'Research often loops back.'],
    ['Which conclusion is careful?', '“The evidence suggests…, but more data would help.”', ['“This proves everything forever.”', '“I’m 100% sure.”', '“Everyone agrees.”'], 'Careful conclusions match the strength of the evidence.']])],
  'read.technical': [bank('read.technical', [
    ['A recipe says 350°F. Your oven is in °C. What should you do?', 'Convert it (about 175°C)', ['Set the oven to 350°C', 'Guess a little lower', 'Skip the baking part'], 'Units matter: 350°C would burn the food.']])],
  'read.evidence': [bank('read.evidence', [
    ['Which is the strongest kind of evidence for a claim about a park?', 'Visitor counts from the city', ['A rumor from a neighbor', 'A guess from a friend', 'A feeling that it is busy'], 'Measured data is strong evidence.'],
    ['Where should evidence come in a written answer?', 'Right after the point it supports', ['At random, anywhere it fits', 'Only in the title at the top', 'At the very end, all together'], 'Point, then proof.']])],
  'read.story': [bank('read.story', [
    ['What is the “plot” of a story?', 'The events that happen, in order', ['The title of the book', 'The person who wrote it', 'The picture on the cover'], 'Plot = what happens.'],
    ['What is the “theme” of a story?', 'The lesson or big idea', ['The setting', 'The cover color', 'The first word'], 'The theme is the message, like “kindness matters”.']])],
  'curs.documents': [note('curs.documents', [
    [['Invoice #204', 'Total due: $86.40', 'Due: June 10'], 'When is the payment due?', 'June 10', ['June 4', 'June 20', 'July 10'], 'Find the word “Due” and read the date after it.']])],
  'fin.saving': [bank('fin.saving', [
    ['You save $5 a week. How much after 4 weeks?', '$20', ['$9', '$5', '$40'], '5 × 4 = 20.'],
    ['What is a savings goal?', 'An amount you plan to save for something', ['A goal in a soccer game', 'A bill you must pay soon', 'Money you borrow from a bank'], 'Goals give saving a purpose.']])],
  'fin.investing': [bank('fin.investing', [
    ['What is a bond?', 'A loan you give to a government or company that pays interest', ['A piece of a company you own a share of', 'A fee a bank charges to keep your savings', 'A tax you pay on money you have invested'], 'Bonds are usually lower risk than stocks.']])],
  'think.systems': [bank('think.systems', [
    ['If a town loses its only grocery store, what might happen?', 'People travel farther for food and spend more', ['Nothing changes for the people who live there', 'Food gets cheaper because there is less to buy', 'New stores open the very next day to replace it'], 'One change ripples through a system.'],
    ['What is a “ripple effect”?', 'One change causing other changes', ['A wave pool at a water park', 'A type of fish in a pond', 'A song that repeats a lot'], 'Like a stone in a pond.'],
    ['A factory hires 100 people. What else might grow nearby?', 'Cafés and shops serving the workers', ['Nothing else, just the factory', 'Fewer jobs for people nearby', 'Less traffic on the roads'], 'Systems connect jobs and businesses.'],
    ['Why is it hard to fix one part of a system alone?', 'Parts are connected, so changes affect others', ['Systems don’t really exist in real life', 'It is always easy to fix just one part', 'The parts never connect to each other'], 'Think about connections.']])],
  'think.ethics': [bank('think.ethics', [
    ['You promised to help a friend move, but now you’re tired. What’s ethical?', 'Keep your promise or tell them honestly and help another time', ['Ignore their calls and hope they find someone else', 'Make up an excuse so their feelings are not hurt', 'Go, but complain the whole time so they know'], 'Honesty and keeping promises build trust.'],
    ['You see a classmate cheating on a test. What should you think about?', 'Fairness to everyone and telling the teacher', ['Copying them so your grade is fair too', 'Nothing, since it is not your business', 'Helping them so they do not get caught'], 'Fairness matters even when it’s awkward.']])],
  'think.strategy': [bank('think.strategy', [
    ['You want to win a race but your car is slow on corners. Best strategy?', 'Upgrade grip and practise cornering', ['Paint it red so it looks faster', 'Ignore the corners and go faster', 'Quit and wait for a new car'], 'Fix your weakest part.'],
    ['What is a SWOT analysis?', 'Listing strengths, weaknesses, opportunities and threats', ['A list of goals, plans and dates for the next year', 'A test that measures how fast and well you work', 'A chart that compares sales and costs each month'], 'A simple strategy tool.']])],
  'think.uncertainty': [bank('think.uncertainty', [
    ['A forecast says 60% chance of rain. Should you bring an umbrella?', 'Yes, rain is more likely than not', ['No, it never rains at 60%', 'Only if it’s sunny', 'Bring two'], '60% means rain is likely.'],
    ['What is a “worst-case scenario”?', 'The worst thing that could reasonably happen', ['The best thing that could happen', 'A scary movie about the future', 'A promise that nothing will go wrong'], 'Planning for it protects you.']])],
  'think.directions': [bank('think.directions', [
    ['Rosa says “Stock aisle 3, then aisle 1.” Which aisle first?', 'Aisle 3', ['Aisle 1', 'Aisle 2'], 'Follow the order given, not number order.']])],
  'think.risk': [bank('think.risk', [
    ['What is “reward” in risk and reward?', 'What you could gain', ['What you could lose', 'A punishment', 'A fee'], 'Weigh gain against loss.'],
    ['Wearing a seat belt is a way to…', 'Reduce risk', ['Increase risk', 'Win a prize', 'Go faster'], 'Small actions can cut big risks.']])],
  'think.evidence': [bank('think.evidence', [
    ['A chart has no labels or source. How strong is it as evidence?', 'Weak — you can’t check it', ['Strong', 'Perfect', 'Better than data'], 'Evidence must be checkable.'],
    ['Which is an example of a fair comparison?', 'Testing two cleaners on the same kind of stain', ['Testing one cleaner on dirt, one on paint', 'Asking one person which they like best', 'Guessing which one works from the bottle'], 'Fair tests compare like with like.']])],
  'think.problem': [bank('think.problem', [
    ['Your bike chain keeps falling off. What’s a good first check?', 'Whether the chain is loose or worn', ['Paint the bike a new color', 'Buy a whole new bike', 'Ignore it and keep riding'], 'Check the most likely cause first.']])],
  'think.longterm': [bank('think.longterm', [
    ['Reading for 20 minutes every day for a year adds up to about…', '120 hours of reading', ['2 hours of reading', '20 hours of reading', '365 hours of reading'], '20 × 365 = 7,300 minutes ≈ 120 hours. Small habits compound.'],
    ['Which choice builds your future career?', 'Taking a free skills course', ['Skipping work', 'Ignoring feedback', 'Quitting without a plan'], 'Learning opens doors.']])],
  'think.persuasion': [bank('think.persuasion', [
    ['“Doctors recommend…” with no doctor named is…', 'A vague appeal to authority', ['Strong evidence', 'A law', 'A fact you can check'], 'Ask: which doctors? What evidence?'],
    ['Free trial that auto-charges later is a tactic to…', 'Get you to pay without noticing', ['Help you save money', 'Give you free gifts', 'Teach you about the product'], 'Read the fine print and set reminders.']])],
  'think.negotiate': [bank('think.negotiate', [
    ['What is a “compromise”?', 'Both sides give a little to agree', ['One side wins everything', 'No agreement', 'A fight'], 'Compromise finds the middle.'],
    ['Why prepare facts before asking for a raise?', 'Evidence of your work makes a stronger case', ['To scare the boss into saying yes', 'It doesn’t help, bosses decide anyway', 'To make the meeting take longer'], 'Show value with facts.']])],
  'sci.observe': [bank('sci.observe', [
    ['Which tool measures how heavy something is?', 'A scale', ['A ruler', 'A thermometer', 'A clock'], 'Use the right tool for each measurement.'],
    ['Which is the best way to observe a bird without scaring it?', 'Watch quietly from a distance with binoculars', ['Run up close to get a good look', 'Call out to it so it looks at you', 'Toss some food right at it'], 'Careful observation doesn’t disturb what you study.']])],
  'sci.method': [bank('sci.method', [
    ['In a plant-and-light test, what is the variable you change?', 'The amount of light', ['The plant type', 'The water', 'The pot size'], 'Change one variable; measure the result.'],
    ['What is a conclusion?', 'What the results tell you about your question', ['The first step you do when you start a test', 'A guess you make before you begin testing', 'The list of materials you used in the test'], 'Conclusions come from evidence.']])],
  'sci.nutrition': [bank('sci.nutrition', [
    ['Which snack has the least added sugar?', 'An apple', ['A candy bar', 'A soda', 'A frosted donut'], 'Whole fruit has natural sugar plus fiber.'],
    ['Why is breakfast helpful?', 'It gives energy to start the day', ['It’s not', 'It makes you sleepy forever', 'Only on weekends'], 'Food is fuel.']])],
  'sci.body': [bank('sci.body', [
    ['What do muscles do?', 'Move your body', ['Pump air', 'Think', 'Digest food'], 'Muscles pull on bones to move you.'],
    ['What carries messages between your brain and body?', 'Nerves', ['Bones', 'Hair', 'Teeth'], 'Nerves send signals fast.']])],
  'sci.friction': [bank('sci.friction', [
    ['Why do people put sand on icy sidewalks?', 'Sand adds friction so you don’t slip', ['To melt the ice right away', 'To add color to the sidewalk', 'To make the ice more slippery'], 'Rough sand gives grip.'],
    ['Air resistance is a kind of…', 'Friction from air', ['Gravity', 'Magnetism', 'Heat'], 'Air pushes against moving things.'],
    ['Why do swimmers wear smooth swimsuits?', 'Less friction (drag) with the water', ['More friction to swim faster', 'To stay warm in cold water only', 'Only to look good in the race'], 'Smooth surfaces move through water more easily.']])],
  'sci.energy': [bank('sci.energy', [
    ['A solar panel turns sunlight into…', 'Electricity', ['Water', 'Wind', 'Food'], 'Solar panels convert light energy.'],
    ['Why does a battery run down faster with the screen at full brightness?', 'A brighter screen uses more energy', ['Brightness doesn’t use any power', 'Light makes batteries go bad', 'It doesn’t, the battery just ages'], 'More power used = faster drain.']])],
  'sci.machines': [bank('sci.machines', [
    ['A doorknob is which simple machine?', 'A wheel and axle', ['A wedge', 'A pulley', 'A ramp'], 'Turning the large knob turns the small axle.'],
    ['Why do wheelchair ramps zig-zag?', 'A longer path makes the slope gentler', ['To look nice from the street', 'To be faster than stairs', 'To fit more people at once'], 'Longer ramps need less force.']])],
  'sci.heat': [bank('sci.heat', [
    ['Why does a metal spoon in hot soup get hot?', 'Metal conducts heat', ['Soup is magic', 'Spoons make heat', 'It doesn’t'], 'Heat moves through conductors.'],
    ['Why can steam burn worse than boiling water at the same temperature?', 'When steam touches skin it turns back into water and releases extra heat', ['Steam is always much hotter than 100 °C, even at sea level', 'Steam has tiny bits of fire in it that burn the skin', 'It can’t: steam is harmless because it is only a gas'], 'Turning water into steam takes lots of energy. When steam condenses on your skin, it gives that energy back as heat.']])],
  'sci.materials': [bank('sci.materials', [
    ['Which is the best material for a rope?', 'Strong, flexible fibers like nylon', ['Glass, since it is smooth', 'Clay, since it is heavy', 'Paper, since it is light'], 'Ropes must bend and hold weight.'],
    ['Why are tires made of rubber?', 'Rubber grips the road and absorbs bumps', ['Rubber is shiny and looks new', 'Rubber is heavy and stays put', 'Rubber is the cheapest choice'], 'Choose materials for their properties.']])],
  'sci.forces': [bank('sci.forces', [
    ['A ball rolls farther on a smooth floor than on carpet. Why?', 'Carpet has more friction', ['Carpet has less gravity', 'The ball is tired', 'Smooth floors push balls'], 'Friction slows motion.'],
    ['Why is it easier to push a loaded cart than to carry the load?', 'You don’t hold up its weight, and rolling wheels have little friction', ['The cart makes the things inside it weigh less than before', 'The wheels add extra force to the load as you push it', 'It isn’t really easier, it only feels that way to you'], 'The floor holds up the cart’s weight, and rolling wheels slide much less than dragging, so you only push against a little friction.']])],
  'sci.circuits': [bank('sci.circuits', [
    ['In a parallel circuit, if one bulb breaks…', 'The others stay lit', ['All go out', 'All get brighter', 'It explodes'], 'Parallel circuits have more than one path.'],
    ['Why should you never poke things into outlets?', 'You could get a dangerous shock', ['It could break the TV', 'It is fine if you are fast', 'It could charge your phone'], 'Outlets carry strong electricity.']])],
  'sci.ecosystems': [bank('sci.ecosystems', [
    ['Wolves return to a park and eat more deer. What might happen to plants?', 'More plants grow back', ['Plants disappear', 'Nothing', 'Plants turn into deer'], 'Changes ripple through food webs.'],
    ['What is a habitat?', 'The natural home of a living thing', ['A habit that animals have', 'A zoo where animals live', 'A house that people build'], 'Habitats provide food, water and shelter.']])],
  'sci.design': [bank('sci.design', [
    ['How do engineers decide which design is best?', 'Test each one against the goals', ['Pick the one that looks the nicest', 'Flip a coin to choose one fairly', 'Pick the one that was built first'], 'Data from tests guides choices.'],
    ['Why sketch ideas before building?', 'It’s cheap and fast to explore options', ['Sketches are required by law', 'To waste time', 'Building is never needed'], 'Plan before spending materials.'],
    ['What is a “trade-off” in design?', 'Gaining one thing by giving up another', ['An upgrade that costs nothing', 'A part that broke in testing', 'A sale on parts and tools'], 'Lighter may mean weaker; designers balance.']])],
  'sci.systems': [bank('sci.systems', [
    ['In the human body, which systems work together to deliver oxygen?', 'The lungs and the heart with blood vessels', ['The bones and the hair on your head', 'The skin and the nails on your hands', 'The teeth and the tongue in your mouth'], 'Respiratory + circulatory systems team up.'],
    ['A traffic jam on one road makes others busier. This shows…', 'Parts of a system are connected', ['Roads are independent', 'Cars are slow', 'Nothing'], 'Changes spread across connections.'],
    ['What does an ecosystem, a city and a car have in common?', 'They’re all systems of connected parts', ['They’re all alive', 'They’re all made of metal', 'Nothing'], 'Systems thinking applies everywhere.']])],
  'sci.health': [bank('sci.health', [
    ['What is a good reason to see a doctor for a cough?', 'It lasts more than a couple of weeks or you can’t breathe well', ['It started this morning after you woke up', 'You coughed once or twice after laughing', 'You want to stay home and rest for a day'], 'Long or serious symptoms need checking.'],
    ['Why wash hands before touching a wound?', 'To keep germs out', ['To make it heal slower', 'No reason', 'To make it hurt'], 'Clean hands prevent infection.']])],
  'sci.innovation': [bank('sci.innovation', [
    ['What does “iterate” mean in invention?', 'Improve a design step by step through testing', ['Give up on a design after the first test', 'Copy the design that someone else made', 'Build the design once and sell it as is'], 'Each version gets better.'],
    ['Many inventions start by asking…', '“What problem do people have?”', ['“What’s the coolest gadget?”', '“How can I be famous?”', '“What’s easiest?”'], 'Needs drive useful inventions.']])],
  'sci.ethics': [bank('sci.ethics', [
    ['Why do scientists get permission before studying people?', 'People have the right to choose', ['It makes the study go faster', 'It is not really needed', 'It makes the study more fun'], 'Consent respects people.'],
    ['A study’s results could help a company sell more. What should readers check?', 'Who paid for the study', ['The font', 'The cover color', 'Nothing'], 'Funding can create bias.']])],
  'hl.medicine': [bank('hl.medicine', [
    ['What should you do if you feel sick after taking a medicine?', 'Tell a trusted adult right away', ['Take more to make it work', 'Hide it so no one worries', 'Ignore it and keep going'], 'Side effects should be reported.']])],
  'fin.taxes': [bank('fin.taxes', [
    ['What are taxes used for?', 'Public services like roads, schools and fire departments', ['Nothing, the money just gets saved by the bank', 'Parties, trips and gifts for elected leaders', 'Your own savings account for when you retire'], 'Taxes pay for things everyone shares.'],
    ['Sales tax is 8%. A shirt costs $25. How much is the tax?', '$2', ['$8', '$20', '$0.25'], '8% of $25 = 0.08 × 25 = $2.'],
    ['Why is your take-home pay less than what you earned?', 'Taxes are taken out first', ['The bank keeps a tip', 'It’s a mistake', 'Your boss forgot'], 'Income tax is withheld from each paycheck.'],
    ['What does insurance protect you from?', 'Big costs from accidents or illness', ['All of your bills each month', 'Paying any taxes you owe', 'Bad weather only'], 'You pay a little regularly to avoid a huge cost later.'],
    ['A $40 item has 5% sales tax. What is the total?', '$42', ['$45', '$40', '$40.05'], '5% of $40 = $2, so $40 + $2 = $42.'],
    ['You earned $3,000 at a summer job and tax was taken from each paycheck. Why might you file a tax return even if you don’t have to?', 'To get a refund of tax withheld but not owed', ['Filing a return always makes you owe more tax', 'Only adults over age 25 can file a return', 'Tax returns are only meant for businesses'], 'Under a certain income you may not have to file, but if tax was withheld, filing is how you get your refund.']])],
  'read.compare': [bank('read.compare', [
    ['Lease A: $600/month, pets OK. Lease B: $550/month, no pets. You have a cat. Which fits?', 'Lease A', ['Lease B', 'Neither', 'Both'], 'Compare the detail that matters most to you: pets.'],
    ['Phone plan A: $25 for 5 GB. Plan B: $30 for unlimited. You use about 3 GB. Which is the better deal?', 'Plan A', ['Plan B', 'They’re the same', 'Neither'], 'Plan A covers what you use for less.'],
    ['Store A sells 12 eggs for $3. Store B sells 6 eggs for $2. Which is cheaper per egg?', 'Store A', ['Store B', 'Same price'], 'A: $3 ÷ 12 = $0.25. B: $2 ÷ 6 ≈ $0.33.'],
    ['Job A: $15/hour, 10 minutes away. Job B: $16/hour, 90 minutes away by bus. What else should you compare?', 'Travel time and bus fare', ['Only the pay for each hour', 'The logo of each company', 'The job titles they use'], 'Line up every cost, including time.'],
    ['Two bikes: $120 with a helmet, or $110 without. A helmet costs $20. Which is the better deal?', 'The $120 bike with a helmet', ['The $110 bike without a helmet', 'They cost about the same'], '$110 + $20 = $130, which costs more than $120.']])],
  'tech.design': [bank('tech.design', [
    ['Why do good apps use big buttons on phones?', 'Fingers need large targets to tap', ['Big buttons are always ugly', 'To slow users down on purpose', 'So the app looks more modern'], 'Design for how people really use devices.']])],
};
