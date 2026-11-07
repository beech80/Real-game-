// REAL — bigger question banks (part 2: science, critical thinking). Same row format as curriculum9.js:
//   [question, answer, [wrong choices], explanation, dok, {wrong choice: feedback}]
// Science distractors are the common misconceptions; thinking items are everyday decisions with a reason.
const bank = (skill, rows) => rows.map(([q, a, w, why, dok, ww]) => () => ({ type: 'choice', skill, q, a, o: [a, ...w], why, dok, whyWrong: ww }));
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];

export const BANKS_B = {
  // ================================================================ science
  'sci.safety': bank('sci.safety', [
    ['In a science activity, why do we wear goggles?', 'To keep splashes and bits out of our eyes', ['To help us see better in a dark room', 'So we look more like real scientists', 'Only on days when the sun is bright'], 'Eyes are easy to hurt and hard to heal. Goggles protect them.', 1],
    ['You spill water on the floor during an experiment. What should you do?', 'Tell an adult and help clean it up', ['Leave it, since water dries by itself', 'Keep working and step around it', 'Hide it with paper so no one sees'], 'Spills can make people slip and fall. Clean them up right away.', 2],
    ['Should you taste or smell things in a science lab?', 'No, unless the teacher says it is safe', ['Yes, tasting is how we test things', 'Yes, smell everything up close', 'Smell it close up if it looks safe'], 'Some materials are harmful. Follow the safety rules.', 1],
    ['Why do we tie back long hair near a flame?', 'Hair can catch fire', ['So we can see the flame', 'It makes the flame bigger', 'It keeps your hair clean'], 'Loose hair near heat is a fire risk.', 2],
  ]),
  'sci.animals': bank('sci.animals', [
    ['What do all animals need to live?', 'Food, water, air and shelter', ['Only food and a warm bed', 'Food and water, but not air', 'Just sunlight, like plants'], 'Animals need food, water, air and a safe place to live.', 1],
    ['Why do some birds fly south when winter is coming?', 'To find food and warmer weather', ['To find a new place to sleep', 'Because their feathers fall off', 'To get away from the rain'], 'Moving to find food and warmth is called migration.', 2],
    ['A snowshoe hare has brown fur in summer and white fur in winter. How does this help it?', 'It blends in and hides from predators', ['It helps it run faster in the snow', 'It changes color because it is cold', 'White fur keeps it warm, that is all'], 'Brown fur blends in with the ground, and white fur blends in with snow. That helps the hare hide and stay safe.', 3],
    ['Which animal is a mammal?', 'A whale', ['A shark', 'A frog', 'A lizard'], 'Mammals have hair and feed their babies milk. Whales are mammals even though they live in water.', 2, { 'A shark': 'Sharks are fish: they breathe through gills. Whales breathe air.' }],
  ]),
  'sci.observe': bank('sci.observe', [
    ['Which is an observation?', 'The leaf is green and has jagged edges', ['The leaf is the prettiest one here', 'Leaves are more fun than flowers', 'I think it fell off yesterday'], 'Observations describe what you can see, hear, smell or measure.', 2],
    ['What tool helps you see tiny things?', 'A magnifying glass', ['A ruler', 'A thermometer', 'A clock'], 'Magnifiers make small things look bigger.', 1],
    ['Why do scientists write down their observations?', 'So they remember what happened and can compare', ['So the notebook looks full and neat', 'Because writing makes the test work', 'Only so the teacher can grade it'], 'Records let you remember exactly what happened, spot patterns and check results later.', 3],
  ]),
  'sci.weather': bank('sci.weather', [
    ['What tool measures temperature?', 'A thermometer', ['A ruler', 'A scale', 'A compass'], 'A thermometer shows how hot or cold it is.', 1],
    ['What season comes after winter?', 'Spring', ['Summer', 'Fall', 'Winter again'], 'The seasons go winter, spring, summer, fall.', 1],
    ['Dark clouds are moving in and the wind is picking up. What will probably happen?', 'It may rain or storm soon', ['It will get very sunny', 'The air will get calm', 'It will turn hot and dry'], 'Dark clouds and wind are signs of rain or storms.', 2],
    ['Why do we wear lighter clothes in summer?', 'It is warm, and light clothes keep us cool', ['Light clothes make the sun shine less', 'Dark heavy clothes keep heat out best', 'So our skin can get a tan faster'], 'Dressing for the weather keeps our bodies feeling good.', 2],
  ]),
  'sci.plants': bank('sci.plants', [
    ['What part of a plant takes in water from the soil?', 'The roots', ['The leaves', 'The flower', 'The fruit'], 'Roots soak up water and hold the plant in place.', 1],
    ['What is the right order of a plant’s life cycle?', 'Seed, sprout, plant, flower, seed', ['Flower, sprout, seed, plant', 'Sprout, seed, flower, plant', 'Seed, flower, sprout, plant'], 'Plants grow from seeds, then make new seeds.', 2],
    ['A plant in a dark closet turns yellow. Why?', 'It needs light to make its food', ['It is too cold in the closet', 'It needs more water to drink', 'It wants a bigger pot to grow'], 'Plants use sunlight to make food. Without light they get weak.', 3],
  ]),
  'sci.matter': bank('sci.matter', [
    ['Which is a liquid?', 'Juice', ['A rock', 'Steam', 'An ice cube'], 'Liquids flow and take the shape of their container.', 1],
    ['An ice cube melts in your hand. What changed?', 'It went from solid to liquid', ['It went from gas to solid', 'It became a new material', 'Nothing changed'], 'Heat from your hand melted it. It’s still water, just a different state.', 2],
    ['What happens to water when it boils?', 'It turns into a gas (water vapor)', ['It is gone and no longer exists', 'It changes into a new material', 'It gets thick and heavy'], 'Boiling turns liquid water into a gas. The water is still there, as vapor in the air.', 1],
    ['A puddle and an ice cube are both made of…', 'Water', ['Glass', 'Air', 'Two different materials'], 'Ice, liquid water and steam are all the same stuff in different states.', 2],
    ['Why does a balloon get bigger when you blow air in?', 'More air inside pushes out on the walls', ['Air turns solid and fills it up', 'The rubber grows when it gets wet', 'Warm breath makes the rubber grow'], 'Gas takes up space. When you add more air, it pushes out on the stretchy walls, so the balloon stretches.', 3],
  ]),
  'sci.water': bank('sci.water', [
    ['What is it called when water falls from clouds as rain or snow?', 'Precipitation', ['Evaporation', 'Condensation', 'Collection'], 'Precipitation is any water that falls from the sky.', 1],
    ['Put the water cycle in order.', 'Evaporation, condensation, precipitation, collection', ['Precipitation, evaporation, collection, condensation', 'Evaporation, precipitation, condensation, collection', 'Condensation, evaporation, collection, precipitation'], 'Water warms and rises, cools into clouds, falls, and collects again.', 2],
    ['Wet clothes dry faster on a sunny, windy day. Why?', 'Heat and wind speed up evaporation', ['The sun soaks the water deeper in', 'Wind blows the water to the inside', 'Clothes dry the same every day'], 'Warmth and moving air help water turn into vapor faster.', 3],
  ]),
  'sci.space': bank('sci.space', [
    ['Why do we have day and night?', 'Earth spins, so our side turns away from the Sun', ['The Sun moves around Earth every day', 'The Moon blocks the Sun at night', 'The Sun goes out at night, then lights up'], 'Earth rotates once about every 24 hours. Our side faces the Sun in the day and away from it at night.', 2, { 'The Sun moves around Earth every day': 'It looks that way, but it’s Earth spinning that makes the Sun seem to move.' }],
    ['What does the Moon do?', 'It travels around Earth', ['It travels around Mars', 'It stays still', 'It makes its own light'], 'The Moon orbits Earth about once a month. It reflects sunlight.', 1],
    ['The Sun is a…', 'Star', ['Planet', 'Moon', 'Cloud'], 'The Sun is the star closest to Earth.', 1],
    ['Why do the stars seem to come out at night?', 'They are there all day, but sunlight hides them', ['Stars only start to shine when it gets dark', 'Stars move closer to Earth at night', 'The Moon gives them light to shine with'], 'Daylight is so bright that we can’t see the stars.', 3],
  ]),
  'sci.planets': bank('sci.planets', [
    ['Which planet is closest to the Sun?', 'Mercury', ['Earth', 'Mars', 'Neptune'], 'The order begins Mercury, Venus, Earth, Mars.', 1],
    ['Why can Earth support life when Mars can’t (for now)?', 'Earth has liquid water and air we can breathe', ['Earth is bigger than every other planet', 'Mars is too close to the Sun and too hot', 'Mars has no gravity, so nothing stays'], 'Liquid water and a breathable atmosphere are key for life as we know it.', 3],
    ['What keeps the planets in orbit around the Sun?', 'Gravity', ['Wind', 'Magnets on the planets', 'Nothing; they float'], 'The Sun’s gravity pulls on the planets and keeps them circling.', 2],
  ]),
  'sci.method': bank('sci.method', [
    ['You test which paper towel soaks up the most water. What must stay the same?', 'The amount of water and the size of each towel', ['The kind of towel you are testing', 'Nothing, as long as you test them all', 'Only the color of the cups you use'], 'In a fair test, you change one thing and keep everything else the same.', 2],
    ['What is a hypothesis?', 'A testable guess about what will happen', ['The final answer to the question', 'A list of the materials you need', 'A fact that has already been proven'], 'A hypothesis is a prediction you can check with an experiment.', 1],
    ['You test a plant food on one plant and it grows. Why should you test more plants?', 'One result might be luck; more tests check it', ['One plant is enough if it grew a lot', 'To use up the rest of the plant food', 'More plants make the plant food stronger'], 'One result could be luck. Repeating tests helps show a real pattern.', 3],
  ]),
  'sci.nutrition': bank('sci.nutrition', [
    ['Which food has the most protein?', 'Beans', ['Lettuce', 'Apple juice', 'Candy'], 'Beans, meat, eggs and nuts are good sources of protein, which builds muscles.', 1],
    ['Why should half your plate be fruits and vegetables?', 'They give vitamins and fiber your body needs', ['They are the cheapest foods to buy', 'They have the most protein for muscles', 'They have the most fat for energy'], 'Fruits and vegetables give vitamins, minerals and fiber that help your body work.', 2],
    ['A drink label says 40 grams of sugar. What is a healthier swap?', 'Water or milk', ['A bigger soda', 'Two of the same drink', 'An energy drink'], 'Sugary drinks add a lot of sugar fast. Water and milk are better choices.', 2],
  ]),
  'sci.body': bank('sci.body', [
    ['Which organ pumps blood around your body?', 'The heart', ['The lungs', 'The stomach', 'The brain'], 'The heart is a muscle that pumps blood.', 1],
    ['What do your lungs do?', 'Take in oxygen and let out carbon dioxide', ['Break down the food you eat', 'Pump blood to the whole body', 'Help you see and hear things'], 'Breathing brings oxygen into your blood.', 1],
    ['Why do bones and muscles work together?', 'Muscles pull on bones to make you move', ['Bones move by themselves when you think', 'Muscles only keep your body warm', 'Bones hold muscles still so they rest'], 'Muscles are attached to bones. When they tighten, they pull bones.', 2],
    ['Your skin is…', 'An organ that protects your body', ['A cover that is not part of your body', 'Only there to give you color', 'A thin bone that covers you'], 'Skin is your largest organ. It keeps germs out and holds water in.', 2],
  ]),
  'sci.friction': bank('sci.friction', [
    ['Why do shoes have bumpy bottoms?', 'More grip (friction) so you don’t slip', ['To make the shoes look cool', 'To make the shoes lighter to wear', 'To help you slide faster on floors'], 'Rough surfaces create more friction.', 2],
    ['Which surface would a toy car roll farthest on?', 'Smooth tile', ['Thick carpet', 'Grass', 'Sand'], 'Smooth surfaces have less friction, so the car keeps rolling longer.', 2],
    ['Rub your hands together fast. Why do they get warm?', 'Friction turns motion into heat', ['Rubbing pulls heat out of the air', 'Your blood stops moving there', 'Your skin gets thinner as you rub'], 'Friction changes motion energy into heat.', 3],
  ]),
  'sci.energy': bank('sci.energy', [
    ['What kind of energy does a moving bike have?', 'Motion (kinetic) energy', ['Stored (potential) energy only', 'No energy until it stops', 'Sound energy only'], 'Anything that moves has kinetic energy.', 1],
    ['A flashlight changes stored energy in its battery into…', 'Light (and some heat)', ['Nothing; the energy is used up', 'More stored energy', 'Sound energy only'], 'Energy changes form: chemical energy in the battery becomes light and heat. It is not used up; it changes.', 2],
    ['Why is a ball at the top of a hill said to have stored energy?', 'Gravity can pull it down, turning it into motion', ['It is heavy, and heavy things store energy', 'It got energy from the cold air at the top', 'All balls have the same stored energy'], 'Height gives an object potential energy because of gravity. As it rolls down, that energy becomes motion.', 3],
  ]),
  'sci.machines': bank('sci.machines', [
    ['A ramp is a simple machine called…', 'An inclined plane', ['A lever', 'A pulley', 'A wheel and axle'], 'An inclined plane lets you raise something with less force over a longer distance.', 1],
    ['Why is it easier to push a box up a ramp than lift it straight up?', 'You use less force, though you push it farther', ['The box gets lighter on the ramp', 'The ramp adds extra energy to the box', 'You push it a shorter distance'], 'Simple machines trade distance for force.', 3],
    ['A seesaw is an example of a…', 'Lever', ['Pulley', 'Screw', 'Wedge'], 'A lever is a bar that turns on a point (the fulcrum).', 1],
  ]),
  'sci.heat': bank('sci.heat', [
    ['Which material lets heat pass through quickly?', 'Metal', ['Wood', 'Wool', 'Plastic foam'], 'Metals are good conductors of heat.', 1],
    ['Why do pot handles often have plastic or wood on them?', 'They don’t carry heat well, so the handle stays cool', ['They look nicer than a metal handle', 'They make the pot heavier so it won’t tip', 'They carry heat to the food faster'], 'Plastic and wood are insulators. They slow heat flow and protect your hand.', 2],
    ['Heat always moves from…', 'Warmer things to cooler things', ['Cooler things to warmer things', 'Low places up to high places', 'Nowhere; heat stays put'], 'That’s why a hot drink cools down and an ice cube melts in your hand.', 2],
  ]),
  'sci.materials': bank('sci.materials', [
    ['Which material is best for a raincoat?', 'Plastic or waterproof fabric', ['Thick cotton, like a sweatshirt', 'Warm wool, like a winter hat', 'Thin paper that is light'], 'A raincoat must keep water out. Cotton, wool and paper soak water up.', 2],
    ['Why are windows made of glass?', 'Glass is see-through and keeps out wind and rain', ['Glass is soft and bends without breaking', 'Glass keeps out light and lets in air', 'Glass is the strongest material there is'], 'Materials are chosen for their properties.', 2],
    ['Which property makes rubber good for bike tires?', 'It is flexible and grips the road', ['It is hard and never bends', 'It is heavy and holds the bike down', 'It melts easily on hot roads'], 'Rubber bends, bounces back and has good grip.', 3],
  ]),
  'sci.magnets': bank('sci.magnets', [
    ['Which object will a magnet pick up?', 'An iron nail', ['A plastic spoon', 'A wooden block', 'A paper clip made of plastic'], 'Magnets attract iron and steel.', 1],
    ['Two north poles of magnets are pushed together. What happens?', 'They push apart (repel)', ['They stick together', 'Nothing', 'They become one magnet'], 'Like poles repel; opposite poles attract.', 2],
    ['Can a magnet work through a sheet of paper?', 'Yes, magnet force passes through paper', ['No, paper always blocks magnets', 'Only through metal, not paper', 'Only if the paper is wet first'], 'Magnetic force works at a distance and through many thin materials.', 2],
  ]),
  'sci.sound': bank('sci.sound', [
    ['What makes sound?', 'Vibrations', ['Light', 'Color', 'Cold'], 'Sound is made when something vibrates, like a guitar string.', 1],
    ['A big drum makes a lower sound than a small drum. Why?', 'Big things vibrate slower, making a lower pitch', ['Big drums are louder, and loud sounds are low', 'Small drums vibrate more slowly than big ones', 'Pitch depends only on how hard you hit it'], 'Larger things vibrate more slowly, and slower vibrations make lower pitches.', 3],
    ['Why can you see a shadow behind you on a sunny day?', 'Your body blocks the light', ['Shadows are made of dark air', 'Shadows are a reflection of you', 'Light goes through you'], 'A shadow forms where an object blocks light.', 2],
  ]),
  'sci.circuits': bank('sci.circuits', [
    ['Which material lets electricity flow?', 'Copper wire', ['Rubber', 'Plastic', 'Wood'], 'Metals like copper are conductors.', 1],
    ['Why are wires covered in plastic?', 'Plastic doesn’t carry electricity, so it keeps us safe', ['To keep the wires from getting cold', 'The plastic makes the electricity flow faster', 'Plastic stores extra electricity for later'], 'Insulators stop electricity from reaching your hand.', 2],
    ['A switch is “open.” What happens to the bulb?', 'It goes off because the circuit is broken', ['It gets brighter because more current flows', 'It stays on until the battery runs out', 'It goes dim but stays a little lit'], 'An open switch makes a gap, so current can’t flow.', 2],
  ]),
  'sci.forces': bank('sci.forces', [
    ['What force pulls things toward the ground?', 'Gravity', ['Friction', 'Magnetism', 'Wind'], 'Gravity pulls objects toward Earth.', 1],
    ['You kick a ball harder. What happens?', 'It goes faster and farther', ['It goes slower', 'Nothing changes', 'It stops right away'], 'A bigger force causes a bigger change in motion.', 2],
  ]),
  'sci.cells': bank('sci.cells', [
    ['What is the basic unit of all living things?', 'The cell', ['The atom', 'The organ', 'The bone'], 'All living things are made of one or more cells.', 1],
    ['What does the cell membrane do?', 'Controls what goes in and out of the cell', ['Makes food for the cell from sunlight', 'Stores all of the cell’s DNA', 'Gives the cell its stiff, hard shape'], 'The membrane is like a gatekeeper.', 2],
    ['Why do plant cells have a cell wall but animal cells don’t?', 'Walls give plants support, since they have no bones', ['Animal cells are too small to hold a wall', 'Plant cells need walls to make sugar', 'Walls keep all water out of plant cells'], 'Plants have no skeleton. Stiff cell walls help them stand upright.', 3],
  ]),
  'sci.health': bank('sci.health', [
    ['Why should you take an antibiotic exactly as your doctor says?', 'It clears the infection and helps stop resistant germs', ['So none of the medicine goes to waste', 'So you can stop as soon as you feel better', 'Taking extra pills makes it work faster'], 'Taking it right helps clear the infection and lowers the chance of resistant bacteria. Take antibiotics only when a doctor prescribes them, and follow their directions on how long. Ask before stopping early.', 3],
    ['Antibiotics work against…', 'Bacteria, not viruses like the common cold', ['Every kind of illness, including colds', 'Viruses, like colds and the flu', 'Pain from any kind of injury'], 'Colds and flu are viruses; antibiotics don’t help them.', 2, { 'Every kind of illness, including colds': 'Antibiotics only kill bacteria. They don’t work on viruses like colds.' }],
  ]),
  'sci.design': bank('sci.design', [
    ['Your paper bridge sags with 10 coins. What is the best next step?', 'Change one thing, like folding the paper, then test', ['Start over with a totally new design', 'Add more coins to see when it breaks', 'Change the paper, tape and shape all at once'], 'Engineers improve a design by testing one change at a time.', 2],
    ['What are “constraints” in an engineering project?', 'Limits like cost, materials and time', ['The final design the team picks', 'The steps for building the model', 'Rules you can skip if time runs out'], 'Constraints shape what solutions are possible.', 1],
    ['Two designs both work. How should a team choose?', 'Compare both against the criteria, like cost and safety', ['Pick the one that looks the most finished', 'Choose the one that was built first', 'Choose whichever one the leader drew'], 'Criteria such as cost, strength and safety let you judge designs fairly.', 3],
  ]),
  'sci.ecosystems': bank('sci.ecosystems', [
    ['In a food chain, what does a decomposer do?', 'Breaks down dead things into nutrients for soil', ['Hunts and eats other living animals', 'Makes its own food from sunlight', 'Eats only plants that are still growing'], 'Decomposers like fungi and worms break down dead plants and animals and recycle the nutrients.', 2],
    ['Where does the energy in a food chain start?', 'The Sun', ['The biggest animal', 'The soil', 'Water'], 'Plants capture sunlight; animals get energy by eating plants or other animals.', 2],
  ]),
  'sci.data': bank('sci.data', [
    ['Plants given 0, 10 and 20 mL of water daily grew 1, 5 and 9 cm. What pattern do you see?', 'More water, more growth (in this range)', ['Water had no effect', 'Less water, more growth', 'The plants all grew the same'], 'The data rises as water rises. You can’t say it continues forever without more tests.', 2],
    ['Why should a graph have labels and units on its axes?', 'So readers know what was measured and how', ['To fill the empty space around it', 'Labels only matter for bar graphs', 'So the graph looks neat and complete'], 'Without labels, data can’t be understood.', 2],
  ]),
  'sci.chem': bank('sci.chem', [
    ['You mix sand and water. Is it a mixture or a new substance?', 'A mixture: you can separate them again', ['A new substance: the sand dissolves', 'A new substance: it becomes mud', 'Neither: sand and water can’t mix'], 'In a mixture, each part keeps its own properties. The sand settles out again.', 2],
    ['Which is a sign that a chemical reaction happened?', 'Gas bubbles or a color change when two things mix', ['Ice melts into water on a warm day', 'Paper is cut into small pieces', 'Sugar dissolves in a cup of water'], 'New substances can make gas, light, heat or color changes. Melting, cutting and dissolving don’t make new substances.', 2],
    ['Baking soda and vinegar fizz in a sealed bag, and it puffs up. What made the bag puff?', 'A new gas (carbon dioxide) was produced', ['The bag got warm and stretched out', 'Air from outside leaked into the bag', 'The liquid expanded and filled the bag'], 'The reaction makes carbon dioxide gas, which takes up space.', 3],
    ['How can you separate salt from salt water?', 'Let the water evaporate, leaving the salt', ['Pull the salt out with a magnet', 'Pour it through a paper filter', 'Freeze it so the salt sinks out'], 'The water turns to vapor and the salt stays, because salt doesn’t evaporate. Dissolved salt passes right through a filter.', 3],
  ]),
  'sci.innovation': bank('sci.innovation', [
    ['What is a prototype?', 'An early model built to test an idea', ['The final product in stores', 'A drawing of the idea on paper', 'A machine that failed its test'], 'Prototypes let inventors test and improve ideas cheaply.', 1],
    ['A new invention helps people but uses a lot of energy. What should the inventor think about?', 'The trade-off between its benefits and its costs', ['Only how much money it will make', 'Nothing; helping people is all that matters', 'Only how quickly it can be sold'], 'Good innovation weighs the benefits against the costs to people and the environment.', 3],
  ]),
  'sci.systems': bank('sci.systems', [
    ['In a car, which parts work together as a system?', 'The engine, wheels and steering', ['Only the radio and speakers', 'The paint and the seat covers', 'The license plate and cup holders'], 'A system is parts working together for a purpose. The engine, wheels and steering work together to move the car.', 2],
    ['If too many deer live in a forest, the plants are eaten and then deer starve. This shows…', 'Parts of an ecosystem affect each other', ['Deer can live without eating plants', 'A forest can feed any number of deer', 'Deer and plants are not connected'], 'Changing one part of a system changes others.', 3],
  ]),
  'sci.ethics': bank('sci.ethics', [
    ['Why must scientists get permission before testing on people?', 'People have a right to know the risks and choose', ['It makes the study finish faster', 'So the results come out the way they hope', 'So more people sign up to be tested'], 'Informed consent protects people in research: they learn the risks and choose for themselves.', 3],
    ['A scientist’s results don’t match their hypothesis. What should they do?', 'Report the real results honestly', ['Change the numbers to match the guess', 'Leave out the results that don’t fit', 'Run it again until it matches'], 'Honest reporting is the base of good science.', 2],
  ]),
  // ================================================================ critical thinking
  'think.observe': bank('think.observe', [
    ['The sidewalk is wet but the sky is blue. What could explain it?', 'It rained earlier, or a sprinkler was on', ['It is raining right now', 'The sidewalk is wet all the time', 'The blue sky made it wet'], 'Look at clues and think of reasons that fit them.', 2],
    ['What is the best way to notice details in a picture?', 'Look slowly, part by part', ['Glance at it fast one time', 'Close your eyes', 'Only look at the colors'], 'Careful looking finds more details.', 1],
    ['Your plant is drooping and the soil is dry. What is the likely cause?', 'It needs water', ['It has too much sun', 'It is too cold', 'It needs a bigger pot'], 'Put the clues together: dry soil + drooping = thirsty plant.', 2],
  ]),
  'think.compare': bank('think.compare', [
    ['Which is longer: a pencil or a crayon?', 'A pencil', ['A crayon', 'They are the same', 'You can’t tell'], 'Line them up at one end. The one that sticks out farther is longer.', 2],
    ['Cup A has 3 apples. Cup B has 5 apples. Which has more?', 'Cup B', ['Cup A', 'They are the same', 'Neither'], '5 is more than 3.', 1],
    ['How are a cat and a dog the same?', 'Both have fur and four legs', ['Both bark at noises', 'Both like to chase mice', 'Both lay eggs in a nest'], 'Comparing means finding what is the same and what is different.', 2],
    ['How are a bike and a car alike?', 'Both have wheels and take you places', ['Both need gas to make them go', 'Both have pedals you push', 'Both have a motor inside'], 'Comparing means finding what is the same and different.', 1],
  ]),
  'think.directions': bank('think.directions', [
    ['“Fold the paper. Then draw a line.” What do you do first?', 'Fold the paper', ['Draw the line', 'Cut the paper', 'Color it'], 'Words like “then” tell the order of steps.', 1],
    ['A recipe says “preheat the oven” before mixing. Why?', 'So it is hot and ready when the food goes in', ['So you can bake two things at once', 'It does not matter when you do it', 'To clean the oven before you use it'], 'Some steps prepare for later steps.', 2],
    ['Directions say “turn left at the second light.” You pass one light. What next?', 'Keep going to the next light, then turn left', ['Turn left now at this light', 'Turn right at the next light', 'Stop and wait at this light'], 'Count carefully: you’ve only passed the first light.', 2],
  ]),
  'think.consequence': bank('think.consequence', [
    ['You leave your bike outside in the rain all week. What might happen?', 'It could rust', ['It will get shinier', 'Nothing will happen', 'It will ride faster'], 'Water on metal for a long time causes rust.', 2],
    ['If you skip breakfast before a big game, what could happen?', 'You might feel tired and play worse', ['You will play better and faster', 'Nothing, because games are short', 'You will feel light and full of energy'], 'Your body needs fuel to perform.', 2],
    ['You promise to help a friend, then don’t show up. What is a likely consequence?', 'Your friend may trust you less', ['They will trust you more', 'Nothing will change', 'They will forget it by the next day'], 'Actions affect how others see us.', 3],
  ]),
  'think.planning': bank('think.planning', [
    ['You have a project due Friday. What is the best plan?', 'Break it into small parts and do a little each day', ['Do it all on Thursday night', 'Wait until you feel like doing it', 'Do the fun parts and skip the rest'], 'Planning ahead lowers stress and gives time to fix mistakes.', 2],
    ['Your bus leaves at 8:00 and it takes 15 minutes to walk to the stop. When should you leave, at the latest?', 'By 7:45', ['At 8:00', 'At 8:15', 'At 7:00 exactly'], '8:00 − 15 minutes = 7:45. Leave a little earlier to be safe.', 2],
    ['Why make a list before going to the store?', 'So you get what you need and don’t overspend', ['Lists are only for big shopping trips', 'To make shopping take longer', 'So you can buy more things at once'], 'A list keeps you focused on your plan, so you don’t forget things or spend too much.', 1],
  ]),
  'think.opportunity': bank('think.opportunity', [
    ['You can go to a party or study for a test, not both. If you go to the party, what is the opportunity cost?', 'The study time (and maybe a better test score)', ['The fun you have at the party', 'Nothing, since you chose the party', 'The time you spend at the party'], 'Opportunity cost is the best thing you give up when you choose.', 2],
    ['You spend $20 on a game. What is one opportunity cost?', 'Other things that $20 could have bought', ['The game you chose to buy', 'Nothing, since you wanted the game', 'The tax added to the price'], 'Every choice gives up something else. The $20 could also have been saved.', 2],
    ['Why is it useful to think about opportunity cost?', 'It shows what you give up, so you choose wisely', ['It makes every choice quick and easy', 'It means you never spend money', 'It tells you which choice is free'], 'Comparing what you gain to what you lose leads to better decisions.', 3],
  ]),
  'think.evaluate': bank('think.evaluate', [
    ['A friend says “Everyone is buying these shoes, so they must be the best.” What is wrong with this?', 'Popular doesn’t mean best; check the quality', ['Nothing; if many buy it, it is best', 'Expensive shoes are always the best', 'Friends never know about shoes'], 'This is the bandwagon idea. Look for evidence, like quality and price, instead.', 3],
  ]),
  'think.risk': bank('think.risk', [
    ['Which is a lower-risk way to save money?', 'A bank savings account', ['Lending it to a stranger', 'Betting it on a game', 'Hiding it under a rug'], 'Banks keep money safe and insured.', 2],
    ['Before trying a new skateboard trick, what lowers the risk?', 'Wear a helmet and pads and practise on flat ground', ['Try it on the stairs to learn faster', 'Go fast so you don’t lose balance', 'Skip the helmet so you can move freely'], 'Safety gear and easy practice reduce the chance of injury.', 2],
    ['Higher reward usually comes with…', 'Higher risk', ['No risk', 'Lower risk', 'Guaranteed success'], 'Choices that could pay off big usually could also lose big.', 1],
  ]),
  'think.evidence': bank('think.evidence', [
    ['Which is the strongest evidence that a new game is popular?', 'It sold 2 million copies in a month', ['The ad says it’s amazing', 'My best friend says it is great', 'It has a really cool cover'], 'Data from many people is stronger than one opinion or an ad.', 2],
    ['A website says chocolate cures colds. What should you check first?', 'Who wrote it and whether doctors or studies agree', ['Whether the website looks modern', 'If it has lots of exclamation points', 'Nothing; it’s online so it’s true'], 'Check the source and look for reliable evidence.', 3],
  ]),
  'think.ethics': bank('think.ethics', [
    ['You find $20 on the floor of a store. What is the fair thing to do?', 'Turn it in, since the owner may come back', ['Keep it, since finders are keepers', 'Keep it if no one saw you pick it up', 'Leave it there for someone else'], 'Turn it in to the store. Treat others how you’d want to be treated if you lost money.', 2],
    ['A friend asks to copy your homework. What is the best choice?', 'Offer to help them understand it instead', ['Let them copy, since friends share', 'Tell the whole class what they asked', 'Let them copy just this one time'], 'Helping them learn is kind and honest.', 3],
    ['Why is honesty important at work?', 'People need to trust you to depend on you', ['It only matters if you get caught', 'Only bosses need to be honest', 'Small lies help work go faster'], 'Trust is the base of teamwork.', 2],
  ]),
  'think.problem': bank('think.problem', [
    ['Your phone won’t charge. What is a smart first step?', 'Try a different cable or outlet to find the problem', ['Buy a new phone and a new charger', 'Leave it plugged in and wait a week', 'Shake the phone to fix the battery'], 'Test one thing at a time to find which part is the cause.', 2],
    ['A problem is too big to solve at once. What helps?', 'Break it into smaller steps', ['Give up and try another one', 'Wait for it to fix itself', 'Do everything at once'], 'Smaller steps are easier to solve and check.', 2],
    ['You tried a solution and it didn’t work. What should you do?', 'Figure out why, then try a different approach', ['Keep repeating the same thing', 'Quit, since it must be impossible', 'Blame someone else for the problem'], 'Learning from what failed leads to better solutions.', 3],
  ]),
  'think.longterm': bank('think.longterm', [
    ['You can earn $10 today or $15 next week for the same job. Which choice shows long-term thinking?', '$15 next week, if you don’t need the money now', ['$10 today, since sooner is always better', '$10 today, because a week is too long', 'Neither; hold out for a bigger offer'], 'Waiting can pay off when you can afford to wait.', 2],
    ['Why do people save for retirement when they are young?', 'Money has more time to grow with compound interest', ['Young people have nothing else to buy', 'Banks make young people save first', 'It doesn’t matter when you start'], 'Starting early gives growth more years to build.', 3],
  ]),
  'think.persuasion': bank('think.persuasion', [
    ['An ad shows a famous athlete drinking a soda. What technique is this?', 'Celebrity endorsement', ['Scientific evidence', 'Price comparison', 'Fact check'], 'A famous person’s face is meant to make you want it, not prove it’s good.', 2],
    ['“Only 3 left! Buy now!” is meant to make you…', 'Hurry and not think it through', ['Compare prices carefully', 'Wait a week for a better deal', 'Read reviews before you decide'], 'Creating urgency is a common pressure tactic.', 2],
  ]),
  'think.negotiate': bank('think.negotiate', [
    ['You want a later bedtime. What is the best way to ask?', 'Calmly give a reason and offer something in return', ['Demand it loudly until they give in', 'Just stay up late and see if they notice', 'Sulk until they feel bad and say yes'], 'Good negotiation gives reasons and looks for a solution both sides like, such as offering to finish homework first.', 2],
    ['In a negotiation, what is a “win-win”?', 'A deal where both sides get something they want', ['A deal where one side gets everything', 'A deal where neither side gives up anything', 'A deal where the loudest person wins'], 'Win-win deals last because both sides are satisfied.', 1],
  ]),
  'think.strategy': bank('think.strategy', [
    ['A shop’s sales drop every winter. What is a smart strategy?', 'Plan winter promotions or products people want then', ['Close the shop for good after winter', 'Raise prices in winter to make up for it', 'Do nothing and hope next winter is better'], 'Strategy plans for patterns you can predict.', 3],
    ['Why might a company spend money now on training workers?', 'Skilled workers do better work and save money later', ['Training is free, so there is no cost', 'To spend money before the year ends', 'To keep workers busy when sales are slow'], 'Strategic choices invest now for later benefit.', 3],
  ]),
  'think.systems': bank('think.systems', [
    ['A city adds a new highway, and soon traffic is as bad as before. Why might that happen?', 'Easier driving draws more drivers, filling the lanes', ['New roads always wear out in a year', 'Drivers slow down to look at the new road', 'More roads always mean less traffic'], 'Systems can respond in ways that cancel a fix. This is called induced demand.', 3],
    ['Why does fixing one part of a system sometimes cause a new problem elsewhere?', 'The parts are connected, so changes ripple through', ['Each part of a system works on its own', 'The fix was done wrong every time', 'New problems are just bad luck'], 'Thinking about connections helps predict side effects.', 3],
  ]),
  'think.uncertainty': bank('think.uncertainty', [
    ['The forecast says 30% chance of rain. What is a sensible choice?', 'Bring a small umbrella just in case', ['Cancel all of your plans', 'Assume it will rain for sure', 'Assume it can’t rain'], '30% means rain is possible but not likely. A small precaution is wise.', 2],
    ['Why is it smart to have a backup plan?', 'Things don’t always go as expected', ['A good plan never fails', 'It wastes time you could use', 'Only for big emergencies'], 'Backup plans reduce the harm when the unexpected happens.', 3],
  ]),
  'think.leadership': bank('think.leadership', [
    ['A team member keeps missing meetings. What would a good leader do first?', 'Talk privately to understand why', ['Yell at them in front of everyone', 'Kick them off right away', 'Ignore it'], 'Understanding the cause helps find a fair solution.', 3],
    ['What makes a leader trustworthy?', 'Doing what they say and treating people fairly', ['Always being the loudest in the room', 'Never admitting to any mistakes', 'Making every decision on their own'], 'Trust comes from honesty and fairness.', 2],
  ]),
};
// a few templated items so the most-used thinking skills never run dry
BANKS_B['think.planning'].push(() => { const leave = pick([7, 8]), mins = pick([10, 20, 25, 35]); const t = leave * 60 - mins, hh = Math.floor(t / 60), mm = t % 60; const fmt = (h, m) => `${h}:${String(m).padStart(2, '0')}`; return { type: 'choice', skill: 'think.planning', dok: 2, q: `School starts at ${leave}:00. It takes ${mins} minutes to get there. When should you leave, at the latest?`, a: fmt(hh, mm), o: [fmt(hh, mm), `${leave}:${String(mins).padStart(2, '0')}`, `${leave}:00`], why: `${leave}:00 − ${mins} minutes = ${fmt(hh, mm)}. Leaving a few minutes earlier gives you a cushion.` }; });
// unit prices and value comparisons belong with rates (grades 5–6), not early comparing
BANKS_B['math.ratio'] = (BANKS_B['math.ratio'] || []).concat([
  () => { const a = ri(2, 5), n = ri(2, 4), b = a * n + pick([-2, -1, 0, 1, 2]); const per = b / n, key = per < a ? 'Pack A costs less' : per > a ? 'The single costs less' : 'They cost the same';
    const each = Number.isInteger(per) ? `= $${per}` : `≈ $${per.toFixed(2)}`;
    return { type: 'choice', skill: 'math.ratio', dok: 2, q: `Pack A: ${n} for $${b}. Single: $${a} each. Which is cheaper per item?`, a: key, o: ['Pack A costs less', 'The single costs less', 'They cost the same'], why: `Pack A: $${b} ÷ ${n} ${each} each. The single is $${a}. ${key === 'They cost the same' ? 'They cost the same per item.' : (key === 'Pack A costs less' ? 'Pack A' : 'The single') + ' is cheaper per item.'}` }; },
  ...bank('math.ratio', [['Juice A: $3 for 1 bottle. Juice B: $5 for 2 bottles. Which costs less per bottle?', 'Juice B', ['Juice A', 'They cost the same', 'You can’t tell'], 'B: $5 ÷ 2 = $2.50 a bottle, less than $3.', 2]]),
]);
BANKS_B['think.longterm'] = (BANKS_B['think.longterm'] || []).concat(bank('think.longterm', [['Two backpacks cost the same. One has a 1-year warranty, the other 5 years. Which is the better deal?', 'The 5-year one, if everything else is equal', ['The 1-year one, since it costs less', 'Neither; a warranty adds no value', 'Either one; they are exactly the same'], 'Same price, more protection means better value.', 2]]));
BANKS_B['think.opportunity'] = (BANKS_B['think.opportunity'] || []).concat(bank('think.opportunity', [['Store A is closer but costs $2 more. Store B is a long bus ride away. Why might Store A be the better choice?', 'The bus fare and time could cost more than $2', ['Closer stores always have better things', 'Price is the only thing that matters', 'Prices never matter when you shop'], 'Compare total costs, including time and travel.', 3]]));
