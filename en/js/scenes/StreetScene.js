'use strict';

/* =========================================================
   Szene: Straße in der Innenstadt mit Demo-Zug
   ========================================================= */
class StreetScene extends Scene {
  constructor(actors, crowdSize) {
    super();
    this.sky = createSky();
    this.strip = createCityStrip();
    this.ambient = new Ambient();
    this.crowd = new Crowd(42, crowdSize);
    this.cam = new Camera(0, CAM_MENU_Y);
    this.actors = actors;
    this.demoVisible = false; // Demo sichtbar / Sprechchöre an
    this.autoChants = true;   // zufällige Sprechchöre (aus, während der Spieler selbst ruft)
  }

  update(dt) {
    super.update(dt);
    this.ambient.update(dt);
    this.actors.forEach(a => a.update(dt));
    this.cam.update(dt);
    // gesteuerte Figur bleibt auf der Straße und im Bild
    this.actors.forEach(a => {
      if (!a.control) return;
      a.x = Math.min(Math.max(a.x, this.cam.x + 12), this.cam.x + W - 30);
      a.y = Math.min(Math.max(a.y, LANES[0]), LANES[3] + 8);
    });
    this.crowd.update(dt, this.cam.x, this.demoVisible && this.autoChants);
  }

  render(g) {
    const cx = Math.round(this.cam.x), cy = Math.round(this.cam.y);

    g.drawImage(this.sky, 0, -cy);
    this.ambient.draw(g, this.cam.x, cy, this.time);

    const sx = mod(cx, STRIP_W);
    g.drawImage(this.strip, -sx, -cy);
    g.drawImage(this.strip, STRIP_W - sx, -cy);

    // Figuren nach Tiefe sortiert zeichnen
    const draws = [];
    if (this.demoVisible || cy > 150) this.crowd.collectDraws(g, cx, cy, draws);
    this.actors.forEach(a => draws.push({ y: a.y + 0.5, fn: () => a.draw(g, cx, cy) }));
    draws.sort((a, b) => a.y - b.y).forEach(d => d.fn());

    this.crowd.drawChants(g, cx, cy);
    this.drawShouts(g);
  }

  speakerAnchor(a) {
    if (!this.actors.includes(a)) return null;
    return { x: Math.round(a.x) - Math.round(this.cam.x), headTop: a.headTop() - Math.round(this.cam.y) };
  }
}
