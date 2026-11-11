'use strict';

/* =========================================================
   Basisklasse für Szenen. Game ruft update(dt) und render(g) auf.
   ========================================================= */
class Scene {
  constructor() {
    this.time = 0;
    this.shouts = []; // Sprechblasen über Figuren { who, text, time }
  }

  update(dt) {
    this.time += dt;
    this.shouts.forEach(s => { s.time -= dt; });
    this.shouts = this.shouts.filter(s => s.time > 0);
  }

  render(g) {}

  // Ruf als Sprechblase über einer Figur; das Promise endet, wenn die Blase verschwindet
  shout(who, text, ms = 2200) {
    this.shouts.push({ who, text, time: ms / 1000 });
    return wait(ms);
  }

  // am Ende von render() aufrufen; Position kommt aus speakerAnchor()
  drawShouts(g) {
    this.shouts.forEach(s => {
      const a = this.speakerAnchor(s.who);
      if (a) drawBubble(g, a.x, a.headTop - 2, s.text);
    });
  }

  // Bildschirmposition { x, headTop } für den Sprecher-Pfeil, oder null (kein Pfeil)
  speakerAnchor(speaker) { return null; }
}
