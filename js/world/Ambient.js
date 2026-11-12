'use strict';

/* =========================================================
   Wolken & Vögel am Himmel
   ========================================================= */
class Ambient {
  constructor() {
    this.clouds = [
      { x: 20, y: 52, w: 34, v: 3 }, { x: 140, y: 30, w: 46, v: 2 },
      { x: 230, y: 110, w: 28, v: 4 }, { x: 330, y: 70, w: 40, v: 2.5 },
    ];
    this.birds = [{ x: 30, y: 96, v: 14 }, { x: 44, y: 90, v: 14 }, { x: 52, y: 100, v: 14 }];
  }

  update(dt) {
    this.clouds.forEach(c => { c.x += c.v * dt; });
    this.birds.forEach(b => { b.x += b.v * dt; });
  }

  draw(g, camX, camY, time) {
    this.clouds.forEach(c => Ambient.drawCloud(g, Math.round(mod(c.x - camX * 0.3, 440) - 60), c.y - camY, c.w));
    this.birds.forEach((b, i) => Ambient.drawBird(g, Math.round(mod(b.x, 400) - 40), b.y - camY, Math.floor(time * 4 + i) % 2));
  }

  static drawCloud(g, x, y, w) {
    g.fillStyle = '#d5e2f0'; g.fillRect(x, y + 4, w, 2);
    g.fillStyle = '#f4f7fb';
    g.fillRect(x, y, w, 4);
    g.fillRect(x + 3, y - 3, Math.round(w * 0.4), 4);
    g.fillRect(x + Math.round(w * 0.45), y - 5, Math.round(w * 0.35), 6);
    g.fillRect(x + 1, y + 4, w - 2, 1);
  }

  static drawBird(g, x, y, f) {
    g.fillStyle = '#2b3550';
    g.fillRect(x, y, 1, 1);
    if (f) { g.fillRect(x - 2, y - 1, 2, 1); g.fillRect(x + 1, y - 1, 2, 1); }
    else { g.fillRect(x - 2, y + 1, 2, 1); g.fillRect(x + 1, y + 1, 2, 1); }
  }
}
