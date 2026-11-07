// REAL — bigger question banks (part 1: health & life skills, technology, social studies).
// Added after the teacher reviews so no skill runs out of fresh questions. Each row:
//   [question, answer, [wrong choices], explanation, dok, {wrong choice: feedback}]
// dok = depth of knowledge: 1 recall · 2 apply in a new situation · 3 reason / justify. Wrong choices are the
// mistakes real learners make, not jokes. These are ADDED to each skill's bank.
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const bank = (skill, rows) => rows.map(([q, a, w, why, dok, ww]) => () => ({ type: 'choice', skill, q, a, o: [a, ...w], why, dok, whyWrong: ww }));

export const BANKS_A = {
  // ================================================================ health & life skills
  'hl.hygiene': bank('hl.hygiene', [
    ['How long should you scrub your hands with soap?', 'About 20 seconds', ['1 second', 'Only if they look dirty', '5 minutes'], 'Twenty seconds (singing “Happy Birthday” twice) is long enough for soap to lift germs off.', 1],
    ['When is it most important to wash your hands?', 'Before eating and after using the bathroom', ['Only at bedtime', 'Only when they are sticky', 'After brushing your hair'], 'Germs spread to food and your mouth from your hands. Washing at these times stops that.', 1],
    ['You sneeze and have no tissue. What should you do?', 'Sneeze into your elbow', ['Sneeze into your hands', 'Sneeze toward a friend', 'Hold it in forever'], 'Your elbow keeps germs off your hands, which touch everything.', 2, { 'Sneeze into your hands': 'Then germs go on everything you touch next. Use your elbow.' }],
    ['Why do we brush our teeth twice a day?', 'To clean away germs and food that cause cavities', ['To make teeth grow', 'So we don’t need to eat', 'Only to make breath smell nice'], 'Plaque (germs and food) builds up and makes holes called cavities. Brushing removes it.', 1],
    ['A cut on your knee is dirty. What should you do first?', 'Wash it gently with clean water and soap', ['Cover it right away without cleaning', 'Put dirt on it to stop the blood', 'Ignore it'], 'Cleaning removes germs before you cover it with a bandage.', 2],
  ]),
  'hl.feelings': bank('hl.feelings', [
    ['Your friend’s fists are tight and their face is red. How might they feel?', 'Angry', ['Sleepy', 'Calm', 'Bored'], 'Tight fists and a red face are body clues for anger.', 2],
    ['You feel worried about a test. What could help?', 'Take slow breaths and tell someone how you feel', ['Keep it a secret and stay up all night', 'Skip school', 'Yell at your sister'], 'Calming your body and sharing feelings make worry smaller.', 2],
    ['Is it okay to feel sad sometimes?', 'Yes, everyone feels sad sometimes', ['No, you should always be happy', 'Only grown-ups feel sad', 'Only babies feel sad'], 'All feelings are normal. What matters is what you do with them.', 1],
    ['A classmate is sitting alone and looks sad. What is a kind thing to do?', 'Ask if they want to join you', ['Laugh at them', 'Ignore them', 'Tell everyone they are sad'], 'Noticing others’ feelings and including them is empathy.', 2],
  ]),
  'hl.safety': bank('hl.safety', [
    ['An adult you don’t know offers you a ride home. What should you do?', 'Say no and go tell a trusted adult', ['Get in if they seem nice', 'Ask them for candy first', 'Go if it’s raining'], 'Never go anywhere with someone you don’t know, even if they seem friendly.', 2],
    ['What should you do before crossing a street?', 'Stop, look left, right and left again', ['Run fast across', 'Look only one way', 'Cross between parked cars'], 'Cars can come from either side. Look both ways, then cross at a crosswalk if there is one.', 1],
    ['You find a pill on the floor. What should you do?', 'Don’t touch it; tell an adult', ['Taste it', 'Put it in your pocket', 'Give it to a friend'], 'Medicine can be dangerous. Only take it from a trusted adult.', 2],
    ['What number do you call in the U.S. for an emergency?', '911', ['411', '123', '0'], 'Call 911 when someone is hurt, in danger, or there is a fire.', 1],
    ['Why do you wear a helmet when riding a bike?', 'It protects your brain if you fall', ['It makes you go faster', 'It keeps your hair neat', 'It is only for racing'], 'Your brain can be hurt badly in a fall. A helmet absorbs the hit.', 1],
  ]),
  'hl.sleep': bank('hl.sleep', [
    ['About how much sleep do kids 6–12 need each night?', '9 to 12 hours', ['3 to 4 hours', 'Exactly 6 hours', 'Only on weekends'], 'Growing bodies and brains need lots of sleep, about 9–12 hours for this age.', 1],
    ['Which habit helps you fall asleep?', 'Putting screens away before bed', ['Playing video games in bed', 'Drinking soda at night', 'Going to bed at a different time every night'], 'Screen light and caffeine make it harder to sleep. A steady routine helps.', 2],
    ['Maya slept 5 hours and can’t focus in class. What is the most likely reason?', 'She didn’t get enough sleep', ['The class is too easy', 'She ate breakfast', 'She sat by the window'], 'Too little sleep makes it hard to pay attention and remember things.', 2],
    ['Why does sleep matter for learning?', 'Your brain stores what you learned while you sleep', ['It doesn’t matter', 'Sleep erases memories', 'Only naps help learning'], 'During sleep, the brain sorts and saves new memories.', 3],
  ]),
  'hl.exercise': bank('hl.exercise', [
    ['How much active play do kids need each day?', 'About 60 minutes', ['5 minutes', 'Only on gym days', '4 hours of running'], 'Health experts suggest an hour of activity a day for children.', 1],
    ['Which is a way to get exercise?', 'Riding a bike to the park', ['Watching a movie', 'Napping', 'Reading in bed'], 'Exercise means moving your body enough to breathe harder.', 1],
    ['Why does your heart beat faster when you run?', 'Your muscles need more oxygen, so your heart pumps more blood', ['Your heart is tired', 'Running scares your heart', 'It doesn’t'], 'Working muscles use more oxygen. The heart speeds up to deliver it.', 3],
    ['What should you do before hard exercise?', 'Warm up with easy movement', ['Eat a huge meal', 'Sit still for an hour', 'Hold your breath'], 'Warming up gets blood to your muscles and helps prevent injury.', 2],
  ]),
  'hl.kindness': bank('hl.kindness', [
    ['A friend drops their books. What could you do?', 'Help pick them up', ['Walk away fast', 'Laugh', 'Kick one'], 'Small helpful acts show kindness.', 1],
    ['Someone is being teased. What is a safe way to help?', 'Stand with them and tell a trusted adult', ['Join in the teasing', 'Post about it online', 'Pretend you didn’t see'], 'Being an upstander means supporting the person and getting help.', 2],
    ['You and a friend want different games. What is a fair solution?', 'Take turns choosing', ['The louder person wins', 'Stop being friends', 'Nobody plays'], 'Taking turns lets both people feel heard.', 2],
    ['Why does saying sorry matter after you hurt someone?', 'It shows you understand how they feel and want to fix it', ['It makes the problem disappear', 'It isn’t needed', 'Only if a grown-up asks'], 'Saying sorry and meaning it, then acting better, helps fix trust.', 3],
  ]),
  'hl.firstaid': bank('hl.firstaid', [
    ['Someone has a small burn from a hot pan. What should you do first?', 'Run cool (not icy) water over it for several minutes', ['Put butter on it', 'Put ice directly on it', 'Pop any blisters'], 'Cool running water lowers the heat. Butter and ice can make burns worse.', 2, { 'Put butter on it': 'An old myth. Butter traps heat. Use cool water.' }],
    ['A friend has a nosebleed. What helps?', 'Sit up, lean forward and pinch the soft part of the nose', ['Lie flat on your back', 'Tilt the head way back', 'Blow the nose hard'], 'Leaning forward keeps blood from going down the throat; pinching stops the bleeding.', 2, { 'Tilt the head way back': 'That sends blood down the throat. Lean forward instead.' }],
    ['When should you call 911?', 'Someone isn’t breathing, is badly hurt, or won’t wake up', ['Someone has a small scrape', 'You lost your homework', 'You have a hiccup'], '911 is for emergencies where life or safety is at risk.', 1],
    ['Why should you wear gloves when helping someone who is bleeding, if you can?', 'To protect both of you from germs in blood', ['Gloves stop bleeding', 'It is a rule for fun', 'So your hands stay warm'], 'Blood can carry germs. Gloves keep them from spreading.', 3],
  ]),
  'hl.foodsafety': bank('hl.foodsafety', [
    ['Raw chicken touched a cutting board. What should you do before cutting vegetables on it?', 'Wash it with hot soapy water first', ['Wipe it with a dry towel', 'Nothing; it looks clean', 'Rinse it with cold water only'], 'Raw meat germs can spread to food that won’t be cooked. Hot soapy water removes them.', 2],
    ['How long can cooked food sit out at room temperature?', 'No more than 2 hours', ['All day', 'A week', 'Until it smells bad'], 'Germs grow fast between 40°F and 140°F. Refrigerate within 2 hours.', 1],
    ['How cold should the fridge be?', '40°F (4°C) or below', ['70°F', '100°F', 'It doesn’t matter'], 'Cold slows germ growth. 40°F or colder keeps food safe.', 1],
    ['Why is a food thermometer better than checking the color of meat?', 'Color can look done when the inside isn’t hot enough', ['Thermometers make food taste better', 'Color is always correct', 'Thermometers cook the food'], 'Only the inside temperature tells you germs are killed.', 3],
  ]),
  'hl.stress': bank('hl.stress', [
    ['You have three tests this week and feel overwhelmed. What helps most?', 'Make a plan: break studying into small parts each day', ['Study all night before each test', 'Ignore it until the morning of', 'Quit all activities forever'], 'Breaking a big job into small steps makes it manageable and lowers stress.', 2],
    ['Which is a healthy way to calm down?', 'Deep breathing or a short walk', ['Yelling at someone', 'Drinking energy drinks', 'Staying up late on your phone'], 'Breathing and movement calm the body’s stress response.', 1],
    ['What is a sign that stress is getting too big?', 'You can’t sleep or eat normally for many days', ['You feel a little nervous before a game', 'You remember your homework', 'You laugh at a joke'], 'Some stress is normal. Long-lasting changes in sleep or eating mean it’s time to talk to someone.', 3],
    ['Who could you talk to about stress?', 'A parent, teacher, coach or school counselor', ['No one, ever', 'Only strangers online', 'Only your pet'], 'Trusted adults can help you make a plan.', 1],
  ]),
  'hl.habits': bank('hl.habits', [
    ['You want to read more. Which goal is clearest?', 'Read for 15 minutes before bed every night', ['Read more someday', 'Be a better reader', 'Read a lot'], 'A clear goal says exactly what, how much and when. You can check if you did it.', 2],
    ['It takes time to build a habit. What helps it stick?', 'Doing it at the same time each day and tracking it', ['Doing it once and stopping', 'Only doing it when you feel like it', 'Keeping no record'], 'Routines and tracking make habits automatic.', 2],
    ['You missed your goal two days in a row. What is the best next step?', 'Start again tomorrow and maybe make the goal smaller', ['Give up', 'Double the goal as punishment', 'Pretend it never mattered'], 'Setbacks are normal. Adjusting the goal keeps you moving.', 3],
  ]),
  'hl.medicine': bank('hl.medicine', [
    ['Why should you only take medicine from a trusted adult or as the label says?', 'The wrong amount can make you sick', ['More medicine always works faster', 'Labels are only suggestions', 'Medicine can’t hurt you'], 'Doses are measured for your age and weight. Too much can be dangerous.', 2],
    ['A label says “take 1 tablet every 6 hours.” You took one at 8 AM. When is the next dose?', '2 PM', ['9 AM', '10 AM', 'Right away'], '8 AM + 6 hours = 2 PM.', 2],
    ['Is it safe to take a friend’s prescription medicine if you feel the same?', 'No, prescriptions are only for the person they were made for', ['Yes, if you feel the same', 'Yes, if it’s a small amount', 'Only on weekends'], 'A doctor chose that medicine and dose for that person. It could be wrong or dangerous for you.', 3],
  ]),
  'hl.mental': bank('hl.mental', [
    ['What is a sign someone might need help with their mental health?', 'They stop doing things they used to enjoy for weeks', ['They have one bad day', 'They feel nervous before a speech', 'They laugh at a movie'], 'Long-lasting changes in mood, sleep or interests are signs to reach out for help.', 2],
    ['Asking for help with your feelings is…', 'A strong and healthy choice', ['A sign of weakness', 'Only for adults', 'Never needed'], 'Getting support, like seeing a counselor, is as normal as seeing a doctor for a cough.', 1],
    ['A friend tells you they’ve been hurting themselves. What should you do?', 'Tell a trusted adult right away, even if they ask you not to', ['Promise to keep the secret', 'Ignore it', 'Post it online'], 'Their safety is more important than a secret. Adults can get them help.', 3],
  ]),
  'hl.relationships': bank('hl.relationships', [
    ['Your friend keeps checking your phone and gets angry when you see other friends. This is…', 'A warning sign of an unhealthy, controlling relationship', ['Normal and caring', 'A sign they love you more', 'Something you should hide'], 'Healthy relationships include trust and freedom. Control and jealousy are red flags.', 2],
    ['What is a boundary?', 'A limit you set about what you’re okay with', ['A wall around your house', 'A rule only adults make', 'A type of game'], 'Boundaries protect your comfort and safety. Healthy friends respect them.', 1],
    ['Someone pressures you to share a private photo. What should you do?', 'Say no, don’t send it, and tell a trusted adult', ['Send it if they promise to delete it', 'Send it to stay friends', 'Ignore it but keep talking'], 'Once something is shared, you can’t control it. Pressure like this is not okay.', 3],
  ]),
  'hl.wellbeing': bank('hl.wellbeing', [
    ['Which combination supports long-term health best?', 'Regular sleep, movement, balanced food and social connection', ['Only exercise', 'Only diet', 'Only sleep'], 'Well-being comes from several habits working together.', 2],
    ['Why do doctors recommend regular checkups even when you feel fine?', 'Some problems show no symptoms early and are easier to treat when caught early', ['Doctors need customers', 'Checkups make you healthy by themselves', 'They aren’t needed'], 'Screening finds issues like high blood pressure before they cause harm.', 3],
  ]),
  'hl.publichealth': bank('hl.publichealth', [
    ['How do vaccines protect a whole community?', 'When most people are immune, a disease has trouble spreading, protecting people who can’t be vaccinated', ['They only protect the person who gets them', 'They make diseases stronger', 'They replace hand-washing'], 'This is called herd (community) immunity.', 3],
    ['Why do cities test drinking water?', 'To make sure it’s free of harmful germs and chemicals', ['To make it taste sweet', 'To use less water', 'It isn’t tested'], 'Clean water is one of the biggest public health achievements.', 2],
  ]),
  // ================================================================ technology
  'tech.basics': bank('tech.basics', [
    ['What does a keyboard let you do?', 'Type letters and numbers into the computer', ['Print paper', 'Hear sounds', 'Charge the battery'], 'A keyboard is an input device: it sends what you type to the computer.', 1],
    ['Which one is an output device?', 'A speaker', ['A mouse', 'A keyboard', 'A microphone'], 'Output devices show or play information from the computer. Speakers play sound.', 2],
    ['Your app froze. What is a good first step?', 'Close it and open it again', ['Hit the screen', 'Throw the device', 'Delete everything'], 'Restarting an app or device fixes many problems.', 2],
    ['What does saving a file do?', 'Keeps your work so you can open it later', ['Deletes it', 'Prints it', 'Sends it to everyone'], 'Saving stores your work. Save often so you don’t lose it.', 1],
  ]),
  'tech.sequence': bank('tech.sequence', [
    ['A robot needs to get a cup of water. What goes first?', 'Pick up the cup', ['Turn off the tap', 'Drink the water', 'Put the cup away'], 'Instructions must be in order: get the cup, fill it, then use it.', 2],
    ['Why must computer steps be in the right order?', 'Computers do exactly what you say, in the order you say it', ['Computers fix the order for you', 'Order doesn’t matter', 'Only the first step matters'], 'A computer follows steps exactly. Wrong order means a wrong result.', 3],
    ['Which is the correct order to brush your teeth?', 'Put paste on brush, brush, rinse', ['Rinse, brush, put paste on', 'Brush, put paste on, rinse', 'Put brush away, brush, rinse'], 'Each step depends on the step before.', 1],
  ]),
  'tech.safety': bank('tech.safety', [
    ['A game asks for your home address. What should you do?', 'Don’t share it; ask a trusted adult', ['Type it in so you can play', 'Share it if the game is fun', 'Give a friend’s address'], 'Your address is private information. Keep it safe online.', 2],
    ['Someone you only know online wants to meet. What should you do?', 'Tell a trusted adult and don’t meet them alone', ['Meet them at the park', 'Keep it a secret', 'Send them a photo first'], 'People online may not be who they say. Adults can help you stay safe.', 2],
    ['A message says “You won a prize! Click here.” What should you do?', 'Don’t click; show a trusted adult', ['Click it fast', 'Send it to friends', 'Type your password'], 'Messages like this are often tricks to steal information.', 2],
    ['What makes information private?', 'Things like your full name, address, school and passwords', ['Your favorite color', 'Your pet’s type', 'A picture of a tree'], 'Private information could help a stranger find or pretend to be you.', 1],
  ]),
  'tech.passwords': bank('tech.passwords', [
    ['Which password is strongest?', 'Purple!Tiger7Jumps', ['password', '123456', 'yourname'], 'Long passwords mixing words, numbers and symbols are hardest to guess.', 2],
    ['Who should know your password?', 'You and a parent or guardian', ['Your best friend', 'Everyone in class', 'Anyone who asks nicely'], 'Sharing a password lets others pretend to be you.', 1],
    ['Why shouldn’t you use the same password for everything?', 'If one site is hacked, all your accounts are at risk', ['It’s too easy to remember', 'Sites don’t allow it', 'It makes typing slower'], 'Different passwords limit the damage if one leaks. A password manager can help.', 3],
  ]),
  'tech.loops': bank('tech.loops', [
    ['A robot must take 5 steps forward. Which is shortest?', 'Repeat 5 times: step forward', ['Step, step, step, step, step', 'Step forward once', 'Repeat forever: step forward'], 'A loop repeats an instruction a set number of times.', 2],
    ['What does “repeat 3 times: clap, stomp” do?', 'Clap, stomp, clap, stomp, clap, stomp', ['Clap 3 times, then stomp 3 times', 'Clap, stomp', 'Clap 3 times'], 'The whole inside of the loop (clap, stomp) repeats 3 times.', 2, { 'Clap 3 times, then stomp 3 times': 'The loop repeats both steps together, in order, each time.' }],
    ['Why do programmers use loops?', 'To repeat steps without writing them again and again', ['To make programs longer', 'To stop programs', 'Loops are only for games'], 'Loops make code shorter and easier to change.', 3],
  ]),
  'tech.search': bank('tech.search', [
    ['You want facts about frogs for a report. Which search is best?', 'frog life cycle facts for kids', ['frogs', 'I like frogs a lot what do they do', 'green'], 'Specific keywords find more useful results.', 2],
    ['How can you tell if a website is reliable?', 'Check who wrote it, when, and if other good sources agree', ['It has lots of pictures', 'It is the first result', 'It uses big letters'], 'Check the author, the date, and whether other good sources agree.', 3],
    ['Search results marked “Ad” or “Sponsored” are…', 'Paid spots, not always the best answer', ['Always the most trusted', 'Written by teachers', 'Hidden results'], 'Companies pay to appear first. Look past ads.', 2],
  ]),
  'tech.citizenship': bank('tech.citizenship', [
    ['You see a mean comment about a classmate online. What is a good choice?', 'Don’t share it; report it and tell a trusted adult', ['Like it', 'Add a meaner comment', 'Forward it to friends'], 'Spreading hurtful posts makes it worse. Reporting helps stop it.', 2],
    ['Is it okay to use any picture you find online in your project?', 'Only if you have permission or it’s free to use, and you give credit', ['Yes, everything online is free', 'Yes, if you change the color', 'Only if nobody notices'], 'Creators own their work. Use licensed images and credit them.', 3],
    ['What is your digital footprint?', 'The trail of things you post and do online', ['A footprint on a screen', 'Your shoe size', 'A computer game'], 'What you post can stay online for a long time.', 1],
  ]),
  'tech.conditionals': bank('tech.conditionals', [
    ['IF it is raining THEN take an umbrella. It is sunny. What happens?', 'No umbrella is taken', ['An umbrella is taken', 'It starts raining', 'The program stops'], 'The action only happens when the condition is true.', 2],
    ['A game says: IF score ≥ 10 THEN “You win!” ELSE “Try again.” Score is 10. What shows?', 'You win!', ['Try again.', 'Nothing', 'Both messages'], '10 ≥ 10 is true, so the THEN part runs.', 2, { 'Try again.': '≥ means greater than OR equal. 10 is equal to 10.' }],
    ['Why do programs need conditionals?', 'To make decisions and do different things in different situations', ['To repeat steps', 'To store numbers', 'To draw pictures'], 'Conditionals let programs respond to what is happening.', 3],
  ]),
  'tech.debug': bank('tech.debug', [
    ['A program should add 2 + 3 but shows 23. What is the likely bug?', 'The numbers are treated as text and joined', ['The computer can’t add', 'The screen is broken', '2 + 3 is 23'], 'Joining “2” and “3” as text gives “23”. Convert them to numbers first.', 3],
    ['What is the first step in debugging?', 'Find exactly where the program goes wrong', ['Delete all the code', 'Restart the internet', 'Add more code everywhere'], 'Narrowing down where it breaks makes the bug easier to fix.', 2],
    ['A robot turns left when it should turn right. What should you check?', 'The turn instruction in the program', ['The robot’s color', 'The room lights', 'The robot’s name'], 'Check the step that controls the wrong behavior.', 2],
  ]),
  'tech.variables': bank('tech.variables', [
    ['score = 5, then score = score + 3. What is score now?', '8', ['5', '3', '53'], 'score + 3 = 5 + 3 = 8, and that new value is stored in score.', 2],
    ['What is a variable?', 'A named place to store a value that can change', ['A type of computer', 'A mistake in code', 'A loop'], 'Variables hold information like a score or a name.', 1],
    ['lives = 3. Each hit does lives = lives − 1. After 2 hits, lives is…', '1', ['3', '2', '0'], '3 − 1 = 2, then 2 − 1 = 1.', 2],
  ]),
  'tech.privacy': bank('tech.privacy', [
    ['Why do many free apps collect your data?', 'To sell targeted ads, which is how they make money', ['To protect you', 'Because the law requires it', 'They never do'], 'If you don’t pay for a product, your data or attention is often the product.', 3],
    ['Which setting protects your privacy most?', 'Turning off location sharing when not needed', ['Making every post public', 'Using your full name as your username', 'Accepting all permissions'], 'Limiting what apps can see reduces what can be collected or leaked.', 2],
    ['What is two-step verification?', 'A second check, like a code sent to your phone, after your password', ['Typing your password twice', 'Using two passwords on paper', 'Logging in twice a day'], 'It makes it much harder for someone else to get into your account.', 1],
  ]),
  'tech.internet': bank('tech.internet', [
    ['How does information travel across the internet?', 'It is broken into small packets that travel separately and are put back together', ['As one big file through a single wire', 'By satellite only', 'It doesn’t travel'], 'Packets can take different paths and are reassembled at the destination.', 2],
    ['What does a URL tell your browser?', 'The address of the web page to load', ['Your password', 'How fast your Wi-Fi is', 'The color of the page'], 'A URL (like a street address) points to a page on a server.', 1],
    ['Why can a website load slowly when many people visit at once?', 'The server has to handle many requests at the same time', ['The internet gets tired', 'Websites only allow one visitor', 'Your screen is too small'], 'Each visitor sends requests. Too many can overload a server.', 3],
  ]),
  'tech.ai': bank('tech.ai', [
    ['An AI chatbot gives you a fact for your report. What should you do?', 'Check it in a reliable source before using it', ['Use it; AI is always right', 'Copy it without checking', 'Ask the AI to promise it’s true'], 'AI can make up confident-sounding mistakes. Verify important facts.', 3],
    ['How does a photo app learn to recognize cats?', 'It is trained on many labeled pictures of cats', ['It is born knowing cats', 'A person draws every cat', 'It guesses randomly forever'], 'Machine learning finds patterns in many examples.', 2],
    ['Why can AI be unfair?', 'If its training data is unbalanced, it can repeat those biases', ['AI has feelings', 'AI never makes mistakes', 'Computers prefer some people'], 'AI learns from data. Biased data leads to biased results.', 3],
  ]),
  'tech.design': bank('tech.design', [
    ['You’re designing an app for older adults. What should you test first?', 'Whether they can read and use it easily', ['Which color you like', 'How many ads to add', 'Whether it works for you'], 'Good design starts with the real users’ needs.', 2],
    ['Why add captions to videos in an app?', 'So people who are deaf or in a noisy place can follow along', ['To make files bigger', 'Captions slow videos down', 'Only for fun'], 'Accessible design includes more people.', 3],
    ['Users keep tapping the wrong button. What does that tell a designer?', 'The design is confusing and should be improved', ['The users are wrong', 'Nothing', 'Add more buttons'], 'Repeated mistakes point to a design problem, not a user problem.', 3],
  ]),
  // ================================================================ social studies
  'soc.community': bank('soc.community', [
    ['Who helps people who are sick?', 'Doctors and nurses', ['Bus drivers', 'Mail carriers', 'Bakers'], 'Doctors and nurses care for people’s health.', 1],
    ['Who would you ask for a library book?', 'A librarian', ['A firefighter', 'A dentist', 'A farmer'], 'Librarians help people find books and information.', 1],
    ['Why does a community need many kinds of workers?', 'Each job meets a different need, like food, safety and learning', ['So everyone has the same job', 'Workers like crowds', 'It doesn’t'], 'Communities depend on many people doing different jobs.', 3],
    ['There is a fire at a house. Who should come?', 'Firefighters', ['Teachers', 'Chefs', 'Librarians'], 'Firefighters put out fires and rescue people.', 1],
    ['A road has a big pothole. Who in the community usually fixes it?', 'City road workers (public works)', ['The mail carrier', 'The school nurse', 'A store cashier'], 'Cities pay public works crews, with taxes, to fix roads.', 2],
  ]),
  'soc.rules': bank('soc.rules', [
    ['Why do we raise our hands in class?', 'So everyone gets a turn to talk and be heard', ['To stretch', 'To make noise', 'Because hands get tired'], 'This rule keeps talking fair and orderly.', 2],
    ['What could happen if there were no traffic lights?', 'More crashes, because drivers wouldn’t know when to go', ['Cars would drive slower', 'Nothing would change', 'Roads would disappear'], 'Rules like traffic lights keep people safe.', 2],
    ['Who makes the laws for a city?', 'The city council and mayor', ['Kids at recess', 'Store owners', 'Anyone who wants to'], 'Elected leaders make city laws.', 1],
    ['A rule says “no running in the hall.” What is the reason?', 'To keep people from crashing and getting hurt', ['Running is not allowed anywhere ever', 'To make hallways quiet only', 'There is no reason'], 'Good rules have reasons, usually safety or fairness.', 2],
  ]),
  'soc.maps': [
    ...bank('soc.maps', [
      ['On most maps, which direction is at the top?', 'North', ['South', 'East', 'West'], 'Maps usually put north at the top. A compass rose shows the directions.', 1],
      ['What does a map key (legend) show?', 'What the symbols on the map mean', ['The map’s price', 'Who drew the map', 'The weather'], 'The key explains symbols, like a tree for a park.', 1],
      ['If north is up, which way is east?', 'To the right', ['To the left', 'Down', 'Up'], 'North up, south down, east right, west left.', 2],
    ]),
    () => { const places = ['library', 'park', 'school', 'store']; const P = places.map((n) => [n, Math.floor(Math.random() * 5), Math.floor(Math.random() * 5)]); const [a, b] = [P[0], P[1]];
      if (a[1] === b[1] && a[2] === b[2]) b[1] = (b[1] + 2) % 5;
      const dir = a[2] < b[2] ? 'north' : a[2] > b[2] ? 'south' : a[1] < b[1] ? 'east' : 'west';
      return { type: 'choice', skill: 'soc.maps', dok: 2, v: { title: 'MAP (north is up)', lines: [`The ${a[0]} is at column ${a[1] + 1}, row ${5 - a[2]}.`, `The ${b[0]} is at column ${b[1] + 1}, row ${5 - b[2]}.`, 'Row 1 is the top row (north).'] },
        q: `${a[2] !== b[2] && a[1] !== b[1] ? 'First go up or down. ' : ''}Which way is the ${b[0]} from the ${a[0]}?`, a: dir, o: [dir, ...['north', 'south', 'east', 'west'].filter((d) => d !== dir).slice(0, 3)],
        why: a[2] !== b[2] ? `Row ${5 - b[2]} is ${b[2] > a[2] ? 'above' : 'below'} row ${5 - a[2]}, so you go ${dir}.` : `Same row: column ${b[1] + 1} is to the ${dir === 'east' ? 'right' : 'left'}, so you go ${dir}.` }; },
  ],
  'soc.geography': bank('soc.geography', [
    ['What is the largest ocean on Earth?', 'The Pacific Ocean', ['The Atlantic Ocean', 'The Indian Ocean', 'The Arctic Ocean'], 'The Pacific covers about a third of Earth’s surface.', 1],
    ['Which continent is the U.S. on?', 'North America', ['South America', 'Europe', 'Asia'], 'The U.S., Canada and Mexico are in North America.', 1],
    ['Why are many big cities built next to rivers or coasts?', 'Water gives drinking water, food and an easy way to trade goods', ['Rivers are pretty', 'Land near water is cheaper', 'Cities need to be cold'], 'Early towns grew where water made life and trade easier.', 3],
    ['How many continents are there?', 'Seven', ['Five', 'Nine', 'Three'], 'Africa, Antarctica, Asia, Australia, Europe, North America and South America.', 1],
  ]),
  'soc.cultures': bank('soc.cultures', [
    ['What is a tradition?', 'Something a family or group does again and again over time, like a holiday meal', ['A rule at school', 'A type of weather', 'Something done only once'], 'Traditions are passed down and help people remember their history.', 1],
    ['Why is it good to learn about other cultures?', 'It helps us understand and respect people different from us', ['So we can copy them exactly', 'It isn’t useful', 'To prove one culture is best'], 'Learning about others builds respect and community.', 3],
    ['Lunar New Year, Diwali and Thanksgiving are all…', 'Celebrations that are important to different cultures', ['The same holiday', 'Types of food', 'U.S. laws'], 'Many cultures have special days with food, family and traditions.', 2],
  ]),
  'soc.government': bank('soc.government', [
    ['What are the three branches of the U.S. government?', 'Legislative, executive and judicial', ['Federal, state and city', 'President, governor and mayor', 'Police, fire and schools'], 'Congress makes laws, the President carries them out, and courts decide what they mean.', 1],
    ['Why does the government have three branches?', 'So no one branch gets too much power (checks and balances)', ['To make more jobs', 'Because three is lucky', 'So laws are made faster'], 'Each branch can limit the others.', 3],
    ['Who is the leader of a state government?', 'The governor', ['The mayor', 'The President', 'The principal'], 'Governors lead states; mayors lead cities.', 1],
  ]),
  'soc.rights': bank('soc.rights', [
    ['The First Amendment protects…', 'Freedom of speech, religion, press, assembly and petition', ['The right to drive at 12', 'Free video games', 'Only freedom of speech'], 'These five freedoms are in the First Amendment of the Bill of Rights.', 1],
    ['Which shows a responsibility that comes with rights?', 'Voting when you’re old enough', ['Ignoring laws you dislike', 'Never voting', 'Only caring about yourself'], 'Citizens have rights and responsibilities, like voting and obeying laws.', 2],
    ['Does freedom of speech mean you can say anything with no consequences?', 'No: it protects you from the government punishing your speech, with some limits like threats', ['Yes, anything at all', 'It means you must agree with everyone', 'It only applies to adults'], 'Freedom of speech limits government action. It doesn’t protect threats, and others may still respond.', 3],
  ]),
  'soc.economics': bank('soc.economics', [
    ['Lots of people want a new toy but there are only a few. What usually happens to the price?', 'It goes up', ['It goes down', 'It stays at zero', 'The toy disappears'], 'High demand and low supply push prices up.', 2],
    ['A farmer grows too many apples. What usually happens to apple prices?', 'They go down', ['They go up', 'They stay the same forever', 'Apples become free by law'], 'When supply is bigger than demand, prices fall.', 2],
    ['What is the difference between goods and services?', 'Goods are things you can touch; services are work someone does for you', ['They are the same', 'Goods are free', 'Services are only from the government'], 'A bike is a good; fixing the bike is a service.', 1],
  ]),
  'soc.timeline': bank('soc.timeline', [
    ['On a timeline, events on the left usually happened…', 'Earlier', ['Later', 'At the same time', 'Never'], 'Timelines usually go from earlier (left) to later (right).', 1],
    ['Which came first: the first airplane flight (1903) or the Moon landing (1969)?', 'The first airplane flight', ['The Moon landing', 'They were the same year', 'Neither happened'], '1903 is earlier than 1969.', 2],
    ['A decade is how many years?', '10', ['100', '1', '1,000'], 'A decade is 10 years; a century is 100.', 1],
  ]),
  'soc.history': bank('soc.history', [
    ['Why was the invention of the printing press (around 1450) a turning point?', 'Books became cheaper, so many more people could read and share ideas', ['It made paper disappear', 'It invented writing', 'Only kings could use it'], 'Spreading information faster changed science, religion and government.', 3],
    ['The civil rights movement worked to…', 'End segregation and secure equal rights for Black Americans', ['Build railroads', 'Explore space', 'Start the Olympics'], 'Leaders like Martin Luther King Jr. and Rosa Parks used peaceful protest to change laws.', 1],
    ['Why do historians look at more than one source about an event?', 'Different people saw it differently, so comparing gives a fuller picture', ['One source is always enough', 'To find the shortest one', 'Sources never disagree'], 'Comparing sources helps find what’s reliable.', 3],
  ]),
  'soc.sources': bank('soc.sources', [
    ['Which is a primary source about a 1900s factory?', 'A worker’s diary from 1905', ['A 2020 textbook chapter', 'A movie made last year', 'An encyclopedia summary'], 'Primary sources were made at the time by people who were there.', 2],
    ['A textbook explaining the American Revolution is a…', 'Secondary source', ['Primary source', 'Fiction book', 'Map key'], 'Secondary sources explain events using other sources, after the fact.', 1],
    ['Why might a soldier’s letter home leave out frightening details?', 'He might not want to worry his family', ['Letters had to be short by law', 'He didn’t see anything', 'Ink was expensive'], 'Thinking about why a source was made helps you judge what it tells and leaves out.', 3],
  ]),
  'soc.civics': bank('soc.civics', [
    ['How many senators does each U.S. state have?', '2', ['1', '10', 'It depends on population'], 'Every state has 2 senators. House seats depend on population.', 1],
    ['What does the Supreme Court do?', 'Decides if laws follow the Constitution', ['Makes all laws', 'Commands the army', 'Collects taxes'], 'The judicial branch interprets laws and the Constitution.', 1],
    ['Why might a small state like Wyoming have the same number of senators as California?', 'The Senate gives every state equal voice; the House is based on population', ['Wyoming has more people', 'It’s a mistake', 'Senators are chosen randomly'], 'This compromise balanced large and small states.', 3],
  ]),
  'soc.trade': bank('soc.trade', [
    ['Why do countries trade with each other?', 'Each can make some things more efficiently, so both can get more', ['Trade is required by law', 'To get rid of everything they make', 'Countries never trade'], 'Specializing and trading lets countries have more than they could make alone.', 3],
    ['What is a tariff?', 'A tax on goods brought in from another country', ['A free trade deal', 'A type of ship', 'A bank loan'], 'Tariffs make imported goods cost more.', 1],
    ['A tariff makes imported steel more expensive. Who might benefit?', 'Steel companies in the home country', ['Car makers that buy steel', 'Shoppers buying cars', 'Nobody'], 'Tariffs help some (domestic producers) and cost others (buyers).', 3],
  ]),
  'soc.policy': bank('soc.policy', [
    ['A city can build a new park or fix old roads with the same money. This is an example of…', 'A trade-off (opportunity cost)', ['A tariff', 'A tax refund', 'A free good'], 'Choosing one use of money means giving up another.', 2],
    ['Why do governments hold public hearings before big decisions?', 'To hear from people the decision will affect', ['To delay things for fun', 'Hearings are secret', 'To avoid voting'], 'Public input helps leaders understand trade-offs.', 3],
  ]),
  'soc.citizenship': bank('soc.citizenship', [
    ['Which is an example of active citizenship?', 'Volunteering to clean up a park', ['Never reading the news', 'Ignoring local problems', 'Littering'], 'Active citizens take part in improving their community.', 1],
    ['You want your town to add a crosswalk near school. What is an effective first step?', 'Collect facts, then write to or speak at a city council meeting', ['Paint one yourself', 'Complain online only', 'Do nothing'], 'Using evidence and official channels gets results.', 3],
  ]),
};
