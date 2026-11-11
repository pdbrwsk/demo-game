'use strict';

/* =========================================================
   Story: characters, dialogues, decisions.
   Every sequence is an async method; dialogues/choices are awaited.

   Flow:
   start ─┬─ join ─────────────────► joinDemo ─► rally ─┬─ go with the guy    ─► riot (Bad Ending)
          └─ watch ────┬─ join ─────► joinDemo           └─ no ──┬─ join ──────────► riot
                        └─ sure ───► stayAway                     └─ peaceful ─► secondDemo ─► townHall (Good Ending)
   ========================================================= */

// Chants to choose from: each exchange is [call, answer of the crowd]
const DEMO_CHANTS = [
  { label: 'We are here, we are loud!', lines: [['WE ARE HERE, WE ARE LOUD!', 'BECAUSE EDUCATION MAKES US PROUD!']] },
  { label: 'What do we want?', lines: [['WHAT DO WE WANT?', 'BETTER EDUCATION!'], ['WHEN DO WE WANT IT?', 'NOW!']] },
  { label: 'Education is not for sale!', lines: [['EDUCATION IS NOT FOR SALE!', 'EDUCATION IS NOT FOR SALE!']] },
  { label: 'Care, not neglect!', lines: [['CARE NOT NEGLECT!', 'CARE NOT NEGLECT!']] },
];

// Arguments of the protagonist at the town hall dialogue
const DIALOGUE_ARGS = [
  { label: 'Our school is falling apart', text: 'At our school the roof leaks and teachers are missing. How is good education supposed to work if they are cutting even more now?' },
  { label: 'Youth centres matter', text: 'For many of us the youth centre is the only place to go after school. If it closes, where are we supposed to go?' },
  { label: 'We want a say', text: 'The cuts hit us young people the hardest. Why are we never asked when decisions like this are made?' },
];

class Story {
  constructor(game) {
    this.game = game;

    this.player = new Actor({
      id: 'P', name: 'You', color: '#5fc8b8', x: 64, y: 394,
      look: { skin: '#f1c27d', hair: '#3b2416', shirt: '#2f8f83', pants: '#30364f', shoes: '#1b1b22', long: false, hat: null },
    });
    this.friend = new Actor({
      id: 'F', name: 'Friend', color: '#e3b23c', x: 80, y: 394,
      look: { skin: '#c68642', hair: '#c8642b', shirt: '#e3b23c', pants: '#4a3b2e', shoes: '#1b1b22', long: true, hat: null },
    });
    this.speaker = new Actor({
      id: 'R', name: 'Speaker', color: '#c79be0', x: 0, y: 0,
      look: { skin: '#8d5524', hair: '#1a1a1a', shirt: '#9b59b6', pants: '#30364f', shoes: '#1b1b22', long: true, hat: null },
    });
    this.agitator = new Actor({
      id: 'A', name: 'Loudmouth', color: '#e86a5a', x: 0, y: 0,
      look: { skin: '#ffdbac', hair: '#1a1a1a', shirt: '#2b2b33', pants: '#2b2b33', shoes: '#1b1b22', long: false, hat: '#2b2b33' },
    });
    this.officer = new Actor({ id: 'O', name: 'Police', color: '#7fb2ff', x: 0, y: 0, look: POLICE_LOOK });
    this.moderator = new Actor({
      id: 'M', name: 'Moderator', color: '#2fb3a8', x: 0, y: 0,
      look: { skin: '#e0ac69', hair: '#e8d07a', shirt: '#2fb3a8', pants: '#30364f', shoes: '#1b1b22', long: true, hat: null },
    });
    this.deputy = new Actor({
      id: 'D', name: 'MP', color: '#9fd3f0', x: 0, y: 0,
      look: { skin: '#f1c27d', hair: '#8a8a8a', shirt: '#3b3f4a', pants: '#2b2b33', shoes: '#1b1b22', long: false, hat: null },
    });

    this.street = new StreetScene([this.player, this.friend]);
    game.setScene(this.street);
  }

  // Shorthands
  say(who, text) { return this.game.dialog.say(who, text); }
  think(who, text) { return this.game.dialog.think(who, text); }
  choose(options, opts) { return this.game.choices.choose(options, opts); }
  close() { this.game.dialog.close(); }

  /* ---------- Start: camera pan to the demo, friend asks ---------- */
  async start() {
    const { game, street, player: P, friend: F } = this;
    street.demoVisible = true;

    await game.tweens.add(v => { street.cam.y = v; }, CAM_MENU_Y, CAM_DEMO_Y, 4500, easeInOut);
    await wait(600);

    P.facing = 'right';
    F.facing = 'left';
    await this.say(F, 'Hey, let\'s join in! It\'s our right to be heard by politicians!');
    const choice = await this.choose(['Join the demo', 'Just watch']);

    if (choice === 0) {
      await this.say(P, 'Okay, I\'m in! Which sign should I take?');
      await this.joinDemo();
    } else {
      await this.say(P, 'No, I\'m staying here.');
      await this.say(F, 'Are you sure you\'re not coming? Nothing will change that way!');
      const sure = await this.choose(['Join after all', 'Yes, I\'m sure']);
      if (sure === 0) {
        await this.say(P, 'Hm ... you\'re right. I\'m coming! Which sign should I take?');
        await this.joinDemo();
      } else {
        await this.stayAway();
      }
    }
  }

  /* ---------- Path A: join the demo ---------- */
  async joinDemo() {
    const { game, street, player: P, friend: F } = this;
    const s = await this.choose(PLAYER_SIGNS.map(sign => sign.preview()), { row: true });
    P.sign = PLAYER_SIGNS[s];
    await this.say(F, 'Good choice! Come on, let\'s go!');
    this.close();

    street.cam.follow = P;
    game.showMeter(true, 40);
    game.speaker = P; // marker shows where you are in the march
    await Promise.all([
      F.walkTo(F.x + 46, LANES[2]),
      P.walkTo(P.x + 44, LANES[3]),
    ]);
    // The player walks along (WASD); the friend follows
    P.control = game.keys;
    F.marching = true; F.follow = P;
    game.hint('WASD / arrow keys: walk');
    await this.waitForMove(8000);
    await wait(5000);
    game.hint(null);

    await this.say(F, 'Come on, let\'s shout something! Press 1, 2, 3 and 4 to start a chant!');
    this.close();
    game.speaker = P;
    await this.chants(3);
    await this.say(F, 'Wow, can you hear that? Everyone is joining in!');
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

  // Player starts chants with keys 1-4, the crowd answers; done after n chants
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

  // Player walks freely across the square and talks to people (E)
  async mingle(rally) {
    const { game, player: P } = this;
    const folks = [
      { name: 'Pupil', color: '#9fd3f0', lines: ['I came all the way from the next town. Our school library is supposed to close.', 'That\'s harsh. Good that you\'re here!'] },
      { name: 'Teacher', color: '#e3b23c', lines: ['Every day I see how much our school is missing. Nice that you young people are getting loud.', 'Thanks for being here too!'] },
      { name: 'Trainee', color: '#c79be0', lines: ['I\'m doing an apprenticeship. Our vocational school lacks materials and lessons get cancelled all the time.', 'That\'s exactly why I\'m here today.'] },
    ];
    const free = rally.extras.filter(a => !a.sign && a.x > 100 && a.x < 205 && !rally.followers.includes(a)).sort((a, b) => a.x - b.x);
    const picks = [free[0], free[free.length >> 1], free[free.length - 1]];
    picks.forEach((a, i) => { a.name = folks[i].name; a.color = folks[i].color; a.talk = folks[i].lines; });
    rally.talkables = picks;
    rally.player = P;
    rally.bounds = { x0: 8, x1: 205, y0: 128, y1: 176 };
    P.control = game.keys; P.drift = false;
    game.hint('WASD: walk · E: talk to people (talk to two of them)');
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

  /* ---------- Rally: speech, end of the demo, heckler ---------- */
  async rally() {
    const { game, player: P, friend: F, speaker: S, agitator: A } = this;
    await game.fadeTo(1, 1200);
    const rally = new RallyScene(P, F, S, A);
    game.setScene(rally);
    await game.caption('End of the route: rally in front of the town hall', 2600);
    await game.fadeTo(0, 1000);
    await wait(500);
    await this.mingle(rally);

    await this.say(S, 'Dear friends! Look around: so many people took to the streets today for education and social issues!');
    this.close();
    rally.cheer(2400, ['YEAH!', 'WOOO!', 'BRAVO!']);
    await wait(2200);
    await this.say(S, 'Education and social services are not items to cut. They are our future!');
    this.close();
    rally.cheer(2400, ['EXACTLY!', 'RIGHT ON!']);
    await wait(2200);
    await this.say(S, 'Thank you for coming in such numbers, and for keeping our march peaceful from start to finish. That was a strong signal!');
    await this.say(S, 'With this, I declare the demonstration over. But our commitment does not end today!');
    await this.say(S, 'Talk to your representatives, come to the town hall dialogue next week, get involved in the student council and go vote!');
    this.close();
    rally.cheer(3000, ['YEAH!', 'THANKS!', 'GREAT!']);
    await wait(3000);

    // Heckler from the audience
    A.raised = true;
    P.facing = F.facing = 'left';
    await rally.shout(A, 'FOR WHAT?!', 1500);
    await this.say(A, 'For what?! We have to do more against this! This can\'t be the end!');
    await this.say(A, 'Anyone who agrees with me, come with me!');
    A.raised = false;
    this.close();
    rally.followers.forEach((a, i) => a.walkTo(52 + (i % 3) * 9, 138 + (i % 2) * 8, 20));
    await wait(1800);

    F.facing = 'right';
    await this.say(F, 'Hm, should we go with him? I mean, he kind of has a point?');
    const go = await this.choose(['Yes, let\'s go with him', 'No']);
    if (go === 0) {
      await this.say(P, 'True, actually. Come on, let\'s hear what he\'s planning!');
      return this.riot();
    }

    await this.say(P, 'No. The political dialogue at the town hall is next week. We can talk to the politicians there.');
    await this.say(F, 'Talking gets us nowhere! We have to act! So, are you in or not?');
    const sure = await this.choose(['Fine, I\'m in', 'No, everything should stay peaceful']);
    if (sure === 0) {
      await this.say(P, 'Fine ... I\'m in.');
      return this.riot();
    }

    await this.say(P, 'No. Everything should stay peaceful. Otherwise nobody will talk about our demands in the end.');
    await this.say(A, 'Then without you! Come on, everyone, follow me!');
    this.close();
    game.addOpinion(8);
    [A, ...rally.followers].forEach((a, i) => a.walkTo(-20, a.y, 34 + i * 3));
    await wait(3000);
    await this.say(F, 'Hm ... maybe you\'re right. I wouldn\'t go there without you anyway.');
    await this.say(F, 'Okay, then I\'ll come to this dialogue next week. But it better lead somewhere!');
    await this.say(P, 'And before that there\'s the big demo on Saturday. We\'re definitely going again!');
    this.close();
    await this.secondDemo();
    await this.townHall();
  }

  /* ---------- Interlude: second, much bigger demo (route allowed by court) ---------- */
  async secondDemo() {
    const { game, player: P, friend: F, speaker: S } = this;
    await game.fadeTo(1, 1500);
    const rally = new RallyScene(P, F, S, null, true);
    game.setScene(rally);
    await game.caption('Saturday: the next demo for education and social issues', 2600);
    await game.fadeTo(0, 1000);
    rally.cheer(2400, ['EDUCATION!', 'YEAH!', 'WOOO!']);
    await wait(2400);

    await this.say(S, 'Hello everyone! Just look around: even more people came today than last time. There are thousands of you!');
    this.close();
    rally.cheer(2400, ['YEAH!', 'WOOO!']);
    await wait(2200);
    await this.say(S, 'And I have good news: at first, the city did not want to approve our demo route through the city centre.');
    await this.say(S, 'We went to court. We lost in the first instance, but now the court of second instance has decided: we are allowed to march our route!');
    await this.say(S, 'Freedom of assembly is in the constitution. It applies to us too!');
    this.close();
    game.addOpinion(6);
    rally.cheer(3000, ['YEAH!', 'GREAT!', 'EXACTLY!']);
    await wait(3000);
    await this.say(S, 'So: stay peaceful, look out for each other and show how many we are. Let\'s go!');
    this.close();
    rally.cheer(2000, ['GO GO GO!']);
    await wait(1600);

    // March: this time many more people on the street
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
    await game.caption('The march moves through the city centre', 2200);
    await game.fadeTo(0, 1000);
    game.speaker = P;
    await wait(3500);

    await this.say(F, 'Come on, start another chant! Keys 1 to 4!');
    this.close();
    game.speaker = P;
    await this.chants(3, street);
    await wait(1500);

    await this.say(F, 'Crazy how many people are here! Now I\'m really curious about the meeting at the town hall.');
    await this.say(P, 'Yeah, me too. I hope everything works out and that they actually listen to us.');
    this.close();
    game.speaker = P;
    await wait(2000);
    P.control = null;
  }

  /* ---------- Path A1: with the loud guy -> riot (Bad Ending) ---------- */
  async riot() {
    const { game, player: P, friend: F, agitator: A, officer: O } = this;
    const rally = game.scene;
    await this.say(A, 'Great! Come on, everyone, follow me!');
    this.close();
    [A, P, F, ...rally.followers].forEach((a, i) => a.walkTo(-20, a.y, 34 + (i % 4) * 3));
    await wait(1500);
    await game.fadeTo(1, 1500);

    const riot = new RiotScene(P, F, A, O);
    game.setScene(riot);
    await game.caption('Shortly after, a few streets away ...', 2600);
    await game.fadeTo(0, 1000);

    riot.cheer(2600, ['ENOUGH!', 'GO!']);
    await riot.shout(A, 'NOW THEY HAVE TO LISTEN!', 2400);
    await this.say(F, 'Uh ... why are they wearing masks? I thought we were just going to keep protesting?');
    this.close();

    await riot.throwAt(riot.rioters[0], 46, 104, 'stone');
    riot.broken = true;
    game.addOpinion(-45);
    await wait(500);
    await this.say(P, 'Hey, are you crazy?! That\'s a bus stop! What does that have to do with education?');
    this.close();

    await riot.throwAt(riot.rioters[2], 233, 128, 'bottle');
    await wait(400);
    await this.say(O, 'This is the police! This assembly is dissolved. Leave the street immediately!');
    await this.say(F, 'Dude, this is totally getting out of hand ...');
    await this.say(P, 'This is not what I wanted! Come on, let\'s get out of here!');
    this.close();

        // The masked ones flee, the police advance, the two are stopped
    [A, ...riot.rioters].forEach((r, i) => r.walkTo(-30, r.y, 70 + i * 5));
    F.facing = 'right';
    game.hint('Run! WASD: dodge the bottles (red marks) and keep away from the police.');
    await riot.chase(P);
    game.hint(null);
    await O.walkTo(P.x + 16, P.y, 40);
    P.facing = F.facing = 'right';
    await this.say(O, 'Stop right there! You two were in the middle of the group. Your IDs, please.');
    await this.say(P, 'But we didn\'t throw anything!');
    await this.say(O, 'That will all be checked. We are taking your details. Everyone in the group is under investigation for breach of the peace.');
    await this.think(P, 'How could this escalate so quickly ...?');
    this.close();

    await game.fadeTo(1, 1500);
    await game.caption('In the evening ...', 2200);
    await this.news([
      { headline: 'RIOTS AFTER DEMO', image: 'riot', text: 'Good evening. After an initially peaceful demonstration for education and social issues, riots broke out this afternoon.' },
      { text: 'A group of masked people destroyed a bus stop and threw bottles at the police. Numerous people are now under investigation.' },
      { headline: 'GOVERNMENT STAYS FIRM', image: 'school', text: 'The government condemns the violence and sticks to the cuts. Violence is no argument, it said.' },
      { text: 'Hardly anyone is still talking about the demonstrators\' actual demands.' },
    ], '+++ RIOTS AFTER DEMO +++ BUS STOP DESTROYED +++ DOZENS UNDER INVESTIGATION +++ GOVERNMENT: VIOLENCE IS NO ARGUMENT ');

    await this.say(P, 'Great. Now everybody only talks about the riots ... and nobody about education anymore!');
    await this.say(P, 'And everyone who protested peacefully now looks like a troublemaker too.');
    await this.think(P, 'We wanted to change something ... and in the end we only hurt our own cause.');
    this.close();
    game.showEnd('The riots achieved nothing except negative headlines and trouble with the police.');
  }

  /* ---------- Path A2: stay peaceful -> town hall dialogue -> rethink (Good Ending) ---------- */
  async townHall() {
    const { game, player: P, friend: F, moderator: M, deputy: D } = this;
    await game.fadeTo(1, 1500);
    const hall = new TownHallScene(P, F, M, D);
    game.setScene(hall);
    await game.caption('A few days later: citizens\' dialogue at the town hall', 2600);
    await game.fadeTo(0, 1200);
    await wait(500);

    await this.say(M, 'Welcome to the citizens\' dialogue! Today is about the planned cuts to education and social services.');
    await this.say(M, 'Our member of parliament is here to listen to you. The first contribution is already waiting at the floor microphone. Please go ahead!');
    await this.say(P, 'Hello. I was at the demos for education and social issues. I would like to say something:');
    const arg = await this.choose(DIALOGUE_ARGS.map(a => a.label));
    game.addOpinion(20);
    await this.say(P, DIALOGUE_ARGS[arg].text);
    await this.say(D, 'Thank you for your frank words. I want to be honest: the budget is tight, and we have to save in many places.');
    await this.say(D, 'But we noticed the many people at the demonstrations. And today I hear very concretely what the cuts mean for you.');
    await this.say(F, 'And what happens with that now? Or is it all just talk?');
    await this.say(D, 'I will take your examples into the deliberations in parliament. And I invite your student council to send me their proposals. I will get back to you personally.');
    hall.applause = 3;
    game.addOpinion(10);
    await this.say(M, 'Thank you very much! That is exactly what a dialogue like this is for: listening, debating and looking for solutions together.');
    await this.say(F, 'Okay ... I admit it: that was better than expected. She really listened to us.');
    await this.say(P, 'See? Talking can achieve something after all.');
    this.close();

    await game.fadeTo(1, 1500);
    await game.caption('Two weeks later ...', 2200);

    // Chance: even peaceful protest guarantees no success
    if (Math.random() < 0.3) {
      await this.news([
        { headline: 'GOVERNMENT STANDS BY CUTS', image: 'school', text: 'Good evening. Despite weeks of peaceful protests, the government is sticking to its cuts to education and social services.' },
        { text: 'The budget leaves no room, it said. The demonstrators\' concerns have been noted.' },
      ], '+++ CUTS APPROVED +++ GOVERNMENT: NO ROOM IN THE BUDGET +++ SCHOOLS AND YOUTH CENTRES AFFECTED ');
      game.addOpinion(-25);
      await this.say(P, 'All of that for nothing! Why should I keep protesting if nobody listens to me anyway?');
      await this.say(F, 'We were loud, we stayed peaceful and we talked ... and still nothing changes.');
      await this.think(P, 'Maybe a single protest isn\'t enough. But if everyone gives up, nobody will ever listen ...');
      this.close();
      game.showEnd('Peaceful protest is no guarantee: sometimes politicians stick to their plans anyway.\nPolitical participation often takes staying power.');
      return;
    }

    await this.news([
      { headline: 'PARLIAMENT RETHINKS', image: 'parliament', text: 'Good evening. After continued peaceful protests, parliament is reconsidering the planned cuts to education and social services.' },
      { text: 'In many citizens\' dialogues, young people in particular made clear what the austerity plans would mean for them.' },
      { headline: 'PLANS BEING REVISED', text: 'The reforms are now to be revised. Funds for school renovations and youth centres are back on the table.' },
    ], '+++ PARLIAMENT DEBATES CUTS AGAIN +++ YOUTH CENTRES SEE HOPE +++ STUDENT COUNCILS SUBMIT PROPOSALS ');

    await this.say(P, 'Wow ... they really listened to us!');
    await this.say(P, 'I have to text my friend right away. We did this together!');
    await this.think(P, 'Being loud, staying peaceful and talking to each other: that\'s how you can really make a difference.');
    this.close();
    game.showEnd('Peaceful protest and dialogue made a difference.');
  }

  /* ---------- Path B: don\'t join -> evening news ---------- */
  async stayAway() {
    const { game, player: P, friend: F } = this;
    await this.say(P, 'Yes, I\'m sure. I\'m going home.');
    await this.say(F, 'Alright ... see you later then.');
    this.close();

    await F.walkTo(F.x + 30, LANES[3]);
    F.marching = true;
    P.facing = 'right';
    await wait(2500);

    // Protagonist walks off to the left, fade to black
    await Promise.all([
      P.walkTo(-20, P.y),
      wait(1500).then(() => game.fadeTo(1, 1500)),
    ]);
    await game.caption('In the evening ...', 2200);

    await this.eveningNews();
    game.showEnd();
  }

  async eveningNews() {
    const P = this.player;
    await this.news([
      { headline: 'CUTS TO EDUCATION', image: 'school', text: 'Good evening. The government decided today on cuts to education and social services.' },
      { text: 'Planned funds for new teachers and for renovating schools will be scrapped.' },
      { headline: 'SOCIAL SERVICES HIT TOO', image: 'youth', text: 'Youth centres and advice services will also have to get by with less money in future.' },
      { headline: 'PROTEST WITHOUT EFFECT?', image: 'demo', text: 'The demonstration downtown was smaller than expected. The government therefore sees little resistance to its plans.' },
    ]);

    await this.say(P, 'What?! Why cut education of all things? Our school is already falling apart!');
    await this.say(P, 'And closing youth centres? Where are we supposed to go then? That\'s totally unfair!');
    await this.say(P, 'They just decide over our heads ...');
    await this.think(P, 'Maybe I should have joined the demo after all ...');
    this.close();
  }


  // Fade in the living room, the TV speaks the reports. items: [{ headline?, image?, text }]
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
