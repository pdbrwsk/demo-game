# Demo – Pixel-Art-Lernspiel (Politik, berufsbildende Schulen)

Kurzes narratives Browserspiel für den Politikunterricht: Der Protagonist entscheidet, ob er bei einer Demo für Bildung und Soziales mitmacht. Thema: politische Teilhabe und ihre Folgen.

## Starten
- Kein Build, keine Abhängigkeiten. `index.html` direkt im Browser öffnen (funktioniert auch über `file://`).
- Einzige externe Ressource: Google Font „Press Start 2P“ (nur für die HTML-UI).

## Technik & Konventionen
- Reines Vanilla-JS mit **klassischen `<script>`-Tags, keine ES-Module** (Module würden über `file://` blockiert). Alle Dateien teilen sich den globalen Scope.
- **Ladereihenfolge in `index.html` ist wichtig**: eine Datei darf beim Laden nur Dinge verwenden, die vorher geladen wurden. Neue Dateien dort an passender Stelle eintragen.
- Jede Datei beginnt mit `'use strict';`. Globale Namen müssen eindeutig sein (keine doppelten `const`/`class` über Dateien hinweg).
- Sprache: Spieltexte, Kommentare und Abschnittsüberschriften auf **Deutsch**. Abschnitte mit `/* ===== Titel ===== */`.
- Interne Auflösung **320×180** (`W`, `H`), wird ganzzahlig hochskaliert. Alles wird mit `fillRect` als Pixel-Art gezeichnet, keine Bilddateien. `imageSmoothingEnabled = false`.
- Statische Grafik wird einmal in Offscreen-Canvas vorgerendert (`makeCanvas`), nur Bewegliches pro Frame.
- Zufall immer deterministisch über `mulberry32(seed)`, damit Stadt/Menge bei jedem Start gleich aussehen. `Math.random()` nur für unwichtige Effekte (Sprechchöre).
- **Pixel-Schrift (`js/gfx/font.js`) kennt nur Großbuchstaben, ÄÖÜ und `! . , - ? : +`.** Texte für Schilder/TV/Banner in Großbuchstaben schreiben; fehlende Zeichen erscheinen als `?` → bei Bedarf Glyphe in `GLYPHS` ergänzen (3×5 Bits, Umlaute 3×6). Breite pro Zeichen: 4 px (`textWidth`).
- Dialoge/Auswahlmenüs sind HTML (`#dialog`, `#choices`), Größen in CSS immer relativ zu `--u` (= ein Spielpixel).

## Ordnerstruktur
```
index.html            DOM-Gerüst + Script-Reihenfolge
style.css             UI (Menü, Dialogbox, Gedanken, Auswahl, Texttafeln)
js/core/              config.js (Konstanten), util.js (Helfer), Tweens, Camera, Game (Hauptschleife)
js/gfx/               font.js (Pixel-Schrift, Sprechblase, Sprecher-Pfeil), Sign, person.js (Figuren zeichnen)
js/world/             sky.js, cityStrip.js (vorgerenderte Straße), Ambient (Wolken/Vögel)
js/entities/          Actor (benannte Figur mit walkTo/marching), Crowd (Demo-Zug)
js/scenes/            Scene (Basis, Sprechblasen via shout), StreetScene, LivingRoomScene (TV-Nahaufnahme),
                      PlazaScene (Basis: feste Kamera vor Stadtkulisse, Statisten, cheer),
                      RallyScene (Kundgebung; ohne lauten Typen + `dense` = große Menge), RiotScene (Ausschreitungen), TownHallScene (Bürgerdialog)
js/ui/                Dialog (say/think), ChoiceMenu (choose)
js/story/Story.js     gesamte Handlung als async-Methoden
js/main.js            Einstieg: Game + Story erzeugen, Startknopf
```

## Architektur
- `Game` besitzt die aktive Szene (`setScene`), `tweens`, `dialog`, `choices`, `speaker` und `fade` (Schwarzblende). Pro Frame: `tweens.update` → `scene.update(dt)` → `scene.render(g)` → Sprecher-Pfeil → Blende.
- Eine **Szene** erbt von `Scene` und implementiert `update(dt)` (zuerst `super.update(dt)` für `this.time`), `render(g)` und optional `speakerAnchor(speaker)` (liefert `{x, headTop}` in Bildschirmkoordinaten oder `null` für keinen Pfeil). `this.game` wird von `setScene` gesetzt.
- **Sprecher** in Dialogen ist jedes Objekt mit `{ name, color }` – ein `Actor` oder z. B. `LivingRoomScene.tv`.
- `scene.shout(actor, TEXT, ms)` zeigt eine Pixel-Sprechblase (Großbuchstaben!) über einer Figur der Szene; `PlazaScene.cheer(ms, [rufe])` lässt Statisten jubeln; `crowd.echo(text, camX)` = Antwort des Demozugs.
- `LivingRoomScene.tv` hat `headline`, `image` (`school | youth | demo | riot | parliament`) und `ticker`; in der Story über `this.news([...], ticker)`.
- Alles Zeitliche ist Promise-basiert und wird in der Story mit `await` verkettet: `say`, `think`, `choose`, `actor.walkTo`, `game.tweens.add`, `game.fadeTo`, `game.caption`, `wait`.

## Handlung (Stand)
Ablaufdiagramm auch oben in `js/story/Story.js`.
1. Start: Kamerafahrt vom Himmel zur Demo. Freund: „Lass uns mitmachen …“ → Auswahl.
2. **Mitmachen** → Schild wählen → einreihen → 3 Runden Sprechchöre wählen (`DEMO_CHANTS`, Ruf + Antwort der Menge) → `rally`:
   Kundgebung (Rede, Demo für beendet erklärt, Dank + Aufruf zum Engagement) → Zwischenruf „Lauter Typ“: „Für was?! …“ → Freund: „Wollen wir mit ihm hingehen?“
   - **Ja** → `riot`: Vermummte, Bushaltestelle zerstört, Flaschenwurf, Polizei löst auf, Personalien → Abendnachrichten „Krawalle nach Demo“, Regierung bleibt hart → **BAD ENDING**.
   - **Nein** („Nächste Woche ist der politische Dialog“) → Freund: „Reden bringt nichts! … Bist du dabei?“ → „Na gut“ → `riot`; „Nein, alles soll friedlich sein“ → Freund kommt mit → `secondDemo` (Zwischensequenz: viel größere Kundgebung, Demostrecke in zweiter Instanz gerichtlich erlaubt, erneut Demozug mit Sprechchören, Freund/Protagonist gespannt auf die Rathaussitzung) → `townHall`: Bürgerdialog (Argument wählen, Abgeordnete antwortet) → Nachrichten „Bundestag denkt um“ → **GOOD ENDING**.
3. **Nur zuschauen** → Freund: „Bist du sicher …?“ → „Doch mitmachen“ → wie 2.; „Ja, ich bin sicher“ → `stayAway` → `eveningNews` (Kürzungen) → „Fortsetzung folgt …“.
4. Enden über `game.showEnd(text)` (`\n` = Zeilenumbruch).

## Typische Erweiterungen
- **Neuer Dialog / neue Entscheidung**: in `js/story/Story.js` mit `await this.say(...)` / `await this.choose([...])`; längere Abschnitte als eigene async-Methode.
- **Neue Szene**: Datei in `js/scenes/` (erbt `Scene`), in `index.html` nach `Scene.js` eintragen, in der Story per `game.setScene(...)` (meist zwischen `fadeTo(1)` und `fadeTo(0)`) wechseln.
- **Neue Figur**: `new Actor({ id, name, color, x, y, look })`; `look` wie in `person.js` (`skin, hair, shirt, pants, shoes, long, hat`, optional `mask`, `helmet`, `shield`; Polizei: `POLICE_LOOK`). `actor.place(x, y, facing)` setzt eine Figur beim Szenenwechsel um, `actor.raised` = Arm hoch. Für Nahaufnahmen `personSprite(look, facing)` vergrößert zeichnen.
- **Neue Schilder**: `new Sign([...zeilen], bg, fg)` in `js/gfx/Sign.js`.
- Die Inhalte sind ein Unterrichtsmaterial: politische Akteure bleiben fiktiv/allgemein („die Regierung“), keine echten Parteien oder Personen.

## Testen
- Manuell im Browser durchspielen (beide Pfade).
- Headless möglich mit `chromium --headless=new --allow-file-access-from-files --virtual-time-budget=60000 --screenshot=...`. Achtung: headless läuft `requestAnimationFrame` nicht – im Test-HTML vorher `window.requestAnimationFrame = cb => setTimeout(() => cb(performance.now()), 16)` setzen. Testdateien nicht ins Projekt legen.

## Spielmechanik (interaktiv)
- **Steuerung**: `actor.control = game.keys` → WASD/Pfeiltasten; `actor.drift` (Demozug trägt mit), `actor.speed`. `game.onKey(code)` für einzelne Tastendrücke, `game.hint(text|[Elemente])` = Leiste unten.
- **Demozug**: Spieler läuft selbst, Freund folgt (`follow`); Sprechchöre mit Taste 1–4 (`Story.chants`).
- **Kundgebung** (`Story.mingle`): frei laufen, Statisten mit `E` ansprechen (`scene.talkables`, `nearTalk`); zwei Gespräche starten die Rede.
- **Krawalle** (`RiotScene.chase`): Flucht – Flaschen (rote Markierung) ausweichen, Polizei nicht zu nah kommen. Erwischt → Personalien; entkommen → Gasse. Beides führt zu den Abendnachrichten.
- `en/` ist eine vollständige englische Kopie; Änderungen an Handlung/Engine in beiden Ordnern nachziehen.
- **Meinungsleiste**: `game.showMeter(true, start)`, `game.addOpinion(±n)` (Story ruft das bei Rufen, Gesprächen, Krawallen, Bürgerdialog auf). Zeigt die öffentliche Meinung unten.
- **Sound** (`js/core/Sound.js`): WebAudio-Töne ohne Dateien (`game.sound.blip/chant/hit/up/down/select`), Taste `M` = stumm.
- **Endtafel**: `game.showEnd(text)` (ohne Kennzahlen/Nachdenkfrage); Knopf „Nochmal spielen“ lädt die Seite neu.
