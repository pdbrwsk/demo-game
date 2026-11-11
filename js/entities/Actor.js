'use strict';

/* =========================================================
   Spielfigur mit Namen (Protagonist, Freund, ...)
   ========================================================= */
class Actor {
  constructor({ id, name, color, x, y, look, facing = 'front' }) {
    this.id = id;
    this.name = name;       // Anzeige in der Dialogbox
    this.color = color;     // Farbe des Namensschilds
    this.x = x; this.y = y;
    this.look = look;
    this.facing = facing;
    this.dist = 0;          // gelaufene Strecke (für Laufanimation)
    this.sign = null;
    this.target = null;
    this.marching = false;  // läuft mit dem Demozug mit
    this.raised = false;    // Arm hoch (Jubel, Faust, Wurf)
    this.control = null;    // Set gedrückter Tasten: Figur wird per WASD gesteuert und läuft mit dem Zug
    this.follow = null;     // Actor, dem die (marschierende) Figur folgt
    this.drift = true;      // gesteuert: wird vom Demozug mitgetragen (sonst freies Laufen)
    this.speed = PLAYER_SPEED; // Lauftempo bei Steuerung
    this.blink = 0;         // > 0: Figur blinkt (Treffer)
    this.walking = false;   // gesteuert und gerade in Bewegung
  }

  // Figur ohne Laufen an eine Stelle setzen (z. B. beim Szenenwechsel)
  place(x, y, facing = this.facing) {
    this.x = x; this.y = y; this.facing = facing;
    this.target = null; this.marching = false; this.raised = false;
    this.control = null; this.follow = null; this.drift = true; this.speed = PLAYER_SPEED; this.blink = 0;
    return this;
  }

  walkTo(x, y, speed = 24) {
    return new Promise(resolve => { this.target = { x, y, speed, resolve }; });
  }

  update(dt) {
    if (this.blink > 0) this.blink -= dt;
    if (this.target) {
      const dx = this.target.x - this.x, dy = this.target.y - this.y;
      const d = Math.hypot(dx, dy), step = this.target.speed * dt;
      if (d <= step) {
        this.x = this.target.x; this.y = this.target.y; this.dist += d;
        const r = this.target.resolve; this.target = null; r();
      } else {
        this.x += dx / d * step; this.y += dy / d * step; this.dist += step;
        if (Math.abs(dx) > 0.5) this.facing = dx > 0 ? 'right' : 'left';
      }
    } else if (this.control) {
      const k = this.control, has = c => k.has(c) ? 1 : 0;
      const ix = has('KeyD') + has('ArrowRight') - has('KeyA') - has('ArrowLeft');
      const iy = has('KeyS') + has('ArrowDown') - has('KeyW') - has('ArrowUp');
      const n = Math.hypot(ix, iy) || 1;
      const base = this.drift ? CROWD_SPEED : 0;
      const vx = base + ix / n * this.speed, vy = iy / n * this.speed * 0.6;
      this.walking = this.drift || ix !== 0 || iy !== 0;
      this.x += vx * dt; this.y += vy * dt; this.dist += Math.hypot(vx, vy) * dt;
      if (ix) this.facing = ix < 0 ? 'left' : 'right';
      else if (this.drift) this.facing = 'right';
    } else if (this.marching) {
      this.x += CROWD_SPEED * dt; this.dist += CROWD_SPEED * dt; this.facing = 'right';
      if (this.follow) {
        const f = this.follow, t = Math.min(1, dt * 1.5);
        this.x += (f.x - 26 - this.x) * t;
        this.y += (Math.max(LANES[0], f.y - 10) - this.y) * t;
      }
    }
  }

  get moving() { return !!this.target || this.marching || (!!this.control && this.walking); }

  headTop() { return headTop(Math.round(this.y), this.sign); }

  draw(g, camX, camY) {
    if (this.blink > 0 && Math.floor(this.blink * 14) % 2) return;
    const frame = this.moving ? Math.floor(this.dist / 3) % 4 : 0;
    const x = Math.round(this.x) - camX, y = Math.round(this.y) - camY;
    if (this.sign) drawPersonWithSign(g, x, y, this.look, frame, this.facing, this.sign);
    else drawPerson(g, x, y, this.look, frame, this.facing, this.raised);
  }
}
