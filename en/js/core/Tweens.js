'use strict';

/* Zeitbasierte Übergänge (Kamerafahrten, Überblendungen). add() liefert ein Promise. */
class Tweens {
  constructor() { this.list = []; }

  add(set, from, to, ms, ease = t => t) {
    return new Promise(resolve => this.list.push({ set, from, to, dur: ms / 1000, t: 0, ease, resolve }));
  }

  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const tw = this.list[i];
      tw.t = Math.min(tw.dur, tw.t + dt);
      tw.set(tw.from + (tw.to - tw.from) * tw.ease(tw.t / tw.dur));
      if (tw.t >= tw.dur) { this.list.splice(i, 1); tw.resolve(); }
    }
  }
}
