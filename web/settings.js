'use strict';
const OPTIONS = { volume: 65, sensitivity: 100, reducedMotion: false };
try {
  const saved = JSON.parse(localStorage.getItem('nosferatu.settings') || '{}');
  for (const key of ['volume', 'sensitivity']) {
    if (Number.isFinite(saved[key])) OPTIONS[key] = Math.max(key === 'volume' ? 0 : 25, Math.min(key === 'volume' ? 100 : 200, saved[key]));
  }
  OPTIONS.reducedMotion = saved.reducedMotion === true;
} catch (_) { /* Storage can be unavailable in private windows. */ }
function saveOptions() {
  try { localStorage.setItem('nosferatu.settings', JSON.stringify(OPTIONS)); } catch (_) { }
}
