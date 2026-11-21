// Midnight Gallery — canvas rendering.
//
// One dark museum floor at night, drawn fresh every frame: warm lamp pools
// on a navy tiled floor, amber guard cones and red camera cones sweeping
// the room, the cyan Star Diamond glowing in its vault, and a HUD strip on
// top carrying the alarm meter, the loot total and the tools. Danger, safe
// cover and loot are meant to read at a glance, even shrunk to a thumbnail.

import {
  ALARM_CAUGHT,
  CAMERAS,
  CAMERA_CONE_HALF_ANGLE,
  CAMERA_CONE_RANGE,
  DIAMOND,
  EXIT_ZONE,
  GUARD_CONE_HALF_ANGLE,
  GUARD_CONE_RANGE,
  HUD_HEIGHT,
  LAMPS,
  PEDESTALS,
  SIDE_LOOT,
  SMOKE_DURATION,
  SMOKE_RADIUS,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  WALLS,
} from './config.js';
import { finalScore, formatTime } from './game.js';

const FLOOR_A = '#1b2138';
const FLOOR_B = '#161b2e';
const WALL_FILL = '#3a4157';
const WALL_TOP = '#565e78';

export function render(ctx, game) {
  drawFloor(ctx);
  drawExitZone(ctx, game);
  drawPedestals(ctx);
  drawSideLoot(ctx, game);
  drawDiamond(ctx, game);
  drawCones(ctx, game);
  drawSmoke(ctx, game);
  drawCoins(ctx, game);
  drawGuards(ctx, game);
  drawCameras(ctx, game);
  drawPlayer(ctx, game);
  drawWalls(ctx);
  drawHud(ctx, game);
  if (game.screen === 'title') drawTitle(ctx, game);
  if (game.screen === 'paused') drawPaused(ctx);
  if (game.screen === 'over') drawOver(ctx, game);
}

function drawFloor(ctx) {
  ctx.fillStyle = FLOOR_A;
  ctx.fillRect(0, HUD_HEIGHT, VIEW_WIDTH, VIEW_HEIGHT - HUD_HEIGHT);
  // Checkerboard tiles, faint enough to sit under the action.
  const tile = 64;
  ctx.fillStyle = FLOOR_B;
  for (let y = HUD_HEIGHT; y < VIEW_HEIGHT; y += tile) {
    for (let x = 0; x < VIEW_WIDTH; x += tile) {
      if (((x / tile) | 0) % 2 === ((y / tile) | 0) % 2) {
        ctx.fillRect(x, y, tile, tile);
      }
    }
  }
  // Warm lamp pools.
  for (const lamp of LAMPS) {
    const g = ctx.createRadialGradient(lamp.x, lamp.y, 8, lamp.x, lamp.y, lamp.r);
    g.addColorStop(0, 'rgba(255, 196, 110, 0.20)');
    g.addColorStop(1, 'rgba(255, 196, 110, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, lamp.r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Vignette: the gallery is dark at the edges, bright where it matters.
  const v = ctx.createRadialGradient(640, 430, 240, 640, 430, 760);
  v.addColorStop(0, 'rgba(0, 0, 0, 0)');
  v.addColorStop(1, 'rgba(2, 4, 12, 0.5)');
  ctx.fillStyle = v;
  ctx.fillRect(0, HUD_HEIGHT, VIEW_WIDTH, VIEW_HEIGHT - HUD_HEIGHT);
}

function drawWalls(ctx) {
  for (const w of WALLS) {
    ctx.fillStyle = WALL_FILL;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = WALL_TOP;
    if (w.h <= 16) ctx.fillRect(w.x, w.y, w.w, 3);
    else ctx.fillRect(w.x, w.y, 3, w.h);
  }
}

function drawExitZone(ctx, game) {
  const pulse = game.diamondTaken ? 0.35 + 0.15 * Math.sin(game.time * 4) : 0.16;
  ctx.fillStyle = `rgba(46, 204, 113, ${pulse})`;
  ctx.fillRect(EXIT_ZONE.x, EXIT_ZONE.y, EXIT_ZONE.w, EXIT_ZONE.h);
  ctx.strokeStyle = '#2ecc71';
  ctx.lineWidth = 3;
  ctx.strokeRect(EXIT_ZONE.x + 1, EXIT_ZONE.y + 1, EXIT_ZONE.w - 2, EXIT_ZONE.h - 2);
  ctx.fillStyle = '#2ecc71';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', EXIT_ZONE.x + EXIT_ZONE.w / 2, EXIT_ZONE.y + EXIT_ZONE.h / 2 + 5);
}

function drawPedestals(ctx) {
  for (const p of PEDESTALS) {
    ctx.fillStyle = '#2c3350';
    roundRect(ctx, p.x, p.y, p.w, p.h, 6);
    ctx.fill();
    ctx.strokeStyle = '#4a5378';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#8b93b8';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(p.label, p.x + p.w / 2, p.y + p.h / 2 + 4);
  }
}

function drawSideLoot(ctx, game) {
  SIDE_LOOT.forEach((item, i) => {
    if (game.sideTaken[i]) return;
    const bob = Math.sin(game.time * 2 + i * 2) * 2;
    ctx.save();
    ctx.translate(item.x, item.y + bob);
    if (item.kind === 'gold') {
      ctx.fillStyle = '#f5b301';
      ctx.beginPath();
      ctx.moveTo(-13, 6);
      ctx.lineTo(-9, -7);
      ctx.lineTo(9, -7);
      ctx.lineTo(13, 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffe27a';
      ctx.fillRect(-9, -7, 18, 3);
    } else {
      ctx.fillStyle = '#c98f2e';
      ctx.fillRect(-14, -11, 28, 22);
      ctx.fillStyle = '#7ec8e3';
      ctx.fillRect(-11, -8, 22, 16);
      ctx.fillStyle = '#e8b4b8';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });
}

function drawDiamond(ctx, game) {
  if (game.diamondTaken) return;
  const sparkle = 0.6 + 0.4 * Math.sin(game.time * 5);
  const glow = ctx.createRadialGradient(DIAMOND.x, DIAMOND.y, 4, DIAMOND.x, DIAMOND.y, 46);
  glow.addColorStop(0, `rgba(94, 234, 255, ${0.45 * sparkle})`);
  glow.addColorStop(1, 'rgba(94, 234, 255, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(DIAMOND.x, DIAMOND.y, 46, 0, Math.PI * 2);
  ctx.fill();
  // Glass case on its pedestal.
  ctx.fillStyle = '#2c3350';
  roundRect(ctx, DIAMOND.x - 26, DIAMOND.y + 8, 52, 14, 4);
  ctx.fill();
  ctx.strokeStyle = 'rgba(180, 220, 255, 0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(DIAMOND.x - 22, DIAMOND.y + 8);
  ctx.lineTo(DIAMOND.x - 22, DIAMOND.y - 14);
  ctx.lineTo(DIAMOND.x + 22, DIAMOND.y - 14);
  ctx.lineTo(DIAMOND.x + 22, DIAMOND.y + 8);
  ctx.stroke();
  // The Star Diamond itself.
  ctx.fillStyle = '#5eeaff';
  ctx.beginPath();
  ctx.moveTo(DIAMOND.x, DIAMOND.y - 16);
  ctx.lineTo(DIAMOND.x + 12, DIAMOND.y - 2);
  ctx.lineTo(DIAMOND.x, DIAMOND.y + 10);
  ctx.lineTo(DIAMOND.x - 12, DIAMOND.y - 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d9fbff';
  ctx.beginPath();
  ctx.moveTo(DIAMOND.x, DIAMOND.y - 16);
  ctx.lineTo(DIAMOND.x + 6, DIAMOND.y - 2);
  ctx.lineTo(DIAMOND.x, DIAMOND.y + 2);
  ctx.lineTo(DIAMOND.x - 6, DIAMOND.y - 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5eeaff';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('STAR DIAMOND', DIAMOND.x, DIAMOND.y - 26);
}

// A vision cone: a filled wedge from the apex, plus a brighter edge line
// so the danger zone reads even on a small screenshot.
function drawCone(ctx, x, y, angle, range, halfAngle, fill, edge) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.stroke();
}

function drawCones(ctx, game) {
  for (const g of game.guards) {
    const alert = g.alerted ? 0.34 : 0.22;
    drawCone(
      ctx, g.x, g.y, g.facing, GUARD_CONE_RANGE, GUARD_CONE_HALF_ANGLE,
      `rgba(255, 176, 32, ${alert})`, 'rgba(255, 200, 80, 0.55)',
    );
  }
  for (const c of game.cameras) {
    drawCone(
      ctx, c.x, c.y, c.angle, CAMERA_CONE_RANGE, CAMERA_CONE_HALF_ANGLE,
      'rgba(255, 64, 64, 0.20)', 'rgba(255, 90, 90, 0.6)',
    );
  }
}

function drawSmoke(ctx, game) {
  for (const s of game.smokes) {
    const alpha = Math.min(0.75, (s.ttl / SMOKE_DURATION) * 0.75 + 0.2);
    const g = ctx.createRadialGradient(s.x, s.y, 8, s.x, s.y, SMOKE_RADIUS);
    g.addColorStop(0, `rgba(200, 205, 220, ${alpha})`);
    g.addColorStop(1, 'rgba(200, 205, 220, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(s.x, s.y, SMOKE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCoins(ctx, game) {
  for (const c of game.coins) {
    ctx.fillStyle = '#ffd94a';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a87c00';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function drawGuards(ctx, game) {
  for (const g of game.guards) {
    // Body: navy uniform with a cap brim pointing where the guard looks.
    ctx.fillStyle = g.alerted ? '#8c2f2f' : '#2e3a5c';
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = g.alerted ? '#ff6b6b' : '#7c86b0';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#d8c08a';
    ctx.beginPath();
    ctx.arc(g.x + Math.cos(g.facing) * 7, g.y + Math.sin(g.facing) * 7, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1c2340';
    ctx.beginPath();
    ctx.arc(g.x, g.y, 4, 0, Math.PI * 2);
    ctx.fill();
    if (g.investigating) {
      ctx.fillStyle = '#ffd94a';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', g.x, g.y - 22);
    } else if (g.alerted) {
      ctx.fillStyle = '#ff6b6b';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', g.x, g.y - 22);
    }
    ctx.fillStyle = '#c6cdea';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(g.name, g.x, g.y + 26);
  }
}

function drawCameras(ctx, game) {
  for (const c of CAMERAS) {
    const cam = game.cameras.find((k) => k.x === c.x && k.y === c.y) ?? c;
    ctx.fillStyle = '#3a4157';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ff5a5a';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ff5a5a';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    // Little lens barrel pointing along the sweep.
    ctx.strokeStyle = '#8b93b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(c.x + Math.cos(cam.angle) * 14, c.y + Math.sin(cam.angle) * 14);
    ctx.stroke();
  }
}

function drawPlayer(ctx, game) {
  const p = game.player;
  // Soft shadow under the thief.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 9, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Hooded figure: dark cloak, pale face, a glint of the mask.
  ctx.fillStyle = '#20242e';
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = p.sneaking ? '#7dd8ff' : '#e8eaf2';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#f2e6c9';
  ctx.beginPath();
  ctx.arc(p.x + Math.cos(p.facing) * 5, p.y + Math.sin(p.facing) * 5, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#20242e';
  ctx.beginPath();
  ctx.arc(p.x + Math.cos(p.facing) * 7, p.y + Math.sin(p.facing) * 7, 2.5, 0, Math.PI * 2);
  ctx.fill();
  if (p.sneaking) {
    ctx.fillStyle = '#7dd8ff';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SNEAK', p.x, p.y - 20);
  }
}

function drawHud(ctx, game) {
  ctx.fillStyle = '#0d1020';
  ctx.fillRect(0, 0, VIEW_WIDTH, HUD_HEIGHT);
  ctx.strokeStyle = '#2c3350';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, HUD_HEIGHT - 1);
  ctx.lineTo(VIEW_WIDTH, HUD_HEIGHT - 1);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#e8eaf2';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText('MIDNIGHT GALLERY', 18, 28);
  ctx.fillStyle = '#8b93b8';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('The Star Diamond Job', 18, 48);

  // Alarm meter: the heart of the HUD. Green to amber to red as it climbs.
  const meterX = 330;
  const meterW = 300;
  const meterY = 20;
  const meterH = 20;
  ctx.fillStyle = '#8b93b8';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('ALARM', meterX, meterY - 4);
  ctx.fillStyle = '#222842';
  roundRect(ctx, meterX, meterY, meterW, meterH, 5);
  ctx.fill();
  const frac = game.alarm / ALARM_CAUGHT;
  const alarmColor = frac < 0.4 ? '#2ecc71' : frac < 0.7 ? '#f5b301' : '#ff4d4d';
  if (frac > 0) {
    ctx.fillStyle = alarmColor;
    roundRect(ctx, meterX, meterY, Math.max(8, meterW * frac), meterH, 5);
    ctx.fill();
  }
  ctx.strokeStyle = '#4a5378';
  ctx.lineWidth = 1.5;
  roundRect(ctx, meterX, meterY, meterW, meterH, 5);
  ctx.stroke();
  ctx.fillStyle = '#e8eaf2';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText(`${Math.floor(game.alarm)}%`, meterX + meterW + 10, meterY + 16);
  if (game.spottedNow) {
    ctx.fillStyle = '#ff4d4d';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText('SPOTTED!', meterX + meterW + 62, meterY + 16);
  }

  // Loot, tools and time on the right.
  const rightX = 700;
  ctx.fillStyle = '#ffd94a';
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText(`LOOT $${game.loot.toLocaleString()}`, rightX, 28);
  ctx.fillStyle = '#8b93b8';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(`Time ${formatTime(game.time)}`, rightX, 48);
  ctx.fillStyle = '#e8eaf2';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText(`Smoke ${game.smokeLeft}  •  Coins ${game.coinsLeft}`, 950, 28);
  ctx.fillStyle = '#8b93b8';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(game.diamondTaken ? 'Diamond secured — reach the EXIT!' : 'Objective: steal the Star Diamond', 950, 48);

  // Flashing red border while spotted, so the danger is unmissable.
  if (game.spottedFlash > 0) {
    ctx.strokeStyle = `rgba(255, 77, 77, ${Math.min(1, game.spottedFlash * 2)})`;
    ctx.lineWidth = 6;
    ctx.strokeRect(3, HUD_HEIGHT + 3, VIEW_WIDTH - 6, VIEW_HEIGHT - HUD_HEIGHT - 6);
  }

  // Toast message along the bottom of the screen.
  if (game.messageTimer > 0) {
    ctx.fillStyle = 'rgba(13, 16, 32, 0.85)';
    ctx.font = '14px system-ui, sans-serif';
    const w = ctx.measureText(game.message).width + 28;
    roundRect(ctx, (VIEW_WIDTH - w) / 2, VIEW_HEIGHT - 44, w, 30, 8);
    ctx.fill();
    ctx.fillStyle = '#e8eaf2';
    ctx.textAlign = 'center';
    ctx.fillText(game.message, VIEW_WIDTH / 2, VIEW_HEIGHT - 24);
    ctx.textAlign = 'left';
  }
}

function drawTitle(ctx, game) {
  dim(ctx);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd94a';
  ctx.font = 'bold 54px system-ui, sans-serif';
  ctx.fillText('MIDNIGHT GALLERY', VIEW_WIDTH / 2, 240);
  ctx.fillStyle = '#5eeaff';
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText('The Star Diamond Job', VIEW_WIDTH / 2, 282);
  ctx.fillStyle = '#e8eaf2';
  ctx.font = '17px system-ui, sans-serif';
  ctx.fillText('One thief. Three guards. Three cameras. One diamond.', VIEW_WIDTH / 2, 340);
  ctx.fillText('Cross the gallery, stay out of the cones, grab the Star Diamond,', VIEW_WIDTH / 2, 368);
  ctx.fillText('and slip out through the green EXIT before the alarm hits 100%.', VIEW_WIDTH / 2, 394);
  ctx.fillStyle = '#8b93b8';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('Move  WASD / Arrows      Sneak  Shift      Smoke  Q      Toss a coin  Click', VIEW_WIDTH / 2, 448);
  ctx.fillText('Pause  P      Mute  M      Restart  R', VIEW_WIDTH / 2, 474);
  ctx.fillStyle = '#ffd94a';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText('Press ENTER or click to begin', VIEW_WIDTH / 2, 540);
  ctx.textAlign = 'left';
}

function drawPaused(ctx) {
  dim(ctx);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8eaf2';
  ctx.font = 'bold 40px system-ui, sans-serif';
  ctx.fillText('PAUSED', VIEW_WIDTH / 2, 400);
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText('Press P to keep sneaking', VIEW_WIDTH / 2, 440);
  ctx.textAlign = 'left';
}

function drawOver(ctx, game) {
  dim(ctx);
  ctx.textAlign = 'center';
  if (game.won) {
    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 52px system-ui, sans-serif';
    ctx.fillText('CLEAN GETAWAY!', VIEW_WIDTH / 2, 300);
    ctx.fillStyle = '#e8eaf2';
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText(`Loot $${game.loot.toLocaleString()}  •  Time ${formatTime(game.time)}  •  Score ${finalScore(game).toLocaleString()}`, VIEW_WIDTH / 2, 350);
    ctx.fillStyle = '#8b93b8';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('The Star Diamond is gone before dawn. The gallery never saw a thing.', VIEW_WIDTH / 2, 390);
  } else {
    ctx.fillStyle = '#ff4d4d';
    ctx.font = 'bold 52px system-ui, sans-serif';
    ctx.fillText('BUSTED!', VIEW_WIDTH / 2, 300);
    ctx.fillStyle = '#e8eaf2';
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText(game.bustReason, VIEW_WIDTH / 2, 350);
    ctx.fillStyle = '#8b93b8';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText(`Loot kept: $${game.loot.toLocaleString()} — the diamond stays in its case.`, VIEW_WIDTH / 2, 390);
  }
  ctx.fillStyle = '#ffd94a';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText('Press R to run it again', VIEW_WIDTH / 2, 470);
  ctx.textAlign = 'left';
}

function dim(ctx) {
  ctx.fillStyle = 'rgba(5, 7, 16, 0.72)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
