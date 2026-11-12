'use strict';

/* =========================================================
   3x5 Pixel-Schrift (für Schilder, Banner, Sprechblasen, TV)
   Nur Großbuchstaben! Optional 6 Zeilen: die erste Zeile liegt
   über der Grundlinie (Umlaute). Fehlende Zeichen -> '?'.
   ========================================================= */
const GLYPHS = {
  'A': '010101111101101', 'B': '110101110101110', 'C': '011100100100011',
  'D': '110101101101110', 'E': '111100110100111', 'F': '111100110100100',
  'G': '011100101101011', 'H': '101101111101101', 'I': '111010010010111',
  'J': '001001001101010', 'K': '101101110101101', 'L': '100100100100111',
  'M': '101111111101101', 'N': '110101101101101', 'O': '010101101101010',
  'P': '110101110100100', 'Q': '010101101110011', 'R': '110101110101101',
  'S': '011100010001110', 'T': '111010010010010', 'U': '101101101101111',
  'V': '101101101101010', 'W': '101101111111101', 'X': '101101010101101',
  'Y': '101101010010010', 'Z': '111001010100111',
  'Ä': '101000010101111101', 'Ö': '101000111101101111', 'Ü': '101000101101101111',
  '!': '010010010000010', '.': '000000000000010', ',': '000000000010100',
  '-': '000000111000000', '?': '110001010000010', ':': '000010000010000',
  '+': '000010111010000', ' ': '000000000000000',
};

function textWidth(s) { return s.length ? s.length * 4 - 1 : 0; }

function drawText(g, s, x, y, color) {
  g.fillStyle = color;
  for (let i = 0; i < s.length; i++) {
    const gl = GLYPHS[s[i]] || GLYPHS['?'];
    const rows = gl.length / 3;
    const yo = rows === 6 ? -1 : 0;
    for (let p = 0; p < gl.length; p++) {
      if (gl[p] === '1') g.fillRect(x + i * 4 + (p % 3), y + yo + ((p / 3) | 0), 1, 1);
    }
  }
}

// Sprechblase, (cx, bottom) = Spitze der Blase
function drawBubble(g, cx, bottom, text) {
  const w = textWidth(text) + 6, h = 9;
  let left = Math.round(cx - w / 2);
  left = Math.max(2, Math.min(W - w - 2, left));
  const top = bottom - h - 3;
  g.fillStyle = '#1b1f2e';
  g.fillRect(left + 1, top, w - 2, h); g.fillRect(left, top + 1, w, h - 2);
  g.fillStyle = '#ffffff';
  g.fillRect(left + 1, top + 1, w - 2, h - 2);
  // Spitze
  g.fillStyle = '#1b1f2e'; g.fillRect(cx - 1, top + h, 3, 1); g.fillRect(cx, top + h + 1, 1, 1);
  g.fillStyle = '#ffffff'; g.fillRect(cx, top + h - 1, 1, 1);
  drawText(g, text, left + 3, top + 2, '#1b1f2e');
}

// Gelber Pfeil über der sprechenden Figur
function drawSpeakerMarker(g, x, headTop, time) {
  const y = headTop - 3 - (Math.floor(time * 3) % 2);
  g.fillStyle = '#1b1f2e'; g.fillRect(x - 3, y - 4, 7, 1);
  g.fillStyle = '#ffd84a'; g.fillRect(x - 2, y - 3, 5, 1); g.fillRect(x - 1, y - 2, 3, 1); g.fillRect(x, y - 1, 1, 1);
}
