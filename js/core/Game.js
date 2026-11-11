'use strict';

/* =========================================================
   Game: Hauptschleife, Skalierung, Eingabe, aktive Szene, Überblendungen
   ========================================================= */
class Game {
  constructor(canvas, root) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.root = root;

    this.time = 0;
    this.scene = null;
    this.speaker = null;  // wer gerade spricht (für den Sprecher-Pfeil)
    this.fade = 0;        // 0 = Bild sichtbar, 1 = schwarz
    this.tweens = new Tweens();
    this.dialog = new Dialog(this);
    this.choices = new ChoiceMenu(this);
    this.sound = new Sound();
    this.opinion = 50;      // öffentliche Meinung 0-100 (Anzeige unten)
    this.keys = new Set();  // aktuell gedrückte Tasten (KeyboardEvent.code)
    this.onKey = null;      // optional: Funktion(code) bei jedem neuen Tastendruck

    addEventListener('resize', () => this.resize());
    this.resize();
    this.bindInput();

    this.last = performance.now();
    requestAnimationFrame(t => this.loop(t));
  }

  setScene(scene) {
    scene.game = this;
    this.scene = scene;
  }

  // Schwarzblende: fadeTo(1) = ausblenden, fadeTo(0) = einblenden
  fadeTo(value, ms) {
    return this.tweens.add(v => { this.fade = v; }, this.fade, value, ms);
  }

  // Texttafel (z. B. "Am Abend ...") für ms Millisekunden
  async caption(text, ms) {
    const el = $('caption');
    el.textContent = text;
    el.classList.remove('hidden');
    await wait(ms);
    el.classList.add('hidden');
  }

  // Meinungsleiste ein-/ausblenden und Wert ändern (Ton + Animation über CSS)
  showMeter(on, value) {
    if (value != null) this.opinion = value;
    $('meter').classList.toggle('hidden', !on);
    this.updateMeter();
  }

  addOpinion(delta) {
    this.opinion = Math.max(0, Math.min(100, this.opinion + delta));
    this.updateMeter();
    if (delta > 0) this.sound.up(); else this.sound.down();
  }

  updateMeter() {
    const f = $('meterFill'), v = this.opinion;
    f.style.width = v + '%';
    f.style.background = v < 35 ? '#d64545' : v < 65 ? '#ffd84a' : '#4caf6a';
    $('meterVal').textContent = v + '%';
  }

  // Hinweisleiste unten: Text oder Liste von DOM-Elementen; hint(null) blendet sie aus
  hint(content) {
    const el = $('hint');
    el.innerHTML = '';
    if (content == null) { el.classList.add('hidden'); return el; }
    [].concat(content).forEach(c => {
      if (typeof c === 'string') { const s = document.createElement('span'); s.textContent = c; el.appendChild(s); }
      else el.appendChild(c);
    });
    el.classList.remove('hidden');
    return el;
  }

  // Abschlusstafel; Zeilenumbrüche (\n) bleiben erhalten
  showEnd(text = 'Fortsetzung folgt ...', note = '') {
    const el = $('tbc');
    el.textContent = text;
    if (note) {
      const n = document.createElement('div');
      n.className = 'endnote';
      n.textContent = note;
      el.appendChild(n);
    }
    el.classList.remove('hidden');
    this.hint(null);
    $('meter').classList.add('hidden');
    $('restartBtn').classList.remove('hidden');
  }

  loop(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.time += dt;
    this.tweens.update(dt);
    if (this.scene) this.scene.update(dt);
    this.render();
    requestAnimationFrame(t => this.loop(t));
  }

  render() {
    const g = this.ctx;
    if (!this.scene) return;
    this.scene.render(g);

    if (this.speaker) {
      const a = this.scene.speakerAnchor(this.speaker);
      if (a) drawSpeakerMarker(g, a.x, a.headTop, this.time);
    }

    if (this.fade > 0) {
      g.globalAlpha = this.fade;
      g.fillStyle = '#000000'; g.fillRect(0, 0, W, H);
      g.globalAlpha = 1;
    }
  }

  resize() {
    let s = Math.min(innerWidth / W, innerHeight / H);
    s = s >= 1 ? Math.floor(s) : s;
    this.root.style.width = W * s + 'px';
    this.root.style.height = H * s + 'px';
    this.root.style.setProperty('--u', s + 'px');
  }

  // Klick oder Leertaste/Enter setzt Dialoge fort; Pfeiltasten wechseln die Auswahl
  bindInput() {
    this.root.addEventListener('click', () => this.dialog.advance());
    addEventListener('keydown', e => {
      if (e.code === 'KeyM' && !e.repeat) this.sound.toggle();
      if (!e.repeat && this.onKey) this.onKey(e.code);
      this.keys.add(e.code);
      if (this.choices.isOpen) { this.choices.handleKey(e); return; }
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); this.dialog.advance(); }
    });
    addEventListener('keyup', e => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
  }
}
