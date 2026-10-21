/**
 * Sumber data LukyyZone:
 *   1) moviezone.js (engine utama, Server 7 VidFast)
 *   2) Cinemeta (cadangan otomatis, tanpa API key) bila engine utama gagal/403
 * Format output keduanya sama, jadi UI tidak perlu tahu sumbernya.
 */
const mz = require('./moviezone');
const cm = require('./cinemeta');

const g = globalThis;
g.__lzSrc = g.__lzSrc || { mzBlockedUntil: 0 };
const state = g.__lzSrc;
const COOLDOWN = 10 * 60 * 1000; // setelah gagal, langsung pakai cadangan selama 10 menit
const MZ_TIMEOUT = 8000;
const FORCE = (process.env.LZ_SOURCE || 'auto').toLowerCase(); // auto | moviezone | cinemeta

function withTimeout(p, ms) {
  return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
}

async function pick(name, args, { mzOk = true } = {}) {
  const useMz = FORCE !== 'cinemeta' && mzOk && (FORCE === 'moviezone' || Date.now() > state.mzBlockedUntil);
  if (useMz) {
    try {
      const r = await withTimeout(mz[name](...args), MZ_TIMEOUT);
      const empty = Array.isArray(r?.results) && r.results.length === 0 && name !== 'searchMovies';
      if (!empty) return { ...r, source: 'moviezone' };
    } catch (e) {
      if (FORCE === 'moviezone') throw e;
      state.mzBlockedUntil = Date.now() + COOLDOWN;
    }
  }
  const r = await cm[name](...args);
  return { ...r, source: 'cinemeta' };
}

const isImdbSlug = (slug) => /^(movie|tv)-tt\d+$/.test(String(slug));

module.exports = {
  searchMovies: (q, page) => pick('searchMovies', [q, page]),
  getTrending: () => pick('getTrending', []),
  getHero: () => pick('getHero', []),
  getPopular: (t, p) => pick('getPopular', [t, p]),
  getTopRated: (t, p) => pick('getTopRated', [t, p]),
  getLatest: (t, p) => pick('getLatest', [t, p]),
  getUpcoming: () => pick('getUpcoming', []),
  getGenres: () => pick('getGenres', []),
  discover: (o) => pick('discover', [o]),
  // slug "movie-tt…" berasal dari Cinemeta; slug angka (TMDB) berasal dari moviezone
  getMovieDetail: (slug) => pick('getMovieDetail', [slug], { mzOk: !isImdbSlug(slug) }),
  getSeriesEpisodes: (slug, s) => pick('getSeriesEpisodes', [slug, s], { mzOk: !isImdbSlug(slug) }),
};
