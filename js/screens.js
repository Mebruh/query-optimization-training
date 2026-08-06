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
 
const CRATES_PER_CAR = 3;
 
function renderLane(id, label) {
  const lane = document.createElement('div');
  lane.className = 'lane';
  lane.dataset.lane = id;
 
  const tag = el('span', 'lane__tag', label);
  lane.appendChild(tag);
 
  const consist = el('div', 'consist');
 
  const car = el('div', 'car');
  const cargo = el('div', 'car__cargo');
  for (let i = 0; i < CRATES_PER_CAR; i++) {
    const crate = new Image();
    crate.className = 'crate';
    crate.src = 'assets/images/CrateBig.png';
    crate.alt = '';
    crate.draggable = false;
    cargo.appendChild(crate);
  }
 
  const bed = new Image();
  bed.className = 'car__bed';
  bed.src = 'assets/images/TrailFlatbed03.png';
  bed.alt = '';
  bed.draggable = false;
 
  car.appendChild(bed);
  car.appendChild(cargo);
 
  const loco = new Image();
  loco.className = 'loco';
  loco.src = 'assets/images/Train.png';
  loco.alt = '';
  loco.draggable = false;
 
  consist.appendChild(car);
  consist.appendChild(loco);
  lane.appendChild(consist);
 
  lane.setAttribute('role', 'img');
  lane.setAttribute('aria-label', `${label}: a locomotive hauling a flatbed of ${CRATES_PER_CAR} crates.`);
 
  return lane;
}
 
function renderGame1({ go }) {
  const screen = el('div', 'screen screen--game');
  screen.appendChild(el('p', 'eyebrow', 'Round 1'));
  screen.appendChild(el('h2', 'screen-label', 'Game 1'));
 
  const lanes = el('div', 'lanes');
  lanes.appendChild(renderLane('a', 'Train A'));
  lanes.appendChild(renderLane('b', 'Train B'));
  screen.appendChild(lanes);
 
  const actions = el('div', 'actions');
  actions.appendChild(button('Back', 'btn--back', () => go('howto', { via: 'back' })));
  screen.appendChild(actions);
 
  return screen;
}
  
export const SCREENS = {
  start: { id: 'start', ambient: true,  render: renderStart },
  guide: { id: 'guide', ambient: false, render: renderGuide },
  howto: { id: 'howto', ambient: false, render: renderHowTo },
  game1: { id: 'game1', ambient: false, render: renderGame1 },
};
 
export const FIRST_SCREEN = 'start';
