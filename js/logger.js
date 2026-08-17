import { getParticipant } from './participant.js';

const buffer = [];
const listeners = new Set();

let config = {
  mode: 'console',
  url: null,
  key: null,
  table: 'events',
};

export function configureLogger(next) {
  config = { ...config, ...next };
}

export function onLog(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function logEvent(type, payload = {}) {
  const { id } = getParticipant();

  if (!id) return null;

  const event = {
    participant_id: id,
    type,
    detail: payload,
  };

  buffer.push(event);
  listeners.forEach((fn) => fn(event, buffer.length));

  if (config.mode === 'supabase') send(event);
  else console.log('[log]', event.type, event.participant_id, payload);

  return event;
}

async function send(event) {
  if (!config.url || !config.key) return;
  try {
    await fetch(`${config.url}/rest/v1/${config.table}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',

        apikey: config.key,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(event),
      keepalive: true,
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
  const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function toCSV(rows = buffer) {
  if (!rows.length) return '';
  const cols = columns(rows);
  return [cols.join(','), ...rows.map((r) => cols.map((c) => escapeCell(r[c])).join(','))].join('\n');
}

export function downloadCSV() {
  const csv = toCSV();
  if (!csv) return;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `qot_${getParticipant().id ?? 'unknown'}_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
    e.preventDefault();
    downloadCSV();
  }
});