'use strict';

/* =========================================================
   Dialogbox mit Schreibmaschinen-Effekt.
   say()/think() liefern ein Promise, das beim Weiterklicken erfüllt wird.
   Sprecher = jedes Objekt mit { name, color } (Actor, Fernseher, ...).
   ========================================================= */
class Dialog {
  constructor(game) {
    this.game = game;
    this.el = $('dialog');
    this.textEl = $('text');
    this.speakerEl = $('speaker');
    this.nextEl = $('next');
    this.state = null; // { full, i, typing, resolve }
  }

  say(speaker, text) { return this.show(speaker, speaker.name, text, false); }

  // Gedanke: gleiche Box, aber anders gestaltet und mit "(denkt)"
  think(speaker, text) { return this.show(speaker, `${speaker.name} (denkt)`, text, true); }

  show(speaker, label, text, thought) {
    return new Promise(resolve => {
      this.game.speaker = speaker;
      this.el.classList.remove('hidden');
      this.el.classList.toggle('thought', thought);
      this.speakerEl.textContent = label;
      this.el.style.setProperty('--speaker-color', speaker.color);
      this.textEl.textContent = '';
      this.nextEl.classList.add('off');
      const seed = [...speaker.name].reduce((n, ch) => n + ch.charCodeAt(0), 0);
      const st = { full: text, i: 0, typing: true, resolve };
      this.state = st;
      const tick = () => {
        if (this.state !== st || !st.typing) return;
        st.i++;
        this.textEl.textContent = text.slice(0, st.i);
        if (st.i % 2 === 0 && text[st.i - 1] !== ' ') this.game.sound.blip(seed);
        if (st.i >= text.length) this.finishTyping(st);
        else setTimeout(tick, 32);
      };
      tick();
    });
  }

  finishTyping(st) {
    st.typing = false;
    this.textEl.textContent = st.full;
    this.nextEl.classList.remove('off');
  }

  // Klick / Leertaste: erst Text komplett zeigen, dann weiter
  advance() {
    const st = this.state;
    if (!st) return;
    if (st.typing) { this.finishTyping(st); return; }
    this.state = null;
    st.resolve();
  }

  close() {
    this.el.classList.add('hidden');
    this.game.speaker = null;
  }
}
