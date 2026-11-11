'use strict';

/* =========================================================
   Sound: kleine Chiptune-Töne per WebAudio (keine Audiodateien).
   Wird erst beim ersten Ton angelegt (nach Nutzerinteraktion). M = Ton an/aus.
   ========================================================= */
class Sound {
  constructor() { this.ctx = null; this.muted = false; }

  tone(freq, ms = 60, type = 'square', vol = 0.04, slide = 0) {
    if (this.muted) return;
    try {
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      const c = this.ctx, t = c.currentTime;
      if (c.state === 'suspended') c.resume();
      const o = c.createOscillator(), g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.linearRampToValueAtTime(Math.max(30, freq + slide), t + ms / 1000);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
      o.connect(g); g.connect(c.destination);
      o.start(t); o.stop(t + ms / 1000);
    } catch (e) { /* Audio nicht verfügbar */ }
  }

  blip(seed) { this.tone(170 + (seed % 6) * 35, 45, 'square', 0.02); }         // Sprecher-Piepsen
  select() { this.tone(660, 60, 'square', 0.04); }
  chant() { this.tone(220, 130, 'square', 0.05); setTimeout(() => this.tone(330, 180, 'square', 0.05), 130); }
  hit() { this.tone(120, 200, 'sawtooth', 0.07, -80); }
  up() { this.tone(520, 80, 'square', 0.04); setTimeout(() => this.tone(780, 110, 'square', 0.04), 80); }
  down() { this.tone(320, 160, 'triangle', 0.07, -140); }
  toggle() { this.muted = !this.muted; if (!this.muted) this.select(); }
}
