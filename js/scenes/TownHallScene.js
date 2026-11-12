'use strict';

/* =========================================================
   Szene: Bürgerdialog im Rathaussaal.
   Podium mit Moderatorin und Abgeordneter, Publikum von hinten,
   Protagonist steht am Saalmikrofon im Mittelgang, Freund in Reihe 1.
   ========================================================= */
const HALL_SEATS_BACK = [8, 28, 48, 68, 88, 108, 196, 216, 236, 256, 276, 296]; // Reihe 2, Maßstab 2
const HALL_SEATS_FRONT = [4, 34, 64, 94, 226, 256, 286];                       // Reihe 1, Maßstab 3
const HALL_FRIEND_X = 196;

class TownHallScene extends Scene {
  constructor(player, friend, moderator, deputy) {
    super();
    this.player = player; this.friend = friend;
    this.moderator = moderator; this.deputy = deputy;
    this.bg = TownHallScene.createBackground();
    this.applause = 0; // > 0: Publikum klatscht

    this.sprites = new Map([
      [player, personSprite(player.look, 'back')], [friend, personSprite(friend.look, 'back')],
      [moderator, personSprite(moderator.look, 'front')], [deputy, personSprite(deputy.look, 'front')],
    ]);
    const rnd = mulberry32(21);
    this.back = HALL_SEATS_BACK.map(x => ({ x, look: randomLook(rnd) }));
    this.front = HALL_SEATS_FRONT.map(x => ({ x, look: randomLook(rnd) }));
    [...this.back, ...this.front].forEach(s => { s.sprite = personSprite(s.look, 'back'); });
  }

  update(dt) {
    super.update(dt);
    this.applause = Math.max(0, this.applause - dt);
  }

  get friendLift() { return this.game && this.game.speaker === this.friend ? 10 : 0; } // steht zum Reden auf

  render(g) {
    const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    const speaker = this.game ? this.game.speaker : null;
    g.drawImage(this.bg, 0, 0);

    // Podium: Moderatorin + Abgeordnete hinter dem Tisch
    [[this.moderator, 112], [this.deputy, 192]].forEach(([who, x]) => {
      g.drawImage(this.sprites.get(who), x, 50, 16, 34);
      if (speaker === who && Math.floor(this.time * 8) % 2) R(x + 6, 60, 4, 2, '#7a3b2e');
    });
    R(88, 72, 144, 20, '#2d4a7a'); R(88, 72, 144, 2, '#3d5f9a'); R(88, 91, 144, 1, '#1f3a6e');
    [['MODERATION', 120], ['ABGEORDNETE', 200]].forEach(([t, cx]) => {
      const w = textWidth(t) + 4, x = cx - (w >> 1);
      R(x, 78, w, 8, '#f4ecd8'); R(x, 85, w, 1, '#b8b3a3');
      drawText(g, t, x + 2, 80, '#1b1f2e');
      R(cx - 8, 64, 1, 8, '#3b3f4a'); R(cx - 9, 62, 3, 2, '#1b1b22');   // Tischmikrofon
      R(cx + 10, 67, 3, 5, '#bfe3f5');                                   // Wasserglas
    });

    // Publikum Reihe 2
    this.back.forEach((s, i) => this.drawSeated(g, s.sprite, s.x, 108, 2, i, s.look.skin));

    // Protagonist am Saalmikrofon
    const bob = speaker === this.player && Math.floor(this.time * 5) % 2 ? 1 : 0;
    g.drawImage(this.sprites.get(this.player), 148, 92 - bob, 24, 51);
    R(178, 104, 1, 42, '#3b3f4a'); R(175, 145, 7, 1, '#3b3f4a');
    R(175, 101, 4, 2, '#1b1b22'); R(178, 103, 1, 1, '#3b3f4a');

    // Publikum Reihe 1 (mit Freund)
    this.front.forEach((s, i) => this.drawSeated(g, s.sprite, s.x, 128, 3, i, s.look.skin));
    g.drawImage(this.sprites.get(this.friend), HALL_FRIEND_X, 128 - this.friendLift, 24, 51);
    this.drawChair(g, HALL_FRIEND_X, 128, 3);
  }

  drawSeated(g, sprite, x, y, s, i, skin) {
    const clap = this.applause > 0 && Math.floor(this.time * 8 + i) % 2;
    const yy = y - (clap ? 1 : 0);
    g.drawImage(sprite, x, yy, 8 * s, 17 * s);
    if (this.applause > 0) { // Hände über dem Kopf
      g.fillStyle = skin;
      const d = clap ? s : 0;
      g.fillRect(x + s * 2 + d, yy - s * 2, s, s); g.fillRect(x + s * 5 - d, yy - s * 2, s, s);
    }
    this.drawChair(g, x, y, s);
  }

  drawChair(g, x, y, s) {
    g.fillStyle = '#2a3048'; g.fillRect(x - s, y + s * 10, s * 10, H);
    g.fillStyle = '#3b4466'; g.fillRect(x - s, y + s * 10, s * 10, s);
  }

  speakerAnchor(who) {
    if (who === this.moderator) return { x: 120, headTop: 50 };
    if (who === this.deputy) return { x: 200, headTop: 50 };
    if (who === this.player) return { x: 160, headTop: 92 };
    if (who === this.friend) return { x: HALL_FRIEND_X + 12, headTop: 128 - this.friendLift };
    return null;
  }

  static createBackground() {
    const { c, g } = makeCanvas(W, H);
    const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };

    // Wand + Holzvertäfelung
    R(0, 0, W, 96, '#d8cdb5');
    for (let x = 0; x < W; x += 16) R(x, 0, 1, 70, '#cfc3a9');
    R(0, 70, W, 38, '#8a6a4a'); R(0, 70, W, 2, '#a07a52');
    for (let x = 4; x < W; x += 24) { R(x, 75, 20, 15, '#7d5f42'); R(x, 94, 20, 10, '#7d5f42'); }

    // Fenster
    [14, 270].forEach(x => {
      R(x - 2, 10, 40, 52, '#f4ecd8');
      R(x, 12, 36, 48, '#9fd3f0'); R(x, 44, 36, 16, '#b8def3');
      R(x + 3, 15, 2, 8, '#e8f6fd'); R(x + 22, 15, 2, 8, '#e8f6fd');
      R(x + 17, 12, 2, 48, '#f4ecd8'); R(x, 34, 36, 2, '#f4ecd8');
    });

    // Banner
    R(98, 8, 124, 34, '#14284d'); R(99, 9, 122, 32, '#1f3a6e');
    const title = 'BÜRGERDIALOG';
    const t = makeCanvas(textWidth(title), 6);
    drawText(t.g, title, 0, 1, '#ffd84a');
    g.drawImage(t.c, 160 - t.c.width, 12, t.c.width * 2, 12);
    const sub = 'BILDUNG UND SOZIALES';
    drawText(g, sub, 160 - (textWidth(sub) >> 1), 31, '#f4ecd8');

    // Bühne
    R(40, 92, 240, 3, '#a07a52'); R(40, 95, 240, 13, '#6b4a35'); R(40, 107, 240, 1, '#4d3422');

    // Holzboden + Teppich im Mittelgang
    R(0, 108, W, 72, '#7a5a3e');
    for (let y = 112, row = 0; y < H; y += 8, row++) {
      R(0, y, W, 1, '#6b4d34');
      for (let x = (row % 2) * 24; x < W; x += 48) R(x, y, 1, 8, '#6b4d34');
    }
    R(140, 108, 40, 72, '#9c3f45'); R(140, 108, 2, 72, '#b5545a'); R(178, 108, 2, 72, '#b5545a');
    return c;
  }
}
