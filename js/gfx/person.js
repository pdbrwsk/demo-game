'use strict';

/* =========================================================
   Figuren (8x16 Pixel)
   ========================================================= */
const SKINS = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac'];
const HAIRS = ['#2b1d14', '#5a3a1e', '#c8642b', '#e8d07a', '#1a1a1a', '#8a8a8a', '#8e3b5a'];
const SHIRTS = ['#d64545', '#3a7bd5', '#e3b23c', '#4caf6a', '#9b59b6', '#e67e22', '#f4ecd8', '#2fb3a8', '#e05d8c'];
const PANTS = ['#30364f', '#4a3b2e', '#2b2b33', '#3f5a7a', '#5c4d3c'];
const HATS = ['#d64545', '#3a7bd5', '#2b2b33', '#4caf6a'];

function randomLook(rnd) {
  return {
    skin: pick(rnd, SKINS), hair: pick(rnd, HAIRS), shirt: pick(rnd, SHIRTS),
    pants: pick(rnd, PANTS), shoes: '#1b1b22',
    long: rnd() < 0.35, hat: rnd() < 0.15 ? pick(rnd, HATS) : null,
  };
}

/* (x,y) = Mitte der Füße.
   frame 0..3 = Laufzyklus, facing: front | left | right | back, raised = Arm hoch (Schild) */
function drawPerson(g, x, y, L, frame, facing, raised) {
  const ox = x - 4, oy = y - 16;
  const b = frame % 2; // leichtes Wippen beim Gehen
  const R = (cx, cy, w, h, c) => { g.fillStyle = c; g.fillRect(ox + cx, oy + cy, w, h); };

  // Beine
  if (b === 0) {
    R(2, 11, 2, 4, L.pants); R(4, 11, 2, 4, L.pants);
    R(2, 15, 2, 1, L.shoes); R(4, 15, 2, 1, L.shoes);
  } else {
    R(2, 12, 4, 1, L.pants); R(1, 13, 2, 2, L.pants); R(5, 13, 2, 2, L.pants);
    R(1, 15, 2, 1, L.shoes); R(5, 15, 2, 1, L.shoes);
  }
  // Oberkörper + Arme
  R(1, 6 + b, 6, 5, L.shirt);
  R(0, 6 + b, 1, 4, L.shirt); R(0, 10 + b, 1, 1, L.skin);
  if (raised) { R(7, 3 + b, 1, 4, L.shirt); R(7, 2 + b, 1, 1, L.skin); }
  else { R(7, 6 + b, 1, 4, L.shirt); R(7, 10 + b, 1, 1, L.skin); }
  // Kopf
  R(1, 0 + b, 6, 2, L.hair);
  R(1, 2 + b, 6, 4, L.skin);
  const eye = '#1b1b22';
  if (facing === 'right') {
    R(1, 2 + b, 2, 2, L.hair); R(5, 3 + b, 1, 1, eye);
    if (L.long) R(0, 1 + b, 2, 5, L.hair);
  } else if (facing === 'left') {
    R(5, 2 + b, 2, 2, L.hair); R(2, 3 + b, 1, 1, eye);
    if (L.long) R(6, 1 + b, 2, 5, L.hair);
  } else if (facing === 'back') {
    R(1, 0 + b, 6, 5, L.hair);
    R(0, 3 + b, 1, 1, L.skin); R(7, 3 + b, 1, 1, L.skin); // Ohren
    if (L.long) R(0, 1 + b, 8, 6, L.hair);
  } else {
    R(1, 2 + b, 1, 1, L.hair); R(6, 2 + b, 1, 1, L.hair);
    R(2, 3 + b, 1, 1, eye); R(5, 3 + b, 1, 1, eye);
    if (L.long) { R(0, 1 + b, 1, 5, L.hair); R(7, 1 + b, 1, 5, L.hair); }
  }
  if (L.hat) { R(1, -1 + b, 6, 3, L.hat); R(1, 1 + b, 6, 1, '#f4ecd8'); }
  // optional: Vermummung, Helm mit Visier, Schutzschild (Polizei)
  if (L.mask && facing !== 'back') R(1, 4 + b, 6, 2, L.mask);
  if (L.helmet) { R(1, -2 + b, 6, 1, L.helmet); R(0, -1 + b, 8, 3, L.helmet); if (facing !== 'back') R(1, 2 + b, 6, 1, '#7d93ab'); }
  if (L.shield && (facing === 'left' || facing === 'right')) {
    const sx = facing === 'left' ? -3 : 8;
    R(sx, 4 + b, 3, 11, '#bcd4ea'); R(facing === 'left' ? sx : sx + 2, 4 + b, 1, 11, '#7d93ab');
  }
}

function drawPersonWithSign(g, x, y, L, frame, facing, sign) {
  drawPerson(g, x, y, L, frame, facing, !!sign);
  if (!sign) return;
  const b = frame % 2;
  const bottom = y - 19 + b;
  g.fillStyle = '#7a5230'; g.fillRect(x + 3, bottom, 1, 5);
  sign.draw(g, x + 3, bottom);
}

function headTop(y, sign) { return sign ? y - 19 - sign.h : y - 17; }

// Figur als eigenes Canvas (zum vergrößerten Zeichnen, z. B. in Nahaufnahmen)
function personSprite(L, facing) {
  const { c, g } = makeCanvas(8, 17);
  drawPerson(g, 4, 17, L, 0, facing, false);
  return c;
}
