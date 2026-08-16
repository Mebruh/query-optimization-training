const SPRITES = {
  train:   { src: 'assets/images/Train.png', width: 120 },
  flatbed: { src: 'assets/images/TrailFlatbed03.png', width: 112 },
  crate:   { src: 'assets/images/CrateBig.png', width: 38 },
};

const SEQUENCE = ['crate', 'train', 'crate', 'flatbed', 'crate', 'flatbed'];

const rand = (min, max) => min + Math.random() * (max - min);

function makeFragment(index) {
  const kind = SPRITES[SEQUENCE[index % SEQUENCE.length]];

  const el = new Image();
  el.className = 'frag';
  el.src = kind.src;
  el.alt = '';
  el.draggable = false;
  el.style.width = `${kind.width * rand(0.82, 1.18)}px`;

  const fromLeft = Math.random() > 0.5;
  const x0 = fromLeft ? rand(-15, 5) : rand(95, 115);
  const x1 = fromLeft ? rand(95, 115) : rand(-15, 5);

  const topBand = Math.random() > 0.5;
  const y = () => (topBand ? rand(-6, 25) : rand(75, 104));

  el.style.setProperty('--x0', `${x0}vw`);
  el.style.setProperty('--x1', `${x1}vw`);
  el.style.setProperty('--y0', `${y()}vh`);
  el.style.setProperty('--y1', `${y()}vh`);
  el.style.setProperty('--r0', `${rand(-6, 6)}deg`);
  el.style.setProperty('--r1', `${rand(-6, 6)}deg`);

  el.style.animationDuration = `${rand(38, 72)}s`;
  el.style.animationDelay = `${-rand(0, 60)}s`;

  return el;
}

let mounted = false;

export function startAmbient(container, count = 16) {
  if (mounted) return;
  mounted = true;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const narrow = window.innerWidth < 640;
  const total = reduced ? 6 : narrow ? 9 : count;

  const frag = document.createDocumentFragment();
  for (let i = 0; i < total; i++) frag.appendChild(makeFragment(i));
  container.appendChild(frag);
}

export function stopAmbient(container) {
  container.innerHTML = '';
  mounted = false;
}
