'use strict';

/* =========================================================
   Demo-Zug: Menschen + Banner in einer Endlosschleife, mit Sprechchören
   ========================================================= */
const CHANTS = ['EDUCATION FOR ALL!', 'WE ARE LOUD!', 'LISTEN TO US!', 'MORE SOCIAL AID!', 'TOGETHER!'];

class Crowd {
  constructor(seed, count = 44) {
    const rnd = mulberry32(seed);
    this.time = 0;
    this.members = [];
    this.chants = [];      // aktuelle Sprechblasen { target, text, time }
    this.chantTimer = 1.5; // bis zum nächsten zufälligen Sprechchor
    this.cheer = 0;        // > 0: alle recken abwechselnd die Arme

    const banners = [
      { off: 60, lane: 2, text: 'BETTER EDUCATION!', bg: '#f4ecd8', fg: '#c0392b' },
      { off: 420, lane: 1, text: 'SOCIAL. FAIR. NOW!', bg: '#c0392b', fg: '#f4ecd8' },
    ];
    banners.forEach(b => {
      const w = textWidth(b.text) + 6;
      this.members.push({ type: 'banner', ...b, w, looks: [randomLook(rnd), randomLook(rnd)], phase: rnd() * 12 });
    });
    for (let i = 0; i < count; i++) {
      this.members.push({
        type: 'person', off: rnd() * CROWD_L, lane: (rnd() * LANES.length) | 0,
        look: randomLook(rnd), sign: rnd() < 0.33 ? pick(rnd, CROWD_SIGNS) : null, phase: rnd() * 12,
      });
    }
  }

  pos(c) { return c.off + this.time * CROWD_SPEED; }

  // Weltposition: die Schleife wird immer um die Kamera herum gelegt
  x(c, camX) {
    const base = camX - 120;
    return base + mod(this.pos(c) - base, CROWD_L);
  }

  visiblePeople(camX) {
    return this.members.filter(c => c.type === 'person').filter(c => {
      const x = this.x(c, camX);
      return x > camX + 30 && x < camX + W - 30;
    });
  }

  update(dt, camX, chanting) {
    this.time += dt;
    this.cheer = Math.max(0, this.cheer - dt);
    this.chants.forEach(ch => { ch.time -= dt; });
    this.chants = this.chants.filter(ch => ch.time > 0);
    if (!chanting) return;
    this.chantTimer -= dt;
    if (this.chantTimer <= 0) {
      this.chantTimer = 3 + Math.random() * 2;
      const visible = this.visiblePeople(camX);
      if (visible.length) {
        const target = visible[(Math.random() * visible.length) | 0];
        this.chants.push({ target, text: CHANTS[(Math.random() * CHANTS.length) | 0], time: 2.2 });
      }
    }
  }

  // Antwort der Menge auf einen Sprechchor: einige rufen gleichzeitig (Blasen ohne Überlappung),
  // alle recken die Arme. avoidX = Weltpositionen, an denen schon eine Blase steht.
  echo(text, camX, avoidX = [], secs = 2.6) {
    this.cheer = secs;
    const w = textWidth(text) + 10;
    const taken = [...avoidX];
    const candidates = this.visiblePeople(camX).sort(() => Math.random() - 0.5);
    for (const c of candidates) {
      const x = this.x(c, camX);
      if (taken.every(t => Math.abs(t - x) >= w)) {
        taken.push(x);
        this.chants.push({ target: c, text, time: secs });
      }
    }
  }

  // Fügt Zeichenaufrufe (nach Tiefe y sortierbar) in draws ein
  collectDraws(g, cx, cy, draws) {
    this.members.forEach(c => {
      const wx = this.x(c, cx), y = LANES[c.lane];
      const frame = Math.floor((this.pos(c) + c.phase) / 3) % 4;
      if (c.type === 'person') {
        if (wx < cx - 30 || wx > cx + W + 30) return;
        const sx = Math.round(wx) - cx;
        const fist = !c.sign && this.cheer > 0 && Math.floor(this.time * 4 + c.phase) % 2 === 0;
        draws.push({ y, fn: () => c.sign
          ? drawPersonWithSign(g, sx, y - cy, c.look, frame, 'right', c.sign)
          : drawPerson(g, sx, y - cy, c.look, frame, 'right', fist) });
      } else {
        if (wx + c.w < cx - 10 || wx > cx + W + 10) return;
        draws.push({ y, fn: () => Crowd.drawBanner(g, Math.round(wx) - cx, y - cy, c, frame) });
      }
    });
  }

  drawChants(g, cx, cy) {
    this.chants.forEach(ch => {
      const c = ch.target;
      const x = Math.round(this.x(c, cx)) - cx, y = LANES[c.lane] - cy;
      drawBubble(g, x, headTop(y, c.sign) - 2, ch.text);
    });
  }

  static drawBanner(g, x, y, b, frame) {
    const bob = frame % 2;
    const lx = x + 3, rx = x + b.w - 3;
    drawPerson(g, lx, y, b.looks[0], frame, 'right', false);
    drawPerson(g, rx, y, b.looks[1], (frame + 2) % 4, 'right', false);
    const top = y - 11 + bob;
    g.fillStyle = '#7a5230';
    g.fillRect(x, top - 4, 1, 14); g.fillRect(x + b.w - 1, top - 4, 1, 14);
    g.fillStyle = '#3a2a1c'; g.fillRect(x + 1, top, b.w - 2, 9);
    g.fillStyle = b.bg; g.fillRect(x + 2, top + 1, b.w - 4, 7);
    drawText(g, b.text, x + 3, top + 2, b.fg);
  }
}
