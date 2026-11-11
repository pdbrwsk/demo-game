'use strict';

/* =========================================================
   Demo-Schilder
   ========================================================= */
class Sign {
  constructor(lines, bg, fg, border = '#3a2a1c') {
    this.lines = lines.map(l => l.toUpperCase());
    this.bg = bg; this.fg = fg; this.border = border;
    this.w = Math.max(...this.lines.map(textWidth)) + 4;
    this.h = this.lines.length * 6 + 3;
  }

  // (cx, bottom) = Mitte der Unterkante
  draw(g, cx, bottom) {
    const left = Math.round(cx - this.w / 2), top = bottom - this.h;
    g.fillStyle = this.border; g.fillRect(left, top, this.w, this.h);
    g.fillStyle = this.bg; g.fillRect(left + 1, top + 1, this.w - 2, this.h - 2);
    this.lines.forEach((line, i) => {
      drawText(g, line, left + Math.floor((this.w - textWidth(line)) / 2), top + 2 + i * 6, this.fg);
    });
  }

  // Vorschau-Canvas für das Auswahlmenü
  preview() {
    const { c, g } = makeCanvas(this.w + 2, this.h + 6);
    this.draw(g, Math.floor(c.width / 2), this.h + 1);
    g.fillStyle = '#7a5230'; g.fillRect(Math.floor(c.width / 2), this.h + 1, 1, 5);
    c.style.width = `calc(var(--u) * ${c.width * 2})`;
    c.style.height = `calc(var(--u) * ${c.height * 2})`;
    return c;
  }
}

// Auswahl für den Protagonisten
const PLAYER_SIGNS = [
  new Sign(['Better', 'education!'], '#f4ecd8', '#c0392b'),
  new Sign(['More', 'social aid!'], '#ffd84a', '#1f3a6e'),
  new Sign(['Listen', 'to us!'], '#3d8b5a', '#ffffff', '#1d3d29'),
];

// Schilder der übrigen Demonstrierenden
const CROWD_SIGNS = [
  ...PLAYER_SIGNS,
  new Sign(['Education', 'for all!'], '#f4ecd8', '#1f3a6e'),
  new Sign(['More', 'teachers!'], '#9fd3f0', '#1b1f2e'),
  new Sign(['Equal', 'chances!'], '#e86a5a', '#ffffff', '#6e231a'),
  new Sign(['Care, not', 'neglect!'], '#f4ecd8', '#3d8b5a'),
  new Sign(['Affordable', 'housing!'], '#c79be0', '#2a1838', '#3e2552'),
];
