'use strict';

/* =========================================================
   Szene: Ausschreitungen in einer Seitenstraße am Abend.
   Vermummte Gruppe in der Mitte, Polizeikette + Einsatzwagen rechts,
   brennende Mülltonne, Bushaltestelle links (geht zu Bruch).
   ========================================================= */
const POLICE_LOOK = {
  skin: '#f1c27d', hair: '#2b1d14', shirt: '#2d3b57', pants: '#2d3b57', shoes: '#1b1b22',
  long: false, hat: null, helmet: '#1f2a3f', shield: true,
};
const RIOT_FIRE = { x: 119, y: 124 };   // Oberkante der Mülltonne

class RiotScene extends PlazaScene {
  constructor(player, friend, agitator, officer) {
    super(1000);
    RiotScene.drawVan(this.bgG);
    this.tint('#2a1c48', 0.4);

    this.broken = false;   // Glas der Bushaltestelle
    this.projectiles = []; // { x0, y0, x1, y1, t, kind }
    this.sparks = [];      // { x, y, time }
    this.drops = [];       // Flaschen der Fluchtphase { x, y, t }
    this.chasing = null;   // Zustand der Fluchtphase
    this.officer = officer;

    player.place(96, 158, 'right');
    friend.place(84, 164, 'right');
    agitator.place(204, 148, 'right');
    officer.place(238, 160, 'left');
    this.actors.push(player, friend, agitator, officer);

    const rnd = mulberry32(13);
    const dark = ['#2b2b33', '#1a1a1a', '#3b3f4a'];
    this.rioters = [[150, 140], [166, 148], [182, 138], [158, 162], [176, 168], [192, 158]].map(([x, y]) =>
      this.addExtra(x, y, { ...randomLook(rnd), shirt: pick(rnd, dark), hair: '#1a1a1a', pants: '#2b2b33', hat: null, mask: '#1a1a1a' }));
    this.police = [[236, 140], [250, 150], [254, 168], [266, 142], [270, 158]].map(([x, y]) => {
      const p = new Actor({ id: 'X', name: '', color: '#5b8bd6', x, y, look: { ...POLICE_LOOK, skin: pick(rnd, SKINS) }, facing: 'left' });
      this.actors.push(p);
      return p;
    });
  }

  update(dt) {
    super.update(dt);
    this.sparks.forEach(s => { s.time -= dt; });
    this.sparks = this.sparks.filter(s => s.time > 0);
    if (this.chasing) this.updateChase(dt);
  }

  /* ===== Fluchtphase: Flaschen ausweichen, Abstand zur Polizei halten ===== */
  // Das Promise endet, sobald die Polizei den Spieler eingeholt hat (Ausweichen zögert das nur hinaus).
  chase(player, secs = 12) {
    player.control = this.game.keys; player.drift = false; player.speed = 46;
    this.bounds = { x0: 8, x1: 215, y0: 126, y1: 176 };
    this.player = null;
    [this.officer, ...this.police].forEach(p => p.walkTo(p.x - 300, p.y, 12));
    return new Promise(resolve => {
      this.chasing = { player, left: secs, total: secs, timer: 0.5, hits: 0, resolve };
    });
  }

  updateChase(dt) {
    const c = this.chasing, P = c.player;
    c.left -= dt;
    c.timer -= dt;
    if (c.timer <= 0) {
      c.timer = 0.8 + Math.random() * 0.4;
      const near = Math.random() < 0.75;
      const x = near ? P.x + (Math.random() - 0.5) * 30 : 20 + Math.random() * 190;
      const y = near ? P.y + (Math.random() - 0.5) * 12 : 130 + Math.random() * 44;
      this.drops.push({ x: Math.min(Math.max(x, 10), 215), y: Math.min(Math.max(y, 128), 176), t: 0 });
    }
    this.drops.forEach(d => { d.t += dt / 0.9; });
    this.drops = this.drops.filter(d => {
      if (d.t < 1) return true;
      this.sparks.push({ x: d.x, y: d.y, time: 0.4 });
      if (Math.abs(P.x - d.x) < 9 && Math.abs(P.y - d.y) < 7) { c.hits++; P.blink = 1; this.game.sound.hit(); }
      return false;
    });
    // Die Polizei wird mit der Zeit schneller als der Spieler: sie holt ihn immer ein
    const k = 1 - Math.max(0, c.left) / c.total;
    [this.officer, ...this.police].forEach(p => { if (p.target) p.target.speed = 12 + k * 50; });
    const caught = [this.officer, ...this.police].some(p => Math.abs(p.x - P.x) < 12 && Math.abs(p.y - P.y) < 9);
    if (caught || c.hits >= 3 || c.left <= -3) this.endChase(false);
  }

  endChase(escaped) {
    const c = this.chasing;
    this.chasing = null;
    this.drops = [];
    [this.officer, ...this.police].forEach(p => { p.target = null; });
    c.player.control = null; c.player.drift = true; c.player.speed = PLAYER_SPEED;
    c.resolve(escaped);
  }

  // Wurf mit Flugbahn; das Promise endet beim Aufprall
  async throwAt(thrower, tx, ty, kind = 'stone') {
    thrower.facing = tx < thrower.x ? 'left' : 'right';
    thrower.raised = true;
    await wait(350);
    const p = { x0: thrower.x + (thrower.facing === 'left' ? 0 : 4), y0: thrower.y - 18, x1: tx, y1: ty, t: 0, kind };
    this.projectiles.push(p);
    await this.game.tweens.add(v => { p.t = v; }, 0, 1, 750);
    this.projectiles.splice(this.projectiles.indexOf(p), 1);
    this.sparks.push({ x: tx, y: ty, time: 0.4 });
    thrower.raised = false;
  }

  drawBack(g) {
    const t = this.time;
    const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };

    // Blaulicht auf dem Einsatzwagen
    const ph = Math.floor(t * 4) % 2;
    R(262, 97, 5, 2, ph ? '#7fb2ff' : '#1f3a6e'); R(267, 97, 5, 2, ph ? '#1f3a6e' : '#7fb2ff');

    // Bushaltestelle
    R(20, 92, 54, 3, '#3b3f4a'); R(20, 95, 2, 25, '#3b3f4a'); R(72, 95, 2, 25, '#3b3f4a');
    R(78, 88, 1, 32, '#3b3f4a'); R(75, 83, 7, 7, '#e3c23c'); drawText(g, 'H', 77, 84, '#2e7d32');
    if (!this.broken) {
      g.globalAlpha = 0.45; R(22, 96, 50, 22, '#bfe3f5'); g.globalAlpha = 1;
      R(26, 98, 1, 6, '#e8f6fd'); R(27, 97, 1, 3, '#e8f6fd'); R(52, 100, 1, 5, '#e8f6fd');
    } else {
      g.globalAlpha = 0.45;
      R(22, 96, 50, 3, '#bfe3f5'); R(22, 99, 6, 4, '#bfe3f5'); R(64, 99, 8, 6, '#bfe3f5'); R(22, 103, 3, 5, '#bfe3f5');
      g.globalAlpha = 1;
      [[30, 99], [44, 99], [58, 99], [28, 103]].forEach(([x, y]) => R(x, y, 2, 1, '#e8f6fd'));
      [[26, 120], [31, 121], [37, 119], [44, 122], [50, 120], [57, 121], [63, 119], [68, 122], [40, 124]]
        .forEach(([x, y], i) => R(x, y, 1 + (i % 2), 1, '#d6ecf8'));
    }

    // Feuerschein + brennende Mülltonne + Rauch
    const { x, y } = RIOT_FIRE;
    const flick = 0.5 + 0.5 * Math.sin(t * 11) * Math.sin(t * 3.7);
    g.fillStyle = '#ff9a3c';
    for (let i = 1; i <= 3; i++) {
      g.globalAlpha = 0.05 + 0.02 * flick;
      g.fillRect(x - i * 14, y - 10 - i * 10, i * 28, 24 + i * 14);
    }
    g.globalAlpha = 1;
    R(x - 6, y, 12, 10, '#4a4f5a'); R(x - 7, y, 14, 2, '#5d636f'); R(x - 4, y + 3, 1, 6, '#3b3f4a'); R(x + 2, y + 3, 1, 6, '#3b3f4a');
    for (let i = 0; i < 5; i++) {
      const fx = x - 5 + i * 2;
      const h = 6 + Math.round(5 * Math.abs(Math.sin(t * 9 + i * 1.9)));
      R(fx, y - h, 2, h, '#d64545');
      R(fx, y - h + 2, 2, h - 2, '#f39c3c');
      R(fx, y - (h >> 1), 2, h >> 1, '#ffd84a');
    }
    for (let i = 0; i < 8; i++) {
      const k = (t * 0.22 + i / 8) % 1;
      const s = Math.round(3 + k * 10);
      const sx = Math.round(x + Math.sin(i * 2.1 + t * 0.8) * 3 + k * 20 - s / 2);
      const sy = Math.round(y - 12 - k * 80);
      g.globalAlpha = 0.5 * (1 - k);
      g.fillStyle = i % 2 ? '#5b5866' : '#77747f';
      g.fillRect(sx, sy, s, s); g.fillRect(sx - 1, sy + 1, s + 2, s - 2);
    }
    g.globalAlpha = 1;
  }

  drawFront(g) {
    // Wurfgeschosse
    this.projectiles.forEach(p => {
      const x = Math.round(p.x0 + (p.x1 - p.x0) * p.t);
      const y = Math.round(p.y0 + (p.y1 - p.y0) * p.t - Math.sin(Math.PI * p.t) * 26);
      if (p.kind === 'bottle') { g.fillStyle = '#3d8b5a'; g.fillRect(x, y, 2, 3); g.fillStyle = '#9fd3a8'; g.fillRect(x, y, 1, 1); }
      else { g.fillStyle = '#8a867e'; g.fillRect(x, y, 2, 2); }
    });
    // Fluchtphase: Markierungen am Boden, fallende Flaschen, Trefferanzeige, Zeitbalken
    if (this.chasing) {
      const c = this.chasing, blink = Math.floor(this.time * 10) % 2;
      this.drops.forEach(d => {
        const x = Math.round(d.x), y = Math.round(d.y);
        g.fillStyle = blink ? '#ff6b5a' : '#a63a30';
        g.fillRect(x - 5, y - 2, 11, 1); g.fillRect(x - 5, y + 2, 11, 1); g.fillRect(x - 5, y - 2, 1, 5); g.fillRect(x + 5, y - 2, 1, 5);
        const by = Math.round(y - (1 - d.t) * (1 - d.t) * 90);
        g.fillStyle = '#3d8b5a'; g.fillRect(x, by, 2, 3); g.fillStyle = '#9fd3a8'; g.fillRect(x, by, 1, 1);
      });
      for (let i = 0; i < 3; i++) { g.fillStyle = i < 3 - c.hits ? '#d64545' : '#4a4f5a'; g.fillRect(6 + i * 7, 6, 5, 5); }
      g.fillStyle = '#1b1f2e'; g.fillRect(30, 7, 62, 4);
      g.fillStyle = '#ffd84a'; g.fillRect(31, 8, Math.round(60 * (Math.min(1, 1 - c.left / c.total))), 2);
    }
    // Aufprall
    this.sparks.forEach(s => {
      const r = Math.round((0.4 - s.time) * 12) + 1;
      g.fillStyle = '#ffffff';
      [[-r, 0], [r, 0], [0, -r], [0, r], [-r + 1, -r + 1], [r - 1, -r + 1], [-r + 1, r - 1], [r - 1, r - 1]]
        .forEach(([dx, dy]) => g.fillRect(s.x + dx, s.y + dy, 1, 1));
    });
    // Blaulicht-Flackern über der ganzen Szene
    if (Math.floor(this.time * 4) % 2) {
      g.globalAlpha = 0.06; g.fillStyle = '#3a6fd8'; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
    }
  }

  static drawVan(g) {
    const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    R(256, 104, 62, 26, '#e8eaee'); R(256, 104, 62, 1, '#ffffff');
    R(256, 99, 20, 5, '#e8eaee');                                   // Fahrerhaus
    R(258, 106, 14, 8, '#2d3b57'); R(276, 106, 40, 6, '#2d3b57');   // Fenster
    R(256, 115, 62, 4, '#3a7bd5');
    drawText(g, 'POLICE', 282, 121, '#1f3a6e');
    R(261, 96, 12, 1, '#3b3f4a');
    R(262, 128, 9, 4, '#1b1b22'); R(302, 128, 9, 4, '#1b1b22');
    R(264, 129, 3, 2, '#5a5f6b'); R(304, 129, 3, 2, '#5a5f6b');
  }
}
