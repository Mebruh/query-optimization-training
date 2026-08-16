import { fitCanvas } from './canvas.js';
import { logEvent } from './logger.js';
import { makeDraggable } from './drag.js';
import { renderTipsList } from './tips.js';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function button(label, className, onClick) {
  const btn = el('button', `btn ${className}`, label);
  btn.type = 'button';
  btn.addEventListener('click', onClick);
  return btn;
}

function renderStart({ go }) {
  const screen = el('div', 'screen');

  screen.appendChild(el('h1', 'title', 'Welcome to Query Optimization TRAINing'));
  const actions = el('div', 'actions');
  actions.appendChild(button('Start', 'btn--primary', () => go('intro', { via: 'start_button' })));
  screen.appendChild(actions);

  return screen;
}

const INTRO_PARAGRAPHS = [
  'Query optimization is the process of determining the most efficient way for a database to execute a query. When you ask a database a question using SQL, there are many different ways it could go about finding the answer. Some of those ways are far more efficient than others, and a lot of that efficiency comes down to how the query is written.',
  'The aim of this game is to help you understand how to create more efficient queries.',
  'In this game, single SQL terms are represented by crates/boxes. A whole query, which is comprised of multiple crates, is represented by the cargo that is loaded onto a train.',
  'Similarly to how a heavier cargo load takes longer to move, burns more fuel, and uses up more resources of a train engine, queries work the same way. An inefficient query takes longer to run, costs more to execute, and uses more CPU cycles, memory, and time than it needs to.',
  'Your job is to build the most efficient query you can, so your train reaches its destination.',
  'There are 3 game modes, with 2 rounds in each game mode.',
  'Press Next to see what makes a query efficient.',
];

function hintsButton() {
  return button('Hints', 'btn--ghost btn--hints', () => {
    window.open('hints.html', 'qot_hints');
    logEvent('hints_open', {});
  });
}

function renderIntro({ go }) {
  const screen = el('div', 'screen screen--intro');
  screen.appendChild(el('p', 'eyebrow', 'Introduction'));
  screen.appendChild(el('h2', 'screen-label', 'What is query optimization?'));

  const body = el('div', 'intro-body');
  INTRO_PARAGRAPHS.forEach((text) => body.appendChild(el('p', 'intro-body__para', text)));
  screen.appendChild(body);

  const actions = el('div', 'actions');
  actions.appendChild(button('Next', 'btn--primary', () => go('guide', { via: 'next_button' })));
  actions.appendChild(button('Back', 'btn--back', () => go('start', { via: 'back' })));
  screen.appendChild(actions);

  return screen;
}

function renderGuide({ go }) {
  const screen = el('div', 'screen screen--guide');
  screen.appendChild(el('p', 'eyebrow', 'Guide'));
  screen.appendChild(el('h2', 'screen-label', 'What makes a query efficient'));

  screen.appendChild(renderTipsList());

  const actions = el('div', 'actions');
  actions.appendChild(button('Next', 'btn--primary', () => go('howto1', { via: 'next_button' })));
  actions.appendChild(button('Back', 'btn--back', () => go('intro', { via: 'back' })));
  screen.appendChild(actions);

  return screen;
}

const MODE_INTROS = {
  howto1: {
    id: 'howto1',
    eyebrow: 'Game mode 1 instructions',
    title: 'Train Race!',
    body: [
      'Welcome to game mode 1.',
      'In this game mode you have to choose what you think will be the fastest train.',
      'Remember that a more efficient query means that a train will arrive at the station quicker.',
      'You can always view the list of query optimization tips by clicking on the Hints button in the next page.',
    ],
    start: 'game1a',
    back: 'guide',
  },
  howto2: {
    id: 'howto2',
    eyebrow: 'Game mode 2 instructions',
    title: "Oh no! The train can't make it to the station!",
    body: [
      'Welcome to game mode 2.',
      'The cargo loaded on the train forms a very inefficient query and the train uses too much fuel before it can reach the station.',
      'In this game mode you have to swap out the inefficient query terms loaded on the train with more optimized ones.',
      'Remember, you can always view the list of query optimization tips by clicking on the Hints button in the next page.',
    ],
    start: 'game2a',
  },
  howto3: {
    id: 'howto3',
    eyebrow: 'Game mode 3 instructions',
    title: 'All Aboard!',
    body: [
      'Welcome to game mode 3.',
      'You will see in the next page that the train is empty.',
      "Your job is to load the train with an efficient query so that it can reach it's destination.",
      "Similar to the last round, if the query/cargo is too heavy and inefficient then the train will run out of fuel before it reaches it's destination.",
      'Remember, you can always view the list of query optimization tips by clicking on the Hints button in the next page.',
    ],
    start: 'game3a',
  },
};

function renderModeIntro(config, { go }) {
  const screen = el('div', 'screen screen--intro');
  screen.appendChild(el('p', 'eyebrow', config.eyebrow));
  screen.appendChild(el('h2', 'screen-label', config.title));

  const body = el('div', 'intro-body');
  config.body.forEach((text) => body.appendChild(el('p', 'intro-body__para', text)));
  screen.appendChild(body);

  const actions = el('div', 'actions');
  actions.appendChild(
    button('Start game', 'btn--primary', () => go(config.start, { via: 'start_game_button' }))
  );
  if (config.back) {
    actions.appendChild(button('Back', 'btn--back', () => go(config.back, { via: 'back' })));
  }
  screen.appendChild(actions);

  return screen;
}

const CARS_PER_TRAIN = 2;
const CRATES_PER_CAR = 3;

const RACE = {
  fastMs: 2600,
  slowMs: 4100,
  settleMs: 500,
  easing: 'cubic-bezier(0.35, 0, 0.35, 1)',
};

const FEEDBACK = {
  correct: 'Congratulations!',
  wrong: 'Unfortunately, that is not right.',
};

const RACE_ROUNDS = {
  game1a: {
    id: 'game1a',
    eyebrow: 'Round 1',
    prompt: 'Which of these two queries will run faster?',
    trains: {
      a: "SELECT order_no FROM orders WHERE status = 'shipped'",
      b: "SELECT * FROM orders WHERE status = 'shipped'",
    },
    correct: 'a',
    next: 'game1b',
    explanation: [
      [
        'Both queries filter the same rows. The difference is how much of each row they return. Train A asks for just the ',
        { code: 'order_no' }, ' column, while Train B uses ', { code: 'SELECT *' },
        ' and hauls every column in the table.',
      ],
      [
        'The database has to read, hold in memory, and transfer all of that extra data even though none of it is used. That\'s why train B is slower.',
      ],
      ['Remember to only return the columns you need rather than selecting everything.'],
    ],
  },
  game1b: {
    id: 'game1b',
    eyebrow: 'Round 2',
    prompt: 'Which of these two queries will run faster?',
    stem: 'SELECT order_no FROM orders ...',
    trains: {
      a: "WHERE order_date >= '2026-01-01'",
      b: 'WHERE YEAR(order_date) >= 2026',
    },
    correct: 'a',
    next: 'howto2',
    explanation: [
      ['Both queries return the same orders and both of them carry the same column. However, the difference is the filter.'],
      [
        'Train A compares ', { code: 'order_date' },
        ' directly, so an index on that column can be used to jump straight to the matching rows.',
      ],
      [
        'Train B wraps the column in ', { code: 'YEAR()' },
        '. That function has to be worked out for every row in the table before the condition can be tested, so the index cannot be used and the database falls back to scanning everything.',
      ],
    ],
  },
};

function sprite(className, src, { alt = '', optional = false } = {}) {
  const img = new Image();
  img.className = className;
  img.alt = alt;
  img.draggable = false;

  if (optional) img.onerror = () => img.remove();
  img.src = src;
  return img;
}

function renderCar() {
  const car = el('div', 'car');

  const cargo = el('div', 'car__cargo');
  for (let i = 0; i < CRATES_PER_CAR; i++) {
    cargo.appendChild(sprite('crate', 'assets/images/CrateBig.png'));
  }

  car.appendChild(sprite('car__bed', 'assets/images/TrailFlatbed03.png'));
  car.appendChild(cargo);
  return car;
}

function para(className, parts) {
  const node = el('p', className);
  parts.forEach((part) => {
    if (typeof part === 'string') node.appendChild(document.createTextNode(part));
    else node.appendChild(el('code', 'feedback__code', part.code));
  });
  return node;
}

function renderLane(id, label, text, cars, onPick) {
  const lane = el('div', 'lane');
  lane.dataset.lane = id;

  lane.style.setProperty('--car-count', cars);

  const plateWidth = cars * 228 + (cars - 1) * 3;
  const fitted = Math.min(19, Math.floor((plateWidth - 16) / (text.length * 0.6)));
  lane.style.setProperty('--query-size', `${fitted}px`);

  const pick = el('button', 'lane__pick', `Click here for ${label}`);
  pick.type = 'button';
  pick.dataset.lane = id;
  pick.setAttribute('aria-label', `Choose ${label}: ${text}`);
  pick.addEventListener('click', () => onPick(id));
  lane.appendChild(pick);
  lane.appendChild(sprite('shed', 'assets/images/ElectricalShed.png', { optional: true }));

  const consist = el('div', 'consist');
  for (let i = 0; i < cars; i++) consist.appendChild(renderCar());
  consist.appendChild(sprite('loco', 'assets/images/Train.png'));
  consist.appendChild(el('p', 'query', text));
  lane.appendChild(consist);

  return { lane, pick, consist };
}

function raceDistance(consist) {

  const lane = consist.parentElement;
  const shed = lane.querySelector('.shed');
  const front = consist.offsetLeft + consist.offsetWidth;
  const target = shed ? shed.offsetLeft : lane.offsetWidth - 80;
  return Math.max(120, target - front - 16);
}

function runRace(consists, correctLane) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    Object.values(consists).forEach((node) => {
      node.style.transform = `translateX(${raceDistance(node)}px)`;
    });
    return Promise.resolve();
  }

  const running = Object.entries(consists).map(([id, node]) => {
    const duration = id === correctLane ? RACE.fastMs : RACE.slowMs;
    const distance = raceDistance(node);
    return node.animate(
      [{ transform: 'translateX(0)' }, { transform: `translateX(${distance}px)` }],
      { duration, easing: RACE.easing, fill: 'forwards' }
    ).finished;
  });

  return Promise.all(running).then(
    () => new Promise((resolve) => setTimeout(resolve, RACE.settleMs))
  );
}

function renderFeedback({ onContinue, label = 'Continue' } = {}) {
  let handler = onContinue;
  const overlay = el('div', 'feedback');
  overlay.hidden = true;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  const card = el('div', 'feedback__card');
  const title = el('h3', 'feedback__title');
  const text = el('div', 'feedback__text');
  card.appendChild(title);
  card.appendChild(text);

  const close = el('button', 'btn btn--primary feedback__close', label);
  close.type = 'button';
  close.addEventListener('click', () => {
    overlay.hidden = true;
    handler?.();
  });
  card.appendChild(close);
  overlay.appendChild(card);

  return {
    overlay,
    show(result, content, action) {
      close.textContent = action?.label ?? label;
      handler = action?.onContinue ?? onContinue;

      title.textContent = content.title;

      text.replaceChildren();
      content.body.forEach((parts, i) => {
        text.appendChild(para(i === 0 ? 'feedback__lead' : 'feedback__body', parts));
      });

      overlay.dataset.result = result;
      overlay.hidden = false;
      close.focus();
    },
  };
}

function renderRace(config, { go }) {
  const screen = el('div', 'screen screen--game');
  screen.appendChild(el('p', 'eyebrow', config.eyebrow));
  screen.appendChild(el('h2', 'screen-label', config.prompt));
  if (config.stem) screen.appendChild(el('p', 'stem', config.stem));

  const feedback = renderFeedback({
    onContinue: () => go(config.next, { via: 'continue_button' }),
  });
  const picks = [];
  const consists = {};
  let answered = false;
  const shownAt = performance.now();

  const onPick = (id) => {
    if (answered) return;
    answered = true;

    const correct = id === config.correct;
    picks.forEach((btn) => { btn.disabled = true; });

    logEvent('answer', {
      screen: config.id,
      chose: id,
      correct,
      response_ms: Math.round(performance.now() - shownAt),
    });

    logEvent('race_start', { screen: config.id });
    runRace(consists, config.correct).then(() => {
      picks.forEach((btn) => {
        if (btn.dataset.lane === id) btn.classList.add('is-picked');
        if (btn.dataset.lane === config.correct) btn.classList.add('is-answer');
      });
      logEvent('race_end', { screen: config.id });
      feedback.show(correct ? 'correct' : 'wrong', {
        title: correct ? FEEDBACK.correct : FEEDBACK.wrong,
        body: config.explanation,
      });
    });
  };

  const longest = Math.max(...Object.values(config.trains).map((t) => t.length));
  const cars = Math.min(3, Math.max(2, Math.ceil(longest / 26)));

  const frame = el('div', 'canvas-frame');
  const canvas = el('div', 'canvas');
  ['a', 'b'].forEach((id, i) => {
    const { lane, pick, consist } = renderLane(
      id, i === 0 ? 'Train A' : 'Train B', config.trains[id], cars, onPick
    );
    picks.push(pick);
    consists[id] = consist;
    canvas.appendChild(lane);
  });
  frame.appendChild(canvas);
  screen.appendChild(frame);

  const actions = el('div', 'actions actions--run');
  actions.appendChild(hintsButton());
  screen.appendChild(actions);
  screen.appendChild(feedback.overlay);

  requestAnimationFrame(() => fitCanvas(canvas));

  return screen;
}

const LOADER = {
  scrollPx: 2960,
  scrollMs: 2800,
  approachPx: 172,
  approachMs: 1100,
  overlapMs: 650,
  stallPx: 780,
  stallMs: 2200,
  settleMs: 400,
  fuelCorrect: 0.62,
  fuelEmpty: 0.02,
  scrollEasing: 'cubic-bezier(0.35, 0, 0.35, 1)',
  approachEasing: 'cubic-bezier(0.3, 0, 0.4, 1)',
  stallEasing: 'cubic-bezier(0.2, 0, 0.1, 1)',
  slotPx: 104,
};

const SPARE = ['Any crates you do not need can be left in the tray below.'];

const FUEL_SAVED = 'Less work for the database means the query is more efficient which means less fuel is used for the train.';
const FUEL_BURNED = "That's why your train burned so much fuel.";
const REACHED = 'Your train had the fuel to reach the station.';
const STALLED = 'Your train ran out of fuel and stopped before it reached the station.';

const LOADER_ROUNDS = {
  game2a: {
    id: 'game2a',
    eyebrow: 'Round 1',
    prompt: 'Swap out the heavy crates to make a better optimized query and save fuel',
    goal: 'Return the order number of every order placed after 2026-01-01',
    slots: 10,
    deck: ['SELECT', '*', 'FROM', 'orders', 'WHERE', 'YEAR(order_date)', '>', '"2026"', 'ORDER BY total', null],
    tray: ['order_no', 'order_date', '"2026-01-01"'],
    answer: ['SELECT', 'order_no', 'FROM', 'orders', 'WHERE', 'order_date', '>', '"2026-01-01"'],
    fuel: true,
    next: 'game2b',
    why: [
      [
        'Selecting only ', { code: 'order_no' },
        ' means the database reads one column instead of every column in the table, so there is a lot less data to return.',
      ],
      [
        'Comparing ', { code: 'order_date' },
        ' directly lets an index on that column jump straight to the matching rows, instead of computing ',
        { code: 'YEAR()' }, ' for every row and scanning the whole table.',
      ],
      [
        "The results don't need to be ordered, so ", { code: 'ORDER BY total' },
        " just makes the database sort a result set that doesn't need to be sorted. Leaving that crate behind stops the query from performing unnecessary actions.",
      ],
    ],
    correctTail: [FUEL_SAVED],
    wrongTail: [FUEL_BURNED],
  },
  game2b: {
    id: 'game2b',
    eyebrow: 'Round 2',
    prompt: 'Swap out the heavy crates to make a better optimized query and save fuel',
    goal: 'Return every order number from 100 to 250',
    slots: 12,
    deck: ['SELECT', '*', 'FROM', 'orders', 'WHERE', 'order_no + 100', '>=', '200', 'AND', 'order_no', '<=', '250'],
    tray: ['order_no', 'BETWEEN', '100'],
    answer: ['SELECT', 'order_no', 'FROM', 'orders', 'WHERE', 'order_no', 'BETWEEN', '100', 'AND', '250'],
    fuel: true,
    next: 'howto3',
    why: [
      [
        'Selecting only ', { code: 'order_no' }, ' instead of ', { code: '*' },
        ' means the database carries back one column rather than every column in the table.',
      ],
      [
        { code: 'order_no + 100' },
        ' has to be recalculated for every single row before the filter can be tested, so the index on that column goes unused. Doing the math on the other side turns it into a comparison against ',
        { code: '100' }, ' that an index can work with.',
      ],
      [
        { code: 'BETWEEN 100 AND 250' },
        ' asks the database for one continuous range, which an index can read in a single pass. Two separate conditions make it do more work.',
      ],
    ],
    correctTail: [FUEL_SAVED],
    wrongTail: [FUEL_BURNED],
  },
  game3a: {
    id: 'game3a',
    eyebrow: 'Round 1',
    prompt: 'Load the empty train with the most optimized query',
    goal: 'Return the order number of every order placed after 2026-01-01',
    slots: 10,
    deck: null,
    tray: ['SELECT', '*', 'FROM', 'orders', 'WHERE', 'YEAR(order_date)', '>', '"2026"', 'order_date', '"2026-01-01"', 'order_no'],
    answer: ['SELECT', 'order_no', 'FROM', 'orders', 'WHERE', 'order_date', '>', '"2026-01-01"'],
    fuel: true,
    next: 'game3b',
    why: [
      [
        'Selecting only ', { code: 'order_no' },
        ' means the database reads one column instead of every column in the table, so there is far less data to move.',
      ],
      [
        'Comparing ', { code: 'order_date' },
        ' directly lets an index on that column jump straight to the matching rows, instead of computing ',
        { code: 'YEAR()' }, ' for every row and scanning the whole table.',
      ],
    ],
    correctTail: [REACHED],
    wrongTail: [STALLED],
  },
  game3b: {
    id: 'game3b',
    eyebrow: 'Round 2',
    prompt: 'Load the empty train with the most optimized query',
    goal: 'Return the order number of the 100 highest-value orders placed in the East region',
    slots: 12,
    deck: null,
    tray: ['SELECT', '*', 'order_no', 'FROM', 'orders', 'WHERE', 'HAVING', 'region', '=', "'East'", 'ORDER BY total DESC', 'LIMIT 100'],
    answer: ['SELECT', 'order_no', 'FROM', 'orders', 'WHERE', 'region', '=', "'East'", 'ORDER BY total DESC', 'LIMIT 100'],
    fuel: true,
    next: 'final',
    why: [
      [
        'Selecting only ', { code: 'order_no' },
        ' means the database carries back one column instead of every column in the table.',
      ],
      [
        { code: 'WHERE' },
        ' filters rows before any grouping or sorting happens, so the database throws away everything outside the East region early. ',
        { code: 'HAVING' },
        " is for filtering on already grouped results and without a GROUP BY the query wouldn't even run.",
      ],
      [
        "Since you don't know which orders are the highest value without putting them in order first, ",
        { code: 'ORDER BY' }, ' is useful and needed in this case. And because ', { code: 'LIMIT 100' },
        ' caps the result at a hundred rows, the database stops carrying data back as soon as it has enough.',
      ],
    ],
    correctTail: [REACHED],
    wrongTail: [STALLED],
  },
};

function loaderFeedback(config) {
  const built = (deck) => deck.filter(Boolean).join(' ');
  return {
    incomplete: {
      title: 'The train is empty.',
      body: [['Load some crates onto the train before it can run.']],
    },
    wrong: (deck) => ({
      title: 'Unfortunately, that is not right.',
      body: [
        ['Your train was carrying ', { code: built(deck) }, '.'],
        ['The optimized query is ', { code: config.answer.join(' ') }, '.'],
        ...config.why,
        ...config.wrongTail.map((t) => [t]),
      ],
    }),
    correct: () => ({
      title: 'Congratulations!',
      body: [
        ['The train is carrying ', { code: config.answer.join(' ') }, '.'],
        ...config.why,
        ...config.correctTail.map((t) => [t]),
      ],
    }),
  };
}

function renderBareCar() {
  const car = el('div', 'car');
  car.appendChild(sprite('car__bed', 'assets/images/TrailFlatbed03.png'));
  return car;
}

function renderLoader(config, { go }) {
  const screen = el('div', 'screen screen--game');
  screen.appendChild(el('p', 'eyebrow', config.eyebrow));
  screen.appendChild(el('h2', 'screen-label', config.prompt));
  if (config.goal) screen.appendChild(el('p', 'stem', config.goal));

  const slotCount = config.slots ?? config.answer.length;
  const deck = new Array(slotCount).fill(null);
  if (config.deck) config.deck.forEach((t, i) => { deck[i] = t ?? null; });
  const tray = [...config.tray];

  const deckPx = slotCount * LOADER.slotPx;
  const design = {
    width: Math.max(1440, 12 + deckPx + 244 + 320),
    height: 470,
  };
  const carCount = Math.max(2, Math.ceil(deckPx / 231));

  const frame = el('div', 'canvas-frame');
  const canvas = el('div', 'canvas canvas--yard');

  const lane = el('div', 'lane');
  lane.appendChild(sprite('shed', 'assets/images/ElectricalShed.png', { optional: true }));
  const consist = el('div', 'consist');
  for (let i = 0; i < carCount; i++) consist.appendChild(renderBareCar());
  consist.appendChild(sprite('loco', 'assets/images/Train.png'));
  lane.appendChild(consist);
  canvas.appendChild(lane);

  const slotRow = el('div', 'deck-slots');
  const slots = deck.map((_, i) => {
    const slot = el('div', 'slot');
    slot.dataset.index = String(i);
    slotRow.appendChild(slot);
    return slot;
  });
  canvas.appendChild(slotRow);

  let fuelLevel = null;
  if (config.fuel) {
    const fuel = el('div', 'fuel');
    fuel.appendChild(el('p', 'fuel__label', 'Fuel'));
    const track = el('div', 'fuel__track');
    fuelLevel = el('div', 'fuel__level');
    track.appendChild(fuelLevel);
    fuel.appendChild(track);
    canvas.appendChild(fuel);
  }

  const trayBox = el('div', 'tray');
  trayBox.appendChild(el('p', 'tray__label', 'SQL terms to choose from'));
  const trayRow = el('div', 'tray__row');
  trayBox.appendChild(trayRow);
  canvas.appendChild(trayBox);

  frame.appendChild(canvas);
  screen.appendChild(frame);

  const messages = loaderFeedback(config);
  const feedback = renderFeedback({ label: 'Retry' });
  screen.appendChild(feedback.overlay);

  const runRow = el('div', 'actions actions--run');
  const run = el('button', 'btn btn--primary', 'Run query and start train');
  run.type = 'button';
  runRow.appendChild(run);
  runRow.appendChild(hintsButton());
  screen.appendChild(runRow);

  const centreOf = (node) => {
    const r = node.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };

  const hits = (node, point) => {
    const r = node.getBoundingClientRect();
    return point.x >= r.left && point.x <= r.right && point.y >= r.top && point.y <= r.bottom;
  };

  function drop(from, token, point) {
    const target = slots.findIndex((slot) => hits(slot, point));

    if (target >= 0) {
      const occupant = deck[target];
      if (from.type === 'slot') {
        deck[from.index] = occupant ?? null;
        deck[target] = token;
      } else {
        tray.splice(from.index, 1);
        deck[target] = token;
        if (occupant) tray.push(occupant);
      }
      return { moved: true, to: `slot ${target}` };
    }

    if (hits(trayBox, point)) {
      if (from.type === 'slot') {
        deck[from.index] = null;
        tray.push(token);
        return { moved: true, to: 'tray' };
      }
      return { moved: false, to: 'tray' };
    }

    return { moved: false, to: 'none' };
  }

  function makeToken(token, from) {
    const node = el('div', 'token');
    node.dataset.token = token;
    node.appendChild(sprite('crate', 'assets/images/CrateBig.png'));
    node.appendChild(el('span', 'token__text', token));

    makeDraggable(node, {
      scale: () => parseFloat(canvas.dataset.scale),
      onStart: () => node.classList.add('is-dragging'),
      onEnd: () => {
        node.classList.remove('is-dragging');
        const result = drop(from, token, centreOf(node));
        logEvent('token_drop', {
          screen: config.id,
          token,
          from: from.type === 'slot' ? `slot ${from.index}` : 'tray',
          to: result.to,
          moved: result.moved,
        });
        requestAnimationFrame(paint);
      },
    });

    return node;
  }

  function paint() {
    slots.forEach((slot, i) => {
      slot.replaceChildren();
      const token = deck[i];
      if (token) slot.appendChild(makeToken(token, { type: 'slot', index: i }));
    });
    trayRow.replaceChildren();
    tray.forEach((token, i) => trayRow.appendChild(makeToken(token, { type: 'tray', index: i })));
  }

  function departure(correct) {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const stalls = !correct;

    if (reduced) {
      if (fuelLevel) {
        const level = correct ? LOADER.fuelCorrect : LOADER.fuelEmpty;
        fuelLevel.style.transform = `scaleX(${level})`;
      }
      if (!stalls) {
        [consist, slotRow].forEach((node) => {
          node.style.transform = `translateX(${LOADER.approachPx}px)`;
        });
      }
      return Promise.resolve();
    }

    if (stalls) {
      const stallPx = LOADER.stallPx;
      const stallMs = LOADER.stallMs;

      if (fuelLevel) {
        fuelLevel.animate(
          [{ transform: 'scaleX(1)' }, { transform: `scaleX(${LOADER.fuelEmpty})` }],
          { duration: stallMs, easing: 'linear', fill: 'forwards' }
        );
      }

      const stall = lane.animate(
        [{ backgroundPositionX: '0px' }, { backgroundPositionX: `${-stallPx}px` }],
        { duration: stallMs, easing: LOADER.stallEasing, fill: 'forwards' }
      );
      return stall.finished.then(
        () => new Promise((resolve) => setTimeout(resolve, LOADER.settleMs))
      );
    }

    const startsAt = Math.max(0, LOADER.scrollMs - LOADER.overlapMs);

    if (fuelLevel) {
      fuelLevel.animate(
        [{ transform: 'scaleX(1)' }, { transform: `scaleX(${LOADER.fuelCorrect})` }],
        { duration: startsAt + LOADER.approachMs, easing: 'linear', fill: 'forwards' }
      );
    }

    const scroll = lane.animate(
      [{ backgroundPositionX: '0px' }, { backgroundPositionX: `${-LOADER.scrollPx}px` }],
      { duration: LOADER.scrollMs, easing: LOADER.scrollEasing, fill: 'forwards' }
    );

    const approach = new Promise((resolve) => {
      setTimeout(() => {
        const travel = [{ transform: 'translateX(0)' },
                        { transform: `translateX(${LOADER.approachPx}px)` }];
        const opts = { duration: LOADER.approachMs, easing: LOADER.approachEasing, fill: 'forwards' };
        resolve(Promise.all([consist, slotRow].map((node) => node.animate(travel, opts).finished)));
      }, startsAt);
    });

    return Promise.all([scroll.finished, approach])
      .then(() => new Promise((resolve) => setTimeout(resolve, LOADER.settleMs)));
  }

  function resetDeparture() {
    [consist, slotRow, lane].forEach((node) => {
      node.getAnimations().forEach((a) => a.cancel());
      node.style.transform = '';
    });
    lane.style.backgroundPositionX = '';
    if (fuelLevel) {
      fuelLevel.getAnimations().forEach((a) => a.cancel());
      fuelLevel.style.transform = 'scaleX(1)';
    }
    canvas.classList.remove('is-locked');
    run.disabled = false;
  }

  run.addEventListener('click', () => {
    if (run.disabled) return;

    const built = deck.filter(Boolean);
    const loaded = built.length > 0;
    const correct = loaded
      && built.length === config.answer.length
      && built.every((t, i) => t === config.answer[i]);
    const state = !loaded ? 'incomplete' : correct ? 'correct' : 'wrong';

    logEvent('run', {
      screen: config.id,
      query: built.join(' '),
      crates: built.length,
      correct,
    });

    const action = correct
      ? { label: 'Continue', onContinue: () => go(config.next, { via: 'continue_button' }) }
      : { label: 'Retry', onContinue: resetDeparture };

    if (!loaded) {
      feedback.show(state, messages.incomplete, action);
      return;
    }

    const content = correct ? messages.correct() : messages.wrong(deck);

    canvas.classList.add('is-locked');
    run.disabled = true;
    departure(correct).then(() => feedback.show(state, content, action));
  });

  paint();
  requestAnimationFrame(() => fitCanvas(canvas, design));

  return screen;
}

const renderLoaderRound = (key) => (ctx) => renderLoader(LOADER_ROUNDS[key], ctx);

function renderFinal() {
  const screen = el('div', 'screen');
  screen.appendChild(el('p', 'eyebrow', 'Complete'));
  screen.appendChild(el('h1', 'title', 'Journey complete'));
  screen.appendChild(
    el('p', 'subtitle', 'Thank you for playing the game. Please return to the survey now.')
  );
  return screen;
}

export const SCREENS = {
  start: { id: 'start', ambient: true,  render: renderStart },
  intro: { id: 'intro', ambient: false, render: renderIntro },
  guide: { id: 'guide', ambient: false, render: renderGuide },
  howto1: { id: 'howto1', ambient: false, render: (ctx) => renderModeIntro(MODE_INTROS.howto1, ctx) },
  howto2: { id: 'howto2', ambient: false, render: (ctx) => renderModeIntro(MODE_INTROS.howto2, ctx) },
  howto3: { id: 'howto3', ambient: false, render: (ctx) => renderModeIntro(MODE_INTROS.howto3, ctx) },
  game1a: { id: 'game1a', ambient: false, render: (ctx) => renderRace(RACE_ROUNDS.game1a, ctx) },
  game1b: { id: 'game1b', ambient: false, render: (ctx) => renderRace(RACE_ROUNDS.game1b, ctx) },
  game2a: { id: 'game2a', ambient: false, render: renderLoaderRound('game2a') },
  game2b: { id: 'game2b', ambient: false, render: renderLoaderRound('game2b') },
  game3a: { id: 'game3a', ambient: false, render: renderLoaderRound('game3a') },
  game3b: { id: 'game3b', ambient: false, render: renderLoaderRound('game3b') },
  final: { id: 'final', ambient: true,  render: renderFinal },
};

export const FIRST_SCREEN = 'start';