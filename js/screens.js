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


function renderGame1({ go }) {
  const screen = el('div', 'screen');
  screen.appendChild(el('p', 'eyebrow', 'Round 1'));
  screen.appendChild(el('h2', 'screen-label', 'Game 1'));

  const actions = el('div', 'actions');
  actions.appendChild(button('Back', 'btn--back', () => go('howto', { via: 'back' })));
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


function renderGuide({ go }) {
  const screen = el('div', 'screen');
  screen.appendChild(el('p', 'eyebrow', 'How to play'));
  screen.appendChild(el('h2', 'screen-label', 'Guide'));

  const actions = el('div', 'actions');
  actions.appendChild(button('Next', 'btn--primary', () => go('howto', { via: 'next_button' })));
  actions.appendChild(button('Back', 'btn--back', () => go('start', { via: 'back' })));
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
