The Core Concept

Users take a five-compass personality quest.

Each compass represents one dimension of personality.

Power — Viking ↔ Wizard
Morality — Hero ↕ Goblin

Order — Knight ↔ Pirate
Temperament — General ↕ Jester

Discipline — Samurai ↔ Cowboy
Wisdom — Sensei ↕ Trickster

Social Style — Princess ↔ Tomboy
Authority — Queen ↕ Rogue

Risk — Gladiator ↔ Philosopher
Impulse — Monk ↕ Gambler

Each compass asks 5–6 questions.

Instead of forcing users into one quadrant immediately, each answer nudges them along both axes.

After the questions, you calculate their position on the grid.

The result becomes their archetype for that compass.

⸻

The Flow of the Quiz

The quiz should feel like a lighthearted RPG journey.

Start screen:

“Welcome to the Totally Scientific Archetype Compass™
Built with approximately the same level of peer-review as Myers-Briggs.”

Then a disclaimer:

“This quiz is not scientifically validated.
But neither is your horoscope and you still read that.”

Then the five sections appear like levels.

Level 1: Power Compass
Level 2: Order Compass
Level 3: Discipline Compass
Level 4: Social Style Compass
Level 5: Risk Compass

Progress bar slowly fills like a game.

⸻

Question Style

Questions should be scenario-based rather than abstract.

Example from Power Compass:

A crisis appears and everyone looks at you.

A — Grab the nearest tool and jump into action
B — Step back and plan the smartest approach
C — Try something wild and see if chaos solves it
D — Exploit a clever loophole nobody else noticed

Each answer moves the user along the axes.

Example scoring:
A = Viking + Hero
B = Wizard + Hero
C = Viking + Goblin
D = Wizard + Goblin

After 5–6 questions, you average the score.

That determines where they land on the grid.

⸻

The Final Identity

Once all five compasses are calculated, users receive their full archetype stack.

Example result:

Sage Hero
Pirate Captain
Cowboy Sage
Rogue Adventurer
Chaotic Thinker

Displayed like a fantasy title:

The Maverick Visionary

Then the funny write-up appears.

⸻

Example Result Write-Up

The Maverick Visionary

Your personality sits somewhere between strategic genius and charming troublemaker.

You solve problems with clever thinking rather than brute force, and you’re happiest when rules are optional suggestions rather than mandatory obligations.

You probably enjoy:

• inventing things
• questioning authority
• learning through experimentation
• wandering down intellectual rabbit holes

You may struggle with:

• boredom
• bureaucracy
• people who say “that’s how we’ve always done it”

⸻

Famous People with Similar Archetype Patterns

These are playful comparisons rather than scientific matches.

Steve Jobs
Leonardo da Vinci
Mark Twain
Tony Stark (fiction)

The site should explicitly say:

“These comparisons are based on vibes, historical mythology, and mild internet chaos.”

⸻

Creating the 32 or 64 Personality Types

This is where it gets interesting.

Each compass produces one archetype.

But the primary compass (Power Compass) determines the major personality category.

There are four possible base types there:

Warrior Hero
Sage Hero
Goblin Raider
Goblin Scholar

Then the other compasses refine it.

That creates 64 total combinations if you divide each axis further.

But you don’t need to show all 64 explicitly.

Instead give each result a nickname.

Examples:

The Noble Commander
The Rebel Inventor
The Charming Outlaw
The Enlightened Strategist
The Trickster Genius
The Fearless Explorer
The Diplomatic Queen
The Rogue Scholar

People love labels.

⸻

Visual Layout Idea

Picture a results page with five small compass charts.

Each one shows where the user landed.

Example:

Power Compass
(dot slightly toward Wizard-Hero)

Order Compass
(dot strongly Pirate-General)

Discipline Compass
(dot Cowboy-Sensei)

This visual feedback makes it feel more legitimate than it actually is.

Which is exactly the same magic trick Myers-Briggs uses.

⸻

Fun Feature That Would Make It Viral

Let users generate friend comparisons.

Example:

You — Pirate Captain Cowboy Sage
Friend — Knight Commander Samurai Master

Then the site says:

“You two will either start a revolutionary startup or accidentally overthrow a small nation.”

People will share that.

⸻

Tech Approach (simple version)

Front end

React or Next.js

Each question adds values to a score object:
{
  vikingWizard: 0,
  heroGoblin: 0,
  knightPirate: 0,
  generalJester: 0,
  samuraiCowboy: 0,
  senseiTrickster: 0,
  princessTomboy: 0,
  queenRogue: 0,
  gladiatorPhilosopher: 0,
  monkGambler: 0
}

Answers add ± values.

At the end you calculate quadrant position.

Then map to archetype names.

The Key to Making This Work

Three ingredients make personality quizzes addictive:

Clarity
People immediately understand the archetypes.

Story
Results feel like a character description.

Humor
The quiz admits it’s nonsense while still being weirdly insightful.

That combination keeps people sharing.