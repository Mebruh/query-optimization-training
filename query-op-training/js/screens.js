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
  actions.appendChild(button('Start', 'btn--primary', () => go('game1', { via: 'start_button' })));
  actions.appendChild(button('Guide', 'btn--ghost', () => go('guide', { via: 'guide_button' })));
  screen.appendChild(actions);

  return screen;
}


function renderGame1({ go }) {
  const screen = el('div', 'screen');
  screen.appendChild(el('p', 'eyebrow', 'Round 1'));
  screen.appendChild(el('h2', 'screen-label', 'Game 1'));

  const actions = el('div', 'actions');
  actions.appendChild(button('Back', 'btn--back', () => go('start', { via: 'back' })));
  screen.appendChild(actions);

  return screen;
}


function renderGuide({ go }) {
  const screen = el('div', 'screen');
  screen.appendChild(el('p', 'eyebrow', 'How to play'));
  screen.appendChild(el('h2', 'screen-label', 'Guide'));

  const actions = el('div', 'actions');
  actions.appendChild(button('Back', 'btn--back', () => go('start', { via: 'back' })));
  screen.appendChild(actions);

  return screen;
}


export const SCREENS = {
  start: { id: 'start', ambient: true,  render: renderStart },
  game1: { id: 'game1', ambient: false, render: renderGame1 },
  guide: { id: 'guide', ambient: false, render: renderGuide },
};

export const FIRST_SCREEN = 'start';
