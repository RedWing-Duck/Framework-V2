# Week 01 release pack: THIS PLACE HAS A BIG FOOTPRINT
Everything for review, saved together with the build.

| File | What |
|---|---|
| [`../../../dist/big-footprint.html`](../../../dist/big-footprint.html) | The game: one file, runs offline |
| [`../design/GDD_week01_rev4.md`](../design/GDD_week01_rev4.md) | GDD, revision 4: rev 2 plus the Framework v2 showcase, marked [REV4], with a feature -> where table; sections 13-15 add rev 5 (look up/down, slot order), rev 7 (the animals as actors) and rev 8 (the engine audit: every feature, used or not and why) |
| [`../design/GDD_week01_rev2.md`](../design/GDD_week01_rev2.md) | GDD, revision 2: rev 1 plus every decision and QA fix, marked [REV2] |
| [`../design/SCRIPT_week01_rev6.txt`](../design/SCRIPT_week01_rev6.txt) | The full Script, revision 6: every line in the game with the condition that shows it, generated from `game.js` by `make-script.js`; a test fails if it ever disagrees with the game |
| [`../design/SCRIPT_week01_rev2.txt`](../design/SCRIPT_week01_rev2.txt) | Script, revision 2, generated from the build's text table, so it matches the game word for word; changes tagged [CHANGED]/[NEW] with the bug id |
| [`WALKTHROUGH_week01.txt`](WALKTHROUGH_week01.txt) | Verified walkthrough (W1 + W2 branch); automated in `tests/big-footprint.js` (run by `node tests/run.js`) |
| [`BUGS_week01.md`](BUGS_week01.md) | Merged bug list with status (34/34 fixed) |
| [`CHANGELOG_week01.md`](CHANGELOG_week01.md) | Changelog and known issues |
| [`qa/`](qa/) | The three original QA reports and the four playtest QA rounds |
| [`v1/big-footprint.html`](v1/big-footprint.html) | The original v1 build, kept as history (rev 4 replaced the differential test with scripted playthroughs) |
| [`../design/original/`](../design/original/) | The Script as delivered (rev 1), for diffing |
| [`../design/rev3/`](../design/rev3/) | The 10/10 polish inputs: GDD rev 3, Script rev 3 additions, build brief, QA focus |

Credits: **Retroment Gaming** (Week 01 was a dry run, so there are no chat contributors).
The build is the 10/10 polish pass (GDD rev 3) plus the Framework v2 showcase (GDD rev 4), look up/down (rev 5), a script polish (rev 6), the loose animals as actors (rev 7), an engine audit (rev 8) and its Script answers in the engine's order (rev 9). The design documents live in [`../design/`](../design/): `GDD_week01_rev2.md` and `SCRIPT_week01_rev2.txt` describe the rev 2 base, everything the polish added is in `rev3/`, and the changelog here lists what changed.
