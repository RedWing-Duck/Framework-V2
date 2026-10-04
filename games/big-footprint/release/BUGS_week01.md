# Bug list — Week 01: THIS PLACE HAS A BIG FOOTPRINT
Merged from the three QA passes and the playtest rounds (originals in `qa/`), plus one bug found during the P3 regression pass.
**Status: 34 of 34 fixed. Nothing open.** No duplicates were merged: the QA passes had already de-duplicated against each other.

| Bug ID | Sev | Summary | Status | Fix (one line) | Commit |
|---|---|---|---|---|---|
| BR-01 | P1 | Punctuation broke every match (`say giraffe!` = CAUGHT) | Fixed | Punctuation is dropped from typed words before any command runs | Fix P1s |
| QA-01 | P1 | `say peacock` (singular) at a checkpoint = CAUGHT | Fixed | The PEACOCKS alibi also accepts "peacock" | Fix QA-01 |
| BR-02 | P2 | `take` on a carried coin or secret reads like a new pickup and costs a turn | Fixed | "You already have that.", free | Fix P2s |
| ED-01 | P2 | Wrong quiz answers never warn about strikes | Fixed | Escalating lines by strike count (editor text) | Fix P2s |
| ED-02 | P2 | Gate, terrace and aviary text ignore released animals | Fixed | Text follows animal state; the terrace is built from parts | Fix P2s |
| ED-03 | P2 | Room text ignores solved puzzles | Fixed | Solved variants for R2, R4, R8 and the hippo examine | Fix P2s |
| ED-04 | P2 | R11 first visit didn't name the GIRAFFE GATE | Fixed | Editor's first sentence | Fix P2s |
| ED-05 | P2 | "Secret two" on the first secret found | Fixed | "Secrets: {secrets} of 3." | Fix P2s |
| ED-06 | P2 | "behind you / ahead" wrong when walking inward | Fixed | Direction-neutral landmark text for R7, R8, R10 | Fix P2s |
| ED-07 | P2 | Nothing tells the player `run` exists | Fixed | Line added to Nando's greeting and to help | Fix P2s |
| ED-08 | P2 | Nothing hints the step can be pressed | Fixed | "sits a hair higher than the rest" | Fix P2s |
| ED-09 | P3 | Help implies free actions are tour-only | Fixed | "Free anytime: …" | Fix P3s |
| ED-10 | P3 | Generic, inconsistent engine lines | Fixed | 8 lines reworded via the messages add-on | Fix P3s |
| ED-11 | P3 | "(Received/Lost: …)" spoils each reveal | Fixed | Hidden; the narration names every handoff | Fix P3s |
| ED-12 | P3 | Q1 reply: two quotes in a row | Fixed | One merged quote | Fix P3s |
| ED-13 | P3 | Two guards pass in R7 | Fixed | Room-text guard removed | Fix P3s |
| ED-14 | P3 | Examining the Don repeats the handshake | Fixed | New examine line | Fix P3s |
| ED-15 | P3 | Q2 prompt "again" | Fixed | Dropped | Fix P3s |
| ED-16 | P3 | W1 "honking" | Fixed | "chattering" | Fix P3s |
| ED-17 | P3 | W2 giraffe may still be penned | Fixed | Plaque line | Fix P3s |
| ED-18 | P3 | L3 reuses "vending machine" | Fixed | "delivery truck … doorway" | Fix P3s |
| ED-19 | P3 | Staircase examine (tour) is generic | Fixed | Twelve/thirteen steps line | Fix P3s |
| BR-03 | P3 | Empty `say` costs a strike | Fixed | Repeats the question, no strike | Fix P3s |
| BR-04 | P3 | "say definitely not both" passes | Fixed | Negations make it a wrong answer | Fix P3s |
| BR-05 | P3 | `look <thing>` shows the room | Fixed | Examines the thing | Fix P3s |
| BR-06 | P3 | `climb stairs` / `upstairs` not understood | Fixed | Stair words and per-room "ways" | Fix P3s |
| BR-07 | P3 | Scenery in room text can't be examined | Fixed | 17 examine lines reused from room text | Fix P3s |
| BR-08 | P3 | `run` with no guard: confused line, costs a turn | Fixed | "Nothing to run from yet.", free | Fix P3s |
| BR-09 | P3 | Talking to the Don mid-question contradicts him | Fixed | He repeats the question | Fix P3s |
| BR-10 | P3 | `give` not understood | Fixed | Alias of `use` | Fix P3s |
| BR-11 | P3 | Echo renders `[don]` as a name | Fixed | Echo stays literal | Fix P3s |
| CP-01 | P3 | Confused line printed before CAUGHT | Fixed | No line; straight to the ending | Fix P3s |
| CP-02 | P3 | `open gate` gives a confused line and costs a turn | Fixed | "Which gate: …", free | Fix P3s |
| CP-03 | P3 | Replaying the solved piano gives a confused line | Fixed | "You already found what she was hiding.", free | Fix P3s |

**Not a bug (GDD note from Critical Path QA):** entering R11 costs no turn, so the critical path ends with 7 turns to spare, not 6. GDD section 9 is corrected in revision 2.

**Editor note:** the ledger, manifest and photos take lines no longer show in play. BR-02 answers "You already have that.", and secrets can't be dropped. The lines are kept in the Script and build, as written.

## Polish build: playtest QA (`qa/PLAYTEST_QA_week01_polish.txt`)
| Bug ID | Sev | Summary | Status | Fix (one line) |
|---|---|---|---|---|
| PT-01 | P2 | Bare `listen` got the confused line in R1-R3 | Fixed | Room listen lines from the R1-R3 nouns; QA's tour fallback line |
| PT-02 | P2 | `show X to don` said nobody was there | Fixed | `show` works like `give` (same replies) |
| PT-03 | P2 | `drop coin in fountain` on the tour: "not carrying that" | Fixed | "drop X in Y" means "use X on Y" in both phases (a strike on the tour) |
| PT-04 | P2 | A noun from another room got a category reply and cost a turn | Fixed | Cause: R12's bars list "gate", so "jaguar gate" matched it. Now a longer phrase naming something elsewhere gets the free not-here line. Also removed the rev 2 tour-gate reply, which could only misfire (the gates are on the terrace) |
| PT-05 | P2 | Extra lines pile up in ESCAPE | Fixed | At most 2 extra lines per room (Nando's greeting counts; checkpoint lines, then marks, then the band); no band or feedback on a warning turn |
| PT-06 | P2 | `x stairs` on the landing found nothing | Fixed | "stairs" examines there; `climb stairs` still walks down |
| PT-07 | P3 | Bare `smell` generic in R1-R3 | Fixed | Room smell lines from the R1-R3 nouns |
| PT-08 | P3 | "x cards" found nothing | Fixed | "cards" added to the place cards |
| PT-09 | P3 | "x family photos" found nothing | Fixed | "family photos" / "family photo" added to the frames |
| PT-10 | P3 | The card's IF Q2 line was missing | Fixed | Added; it shares the card's last quote so it isn't printed twice. Also added the missing coin line (ESCAPE, COIN_HELD) |
| PT-11 | P3 | "collector's piece" strike line for the fountain coins | Fixed | QA's Pepita line replaces strike 1 on the hippo and fountain |
| PT-12 | P3 | `eat` on scenery: "Nothing happens" | Fixed | "You're hungry, not desperate." for FIXTURE, FURNITURE, ART |
| PT-13 | P3 | "You see: staircases" under the foyer's escape revisit | Fixed | The revisit text tags [staircase] |
| PT-14 | P3 | "Empty-handed" with one secret | Fixed | QA's one-secret line for "down" and "push button" |
| PT-15 | P3 | Animal marks replaced the whole description | Fixed | Base line + mark for the banister, palms, torn portrait, wallpaper, garden; state changes (giraffe, jaguar, peacocks, aviary door, feathers, vase) still replace |

Root cause for the suite: the extended coverage test now tries every info and Tier 1 verb with no noun in every room and both phases, the Tier 2 verbs on the NPCs present (Nando included, free at a checkpoint), prepositional forms, every noun named from another room (free not-here line), and "look at" + every WORDS entry.

## Polish build: playtest QA round 2 (`qa/PLAYTEST_QA_round2_week01_polish.txt`)
| Bug ID | Sev | Summary | Status | Fix (one line) |
|---|---|---|---|---|
| NB-01 | P2 | A bare `say` at a checkpoint was CAUGHT | Fixed | Nando repeats his question; free, the checkpoint stays open |
| NB-02 | P2 | Small talk at Q1 cost a strike | Fixed | Only a "say" with an answer word counts; anything else gets QA's redirect line, no strike |
| NB-03 | P2 | Roleplayed alibis didn't work | Fixed | shout, yell, scream, holler = say; "tell nando <text>" at a checkpoint = say <text> (a bare "tell nando" still repeats, free) |
| NB-04 | P2 | Meta commands got the confused line | Fixed | where (am i), exits / directions / ways out, map, what now / stuck / help me, save / load / undo / restore, back / go back / return, all free, with QA's lines; "go back" at a checkpoint stays a move |
| NB-05 | P3 | "say <words>" with no question pending got the confused line | Fixed | With the Don here: his talk line, or the topic the words name; with nobody here: QA's line (free) |
| NB-06 | P3 | Q1 and Q2 shared a hint ladder | Fixed | Separate ladders; each keeps its own place (a ladder's place is now keyed by its whole list) |
| NB-07 | P3 | "push 13" / "push thirteen" found nothing | Fixed | "13" and "thirteen" name the step and solve P3 |
| NB-08 | P3 | "X and Y" silently dropped Y | Fixed | Does X, then "One thing at a time, detective." (not for say / tell / ask, where "and" is part of what's said) |
| NB-09 | P3 | "tell don i love the marble" got the unknown-topic line | Fixed | Compliment words = the flatter line; new house / marble / palace topic (QA text) |

## Polish build: playtest QA round 3, Bartle graph (`qa/PLAYTEST_QA_round3_bartle_week01.txt`)
| Bug ID | Sev | Summary | Status | Fix (one line) |
|---|---|---|---|---|
| BG-01 | P2 | The "every corner" W2 tease couldn't be earned | Fixed | The six escape-only nouns (R5 lemur, R9 papers, R12's four) count as "Bonus finds: n of 6"; "Things examined" and the tease use the main total (100) |
| BG-02 | P2 | Nouns read in examine and dialogue text had no description | Fixed | QA's aliases, to the entry that mentions each noun |
| BG-03 | P2 | Talking to an animal got "Nobody by that name around." | Fixed | ANIMAL talk default plus QA's lines for Pepita (the Don adds his line on the tour), the peacocks, giraffe, jaguar and lemurs; free, no strike |
| BG-04 | P2 | Lemurs or Big Tony as an alibi got "No animal. No noise." | Fixed | Still CAUGHT, with QA's openers for lemurs, Tony / Bigfoot and the hippo / Pepita |
| BG-05 | P2 | Hostile verbs got the confused line | Fixed | kill / murder / strangle / stab = hit, smash / slam / tear / burn / wreck / destroy / rip = break, trip = push, pickpocket / rob / swipe = steal (strike rules apply); new `provoke` (threaten, insult, mock, spit, sneer) with the Don's S0-S2 lines, no strike; the glare line elsewhere; the pozole line for throwing food |
| BG-06 | P2 | Using the coin on an open hippo said she was still shut, and cost a turn | Fixed | "Pepita's already open, and already empty." (free) |
| BG-07 | P3 | "You see: HIPPO" / "You see: AVIARY" under the R8 and R10 escape revisits | Fixed | The revisit lines carry the tags: "Pepita the [hippo] again…", "The screaming [aviary] again…" |
| BG-08 | P3 | "x step" in the escape foyer gave the staircase sentence | Fixed | "step" names the thirteenth step (X.R2.step) in R2 |
| BG-09 | P3 | The step and the piano used the generic "collector's piece" strike line | Fixed | QA's strike-1 lines for the step and the piano |
| BG-10 | P3 | Reina, empty chair, elevator, dinner and family got "Ask me something interesting" | Fixed | Aliases reina → peacocks, empty chair → accountant, elevator → house; new dinner / food / pozole / gravy (before and after Q1) and wife / kids / children topics (QA text) |
| BG-11 | P3 | "listen to <unknown>" and bare "swim" got the confused line | Fixed | listen / smell with an unknown noun give the room's line; swim: QA's R8 line, "No pool. Not even for you." elsewhere (free) |
| BG-12 | P3 | take all / drop all read like a missing noun | Fixed | "One thing at a time, detective." (free) |
| BG-13 | P3 | "x don" in R1 before meeting him found nothing | Fixed | "You'll meet him in a second. You can already hear him." (tour, free) |

## Polish build: playtest QA round 4, Bartle graph with fresh phrasings (`qa/PLAYTEST_QA_round4_bartle_week01.txt`)
| Bug ID | Sev | Summary | Status | Fix (one line) |
|---|---|---|---|---|
| F-01 | P2 | Nouns one level deeper (inside examine, smell and listen lines) had no reply | Fixed | Context fallback (closes the class): "examine X" that finds nothing prints "You look closer. " and the first sentence naming X in the room's text for this phase, this room's things' lines, or anything printed since you walked in; free. "canvas" names the portraits. Also fixed a crash it found: examining the terrace from the aviary on the tour |
| F-02 | P2 | greet, chat, introduce, whisper got the confused line | Fixed | greet / chat / introduce = talk; whisper / mutter / reply / answer / respond = say (so "whisper giraffe" is an alibi); "introduce myself" gets QA's line |
| F-03 | P2 | Second-wave hostile verbs got the confused line | Fixed | slap / headbutt / bite / elbow / choke = hit; vandalize / deface / trash / knock over = break; set fire / burn / ignite / light = burn (QA's line on fixtures and furniture, else break); poison gets QA's line; scream / yell / shout / holler at = provoke. New FOOD break line for "knock over pots" (coder text) |
| F-04 | P3 | "say thank you" / "say you have a beautiful home" got the "you / me" topic | Fixed | Intent words first: thank → his thank line, love / beautiful / amazing (and the NB-09 words) → flatter; the "you" topic needs "about me / about you" |
| F-05 | P3 | father, god, photos, lion, horse and plurals got "Ask me something interesting" | Fixed | father → palermo; god, church, lion, horse, paintings → portraits; photos, pictures → family; a trailing "s" is dropped before the topic lookup |
| F-06 | P3 | "pet pepita" used the coins' strike line | Fixed | Strikes note the thing struck; the hippo herself gets QA's "Pepita doesn't like strangers" line |
| F-07 | P3 | "ask don" / "talk to don" in R1 before meeting him | Fixed | BG-13's line for talk, ask and tell too (free) |
| F-08 | P3 | Bare "show" / "give" said "You're not carrying that." | Fixed | "Show what, to whom?" / "Give what, to whom?" (free) |
| F-09 | P3 | "x flashlight" at a checkpoint found nothing | Fixed | QA's line for flashlight / beam / torch at a checkpoint (free, the checkpoint stays open) |
