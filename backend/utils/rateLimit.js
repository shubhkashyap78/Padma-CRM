// Tiny in-memory limiter for login attempts (good enough for a single-server CRM).
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 8;

export const isBlocked = (key) => {
  const rec = attempts.get(key);
  if (!rec) return false;
  if (Date.now() - rec.first > WINDOW_MS) {
    attempts.delete(key);
    return false;
  }
  return rec.count >= MAX_FAILS;
};

export const recordFail = (key) => {
  const rec = attempts.get(key);
  if (!rec || Date.now() - rec.first > WINDOW_MS) {
    attempts.set(key, { count: 1, first: Date.now() });
  } else {
    rec.count += 1;
  }
};

export const clearFails = (key) => attempts.delete(key);
