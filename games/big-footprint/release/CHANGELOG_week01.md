# Changelog — Week 01: THIS PLACE HAS A BIG FOOTPRINT
Build: `dist/big-footprint.html` (single file, runs offline). Branch `claude/penthouse-heist-game-o7k6w5`.
Credits: **Retroment Gaming.** Week 01 was a process check (a dry run), so there are no chat contributors.

## Final wording sweep
Every noun in every room, tried with examine, search, take, touch, open, push, smell, listen and talk, at every tour stop and through the escape (about 2,700 commands), then read line by line for sense in that place and moment.
- **Looking through a doorway:** a room you haven't been to shows its first sentence (no more "still" or "again" before you've seen it); a room you know shows its revisit line; in the escape, the room's escape text. Direction sentences are dropped, since you're not standing in that room. The elevator from outside is "doors open, mirrors gleaming", not your reflection.
- **Things in the right category:** small objects (the bent spoon, napkins, place cards, letter opener, delivery slip, papers, Nando's cap, feathers, tray, shoebox, tube) get their own replies instead of "Too heavy, too bolted"; smoke, sounds, rain, the alarms and the city can't be picked up or knocked on; the roof terrace and the enclosure use outdoor lines instead of "polish and marble dust".
- **Things behind glass** in the trophy room are searched with your eyes, not "behind it and underneath it".
- **People who aren't there** (the elevator man, the accountant, Big Tony, the guard on the tour) say so for every verb, instead of "Nothing happens" or "Nobody by that name".
- **Smell and listen** make sense everywhere: the piano, Pepita and her fountain, the step, the lilies, the grapes, the pots, the palms, the rain, the city, the animals. The Script's merged fixture line ("The building hums. In escape, it hums and thuds.") is now two lines, one per phase, and furniture only creaks once the floor starts shaking.
- **Fixes along the way:** "take place card" no longer answers as your business card; the humidor opens; the elevator doors are already open in the escape; the letter opener is gone in the escape for every verb; the searched step after it's pressed; no stray "You see: GOLD RIFLE" or "You see: PIANO" under the escape revisits; talking to objects gets a free line.
- New test: the sweep itself, 2,390 commands, none may print "Nothing happens", "Nobody by that name", a stray "You see:", the merged hum line, or a doorway "again".

## Playtest round 4 fixes (polish build, fresh phrasings)
- **P2s:** F-01 to F-03.
  - Look closer: examining any word the room just showed you answers with the sentence it came from ("You look closer. ..."), free. This closes the missing-noun class for good; a new test examines every word read in every room, two levels deep (3,616 commands).
  - greet, chat and introduce talk; whisper, mutter, reply, answer and respond say.
  - Second-wave hostile verbs: slap, headbutt, bite and the rest hit; vandalize and knock over break; set fire, ignite and light burn; poison; scream at provokes.
  - Fixed a crash when examining the terrace from the aviary on the tour.
- **P3s:** F-04 to F-09.
  - Thanks and compliments to the Don get his thank and flatter lines; the "you" topic needs "about me / about you".
  - More topic words (father, god, photos, lion, horse) and plurals.
  - Petting Pepita gets her own strike line.
  - Asking or talking to the Don in the elevator gets the "You'll meet him in a second" line.
  - Bare "show" and "give" ask what, to whom.
  - The flashlight at a checkpoint has a line.

## Playtest round 3 fixes (polish build, Bartle graph)
- **P2s:** BG-01 to BG-06.
  - "Things examined" counts only the nouns a W2 route can reach (100), so the "every corner" tease can be earned. The six escape-only nouns are reported as "Bonus finds: n of 6".
  - About 40 nouns read in examine and dialogue text can be examined now (aliases to the line that mentions them).
  - Talking to animals gets in-voice lines.
  - Lemurs, Big Tony and Pepita at a checkpoint still get you CAUGHT, but with honest openers.
  - Hostile verbs map onto hit, break, push and steal. The new `provoke` verb gets the Don's lines (no strike). Throwing food gets the pozole line.
  - Using the coin on Pepita after she's open is free and says so.
- **P3s:** BG-07 to BG-13.
  - No stray "You see:" lines under the atrium and aviary escape revisits.
  - "x step" in the foyer examines the thirteenth step.
  - The step and the piano have their own first-strike lines.
  - New Don topics: dinner (before and after Q1) and family; reina, the empty chair and the elevator find their topics.
  - "listen to" or "smell" an unknown thing gives the room's line; `swim` has lines.
  - "take all" / "drop all" get "One thing at a time, detective."
  - "x don" in the elevator, before you meet him, gets a line.

## Playtest round 2 fixes (polish build)
- **P2s:** NB-01 to NB-04.
  - A bare `say` at a checkpoint is a free repeat.
  - Small talk at Q1 gets a redirect instead of a strike.
  - shout / yell / scream / holler and "tell nando <text>" give alibis.
  - Free meta commands: where, exits, map, what now, save, back.
- **P3s:** NB-05 to NB-09.
  - `say` with no question pending talks to the Don (or answers a topic).
  - Separate hint ladders for Q1 and Q2.
  - "push 13" works.
  - "X and Y" does X, then says "One thing at a time."
  - Compliments to the Don get his flattery line, and there's a new house topic.

## Playtest fixes (polish build)
- **P2s:** PT-01 to PT-06 (see `BUGS_week01.md`).
  - Bare `listen` works everywhere.
  - `show` works like `give`, and "drop X in Y" works like "use X on Y".
  - A thing named from another room gets the free "Nothing like that around here.".
  - At most two extra lines follow a room's text during the escape, and the clock warnings print without a band line or turn feedback on the same turn.
  - `x stairs` works on the landing.
  - New: an extended coverage test (bare verbs, social verbs, prepositions, nouns from other rooms).
- **P3s:** PT-07 to PT-15.
  - Bare `smell` has room lines in R1-R3.
  - New accepted words: "cards" and "family photos".
  - The card and coin state lines are in.
  - Pepita has her own first-strike line.
  - `eat` works on scenery.
  - No stray "You see: staircases" line under the foyer's escape revisit.
  - The elevator has a line for holding only one secret.
  - Animal marks add to a description instead of replacing it.

## 10/10 polish pass (GDD rev 3, Script rev 3 additions)
Depth only. The map, items, puzzles, solutions, win and lose rules and clock values are unchanged. The verified walkthrough still wins with 7 turns to spare, and the W2 route with 4, with the same clock value at every step.

- **Polish C: Feel.**
  - Hint ladders: three steps each for the puzzles, a checkpoint, the tour questions, the tour and the escape. Each ladder keeps its own place.
  - Graded wrong attempts on the piano, the hippo and the steps. Close-ups the first time you examine each secret. Alibi and run lines for each checkpoint.
  - Ending variants: W1 by the secret left behind, W2 by whether you ran, L1 by the cause of the third strike, L2 by how the checkpoint failed, L3 by room type.
  - A run report inside every ending: secrets, turns to spare, strikes, alibis, run, "Things examined: X of 106", and a replay tease.
  - Three rotating lines after an ending.
- **Polish B: State.**
  - Room text follows state: the chlorine plant in R8, the three-paragraph R11 arrival, escape revisits, and lines after the room text (animal marks, checkpoint foreshadowing, Nando's traces, radio chatter).
  - The tour: the Don's foyer passes and a direction cue at every stop.
  - Big Tony's sound ladder: two lines per room type and clock band, alternating.
  - Turn feedback when an escape move changes nothing.
  - The Don: examine and talk lines per stop and strike tier, ask-about topics (clue-guarded), first-look reactions, and social verbs.
  - Nando: greetings that know whether you ran, and free talk, ask and examine at a checkpoint (GDD 12.1 D3). Each way of failing gets its own CAUGHT opener, and a failing command goes straight to CAUGHT.
- **Polish A: Coverage.**
  - All 99 Script nouns can be examined, in every phase where they can be seen, with verb replies and category defaults (C1) and global replies (C2).
  - Examining a neighboring room shows it through the doorway.
  - The GDD 12.3 verbs and synonyms work. Strike verbs count only on the four strike objects, and only on the tour (D1). Search, smell and listen are free (D2). New verbs cost no turn on the tour.
  - The GDD 12.6 accepted answers: "push button", "drop coin in hippo", "step on 13th step", the extra Q1 wordings, and plural animal names.

## Release candidate (post-QA, rev 2)
- **Fix QA-01 (P1):** `say peacock` works at a checkpoint.
- **Fix P3s:** ED-09 to ED-19, BR-03 to BR-11, CP-01 to CP-03.
- **Fix P2s:** BR-02, ED-01 to ED-08.
- **Fix P1s:** BR-01. Punctuation is ignored in typed input. Adds the verified walkthrough as an automated regression test.

## Milestones (rev 1 build)
- **C: Script drop-in.** All Script text, the rotating unknown-command lines, help, the game-over prompt, and no compass exits in ESCAPE.
- **B: Items, puzzles, NPCs, win/lose.** The tour with strikes and questions, the escape clock, alibis, checkpoints, 3 puzzles and 5 endings.
- **A: Skeleton.** 12 rooms and exits; movement, look, help, quit.

## Known issues
- **Bugs:** none open. All four playtest rounds are fixed.
- **Tests:** 49 tests. All 25 polish tests pass: coverage (4,899 commands), the brief's spot checks, state, feel, the extended playtest coverage, the P2 and P3 checks, round 2's P2 and P3 checks, and round 3's P2 and P3 checks, round 4's look-closer coverage (3,616 commands), round 4's P2 and P3 checks, and the wording sweep (2,390 commands). 9 of the 24 rev 2 tests fail, by decision: the Script's new text replaces the exact wording they check. No rule, clock value or outcome changed.

  | rev 2 test | Text that changed |
  |---|---|
  | W1 critical path, W2 piano detour | The run report now follows the ending's last line |
  | Puzzles: wrong attempts | Turn feedback follows the wrong-attempt line; the one-secret elevator line (PT-14) |
  | Script text (C) | `xyzzy` has its own reply; a clock-band line follows the aviary text |
  | Regression walkthrough W1 and W2 | Step 24: Nando's "You. Again." greeting; step 25: the foyer giraffe alibi line; the run report |
  | P2 fixes | A clock-band line on the terrace; the atrium's escape revisit text |
  | P3 fixes | "give coin to don" gets his reply; the new terrace lemurs line |
  | QA-01 | The gallery's own peacocks alibi line |
- **Script items for the writer:**
  1. (Resolved in the wording sweep) The fixture listen line "The building hums. In escape, it hums and thuds." is now split into a tour line and an escape line.
  2. (Resolved in the wording sweep) ANIMAL, FOOD and PERSON now have lines for the Tier 1 verbs; OWN keeps the Script's set.
  3. "x stairs" on the landing finds nothing, because the Script keeps "stairs" for moving.
  4. The terrace has no escape revisit line; it keeps rev 2's revisit text, which already follows animal state.
- **Scoped by the coder:**
  - The button's SECRETS=0 and SECRETS=1 lines are limited to the escape, so they don't replace its tour line.
  - Reactions fire only on your first look, and only if the Don is there.
  - The L3 "Big Tony keeps things" tail goes before "GAME OVER.".
  - The run report sits inside the ending's block, before the RESTART prompt.
- **Outside this repo:** uploading to the community database.

## Tech
- Engine unchanged. Add-ons, in load order:
  - `restart`: RESTART works after an ending.
  - `verbs`:
    - two-word verbs (`phrasal`: "knock over", "scream at") and lone-word lines (`bare`: "show");
    - room and global replies for any verb;
    - the `said`, `any` and `only` conditions and the `line` effect;
    - input cleanup;
    - `look <thing>` examines, `look under / behind / in` searches, `pick up` takes, `climb` walks when it names stairs or a direction;
    - stair "ways".
  - `nouns` (new in the polish pass):
    - scenery nouns with state lines, the reply ladder, and strikes by noun;
    - named state keys (GDD 12.4);
    - lines after the room text, clock bands, turn feedback, reactions, topics, hint ladders, close-ups and the run report;
    - the `rotate`, `ladder`, `note` and `feedback` effects and the `noted` condition.
  - `messages`: rewords the engine's own lines, including rotations.
- The polish text lives in `games/big-footprint/game.js`: the `T` table, `NOUNS` and `ROOM_VERBS` (generated from Script section A), and the `G.categories`, `G.anywhere`, `G.tails`, `G.bands`, `G.topics`, `ENDINGS` and `G.report` tables.
