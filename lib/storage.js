'use client';
// Riwayat tonton ("Lanjutkan Menonton") & pengingat rilis — disimpan di localStorage.
const HISTORY_KEY = 'lz_watch_history';
const REMIND_KEY = 'lz_release_reminders';
const SEARCH_KEY = 'lz_search_history';

function read(key) {
  try {
    const v = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
function write(key, v) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {}
}

export function getHistory() {
  return read(HISTORY_KEY);
}
export function addHistory(m, ep) {
  const list = read(HISTORY_KEY).filter((x) => x.slug !== m.slug);
  list.unshift({
    slug: m.slug,
    title: m.title,
    poster: m.poster || null,
    year: m.year || null,
    type: m.type,
    season: ep?.season,
    episode: ep?.episode,
    at: Date.now(),
  });
  write(HISTORY_KEY, list.slice(0, 20));
}
export function removeHistory(slug) {
  write(HISTORY_KEY, read(HISTORY_KEY).filter((x) => x.slug !== slug));
}

export function isReminded(slug) {
  return read(REMIND_KEY).some((x) => x.slug === slug);
}
export function removeReminder(slug) {
  write(REMIND_KEY, read(REMIND_KEY).filter((x) => x.slug !== slug));
}
export async function addReminder(item) {
  const list = read(REMIND_KEY).filter((x) => x.slug !== item.slug);
  list.push(item);
  write(REMIND_KEY, list);
  if (!('Notification' in window)) return 'unsupported';
  try {
    let p = Notification.permission;
    if (p === 'default') p = await Notification.requestPermission();
    return p;
  } catch {
    return Notification.permission;
  }
}
export async function checkReminders(siteName) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const list = read(REMIND_KEY);
  const today = new Date().toISOString().slice(0, 10);
  let changed = false;
  for (const r of list) {
    if (!r.notifiedAt && r.releaseDate && !(r.releaseDate > today)) {
      try {
        new Notification(siteName, { body: `${r.title} sudah tayang sekarang — yuk nonton!`, icon: '/logo.png' });
        r.notifiedAt = Date.now();
        changed = true;
      } catch {}
    }
  }
  if (changed) write(REMIND_KEY, list);
}

export function getSearchHistory() {
  return read(SEARCH_KEY);
}
export function pushSearchHistory(q) {
  const list = read(SEARCH_KEY).filter((x) => x.toLowerCase() !== q.toLowerCase());
  write(SEARCH_KEY, [q, ...list].slice(0, 8));
}
export function removeSearchHistory(q) {
  write(SEARCH_KEY, read(SEARCH_KEY).filter((x) => x !== q));
}
export function clearSearchHistory() {
  try {
    localStorage.removeItem(SEARCH_KEY);
  } catch {}
}

export function vibrate() {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(15);
  } catch {}
}
