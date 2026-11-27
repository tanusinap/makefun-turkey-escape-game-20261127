// GOBBLE DASH — The Great Turkey Escape
// config.js — every tuning number, colour and stage in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720, groundY: 620 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** Pixels of world travel that count as one metre of escape distance. */
export const PX_PER_METRE = 25;

/** The distance (metres) the turkey must cover to reach the forest and escape. */
export const GOAL_METRES = 1000;

export const TURKEY = {
  x: 300,                 // fixed screen position; the world scrolls past
  width: 66,
  height: 74,             // standing
  duckHeight: 44,         // ducking / sliding
  jumpVelocity: 1000,     // px/s upward (high, floaty jump: generous clearance)
  gravity: 2600,          // px/s^2 (long air time, so mistimed jumps still clear)
  /** Forgiving hitbox: shrink the body a little on every side. */
  hitShrink: 9,
};

export const LIVES = 3;

/** The farmer chase: gap (px) between farmer and turkey. */
export const FARMER = {
  startGap: 250,          // farmer starts this far behind
  maxGap: 270,            // turkey can never pull further ahead
  catchGap: 0,            // gap at or below this: the farmer grabs the turkey
  gainOnHit: 75,          // gap lost when the turkey stumbles
  gainOnNearMiss: 6,      // gap lost on a close shave (still hurts)
  recoverPerSecond: 9,    // gap regained while running clean
  warningGap: 110,        // below this the farmer is "right behind you"
};

/** Obstacle kinds. jump = clear it by jumping; duck = slide under it.
 *  lift raises the obstacle off the ground (the knife blade hangs at head
 *  height, so a standing turkey hits it but a ducking turkey slides under). */
export const OBSTACLE = {
  fence:   { kind: 'jump', width: 46,  height: 52,  minStage: 0, weight: 3, lift: 0 },
  hay:     { kind: 'jump', width: 62,  height: 60,  minStage: 0, weight: 3, lift: 0 },
  pumpkin: { kind: 'jump', width: 52,  height: 46,  minStage: 0, weight: 3, lift: 0 },
  oven:    { kind: 'jump', width: 76,  height: 72,  minStage: 2, weight: 3, lift: 0 },
  knife:   { kind: 'duck', width: 96,  height: 22,  minStage: 1, weight: 3, lift: 40 },
};

/** Pickups. */
export const PICKUP = {
  corn:       { points: 10, size: 26 },
  feather:    { points: 5,  size: 20 },
  goldenCorn: { points: 25, size: 30 },
};

/** Stages of the escape, by distance (metres). */
export const STAGES = [
  { name: 'FARMYARD',  from: 0,   sky: ['#7ec8f2', '#cfeefb'], ground: '#7fae4e', dirt: '#a97e4f', speed: 285 },
  { name: 'BARNYARD',  from: 250, sky: ['#f2b25c', '#fbe3b0'], ground: '#8fae4a', dirt: '#b08a52', speed: 330 },
  { name: 'KITCHEN',   from: 500, sky: ['#f7d9a0', '#fbeccb'], ground: '#8a5a34', dirt: '#6e4525', speed: 380 },
  { name: 'FOREST',    from: 750, sky: ['#5a7d8c', '#b8d0c0'], ground: '#4e7a3f', dirt: '#5d4a2f', speed: 430 },
];

/** Speed cap and how fast the spawn rate tightens. */
export const DIFFICULTY = {
  speedCap: 560,
  speedPerMetre: 0.12,        // extra px/s per metre run
  spawnInterval: 1.3,         // seconds between obstacle groups, at start
  spawnIntervalPerStage: 0.12,
  spawnIntervalMin: 0.55,
  minGapPx: 250,              // minimum world gap between obstacle groups
};

export const PALETTE = {
  text: '#2b1d12',
  textLight: '#fff8ea',
  muted: '#6b5a44',
  panel: 'rgba(43, 29, 18, 0.82)',
  panelLight: 'rgba(255, 248, 234, 0.92)',
  accent: '#e5534b',
  gold: '#f2c94c',
  turkeyBody: '#8a5230',
  turkeyDark: '#6b3d20',
  turkeyTail: ['#a0522d', '#d2691e', '#e8a33c', '#c0392b'],
  turkeyHead: '#e8d8c8',
  turkeyBeak: '#f2994a',
  turkeyWattle: '#e5534b',
  farmerShirt: '#c0392b',
  farmerOveralls: '#2f5d8a',
  farmerSkin: '#e8b98a',
  farmerHat: '#d9b45b',
  ovenBody: '#3d3d46',
  ovenDoor: '#23232b',
  ovenGlow: '#ff9a3c',
  knifeBlade: '#d7dde6',
  knifeHandle: '#5a3a22',
  heart: '#e5534b',
  heartEmpty: '#c9b8a3',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
export const FONT_DISPLAY = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'gobble-dash.best';
