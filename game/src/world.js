// Midnight Gallery — geometry: movement collision and line of sight.
//
// Guards, cameras and the thief all move as circles on the floor plan.
// Walls and pedestals are axis-aligned rectangles; sight is a straight
// segment that walls (but not low pedestals) can block.

import { PEDESTALS, WALLS } from './config.js';

// True when point (px, py) lies inside rect r (edges count as inside).
export function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

// Every solid obstacle: walls stop both feet and eyes, pedestals stop feet.
export function solidRects() {
  return WALLS.concat(PEDESTALS);
}

// Move a circle of radius `radius` from (x, y) by (dx, dy), sliding along
// any rectangle it would hit instead of stopping dead. Returns the new
// position; the caller keeps the facing direction from the attempted move.
export function moveCircle(x, y, dx, dy, radius) {
  const rects = solidRects();
  let nx = x + dx;
  let ny = y + dy;
  if (collides(nx, y, radius, rects)) nx = x;
  if (collides(nx, ny, radius, rects)) ny = y;
  // Clamp inside the gallery shell so nothing can ever leave the floor.
  nx = Math.max(14 + radius, Math.min(1266 - radius, nx));
  ny = Math.max(78 + radius, Math.min(786 - radius, ny));
  return { x: nx, y: ny };
}

function collides(x, y, radius, rects) {
  for (const r of rects) {
    const cx = Math.max(r.x, Math.min(x, r.x + r.w));
    const cy = Math.max(r.y, Math.min(y, r.y + r.h));
    const ddx = x - cx;
    const ddy = y - cy;
    if (ddx * ddx + ddy * ddy < radius * radius) return true;
  }
  return false;
}

// True when the straight segment from (x1, y1) to (x2, y2) is not cut by
// any wall. Pedestals are low, so a guard can see over them.
export function hasLineOfSight(x1, y1, x2, y2) {
  for (const w of WALLS) {
    if (segmentHitsRect(x1, y1, x2, y2, w)) return false;
  }
  return true;
}

// Segment/rectangle test via the slab method: find the interval of the
// segment inside the rectangle and report a hit when it overlaps [0, 1].
function segmentHitsRect(x1, y1, x2, y2, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tMin = 0;
  let tMax = 1;
  const axes = [
    { d: dx, p: x1, lo: r.x, hi: r.x + r.w },
    { d: dy, p: y1, lo: r.y, hi: r.y + r.h },
  ];
  for (const a of axes) {
    if (Math.abs(a.d) < 1e-9) {
      if (a.p < a.lo || a.p > a.hi) return false;
    } else {
      let t1 = (a.lo - a.p) / a.d;
      let t2 = (a.hi - a.p) / a.d;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tMin = Math.max(tMin, t1);
      tMax = Math.min(tMax, t2);
      if (tMin > tMax) return false;
    }
  }
  return true;
}

// True when the thief at (tx, ty) is inside a vision cone whose apex is
// (ox, oy), facing `angle`, with the given range and half-angle, and the
// wall between them does not block the view.
export function insideCone(ox, oy, angle, range, halfAngle, tx, ty) {
  const dx = tx - ox;
  const dy = ty - oy;
  const dist = Math.hypot(dx, dy);
  if (dist > range || dist < 1) return false;
  const toTarget = Math.atan2(dy, dx);
  let diff = toTarget - angle;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  if (Math.abs(diff) > halfAngle) return false;
  return hasLineOfSight(ox, oy, tx, ty);
}

// Distance from a point to the nearest wall edge, used to keep the thief's
// footsteps quiet near cover (a small flavour detail the HUD hints at).
export function nearestWallDistance(x, y) {
  let best = Infinity;
  for (const r of WALLS) {
    const cx = Math.max(r.x, Math.min(x, r.x + r.w));
    const cy = Math.max(r.y, Math.min(y, r.y + r.h));
    best = Math.min(best, Math.hypot(x - cx, y - cy));
  }
  return best;
}
