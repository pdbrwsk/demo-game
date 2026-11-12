'use strict';

/* =========================================================
   Himmel mit Sonne (vorgerendert, W x GROUND)
   ========================================================= */
function createSky() {
  const { c, g } = makeCanvas(W, GROUND);
  const cols = ['#3d5fa8', '#4a6fb5', '#5880c0', '#6a92cb', '#7fa5d5', '#97b8de', '#b3cbe6', '#d4dcea', '#f0d9bd'];
  const bh = Math.ceil(GROUND / cols.length);
  cols.forEach((col, i) => { g.fillStyle = col; g.fillRect(0, i * bh, W, bh); });
  // Dithering an den Übergängen
  for (let i = 1; i < cols.length; i++) {
    const y0 = i * bh;
    g.fillStyle = cols[i];
    for (let x = 0; x < W; x++) {
      if (x % 4 === 0) g.fillRect(x, y0 - 2, 1, 1);
      if (x % 2 === 0) g.fillRect(x, y0 - 1, 1, 1);
    }
    g.fillStyle = cols[i - 1];
    for (let x = 1; x < W; x += 4) g.fillRect(x, y0, 1, 1);
  }
  // Sonne
  const sx = 258, sy = 78;
  for (let dy = -10; dy <= 10; dy++) for (let dx = -10; dx <= 10; dx++) {
    const d = dx * dx + dy * dy;
    if (d <= 100) { g.fillStyle = d <= 49 ? '#fff6d6' : '#ffe9a8'; g.fillRect(sx + dx, sy + dy, 1, 1); }
  }
  return c;
}
