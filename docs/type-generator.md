# Type Code & Title Generation

## Type Code Axes (6)
VW, HG, KP, RJ, SC, MA

Letter mapping:
- VW: score>0 => V else W
- HG: score>0 => H else G
- KP: score>0 => K else P
- RJ: score>0 => R else J
- SC: score>0 => S else C
- MA: score>0 => M else A

Type code order:
[V/W][H/G][K/P][R/J][S/C][M/A]

Family key:
First 2 letters (VH, WH, VG, WG)

## Title index inside family (0..15)
We form bits from remaining 4 letters in this order:
KP, RJ, SC, MA

bit = 0 if first letter of the pair, bit=1 if second letter of the pair:
- KP: K=0, P=1
- RJ: R=0, J=1
- SC: S=0, C=1
- MA: M=0, A=1

index = bit(KP) + 2*bit(RJ) + 4*bit(SC) + 8*bit(MA)

Title = families[familyKey].titles16[index]