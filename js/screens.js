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

function renderLane(id, label) {
  const lane = el('div', 'lane');
  lane.dataset.lane = id;
  lane.style.setProperty('--car-count', CARS_PER_TRAIN);

  lane.appendChild(el('span', 'lane__tag', label));
  lane.appendChild(sprite('shed', 'assets/images/ElectricalShed.png', { optional: true }));

  const consist = el('div', 'consist');
  for (let i = 0; i < CARS_PER_TRAIN; i++) consist.appendChild(renderCar());
  consist.appendChild(sprite('loco', 'assets/images/Train.png'));
  lane.appendChild(consist);
  lane.appendChild(el('p', 'query', COMPLETIONS[id]));

  lane.setAttribute('role', 'img');
  lane.setAttribute(
    'aria-label',
    `${label}, carrying the completion: ${COMPLETIONS[id]}`
  );

  return lane;
}

function renderGame1() {
  const screen = el('div', 'screen screen--game');
  screen.appendChild(el('p', 'eyebrow', 'Round 1'));
  screen.appendChild(
    el('h2', 'screen-label', 'Choose the most optimized clause of the following query')
  );
  screen.appendChild(el('p', 'stem', QUERY_STEM));

  const lanes = el('div', 'lanes');
  lanes.appendChild(renderLane('a', 'Train A'));
  lanes.appendChild(renderLane('b', 'Train B'));
  screen.appendChild(lanes);

  return screen;
}

export const SCREENS = {
  start: { id: 'start', ambient: true,  render: renderStart },
  guide: { id: 'guide', ambient: false, render: renderGuide },
  howto: { id: 'howto', ambient: false, render: renderHowTo },
  game1: { id: 'game1', ambient: false, render: renderGame1 },
};

export const FIRST_SCREEN = 'start';