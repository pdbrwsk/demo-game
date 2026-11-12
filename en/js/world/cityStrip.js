'use strict';

/* =========================================================
   Stadtstreifen: Skyline + Straße (vorgerendert, horizontal kachelbar)
   ========================================================= */
const STYLES = [
  { main: '#9c5a46', dark: '#7d4535', light: '#b06d58' },                // Backstein
  { main: '#7b8296', dark: '#5f6578', light: '#959cb0' },                // Beton
  { main: '#c2a882', dark: '#9f8866', light: '#d6bf9b' },                // Sandstein
  { main: '#4f6d8f', dark: '#3c5573', light: '#6a8aac', glass: true },   // Glasturm
  { main: '#6f8a6b', dark: '#566d53', light: '#87a283' },                // Grün
];
const AWNINGS = [['#d64545', '#f4ecd8'], ['#3d8b5a', '#f4ecd8'], ['#3a7bd5', '#f4ecd8'], ['#e3b23c', '#7d4535']];

function genLayer(rnd, minW, maxW, minTop, maxTop, gapMax) {
  const list = []; let x = 0;
  while (x < STRIP_W) {
    const w = minW + ((rnd() * (maxW - minW)) | 0);
    const top = minTop + ((rnd() * (maxTop - minTop)) | 0);
    list.push({ x, w, top, seed: (rnd() * 1e9) | 0 });
    x += w + ((rnd() * gapMax) | 0);
  }
  return list;
}

function createCityStrip() {
  const { c, g } = makeCanvas(STRIP_W, WORLD_H);
  const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const rnd = mulberry32(7);

  // ---- ferne Skyline
  const far = genLayer(rnd, 16, 40, 135, 230, 4);
  const drawFar = (bd, dx) => {
    const r = mulberry32(bd.seed), x = bd.x + dx;
    R(x, bd.top, bd.w, GROUND - bd.top, '#8299c2');
    if (r() < 0.35) R(x + 3, bd.top - 6, bd.w - 6, 6, '#8299c2');
    if (r() < 0.3) R(x + (bd.w >> 1), bd.top - 14, 1, 14, '#8299c2');
    for (let wy = bd.top + 4; wy < GROUND - 4; wy += 7)
      for (let wx = x + 3; wx < x + bd.w - 4; wx += 5)
        if (r() < 0.55) R(wx, wy, 2, 3, '#9ab0d6');
  };
  far.forEach(b => { drawFar(b, 0); drawFar(b, -STRIP_W); });

  // ---- nahe Skyline
  const near = genLayer(rnd, 34, 70, 172, 285, 3);
  const drawNear = (bd, dx) => {
    const r = mulberry32(bd.seed), x = bd.x + dx, w = bd.w, top = bd.top;
    const st = pick(r, STYLES);
    R(x, top, w, GROUND - top, st.main);
    R(x + w - 2, top, 2, GROUND - top, st.dark);
    R(x, top, w, 2, st.dark); R(x, top + 2, w, 1, st.light);
    // Dachaufbauten
    if (r() < 0.35) { R(x + 6, top - 7, 8, 5, '#6b4a35'); R(x + 6, top - 7, 8, 1, '#7f5a42'); R(x + 7, top - 2, 1, 2, '#3b2a1e'); R(x + 12, top - 2, 1, 2, '#3b2a1e'); }
    if (r() < 0.3) { R(x + w - 10, top - 3, 6, 3, '#9aa0ab'); R(x + w - 10, top - 3, 6, 1, '#b8bdc6'); }
    if (r() < 0.25) { R(x + (w >> 1), top - 12, 1, 12, '#3b3f4a'); R(x + (w >> 1) - 1, top - 12, 3, 1, '#d64545'); }
    // Fenster
    if (st.glass) {
      for (let wy = top + 5; wy < GROUND - 18; wy += 5) {
        R(x + 2, wy, w - 5, 2, '#9ccbe8'); R(x + 2, wy, 3, 2, '#d6ecf8');
      }
    } else {
      for (let wy = top + 6; wy < GROUND - 20; wy += 8) {
        for (let wx = x + 4; wx + 3 <= x + w - 5; wx += 6) {
          R(wx, wy, 3, 4, '#2d3b57');
          R(wx, wy, 1, 2, '#a9cbe8');
          const q = r();
          if (q < 0.1) R(wx + 1, wy, 2, 4, '#e8c86a');
          else if (q < 0.18) R(wx, wy, 3, 2, '#c97b7b');
          R(wx - 1, wy + 4, 5, 1, st.dark);
        }
      }
    }
    // Erdgeschoss: Laden mit Markise und Tür
    const gy = GROUND - 14;
    R(x, gy - 1, w, 1, st.dark);
    R(x + w - 11, gy + 3, 6, 11, '#4a3426'); R(x + w - 7, gy + 8, 1, 1, '#e3b23c');
    if (w > 30) {
      const aw = pick(r, AWNINGS);
      const sw = w - 16;
      R(x + 3, gy + 4, sw - 2, 8, '#5d7fa3'); R(x + 4, gy + 5, 2, 3, '#a9cbe8');
      for (let i = 0; i < sw; i += 2) R(x + 2 + i, gy, 2, 3, aw[(i >> 1) % 2]);
      R(x + 2, gy + 3, sw, 1, '#00000033');
    }
  };
  near.forEach(b => { drawNear(b, 0); drawNear(b, -STRIP_W); });

  // ---- Gehweg hinten
  R(0, GROUND, STRIP_W, 10, '#a9a49b');
  R(0, GROUND, STRIP_W, 1, '#bdb8ae');
  for (let x = 0; x < STRIP_W; x += 12) R(x, GROUND + 1, 1, 9, '#96918a');
  // Laternen
  for (let x = 40; x < STRIP_W; x += 160) {
    R(x, 306, 1, 34, '#3b3f4a'); R(x - 1, 338, 3, 2, '#3b3f4a');
    R(x, 306, 5, 1, '#3b3f4a'); R(x + 3, 307, 4, 2, '#3b3f4a'); R(x + 4, 309, 2, 1, '#fff2b0');
  }
  // Bordstein + Straße
  R(0, 346, STRIP_W, 2, '#77736c');
  R(0, 348, STRIP_W, 32, '#4b4c55');
  for (let i = 0; i < 260; i++) R((rnd() * STRIP_W) | 0, 348 + ((rnd() * 32) | 0), 1, 1, rnd() < 0.5 ? '#55565f' : '#43444c');
  for (let x = 0; x < STRIP_W; x += 32) R(x, 363, 16, 2, '#d8d4c4');
  // Gehweg vorne
  R(0, 380, STRIP_W, 2, '#8a867e'); R(0, 380, STRIP_W, 1, '#a19c93');
  R(0, 382, STRIP_W, 18, '#bab4a8');
  R(0, 391, STRIP_W, 1, '#a59f93');
  for (let x = 0; x < STRIP_W; x += 16) { R(x, 382, 1, 9, '#a59f93'); R(x + 8, 392, 1, 8, '#a59f93'); }
  return c;
}
