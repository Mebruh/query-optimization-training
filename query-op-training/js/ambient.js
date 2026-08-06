const CHIPS = [
  'SELECT', 'JOIN', 'WHERE', 'GROUP BY', 'INDEX SCAN',
  'HASH JOIN', 'SEQ SCAN', 'LIMIT', 'EXPLAIN', 'cost=0.42',
  'rows=1204', 'ORDER BY', 'NESTED LOOP', 'B-TREE',
];

const GLYPHS = {
  table: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
    <rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M3 9h18M3 14.5h18M9 9v11"/></svg>`,
  index: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
    <circle cx="12" cy="4.5" r="2"/><circle cx="6" cy="19.5" r="2"/><circle cx="18" cy="19.5" r="2"/>
    <path d="M12 6.5v5m0 0L6.8 17.6M12 11.5l5.2 6.1"/></svg>`,
  filter: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
    <path d="M4 5h16l-6.2 7.4V20l-3.6-2.2v-5.4z"/></svg>`,
  key: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
    <circle cx="8" cy="12" r="3.6"/><path d="M11.6 12H21m-3 0v3m-3-3v2.2"/></svg>`,
  disk: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
    <ellipse cx="12" cy="6.5" rx="8" ry="3"/><path d="M4 6.5v11c0 1.7 3.6 3 8 3s8-1.3 8-3v-11"/>
    <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></svg>`,
  sort: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
    <path d="M7 4v16m0 0l-3-3.4M7 20l3-3.4M17 20V4m0 0l-3 3.4M17 4l3 3.4"/></svg>`,
  clock: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
    <circle cx="12" cy="12" r="8.5"/><path d="M12 7v5.3l3.4 2"/></svg>`,
  rows: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
    <path d="M4 6.5h16M4 12h16M4 17.5h10"/></svg>`,
};

const GLYPH_KEYS = Object.keys(GLYPHS);

const rand = (min, max) => min + Math.random() * (max - min);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function makeFragment(index) {
  const el = document.createElement('div');

  // Roughly one chip for every glyph, alternating so neither dominates.
  if (index % 2 === 0) {
    el.className = 'frag frag--chip';
    el.textContent = pick(CHIPS);
  } else {
    el.className = 'frag frag--glyph';
    el.innerHTML = GLYPHS[pick(GLYPH_KEYS)];
  }

  const fromLeft = Math.random() > 0.5;
  const x0 = fromLeft ? rand(-15, 5) : rand(95, 115);
  const x1 = fromLeft ? rand(95, 115) : rand(-15, 5);


  const topBand = index % 2 === 0;
  const y = () => (topBand ? rand(-6, 25) : rand(75, 104));

  el.style.setProperty('--x0', `${x0}vw`);
  el.style.setProperty('--x1', `${x1}vw`);
  el.style.setProperty('--y0', `${y()}vh`);
  el.style.setProperty('--y1', `${y()}vh`);
  el.style.setProperty('--r0', `${rand(-8, 8)}deg`);
  el.style.setProperty('--r1', `${rand(-8, 8)}deg`);

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
