'use strict';

/* =========================================================
   Hilfsfunktionen
   ========================================================= */
const $ = id => document.getElementById(id);

// Deterministischer Zufall: gleiche Seed -> gleiche Stadt / gleiche Menge
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const mod = (a, n) => ((a % n) + n) % n;
const pick = (rnd, arr) => arr[(rnd() * arr.length) | 0];
const wait = ms => new Promise(r => setTimeout(r, ms));
const easeInOut = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// Offscreen-Canvas mit Zeichenkontext
function makeCanvas(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  return { c, g };
}
