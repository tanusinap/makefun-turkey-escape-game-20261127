// GOBBLE DASH — The Great Turkey Escape
// render.js — every pixel the game shows, drawn in code. Flat colours, a
// coherent autumn palette, and a stage that changes as the turkey runs from
// the farmyard, through the barnyard and the kitchen, to the forest edge.
// The playfield is a fixed 1280x720 logical area, scaled to the window.

import { FIELD, TURKEY, LIVES, GOAL_METRES, STAGES, FARMER, PALETTE, FONT, FONT_DISPLAY } from './config.js';

export const SCREEN_TITLE = 0;
export const SCREEN_PLAY = 1;
export const SCREEN_PAUSED = 2;
export const SCREEN_OVER = 3;

function roundRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function text(ctx, str, x, y, size, color, align, font, weight) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 700} ${size}px ${font || FONT}`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const DPR = Math.min(2, window.devicePixelRatio || 1);

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.round(w * DPR);
    canvas.height = Math.round(h * DPR);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
  }
  resize();
  window.addEventListener('resize', resize);

  // ---- scenery ------------------------------------------------------------
  function drawSky(stage, time) {
    const sky = STAGES[stage].sky;
    const g = ctx.createLinearGradient(0, 0, 0, FIELD.groundY);
    g.addColorStop(0, sky[0]);
    g.addColorStop(1, sky[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, FIELD.width, FIELD.groundY);
    // Sun.
    const sx = 1080, sy = 96;
    ctx.fillStyle = '#fff3c4';
    ellipse(ctx, sx, sy, 44, 44);
    ctx.fillStyle = 'rgba(255, 243, 196, 0.35)';
    ellipse(ctx, sx, sy, 62, 62);
    // Clouds drift slowly.
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    for (let i = 0; i < 4; i++) {
      const cx = ((i * 340 + time * 12) % (FIELD.width + 240)) - 120;
      const cy = 70 + i * 42;
      ellipse(ctx, cx, cy, 52, 20);
      ellipse(ctx, cx + 34, cy + 6, 38, 16);
      ellipse(ctx, cx - 36, cy + 8, 30, 13);
    }
  }

  function drawBackdrop(stage, distancePx, time) {
    // Far hills (slow parallax).
    ctx.fillStyle = stage === 3 ? '#3d5c33' : '#8fb573';
    const off = (distancePx * 0.15) % 640;
    for (let i = -1; i < 3; i++) {
      const hx = i * 640 - off;
      ctx.beginPath();
      ctx.moveTo(hx, FIELD.groundY);
      ctx.quadraticCurveTo(hx + 160, FIELD.groundY - 150, hx + 320, FIELD.groundY);
      ctx.quadraticCurveTo(hx + 480, FIELD.groundY - 110, hx + 640, FIELD.groundY);
      ctx.closePath();
      ctx.fill();
    }
    if (stage === 0 || stage === 1) {
      // The barn (near parallax).
      const bx = 900 - ((distancePx * 0.45) % 1600);
      ctx.fillStyle = '#a63d2f';
      ctx.fillRect(bx, FIELD.groundY - 210, 210, 210);
      ctx.fillStyle = '#7e2c20';
      ctx.beginPath();
      ctx.moveTo(bx - 14, FIELD.groundY - 210);
      ctx.lineTo(bx + 105, FIELD.groundY - 290);
      ctx.lineTo(bx + 224, FIELD.groundY - 210);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f7e8c9';
      ctx.fillRect(bx + 78, FIELD.groundY - 130, 54, 130);
      ctx.strokeStyle = '#7e2c20';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(bx + 78, FIELD.groundY - 130); ctx.lineTo(bx + 132, FIELD.groundY);
      ctx.moveTo(bx + 132, FIELD.groundY - 130); ctx.lineTo(bx + 78, FIELD.groundY);
      ctx.stroke();
      // Autumn trees.
      for (let i = 0; i < 3; i++) {
        const tx = ((i * 520 + 180 - distancePx * 0.45) % 1560 + 1560) % 1560 - 140;
        drawTree(tx, FIELD.groundY, 1);
      }
      // Fence posts along the ground.
      ctx.fillStyle = '#8a6b42';
      for (let x = -((distancePx * 0.9) % 90); x < FIELD.width; x += 90) {
        ctx.fillRect(x, FIELD.groundY - 44, 8, 44);
      }
      ctx.fillRect(0, FIELD.groundY - 40, FIELD.width, 6);
      ctx.fillRect(0, FIELD.groundY - 24, FIELD.width, 5);
    } else if (stage === 2) {
      // Kitchen: wall, window, hanging pots, a table with a platter.
      ctx.fillStyle = '#e8cfa5';
      ctx.fillRect(0, 0, FIELD.width, FIELD.groundY);
      ctx.fillStyle = '#d9b98a';
      ctx.fillRect(0, FIELD.groundY - 26, FIELD.width, 26);
      // Window with the farm outside.
      ctx.fillStyle = '#7ec8f2';
      roundRect(ctx, 120, 110, 220, 170, 10); ctx.fill();
      ctx.fillStyle = '#8fb573';
      ctx.fillRect(130, 230, 200, 40);
      ctx.fillStyle = '#fff3c4';
      ellipse(ctx, 280, 150, 26, 26);
      ctx.strokeStyle = '#8a6b42'; ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(230, 110); ctx.lineTo(230, 280);
      ctx.moveTo(120, 195); ctx.lineTo(340, 195);
      ctx.stroke();
      // Hanging pots.
      ctx.strokeStyle = '#5a4a38'; ctx.lineWidth = 4;
      for (let i = 0; i < 3; i++) {
        const px = 480 + i * 90;
        ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, 60); ctx.stroke();
        ctx.fillStyle = '#3d3d46';
        ellipse(ctx, px, 92, 30, 24);
      }
      // Table with a (mercifully empty) platter.
      ctx.fillStyle = '#6e4525';
      ctx.fillRect(880, FIELD.groundY - 150, 300, 18);
      ctx.fillRect(900, FIELD.groundY - 132, 14, 132);
      ctx.fillRect(1146, FIELD.groundY - 132, 14, 132);
      ctx.fillStyle = '#d7dde6';
      ellipse(ctx, 1030, FIELD.groundY - 152, 52, 12);
    } else {
      // Forest: tall dark trees, dappled light.
      for (let i = 0; i < 5; i++) {
        const tx = ((i * 300 + 60 - distancePx * 0.5) % 1500 + 1500) % 1500 - 110;
        drawPine(tx, FIELD.groundY, 1.25);
      }
      ctx.fillStyle = 'rgba(255, 243, 196, 0.25)';
      ellipse(ctx, 640, 300, 320, 90);
    }
  }

  function drawTree(x, groundY, s) {
    ctx.fillStyle = '#6e4525';
    ctx.fillRect(x - 7 * s, groundY - 70 * s, 14 * s, 70 * s);
    const cols = ['#d2691e', '#e8a33c', '#c0392b'];
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = cols[i % 3];
      ellipse(ctx, x + (i - 1) * 26 * s, groundY - (86 + i * 22) * s, 42 * s, 34 * s);
    }
  }

  function drawPine(x, groundY, s) {
    ctx.fillStyle = '#5d4a2f';
    ctx.fillRect(x - 8 * s, groundY - 60 * s, 16 * s, 60 * s);
    ctx.fillStyle = '#2f5c33';
    for (let i = 0; i < 3; i++) {
      const w = (90 - i * 22) * s;
      const y = groundY - (60 + i * 62) * s;
      ctx.beginPath();
      ctx.moveTo(x - w / 2, y);
      ctx.lineTo(x, y - 78 * s);
      ctx.lineTo(x + w / 2, y);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawGround(stage) {
    ctx.fillStyle = STAGES[stage].ground;
    ctx.fillRect(0, FIELD.groundY, FIELD.width, FIELD.height - FIELD.groundY);
    ctx.fillStyle = STAGES[stage].dirt;
    ctx.fillRect(0, FIELD.groundY, FIELD.width, 10);
    // Ground texture: short dashes scrolling with the world.
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    const off = 0;
    for (let x = off; x < FIELD.width; x += 74) {
      ctx.fillRect(x, FIELD.groundY + 34, 26, 4);
      ctx.fillRect(x + 40, FIELD.groundY + 62, 20, 4);
    }
  }

  // ---- obstacles & pickups --------------------------------------------------
  function drawObstacle(o, time) {
    const x = o.x, y = o.y, w = o.width, h = o.height;
    if (o.type === 'fence') {
      ctx.fillStyle = '#8a6b42';
      ctx.fillRect(x, y, 8, h);
      ctx.fillRect(x + w - 8, y, 8, h);
      ctx.fillRect(x, y + 8, w, 8);
      ctx.fillRect(x, y + h - 26, w, 8);
    } else if (o.type === 'hay') {
      ctx.fillStyle = '#d9a441';
      roundRect(ctx, x, y + 8, w, h - 8, 14); ctx.fill();
      ctx.strokeStyle = '#a97e2f'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 8, y + 22); ctx.lineTo(x + w - 8, y + 22);
      ctx.moveTo(x + 8, y + 40); ctx.lineTo(x + w - 8, y + 40);
      ctx.stroke();
      ctx.fillStyle = '#e8c33c';
      ellipse(ctx, x + w / 2, y + 8, 16, 8);
    } else if (o.type === 'pumpkin') {
      ctx.fillStyle = '#e07b24';
      ellipse(ctx, x + w / 2, y + h / 2 + 6, w / 2, h / 2 - 2);
      ctx.strokeStyle = '#b85c14'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + w / 2 - 12, y + 6); ctx.quadraticCurveTo(x + w / 2 - 16, y + h / 2, x + w / 2 - 12, y + h - 4);
      ctx.moveTo(x + w / 2 + 12, y + 6); ctx.quadraticCurveTo(x + w / 2 + 16, y + h / 2, x + w / 2 + 12, y + h - 4);
      ctx.stroke();
      ctx.fillStyle = '#4e7a3f';
      ctx.fillRect(x + w / 2 - 3, y - 6, 6, 10);
    } else if (o.type === 'oven') {
      ctx.fillStyle = PALETTE.ovenBody;
      roundRect(ctx, x, y, w, h, 8); ctx.fill();
      ctx.fillStyle = PALETTE.ovenDoor;
      roundRect(ctx, x + 10, y + 26, w - 20, h - 40, 6); ctx.fill();
      // Glowing interior.
      ctx.fillStyle = PALETTE.ovenGlow;
      roundRect(ctx, x + 18, y + 38, w - 36, 26, 4); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(x + 18, y + 38, w - 36, 6);
      // Handle + dials.
      ctx.fillStyle = '#c9ced6';
      ctx.fillRect(x + 12, y + 10, w - 24, 7);
      ctx.fillStyle = '#f2c94c';
      ellipse(ctx, x + 20, y + 16, 4, 4);
      ellipse(ctx, x + w - 20, y + 16, 4, 4);
      // Chimney.
      ctx.fillStyle = '#2b2b33';
      ctx.fillRect(x + w / 2 - 12, y - 18, 24, 20);
      // Heat shimmer lines.
      ctx.strokeStyle = 'rgba(255, 154, 60, 0.7)'; ctx.lineWidth = 3;
      const wob = Math.sin(time * 6 + x) * 4;
      ctx.beginPath();
      ctx.moveTo(x + w / 2 - 10 + wob, y - 22);
      ctx.quadraticCurveTo(x + w / 2 + wob, y - 38, x + w / 2 + 8 + wob, y - 46);
      ctx.stroke();
    } else if (o.type === 'knife') {
      // A carving knife on a stand, blade at head height: duck under it.
      ctx.fillStyle = '#5a3a22';
      ctx.fillRect(x + 4, y + h - 8, 8, FIELD.groundY - (y + h) + 8);
      ctx.fillRect(x + w - 12, y + h - 8, 8, FIELD.groundY - (y + h) + 8);
      const swing = Math.sin(time * 3 + x * 0.05) * 0.08;
      ctx.save();
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate(swing);
      ctx.fillStyle = PALETTE.knifeBlade;
      roundRect(ctx, -w / 2, -9, w - 22, 18, 6); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(-w / 2 + 4, -7, w - 30, 4);
      ctx.fillStyle = PALETTE.knifeHandle;
      roundRect(ctx, w / 2 - 24, -8, 24, 16, 5); ctx.fill();
      ctx.restore();
      // Danger glint.
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ellipse(ctx, x + w * 0.25, y + 4, 5, 3);
    }
  }

  function drawPickup(p, time) {
    const bob = Math.sin(p.bob) * 3;
    const x = p.x, y = p.y + bob;
    if (p.kind === 'corn') {
      ctx.fillStyle = '#f2c94c';
      ellipse(ctx, x, y, 11, 15);
      ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 5, y - 10); ctx.lineTo(x - 5, y + 10);
      ctx.moveTo(x, y - 12); ctx.lineTo(x, y + 12);
      ctx.moveTo(x + 5, y - 10); ctx.lineTo(x + 5, y + 10);
      ctx.stroke();
      ctx.fillStyle = '#4e7a3f';
      ctx.fillRect(x - 2, y + 13, 4, 8);
    } else if (p.kind === 'goldenCorn') {
      ctx.fillStyle = '#ffd94d';
      ellipse(ctx, x, y, 14, 18);
      ctx.strokeStyle = '#e8b800'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 6, y - 12); ctx.lineTo(x - 6, y + 12);
      ctx.moveTo(x, y - 14); ctx.lineTo(x, y + 14);
      ctx.moveTo(x + 6, y - 12); ctx.lineTo(x + 6, y + 12);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 217, 77, 0.35)';
      ellipse(ctx, x, y, 20, 24);
    } else {
      // Feather.
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-0.5 + Math.sin(time * 2 + x) * 0.15);
      ctx.fillStyle = '#e8d8c8';
      ellipse(ctx, 0, 0, 6, 12);
      ctx.fillStyle = '#a0522d';
      ellipse(ctx, 0, -4, 4, 8);
      ctx.restore();
    }
  }

  // ---- characters -----------------------------------------------------------
  function drawTurkey(t, time, invulnerable) {
    const x = TURKEY.x;
    const y = t.y;
    const h = t.ducking ? TURKEY.duckHeight : TURKEY.height;
    const w = TURKEY.width;
    const legSwing = t.onGround ? Math.sin(t.runPhase) * 10 : 6;
    const flash = invulnerable > 0 && Math.floor(time * 12) % 2 === 0;
    ctx.save();
    if (flash) ctx.globalAlpha = 0.45;

    // Legs.
    ctx.strokeStyle = '#f2994a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    const footY = FIELD.groundY;
    ctx.beginPath();
    ctx.moveTo(x + 22, y + h - 8); ctx.lineTo(x + 22 + legSwing, footY);
    ctx.moveTo(x + 40, y + h - 8); ctx.lineTo(x + 40 - legSwing, footY);
    ctx.stroke();

    if (t.ducking) {
      // Low slide: body stretched forward.
      ctx.fillStyle = PALETTE.turkeyBody;
      ellipse(ctx, x + w / 2, y + h - 18, w / 2 + 6, 16);
      ctx.fillStyle = PALETTE.turkeyHead;
      ellipse(ctx, x + w - 6, y + h - 26, 12, 11);
      ctx.fillStyle = PALETTE.turkeyBeak;
      ctx.beginPath();
      ctx.moveTo(x + w + 4, y + h - 28); ctx.lineTo(x + w + 16, y + h - 24); ctx.lineTo(x + w + 4, y + h - 20);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#2b1d12';
      ellipse(ctx, x + w - 8, y + h - 30, 2.5, 2.5);
    } else {
      // Tail fan.
      const tailCols = PALETTE.turkeyTail;
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = tailCols[i % tailCols.length];
        ctx.save();
        ctx.translate(x + 10, y + 26);
        ctx.rotate(-0.9 + i * 0.45);
        ellipse(ctx, 0, -26, 9, 26);
        ctx.restore();
      }
      // Body.
      ctx.fillStyle = PALETTE.turkeyBody;
      ellipse(ctx, x + w / 2, y + h - 26, w / 2 - 2, 26);
      // Wing.
      ctx.fillStyle = PALETTE.turkeyDark;
      ctx.save();
      ctx.translate(x + w / 2 - 4, y + h - 28);
      ctx.rotate(t.onGround ? Math.sin(t.runPhase) * 0.25 : -0.7);
      ellipse(ctx, 0, 0, 16, 9);
      ctx.restore();
      // Neck + head.
      ctx.fillStyle = PALETTE.turkeyBody;
      ctx.fillRect(x + w - 18, y + 6, 12, 22);
      ctx.fillStyle = PALETTE.turkeyHead;
      ellipse(ctx, x + w - 10, y + 10, 13, 12);
      // Beak + wattle + eye.
      ctx.fillStyle = PALETTE.turkeyBeak;
      ctx.beginPath();
      ctx.moveTo(x + w + 2, y + 8); ctx.lineTo(x + w + 16, y + 12); ctx.lineTo(x + w + 2, y + 16);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = PALETTE.turkeyWattle;
      ellipse(ctx, x + w - 4, y + 20, 4, 7);
      ctx.fillStyle = '#2b1d12';
      ellipse(ctx, x + w - 8, y + 6, 2.5, 2.5);
      // A determined little chef's-hat band? No: a red headband, for speed.
      ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x + w - 22, y + 2); ctx.lineTo(x + w - 2, y + 0);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFarmer(state, time) {
    const gap = state.gap;
    const x = TURKEY.x - gap - 30;
    const y = FIELD.groundY - 118;
    const run = Math.sin(time * 11) * 12;
    const reach = gap < FARMER.warningGap ? 14 : 0;
    // Legs (running).
    ctx.strokeStyle = '#2b3a55'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + 26, y + 74); ctx.lineTo(x + 26 + run, FIELD.groundY);
    ctx.moveTo(x + 44, y + 74); ctx.lineTo(x + 44 - run, FIELD.groundY);
    ctx.stroke();
    // Overalls.
    ctx.fillStyle = PALETTE.farmerOveralls;
    roundRect(ctx, x + 16, y + 44, 40, 44, 8); ctx.fill();
    ctx.fillStyle = '#2f5d8a';
    ctx.fillRect(x + 20, y + 44, 6, 22);
    ctx.fillRect(x + 46, y + 44, 6, 22);
    // Shirt + arms. One arm reaches for the turkey.
    ctx.fillStyle = PALETTE.farmerShirt;
    roundRect(ctx, x + 10, y + 22, 52, 30, 10); ctx.fill();
    ctx.strokeStyle = PALETTE.farmerShirt; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + 58, y + 30); ctx.lineTo(x + 78 + reach, y + 34 + Math.sin(time * 11) * 4);
    ctx.moveTo(x + 12, y + 30); ctx.lineTo(x + 2 - run * 0.4, y + 52);
    ctx.stroke();
    // Hand.
    ctx.fillStyle = PALETTE.farmerSkin;
    ellipse(ctx, x + 80 + reach, y + 34, 7, 6);
    // Head + beard + hat.
    ctx.fillStyle = PALETTE.farmerSkin;
    ellipse(ctx, x + 36, y + 12, 15, 14);
    ctx.fillStyle = '#e8e0d0';
    ellipse(ctx, x + 36, y + 22, 12, 8);
    ctx.fillStyle = '#2b1d12';
    ellipse(ctx, x + 42, y + 8, 2.5, 2.5);
    // Straw hat.
    ctx.fillStyle = PALETTE.farmerHat;
    ellipse(ctx, x + 36, y + 2, 26, 7);
    ctx.beginPath();
    ctx.moveTo(x + 20, y + 2); ctx.lineTo(x + 26, y - 16); ctx.lineTo(x + 46, y - 16); ctx.lineTo(x + 52, y + 2);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#a67c2e'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x + 22, y - 6); ctx.lineTo(x + 50, y - 6); ctx.stroke();
    // The carving knife in his belt, glinting.
    ctx.fillStyle = PALETTE.knifeBlade;
    ctx.save();
    ctx.translate(x + 58, y + 62);
    ctx.rotate(0.5);
    ctx.fillRect(-2, -16, 5, 26);
    ctx.restore();
  }

  // ---- HUD ------------------------------------------------------------------
  function drawHeart(x, y, filled) {
    ctx.fillStyle = filled ? PALETTE.heart : PALETTE.heartEmpty;
    ctx.beginPath();
    ctx.moveTo(x, y + 6);
    ctx.bezierCurveTo(x - 10, y - 4, x - 4, y - 12, x, y - 5);
    ctx.bezierCurveTo(x + 4, y - 12, x + 10, y - 4, x, y + 6);
    ctx.closePath();
    ctx.fill();
  }

  function drawHUD(state, best) {
    // Top bar.
    ctx.fillStyle = PALETTE.panel;
    roundRect(ctx, 16, 14, 1248, 64, 12); ctx.fill();
    text(ctx, `SCORE ${Math.floor(state.score)}`, 36, 52, 26, PALETTE.textLight, 'left', FONT_DISPLAY);
    text(ctx, `DISTANCE ${Math.floor(state.distance)} m / ${GOAL_METRES} m`, 330, 52, 26, PALETTE.textLight, 'left', FONT_DISPLAY);
    text(ctx, STAGES[state.stage].name, 700, 52, 22, '#f2c94c', 'left', FONT_DISPLAY);
    // Hearts.
    for (let i = 0; i < LIVES; i++) drawHeart(880 + i * 34, 40, i < state.lives);
    text(ctx, `BEST ${Math.floor(best)}`, 1000, 52, 22, '#c9b8a3', 'left', FONT_DISPLAY);
    // Progress to the forest.
    const prog = Math.min(1, state.distance / GOAL_METRES);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    roundRect(ctx, 16, 88, 1248, 10, 5); ctx.fill();
    ctx.fillStyle = '#f2c94c';
    roundRect(ctx, 16, 88, 1248 * prog, 10, 5); ctx.fill();
    ctx.fillStyle = '#2b1d12';
    text(ctx, 'FARMYARD', 16, 116, 13, '#fff8ea');
    text(ctx, 'FOREST  (ESCAPE!)', 1140, 116, 13, '#fff8ea', 'right');
    // Farmer proximity: a warning bar at the left when he is close.
    if (state.gap < FARMER.warningGap) {
      const urgency = 1 - state.gap / FARMER.warningGap;
      ctx.fillStyle = `rgba(229, 83, 75, ${0.25 + urgency * 0.45})`;
      roundRect(ctx, 16, 128, 300, 34, 8); ctx.fill();
      text(ctx, `THE FARMER IS RIGHT BEHIND YOU!`, 30, 151, 18, '#ffffff', 'left', FONT_DISPLAY);
    } else {
      text(ctx, `FARMER ${Math.floor(state.gap)} BEHIND`, 30, 151, 16, 'rgba(255,248,234,0.75)');
    }
    // Speed.
    text(ctx, `${Math.round(state.speed / 10)} km/h`, 1230, 151, 16, 'rgba(255,248,234,0.75)', 'right');
  }

  function drawLeaves(state) {
    for (const leaf of state.leaves) {
      ctx.save();
      ctx.translate(leaf.x, leaf.y);
      ctx.rotate(Math.sin(leaf.sway) * 0.8);
      ctx.fillStyle = leaf.color;
      ellipse(ctx, 0, 0, leaf.size / 2, leaf.size / 3);
      ctx.restore();
    }
  }

  function drawParticles(state) {
    for (const p of state.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ellipse(ctx, p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  // ---- screens ---------------------------------------------------------------
  function drawTitle(state, best) {
    drawSky(0, state.time);
    drawBackdrop(0, 0, state.time);
    drawGround(0);
    // The turkey and the farmer, staged on the title screen.
    const t = { y: FIELD.groundY - TURKEY.height, vy: 0, onGround: true, ducking: false, runPhase: state.time * 8, invulnerable: 0 };
    drawTurkey(t, state.time, 0);
    const fake = { ...state, gap: 210 };
    drawFarmer(fake, state.time);
    // Title panel.
    ctx.fillStyle = PALETTE.panelLight;
    roundRect(ctx, 300, 120, 680, 300, 18); ctx.fill();
    ctx.strokeStyle = '#e5534b'; ctx.lineWidth = 5;
    roundRect(ctx, 300, 120, 680, 300, 18); ctx.stroke();
    text(ctx, 'GOBBLE DASH', 640, 200, 64, '#c0392b', 'center', FONT_DISPLAY, 900);
    text(ctx, 'THE GREAT TURKEY ESCAPE', 640, 238, 24, '#6b5a44', 'center', FONT_DISPLAY);
    text(ctx, 'Thanksgiving is coming. The farmer wants dinner.', 640, 282, 20, PALETTE.text, 'center');
    text(ctx, 'Run 1000 m to the forest. Dodge the oven and the knife.', 640, 310, 20, PALETTE.text, 'center');
    text(ctx, 'SPACE / UP  jump      DOWN  duck      P  pause', 640, 352, 19, '#6b5a44', 'center');
    text(ctx, 'Collect corn. Do not let the farmer catch you.', 640, 382, 19, '#6b5a44', 'center');
    // Start button.
    ctx.fillStyle = '#e5534b';
    roundRect(ctx, 490, 436, 300, 58, 12); ctx.fill();
    text(ctx, 'START  (SPACE)', 640, 474, 24, '#ffffff', 'center', FONT_DISPLAY);
    if (best > 0) text(ctx, `BEST SCORE ${Math.floor(best)}`, 640, 530, 20, '#6b5a44', 'center');
    text(ctx, 'A complete original game. No network. Keyboard + mouse.', 640, 690, 15, 'rgba(255,248,234,0.8)', 'center');
  }

  function drawPaused() {
    ctx.fillStyle = 'rgba(20, 16, 10, 0.55)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.panelLight;
    roundRect(ctx, 440, 280, 400, 160, 14); ctx.fill();
    text(ctx, 'PAUSED', 640, 340, 44, '#2b1d12', 'center', FONT_DISPLAY, 900);
    text(ctx, 'Press P or SPACE to keep running', 640, 386, 20, '#6b5a44', 'center');
  }

  function drawOver(state, best) {
    const escaped = state.outcome === 'escaped';
    ctx.fillStyle = escaped ? 'rgba(30, 70, 35, 0.55)' : 'rgba(70, 20, 15, 0.55)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.panelLight;
    roundRect(ctx, 330, 150, 620, 380, 18); ctx.fill();
    ctx.strokeStyle = escaped ? '#4e7a3f' : '#e5534b'; ctx.lineWidth = 5;
    roundRect(ctx, 330, 150, 620, 380, 18); ctx.stroke();
    text(ctx, escaped ? 'ESCAPED!' : 'CAUGHT!', 640, 232, 64, escaped ? '#2f6b2f' : '#c0392b', 'center', FONT_DISPLAY, 900);
    text(ctx, state.reason || (escaped ? 'The turkey made it to the forest!' : 'Dinner is served...'), 640, 276, 21, PALETTE.text, 'center');
    text(ctx, `SCORE  ${Math.floor(state.score)}`, 640, 336, 30, '#2b1d12', 'center', FONT_DISPLAY);
    text(ctx, `DISTANCE  ${Math.floor(state.distance)} m / ${GOAL_METRES} m`, 640, 376, 22, '#6b5a44', 'center', FONT_DISPLAY);
    if (state.score > best) text(ctx, 'NEW BEST!', 640, 410, 22, '#e5534b', 'center', FONT_DISPLAY);
    else if (best > 0) text(ctx, `BEST  ${Math.floor(best)}`, 640, 410, 20, '#6b5a44', 'center');
    // Restart button.
    ctx.fillStyle = '#e5534b';
    roundRect(ctx, 490, 440, 300, 58, 12); ctx.fill();
    text(ctx, 'RESTART  (R)', 640, 478, 24, '#ffffff', 'center', FONT_DISPLAY);
    text(ctx, 'Press R, SPACE or click to run again', 640, 516, 17, '#6b5a44', 'center');
  }

  // ---- main draw -------------------------------------------------------------
  function draw(state, screen, best) {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const scale = Math.min(canvas.width / DPR / FIELD.width, canvas.height / DPR / FIELD.height);
    const ox = (canvas.width / DPR - FIELD.width * scale) / 2;
    const oy = (canvas.height / DPR - FIELD.height * scale) / 2;
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);
    ctx.clearRect(-ox, -oy, FIELD.width + ox * 2, FIELD.height + oy * 2);

    if (screen === SCREEN_TITLE) {
      drawTitle(state, best);
      return;
    }
    if (screen === SCREEN_OVER) {
      // Keep the world visible behind the end panel.
      drawSky(state.stage, state.time);
      drawBackdrop(state.stage, state.distancePx, state.time);
      drawGround(state.stage);
      drawLeaves(state);
      for (const o of state.obstacles) drawObstacle(o, state.time);
      for (const p of state.pickups) drawPickup(p, state.time);
      drawFarmer(state, state.time);
      drawTurkey(state.turkey, state.time, 0);
      drawParticles(state);
      drawHUD(state, best);
      drawOver(state, best);
      return;
    }
    drawSky(state.stage, state.time);
    drawBackdrop(state.stage, state.distancePx, state.time);
    drawGround(state.stage);
    drawLeaves(state);
    for (const o of state.obstacles) drawObstacle(o, state.time);
    for (const p of state.pickups) drawPickup(p, state.time);
    drawFarmer(state, state.time);
    drawTurkey(state.turkey, state.time, state.turkey.invulnerable);
    drawParticles(state);
    drawHUD(state, best);
    if (screen === SCREEN_PAUSED) drawPaused();
  }

  return { draw, resize };
}
