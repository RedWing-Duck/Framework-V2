# GAME DESIGN DOC — Week 01: THIS PLACE HAS A BIG FOOTPRINT
**Revision 2 (post-QA).** Matches the shipped build (`dist/big-footprint.html`).
Changes from revision 1 are marked **[REV2]**, with the decision or bug that caused them.

## 1. Chat's winning answers
- **Setting:** A cartel kingpin's penthouse palace (white marble, gold trim, rooftop private zoo)
- **Theme:** An escaped prisoner has freed the kingpin's rare animals, including a Bigfoot-like creature. You're a PI posing as an investor to steal the cartel's secrets and escape before Bigfoot or the guards catch you.
- **Genre/format:** RPG
- **Extra chat picks:**
  - Cover story: bookstore investor pitching a partnership on the empty lot next door, offering a name plaque
  - Kingpin: self-styled legit businessman, charming, short fuse; Mexican cartel lore + Italian mob family flavor
  - Vibe: quippy noir that turns into a thriller
  - Secrets hidden in: grand piano (mirrored lid), hippo fountain, hidden door in the double staircase
  - Animals: Bigfoot, peacocks, giraffe, black jaguar, lemurs
  - Tour strikes: 3, the Don angrier each time
  - Clock: tight (plan your route)
  - Win: escape with at least 2 of 3 secrets
- **Lore nods** (easter eggs only; never name real people): hippo zoo, gold-plated guns, hidden staircase/tunnel escapes, rubber-banded ledger, canned-chile shipments, marble-and-gold palace, Sunday gravy family dinners, vanity plaques on public buildings.

## 2. Premise
You're a private investigator walking into Don Salvatore "Chava" Bellandi-Reyes's penthouse as "Walter Pryce," a bookstore investor with a plaque and a smile. The Don gives you the grand tour, and every brag is a clue. When his freed animals turn the palace into a zoo stampede, you have minutes to grab his secrets and walk the tour route back out.

## 3. Win / lose
Two phases:
- **TOUR (R1 to R11):** the Don leads, the clock is off.
- **ESCAPE (starts on entering R11):** you're alone, the clock runs, and all exits are open.

**Win condition:** during ESCAPE, type "down" in R1 while holding at least 2 of: LEDGER, SHIPPING MANIFEST, DEAL PHOTOS. With fewer than 2, the elevator won't go (you refuse to leave empty-handed); no lose.

**Lose conditions:**
- L1 Cover Blown: 3 tour strikes.
- L2 Caught: wrong response to a guard confrontation.
- L3 Big Footprint: the Bigfoot clock hits 0.

**Endings: 5.** W1 Clean Getaway (2 secrets), W2 Clean Sweep (3 secrets), L1, L2, L3.
After any ending, RESTART starts over and QUIT returns to the start menu.

## 4. Scope cap
| | Max | Used |
|---|---|---|
| Rooms | 12 | 12 |
| Puzzles | 3 | 3 |
| NPCs | 3 | 3 |
| Items | 8 | 5 |

Animals other than Bigfoot are scenery, not NPCs.
**[REV2]** Fixed scenery (GOLD RIFLE, PIANO, staircases, HIPPO, AVIARY, GIRAFFE GATE, JAGUAR GATE) can be examined but not carried. It doesn't count toward the item cap. Things named only in room text (lemurs, peacocks, portraits, signs, table, button, humidor, bars, footprints) can also be examined (BR-07). None of them is listed under "You see:".

## 5. Map
| ID | Name | Exits | Locked? |
|---|---|---|---|
| R1 | Private Elevator | north->R2, down->WIN | Don blocks "down" during tour |
| R2 | Grand Foyer (double staircase) | south->R1, west->R3, east->R4, north->R5, up->R6 | no |
| R3 | Trophy Room | east->R2 | no |
| R4 | Music Salon | west->R2 | no |
| R5 | Dining Hall | south->R2 | no |
| R6 | Upper Landing | down->R2, west->R7, east->R9 | no |
| R7 | Gallery Hall | east->R6, north->R8 | no |
| R8 | Atrium (hippo fountain) | south->R7, north->R10 | no |
| R9 | The Don's Office | west->R6 | no |
| R10 | Aviary | south->R8, north->R11 | no |
| R11 | Zoo Terrace | south->R10, east->R12 | no |
| R12 | Broken Enclosure | west->R11 | no |

**Tour movement rule:** during TOUR, only the exit to the Don's next stop works. For other exits, the Don blocks you ("Private, amigo"), with no strike. The Don names the direction of each next stop out loud. While a tour question is pending, the next-stop exit repeats the question instead.
Tour order: R1 n R2 w R3 e R2 e R4 w R2 n R5 s R2 u R6 e R9 w R6 w R7 n R8 n R10 n R11.
**[REV2]** Stair words move you too: `upstairs`, `downstairs`, `go upstairs`, `climb stairs` (BR-06).
**[REV2]** Punctuation in typed input is ignored everywhere, so `north.` and `say giraffe!` work (BR-01).

## 6. Items
| ID | Name | Found in | Used for | Consumed? |
|---|---|---|---|---|
| I1 | BRIEFING CARD | start inventory | answers the Office question (cover name, bookstore, plaque) | n |
| I2 | GOLD COIN | Don gives in R9 after Office question | use on HIPPO (P2) | y |
| I3 | LEDGER | R4 piano (P1) | secret #1 | n |
| I4 | SHIPPING MANIFEST | R8 fountain (P2) | secret #2 | n |
| I5 | DEAL PHOTOS | R2 staircase (P3) | secret #3 | n |

Secrets go straight into inventory when revealed. Items are only consumed on their correct target. Wrong-target use keeps the item.
**[REV2]** Secrets can't be dropped ("this is evidence"). `take` on a coin or secret you already carry says "You already have that." and costs no turn (BR-02). `give` works the same as `use` (BR-10). A solved puzzle reports the running total, "Secrets: N of 3", whatever order they're found in (ED-05).

## 7. Puzzles
| ID | Room | Solution (ESCAPE) | Clue dots | Reward | Hint |
|---|---|---|---|---|---|
| P1 | R4 Music Salon | play CIELITO LINDO | R4 tour: only one song is ever played on her, his mother's. R5 tour: Mama Rosa sang "Cielito Lindo" every Sunday. | the mirrored lid springs a compartment -> LEDGER | "He told you whose song this piano keeps. He told you the title over dinner." |
| P2 | R8 Atrium | use GOLD COIN on HIPPO | R9: the Don gives you a gold coin as your "first dividend." R8: he flicks his own coin into the hippo's mouth: "She only opens up for gold." | the hippo's jaw opens -> SHIPPING MANIFEST | "The hippo has expensive taste. So did the Don's handshake." |
| P3 | R2 Grand Foyer | push THIRTEENTH STEP | R2 tour: "Left stairs, twelve steps, for family. Right stairs, thirteen, for business. Never trust the thirteenth step." | a hidden door slides open -> DEAL PHOTOS | "Business has one more step than family." |

Wrong attempts: a message, the item is kept, a turn is spent.
**[REV2] Decisions** (Script suggestions 1 and 4, CP-03, ED-03, ED-08):
- P1 accepts only "play cielito lindo" (plus the wrong-attempt nudge).
- Playing the piano again after P1 says "You already found what she was hiding." and costs no turn.
- After each puzzle is solved, its room and examine text show it solved.
- In ESCAPE the thirteenth step "sits a hair higher than the rest".

### Tour system (strikes)
- **Strike objects:** GOLD RIFLE (R3), PIANO (R4), THIRTEENTH STEP / STAIRCASE (R2), HIPPO (R8). Any take, touch, open, push, play, or use-on during TOUR = 1 strike. Nothing is consumed. Examine is free and safe.
- **Tour questions:** the Don asks on entering the room. The tour won't continue until you answer right. Each wrong answer = 1 strike, and he asks again.
  - Q1 (R5): "Sunday dinner: my mother's pozole or my nonna's Sunday gravy?" Answer: say BOTH (clue, R2: "In this house we never choose between family.")
  - Q2 (R9): "Remind me, what's your bookstore called?" Answer: say DOG-EARED PAGE (clue: BRIEFING CARD)
  - **[REV2]** Q1 accepts any answer containing "both" unless it also has not, neither, nor, no or never (BR-04). Q2 also accepts "dog eared". `say` with no words repeats the question with no strike (BR-03). Talking to the Don while a question is pending repeats it (BR-09).
- **Strike 1:** smile tightens. **Strike 2:** he stops smiling. **Strike 3:** L1 Cover Blown. **[REV2]** Wrong answers use the same escalation in their own words (ED-01).

### Escape system (clock + guards)
- **Bigfoot clock:** 18 turns, starting on entering R11. **[REV2]** Entering R11 costs no turn, so the first command in ESCAPE leaves 17 (Script suggestion 2).
- Every command costs 1 turn except look, examine/x, inventory, status, help, hint. **[REV2]** These also cost nothing:
  - commands the game doesn't understand (designer decision after Milestone A);
  - `run` with no guard present (BR-08);
  - `open gate` without naming one (CP-02);
  - "already have that" (BR-02);
  - replaying the solved piano (CP-03).
- Warnings at 6, 3, and 1 turns left (thuds, then growls, getting closer). At 0: L3.
- Exits are described by landmarks from the tour, not compass directions (compass commands still work). **[REV2]** The "Exits:" line is hidden in ESCAPE, and landmark text holds whichever way you walk (ED-06).
- **Alibis:** R10 "open AVIARY" (peacocks), R11 "open GIRAFFE GATE", R11 "open JAGUAR GATE". Each animal released = 1 alibi, usable once. Gates are sealed during TOUR. **[REV2]** Room and gate text change once an animal is out (ED-02).
- **Guard checkpoints:** first ESCAPE entry into R7 and into R2. Guard NANDO stops you. Your next turn-costing command must be "run" (works once per game) or "say [ANIMAL]" for an animal you released and haven't used (PEACOCKS / GIRAFFE / JAGUAR). Anything else: L2 Caught. Once resolved, that checkpoint is done.
  - **[REV2]** "say PEACOCK" (singular) also works (QA-01).
  - **[REV2]** Nando's greeting and the help text point at `run` (ED-07).
  - **[REV2]** A wrong response goes straight to CAUGHT, with no "I don't understand" line first (CP-01).
  - Both checkpoints fire on every run, since R7 is the only route out (Script suggestion 3).

## 8. NPCs
| ID | Name | Where | Role | Does |
|---|---|---|---|---|
| N1 | DON CHAVA (Salvatore Bellandi-Reyes) | tour, R1-R11 | guide, quiz master | gives clues, Q1, Q2, GOLD COIN; flees at R11 when the animals break loose |
| N2 | NANDO (head guard) | checkpoints R7, R2 (ESCAPE) | obstacle | fooled by an alibi or outrun once |
| N3 | BIG TONY (Bigfoot) | offstage, heard only | the clock | escaped from R12; catches you at 0 turns |

Offstage only: the escaped prisoner (the Don's former accountant, who freed the animals).

## 9. Critical path (W1, 2 secrets)
**[REV2]** The clock annotations are corrected to the verified build (Critical Path QA). Entering R11 costs no turn, so the path ends with **7** turns to spare, not 6. The W2 detour ends with **4**, not 3. Numbers in brackets are the clock after the step.

**Tour**
1. north
2. west
3. east
4. east
5. west
6. north (the Don asks Q1)
7. say BOTH
8. south
9. up
10. east (the Don asks Q2)
11. say DOG-EARED PAGE (receive GOLD COIN)
12. west
13. west
14. north
15. north
16. north (ESCAPE begins, clock 18)

**Escape**
17. open GIRAFFE GATE (17)
18. south (16)
19. south (15)
20. use GOLD COIN on HIPPO (14, MANIFEST)
21. south (13, Nando stops you)
22. run (12)
23. east (11)
24. down (10, Nando stops you)
25. say GIRAFFE (9)
26. push THIRTEENTH STEP (8, PHOTOS)
27. south (7)
28. down (WIN, 7 turns to spare)

**W2 detour:** after step 26, east (7) / play CIELITO LINDO (6, LEDGER, first warning) / west (5), then south (4) and down. Wins with 4 to spare.

## 10. Tone & style
- **Tone:** quippy noir during TOUR (dry one-liners, velvet menace); tense thriller from R11 on (short, urgent sentences). Teen-friendly.
- **Voice:** second person, present tense.
- **Description length:** 2-4 sentences per room; ESCAPE descriptions 1-3.
- **Avoid:** real people's names, drug names or drug-making details, gore, on-screen killing, slurs, mocking accents or heritage stereotypes. Heritage shows up through family, food, music, and architecture.

## 11. Credits
**Retroment Gaming.** Week 01 was a process check (a dry run), so there are no chat contributors. The intro screen already reads "A Retroment Gaming production."
