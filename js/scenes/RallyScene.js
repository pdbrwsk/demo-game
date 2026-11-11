'use strict';

/* =========================================================
   Szene: Abschlusskundgebung auf dem Rathausplatz.
   Bühne rechts mit Rednerin, Publikum blickt nach rechts,
   der laute Typ steht hinten links.
   ========================================================= */
class RallyScene extends PlazaScene {
  constructor(player, friend, speaker, agitator = null, dense = false) {
    super(420);
    RallyScene.drawStage(this.bgG);

    speaker.place(268, 112, 'left');
    if (agitator) agitator.place(36, 146, 'right');
    player.place(180, 164, 'right');
    friend.place(166, 168, 'right');
    this.speaker = speaker;
    this.actors.push(speaker, player, friend);
    if (agitator) this.actors.push(agitator);

    // Publikum (freie Plätze für Spieler, Freund und den lauten Typen)
    const rnd = mulberry32(5);
    for (let row = 0; row < 5; row++) {
      for (let i = 0; i < (dense ? 20 : 9); i++) {
        const x = 14 + i * (dense ? 15 : 22) + (row % 2) * 10 + ((rnd() * 6) | 0);
        const y = 138 + row * 8 + ((rnd() * 3) | 0);
        if (x > (dense && row > 0 ? 310 : 200)) continue;
        if (x > 150 && x < 196 && y > 154) continue;
        if (agitator && x > 22 && x < 52 && y > 140 && y < 152) continue;
        this.addExtra(x, y, randomLook(rnd), 'right', rnd() < 0.22 ? pick(rnd, CROWD_SIGNS) : null);
      }
    }
    // diese Leute schließen sich dem lauten Typen an
    this.followers = !agitator ? [] : this.extras.filter(a => a.x < 110 && !a.sign).slice(0, 5);
  }

  drawFront(g) {
    // Mikrofonständer vor der Rednerin
    g.fillStyle = '#3b3f4a';
    g.fillRect(262, 100, 1, 12); g.fillRect(260, 111, 5, 1);
    g.fillStyle = '#1b1b22'; g.fillRect(261, 98, 2, 3);
    // Lautsprecher vibrieren, solange die Rednerin spricht
    if (this.game && this.game.speaker === this.speaker && Math.floor(this.time * 10) % 2) {
      g.fillStyle = '#5a5f6b';
      g.fillRect(224, 99, 4, 4); g.fillRect(310, 99, 4, 4);
    }
  }

  static drawStage(g) {
    const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    // Traverse mit Banner
    R(226, 56, 2, 56, '#9aa0ab'); R(312, 56, 2, 56, '#9aa0ab'); R(226, 56, 88, 2, '#9aa0ab');
    for (let y = 60; y < 110; y += 6) { R(227, y, 1, 1, '#6d727d'); R(313, y, 1, 1, '#6d727d'); }
    R(229, 62, 82, 18, '#3a2a1c'); R(230, 63, 80, 16, '#c0392b');
    drawText(g, 'KUNDGEBUNG', 270 - (textWidth('KUNDGEBUNG') >> 1), 65, '#f4ecd8');
    drawText(g, 'BILDUNG + SOZIALES', 270 - (textWidth('BILDUNG + SOZIALES') >> 1), 72, '#ffd84a');
    // Bühne
    R(218, 112, 100, 2, '#a07a52');
    R(218, 114, 100, 20, '#5d4230');
    for (let y = 119; y < 134; y += 5) R(218, y, 100, 1, '#4d3422');
    for (let x = 230; x < 318; x += 24) R(x, 114, 1, 20, '#4d3422');
    R(218, 133, 100, 1, '#3b2a1e');
    // Treppe links
    R(208, 126, 10, 2, '#a07a52'); R(208, 128, 10, 6, '#5d4230');
    R(213, 120, 5, 2, '#a07a52'); R(213, 122, 5, 4, '#5d4230');
    // Lautsprecher
    [222, 308].forEach(x => {
      R(x, 96, 8, 16, '#1b1b22');
      R(x + 2, 99, 4, 4, '#3b3f4a'); R(x + 2, 105, 4, 5, '#3b3f4a');
    });
  }
}
