const STORAGE_KEY = 'qot.pid';
const SOURCE_KEY = 'qot.pid_source';
let cached = null;

export function getParticipant() {
  if (cached) return cached;

  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (stored) {
    cached = { id: stored, source: sessionStorage.getItem(SOURCE_KEY) || 'session' };
    return cached;
  }

  return { id: null, source: 'none' };
}

export function setParticipant(id, source = 'entered') {
  const clean = String(id).trim().slice(0, 64);
  sessionStorage.setItem(STORAGE_KEY, clean);
  sessionStorage.setItem(SOURCE_KEY, source);
  cached = { id: clean, source };
  return cached;
}