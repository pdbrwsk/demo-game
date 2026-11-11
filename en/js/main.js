'use strict';

/* =========================================================
   Einstiegspunkt: Spiel erzeugen, Startknopf verbinden
   ========================================================= */
const game = new Game($('screen'), $('game'));
const story = new Story(game);

$('startBtn').addEventListener('click', e => {
  e.stopPropagation();
  $('menu').classList.add('hidden');
  story.start();
});

$('restartBtn').addEventListener('click', e => { e.stopPropagation(); location.reload(); });

// Anleitung ein-/ausblenden
$('helpBtn').addEventListener('click', e => { e.stopPropagation(); $('help').classList.remove('hidden'); });
$('helpClose').addEventListener('click', e => { e.stopPropagation(); $('help').classList.add('hidden'); });
