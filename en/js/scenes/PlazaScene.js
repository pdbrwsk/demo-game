'use strict';

/* =========================================================
   Basis für Szenen mit fester Kamera vor der Stadtkulisse
   (Kundgebung, Ausschreitungen). Figurkoordinaten = Bildschirmkoordinaten,
   Gehweg hinten bei y ≈ 116, Straße 128–160, Gehweg vorne 160–180.
   Statisten sind ebenfalls Actors (this.extras) und können jubeln.
   ========================================================= */
class PlazaScene extends Scene {
  constructor(stripX) {
    super();
    const { c, g } = makeCanvas(W, H);
    const sx = mod(stripX, STRIP_W);
    const strip = createCityStrip();
    g.drawImage(createSky(), 0, -CAM_DEMO_Y);
    g.drawImage(strip, -sx, -CAM_DEMO_Y);
    g.drawImage(strip, STRIP_W - sx, -CAM_DEMO_Y);
    this.bg = c;
    this.bgG = g;        // Unterklassen zeichnen hier statische Requisiten hinein
    this.actors = [];    // alle Figuren, nach Tiefe sortiert gezeichnet
    this.extras = [];    // Statisten (jubeln bei cheer())
    this.cheerTime = 0;
    this.bounds = { x0: 8, x1: W - 12, y0: 122, y1: 176 }; // Laufbereich gesteuerter Figuren
    this.talkables = []; // ansprechbare Statisten (Actor mit .talk)
    this.player = null;  // Figur, für die der Gesprächs-Hinweis (E) gezeigt wird
  }

  // nächster ansprechbarer Statist in Reichweite von actor (oder null)
  nearTalk(actor) {
    let best = null, bd = 1e9;
    this.talkables.forEach(t => {
      const dx = Math.abs(t.x - actor.x), dy = Math.abs(t.y - actor.y) * 1.8;
      if (dx < 20 && dy < 20 && dx + dy < bd) { best = t; bd = dx + dy; }
    });
    return best;
  }

  // Statist mit Aussehen look an (x, y)
  addExtra(x, y, look, facing = 'right', sign = null) {
    const a = new Actor({ id: 'X', name: '', color: '#f4ecd8', x, y, look, facing });
    a.sign = sign;
    this.extras.push(a);
    this.actors.push(a);
    return a;
  }

  // Hintergrund einfärben (z. B. Abendstimmung), nach den statischen Requisiten aufrufen
  tint(color, alpha) {
    const g = this.bgG;
    g.globalAlpha = alpha; g.fillStyle = color; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
  }

  // Jubel: Statisten recken abwechselnd die Arme, einige rufen etwas (gleichmäßig verteilt)
  cheer(ms, calls = []) {
    this.cheerTime = ms / 1000;
    const pool = this.extras.filter(a => a.x > 20 && a.x < W - 20).sort((a, b) => a.x - b.x);
    calls.forEach((text, i) => this.shout(pool[Math.floor((i + 0.5) * pool.length / calls.length)], text, ms));
  }

  update(dt) {
    super.update(dt);
    if (this.cheerTime > 0) {
      this.cheerTime -= dt;
      const on = this.cheerTime > 0;
      this.extras.forEach((a, i) => { a.raised = on && Math.floor(this.time * 4 + i * 1.7) % 2 === 0; });
    }
    this.actors.forEach(a => a.update(dt));
    const b = this.bounds;
    this.actors.forEach(a => {
      if (!a.control) return;
      a.x = Math.min(Math.max(a.x, b.x0), b.x1);
      a.y = Math.min(Math.max(a.y, b.y0), b.y1);
    });
  }

  render(g) {
    g.drawImage(this.bg, 0, 0);
    this.drawBack(g);
    [...this.actors].sort((a, b) => a.y - b.y).forEach(a => a.draw(g, 0, 0));
    this.drawFront(g);
    this.drawTalkMarks(g);
    this.drawShouts(g);
  }

  // '!' über Ansprechbaren, 'E' über dem, der gerade in Reichweite ist
  drawTalkMarks(g) {
    const near = this.player && this.nearTalk(this.player);
    this.talkables.forEach(t => {
      const x = Math.round(t.x), y = t.headTop() - 7 - (Math.floor(this.time * 3) % 2);
      if (t === near) {
        g.fillStyle = '#f4ecd8'; g.fillRect(x - 4, y - 1, 9, 9);
        drawText(g, 'E', x - 1, y + 1, '#1b1f2e');
      } else drawText(g, '!', x - 1, y, '#ffd84a');
    });
  }

  drawBack(g) {}   // bewegte Requisiten hinter den Figuren
  drawFront(g) {}  // Effekte vor den Figuren

  speakerAnchor(a) {
    if (!this.actors.includes(a)) return null;
    return { x: Math.round(a.x), headTop: a.headTop() };
  }
}
