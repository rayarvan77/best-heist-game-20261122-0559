// Midnight Gallery — game state and the update step.
//
// The game has four screens: title, playing, paused, and over (won or
// busted). While playing, guards walk their patrol loops, cameras sweep,
// and the alarm meter rises whenever a cone with a clear line of sight
// catches the thief — faster for guards than cameras, slower while the
// thief sneaks, and blocked entirely while the thief stands in smoke.
// At 100 the alarm means a bust. Grab the Star Diamond, then reach the
// green exit zone, and the crew gets away clean.

import {
  ALARM_ALERTED_AT,
  ALARM_CAUGHT,
  ALARM_DECAY_RATE,
  CAMERAS,
  CAMERA_CONE_HALF_ANGLE,
  CAMERA_CONE_RANGE,
  CAMERA_SPOT_RATE,
  COIN_COUNT,
  COIN_INVESTIGATE_TIME,
  DIAMOND,
  DIAMOND_VALUE,
  EXIT_ZONE,
  GUARDS,
  GUARD_ALERT_SPEED,
  GUARD_CONE_HALF_ANGLE,
  GUARD_CONE_RANGE,
  GUARD_SPOT_RATE,
  GUARD_SPEED,
  PAR_TIME_SECONDS,
  PLAYER_START,
  SIDE_LOOT,
  SMOKE_COUNT,
  SMOKE_DURATION,
  SMOKE_RADIUS,
  SNEAK_SPEED,
  SNEAK_SPOT_MULTIPLIER,
  WALK_SPEED,
} from './config.js';
import { clearEdgeFlags, isSneaking, readMoveVector } from './input.js';
import { hasLineOfSight, insideCone, moveCircle, pointInRect } from './world.js';

export function createGame(sound) {
  const game = {
    screen: 'title', // title | playing | paused | over
    won: false,
    bustReason: '',
    time: 0,
    alarm: 0,
    loot: 0,
    diamondTaken: false,
    sideTaken: SIDE_LOOT.map(() => false),
    smokeLeft: SMOKE_COUNT,
    coinsLeft: COIN_COUNT,
    smokes: [], // { x, y, ttl }
    coins: [], // { x, y, targetX, targetY, landed, ttl }
    player: {
      x: PLAYER_START.x,
      y: PLAYER_START.y,
      radius: 13,
      facing: -Math.PI / 2,
      sneaking: false,
      moving: false,
    },
    guards: [],
    cameras: [],
    spottedNow: false,
    spottedFlash: 0,
    alarmTickTimer: 0,
    message: '',
    messageTimer: 0,
    sound,
  };
  resetRun(game);
  return game;
}

function resetRun(game) {
  game.won = false;
  game.bustReason = '';
  game.time = 0;
  game.alarm = 0;
  game.loot = 0;
  game.diamondTaken = false;
  game.sideTaken = SIDE_LOOT.map(() => false);
  game.smokeLeft = SMOKE_COUNT;
  game.coinsLeft = COIN_COUNT;
  game.smokes = [];
  game.coins = [];
  game.player.x = PLAYER_START.x;
  game.player.y = PLAYER_START.y;
  game.player.facing = -Math.PI / 2;
  game.player.sneaking = false;
  game.player.moving = false;
  game.spottedNow = false;
  game.spottedFlash = 0;
  game.message = '';
  game.messageTimer = 0;
  game.guards = GUARDS.map((def) => ({
    name: def.name,
    x: def.start.x,
    y: def.start.y,
    radius: 14,
    waypoints: def.waypoints,
    waypointIndex: 1,
    pauseTimer: 0,
    facing: 0,
    investigating: null, // { x, y, timer } while walking to a clink
    alerted: false,
  }));
  game.cameras = CAMERAS.map((def) => ({ ...def, angle: def.baseAngle }));
}

// One frame of the game. `dt` is seconds since the last frame, clamped so
// a hiccup in the browser tab never teleports anyone through a wall.
export function update(game, input, dt) {
  dt = Math.min(dt, 0.05);

  if (input.mutePressed) {
    const muted = game.sound.toggleMute();
    flashMessage(game, muted ? 'Sound off (M to turn back on)' : 'Sound on');
  }

  if (game.screen === 'title') {
    if (input.startPressed) {
      game.screen = 'playing';
      game.sound.door();
      flashMessage(game, 'Stay out of the cones. Grab the Star Diamond, then run for the green EXIT.');
    }
    clearEdgeFlags(input);
    return;
  }

  if (game.screen === 'over') {
    if (input.restartPressed) {
      resetRun(game);
      game.screen = 'playing';
    }
    clearEdgeFlags(input);
    return;
  }

  if (game.screen === 'paused') {
    if (input.pausePressed) game.screen = 'playing';
    clearEdgeFlags(input);
    return;
  }

  // Playing from here on.
  if (input.pausePressed) {
    game.screen = 'paused';
    clearEdgeFlags(input);
    return;
  }

  game.time += dt;
  if (game.messageTimer > 0) game.messageTimer -= dt;
  if (game.spottedFlash > 0) game.spottedFlash -= dt;

  updatePlayer(game, input, dt);
  updateGuards(game, dt);
  updateCameras(game, dt);
  updateTools(game, dt);
  updateDetection(game, dt);
  updateLoot(game);

  // The getaway only counts once the diamond is in the bag.
  if (game.diamondTaken && pointInRect(game.player.x, game.player.y, EXIT_ZONE)) {
    endRun(game, true, '');
  } else if (game.alarm >= ALARM_CAUGHT) {
    endRun(game, false, 'The alarm hit 100% — the gallery locked down with you inside.');
  }

  clearEdgeFlags(input);
}

function updatePlayer(game, input, dt) {
  const p = game.player;
  const move = readMoveVector(input);
  p.sneaking = isSneaking(input);
  p.moving = move !== null;
  if (move) {
    p.facing = Math.atan2(move.y, move.x);
    const speed = p.sneaking ? SNEAK_SPEED : WALK_SPEED;
    const next = moveCircle(p.x, p.y, move.x * speed * dt, move.y * speed * dt, p.radius);
    p.x = next.x;
    p.y = next.y;
  }
  if (input.smokeRequested && game.smokeLeft > 0) {
    game.smokes.push({ x: p.x, y: p.y, ttl: SMOKE_DURATION });
    game.smokeLeft -= 1;
    game.sound.smoke();
    flashMessage(game, 'Smoke out — the cones cannot see through it.');
  }
  if (input.coinTarget && game.coinsLeft > 0) {
    game.coins.push({
      x: p.x,
      y: p.y,
      targetX: input.coinTarget.x,
      targetY: input.coinTarget.y,
      landed: false,
      ttl: 0,
    });
    game.coinsLeft -= 1;
    game.sound.coin();
  }
}

// Guards walk waypoint to waypoint, pausing a beat at each corner. When
// the alarm climbs past the alert line they hurry toward the thief's last
// seen spot; a coin clink pulls the nearest guard to investigate instead.
function updateGuards(game, dt) {
  const alerted = game.alarm >= ALARM_ALERTED_AT;
  for (const g of game.guards) {
    g.alerted = alerted;
    let target = null;
    let speed = GUARD_SPEED;
    if (g.investigating) {
      target = g.investigating;
      speed = GUARD_ALERT_SPEED;
      g.investigating.timer -= dt;
      if (g.investigating.timer <= 0) g.investigating = null;
    } else if (alerted && game.spottedNow) {
      target = game.player;
      speed = GUARD_ALERT_SPEED;
    } else {
      if (g.pauseTimer > 0) {
        g.pauseTimer -= dt;
        continue;
      }
      target = g.waypoints[g.waypointIndex];
    }
    if (!target) continue;
    const dx = target.x - g.x;
    const dy = target.y - g.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 4) {
      if (!g.investigating && !alerted) {
        g.waypointIndex = (g.waypointIndex + 1) % g.waypoints.length;
        g.pauseTimer = 0.9;
      }
      continue;
    }
    const step = Math.min(dist, speed * dt);
    const nx = g.x + (dx / dist) * step;
    const ny = g.y + (dy / dist) * step;
    const next = moveCircle(g.x, g.y, nx - g.x, ny - g.y, g.radius);
    g.x = next.x;
    g.y = next.y;
    g.facing = Math.atan2(dy, dx);
  }
}

// Each camera sweeps its cone sinusoidally around its base angle.
function updateCameras(game, dt) {
  for (const c of game.cameras) {
    c.angle = c.baseAngle + Math.sin(game.time * c.speed + c.phase) * c.sweep;
  }
}

// Smoke clouds fade; tossed coins fly to their target, clink, and then
// pull the nearest guard over to have a look.
function updateTools(game, dt) {
  for (const s of game.smokes) s.ttl -= dt;
  game.smokes = game.smokes.filter((s) => s.ttl > 0);
  for (const c of game.coins) {
    if (!c.landed) {
      const dx = c.targetX - c.x;
      const dy = c.targetY - c.y;
      const dist = Math.hypot(dx, dy);
      const step = 420 * dt;
      if (dist <= step) {
        c.x = c.targetX;
        c.y = c.targetY;
        c.landed = true;
        c.ttl = 0.6;
        game.sound.clink();
        let nearest = null;
        let nearestDist = Infinity;
        for (const g of game.guards) {
          const d = Math.hypot(g.x - c.x, g.y - c.y);
          if (d < nearestDist) {
            nearestDist = d;
            nearest = g;
          }
        }
        if (nearest && nearestDist < 420) {
          nearest.investigating = { x: c.x, y: c.y, timer: COIN_INVESTIGATE_TIME };
          flashMessage(game, `${nearest.name} heard the coin and went to look.`);
        }
      } else {
        c.x += (dx / dist) * step;
        c.y += (dy / dist) * step;
      }
    } else {
      c.ttl -= dt;
    }
  }
  game.coins = game.coins.filter((c) => !c.landed || c.ttl > 0);
}

function playerHiddenInSmoke(game) {
  for (const s of game.smokes) {
    if (Math.hypot(game.player.x - s.x, game.player.y - s.y) < SMOKE_RADIUS) return true;
  }
  return false;
}

// Vision: every guard cone and camera cone is tested against the thief.
// Being seen raises the alarm; hiding lets it fall again.
function updateDetection(game, dt) {
  const p = game.player;
  const hidden = playerHiddenInSmoke(game);
  const sneakFactor = p.sneaking ? SNEAK_SPOT_MULTIPLIER : 1;
  let seen = false;
  if (!hidden) {
    for (const g of game.guards) {
      const range = GUARD_CONE_RANGE * (p.sneaking ? 0.8 : 1);
      if (insideCone(g.x, g.y, g.facing, range, GUARD_CONE_HALF_ANGLE, p.x, p.y)) {
        seen = true;
        game.alarm += GUARD_SPOT_RATE * sneakFactor * dt;
        break;
      }
    }
    if (!seen) {
      for (const c of game.cameras) {
        if (insideCone(c.x, c.y, c.angle, CAMERA_CONE_RANGE, CAMERA_CONE_HALF_ANGLE, p.x, p.y)) {
          seen = true;
          game.alarm += CAMERA_SPOT_RATE * sneakFactor * dt;
          break;
        }
      }
    }
  }
  if (!seen) game.alarm = Math.max(0, game.alarm - ALARM_DECAY_RATE * dt);
  game.alarm = Math.min(ALARM_CAUGHT, game.alarm);
  if (seen && !game.spottedNow) {
    game.spottedFlash = 0.5;
    game.sound.spotted();
  }
  game.spottedNow = seen;
  if (game.alarm > 50) {
    game.alarmTickTimer -= dt;
    if (game.alarmTickTimer <= 0) {
      game.sound.alarmTick();
      game.alarmTickTimer = 0.55;
    }
  }
}

// Walking over a loot piece picks it up. The diamond needs a short crack
// of its glass case: stand on it and it is yours after a heartbeat.
function updateLoot(game) {
  const p = game.player;
  SIDE_LOOT.forEach((item, i) => {
    if (!game.sideTaken[i] && Math.hypot(p.x - item.x, p.y - item.y) < 30) {
      game.sideTaken[i] = true;
      game.loot += item.value;
      game.sound.pickup();
      flashMessage(game, `${item.label} pocketed — +$${item.value.toLocaleString()}.`);
    }
  });
  if (!game.diamondTaken && Math.hypot(p.x - DIAMOND.x, p.y - DIAMOND.y) < 34) {
    game.diamondTaken = true;
    game.loot += DIAMOND_VALUE;
    game.sound.diamond();
    flashMessage(game, 'The Star Diamond is yours — now get to the green EXIT, quietly.');
  }
}

function endRun(game, won, reason) {
  game.screen = 'over';
  game.won = won;
  game.bustReason = reason;
  if (won) game.sound.win();
  else game.sound.caught();
}

function flashMessage(game, text) {
  game.message = text;
  game.messageTimer = 4;
}

// Score: loot value plus a time bonus for beating par and a calm bonus
// for finishing with a low alarm — a quiet thief scores best.
export function finalScore(game) {
  const timeBonus = Math.max(0, Math.round((PAR_TIME_SECONDS - game.time) * 10));
  const calmBonus = Math.max(0, Math.round((ALARM_CAUGHT - game.alarm) * 5));
  return game.loot + timeBonus + calmBonus;
}

export function formatTime(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export { hasLineOfSight };
