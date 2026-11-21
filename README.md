[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/rayarvan77/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/rayarvan77/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

# Midnight Gallery — The Star Diamond Job

An entry for [make.fun](https://make.fun)'s `best-heist-game-20261122-0559` bounty: a complete, original top-down stealth heist game that runs offline in a desktop browser from static files — no network requests, no build step, no library.

## The job

It is past midnight in a private museum, and the Star Diamond is sitting in a glass case in the vault, glowing under its own spotlight. You are the thief at the back door. Three guards walk the gallery with amber vision cones, three security cameras sweep red cones across the hall and the vault, and one alarm meter decides whether you walk out rich or get locked in with the exhibits.

Cross the room, read the patrols before you move, lift the diamond, and slip out through the green EXIT before the alarm reaches 100%.

## How it plays

- **Move** with WASD or the arrow keys.
- **Sneak** by holding Shift — slower, but guards spot you from closer and the alarm climbs half as fast.
- **Smoke pellets (Q)** — two per run. Drop one at your feet and the cones cannot see through the cloud for five seconds.
- **Coin toss (click)** — three coins per run. Click anywhere and the coin clinks there; the nearest guard walks over to investigate, which opens a gap in the patrol.
- **Loot** — the Star Diamond is worth $5,000. A gold bar ($800) and a painting ($1,200) sit out in the hall for thieves who want a bigger score and a riskier route.
- **Alarm meter** — rises while any guard or camera has you in its cone with a clear line of sight, falls again while you stay hidden. Past 62% the guards hurry toward you. At 100% the gallery locks down and the run is busted.
- **Score** — loot, plus a bonus for beating the 2:30 par time and a calm bonus for finishing with a low alarm. A quiet thief scores best.
- **Pause (P), mute (M), restart (R).** Enter or a click starts the game.

## The room

Two ways in, if you look: the main hall past guard Mara's loop, or the east corridor under the sweeping camera and past Odo. The vault sits top-right behind two door gaps, watched by Vera and a camera aimed straight at the case. Display pedestals are low cover — they block your feet, not a guard's eyes — so the only true hiding places are darkness, distance, and smoke.

## Play it

Serve `game/` with any static server and open `game/index.html` in desktop Chrome:

```sh
node serve.ts        # serves game/ on http://localhost:8080
```

Or open the folder directly with `python3 -m http.server` from inside `game/`. The game is plain HTML, CSS and ES modules; every sound is synthesized with WebAudio at run time, so nothing is fetched over the network.

## Files

| Path | What it is |
| --- | --- |
| `main.ts` | The hand-in program (Node 22, stdlib only): copies `game/` and `screenshots/` to `/output` and writes `dossier.json` via `vendor/makefun-game.ts`. |
| `game/index.html` | The game page. |
| `game/src/main.js` | Bootstrap, frame loop, screenshot poses. |
| `game/src/game.js` | Game state: screens, patrols, detection, alarm, tools, win and lose. |
| `game/src/render.js` | All canvas drawing: floor, cones, guards, cameras, loot, HUD. |
| `game/src/world.js` | Movement collision and line of sight. |
| `game/src/config.js` | Level layout and tuning numbers. |
| `game/src/input.js` | Keyboard and mouse. |
| `game/src/audio.js` | Synthesized sound effects (WebAudio, no files). |
| `game/src/shots.js` | Deterministic screenshot poses (`?shot=start|play|end`). |
| `screenshots/` | Three real renders of this game's own code. |
| `vendor/makefun-game.ts` | The kit's dossier library, copied unchanged. |

## Screenshots

The three shots are taken from the game itself with `?shot=start`, `?shot=play` and `?shot=end`:

1. `1-start.jpg` — the opening frame: thief at the door, guards and cones on patrol, cameras sweeping, the diamond glowing, alarm at 0%.
2. `2-play.jpg` — mid-heist: the thief sneaking by the vault door with the alarm half raised and smoke hanging.
3. `3-end.jpg` — the getaway: diamond in the bag, thief on the green EXIT, CLEAN GETAWAY.

## License

MIT — see `LICENSE`.
