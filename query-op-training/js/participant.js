const PARAM_KEYS = ['pid', 'participant', 'rid', 'ResponseID'];
const STORAGE_KEY = 'qot.pid';
const SOURCE_KEY = 'qot.pid_source';

function makeFallbackId() {
  const rand = (crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2))
    .replace(/-/g, '')
    .slice(0, 8);
  return `anon_${rand}`;
}

function readFromUrl() {
  const params = new URLSearchParams(window.location.search);
  for (const key of PARAM_KEYS) {
    const value = params.get(key);
    if (value && value.trim()) return value.trim().slice(0, 64);
  }
  return null;
}

let cached = null;

export function getParticipant() {
  if (cached) return cached;

  const fromUrl = readFromUrl();
  const stored = sessionStorage.getItem(STORAGE_KEY);

  let id, source;
  if (fromUrl) {
    id = fromUrl;
    source = 'url';
  } else if (stored) {
    id = stored;
    source = sessionStorage.getItem(SOURCE_KEY) || 'session';
  } else {
    id = makeFallbackId();
    source = 'generated';
  }

  sessionStorage.setItem(STORAGE_KEY, id);
  sessionStorage.setItem(SOURCE_KEY, source);


  cached = { id, source };
  return cached;
}

export function getParticipantId() {
  return getParticipant().id;
}
