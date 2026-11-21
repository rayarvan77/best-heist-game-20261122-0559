// Midnight Gallery — deterministic screenshot poses.
//
// Opening the game with ?shot=start, ?shot=play or ?shot=end (and a seed)
// drops the thief, the guards and the alarm into a fixed, staged moment
// and renders exactly one frame, so the screenshots are real renders of
// the game's own code and identical every time they are taken.
//
//   start — the opening frame: the thief at the door, guards on patrol
//           with their cones out, cameras sweeping, the diamond glowing,
//           alarm at zero. Everything the brief asks for, in one frame.
//   play  — mid-heist: the thief sneaking by the vault door, the alarm
//           half raised, a guard turning toward the noise, smoke hanging.
//   end   — the getaway: diamond in the bag, thief on the green EXIT,
//           the win banner up.

import { DIAMOND, EXIT_ZONE } from './config.js';

export function applyShot(game, name) {
  game.screen = 'playing';
  if (name === 'start') {
    game.player.x = 150;
    game.player.y = 700;
    game.player.facing = -Math.PI / 2;
    game.player.sneaking = false;
    game.alarm = 0;
    game.time = 0;
    poseGuard(game, 0, 250, 300, Math.PI / 2);
    poseGuard(game, 1, 700, 260, Math.PI / 2);
    poseGuard(game, 2, 1060, 470, -Math.PI / 2);
    game.cameras[0].angle = Math.PI / 2 - 0.5;
    game.cameras[1].angle = Math.PI + 0.4;
    game.cameras[2].angle = Math.PI / 2 + 0.3;
  } else if (name === 'play') {
    game.player.x = 940;
    game.player.y = 300;
    game.player.facing = Math.PI / 4;
    game.player.sneaking = true;
    game.alarm = 55;
    game.time = 74;
    game.loot = 800;
    game.sideTaken[0] = true;
    poseGuard(game, 0, 300, 460, 0);
    poseGuard(game, 1, 760, 430, -Math.PI / 2);
    poseGuard(game, 2, 1010, 420, Math.PI);
    game.guards[2].alerted = true;
    game.smokes.push({ x: 880, y: 360, ttl: 4 });
    game.cameras[0].angle = Math.PI / 2 + 0.4;
    game.cameras[1].angle = Math.PI - 0.3;
    game.cameras[2].angle = Math.PI / 2 - 0.2;
  } else if (name === 'end') {
    game.diamondTaken = true;
    game.loot = 7000;
    game.alarm = 12;
    game.time = 118;
    game.player.x = EXIT_ZONE.x + EXIT_ZONE.w / 2;
    game.player.y = EXIT_ZONE.y + EXIT_ZONE.h / 2;
    game.player.facing = -Math.PI / 2;
    poseGuard(game, 0, 240, 320, Math.PI);
    poseGuard(game, 1, 700, 200, 0);
    poseGuard(game, 2, 1120, 560, -Math.PI / 2);
    game.cameras[0].angle = Math.PI / 2;
    game.cameras[1].angle = Math.PI;
    game.cameras[2].angle = Math.PI / 2;
    game.screen = 'over';
    game.won = true;
    game.bustReason = '';
  }
  game.spottedNow = false;
  game.spottedFlash = 0;
}

function poseGuard(game, index, x, y, facing) {
  const g = game.guards[index];
  g.x = x;
  g.y = y;
  g.facing = facing;
  g.pauseTimer = 0;
  g.investigating = null;
  g.alerted = false;
}

export { DIAMOND };
