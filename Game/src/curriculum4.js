// REAL — curriculum, part 4: more practice for science and for the newer subjects (social studies, health,
// technology), so every skill has many different questions. Same design rules as curriculum3.js.

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const ch = (skill, q, a, wrong, why, v) => ({ type: 'choice', skill, q, a, o: [a, ...wrong], why, v });
const num = (skill, q, a, why, v, opts = {}) => ({ type: 'number', skill, q, a, why, v, ...opts });
const bank = (skill, rows) => () => { const [q, a, w, why, v] = pick(rows); return ch(skill, q, a, w, why, v); };
const sorter = (skill, q, bins, pairs, why, n = 5) => () => ({ type: 'sort', skill, q, bins, items: shuffle(pairs).slice(0, n), why });
const orders = (skill, sets) => () => { const [q, items, why] = pick(sets); return { type: 'order', skill, q, items, why }; };

export const EXTRA_GEN2 = {
  // ================================================================ SCIENCE
  'sci.safety': [bank('sci.safety', [
    ['🔥 The pan catches fire on the stove. What is safest?', 'Turn off the heat and cover it with a lid', ['Throw water on it', 'Carry it outside', 'Blow on it'], 'Water spreads grease fires. A lid cuts off the air.'],
    ['🔌 What should you never do with a plug?', 'Touch it with wet hands', ['Hold it by the plug', 'Unplug it when done', 'Keep it dry'], 'Water and electricity together can shock you.'],
    ['🧴 You find an unlabeled bottle. What should you do?', 'Don’t smell or taste it; tell an adult', ['Drink it', 'Smell it closely', 'Mix it with soap'], 'Unknown chemicals can be dangerous.'],
    ['🔪 How should you pass scissors or a knife?', 'Handle first, point down', ['Point first', 'Throw it', 'Run with it'], 'Keep sharp points away from people.'],
    ['🦺 Why do builders wear hard hats?', 'To protect their heads from falling objects', ['To look cool', 'To stay warm', 'To carry tools'], 'Safety gear blocks hazards.'],
    ['🚨 What does a fire alarm mean?', 'Leave the building calmly by the nearest exit', ['Hide under a desk', 'Finish your work', 'Use the elevator'], 'Use stairs and exits, never elevators, in a fire.']])],
  'sci.animals': [bank('sci.animals', [
    ['🐱 A cat needs…', 'Food, water, rest and care', ['Only toys', 'Only a bed', 'Nothing'], 'All animals need food, water, shelter and care.'],
    ['🐶 Your dog is panting hard on a hot day. What does it need?', 'Shade and cool water', ['A long run', 'A sweater', 'A big meal'], 'Dogs cool off by panting; help with shade and water.'],
    ['🐟 Where does a fish need to live?', 'In clean water', ['In a dry box', 'In a tree', 'In sand'], 'Fish breathe oxygen from water through their gills.'],
    ['🐰 Which food is best for a rabbit?', 'Hay and leafy greens', ['Chocolate', 'Candy', 'Chips'], 'Rabbits eat plants; chocolate is toxic to many animals.'],
    ['Why do pets need exercise?', 'To stay healthy and happy', ['To get dirty', 'They don’t', 'To get lost'], 'Exercise keeps animal bodies and minds healthy.'],
    ['A pet is hiding and won’t eat for days. What should you do?', 'Take it to a vet', ['Ignore it', 'Give it candy', 'Yell at it'], 'Changes in eating can mean illness.']])],
  'sci.observe': [bank('sci.observe', [
    ['Which is an observation?', 'The leaf is yellow and dry', ['The tree is sad', 'Someone hurt the tree', 'Trees hate fall'], 'Observations describe what you see; they don’t guess causes.'],
    ['What tool helps you observe tiny things?', 'A magnifying glass', ['A hammer', 'A spoon', 'A whistle'], 'Magnifiers make small details bigger.'],
    ['Which senses can you use to observe?', 'Sight, hearing, touch, smell (and taste only when safe)', ['Only sight', 'None', 'Guessing'], 'Scientists use their senses carefully and safely.'],
    ['Why write down what you see?', 'So you remember exactly what you saw', ['To waste paper', 'To make them up', 'Nobody does'], 'Records keep science honest.'],
    ['Which one uses a number to tell what you saw?', 'The plant grew 3 cm this week', ['The plant grew a lot', 'The plant looks nice', 'The plant is happy'], 'Numbers make observations precise.'],
    ['You see wet foot marks by the door. What do you know for sure?', 'There are wet footprints by the door', ['A dog came in', 'Sam spilled water', 'It is raining'], 'State what you see before explaining it.']])],
  'sci.method': [bank('sci.method', [
    ['You test whether plants grow better with music. What must stay the same?', 'Water, light, soil and plant type', ['Nothing', 'Only the music', 'Everything should change'], 'Change only the variable you’re testing (music).'],
    ['What is a hypothesis?', 'A testable guess about what will happen', ['A final answer', 'A fact from a book', 'A measurement'], 'Example: “If plants get more light, they will grow taller.”'],
    ['Why repeat an experiment several times?', 'To check results weren’t luck', ['To waste time', 'Once is always enough', 'To change the answer'], 'Repeating builds confidence.'],
    ['You test 3 paper airplanes. Which is the fair test?', 'Throw each from the same spot with the same force', ['Throw them in different rooms', 'Use different people', 'Throw one indoors and one outdoors'], 'Same conditions; only the design changes.'],
    ['Your result didn’t match your hypothesis. What now?', 'Record it honestly and think about why', ['Change the numbers', 'Hide it', 'Give up'], 'Unexpected results teach you something.']]),
    orders('sci.method', [['Put the steps of an experiment in order.', ['Ask a question', 'Make a hypothesis', 'Do a fair test', 'Record the results', 'Draw a conclusion'], 'Question → hypothesis → test → record → conclude.']])],
  'sci.nutrition': [bank('sci.nutrition', [
    ['Which drink is healthiest most of the time?', 'Water', ['Soda', 'Energy drink', 'Sweet tea'], 'Water hydrates without added sugar.'],
    ['Which food has the most protein?', 'Beans', ['Lettuce', 'Apple', 'Candy'], 'Beans, eggs, fish and meat are protein foods.'],
    ['Why eat fruits and vegetables?', 'They give vitamins, minerals and fiber', ['They’re only for decoration', 'They have no benefits', 'To get sleepy'], 'Colorful plants keep your body working.'],
    ['Which breakfast gives lasting energy?', 'Oatmeal with fruit', ['A candy bar', 'A soda', 'Nothing'], 'Whole grains and fruit release energy slowly.'],
    ['What does a food label’s “serving size” tell you?', 'How much the nutrition numbers are for', ['The price', 'The expiry date', 'The brand'], 'Eat two servings, get double the numbers.'],
    ['Which is a whole grain?', 'Brown rice', ['White sugar', 'Candy', 'Soda'], 'Whole grains keep the fiber-rich outer part.']])],
  'sci.body': [bank('sci.body', [
    ['❤️ What does the heart do?', 'Pumps blood around the body', ['Helps you see', 'Digests food', 'Holds you up'], 'The heart is a muscle that pumps blood.'],
    ['🫁 What do the lungs do?', 'Bring in air so your body gets oxygen', ['Pump blood', 'Make bones', 'Think'], 'Lungs take in oxygen and breathe out carbon dioxide.'],
    ['🧠 What controls the body and thinking?', 'The brain', ['The stomach', 'The knee', 'The skin'], 'The brain sends messages through the nerves.'],
    ['🦴 About how many bones does an adult have?', '206', ['20', '1,000', '6'], 'Babies have more; some fuse as we grow.'],
    ['Where does food go to be broken down?', 'The stomach and intestines', ['The lungs', 'The heart', 'The brain'], 'The digestive system turns food into energy.'],
    ['What protects the body from germs on the outside?', 'Skin', ['Hair only', 'Teeth', 'Nails'], 'Skin is the body’s first barrier.']])],
  'sci.friction': [bank('sci.friction', [
    ['Why do sneakers have bumpy soles?', 'More friction for better grip', ['To look nice', 'To be lighter', 'To be louder'], 'Bumps and rubber increase grip.'],
    ['Which surface has the least friction?', 'Ice', ['Carpet', 'Sandpaper', 'Grass'], 'Smooth, slippery surfaces have little friction.'],
    ['Why do you rub your hands together when cold?', 'Friction makes heat', ['To clean them', 'To make noise', 'No reason'], 'Rubbing turns motion into heat.'],
    ['Why do cars slide more on wet roads?', 'Water lowers friction between tires and road', ['Water makes cars heavier', 'Roads are shorter', 'Tires get bigger'], 'Less grip means longer stopping distances.'],
    ['Oil on a bike chain…', 'Reduces friction so it moves smoothly', ['Adds friction', 'Makes it rust', 'Stops the bike'], 'Lubricants reduce friction and wear.']])],
  'sci.energy': [bank('sci.energy', [
    ['Where does a phone get its energy?', 'From its battery', ['From the screen', 'From the case', 'From sound'], 'Batteries store chemical energy.'],
    ['What kind of energy does a moving car have?', 'Motion (kinetic) energy', ['No energy', 'Sound only', 'Cold energy'], 'Anything moving has kinetic energy.'],
    ['Where does food energy come from first?', 'The Sun, through plants', ['Refrigerators', 'Plates', 'Stores'], 'Plants capture sunlight; animals eat plants.'],
    ['Which is a renewable energy source?', 'Sunlight (solar)', ['Coal', 'Oil', 'Gasoline'], 'Renewable sources refill naturally.'],
    ['Turning off lights when you leave a room…', 'Saves energy and money', ['Wastes energy', 'Breaks the bulb', 'Does nothing'], 'Less use means less energy needed.'],
    ['A ball at the top of a hill has stored energy. What happens when it rolls down?', 'Stored energy changes into motion energy', ['Energy disappears', 'It gets heavier', 'Nothing'], 'Energy changes form; it isn’t lost.']])],
  'sci.machines': [bank('sci.machines', [
    ['Which simple machine is a seesaw?', 'A lever', ['A pulley', 'A wheel', 'A screw'], 'A lever pivots on a point (fulcrum).'],
    ['A flagpole uses which machine to raise the flag?', 'A pulley', ['A lever', 'A wedge', 'A ramp'], 'A pulley changes the direction of your pull.'],
    ['An axe blade is which simple machine?', 'A wedge', ['A pulley', 'A wheel and axle', 'A lever'], 'Wedges split things apart.'],
    ['Why is it easier to push a cart than carry its load?', 'Wheels reduce friction', ['Carts are magic', 'The load gets lighter', 'It isn’t easier'], 'Wheels and axles make moving loads easier.'],
    ['A screw is really…', 'A ramp wrapped around a pole', ['A pulley', 'A lever', 'A battery'], 'The thread is an inclined plane in a spiral.'],
    ['Where should you push a lever to lift a heavy rock most easily?', 'Far from the pivot point', ['Right at the pivot', 'Under the rock', 'Anywhere'], 'Longer lever arm = less effort.']])],
  'sci.heat': [bank('sci.heat', [
    ['Why do pot handles often have plastic or wood?', 'They don’t conduct heat well', ['They look nice', 'They are heavier', 'They melt'], 'Insulators slow heat from reaching your hand.'],
    ['What happens to butter in a hot pan?', 'It melts', ['It freezes', 'It grows', 'Nothing'], 'Heat changes solids to liquids.'],
    ['Why put leftovers in the fridge quickly?', 'Cold slows germ growth', ['To make them taste sweet', 'To heat them', 'No reason'], 'Germs grow fastest between 40°F and 140°F.'],
    ['Which material conducts heat best?', 'Metal', ['Wood', 'Plastic', 'Cloth'], 'Metals move heat quickly; that’s why pans are metal.'],
    ['Safe temperature for cooked ground beef is about…', '160°F', ['100°F', '120°F', '60°F'], 'Use a thermometer: ground beef 160°F, chicken 165°F.'],
    ['Why does a dark shirt feel hotter in the sun?', 'Dark colors absorb more light and heat', ['Dark shirts are thicker', 'It’s imaginary', 'Light colors absorb more'], 'Light colors reflect more sunlight.']])],
  'sci.materials': [bank('sci.materials', [
    ['Which material is best for a window?', 'Glass, because light passes through', ['Wood', 'Brick', 'Cardboard'], 'Transparent materials let light in.'],
    ['Why are raincoats made of plastic-like fabric?', 'It is waterproof', ['It’s heavy', 'It’s warm only', 'It’s shiny'], 'Waterproof materials keep you dry.'],
    ['Why are bridges often made of steel?', 'Steel is very strong', ['Steel is soft', 'Steel is light as paper', 'Steel melts in sun'], 'Strength matters for heavy loads.'],
    ['Which material is a good insulator for a winter jacket?', 'Wool or down', ['Metal', 'Glass', 'Paper'], 'Insulators trap warm air.'],
    ['Why are frying pans metal with plastic handles?', 'Metal heats food; plastic keeps hands cool', ['Both conduct the same', 'For color', 'Plastic is stronger'], 'Choose materials for each job.'],
    ['Which material would you recycle in the paper bin?', 'Cardboard', ['Glass', 'Metal can', 'Plastic bottle'], 'Sorting by material lets each be reused.']])],
  'sci.forces': [bank('sci.forces', [
    ['What force pulls things toward Earth?', 'Gravity', ['Friction', 'Magnetism', 'Wind'], 'Gravity pulls objects down.'],
    ['You push a box and it doesn’t move. Why?', 'Friction or its weight is stronger than your push', ['Forces don’t exist', 'Boxes can’t move', 'It’s magic'], 'A bigger push is needed to overcome resistance.'],
    ['Which is more stable?', 'A wide, low table', ['A tall, thin stool', 'A ball on a point', 'A pencil standing up'], 'A wide base and low weight resist tipping.'],
    ['When you kick a ball, what makes it stop eventually?', 'Friction and air resistance', ['Gravity only upward', 'Nothing', 'The ball gets tired'], 'Forces act against motion.'],
    ['Why do race cars have spoilers?', 'Air pushes down for more grip', ['For decoration', 'To slow them on straights only', 'To carry luggage'], 'Downforce increases tire grip.'],
    ['A heavier truck needs more…', 'Force to start and stop', ['Paint', 'Windows', 'Nothing'], 'More mass needs more force to change motion.']])],
  'sci.circuits': [bank('sci.circuits', [
    ['A bulb won’t light. The wire has a gap. Why?', 'The circuit isn’t a complete loop', ['The bulb is too bright', 'Batteries hate bulbs', 'Wires don’t matter'], 'Electricity needs a closed loop.'],
    ['What does a switch do?', 'Opens or closes the circuit', ['Makes electricity', 'Stores power', 'Cools the wires'], 'Off = open loop; on = closed loop.'],
    ['Which material lets electricity flow?', 'Copper wire', ['Rubber', 'Plastic', 'Wood'], 'Metals conduct electricity; rubber insulates.'],
    ['Why are wires covered in plastic?', 'To insulate them and keep people safe', ['For color only', 'To make them heavy', 'To conduct more'], 'Insulation prevents shocks and short circuits.'],
    ['Two bulbs in series: one breaks. What happens?', 'Both go out', ['The other gets brighter', 'Nothing', 'Both get brighter'], 'In series there’s one path; a break stops it all.'],
    ['What is the “load” in a circuit?', 'The thing that uses the power, like a bulb or motor', ['The battery', 'The switch', 'The wire'], 'Loads turn electricity into light, motion or heat.']])],
  'sci.health': [bank('sci.health', [
    ['A normal body temperature is about…', '98.6°F (37°C)', ['80°F', '110°F', '50°F'], 'A fever is a temperature well above normal.'],
    ['Someone is choking and can’t speak. What do you do?', 'Get an adult or call 911 right away', ['Give them water', 'Wait', 'Make them laugh'], 'Choking is an emergency.'],
    ['Why check your heart rate after exercise?', 'It shows how hard your heart is working', ['To count steps', 'To check the weather', 'No reason'], 'Heart rate rises with effort and falls with rest.'],
    ['A cut is red, swollen and hot after two days. This may be…', 'An infection; see a nurse or doctor', ['Healing perfectly', 'A bruise', 'Nothing'], 'Signs of infection need care.'],
    ['Why should you drink water during hot activities?', 'To replace water lost as sweat', ['To get heavier', 'It cools the air', 'No need'], 'Dehydration causes dizziness and tiredness.']])],
  'sci.design': [orders('sci.design', [
    ['Put the engineering design cycle in order.', ['Define the problem', 'Brainstorm ideas', 'Build a prototype', 'Test it', 'Improve and test again'], 'Engineers define, imagine, build, test and improve.'],
    ['Design a better lunchbox: put the steps in order.', ['Ask people what bugs them about lunchboxes', 'Sketch ideas', 'Build a simple model', 'Let people try it', 'Fix what didn’t work'], 'Start from users’ needs; test with them.']]),
    bank('sci.design', [['Your bridge model collapses in the test. What should engineers do?', 'Find where it failed and improve that part', ['Give up', 'Hide it', 'Build the same again'], 'Failures show what to improve.'], ['What is a prototype?', 'An early model to test an idea', ['The final product', 'A drawing only', 'A broken model'], 'Prototypes are built to be tested and improved.'], ['What are “constraints” in design?', 'Limits like budget, size, time and materials', ['Decorations', 'Extra features', 'Customers'], 'Good designs work within constraints.']])],
  'sci.ecosystems': [bank('sci.ecosystems', [
    ['What is a food chain?', 'Who eats whom, starting with plants', ['A restaurant', 'A grocery list', 'A necklace'], 'Sun → plant → plant-eater → meat-eater.'],
    ['If bees disappeared, what would happen to many plants?', 'They’d have fewer seeds and fruits', ['Nothing', 'They’d grow faster', 'They’d move'], 'Bees pollinate flowers.'],
    ['Which is a producer in an ecosystem?', 'Grass', ['A fox', 'A hawk', 'A mushroom eating dead leaves'], 'Producers make food from sunlight.'],
    ['Why are decomposers like worms important?', 'They break down dead things and return nutrients to soil', ['They eat living trees', 'They make plastic', 'They aren’t'], 'Decomposers recycle nutrients.'],
    ['Cutting down a forest could…', 'Remove homes for many animals', ['Make more animals', 'Change nothing', 'Create oceans'], 'Habitats support living things.'],
    ['How can people help ecosystems?', 'Reduce litter and protect habitats', ['Throw trash in rivers', 'Remove all plants', 'Nothing helps'], 'Small actions protect connected life.']])],
  'sci.innovation': [bank('sci.innovation', [
    ['Which invention combined a phone, camera and computer?', 'The smartphone', ['The bicycle', 'The kettle', 'The pencil'], 'Many innovations combine existing ideas.'],
    ['What is the best starting point for an invention?', 'A real problem people have', ['A cool gadget idea with no use', 'Copying a toy', 'Random parts'], 'Start from the need.'],
    ['Velcro was inspired by…', 'Burrs sticking to a dog’s fur', ['A spaceship', 'A shoe store', 'A math test'], 'Nature inspires many inventions.'],
    ['How can you protect an invention you created?', 'A patent', ['A recipe', 'A receipt', 'A ticket'], 'Patents protect inventors’ ideas for a time.'],
    ['Why do inventors build many versions?', 'Each test teaches them how to improve', ['They like waste', 'Rules require ten', 'They forget the first'], 'Iteration leads to better solutions.']])],
  'sci.systems': [bank('sci.systems', [
    ['In your body, which systems work together when you run?', 'Muscles, heart and lungs', ['Only your toes', 'Only your hair', 'Only your ears'], 'Body systems depend on each other.'],
    ['A city’s power goes out. What else is affected?', 'Traffic lights, fridges and phones', ['Nothing', 'Only lamps', 'Only TVs'], 'Systems are connected.'],
    ['In a car, if the engine overheats…', 'It loses power and can be damaged', ['It goes faster', 'Nothing happens', 'It gets lighter'], 'Parts affect each other in loops.'],
    ['What is a feedback loop?', 'When a result feeds back and changes the cause', ['A circle drawing', 'A type of road', 'A song'], 'Example: sweating cools you, which reduces sweating.']])],
  'sci.ethics': [bank('sci.ethics', [
    ['A scientist’s results don’t support their idea. What is honest?', 'Publish the real results', ['Change the data', 'Hide the study', 'Blame the equipment'], 'Honest science reports what happened.'],
    ['Why test medicines carefully before selling them?', 'To make sure they’re safe and work', ['To slow things down', 'For fun', 'It isn’t needed'], 'Safety comes first.'],
    ['An app collects users’ locations without asking. What’s the problem?', 'It violates privacy and consent', ['Nothing', 'It’s faster', 'It’s required'], 'People should know and agree to data use.'],
    ['Who should be thought about when designing new technology?', 'Everyone it could help or harm', ['Only the inventor', 'Only rich people', 'Nobody'], 'Responsible design considers all affected.'],
    ['Why share scientific data openly?', 'Others can check and build on it', ['To show off', 'It’s required to hide it', 'No reason'], 'Openness makes science stronger.']])],
  'sci.weather': [bank('sci.weather', [
    ['☀️ Which season is usually the hottest?', 'Summer', ['Winter', 'Spring', 'Fall'], 'Summer has the longest, warmest days.'],
    ['🌧️ What falls from clouds?', 'Rain, snow, sleet or hail', ['Sand', 'Leaves', 'Rocks'], 'All are forms of precipitation.'],
    ['🌬️ What tool shows wind direction?', 'A wind vane (weather vane)', ['A thermometer', 'A ruler', 'A scale'], 'The arrow points where the wind comes from.'],
    ['What is a forecast?', 'A prediction of the weather', ['Yesterday’s weather', 'A kind of cloud', 'A storm'], 'Forecasts use data to predict weather.']])],
  'sci.plants': [bank('sci.plants', [
    ['🌱 What do leaves do?', 'Use sunlight to make food for the plant', ['Hold the plant down', 'Make noise', 'Eat bugs'], 'Leaves capture sunlight (photosynthesis).'],
    ['🌸 Why do flowers have bright colors?', 'To attract bees and other pollinators', ['To scare birds', 'To stay warm', 'For no reason'], 'Pollinators help plants make seeds.'],
    ['What do plants release that we breathe?', 'Oxygen', ['Smoke', 'Carbon only', 'Sugar'], 'Plants take in carbon dioxide and give off oxygen.'],
    ['Which part becomes the fruit?', 'The flower', ['The root', 'The stem', 'The leaf'], 'After pollination, flowers grow into fruit with seeds.'],
    ['A plant in a dark closet turns pale. Why?', 'It isn’t getting sunlight', ['Too much light', 'It is cold', 'It is happy'], 'Plants need light to make food.']])],
  'sci.water': [bank('sci.water', [
    ['☁️ What are clouds made of?', 'Tiny water droplets or ice', ['Cotton', 'Smoke only', 'Sand'], 'Water vapor cools and condenses into droplets.'],
    ['Where does most of Earth’s water sit?', 'In the oceans', ['In clouds', 'In rivers', 'In ice cubes'], 'About 97% of Earth’s water is salty ocean water.'],
    ['What powers the water cycle?', 'Heat from the Sun', ['The Moon', 'Wind only', 'Fish'], 'Sunlight evaporates water.'],
    ['Rain soaking into the ground becomes…', 'Groundwater', ['Clouds instantly', 'Salt', 'Rock'], 'Some water collects underground.'],
    ['Why is saving water important?', 'Fresh water is limited', ['Water never runs out', 'It isn’t', 'To make puddles'], 'Only a small part of Earth’s water is fresh.']])],
  'sci.space': [bank('sci.space', [
    ['🌙 Why does the Moon look different through the month?', 'We see different amounts of its sunlit side', ['It changes size', 'Clouds cover it', 'It turns off'], 'These shapes are called phases.'],
    ['Why is it summer in some places and winter in others at the same time?', 'Earth is tilted', ['The Sun moves', 'The Moon blocks heat', 'Random'], 'The tilted side toward the Sun gets summer.'],
    ['What keeps the Moon orbiting Earth?', 'Gravity', ['Wind', 'Magnets', 'Strings'], 'Gravity holds moons and planets in orbit.'],
    ['About how long does the Moon take to circle Earth?', 'About a month', ['A day', 'A year', 'An hour'], 'That’s where the word “month” comes from.']])],
  'sci.planets': [bank('sci.planets', [
    ['Which planet do we live on?', 'Earth', ['Mars', 'Venus', 'Jupiter'], 'Earth is the third planet from the Sun.'],
    ['Which planet is the hottest?', 'Venus', ['Mercury', 'Mars', 'Neptune'], 'Venus’s thick clouds trap heat, making it hotter than Mercury.'],
    ['Which planet is farthest from the Sun?', 'Neptune', ['Saturn', 'Uranus', 'Mars'], 'The order ends: …Saturn, Uranus, Neptune.']])],
  'sci.magnets': [bank('sci.magnets', [
    ['How does a compass work?', 'Its magnetic needle points toward Earth’s north', ['It uses GPS', 'Wind moves it', 'Batteries'], 'Earth itself acts like a giant magnet.'],
    ['Will a magnet pick up a coin made of copper?', 'No, copper isn’t magnetic', ['Yes, always', 'Only on Tuesdays', 'Only big coins'], 'Most magnets attract iron, nickel and steel.'],
    ['Where is a bar magnet strongest?', 'At its poles (the ends)', ['In the middle', 'Equally everywhere', 'Nowhere'], 'Magnetic force is strongest at the poles.'],
    ['Fridge magnets stick because the door is…', 'Made of steel', ['Made of wood', 'Cold', 'Painted'], 'Steel contains iron, which magnets attract.'],
    ['What can pass through paper and still pull a paper clip?', 'A magnetic force', ['Light only', 'Glue', 'Sound'], 'Magnetism works through thin non-magnetic materials.']])],
  'sci.sound': [bank('sci.sound', [
    ['A drum makes a sound when…', 'Its skin vibrates', ['It gets warm', 'It is painted', 'It is quiet'], 'Vibrations create sound waves.'],
    ['Which travels faster: sound through air or light?', 'Light', ['Sound', 'They’re equal'], 'Light is about a million times faster.'],
    ['What is an echo?', 'Sound bouncing back from a surface', ['A new sound', 'A light', 'A song'], 'Hard surfaces reflect sound.'],
    ['Why can’t sound travel in space?', 'There’s no air to carry the vibrations', ['It’s too cold', 'It’s too bright', 'It can'], 'Sound needs a material to move through.']])],
  'sci.cells': [bank('sci.cells', [
    ['What do you need to see most cells?', 'A microscope', ['A telescope', 'Sunglasses', 'A ruler'], 'Most cells are too small to see with your eyes.'],
    ['What is the thin outer layer of every cell called?', 'The cell membrane', ['The wall of bricks', 'The shell', 'The skin'], 'The membrane controls what goes in and out.'],
    ['Which living thing is made of just one cell?', 'Bacteria', ['A tree', 'A dog', 'A person'], 'Single-celled organisms do everything in one cell.'],
    ['Cells that work together form…', 'Tissues and organs', ['Rocks', 'Planets', 'Clouds'], 'Cells → tissues → organs → systems.'],
    ['Why do cuts heal?', 'Cells divide to make new cells', ['Skin is glue', 'Bandages grow skin', 'They don’t'], 'Cell division repairs the body.']])],
  'sci.chem': [bank('sci.chem', [
    ['Mixing salt into water makes…', 'A solution (a mixture)', ['A new chemical', 'Ice', 'Gas'], 'The salt dissolves but is still salt; you can get it back by evaporating the water.'],
    ['Why does an iron nail rust outside?', 'Iron reacts with oxygen and water', ['It gets cold', 'Rain is red', 'Nails age'], 'Rust is a new substance from a reaction.'],
    ['Baking a cake is…', 'A chemical change', ['Just a mixture', 'Melting only', 'No change'], 'Heat makes new substances; you can’t un-bake it.'],
    ['How can you separate sand from water?', 'Pour it through a filter', ['Freeze it', 'Shake it', 'You can’t'], 'Mixtures can be separated physically.']])],
  // ================================================================ SOCIAL STUDIES
  'soc.rules': [bank('soc.rules', [
    ['Why do we raise hands in class?', 'So everyone gets a turn to speak', ['To stretch', 'To be loud', 'No reason'], 'Turn-taking rules are fair.'],
    ['What happens if a community has no rules?', 'It can become unsafe and unfair', ['Everyone is happier', 'Nothing changes', 'Things get cleaner'], 'Rules protect people.'],
    ['Who helps make sure laws are followed in a city?', 'Police and courts', ['Bakers', 'Musicians', 'Painters'], 'They uphold and decide on laws.'],
    ['A rule says “No running by the pool.” Why?', 'Wet floors are slippery and people can fall', ['Running is boring', 'To make the pool quiet', 'To save water'], 'Rules often prevent injuries.']])],
  'soc.maps': [bank('soc.maps', [
    ['What does a scale on a map show?', 'How map distance compares to real distance', ['The weight of the map', 'The weather', 'The price'], 'Example: 1 inch = 1 mile.'],
    ['Which is a map symbol for water?', 'Blue areas', ['Red dots', 'Black lines only', 'Stars'], 'Maps often show water in blue.'],
    ['You face south. What is behind you?', 'North', ['East', 'West', 'South'], 'North and south are opposites.']])],
  'soc.geography': [bank('soc.geography', [
    ['Which is the longest river in Africa?', 'The Nile', ['The Amazon', 'The Mississippi', 'The Thames'], 'The Nile flows north through northeast Africa to the Mediterranean Sea.'],
    ['Which continent is the United States on?', 'North America', ['South America', 'Europe', 'Asia'], 'The U.S., Canada and Mexico are in North America.'],
    ['What is the largest desert on Earth?', 'Antarctica (a cold desert); the Sahara is the largest hot desert', ['The Pacific', 'The Amazon', 'Greenland'], 'A desert is a place with very little rain or snow, hot or cold.']])],
  'soc.timeline': [bank('soc.timeline', [
    ['Which came first: cars or airplanes?', 'Cars', ['Airplanes', 'Same year'], 'Gas cars came in the 1880s; airplanes in 1903.'],
    ['On a timeline, which side usually shows earlier events?', 'The left', ['The right', 'The top', 'The middle'], 'Timelines read left (earlier) to right (later).']])],
  'soc.cultures': [bank('soc.cultures', [
    ['Which is part of a culture?', 'Its traditional foods and music', ['The weather only', 'Mountains', 'The ocean'], 'Culture is what people create and share.'],
    ['Why learn about other cultures?', 'To understand and respect people', ['To make fun', 'To copy everything', 'No reason'], 'Understanding builds friendships.'],
    ['Many cultures share stories passed down by talking. These are called…', 'Oral traditions', ['Text messages', 'Laws', 'Maps'], 'Stories passed by voice keep history alive.'],
    ['A family speaks two languages at home. That makes them…', 'Bilingual', ['Silent', 'Foreign forever', 'Confused'], 'Many people around the world speak more than one language.']])],
  'soc.government': [bank('soc.government', [
    ['What is the U.S. Constitution?', 'The plan for how the U.S. government works', ['A storybook', 'A map', 'A recipe'], 'It sets up the branches and protects rights.'],
    ['How many U.S. states are there?', '50', ['13', '48', '100'], 'There are 50 states; the first 13 were colonies.'],
    ['What does a city council do?', 'Makes local rules and decides city spending', ['Bakes bread', 'Runs the ocean', 'Teaches classes'], 'Local government handles parks, roads and more.']])],
  'soc.rights': [bank('soc.rights', [
    ['Freedom of speech means…', 'You can share your opinions without government punishment', ['You can say anything with no effects at all', 'Only leaders can speak', 'You must stay quiet'], 'It protects opinions, with limits like threats.'],
    ['Why is a fair trial a right?', 'So people are judged on evidence, not prejudice', ['To make trials longer', 'Because judges are bored', 'No reason'], 'Fair trials protect everyone.'],
    ['Respecting others’ rights is a…', 'Responsibility', ['Right', 'Law of physics', 'Hobby'], 'Rights come with responsibilities.']])],
  'soc.economics': [bank('soc.economics', [
    ['Goods are things you can touch. Which is a service?', 'A haircut', ['A bike', 'An apple', 'A book'], 'Services are actions people do for you.'],
    ['What do we call people who buy goods and services?', 'Consumers', ['Producers', 'Mayors', 'Teachers'], 'Producers make; consumers buy.'],
    ['Why might a business lower prices?', 'To sell more when demand is low', ['To lose customers', 'Because it’s raining', 'No reason'], 'Price responds to supply and demand.'],
    ['What is scarcity?', 'Not having enough of something for everyone who wants it', ['Having too much', 'A scary movie', 'Free stuff'], 'Scarcity forces choices.']])],
  'soc.history': [bank('soc.history', [
    ['Who invented the telephone (1876)?', 'Alexander Graham Bell', ['Thomas Edison', 'The Wright brothers', 'Isaac Newton'], 'Bell made the first practical telephone call.'],
    ['What changed when electric light spread in the late 1800s?', 'People could work and read safely after dark', ['Nothing', 'The sun went out', 'Candles became illegal'], 'Electric light changed homes and factories.'],
    ['The internet became widely used in the 1990s. One big change was…', 'People could share information instantly worldwide', ['Letters stopped forever', 'TV ended', 'No change'], 'It changed communication, work and learning.']])],
  'soc.sources': [bank('soc.sources', [
    ['Is a photo taken at the 1969 Moon landing a primary or secondary source?', 'Primary', ['Secondary'], 'It was made at the time of the event.'],
    ['Is your history textbook primary or secondary?', 'Secondary', ['Primary'], 'It explains events later, using other sources.'],
    ['Why might two primary sources disagree?', 'People saw the event from different points of view', ['One must be fake', 'History doesn’t happen', 'They never disagree'], 'Perspective shapes what people record.'],
    ['Which is the best way to understand a historical event?', 'Compare several sources', ['Read one website', 'Guess', 'Ask one friend'], 'Multiple sources give a fuller picture.']])],
  'soc.civics': [bank('soc.civics', [
    ['Who can vote in U.S. national elections?', 'Citizens 18 and older who are registered', ['Anyone of any age', 'Only mayors', 'Only people with cars'], 'Voting rules require citizenship, age 18+ and registration.'],
    ['What is a “candidate”?', 'A person running for office', ['A voter', 'A ballot box', 'A law'], 'Candidates ask for your vote.'],
    ['What is a veto?', 'When a leader rejects a bill', ['A type of vote count', 'A new law', 'A party'], 'Lawmakers can sometimes override a veto.'],
    ['How can citizens tell lawmakers what they think?', 'Write, call, or speak at public meetings', ['They can’t', 'Only by shouting', 'Only through Jax'], 'Lawmakers represent the people.'],
    ['What is a democracy?', 'Government where people choose leaders by voting', ['Rule by one king forever', 'No government', 'Rule by a robot'], 'Democracy means rule by the people.']])],
  'soc.trade': [bank('soc.trade', [
    ['Your banana was grown in Ecuador. For your country, the banana is an…', 'Import', ['Export', 'Tax', 'Ticket'], 'Imports come into a country.'],
    ['What is a tariff?', 'A tax on imported goods', ['A free trade gift', 'A bus ticket', 'A kind of fruit'], 'Tariffs make imports more expensive.'],
    ['Why might a country specialize in one product?', 'It can make it well and trade for other things', ['To be bored', 'Laws force it', 'No reason'], 'Specializing and trading gives more variety.'],
    ['A storm closes a big port. What might happen to store shelves?', 'Some goods arrive late or cost more', ['Nothing', 'More goods appear', 'Prices drop to zero'], 'Supply chains link the world.'],
    ['What is a “supply chain”?', 'All the steps that bring a product from raw materials to you', ['A bike chain', 'A store line', 'A necklace'], 'Farms, factories, ships, trucks and stores form a chain.']])],
  'soc.policy': [bank('soc.policy', [
    ['A city raises taxes to fix roads. Who benefits?', 'Drivers, bus riders and businesses using the roads', ['Nobody', 'Only the mayor', 'Only tourists'], 'Name who gains and who pays.'],
    ['What is a public good?', 'Something everyone can use, like streetlights or parks', ['A private car', 'A phone', 'A secret'], 'Public goods are often paid for with taxes.'],
    ['Why do governments hold public hearings?', 'To hear from people affected by a decision', ['To waste time', 'To hide decisions', 'For music'], 'Listening improves decisions.'],
    ['A policy helps one neighborhood but raises costs for another. What is fair?', 'Weigh both and look for ways to reduce harm', ['Ignore the second', 'Cancel everything', 'Flip a coin'], 'Good policy considers everyone.'],
    ['What evidence would show a new bus policy worked?', 'More riders and shorter waits after it started', ['A nice logo', 'One happy tweet', 'The mayor says so'], 'Measure results against goals.']])],
  'soc.citizenship': [bank('soc.citizenship', [
    ['Which is an example of volunteering?', 'Helping at a food bank for free', ['Getting paid at a job', 'Watching TV', 'Shopping'], 'Volunteering gives time to help others.'],
    ['Why attend a town meeting?', 'To learn about and influence local decisions', ['For free snacks only', 'To nap', 'No reason'], 'Local meetings shape your community.'],
    ['How can you disagree with a law peacefully?', 'Write to leaders, petition or vote', ['Break things', 'Threaten people', 'Do nothing ever'], 'Peaceful action is how democracies change.'],
    ['What is a petition?', 'A request signed by many people asking for change', ['A type of pet', 'A tax', 'A song'], 'Many signatures show leaders what people want.'],
    ['Why does every vote matter?', 'Many elections are decided by small margins', ['It doesn’t', 'Only big votes count', 'Leaders choose anyway'], 'Small numbers can change outcomes.']])],
  // ================================================================ HEALTH & LIFE SKILLS
  'hl.hygiene': [bank('hl.hygiene', [
    ['🪥 Why brush your tongue too?', 'Germs that cause bad breath live there', ['To make it pink', 'It’s a rule', 'No reason'], 'A clean tongue means fresher breath.'],
    ['Why should you not share a toothbrush?', 'Germs can spread', ['They break', 'It’s rude', 'Toothbrushes are expensive'], 'Personal items spread germs.'],
    ['🧼 Which removes germs best?', 'Soap and water', ['Water only', 'Wiping on your shirt', 'Blowing on hands'], 'Soap lifts germs off skin.'],
    ['When should you change into clean clothes?', 'Every day and after getting sweaty', ['Once a month', 'Never', 'Only on holidays'], 'Clean clothes keep skin healthy.']])],
  'hl.feelings': [bank('hl.feelings', [
    ['😊 Your friend smiles and jumps up and down. They feel…', 'Happy or excited', ['Sad', 'Scared', 'Sleepy'], 'Smiling and jumping often mean happy.'],
    ['😠 Your face feels hot and you want to shout. You might feel…', 'Angry', ['Calm', 'Sleepy', 'Hungry'], 'Body clues help name feelings.'],
    ['Who can you talk to about big feelings?', 'A trusted adult like a parent or teacher', ['Nobody ever', 'Only strangers online', 'Only pets'], 'Sharing feelings helps.'],
    ['What can you say when you feel upset?', '“I feel upset because…”', ['Nothing, ever', 'Something mean', 'Yell'], '“I feel” sentences explain without blaming.']])],
  'hl.safety': [bank('hl.safety', [
    ['🔥 What should you do if your clothes catch fire?', 'Stop, drop and roll', ['Run', 'Wave your arms', 'Jump'], 'Running fans flames; rolling smothers them.'],
    ['Should you open the door to a stranger when home alone?', 'No, tell an adult', ['Yes, always', 'Only if they knock loudly', 'Only at night'], 'Safety rules protect you at home.'],
    ['What should you know by heart in case you get lost?', 'A parent’s phone number', ['Your favorite song', 'Your friend’s pet’s name', 'Nothing'], 'Knowing a number lets helpers reach your family.'],
    ['What does a red traffic light mean for a walker?', 'Stop and wait', ['Run across', 'Dance', 'Go'], 'Wait for the walk signal.']])],
  'hl.sleep': [bank('hl.sleep', [
    ['How much sleep do teens need?', 'About 8–10 hours', ['3 hours', '15 hours', 'None'], 'Teens need 8–10 hours to learn and grow.'],
    ['What happens when you don’t sleep enough?', 'It’s harder to focus and you feel grumpy', ['You get smarter', 'Nothing', 'You grow taller'], 'Sleep loss affects mood and learning.'],
    ['Which helps you sleep better?', 'A dark, quiet, cool room', ['Bright lights', 'Loud music', 'Soda'], 'A calm space helps your body rest.'],
    ['Why go to bed at the same time each night?', 'Your body learns a sleep rhythm', ['It’s boring', 'No reason', 'To miss dinner'], 'Routines make falling asleep easier.'],
    ['A big test is tomorrow. What’s smarter?', 'Study earlier, then get a full night’s sleep', ['Stay up all night', 'Skip sleep and coffee', 'Sleep 2 hours'], 'Sleep helps your brain store what you studied.']])],
  'hl.exercise': [bank('hl.exercise', [
    ['Why warm up before exercise?', 'To get muscles ready and avoid injury', ['To get tired first', 'It’s pointless', 'To be late'], 'Warm muscles stretch more safely.'],
    ['Which activity builds strong bones?', 'Jumping and running', ['Sitting', 'Sleeping all day', 'Watching sports'], 'Weight-bearing activity strengthens bones.'],
    ['Why drink water when exercising?', 'Your body loses water as sweat', ['To get heavy', 'It cools the air', 'No need'], 'Stay hydrated.'],
    ['How can you be active on a rainy day?', 'Dance, stretch or do jumping jacks inside', ['You can’t', 'Only watch TV', 'Sleep'], 'Movement can happen anywhere.'],
    ['What is a good sign you’re exercising hard enough?', 'You breathe faster but can still talk', ['You can’t breathe at all', 'You feel nothing', 'You fall asleep'], 'Moderate effort raises breathing.']])],
  'hl.kindness': [bank('hl.kindness', [
    ['How can you show empathy?', 'Imagine how the other person feels and listen', ['Laugh at them', 'Ignore them', 'Change the subject'], 'Empathy means understanding feelings.'],
    ['Your friend is left out of a game. What can you do?', 'Invite them to join', ['Leave too', 'Laugh', 'Tell them to go away'], 'Including others is kind.'],
    ['Online, someone posts mean comments about a classmate. What should you do?', 'Don’t join in; report it and tell an adult', ['Like the comments', 'Add your own', 'Share it'], 'Cyberbullying is bullying too.'],
    ['What’s a good way to fix it after hurting a friend?', 'Say sorry and mean it, then do better', ['Pretend nothing happened', 'Blame them', 'Never talk again'], 'A real apology repairs trust.'],
    ['Saying “thank you” and “please”…', 'Shows respect and kindness', ['Is old-fashioned', 'Doesn’t matter', 'Is rude'], 'Small manners make big differences.']])],
  'hl.firstaid': [bank('hl.firstaid', [
    ['Your nose is bleeding. What helps?', 'Lean forward and pinch the soft part of your nose', ['Lean far back', 'Lie flat', 'Blow hard'], 'Leaning forward stops swallowing blood.'],
    ['A friend twisted their ankle. What helps right away?', 'Rest, ice wrapped in a cloth, and raise it', ['Keep running', 'Heat it with a lamp', 'Ignore it'], 'Rest, ice, compression, elevation (RICE).'],
    ['What should a basic first-aid kit have?', 'Bandages, gauze, tape and gloves', ['Candy and toys', 'Only a phone', 'Nothing'], 'A kit helps treat small injuries.'],
    ['A bee stung you and your face is swelling and breathing feels hard. What do you do?', 'Call 911 right away', ['Wait and see', 'Eat something', 'Sleep it off'], 'Swelling and trouble breathing can be a severe allergy.'],
    ['Before helping someone injured, check…', 'That the area is safe for you', ['Your phone’s battery', 'Your hair', 'The time'], 'Don’t become a second victim.']])],
  'hl.foodsafety': [bank('hl.foodsafety', [
    ['How should you thaw frozen meat safely?', 'In the fridge', ['On the counter all day', 'In the sun', 'Under a pillow'], 'Cold thawing keeps germs from growing.'],
    ['Why wash fruits and vegetables?', 'To remove dirt and germs', ['To make them sweeter', 'To make them bigger', 'No reason'], 'Rinse produce before eating.'],
    ['A can is bulging. What should you do?', 'Throw it away without tasting', ['Eat it fast', 'Shake it', 'Give it away'], 'Bulging cans can hold dangerous germs.'],
    ['Why use a food thermometer?', 'To check food is cooked to a safe temperature', ['To decorate', 'To stir', 'To measure weight'], 'Color alone doesn’t prove it’s safe.']])],
  'hl.stress': [bank('hl.stress', [
    ['Which is an unhealthy way to handle stress?', 'Bottling it up and never talking about it', ['Taking a walk', 'Talking to a friend', 'Deep breathing'], 'Sharing and moving help; bottling up builds stress.'],
    ['What can help before a stressful presentation?', 'Practise, breathe slowly, and picture it going well', ['Skip sleep', 'Drink lots of soda', 'Panic'], 'Preparation and calm breathing lower stress.'],
    ['How does exercise help stress?', 'It releases chemicals that improve mood', ['It doesn’t', 'It makes stress worse', 'It only tires you'], 'Movement is a natural stress reliever.'],
    ['Too much to do this week. What helps?', 'Make a list and do the most important things first', ['Do nothing', 'Do everything at once', 'Hide'], 'Prioritizing reduces overwhelm.'],
    ['Is some stress normal?', 'Yes, a little stress can even help you focus', ['No, never', 'Only for adults', 'Only on Mondays'], 'Stress becomes a problem when it’s too much or lasts too long.']])],
  'hl.medicine': [bank('hl.medicine', [
    ['Where should medicine be kept in a home with small kids?', 'Up high and locked away', ['On the table', 'In a toy box', 'In a lunch bag'], 'Keep medicine out of reach.'],
    ['What does the expiration date on medicine mean?', 'After that date it may not work or be safe', ['When to buy more', 'The price', 'Your birthday'], 'Check dates before taking medicine.'],
    ['Why tell a doctor about other medicines you take?', 'Some medicines mix badly', ['To fill time', 'It doesn’t matter', 'For fun'], 'Interactions can be dangerous.'],
    ['Vitamins are…', 'Still medicine-like; take only as directed', ['Candy', 'Unlimited', 'Always harmless in any amount'], 'Too much of some vitamins can hurt you.']])],
  'hl.habits': [bank('hl.habits', [
    ['Which is a SMART goal?', 'Read 20 pages every night for a month', ['Read more', 'Be a reader', 'Try reading sometime'], 'Specific, measurable, achievable, relevant, time-bound.'],
    ['How can you remember to drink more water?', 'Keep a water bottle with you', ['Hide your bottle', 'Only drink soda', 'Wait until thirsty'], 'Make the habit easy.'],
    ['Why track a habit on a chart?', 'Seeing progress keeps you going', ['It wastes time', 'Charts are boring', 'No reason'], 'Tracking builds motivation.'],
    ['How can you break a bad habit?', 'Replace it with a better one', ['Do it more', 'Ignore it', 'Hide from it'], 'Swapping habits works better than stopping cold.'],
    ['How long does a new habit often take to feel automatic?', 'Weeks to a few months', ['One minute', 'One day', 'Never'], 'Be patient and consistent.']])],
  'hl.mental': [bank('hl.mental', [
    ['What is mental health?', 'How we think, feel and handle life', ['Only how smart we are', 'How fast we run', 'Our height'], 'Everyone has mental health, just like physical health.'],
    ['Which is a sign someone may need support?', 'They stop enjoying things they used to love', ['They laugh with friends', 'They sleep well', 'They eat lunch'], 'Lasting changes can be signs.'],
    ['Where can you find help if you feel down?', 'A parent, counselor, doctor or helpline', ['Nowhere', 'Only online strangers', 'Only by yourself'], 'Help is available.'],
    ['What is self-care?', 'Doing things that keep you healthy and calm, like rest and hobbies', ['Being selfish', 'Ignoring others', 'Only shopping'], 'Self-care keeps you strong for others too.'],
    ['A friend tells you they want to hurt themselves. What should you do?', 'Tell a trusted adult right away, even if they asked you not to', ['Keep it secret', 'Ignore it', 'Laugh'], 'Safety comes before secrets. Adults can get them help.']])],
  'hl.relationships': [bank('hl.relationships', [
    ['Someone keeps checking your phone and telling you who you can see. This is…', 'Controlling, not healthy', ['Normal love', 'Friendly', 'Polite'], 'Healthy relationships respect privacy and freedom.'],
    ['How do you set a boundary?', 'Say clearly and calmly what you’re OK with', ['Hope they guess', 'Yell', 'Never speak'], 'Clear words help others respect you.'],
    ['A friend says “no” to sharing their snack. What do you do?', 'Respect it', ['Take it anyway', 'Get angry', 'Tell everyone'], 'No means no, for everyone.'],
    ['What makes a friendship strong?', 'Trust, honesty and kindness both ways', ['One person doing everything', 'Keeping score', 'Gossip'], 'Healthy friendships are two-way.'],
    ['Peer pressure means…', 'Feeling pushed by friends to do something', ['Doing homework', 'Pressure in tires', 'Exercising'], 'You can say no to peer pressure.']])],
  'hl.wellbeing': [bank('hl.wellbeing', [
    ['Which helps wellbeing every day?', 'Sleep, movement, good food and time with people you care about', ['Skipping meals', 'No sleep', 'Being alone always'], 'Balance across areas.'],
    ['Why have hobbies?', 'They bring joy and lower stress', ['They waste time', 'Only kids need them', 'No reason'], 'Fun is part of health.'],
    ['How can helping others improve your own wellbeing?', 'It gives purpose and connection', ['It doesn’t', 'It makes you tired only', 'It costs money'], 'Kindness benefits the giver too.'],
    ['Why limit screen time?', 'To make time for sleep, movement and people', ['Screens are always bad', 'No reason', 'To save batteries only'], 'Balance matters.'],
    ['What does work-life balance mean?', 'Making time for both work and rest or family', ['Working nonstop', 'Never working', 'Only weekends'], 'Rest helps you do your best work.'],
    ['Which is a long-term health habit?', 'Regular check-ups and staying active', ['Ignoring pain', 'Skipping sleep', 'Never seeing a doctor'], 'Prevention keeps you healthy for life.']])],
  'hl.publichealth': [bank('hl.publichealth', [
    ['Why do schools ask sick students to stay home?', 'To stop illness spreading', ['To punish them', 'To close the school', 'No reason'], 'Staying home protects others.'],
    ['Why are there rules against smoking in public places?', 'Secondhand smoke harms others', ['Smoke smells nice', 'For fun', 'No reason'], 'Public health protects bystanders.'],
    ['What is an epidemic?', 'A disease spreading to many people in an area', ['A kind of medicine', 'A healthy town', 'A vitamin'], 'Public health teams work to slow epidemics.'],
    ['Why do cities have trash pickup?', 'To prevent germs and pests', ['To make noise', 'To waste money', 'For decoration'], 'Clean cities are healthier cities.'],
    ['Seat belt laws are a public health measure because…', 'They save many lives in crashes', ['They look nice', 'They make cars faster', 'They are optional'], 'Simple rules can prevent many injuries.']])],
  // ================================================================ TECHNOLOGY
  'tech.basics': [bank('tech.basics', [
    ['What is software?', 'Programs and apps that tell a device what to do', ['The screen glass', 'The charger', 'The case'], 'Hardware is physical; software is instructions.'],
    ['What does Wi-Fi let a device do?', 'Connect to the internet without a cable', ['Charge faster', 'Take photos', 'Print'], 'Wi-Fi is a wireless network connection.'],
    ['Why restart a device that’s frozen?', 'It clears stuck programs', ['To delete everything', 'To charge it', 'It never helps'], 'Restarting often fixes glitches.'],
    ['Which is hardware?', 'A keyboard', ['A game app', 'A website', 'A password'], 'Hardware is the physical parts.']])],
  'tech.sequence': [orders('tech.sequence', [
    ['Put the steps to make a robot draw a line in order.', ['Put the pen down', 'Move forward 10 steps', 'Lift the pen up'], 'Pen down before moving, pen up after.'],
    ['Order the steps to save a drawing on a tablet.', ['Finish the drawing', 'Tap Save', 'Type a file name', 'Tap OK'], 'Each step needs the one before.'],
    ['Put the steps to log in to an app in order.', ['Open the app', 'Type your username', 'Type your password', 'Tap Log in'], 'Sequences must be exact.'],
    ['Order the steps for a robot to pick up a ball.', ['Drive to the ball', 'Open the claw', 'Close the claw around the ball', 'Lift the arm'], 'Open before closing; lift after grabbing.']]),
    bank('tech.sequence', [['What happens if steps in an algorithm are out of order?', 'The result can be wrong', ['Nothing changes', 'It gets faster', 'The computer fixes it'], 'Computers do exactly what you say, in order.'], ['What is an algorithm?', 'A set of step-by-step instructions', ['A type of robot', 'A computer brand', 'A song'], 'Recipes and directions are algorithms too.']])],
  'tech.safety': [bank('tech.safety', [
    ['A pop-up says “You won a phone! Click here!” What should you do?', 'Close it without clicking', ['Click fast', 'Enter your address', 'Share it'], 'Pop-up prizes are usually scams.'],
    ['Who should know your online accounts?', 'A parent or guardian', ['Strangers', 'Everyone', 'Nobody, even parents'], 'Parents help keep you safe.'],
    ['Is it OK to use your real photo as a game avatar with strangers?', 'Better to use a cartoon avatar', ['Yes, always', 'Only with your address', 'Only at night'], 'Protect your identity online.']])],
  'tech.passwords': [bank('tech.passwords', [
    ['Which is the weakest password?', '123456', ['Blue!Tiger_Runs7', 'Pizza-Moon-88!', 'Rain#Drop#Lake4'], 'Short, common passwords are guessed in seconds.'],
    ['What is two-step verification?', 'A second check, like a code texted to you', ['Typing your password twice', 'Two passwords on paper', 'Logging in twice a day'], 'It stops thieves even if they know your password.'],
    ['Where is a bad place to keep passwords?', 'On a sticky note on your screen', ['In a password manager', 'Memorized', 'With a parent'], 'Visible passwords can be seen by anyone.'],
    ['A website asks you to create a password using your birthday. Why is that weak?', 'Birthdays are easy to find or guess', ['Birthdays are too long', 'It’s strong', 'Websites ban it'], 'Avoid personal info in passwords.'],
    ['How often should you change a password that might have leaked?', 'Right away', ['Never', 'Once every 10 years', 'Only if you forget it'], 'Change leaked passwords immediately.']])],
  'tech.loops': [bank('tech.loops', [
    ['Which task is best done with a loop?', 'Watering 20 plants the same way', ['Saying hello once', 'Opening one door', 'Signing your name once'], 'Loops repeat the same steps.'],
    ['A loop that never stops is called…', 'An infinite loop', ['A short loop', 'A bug-free loop', 'A circle'], 'Infinite loops freeze programs.']])],
  'tech.search': [bank('tech.search', [
    ['You need facts for a report on volcanoes. Which result is likely best?', 'A science museum or university page', ['A random comment', 'An ad for lava lamps', 'A joke site'], 'Prefer expert sources.'],
    ['Putting words in quotes, like “Brighter Park hours”, searches for…', 'That exact phrase', ['Any one of the words', 'Pictures only', 'Nothing'], 'Quotes keep the words together.'],
    ['The first result is an ad. What should you notice?', 'Ads are paid, not always the best answer', ['Ads are always correct', 'Ads are free facts', 'Nothing'], 'Look past sponsored results.'],
    ['You found an answer on one site. What next?', 'Check it on another trusted site', ['Stop searching', 'Copy it', 'Believe it forever'], 'Verify before using.'],
    ['Which search words are best for “What’s the weather in Midtown tomorrow?”', 'Midtown weather tomorrow', ['what is the thing outside', 'weather', 'tomorrow'], 'Key words only.']])],
  'tech.citizenship': [bank('tech.citizenship', [
    ['What is a “digital footprint”?', 'The record of everything you do online', ['A shoe size', 'A website', 'A game'], 'It can last for years.'],
    ['Someone shares a rumor online about a classmate. What should you do?', 'Don’t share it; tell an adult if it’s hurtful', ['Share it', 'Add more', 'Like it'], 'Don’t spread hurtful content.'],
    ['Why shouldn’t you pretend to be someone else online?', 'It’s dishonest and can hurt people', ['It’s funny', 'Everyone does', 'No reason'], 'Honesty applies online too.'],
    ['How long can a post stay online?', 'Possibly forever', ['One minute', 'Until tomorrow', 'Never'], 'Screenshots can keep posts even after deleting.'],
    ['You disagree with a comment. What is good digital citizenship?', 'Reply politely with facts, or move on', ['Insult them', 'Spam them', 'Hack them'], 'Respect online matters.']])],
  'tech.debug': [bank('tech.debug', [
    ['Your recipe app shows “2 eggs” but the recipe needs 4. What’s the bug?', 'The number used is wrong', ['Eggs are broken', 'The screen is dirty', 'Recipes don’t use eggs'], 'Compare expected vs. actual to find the bug.'],
    ['What is a “bug” in programming?', 'A mistake that makes a program act wrong', ['An insect', 'A feature', 'A password'], 'The term goes back to early computing.'],
    ['Why explain your code out loud when debugging?', 'Saying each step helps you spot mistakes', ['To be loud', 'It doesn’t help', 'For fun'], 'Talking it through reveals errors.'],
    ['A program crashes only when the number is 0. What should you test?', 'What happens with 0, like dividing by zero', ['Only the number 5', 'Nothing', 'The font'], 'Edge cases often hide bugs.'],
    ['After fixing a bug, what should you do?', 'Test again to make sure it works', ['Assume it’s fixed', 'Delete the program', 'Stop testing forever'], 'Always retest.']])],
  'tech.privacy': [bank('tech.privacy', [
    ['What is a “cookie” on a website?', 'A small file that remembers what you did on a site', ['A snack', 'A virus always', 'A password'], 'Cookies can track you across sites.'],
    ['Why turn off location sharing on photos you post?', 'So strangers can’t find where you live', ['To save space', 'To change colors', 'No reason'], 'Photos can contain hidden location data.'],
    ['Which information is private?', 'Your home address', ['Your favorite color', 'Your favorite animal', 'Your favorite sport'], 'Keep identifying details private.'],
    ['Why read what an app can access before installing?', 'To know what data it will collect', ['To waste time', 'It doesn’t matter', 'Apps never collect data'], 'Permissions tell you what you’re sharing.'],
    ['A quiz asks your pet’s name and your first school. Why be careful?', 'Those are common security-question answers', ['Quizzes are always safe', 'It’s just fun', 'They need it'], 'Scammers use quizzes to guess passwords.']])],
  'tech.internet': [bank('tech.internet', [
    ['What is a web browser?', 'An app for viewing websites', ['A search engine only', 'A cable', 'A virus'], 'Chrome, Safari and Firefox are browsers.'],
    ['What does “https” at the start of a web address mean?', 'The connection is encrypted (more secure)', ['The site is free', 'The site is fast', 'Nothing'], 'The “s” means secure.'],
    ['What is the “cloud”?', 'Data stored on servers you reach over the internet', ['Rain clouds', 'Your phone only', 'A printer'], 'Cloud storage lives on remote computers.'],
    ['What is a router?', 'A device that directs internet traffic in your home', ['A map app', 'A keyboard', 'A charger'], 'It connects your devices to the internet.'],
    ['What is an IP address?', 'A number that identifies a device on a network', ['A home address', 'A password', 'An email'], 'Like a mailing address for computers.']])],
  'tech.ai': [bank('tech.ai', [
    ['Why can AI give biased answers?', 'It learns from data that can contain human biases', ['AI is always fair', 'It has opinions of its own', 'It never learns'], 'Biased data → biased results.'],
    ['Is it honest to hand in AI-written homework as your own?', 'No, that’s plagiarism', ['Yes', 'Only on Fridays', 'If nobody notices'], 'Honesty means saying where help came from.'],
    ['Which is a common use of AI?', 'Recommending videos or songs', ['Growing trees', 'Making rain', 'Baking bread by itself'], 'Recommendations use patterns in your activity.'],
    ['Why shouldn’t you share private information with AI chatbots?', 'It may be stored or seen by others', ['They forget instantly always', 'It’s required', 'They need it'], 'Treat AI like any online service.'],
    ['A photo might be made by AI. How can you check?', 'Look for odd details and check trusted sources', ['Always believe photos', 'Ask Jax', 'Share it first'], 'AI images can look real; verify.']])],
  'tech.design': [bank('tech.design', [
    ['What does “user-friendly” mean?', 'Easy for people to understand and use', ['Has lots of buttons', 'Is expensive', 'Is fast only'], 'Design for the person, not the designer.'],
    ['Why make apps work for people with different abilities?', 'So everyone can use them (accessibility)', ['It’s not needed', 'Only for a few', 'To slow things'], 'Captions, large text and voice help many users.'],
    ['What is a prototype in app design?', 'A simple early version to test ideas', ['The final app', 'A bug', 'A password'], 'Test cheap and early.'],
    ['Users can’t find the Save button. What should designers do?', 'Make it bigger and clearer, then test again', ['Remove it', 'Blame users', 'Hide it more'], 'Fix the design, then retest.'],
    ['Who should test a new app?', 'Real people who will use it', ['Only the designer', 'Nobody', 'Only robots'], 'Real users reveal real problems.']])],
};
