'use strict';

/* =========================================================
   Szene: Wohnzimmer am Abend, Blick über die Schulter auf den Fernseher
   ========================================================= */
const TV_SCREEN = { x: 104, y: 54, w: 112, h: 60 };
const TV_TICKER = '+++ KEINE NEUEN LEHRKRÄFTE +++ SCHULSANIERUNGEN VERSCHOBEN +++ JUGENDZENTREN VOR DEM AUS +++ WENIGER GELD FÜR BERATUNGSSTELLEN ';
const ANCHOR_LOOK = { skin: '#e0ac69', hair: '#5a3a1e', shirt: '#2b2b33', pants: '#2b2b33', shoes: '#1b1b22', long: true, hat: null };

class LivingRoomScene extends Scene {
  constructor(player) {
    super();
    this.player = player;
    // Der Fernseher kann in Dialogen "sprechen" (game.dialog.say(scene.tv, ...))
    this.tv = { id: 'N', name: 'Nachrichten', color: '#e86a5a', headline: '', image: 'school', ticker: TV_TICKER };
    this.bg = LivingRoomScene.createBackground();
    this.fg = LivingRoomScene.createCouch();
    this.playerSprite = personSprite(player.look, 'back');
    this.anchorSprite = personSprite(ANCHOR_LOOK, 'front');
  }

  render(g) {
    g.drawImage(this.bg, 0, 0);

    // flackerndes Fernsehlicht auf der Wand
    const flick = 0.5 + 0.5 * Math.sin(this.time * 7) * Math.sin(this.time * 2.3);
    g.fillStyle = '#9fd3f0';
    for (let i = 1; i <= 3; i++) {
      g.globalAlpha = 0.035 + 0.015 * flick;
      g.fillRect(100 - i * 10, 50 - i * 6, 120 + i * 20, 96 + i * 8);
    }
    g.globalAlpha = 1;

    this.drawScreen(g);

    // Protagonist von hinten, vergrößert (Nahaufnahme)
    const talking = this.game && this.game.speaker === this.player;
    const bob = talking && Math.floor(this.time * 5) % 2 ? 1 : 0;
    g.drawImage(this.playerSprite, 108, 120 - bob, 24, 51);

    g.drawImage(this.fg, 0, 0);
  }

  drawScreen(g) {
    const { x, y, w, h } = TV_SCREEN;
    const R = (dx, dy, rw, rh, c) => { g.fillStyle = c; g.fillRect(x + dx, y + dy, rw, rh); };
    g.save();
    g.beginPath(); g.rect(x, y, w, h); g.clip();

    // Studio
    R(0, 0, w, 38, '#1f3a6e');
    for (let i = 4; i < w; i += 14) R(i, 0, 6, 38, '#24467f');
    R(0, 30, w, 8, '#18305c');

    // Senderlogo
    R(2, 2, textWidth('AKTUELL') + 4, 7, '#c0392b');
    drawText(g, 'AKTUELL', x + 4, y + 3, '#ffffff');

    // Sprecherin hinter dem Pult
    const ax = x + 18, ay = y + 10;
    g.drawImage(this.anchorSprite, ax, ay, 16, 34);
    const talking = this.game && this.game.speaker === this.tv;
    if (talking && Math.floor(this.time * 8) % 2) { g.fillStyle = '#7a3b2e'; g.fillRect(ax + 6, ay + 12, 4, 2); }
    R(6, 30, 40, 8, '#c9ced8'); R(6, 30, 40, 1, '#eef0f5'); R(6, 36, 40, 2, '#9aa3b5');

    // Bild zur Meldung
    this.drawNewsImage(g, x + 58, y + 6);

    // Bauchbinde
    if (this.tv.headline) {
      R(2, 38, textWidth('EILMELDUNG') + 4, 7, '#c0392b');
      drawText(g, 'EILMELDUNG', x + 4, y + 39, '#ffffff');
      R(0, 45, w, 8, '#f4ecd8');
      drawText(g, this.tv.headline, x + 3, y + 47, '#1b1f2e');
    }

    // Laufband
    R(0, 53, w, 7, '#1b1f2e');
    const ticker = this.tv.ticker;
    const tw = textWidth(ticker) + 4;
    const off = mod(Math.floor(this.time * 18), tw);
    drawText(g, ticker, x + w - off, y + 54, '#ffd84a');
    drawText(g, ticker, x + w - off + tw, y + 54, '#ffd84a');
    drawText(g, ticker, x + w - off - tw, y + 54, '#ffd84a');

    // Scanlines + Flackern
    g.fillStyle = '#000000';
    g.globalAlpha = 0.12;
    for (let sy = 1; sy < h; sy += 2) g.fillRect(x, y + sy, w, 1);
    g.globalAlpha = 0.04 * (Math.floor(this.time * 13) % 3);
    g.fillStyle = '#ffffff'; g.fillRect(x, y, w, h);
    g.globalAlpha = 1;
    g.restore();
  }

  drawNewsImage(g, x, y) {
    const R = (dx, dy, rw, rh, c) => { g.fillStyle = c; g.fillRect(x + dx, y + dy, rw, rh); };
    const bw = 48, bh = 26;
    R(-1, -1, bw + 2, bh + 2, '#f4ecd8');
    R(0, 0, bw, bh, '#9fd3f0');
    R(0, 20, bw, 6, '#7a8a6a');
    const kind = this.tv.image;
    if (kind === 'school' || kind === 'youth') {
      const label = kind === 'school' ? 'SCHULE' : 'JUGEND';
      const col = kind === 'school' ? '#c2a882' : '#9c5a46';
      R(8, 8, 32, 14, col); R(6, 6, 36, 3, '#6b4a35');
      R(10 + 1, 9, textWidth(label) + 4, 7, '#f4ecd8');
      drawText(g, label, x + 13, y + 10, '#1b1f2e');
      for (let i = 0; i < 4; i++) R(11 + i * 7, 17, 3, 3, '#2d3b57');
      // roter Pfeil nach unten = Kürzung
      R(41, 2, 3, 6, '#d64545'); R(39, 8, 7, 1, '#d64545'); R(40, 9, 5, 1, '#d64545'); R(41, 10, 3, 1, '#d64545'); R(42, 11, 1, 1, '#d64545');
    } else if (kind === 'demo') {
      // nur wenige Menschen mit Mini-Plakaten
      const rnd = mulberry32(3);
      const placards = ['#f4ecd8', '#ffd84a', '#e86a5a'];
      for (let i = 0; i < 4; i++) {
        const px = x + 9 + i * 10, py = y + 23 + (i % 2);
        drawPerson(g, px, py, randomLook(rnd), 0, 'right', i % 2 === 0);
        if (i % 2 === 0) { R(px + 3 - x, py - 19 - y, 1, 3, '#7a5230'); R(px + 1 - x, py - 23 - y, 5, 4, placards[i % 3]); }
      }
    } else if (kind === 'riot') {
      // Abendhimmel, Rauch, brennende Tonne, Polizeikette
      R(0, 0, bw, 20, '#3d3468'); R(0, 14, bw, 6, '#5a3c6e'); R(0, 20, bw, 6, '#4b4c55');
      R(6, 4, 8, 5, '#77747f'); R(10, 1, 7, 5, '#5b5866'); R(4, 9, 9, 4, '#77747f');
      R(7, 16, 6, 6, '#4a4f5a');
      const f = Math.floor(this.time * 8) % 2;
      R(7, 12 + f, 2, 4 - f, '#f39c3c'); R(9, 11, 2, 5, '#ffd84a'); R(11, 13 - f, 2, 3 + f, '#d64545');
      R(16, 18, 2, 1, '#d6ecf8'); R(20, 21, 1, 1, '#d6ecf8'); R(24, 19, 2, 1, '#d6ecf8');
      [33, 41].forEach((px, i) => drawPerson(g, x + px, y + 24 - i, POLICE_LOOK, 0, 'left', false));
      if (f) { R(0, 0, bw, 1, '#7fb2ff'); }
    } else if (kind === 'parliament') {
      // Parlamentsgebäude mit Kuppel, grüner Pfeil nach oben = Umdenken
      R(20, 6, 10, 6, '#bfe3f5'); R(22, 4, 6, 2, '#bfe3f5'); R(24, 2, 2, 2, '#7d93ab');
      R(4, 11, 40, 2, '#bdb8ae'); R(6, 13, 36, 8, '#d8d4c4');
      for (let i = 0; i < 7; i++) R(8 + i * 5, 14, 2, 7, '#a8a395');
      R(5, 20, 38, 1, '#a8a395');
      R(42, 2, 1, 1, '#4caf6a'); R(41, 3, 3, 1, '#4caf6a'); R(40, 4, 5, 1, '#4caf6a'); R(39, 5, 7, 1, '#4caf6a'); R(41, 6, 3, 6, '#4caf6a');
    }
  }

  /* ---------- vorgerenderte Ebenen ---------- */

  static createBackground() {
    const { c, g } = makeCanvas(W, H);
    const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    const rnd = mulberry32(11);

    // Wand mit Tapetenstreifen
    R(0, 0, W, 140, '#4a3f5c');
    for (let x = 0; x < W; x += 10) R(x, 0, 2, 140, '#51456a');
    R(0, 137, W, 3, '#3a2c36');

    // Holzboden
    R(0, 140, W, 40, '#5a3d28');
    for (let y = 140, row = 0; y < H; y += 6, row++) {
      R(0, y, W, 1, '#4d3422');
      for (let x = (row % 2) * 20; x < W; x += 40) R(x, y, 1, 6, '#4d3422');
    }

    // Fenster mit Abendhimmel
    const wx = 14, wy = 46, ww = 60, wh = 60;
    const sky = ['#2b2d5c', '#3d3468', '#5a3c6e', '#8e4a6e', '#c25f62', '#e88a5a', '#f0a860'];
    sky.forEach((col, i) => R(wx, wy + i * (wh / sky.length), ww, Math.ceil(wh / sky.length), col));
    for (let x = wx; x < wx + ww;) {
      const bw = 5 + ((rnd() * 8) | 0), bh = 8 + ((rnd() * 22) | 0);
      R(x, wy + wh - bh, bw, bh, '#1e1c38');
      for (let yy = wy + wh - bh + 2; yy < wy + wh - 2; yy += 4)
        for (let xx = x + 1; xx < x + bw - 1; xx += 3) if (rnd() < 0.3) R(xx, yy, 1, 2, '#ffd84a');
      x += bw;
    }
    R(wx - 3, wy - 3, ww + 6, 3, '#d8ccb4'); R(wx - 3, wy + wh, ww + 6, 4, '#d8ccb4');
    R(wx - 3, wy, 3, wh, '#d8ccb4'); R(wx + ww, wy, 3, wh, '#d8ccb4');
    R(wx + ww / 2 - 1, wy, 2, wh, '#d8ccb4'); R(wx, wy + wh / 2 - 1, ww, 2, '#d8ccb4');
    // Vorhänge
    R(wx - 9, wy - 6, 9, wh + 14, '#a8444a'); R(wx + ww, wy - 6, 9, wh + 14, '#a8444a');
    for (let i = 0; i < 9; i += 3) { R(wx - 9 + i, wy - 6, 1, wh + 14, '#8e3a3f'); R(wx + ww + i, wy - 6, 1, wh + 14, '#8e3a3f'); }
    R(wx - 12, wy - 8, ww + 24, 2, '#3b3f4a');

    // Regal mit Büchern
    const books = ['#d64545', '#3a7bd5', '#e3b23c', '#4caf6a', '#9b59b6', '#f4ecd8', '#2fb3a8'];
    [92, 118].forEach(sy => {
      R(244, sy, 50, 3, '#6b4a35'); R(244, sy + 3, 50, 1, '#3b2a1e');
      for (let x = 247; x < 290;) {
        const bw = 3 + ((rnd() * 2) | 0), bh = 9 + ((rnd() * 5) | 0);
        if (rnd() < 0.15) { x += 4; continue; }
        R(x, sy - bh, bw, bh, pick(rnd, books)); R(x, sy - bh, 1, bh, '#00000022');
        x += bw;
      }
    });

    // Stehlampe mit warmem Licht
    g.fillStyle = '#ffd98a';
    for (let i = 1; i <= 3; i++) { g.globalAlpha = 0.05; g.fillRect(304 - i * 10, 60 - i * 8, 16 + i * 20, 30 + i * 18); }
    g.globalAlpha = 1;
    R(303, 72, 2, 76, '#3b3f4a'); R(298, 147, 12, 3, '#3b3f4a');
    R(298, 62, 12, 2, '#e8c86a'); R(297, 64, 14, 4, '#e8c86a'); R(296, 68, 16, 4, '#d9b552'); R(296, 72, 16, 1, '#fff2b0');

    // Pflanze
    R(66, 134, 12, 12, '#b0603a'); R(65, 133, 14, 2, '#c97448');
    [[71, 112, 2, 22], [66, 118, 2, 14], [76, 116, 2, 16], [62, 122, 5, 2], [77, 120, 5, 2], [68, 114, 4, 2], [73, 110, 4, 3]]
      .forEach(([x, y, w, h]) => R(x, y, w, h, '#3d8b5a'));
    R(72, 112, 1, 20, '#4caf6a');

    // Fernsehschrank
    R(84, 122, 152, 24, '#4a3426'); R(84, 122, 152, 2, '#5d4230');
    R(88, 128, 70, 14, '#3e2b1f'); R(162, 128, 70, 14, '#3e2b1f');
    R(121, 134, 4, 2, '#e3b23c'); R(195, 134, 4, 2, '#e3b23c');
    R(86, 146, 3, 2, '#2b1d14'); R(231, 146, 3, 2, '#2b1d14');

    // Fernseher
    R(100, 50, 120, 68, '#1b1b22'); R(101, 51, 118, 1, '#3b3f4a');
    R(103, 53, 114, 62, '#0e1018');
    R(154, 118, 12, 4, '#2b2b33'); R(146, 121, 28, 1, '#2b2b33');
    R(212, 116, 2, 1, '#d64545');
    return c;
  }

  static createCouch() {
    const { c, g } = makeCanvas(W, H);
    const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    // Rückenlehne im Vordergrund
    R(20, 150, 280, 30, '#7a3b4a');
    R(18, 152, 284, 28, '#7a3b4a');
    R(20, 150, 280, 2, '#8e4a5a'); R(18, 152, 2, 4, '#8e4a5a'); R(300, 152, 2, 4, '#8e4a5a');
    R(18, 170, 284, 10, '#64303d');
    for (let x = 60; x < 300; x += 60) R(x, 154, 1, 16, '#6d3542');
    return c;
  }
}
