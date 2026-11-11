'use strict';

/* =========================================================
   Handlung: Figuren, Dialoge, Entscheidungen.
   Jede Sequenz ist eine async-Methode; Dialoge/Auswahl werden mit await abgewartet.

   Ablauf:
   start ─┬─ mitmachen ──────────────► joinDemo ─► rally ─┬─ mit dem Typen gehen ─► riot (Bad Ending)
          └─ zuschauen ─┬─ doch mit ─► joinDemo           └─ nein ─┬─ doch mit ──────► riot
                        └─ sicher ──► stayAway                     └─ friedlich ─► secondDemo ─► townHall (Good Ending)
   ========================================================= */

// Sprechchöre zum Auswählen: je Wechsel [Ruf, Antwort der Menge]
const DEMO_CHANTS = [
  { label: 'Wir sind hier, wir sind laut!', lines: [['WIR SIND HIER, WIR SIND LAUT!', 'WEIL MAN UNS DIE BILDUNG KLAUT!']] },
  { label: 'Was wollen wir?', lines: [['WAS WOLLEN WIR?', 'BESSERE BILDUNG!'], ['WANN WOLLEN WIR SIE?', 'JETZT!']] },
  { label: 'Bildung ist keine Ware!', lines: [['BILDUNG IST KEINE WARE!', 'BILDUNG IST KEINE WARE!']] },
  { label: 'Sozial statt egal!', lines: [['SOZIAL STATT EGAL!', 'SOZIAL STATT EGAL!']] },
];

// Argumente des Protagonisten beim Bürgerdialog
const DIALOGUE_ARGS = [
  { label: 'Unsere Schule ist marode', text: 'An unserer Schule regnet es durchs Dach und es fehlen Lehrkräfte. Wie soll gute Bildung funktionieren, wenn jetzt auch noch gekürzt wird?' },
  { label: 'Jugendzentren sind wichtig', text: 'Für viele von uns ist das Jugendzentrum der einzige Ort nach der Schule. Wenn es schließt, wo sollen wir dann hin?' },
  { label: 'Wir wollen mitreden', text: 'Die Kürzungen treffen vor allem uns Jugendliche. Warum werden wir bei solchen Entscheidungen nie gefragt?' },
];

class Story {
  constructor(game) {
    this.game = game;

    this.player = new Actor({
      id: 'P', name: 'Du', color: '#5fc8b8', x: 64, y: 394,
      look: { skin: '#f1c27d', hair: '#3b2416', shirt: '#2f8f83', pants: '#30364f', shoes: '#1b1b22', long: false, hat: null },
    });
    this.friend = new Actor({
      id: 'F', name: 'Freund', color: '#e3b23c', x: 80, y: 394,
      look: { skin: '#c68642', hair: '#c8642b', shirt: '#e3b23c', pants: '#4a3b2e', shoes: '#1b1b22', long: true, hat: null },
    });
    this.speaker = new Actor({
      id: 'R', name: 'Rednerin', color: '#c79be0', x: 0, y: 0,
      look: { skin: '#8d5524', hair: '#1a1a1a', shirt: '#9b59b6', pants: '#30364f', shoes: '#1b1b22', long: true, hat: null },
    });
    this.agitator = new Actor({
      id: 'A', name: 'Lauter Typ', color: '#e86a5a', x: 0, y: 0,
      look: { skin: '#ffdbac', hair: '#1a1a1a', shirt: '#2b2b33', pants: '#2b2b33', shoes: '#1b1b22', long: false, hat: '#2b2b33' },
    });
    this.officer = new Actor({ id: 'O', name: 'Polizei', color: '#7fb2ff', x: 0, y: 0, look: POLICE_LOOK });
    this.moderator = new Actor({
      id: 'M', name: 'Moderatorin', color: '#2fb3a8', x: 0, y: 0,
      look: { skin: '#e0ac69', hair: '#e8d07a', shirt: '#2fb3a8', pants: '#30364f', shoes: '#1b1b22', long: true, hat: null },
    });
    this.deputy = new Actor({
      id: 'D', name: 'Abgeordnete', color: '#9fd3f0', x: 0, y: 0,
      look: { skin: '#f1c27d', hair: '#8a8a8a', shirt: '#3b3f4a', pants: '#2b2b33', shoes: '#1b1b22', long: false, hat: null },
    });

    this.street = new StreetScene([this.player, this.friend]);
    game.setScene(this.street);
  }

  // Kurzformen
  say(who, text) { return this.game.dialog.say(who, text); }
  think(who, text) { return this.game.dialog.think(who, text); }
  choose(options, opts) { return this.game.choices.choose(options, opts); }
  close() { this.game.dialog.close(); }

  /* ---------- Start: Kamerafahrt zur Demo, Freund fragt ---------- */
  async start() {
    const { game, street, player: P, friend: F } = this;
    street.demoVisible = true;

    await game.tweens.add(v => { street.cam.y = v; }, CAM_MENU_Y, CAM_DEMO_Y, 4500, easeInOut);
    await wait(600);

    P.facing = 'right';
    F.facing = 'left';
    await this.say(F, 'Ey, lass uns doch mitmachen! Es ist doch unser gutes Recht, dass wir von der Politik gehört werden!');
    const choice = await this.choose(['Bei der Demo mitmachen', 'Nur zuschauen']);

    if (choice === 0) {
      await this.say(P, 'Okay, ich bin dabei! Welches Schild nehme ich?');
      await this.joinDemo();
    } else {
      await this.say(P, 'Nein, ich bleibe hier.');
      await this.say(F, 'Bist du sicher, dass du nicht mitkommst? So verändert sich auch nichts!');
      const sure = await this.choose(['Doch mitmachen', 'Ja, ich bin sicher']);
      if (sure === 0) {
        await this.say(P, 'Hm ... du hast recht. Ich komme mit! Welches Schild nehme ich?');
        await this.joinDemo();
      } else {
        await this.stayAway();
      }
    }
  }

  /* ---------- Weg A: bei der Demo mitmachen ---------- */
  async joinDemo() {
    const { game, street, player: P, friend: F } = this;
    const s = await this.choose(PLAYER_SIGNS.map(sign => sign.preview()), { row: true });
    P.sign = PLAYER_SIGNS[s];
    await this.say(F, 'Gute Wahl! Komm, los geht\'s!');
    this.close();

    street.cam.follow = P;
    game.showMeter(true, 40);
    game.speaker = P; // Markierung zeigt, wo man selbst im Demozug läuft
    await Promise.all([
      F.walkTo(F.x + 46, LANES[2]),
      P.walkTo(P.x + 44, LANES[3]),
    ]);
    // Spieler läuft selbst mit (WASD); der Freund folgt
    P.control = game.keys;
    F.marching = true; F.follow = P;
    game.hint('WASD / Pfeiltasten: laufen');
    await this.waitForMove(8000);
    await wait(5000);
    game.hint(null);

    await this.say(F, 'Komm, lass uns was rufen! Mit den Tasten 1, 2, 3 und 4 kannst du Sprechchöre anstimmen!');
    this.close();
    game.speaker = P;
    await this.chants(3);
    await this.say(F, 'Wahnsinn, hörst du das? Alle machen mit!');
    this.close();
    game.speaker = P;
    await wait(3000);

    await this.rally();
  }

  // wartet, bis der Spieler eine Bewegungstaste drückt (oder ms vergangen sind)
  waitForMove(ms) {
    const { game } = this, codes = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'];
    return new Promise(resolve => {
      const t0 = performance.now();
      const id = setInterval(() => {
        if (codes.some(c => game.keys.has(c)) || performance.now() - t0 > ms) { clearInterval(id); resolve(); }
      }, 100);
    });
  }

  // Spieler ruft per Taste 1-4 Sprechchöre, die Menge antwortet; fertig nach n Rufen
  async chants(n, street = this.street) {
    const { game, player: P, friend: F } = this;
    street.autoChants = false;
    street.crowd.chants = [];
    let busy = false, done = 0;
    const btns = DEMO_CHANTS.map((c, i) => {
      const b = document.createElement('button');
      b.innerHTML = `<b>${i + 1}</b> ${c.label}`;
      return b;
    });
    game.hint(btns);
    await new Promise(resolve => {
      const call = async i => {
        if (busy || i < 0 || i >= DEMO_CHANTS.length) return;
        busy = true;
        game.sound.chant();
        btns[i].classList.add('used');
        for (const [call, answer] of DEMO_CHANTS[i].lines) {
          await street.shout(P, call, 1800);
          street.shout(F, answer, 2600);
          street.crowd.echo(answer, street.cam.x, [F.x]);
          await wait(2800);
        }
        game.addOpinion(6);
        busy = false;
        if (++done >= n) resolve();
      };
      btns.forEach((b, i) => b.addEventListener('click', e => { e.stopPropagation(); b.blur(); call(i); }));
      game.onKey = code => { const m = /^(?:Digit|Numpad)([1-4])$/.exec(code); if (m) call(m[1] - 1); };
    });
    game.onKey = null;
    game.hint(null);
    street.autoChants = true;
  }

  // Spieler läuft frei über den Platz und spricht mit Leuten (E)
  async mingle(rally) {
    const { game, player: P } = this;
    const folks = [
      { name: 'Schülerin', color: '#9fd3f0', lines: ['Ich bin extra aus der Nachbarstadt hergekommen. Bei uns soll die Schulbibliothek schließen.', 'Das ist hart. Gut, dass du hier bist!'] },
      { name: 'Lehrer', color: '#e3b23c', lines: ['Ich sehe jeden Tag, wie viel an unserer Schule fehlt. Schön, dass ihr jungen Leute laut werdet.', 'Danke, dass Sie auch dabei sind!'] },
      { name: 'Azubi', color: '#c79be0', lines: ['Ich mache eine Ausbildung. In der Berufsschule fehlt Material, und Unterricht fällt ständig aus.', 'Genau deshalb bin ich heute hier.'] },
    ];
    const free = rally.extras.filter(a => !a.sign && a.x > 100 && a.x < 205 && !rally.followers.includes(a)).sort((a, b) => a.x - b.x);
    const picks = [free[0], free[free.length >> 1], free[free.length - 1]];
    picks.forEach((a, i) => { a.name = folks[i].name; a.color = folks[i].color; a.talk = folks[i].lines; });
    rally.talkables = picks;
    rally.player = P;
    rally.bounds = { x0: 8, x1: 205, y0: 128, y1: 176 };
    P.control = game.keys; P.drift = false;
    game.hint('WASD: laufen · E: Leute ansprechen (sprich mit zwei Personen)');
    for (let talked = 0; talked < 2; talked++) {
      const who = await new Promise(resolve => {
        game.onKey = code => {
          const t = code === 'KeyE' && rally.nearTalk(P);
          if (t) { game.onKey = null; resolve(t); }
        };
      });
      P.control = null;
      P.facing = who.x < P.x ? 'left' : 'right';
      who.facing = who.x < P.x ? 'right' : 'left';
      rally.talkables = rally.talkables.filter(t => t !== who);
      game.addOpinion(5);
      game.sound.select();
      await this.say(who, who.talk[0]);
      await this.say(P, who.talk[1]);
      this.close();
      who.facing = 'right';
      P.control = game.keys;
    }
    game.hint(null);
    rally.talkables = [];
    P.control = null; P.drift = true; P.facing = 'right';
    await wait(800);
  }

  /* ---------- Kundgebung: Rede, Ende der Demo, Zwischenruf ---------- */
  async rally() {
    const { game, player: P, friend: F, speaker: S, agitator: A } = this;
    await game.fadeTo(1, 1200);
    const rally = new RallyScene(P, F, S, A);
    game.setScene(rally);
    await game.caption('Am Ende der Route: Kundgebung auf dem Rathausplatz', 2600);
    await game.fadeTo(0, 1000);
    await wait(500);
    await this.mingle(rally);

    await this.say(S, 'Liebe Leute! Schaut euch um: So viele sind heute für Bildung und Soziales auf die Straße gegangen!');
    this.close();
    rally.cheer(2400, ['JAAA!', 'WOOO!', 'BRAVO!']);
    await wait(2200);
    await this.say(S, 'Bildung und Soziales sind keine Sparposten. Sie sind unsere Zukunft!');
    this.close();
    rally.cheer(2400, ['GENAU!', 'JAWOHL!']);
    await wait(2200);
    await this.say(S, 'Danke, dass ihr so zahlreich gekommen seid und dass unser Demozug von Anfang bis Ende friedlich war. Das war ein starkes Zeichen!');
    await this.say(S, 'Hiermit erkläre ich die Demonstration für beendet. Aber unser Einsatz hört heute nicht auf!');
    await this.say(S, 'Sprecht mit euren Abgeordneten, kommt nächste Woche zum Bürgerdialog im Rathaus, engagiert euch in der Schülervertretung und geht wählen!');
    this.close();
    rally.cheer(3000, ['JAAA!', 'DANKE!', 'SUPER!']);
    await wait(3000);

    // Zwischenruf aus dem Publikum
    A.raised = true;
    P.facing = F.facing = 'left';
    await rally.shout(A, 'FÜR WAS?!', 1500);
    await this.say(A, 'Für was?! Wir müssen noch mehr dagegen machen! Das kann nicht das Ende sein!');
    await this.say(A, 'Wer meiner Meinung ist, soll mit mir mitkommen!');
    A.raised = false;
    this.close();
    rally.followers.forEach((a, i) => a.walkTo(52 + (i % 3) * 9, 138 + (i % 2) * 8, 20));
    await wait(1800);

    F.facing = 'right';
    await this.say(F, 'Hm, wollen wir mit ihm hingehen? Ich meine, er hat ja schon irgendwie recht?');
    const go = await this.choose(['Ja, wir gehen mit', 'Nein']);
    if (go === 0) {
      await this.say(P, 'Stimmt eigentlich. Komm, wir hören uns an, was er vorhat!');
      return this.riot();
    }

    await this.say(P, 'Nein. Nächste Woche ist doch der politische Dialog im Rathaus. Da können wir uns mit der Politik austauschen.');
    await this.say(F, 'Reden bringt nichts! Wir müssen agieren! Bist du jetzt dabei oder nicht?');
    const sure = await this.choose(['Na gut, ich bin dabei', 'Nein, alles soll friedlich sein']);
    if (sure === 0) {
      await this.say(P, 'Na gut ... ich bin dabei.');
      return this.riot();
    }

    await this.say(P, 'Nein. Alles soll friedlich sein. Sonst redet am Ende keiner mehr über unsere Forderungen.');
    await this.say(A, 'Dann eben ohne euch! Los, Leute, mir nach!');
    this.close();
    game.addOpinion(8);
    [A, ...rally.followers].forEach((a, i) => a.walkTo(-20, a.y, 34 + i * 3));
    await wait(3000);
    await this.say(F, 'Hm ... vielleicht hast du recht. Ohne dich gehe ich da sowieso nicht hin.');
    await this.say(F, 'Okay, dann komme ich nächste Woche mit zu diesem Dialog. Aber wehe, das bringt nichts!');
    await this.say(P, 'Und vorher ist ja noch die große Demo am Samstag. Da gehen wir auf jeden Fall wieder hin!');
    this.close();
    await this.secondDemo();
    await this.townHall();
  }

  /* ---------- Zwischensequenz: zweite, viel größere Demo (Strecke gerichtlich erlaubt) ---------- */
  async secondDemo() {
    const { game, player: P, friend: F, speaker: S } = this;
    await game.fadeTo(1, 1500);
    const rally = new RallyScene(P, F, S, null, true);
    game.setScene(rally);
    await game.caption('Samstag: die nächste Demo für Bildung und Soziales', 2600);
    await game.fadeTo(0, 1000);
    rally.cheer(2400, ['BILDUNG!', 'JAAA!', 'WOOO!']);
    await wait(2400);

    await this.say(S, 'Hallo zusammen! Schaut euch mal um: Heute sind noch viel mehr Menschen gekommen als beim letzten Mal. Ihr seid Tausende!');
    this.close();
    rally.cheer(2400, ['JAAA!', 'WOOO!']);
    await wait(2200);
    await this.say(S, 'Und ich habe gute Nachrichten: Die Stadt wollte unsere Demostrecke durch die Innenstadt zuerst nicht genehmigen.');
    await this.say(S, 'Dagegen haben wir geklagt. In erster Instanz haben wir verloren, aber jetzt hat das Gericht in zweiter Instanz entschieden: Wir dürfen unsere Strecke gehen!');
    await this.say(S, 'Die Versammlungsfreiheit steht im Grundgesetz. Sie gilt auch für uns!');
    this.close();
    game.addOpinion(6);
    rally.cheer(3000, ['JAAA!', 'SUPER!', 'GENAU!']);
    await wait(3000);
    await this.say(S, 'Also: Bleibt friedlich, passt aufeinander auf und zeigt, wie viele wir sind. Los geht\'s!');
    this.close();
    rally.cheer(2000, ['LOS!']);
    await wait(1600);

    // Demozug: diesmal deutlich mehr Leute auf der Straße
    await game.fadeTo(1, 1200);
    const street = new StreetScene([P, F], 90);
    street.demoVisible = true;
    street.cam.y = CAM_DEMO_Y;
    P.place(110, LANES[3], 'right');
    F.place(84, LANES[2], 'right');
    street.cam.follow = P;
    game.setScene(street);
    P.control = game.keys;
    F.marching = true; F.follow = P;
    await game.caption('Der Demozug zieht durch die Innenstadt', 2200);
    await game.fadeTo(0, 1000);
    game.speaker = P;
    await wait(3500);

    await this.say(F, 'Komm, stimm wieder was an! Tasten 1 bis 4!');
    this.close();
    game.speaker = P;
    await this.chants(3, street);
    await wait(1500);

    await this.say(F, 'Wahnsinn, wie viele da sind! Da bin ich jetzt echt gespannt auf die Sitzung im Rathaus.');
    await this.say(P, 'Ja, ich auch. Ich hoffe, dass alles klappt und dass sie uns auch wirklich zuhören.');
    this.close();
    game.speaker = P;
    await wait(2000);
    P.control = null;
  }

  /* ---------- Weg A1: mit dem lauten Typen -> Ausschreitungen (Bad Ending) ---------- */
  async riot() {
    const { game, player: P, friend: F, agitator: A, officer: O } = this;
    const rally = game.scene;
    await this.say(A, 'Super! Los, Leute, mir nach!');
    this.close();
    [A, P, F, ...rally.followers].forEach((a, i) => a.walkTo(-20, a.y, 34 + (i % 4) * 3));
    await wait(1500);
    await game.fadeTo(1, 1500);

    const riot = new RiotScene(P, F, A, O);
    game.setScene(riot);
    await game.caption('Kurz darauf, ein paar Straßen weiter ...', 2600);
    await game.fadeTo(0, 1000);

    riot.cheer(2600, ['ES REICHT!', 'LOS!']);
    await riot.shout(A, 'JETZT MÜSSEN DIE UNS ZUHÖREN!', 2400);
    await this.say(F, 'Äh ... warum haben die sich vermummt? Ich dachte, wir protestieren einfach weiter?');
    this.close();

    await riot.throwAt(riot.rioters[0], 46, 104, 'stone');
    riot.broken = true;
    game.addOpinion(-45);
    await wait(500);
    await this.say(P, 'Ey, spinnt ihr?! Das ist eine Bushaltestelle! Was hat die denn mit Bildung zu tun?');
    this.close();

    await riot.throwAt(riot.rioters[2], 233, 128, 'bottle');
    await wait(400);
    await this.say(O, 'Hier spricht die Polizei! Diese Versammlung ist aufgelöst. Verlassen Sie sofort die Straße!');
    await this.say(F, 'Alter, das läuft total aus dem Ruder ...');
    await this.say(P, 'So wollte ich das nicht! Komm, wir hauen ab!');
    this.close();

        // Die Vermummten flüchten, die Polizei rückt vor, die beiden werden angehalten
    [A, ...riot.rioters].forEach((r, i) => r.walkTo(-30, r.y, 70 + i * 5));
    F.facing = 'right';
    game.hint('Lauf weg! WASD: weiche den Flaschen aus (rote Markierung) und halte Abstand zur Polizei.');
    await riot.chase(P);
    game.hint(null);
    await O.walkTo(P.x + 16, P.y, 40);
    P.facing = F.facing = 'right';
    await this.say(O, 'Stehen bleiben! Sie beide waren mitten in der Gruppe. Ihre Ausweise, bitte.');
    await this.say(P, 'Aber wir haben doch gar nichts geworfen!');
    await this.say(O, 'Das wird alles geprüft. Wir nehmen Ihre Personalien auf. Gegen alle aus der Gruppe wird wegen Landfriedensbruch ermittelt.');
    await this.think(P, 'Wie konnte das nur so schnell eskalieren ...?');
    this.close();

    await game.fadeTo(1, 1500);
    await game.caption('Am Abend ...', 2200);
    await this.news([
      { headline: 'KRAWALLE NACH DEMO', image: 'riot', text: 'Guten Abend. Nach einer zunächst friedlichen Demonstration für Bildung und Soziales ist es am Nachmittag zu Ausschreitungen gekommen.' },
      { text: 'Eine Gruppe Vermummter zerstörte eine Bushaltestelle und bewarf die Polizei mit Flaschen. Gegen zahlreiche Personen wird nun ermittelt.' },
      { headline: 'REGIERUNG BLEIBT HART', image: 'school', text: 'Die Regierung verurteilt die Gewalt und hält an den Kürzungen fest. Gewalt sei kein Argument, hieß es.' },
      { text: 'Über die eigentlichen Forderungen der Demonstrierenden spricht inzwischen kaum noch jemand.' },
    ], '+++ KRAWALLE NACH DEMO +++ BUSHALTESTELLE ZERSTÖRT +++ ERMITTLUNGEN GEGEN DUTZENDE PERSONEN +++ REGIERUNG: GEWALT IST KEIN ARGUMENT ');

    await this.say(P, 'Na super. Jetzt reden alle nur noch über die Krawalle ... und kein Mensch mehr über Bildung!');
    await this.say(P, 'Und alle, die friedlich demonstriert haben, stehen jetzt auch noch als Chaoten da.');
    await this.think(P, 'Wir wollten etwas verändern ... und haben am Ende nur unserer eigenen Sache geschadet.');
    this.close();
    game.showEnd('Die Ausschreitungen haben nichts bewirkt, außer negativen Schlagzeilen und Ärger mit der Polizei.');
  }

  /* ---------- Weg A2: friedlich bleiben -> Bürgerdialog -> Umdenken (Good Ending) ---------- */
  async townHall() {
    const { game, player: P, friend: F, moderator: M, deputy: D } = this;
    await game.fadeTo(1, 1500);
    const hall = new TownHallScene(P, F, M, D);
    game.setScene(hall);
    await game.caption('Einige Tage später: Bürgerdialog im Rathaus', 2600);
    await game.fadeTo(0, 1200);
    await wait(500);

    await this.say(M, 'Herzlich willkommen zum Bürgerdialog! Heute geht es um die geplanten Kürzungen bei Bildung und Sozialem.');
    await this.say(M, 'Unsere Abgeordnete ist hier, um Ihnen zuzuhören. Am Saalmikrofon wartet schon die erste Wortmeldung. Bitte sehr!');
    await this.say(P, 'Hallo. Ich war auf den Demos für Bildung und Soziales dabei. Ich möchte etwas sagen:');
    const arg = await this.choose(DIALOGUE_ARGS.map(a => a.label));
    game.addOpinion(20);
    await this.say(P, DIALOGUE_ARGS[arg].text);
    await this.say(D, 'Danke für Ihre offenen Worte. Ich will ehrlich sein: Der Haushalt ist knapp, und wir müssen an vielen Stellen sparen.');
    await this.say(D, 'Aber die vielen Menschen auf den Demonstrationen haben wir wahrgenommen. Und heute höre ich sehr konkret, was die Kürzungen für Sie bedeuten.');
    await this.say(F, 'Und was passiert jetzt damit? Oder bleibt das alles nur Gerede?');
    await this.say(D, 'Ich nehme Ihre Beispiele mit in die Beratungen im Bundestag. Und Ihre Schülervertretung lade ich ein, mir ihre Vorschläge zu schicken. Ich melde mich persönlich.');
    hall.applause = 3;
    game.addOpinion(10);
    await this.say(M, 'Vielen Dank! Genau dafür ist so ein Dialog da: zuhören, streiten und gemeinsam nach Lösungen suchen.');
    await this.say(F, 'Okay ... ich gebe es zu: Das war besser als gedacht. Die hat uns echt zugehört.');
    await this.say(P, 'Siehst du? Reden kann eben doch etwas bringen.');
    this.close();

    await game.fadeTo(1, 1500);
    await game.caption('Zwei Wochen später ...', 2200);

    // Zufall: Auch friedlicher Protest garantiert keinen Erfolg
    if (Math.random() < 0.3) {
      await this.news([
        { headline: 'REGIERUNG HÄLT AN KÜRZUNGEN FEST', image: 'school', text: 'Guten Abend. Trotz wochenlanger friedlicher Proteste hält die Regierung an den Kürzungen bei Bildung und Sozialem fest.' },
        { text: 'Der Haushalt lasse keinen Spielraum, hieß es. Die Anliegen der Demonstrierenden seien zur Kenntnis genommen worden.' },
      ], '+++ KÜRZUNGEN BESCHLOSSEN +++ REGIERUNG: KEIN SPIELRAUM IM HAUSHALT +++ SCHULEN UND JUGENDZENTREN BETROFFEN ');
      game.addOpinion(-25);
      await this.say(P, 'Das ganze für nichts! Warum soll ich dann noch demonstrieren gehen, wenn ich sowieso nicht gehört werde?');
      await this.say(F, 'Wir waren laut, friedlich und haben geredet ... und trotzdem ändert sich nichts.');
      await this.think(P, 'Vielleicht reicht ein einzelner Protest nicht. Aber wenn alle aufgeben, hört uns erst recht niemand zu ...');
      this.close();
      game.showEnd('Friedlicher Protest ist keine Garantie: Manchmal hält die Politik trotzdem an ihren Plänen fest.\nPolitische Teilhabe braucht oft einen langen Atem.');
      return;
    }

    await this.news([
      { headline: 'BUNDESTAG DENKT UM', image: 'parliament', text: 'Guten Abend. Nach anhaltenden friedlichen Protesten denkt der Bundestag über die geplanten Kürzungen bei Bildung und Sozialem neu nach.' },
      { text: 'In vielen Bürgerdialogen hatten vor allem junge Menschen deutlich gemacht, was die Sparpläne für sie bedeuten würden.' },
      { headline: 'PLÄNE WERDEN ÜBERARBEITET', text: 'Die Reformen sollen nun überarbeitet werden. Gelder für Schulsanierungen und Jugendzentren sind wieder im Gespräch.' },
    ], '+++ BUNDESTAG BERÄT ERNEUT ÜBER KÜRZUNGEN +++ JUGENDZENTREN SCHÖPFEN HOFFNUNG +++ SCHÜLERVERTRETUNGEN LEGEN VORSCHLÄGE VOR ');

    await this.say(P, 'Wahnsinn ... die haben uns wirklich zugehört!');
    await this.say(P, 'Das muss ich sofort meinem Freund schreiben. Das haben wir zusammen geschafft!');
    await this.think(P, 'Laut sein, friedlich bleiben und miteinander reden: So kann man wirklich etwas bewegen.');
    this.close();
    game.showEnd('Friedlicher Protest und Dialog haben etwas bewegt.');
  }

  /* ---------- Weg B: nicht mitmachen -> abends Nachrichten ---------- */
  async stayAway() {
    const { game, player: P, friend: F } = this;
    await this.say(P, 'Ja, ich bin sicher. Ich gehe nach Hause.');
    await this.say(F, 'Na gut ... dann bis später.');
    this.close();

    await F.walkTo(F.x + 30, LANES[3]);
    F.marching = true;
    P.facing = 'right';
    await wait(2500);

    // Protagonist geht nach links aus dem Bild, Schwarzblende
    await Promise.all([
      P.walkTo(-20, P.y),
      wait(1500).then(() => game.fadeTo(1, 1500)),
    ]);
    await game.caption('Am Abend ...', 2200);

    await this.eveningNews();
    game.showEnd();
  }

  async eveningNews() {
    const P = this.player;
    await this.news([
      { headline: 'KÜRZUNGEN BEI BILDUNG', image: 'school', text: 'Guten Abend. Die Regierung hat heute Kürzungen im Bildungs- und Sozialbereich beschlossen.' },
      { text: 'Geplante Gelder für neue Lehrkräfte und die Sanierung von Schulen werden gestrichen.' },
      { headline: 'AUCH SOZIALES BETROFFEN', image: 'youth', text: 'Auch Jugendzentren und Beratungsstellen müssen künftig mit weniger Geld auskommen.' },
      { headline: 'PROTEST OHNE WIRKUNG?', image: 'demo', text: 'Die Demonstration in der Innenstadt fiel kleiner aus als erwartet. Die Regierung sieht deshalb wenig Widerstand gegen ihre Pläne.' },
    ]);

    await this.say(P, 'Was?! Warum wird ausgerechnet bei der Bildung gespart? Unsere Schule fällt doch jetzt schon auseinander!');
    await this.say(P, 'Und Jugendzentren dichtmachen? Wo sollen wir denn dann hin? Das ist doch total unfair!');
    await this.say(P, 'Die entscheiden einfach über unsere Köpfe hinweg ...');
    await this.think(P, 'Vielleicht hätte ich doch bei der Demo mitmachen sollen ...');
    this.close();
  }


  // Wohnzimmer einblenden, Fernseher spricht die Meldungen. items: [{ headline?, image?, text }]
  async news(items, ticker) {
    const { game, player: P } = this;
    P.sign = null;
    const room = new LivingRoomScene(P);
    const tv = room.tv;
    if (ticker) tv.ticker = ticker;
    game.setScene(room);
    await game.fadeTo(0, 1200);
    await wait(800);
    for (const item of items) {
      if (item.headline) tv.headline = item.headline;
      if (item.image) tv.image = item.image;
      await this.say(tv, item.text);
    }
  }
}
