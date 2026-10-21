/**
 * Cinemeta (v3-cinemeta.strem.io) — katalog film & series publik, TANPA API key.
 * Dipakai LukyyZone sebagai sumber cadangan saat moviezone.js gagal (403).
 * Output dibuat SAMA PERSIS dengan format moviezone.js, termasuk `stream`
 * Server 7 (VidFast).
 */
const axios = require('axios');

const BASE = 'https://v3-cinemeta.strem.io';
const IMG = 'https://images.metahub.space';
const PER_PAGE = 50;
const http = axios.create({ timeout: 12000, headers: { 'User-Agent': 'LukyyZone/1.0' } });

// ID genre TMDB (dipakai UI) → nama genre Cinemeta
const GENRE_MAP = {
  28: 'Action', 10759: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 10762: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10765: 'Sci-Fi', 53: 'Thriller',
  10752: 'War', 10768: 'War', 37: 'Western', 10402: 'Biography', 10764: 'Reality-TV',
  10767: 'Talk-Show', 10763: 'Documentary', 10766: 'Drama',
};
const GENRE_ID = {
  Action: 28, Adventure: 12, Animation: 16, Comedy: 35, Crime: 80, Documentary: 99, Drama: 18,
  Family: 10751, Fantasy: 14, History: 36, Horror: 27, Mystery: 9648, Romance: 10749,
  'Sci-Fi': 878, Thriller: 53, War: 10752, Western: 37,
};
const GENRE_ID_LABEL = { Animation: 'Animasi' };

const cmType = (t) => (t === 'tv' || t === 'series' || t === 'Series' ? 'series' : 'movie');

// ---------- helpers ----------
function vidfastUrl(type, id, season = 1, episode = 1) {
  return type === 'series'
    ? `https://vidfast.vc/tv/${id}/${season}/${episode}`
    : `https://vidfast.vc/movie/${id}`;
}

function server7(type, meta, season, episode) {
  const id = meta.moviedb_id || meta.imdb_id || meta.id;
  return { serverNumber: 7, serverName: 'VidFast', url: vidfastUrl(type, id, season, episode) };
}

function year(m) {
  const y = String(m.year || m.releaseInfo || '').match(/\d{4}/);
  return y ? y[0] : '-';
}

function rating(m) {
  const r = parseFloat(m.imdbRating);
  return Number.isFinite(r) && r > 0 ? r.toFixed(1) : null;
}

function poster(m, size = 'medium') {
  const id = m.imdb_id || m.id;
  if (m.poster && !/metahub/.test(m.poster)) return m.poster;
  return id ? `${IMG}/poster/${size}/${id}/img` : m.poster || null;
}

function backdrop(m) {
  const id = m.imdb_id || m.id;
  return m.background || (id ? `${IMG}/background/medium/${id}/img` : null);
}

function slugOf(m) {
  const type = cmType(m.type);
  return `${type === 'series' ? 'tv' : 'movie'}-${m.imdb_id || m.id}`;
}

function toItem(m) {
  const type = cmType(m.type);
  return {
    id: m.moviedb_id ? Number(m.moviedb_id) : m.imdb_id || m.id,
    slug: slugOf(m),
    title: m.name,
    type: type === 'series' ? 'Series' : 'Movie',
    rating: rating(m),
    year: year(m),
    releaseDate: m.released ? String(m.released).slice(0, 10) : null,
    poster: poster(m),
    backdrop: backdrop(m),
    titleLogo: m.logo || null,
    overview: m.description || null,
    genres: m.genres || m.genre || [],
  };
}

async function catalog(type, id, extra = {}) {
  const parts = Object.entries(extra)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`);
  const url = `${BASE}/catalog/${type}/${id}${parts.length ? '/' + parts.join('&') : ''}.json`;
  const { data } = await http.get(url);
  return (data.metas || []).filter((m) => m && m.name);
}

function paged(list, page) {
  const results = list.map(toItem);
  return {
    status: true,
    total: results.length,
    total_pages: list.length >= PER_PAGE - 5 ? page + 1 : page,
    results,
  };
}

const skipOf = (page) => (page > 1 ? (page - 1) * PER_PAGE : undefined);

function interleave(a, b) {
  const out = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i]) out.push(a[i]);
    if (b[i]) out.push(b[i]);
  }
  return out;
}

async function listByType(type, id, page, extra = {}) {
  const skip = skipOf(page);
  if (type === 'all') {
    const [mv, tv] = await Promise.all([
      catalog('movie', id, { ...extra, skip }),
      catalog('series', id, { ...extra, skip }),
    ]);
    const res = paged(interleave(mv, tv), page);
    res.total_pages = mv.length >= PER_PAGE - 5 || tv.length >= PER_PAGE - 5 ? page + 1 : page;
    return res;
  }
  return paged(await catalog(cmType(type), id, { ...extra, skip }), page);
}

// Terjemahkan sinopsis ke Bahasa Indonesia (gratis, tanpa key). Gagal → teks asli.
async function translateId(text) {
  if (!text) return text;
  try {
    const { data } = await http.get('https://translate.googleapis.com/translate_a/single', {
      params: { client: 'gtx', sl: 'auto', tl: 'id', dt: 't', q: text.slice(0, 4500) },
      timeout: 6000,
    });
    const out = (data?.[0] || []).map((x) => x[0]).join('');
    return out || text;
  } catch {
    return text;
  }
}

function fmtRuntime(rt) {
  const n = parseInt(rt, 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  const h = Math.floor(n / 60);
  const m = n % 60;
  return h ? `${h}j ${m}m` : `${m}m`;
}

function parseSlug(slug) {
  const m = /^(movie|tv)-(.+)$/.exec(String(slug || '').trim());
  if (!m) throw new Error('Slug tidak valid (contoh: "movie-tt0816692" atau "tv-tt0903747")');
  return { type: m[1] === 'tv' ? 'series' : 'movie', id: m[2] };
}

async function getMeta(slug) {
  const { type, id } = parseSlug(slug);
  if (!/^tt\d+$/.test(id)) throw new Error('Konten ini hanya tersedia dari sumber utama');
  const { data } = await http.get(`${BASE}/meta/${type}/${id}.json`);
  if (!data?.meta?.name) throw new Error('Konten tidak ditemukan atau slug salah');
  return { type, meta: data.meta };
}

// ---------- API (format sama dengan moviezone.js) ----------
async function searchMovies(query, page = 1) {
  if (!query || !String(query).trim()) throw new Error('Kata kunci pencarian tidak boleh kosong');
  const q = String(query).trim();
  if (page > 1) return { status: true, total: 0, total_pages: 1, results: [] };
  const [mv, tv] = await Promise.all([
    catalog('movie', 'top', { search: q }).catch(() => []),
    catalog('series', 'top', { search: q }).catch(() => []),
  ]);
  const results = interleave(mv, tv).map(toItem);
  return { status: true, total: results.length, total_pages: 1, total_results: results.length, results };
}

async function getTrending() {
  const [mv, tv] = await Promise.all([catalog('movie', 'top'), catalog('series', 'top')]);
  const results = interleave(mv.slice(0, 12), tv.slice(0, 8)).map(toItem);
  return { status: true, total: results.length, total_pages: 1, results };
}

async function getHero() {
  const mv = await catalog('movie', 'top');
  const results = mv
    .filter((m) => m.background || m.imdb_id)
    .filter((m) => !m.released || new Date(m.released) <= new Date())
    .slice(0, 6)
    .map(toItem);
  return { status: true, total: results.length, results };
}

async function getPopular(type = 'all', page = 1) {
  return listByType(type, 'top', page);
}

async function getTopRated(type = 'movie', page = 1) {
  return listByType(type, 'imdbRating', page);
}

async function getLatest(type = 'all', page = 1) {
  const y = String(new Date().getFullYear());
  const res = await listByType(type, 'year', page, { genre: y });
  const today = new Date().toISOString().slice(0, 10);
  res.results = res.results.filter((m) => !m.releaseDate || m.releaseDate <= today);
  return res;
}

async function getUpcoming() {
  const today = new Date().toISOString().slice(0, 10);
  const y = new Date().getFullYear();
  const [a, b] = await Promise.all([
    catalog('movie', 'year', { genre: String(y) }).catch(() => []),
    catalog('movie', 'year', { genre: String(y + 1) }).catch(() => []),
  ]);
  const results = [...a, ...b]
    .map(toItem)
    .filter((m) => m.releaseDate && m.releaseDate > today)
    .sort((x, z) => x.releaseDate.localeCompare(z.releaseDate))
    .slice(0, 15);
  return { status: true, total: results.length, results };
}

async function getGenres() {
  return {
    status: true,
    genres: Object.entries(GENRE_ID).map(([name, id]) => ({ id, name: GENRE_ID_LABEL[name] || name })),
  };
}

async function discover({ type = 'movie', genre, sort, page = 1 } = {}) {
  const name = GENRE_MAP[Number(genre)] || (isNaN(Number(genre)) ? genre : undefined);
  const id = sort && /vote|rating/.test(sort) ? 'imdbRating' : 'top';
  return paged(await catalog(cmType(type), id, { genre: name, skip: skipOf(page) }), page);
}

async function getMovieDetail(slug) {
  const { type, meta } = await getMeta(slug);
  const isSeries = type === 'series';
  const released = meta.released ? String(meta.released).slice(0, 10) : null;
  const today = new Date().toISOString().slice(0, 10);

  let status = meta.status || null;
  if (!isSeries) status = released && released > today ? 'Upcoming' : 'Released';

  const firstGenre = (meta.genres || meta.genre || [])[0];
  const [synopsis, recs] = await Promise.all([
    translateId(meta.description),
    catalog(type, 'top', firstGenre ? { genre: firstGenre } : {}).catch(() => []),
  ]);

  const videos = meta.videos || [];
  const seasonNums = [...new Set(videos.map((v) => Number(v.season)).filter((n) => Number.isFinite(n)))].sort(
    (a, b) => (a === 0) - (b === 0) || a - b
  );
  const trailerKey = meta.trailers?.[0]?.source || meta.trailerStreams?.[0]?.ytId;

  return {
    status: true,
    result: {
      id: meta.moviedb_id ? Number(meta.moviedb_id) : meta.imdb_id,
      slug: slugOf(meta),
      type: isSeries ? 'Series' : 'Movie',
      title: meta.name,
      tagline: null,
      year: year(meta),
      rating: rating(meta),
      voteCount: null,
      duration: fmtRuntime(meta.runtime),
      status,
      ageRating: null,
      releaseDate: released,
      genres: meta.genres || meta.genre || [],
      director: Array.isArray(meta.director) ? meta.director.join(', ') : meta.director || null,
      synopsis: synopsis || null,
      poster: poster(meta),
      backdrop: backdrop(meta),
      trailer: trailerKey ? `https://www.youtube.com/watch?v=${trailerKey}` : null,
      imdbId: meta.imdb_id || null,
      cast: (meta.cast || []).slice(0, 15).map((name) => ({ name, character: null, photo: null })),
      watchProviders: [],
      recommendations: recs
        .filter((r) => (r.imdb_id || r.id) !== (meta.imdb_id || meta.id))
        .slice(0, 15)
        .map((r) => {
          const it = toItem(r);
          return { slug: it.slug, title: it.title, type: it.type, year: it.year, rating: it.rating, poster: it.poster };
        }),
      stream: isSeries ? null : { ...server7('movie', meta) },
      seasons: seasonNums.map((n) => ({ season_number: n, name: n === 0 ? 'Spesial' : `Season ${n}` })),
    },
  };
}

async function getSeriesEpisodes(slug, season = 1) {
  const { meta } = await getMeta(slug);
  const s = Number(season);
  const episodes = (meta.videos || [])
    .filter((v) => Number(v.season) === s)
    .sort((a, b) => Number(a.episode || a.number) - Number(b.episode || b.number))
    .map((v) => {
      const ep = Number(v.episode || v.number);
      return {
        episode: ep,
        season: s,
        title: v.name || v.title || `Episode ${ep}`,
        overview: v.overview || v.description || null,
        still: v.thumbnail || null,
        airDate: v.released ? String(v.released).slice(0, 10) : null,
        runtime: null,
        stream: server7('series', meta, s, ep),
      };
    });
  return { status: true, season: s, totalEpisodes: episodes.length, episodes };
}

module.exports = {
  searchMovies,
  getTrending,
  getPopular,
  getTopRated,
  getLatest,
  getMovieDetail,
  getSeriesEpisodes,
  getHero,
  getUpcoming,
  getGenres,
  discover,
};
