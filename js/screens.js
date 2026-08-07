import { fitCanvas } from './canvas.js';
import { logEvent } from './logger.js';
import { makeDraggable } from './drag.js';

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

  screen.appendChild(el('p', 'eyebrow', 'Session 01'));
  screen.appendChild(el('h1', 'title', 'Query Optimization TRAINing'));
  screen.appendChild(
    el('p', 'subtitle', 'Read the plan, spot the cost, pick the faster path. Around ten minutes.')
  );

  const actions = el('div', 'actions');
  actions.appendChild(button('Start', 'btn--primary', () => go('guide', { via: 'start_button' })));
  screen.appendChild(actions);

  return screen;
}

function renderGuide({ go }) {
  const screen = el('div', 'screen');
  screen.appendChild(el('p', 'eyebrow', 'What this is'));
  screen.appendChild(el('h2', 'screen-label', 'Guide'));

  const actions = el('div', 'actions');
  actions.appendChild(button('Next', 'btn--primary', () => go('howto', { via: 'next_button' })));
  actions.appendChild(button('Back', 'btn--back', () => go('start', { via: 'back' })));
  screen.appendChild(actions);

  return screen;
}

function renderHowTo({ go }) {
  const screen = el('div', 'screen');
  screen.appendChild(el('p', 'eyebrow', 'Before you begin'));
  screen.appendChild(el('h2', 'screen-label', 'How to Play'));

  const actions = el('div', 'actions');
  actions.appendChild(button('Start game', 'btn--primary', () => go('game1', { via: 'start_game_button' })));
  actions.appendChild(button('Back', 'btn--back', () => go('guide', { via: 'back' })));
  screen.appendChild(actions);

  return screen;
}

const CARS_PER_TRAIN = 2;
const CRATES_PER_CAR = 3;

const QUERY_STEM = 'SELECT * FROM products ...';

const COMPLETIONS = {
  a: 'WHERE order_date >= "2020-01-01"',
  b: 'WHERE YEAR(order_date) >= "2020"',
};

const CORRECT_LANE = 'a';

const RACE = {
  distance: 636,
  fastMs: 2600,
  slowMs: 4100,
  settleMs: 500,
  easing: 'cubic-bezier(0.35, 0, 0.35, 1)',
};

const FEEDBACK = {
  correct: 'Congratulations!',
  wrong: 'Unfortunately, that is not right.',
};

const EXPLANATION = [
  ['Train A is the more optimized query.'],
  [
    'Train A compares ', { code: 'order_date' },
    ' directly, so the database can use an index on that column and jump straight to the matching rows.',
  ],
  [
    'Train B wraps the column in ', { code: 'YEAR()' },
    '. That function has to be evaluated for every row before the condition can be tested, so the index cannot be used and the database falls back to scanning the entire table.',
  ],
  [
    'A condition an index can work with is called ', { code: 'sargable' },
    '. Keep the column bare on one side of the comparison.',
  ],
];

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

function renderLane(id, label, onPick) {
  const lane = el('div', 'lane');
  lane.dataset.lane = id;

  lane.style.setProperty('--car-count', CARS_PER_TRAIN);

  const pick = el('button', 'lane__pick', label);
  pick.type = 'button';
  pick.dataset.lane = id;
  pick.setAttribute('aria-label', `Choose ${label}: ${COMPLETIONS[id]}`);
  pick.addEventListener('click', () => onPick(id));
  lane.appendChild(pick);
  lane.appendChild(sprite('shed', 'assets/images/ElectricalShed.png', { optional: true }));

  const consist = el('div', 'consist');
  for (let i = 0; i < CARS_PER_TRAIN; i++) consist.appendChild(renderCar());
  consist.appendChild(sprite('loco', 'assets/images/Train.png'));
  consist.appendChild(el('p', 'query', COMPLETIONS[id]));
  lane.appendChild(consist);

  return { lane, pick, consist };
}

function runRace(consists) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    Object.values(consists).forEach((node) => {
      node.style.transform = `translateX(${RACE.distance}px)`;
    });
    return Promise.resolve();
  }

  const running = Object.entries(consists).map(([id, node]) => {
    const duration = id === CORRECT_LANE ? RACE.fastMs : RACE.slowMs;
    return node.animate(
      [{ transform: 'translateX(0)' }, { transform: `translateX(${RACE.distance}px)` }],
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

      title.textContent = content
        ? content.title
        : result === 'correct' ? FEEDBACK.correct : FEEDBACK.wrong;

      text.replaceChildren();
      (content ? content.body : EXPLANATION).forEach((parts, i) => {
        text.appendChild(para(i === 0 ? 'feedback__lead' : 'feedback__body', parts));
      });

      overlay.dataset.result = result;
      overlay.hidden = false;
      close.focus();
    },
  };
}

function renderGame1({ go }) {
  const screen = el('div', 'screen screen--game');
  screen.appendChild(el('p', 'eyebrow', 'Round 1'));
  screen.appendChild(
    el('h2', 'screen-label', 'Choose the most optimized clause for the following query')
  );
  screen.appendChild(el('p', 'stem', QUERY_STEM));

  const feedback = renderFeedback({ onContinue: () => go('game2', { via: 'continue_button' }) });
  const picks = [];
  const consists = {};
  let answered = false;
  const shownAt = performance.now();

  const onPick = (id) => {
    if (answered) return;
    answered = true;

    const correct = id === CORRECT_LANE;
    picks.forEach((btn) => { btn.disabled = true; });

    logEvent('answer', {
      screen: 'game1',
      chose: id,
      correct,
      response_ms: Math.round(performance.now() - shownAt),
    });

    logEvent('race_start', { screen: 'game1' });
    runRace(consists).then(() => {
      picks.forEach((btn) => {
        if (btn.dataset.lane === id) btn.classList.add('is-picked');
        if (btn.dataset.lane === CORRECT_LANE) btn.classList.add('is-answer');
      });
      logEvent('race_end', { screen: 'game1' });
      feedback.show(correct ? 'correct' : 'wrong');
    });
  };

  const frame = el('div', 'canvas-frame');
  const canvas = el('div', 'canvas');
  ['a', 'b'].forEach((id, i) => {
    const { lane, pick, consist } = renderLane(id, i === 0 ? 'Train A' : 'Train B', onPick);
    picks.push(pick);
    consists[id] = consist;
    canvas.appendChild(lane);
  });
  frame.appendChild(canvas);
  screen.appendChild(frame);
  screen.appendChild(feedback.overlay);

  requestAnimationFrame(() => fitCanvas(canvas));

  return screen;
}

const GAME2 = {
  prompt: 'Swap out the heavy crates to make a better optimized query and save fuel',
  scene: { width: 1440, height: 470 },
  cars: 4,
  deck: ['SELECT', '*', 'FROM', 'orders', 'WHERE', 'YEAR(order_date)', '>', '"2020"'],
  tray: ['order_date', '"2020-01-01"', 'order_no'],
  answer: ['SELECT', 'order_no', 'FROM', 'orders', 'WHERE', 'order_date', '>', '"2020-01-01"'],
};

const RUN2 = {
  scrollPx: 2960,
  scrollMs: 2800,
  approachPx: 172,
  approachMs: 1100,
  overlapMs: 650,
  settleMs: 400,
  fuelCorrect: 0.62,
  fuelWrong: 0.08,
  scrollEasing: 'cubic-bezier(0.35, 0, 0.35, 1)',
  approachEasing: 'cubic-bezier(0.3, 0, 0.4, 1)',
};

const OPTIMAL = 'SELECT order_no FROM orders WHERE order_date > "2020-01-01"';

const GAME2_FEEDBACK = {
  incomplete: {
    title: 'The train is not loaded.',
    body: [
      ['Every slot needs a crate before the train can run.'],
    ],
  },
  wrong: {
    title: 'Unfortunately, that is not right.',
    body: [
      ['The optimized query is ', { code: OPTIMAL }, '.'],
      [
        'Selecting only ', { code: 'order_no' },
        ' means the database reads one column instead of every column in the table, so there is far less data to move.',
      ],
      [
        'Comparing ', { code: 'order_date' },
        ' directly lets an index on that column do the work. Wrapping it in ', { code: 'YEAR()' },
        ' forces the database to compute that function for every row, so it has to scan the whole table.',
      ],
      ['That is why your train burned so much fuel.'],
    ],
  },
  correct: {
    title: 'Congratulations!',
    body: [
      ['The train is carrying ', { code: OPTIMAL }, '.'],
      [
        'Selecting only ', { code: 'order_no' },
        ' means the database reads one column instead of every column in the table, so there is far less data to move.',
      ],
      [
        'Comparing ', { code: 'order_date' },
        ' directly lets an index on that column do the work, instead of computing ', { code: 'YEAR()' },
        ' for every row and scanning the whole table.',
      ],
      ['Less work for the database means the query is more efficient which means less fuel is used for the train.'],
    ],
  },
};

function renderBareCar() {
  const car = el('div', 'car');
  car.appendChild(sprite('car__bed', 'assets/images/TrailFlatbed03.png'));
  return car;
}

function renderGame2({ go }) {
  const screen = el('div', 'screen screen--game');
  screen.appendChild(el('p', 'eyebrow', 'Round 2'));
  screen.appendChild(el('h2', 'screen-label', GAME2.prompt));

  const deck = [...GAME2.deck];
  const tray = [...GAME2.tray];

  const frame = el('div', 'canvas-frame');
  const canvas = el('div', 'canvas canvas--yard');

  const lane = el('div', 'lane');
  lane.appendChild(sprite('shed', 'assets/images/ElectricalShed.png', { optional: true }));
  const consist = el('div', 'consist');
  for (let i = 0; i < GAME2.cars; i++) consist.appendChild(renderBareCar());
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

  const fuel = el('div', 'fuel');
  fuel.appendChild(el('p', 'fuel__label', 'Fuel'));
  const fuelTrack = el('div', 'fuel__track');
  const fuelLevel = el('div', 'fuel__level');
  fuelTrack.appendChild(fuelLevel);
  fuel.appendChild(fuelTrack);
  canvas.appendChild(fuel);

  const trayBox = el('div', 'tray');
  trayBox.appendChild(el('p', 'tray__label', 'SQL terms to choose from'));
  const trayRow = el('div', 'tray__row');
  trayBox.appendChild(trayRow);
  canvas.appendChild(trayBox);

  frame.appendChild(canvas);
  screen.appendChild(frame);

  const feedback = renderFeedback({ label: 'Retry' });
  screen.appendChild(feedback.overlay);

  const runRow = el('div', 'actions actions--run');
  const run = el('button', 'btn btn--primary', 'Run query and start train');
  run.type = 'button';
  runRow.appendChild(run);
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
          screen: 'game2',
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
    tray.forEach((token, i) => {
      trayRow.appendChild(makeToken(token, { type: 'tray', index: i }));
    });
  }

  function departure(correct) {
    const target = correct ? RUN2.fuelCorrect : RUN2.fuelWrong;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      fuelLevel.style.transform = `scaleX(${target})`;
      [consist, slotRow].forEach((node) => {
        node.style.transform = `translateX(${RUN2.approachPx}px)`;
      });
      return Promise.resolve();
    }

    const startsAt = Math.max(0, RUN2.scrollMs - RUN2.overlapMs);
    const totalMs = startsAt + RUN2.approachMs;

    fuelLevel.animate(
      [{ transform: 'scaleX(1)' }, { transform: `scaleX(${target})` }],
      { duration: totalMs, easing: 'linear', fill: 'forwards' }
    );

    const scroll = lane.animate(
      [{ backgroundPositionX: '0px' }, { backgroundPositionX: `${-RUN2.scrollPx}px` }],
      { duration: RUN2.scrollMs, easing: RUN2.scrollEasing, fill: 'forwards' }
    );

    const approach = new Promise((resolve) => {
      setTimeout(() => {
        const travel = [{ transform: 'translateX(0)' },
                        { transform: `translateX(${RUN2.approachPx}px)` }];
        const opts = { duration: RUN2.approachMs, easing: RUN2.approachEasing, fill: 'forwards' };
        resolve(Promise.all([consist, slotRow].map((node) => node.animate(travel, opts).finished)));
      }, startsAt);
    });

    return Promise.all([scroll.finished, approach])
      .then(() => new Promise((resolve) => setTimeout(resolve, RUN2.settleMs)));
  }

  function resetDeparture() {
    [consist, slotRow, fuelLevel, lane].forEach((node) => {
      node.getAnimations().forEach((a) => a.cancel());
      node.style.transform = '';
    });
    fuelLevel.style.transform = 'scaleX(1)';
    lane.style.backgroundPositionX = '';
    canvas.classList.remove('is-locked');
    run.disabled = false;
  }

  run.addEventListener('click', () => {
    if (run.disabled) return;

    const complete = deck.every(Boolean);
    const correct = complete && deck.every((t, i) => t === GAME2.answer[i]);
    const state = !complete ? 'incomplete' : correct ? 'correct' : 'wrong';

    logEvent('run', {
      screen: 'game2',
      query: deck.map((t) => t ?? '_').join(' '),
      complete,
      correct,
    });

    const action = correct
      ? { label: 'Continue', onContinue: () => go('game3', { via: 'continue_button' }) }
      : { label: 'Retry', onContinue: resetDeparture };

    if (!complete) {
      feedback.show(state, GAME2_FEEDBACK[state], action);
      return;
    }

    canvas.classList.add('is-locked');
    run.disabled = true;
    departure(correct).then(() => feedback.show(state, GAME2_FEEDBACK[state], action));
  });

  paint();
  requestAnimationFrame(() => fitCanvas(canvas, GAME2.scene));

  return screen;
}

function renderGame3() {
  const screen = el('div', 'screen');
  screen.appendChild(el('p', 'eyebrow', 'Round 3'));
  screen.appendChild(el('h2', 'screen-label', 'Game 3'));
  return screen;
}

export const SCREENS = {
  start: { id: 'start', ambient: true,  render: renderStart },
  guide: { id: 'guide', ambient: false, render: renderGuide },
  howto: { id: 'howto', ambient: false, render: renderHowTo },
  game1: { id: 'game1', ambient: false, render: renderGame1 },
  game2: { id: 'game2', ambient: false, render: renderGame2 },
  game3: { id: 'game3', ambient: false, render: renderGame3 },
};

export const FIRST_SCREEN = 'start';