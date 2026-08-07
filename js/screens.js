import { fitCanvas } from './canvas.js';
import { logEvent } from './logger.js';

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
  actions.appendChild(button('Guide', 'btn--ghost', () => go('guide', { via: 'guide_button' })));
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
  lane.appendChild(consist);
  lane.appendChild(el('p', 'query', COMPLETIONS[id]));

  return { lane, pick };
}

function renderFeedback() {
  const overlay = el('div', 'feedback');
  overlay.hidden = true;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  const card = el('div', 'feedback__card');
  const title = el('h3', 'feedback__title');
  card.appendChild(title);
  EXPLANATION.forEach((parts, i) => {
    card.appendChild(para(i === 0 ? 'feedback__lead' : 'feedback__body', parts));
  });

  const close = el('button', 'btn btn--primary feedback__close', 'Continue');
  close.type = 'button';
  close.addEventListener('click', () => {
    overlay.hidden = true;
    logEvent('feedback_dismiss', { screen: 'game1' });
  });
  card.appendChild(close);

  overlay.appendChild(card);

  return {
    overlay,
    show(correct) {
      title.textContent = correct ? FEEDBACK.correct : FEEDBACK.wrong;
      overlay.dataset.result = correct ? 'correct' : 'wrong';
      overlay.hidden = false;
      close.focus();
    },
  };
}

function renderGame1() {
  const screen = el('div', 'screen screen--game');
  screen.appendChild(el('p', 'eyebrow', 'Round 1'));
  screen.appendChild(
    el('h2', 'screen-label', 'Choose the most optimized clause for the following query')
  );
  screen.appendChild(el('p', 'stem', QUERY_STEM));

  const feedback = renderFeedback();
  const picks = [];
  let answered = false;
  const shownAt = performance.now();

  const onPick = (id) => {
    if (answered) return;
    answered = true;

    const correct = id === CORRECT_LANE;
    picks.forEach((btn) => {
      btn.disabled = true;
      if (btn.dataset.lane === id) btn.classList.add('is-picked');
      if (btn.dataset.lane === CORRECT_LANE) btn.classList.add('is-answer');
    });

    logEvent('answer', {
      screen: 'game1',
      chose: id,
      correct,
      response_ms: Math.round(performance.now() - shownAt),
    });

    feedback.show(correct);
  };

  const frame = el('div', 'canvas-frame');
  const canvas = el('div', 'canvas');
  ['a', 'b'].forEach((id, i) => {
    const { lane, pick } = renderLane(id, i === 0 ? 'Train A' : 'Train B', onPick);
    picks.push(pick);
    canvas.appendChild(lane);
  });
  frame.appendChild(canvas);
  screen.appendChild(frame);
  screen.appendChild(feedback.overlay);

  requestAnimationFrame(() => fitCanvas(canvas));

  return screen;
}

export const SCREENS = {
  start: { id: 'start', ambient: true,  render: renderStart },
  guide: { id: 'guide', ambient: false, render: renderGuide },
  howto: { id: 'howto', ambient: false, render: renderHowTo },
  game1: { id: 'game1', ambient: false, render: renderGame1 },
};

export const FIRST_SCREEN = 'start';