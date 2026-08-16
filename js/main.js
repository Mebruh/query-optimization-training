import { SCREENS, FIRST_SCREEN } from './screens.js';
import { logEvent, onLog, downloadCSV } from './logger.js';
import { getParticipant } from './participant.js';
import { preloadImages, waitForFonts } from './preload.js';
import { startAmbient } from './ambient.js';

const stage = document.getElementById('stage');
const ambient = document.getElementById('ambient');
const boot = document.getElementById('boot');

let current = null;
let enteredAt = null;

function mount(id, meta = {}) {
  const def = SCREENS[id];
  if (!def) {
    console.error(`[nav] unknown screen: ${id}`);
    return;
  }

  const node = def.render({ go, id });
  node.classList.add('is-entering');
  stage.replaceChildren(node);

  ambient.style.opacity = def.ambient ? '1' : '0';
  ambient.style.transition = 'opacity 400ms ease';

  current = id;
  enteredAt = null;

  const begin = () => {
    enteredAt = performance.now();
    node.classList.remove('is-entering');
    logEvent('stage', { screen: id });
    updateDev();
  };

  let started = false;
  const once = () => { if (!started) { started = true; begin(); } };
  node.addEventListener('animationend', once, { once: true });
  setTimeout(once, 600);
}

export function go(id, meta = {}) {
  if (id === current) return;

  const outgoing = stage.firstElementChild;
  if (!outgoing) {
    mount(id, meta);
    return;
  }

  outgoing.classList.add('is-leaving');
  let swapped = false;
  const swap = () => { if (!swapped) { swapped = true; mount(id, meta); } };
  outgoing.addEventListener('animationend', swap, { once: true });
  setTimeout(swap, 400);
}

const devbar = document.getElementById('devbar');
const devPid = document.getElementById('devPid');
const devScreen = document.getElementById('devScreen');
const devCount = document.getElementById('devCount');

function updateDev() {
  if (devbar.hidden) return;
  const { id, source } = getParticipant();
  devPid.textContent = `pid: ${id} (${source})`;
  devScreen.textContent = `screen: ${current ?? '—'}`;
}

function initDev() {
  const on = new URLSearchParams(location.search).get('dev') === '1';
  if (!on) return;
  devbar.hidden = false;
  document.getElementById('devExport').addEventListener('click', downloadCSV);
  onLog((_, count) => { devCount.textContent = `events: ${count}`; });
  updateDev();
}

async function init() {
  initDev();

  await Promise.all([preloadImages(), waitForFonts()]);

  boot.classList.add('is-done');
  setTimeout(() => boot.remove(), 320);

  startAmbient(ambient);

  const { id } = getParticipant();
  console.info(`[qot] participant ${id ?? '(not yet entered)'} — Ctrl/Cmd+Shift+D for CSV`);

  mount(FIRST_SCREEN, { via: 'load' });
}

init();