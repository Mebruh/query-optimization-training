import { getParticipant } from './participant.js';

const buffer = [];
const listeners = new Set();

let config = {
  mode: 'console',   // 'console' | 'http'
  endpoint: null,    // '/api/log/' for Django
  headers: {},       // { 'X-CSRFToken': token }
};

export function configureLogger(next) {
  config = { ...config, ...next };
}

export function onLog(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function logEvent(type, payload = {}) {
  const { id, source } = getParticipant();

  const event = {
    participant_id: id,
    pid_source: source,
    type,
    ...payload,
    session_ms: Math.round(performance.now()),
    client_time: new Date().toISOString(),
  };

  buffer.push(event);
  listeners.forEach((fn) => fn(event, buffer.length));

  if (config.mode === 'console') {
    console.log('[log]', event);
  } else {
    send(event);
  }

  return event;
}

async function send(event) {
  if (!config.endpoint) return;
  try {
    await fetch(config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...config.headers },
      body: JSON.stringify(event),
    });
  } catch (err) {
    console.warn('[log] send failed, buffered only', err);
  }
}

export function getBuffer() {
  return [...buffer];
}

function columns(rows) {
  const seen = new Set();
  rows.forEach((row) => Object.keys(row).forEach((k) => seen.add(k)));
  return [...seen];
}

function escapeCell(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function toCSV(rows = buffer) {
  if (!rows.length) return '';
  const cols = columns(rows);
  const lines = [cols.join(',')];
  rows.forEach((row) => {
    lines.push(cols.map((c) => escapeCell(row[c])).join(','));
  });
  return lines.join('\n');
}

export function downloadCSV() {
  const csv = toCSV();
  if (!csv) {
    console.warn('[log] nothing to export yet');
    return;
  }
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `qot_${getParticipant().id}_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
    e.preventDefault();
    downloadCSV();
  }
});
