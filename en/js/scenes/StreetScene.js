'use strict';

/* =========================================================
   Szene: Straße in der Innenstadt mit Demo-Zug
   ========================================================= */
const WINDOW_CALLS = ['CAN YOU KEEP IT DOWN?!', 'SOME OF US ARE TRYING TO SLEEP!', 'WHAT A RACKET!', 'GO PROTEST SOMEWHERE ELSE!', 'ENOUGH ALREADY!'];

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
    this.windowTimer = 25 + Math.random() * 20; // Sekunden bis zum nächsten Ruf aus einem Fenster
    this.windowCall = null;   // { x (Welt), y, text, time }
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
    // sehr selten ruft jemand aus einem Hochhaus
    if (this.windowCall && (this.windowCall.time -= dt) <= 0) this.windowCall = null;
    if (this.demoVisible && !this.windowCall && (this.windowTimer -= dt) <= 0) {
      this.windowTimer = 30 + Math.random() * 40;
      this.windowCall = { x: this.cam.x + 30 + Math.random() * (W - 60), y: 45 + Math.random() * 30, time: 2.6,
        text: WINDOW_CALLS[Math.floor(Math.random() * WINDOW_CALLS.length)] };
    }
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
    const wc = this.windowCall;
    if (wc) drawBubble(g, Math.round(wc.x) - cx, wc.y, wc.text);
  }

  speakerAnchor(a) {
    if (!this.actors.includes(a)) return null;
    return { x: Math.round(a.x) - Math.round(this.cam.x), headTop: a.headTop() - Math.round(this.cam.y) };
  }
}
