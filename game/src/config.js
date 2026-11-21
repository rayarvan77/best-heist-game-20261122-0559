// Midnight Gallery — level layout and tuning constants.
//
// The whole game lives on one 1280x800 canvas. The top 64 pixels are the
// HUD strip; the floor below it is the museum gallery the thief crosses.
// Everything is measured in canvas pixels, and the level is one fixed
// hand-made room so every run plays the same and screenshots are repeatable.

export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 800;
export const HUD_HEIGHT = 64;

// How fast the thief moves, in pixels per second.
export const WALK_SPEED = 178;
export const SNEAK_SPEED = 102;
export const GUARD_SPEED = 74;
export const GUARD_ALERT_SPEED = 132;

// A guard or camera only spots the thief inside its cone and with a clear
// line of sight. Sneaking shrinks the range the thief can be spotted at.
export const GUARD_CONE_RANGE = 245;
export const GUARD_CONE_HALF_ANGLE = 0.61; // about 35 degrees each side
export const GUARD_SPOT_RATE = 46; // alarm points per second while seen
export const CAMERA_CONE_RANGE = 265;
export const CAMERA_CONE_HALF_ANGLE = 0.5;
export const CAMERA_SPOT_RATE = 30;
export const SNEAK_SPOT_MULTIPLIER = 0.45;
export const ALARM_DECAY_RATE = 17; // alarm points per second while hidden
export const ALARM_CAUGHT = 100;
export const ALARM_ALERTED_AT = 62; // guards hurry toward the thief above this

// Tools: two smoke pellets and three coins. Both are spent, never refilled.
export const SMOKE_COUNT = 2;
export const SMOKE_RADIUS = 95;
export const SMOKE_DURATION = 5; // seconds
export const COIN_COUNT = 3;
export const COIN_INVESTIGATE_TIME = 3.2; // seconds a guard walks to a clink

// The Star Diamond is worth the most; the two side pieces are optional.
export const DIAMOND_VALUE = 5000;
export const GOLD_BAR_VALUE = 800;
export const PAINTING_VALUE = 1200;
export const PAR_TIME_SECONDS = 150;

// Walls are solid rectangles: { x, y, w, h }. They block movement and sight.
export const WALLS = [
  // Outer shell of the gallery.
  { x: 0, y: HUD_HEIGHT, w: 1280, h: 14 },
  { x: 0, y: 786, w: 1280, h: 14 },
  { x: 0, y: HUD_HEIGHT, w: 14, h: 722 },
  { x: 1266, y: HUD_HEIGHT, w: 14, h: 722 },
  // The long partition splitting the hall from the east wing, with a door
  // gap the thief can slip through at y 430..500.
  { x: 400, y: HUD_HEIGHT, w: 16, h: 352 },
  { x: 400, y: 500, w: 16, h: 286 },
  // Vault antechamber wall (top right), door gap at x 980..1060.
  { x: 900, y: 352, w: 80, h: 16 },
  { x: 1060, y: 352, w: 206, h: 16 },
  // Vault side wall (left of the vault), door gap at y 190..270.
  { x: 900, y: HUD_HEIGHT, w: 16, h: 112 },
  { x: 900, y: 270, w: 16, h: 82 },
];

// Low display pedestals: they block movement but not sight, so they are
// cover to hide behind, not walls to hide a cone behind.
export const PEDESTALS = [
  { x: 150, y: 210, w: 84, h: 54, label: 'Vase' },
  { x: 540, y: 170, w: 84, h: 54, label: 'Urn' },
  { x: 560, y: 560, w: 84, h: 54, label: 'Bust' },
  { x: 760, y: 620, w: 84, h: 54, label: 'Relic' },
  { x: 1080, y: 560, w: 84, h: 54, label: 'Totem' },
  { x: 180, y: 560, w: 84, h: 54, label: 'Mask' },
];

// Warm lamp pools on the floor: pure decoration, they sell the night mood.
export const LAMPS = [
  { x: 200, y: 150, r: 130 },
  { x: 640, y: 330, r: 150 },
  { x: 1100, y: 150, r: 120 },
  { x: 880, y: 660, r: 140 },
  { x: 300, y: 680, r: 120 },
];

// Where the thief starts, and the green exit zone to escape through.
export const PLAYER_START = { x: 96, y: 716 };
export const EXIT_ZONE = { x: 18, y: 690, w: 104, h: 92 };

// The loot: the Star Diamond sits in the vault, the other two are optional.
export const DIAMOND = { x: 1150, y: 168 };
export const SIDE_LOOT = [
  { x: 300, y: 640, kind: 'gold', value: GOLD_BAR_VALUE, label: 'Gold bar' },
  { x: 640, y: 716, kind: 'painting', value: PAINTING_VALUE, label: 'Painting' },
];

// Guards walk a loop of waypoints and pause briefly at each one.
export const GUARDS = [
  {
    name: 'Mara',
    start: { x: 190, y: 300 },
    waypoints: [
      { x: 190, y: 300 },
      { x: 340, y: 300 },
      { x: 340, y: 620 },
      { x: 190, y: 620 },
    ],
  },
  {
    name: 'Odo',
    start: { x: 700, y: 150 },
    waypoints: [
      { x: 700, y: 150 },
      { x: 700, y: 640 },
      { x: 830, y: 640 },
      { x: 830, y: 150 },
    ],
  },
  {
    name: 'Vera',
    start: { x: 1000, y: 430 },
    waypoints: [
      { x: 1000, y: 430 },
      { x: 1180, y: 430 },
      { x: 1180, y: 620 },
      { x: 1000, y: 620 },
    ],
  },
];

// Wall-mounted cameras sweep their cones back and forth.
export const CAMERAS = [
  // Over the main hall door, sweeping left and right.
  { x: 640, y: 84, baseAngle: Math.PI / 2, sweep: 0.85, speed: 0.55, phase: 0 },
  // On the east wall, sweeping up and down the corridor.
  { x: 1252, y: 500, baseAngle: Math.PI, sweep: 0.8, speed: 0.45, phase: 1.6 },
  // Inside the vault, guarding the diamond itself.
  { x: 1100, y: 84, baseAngle: Math.PI / 2, sweep: 0.7, speed: 0.7, phase: 3.1 },
];
