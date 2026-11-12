'use strict';

/* Kamera einer Szene. follow = Actor, dem die Kamera weich horizontal folgt. */
class Camera {
  constructor(x = 0, y = 0) {
    this.x = x; this.y = y;
    this.follow = null;
  }

  update(dt) {
    if (!this.follow) return;
    const tx = this.follow.x - 110;
    this.x += (tx - this.x) * Math.min(1, dt * 1.5);
  }
}
