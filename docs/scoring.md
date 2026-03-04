Scoring System

The quiz operates on 10 personality axes.

Each answer adds or subtracts values from these axes.

⸻

Axis List
Axis - Meaning
VW - Viking vs Wizard
HG - Hero vs Goblin
KP - Knight vs Pirate
RJ - General vs Jester
SC - Samurai vs Cowboy
ST - Sensei vs Trickster
PT - Princess vs Tomboy
QR - Queen vs Rogue
GP - Gladiator vs Philosopher
MA - Monk vs Gambler

Compass Definitions

Each compass uses two axes.

Power Compass

X axis: VW
Y axis: HG

Order Compass

X axis: KP
Y axis: RJ

Discipline Compass

X axis: SC
Y axis: ST

Social Style Compass

X axis: PT
Y axis: QR

Risk Compass

X axis: GP
Y axis: MA

⸻

Quadrant Determination

For each compass:
x > 0 and y > 0 → top right
x < 0 and y > 0 → top left
x > 0 and y < 0 → bottom right
x < 0 and y < 0 → bottom left

Each quadrant corresponds to an archetype.

⸻

Personality Code Generation

The final personality code uses 6 axes:
VW
HG
KP
RJ
SC
MA

Each axis produces one letter.

Example:
VW → V or W
HG → H or G
KP → K or P
RJ → R or J
SC → S or C
MA → M or A

Example result:
WHPRCA

Archetype Title Selection

The first two letters determine the family.
VH → Warrior Hero
WH → Sage Hero
VG → Goblin Raider
WG → Goblin Scholar

The remaining four letters determine a number from 0-15.

Bit order:
KP
RJ
SC
MA

Index calculation:
bit(KP) + 2*bit(RJ) + 4*bit(SC) + 8*bit(MA)

That index selects one of the 16 titles in the family.


We’ll compute two things:
	1.	Five compasses (each 2D; determines a quadrant label)
	2.	One 64-type code using six binary axes (MBTI parody)

2.1 Axes

We keep all 10 axes for the full profile:
	•	VW: Viking (+) vs Wizard (-)
	•	HG: Hero (+) vs Goblin (-)
	•	KP: Knight (+) vs Pirate (-)
	•	RJ: geneRal (+) vs Jester (-)
	•	SC: Samurai (+) vs Cowboy (-)
	•	ST: Sensei (+) vs Trickster (-)
	•	PT: Princess (+) vs Tomboy (-)
	•	QR: Queen (+) vs Rogue (-)
	•	GP: Gladiator (+) vs Philosopher (-)
	•	MA: Monk (+) vs gAmbler (-)

2.2 Question weights

Each question has 4 answers, each answer adds deltas like:
	•	{ "VW": +2, "HG": +2 } meaning “more Viking + more Hero”
	•	Use ±2 as standard weight so totals feel meaningful.

2.3 Compass quadrant classification

For each compass:
	•	Compute x and y from its two axes
	•	Quadrant by sign:

Example Power Compass:
	•	x = VW
	•	y = HG
	•	Quadrants:
	•	x>0,y>0 = Warrior Hero
	•	x<0,y>0 = Sage Hero
	•	x>0,y<0 = Goblin Raider
	•	x<0,y<0 = Goblin Scholar

Tie-breaking:
	•	If x==0, treat as leaning negative (Wizard / left) unless you want coinflip or “Balanced”
	•	If y==0, treat as leaning positive (Hero / up)
(These defaults make results feel a bit more “aspirational,” which people like.)

2.4 64-type code (MBTI parody)

Pick six binary axes (2^6 = 64 outcomes):
	•	VW → V or W
	•	HG → H or G
	•	KP → K or P
	•	RJ → R or J
	•	SC → S or C
	•	MA → M or A

Type code format: V|W + H|G + K|P + R|J + S|C + M|A
Example: WHPRCA (Wizard, Hero, Pirate, geneRal, Cowboy, gAmbler)

2.5 64-type title mapping

We map codes deterministically:
	•	First two letters (VH, WH, VG, WG) choose one of 4 families
	•	Remaining 4 letters (K/P, R/J, S/C, M/A) choose one of 16 titles within the family (order matters)

We’ll provide:
	•	A list of 16 titles per family (you already have these)
	•	A generator that assigns titles in a fixed bit order:
	•	bit0 = KP (K=0, P=1)
	•	bit1 = RJ (R=0, J=1)
	•	bit2 = SC (S=0, C=1)
	•	bit3 = MA (M=0, A=1)

Index = bit0 + 2bit1 + 4bit2 + 8*bit3 → 0..15