'use strict';

/* =========================================================
   Auswahlmenü. choose() liefert ein Promise mit dem Index der Wahl.
   Optionen: Strings (Textknöpfe) oder DOM-Elemente (z. B. Sign.preview()).
   ========================================================= */
class ChoiceMenu {
  constructor(game) {
    this.game = game;
    this.el = $('choices');
  }

  get isOpen() { return !this.el.classList.contains('hidden'); }

  choose(options, { row = false } = {}) {
    return new Promise(resolve => {
      this.game.dialog.nextEl.classList.add('off');
      this.el.innerHTML = '';
      this.el.classList.toggle('row', row);
      this.el.classList.remove('hidden');
      const openedAt = performance.now();
      const buttons = options.map((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'choice';
        if (typeof opt === 'string') btn.textContent = opt;
        else { btn.classList.add('sign'); btn.appendChild(opt); }
        btn.addEventListener('click', e => {
          e.stopPropagation();
          if (performance.now() - openedAt < 250) return; // verhindert Doppelklick-Durchrutschen
          this.game.sound.select();
          this.el.classList.add('hidden');
          this.el.innerHTML = '';
          resolve(i);
        });
        this.el.appendChild(btn);
        return btn;
      });
      setTimeout(() => buttons[0].focus(), 260);
    });
  }

  // Pfeiltasten wechseln die Auswahl (Enter/Leertaste lösen den Button selbst aus)
  handleKey(e) {
    const btns = [...this.el.querySelectorAll('button')];
    const idx = btns.indexOf(document.activeElement);
    const dir = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (dir) { e.preventDefault(); btns[mod((idx < 0 ? 0 : idx + dir), btns.length)].focus(); }
  }
}
