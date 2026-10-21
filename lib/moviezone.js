/**
 * MovieZone (moviezone.web.id) All-in-One Movie & Series Scraper Engine
 * Dipakai oleh LukyyZone sebagai sumber data & stream (Server 7: VidFast)
 * Server Filter: Only Server 7 (VidFast)
 * Author: Vamz Spectre / VamxAPI
 * Website: https://vamxapi.my.id
 * Channel: https://whatsapp.com/channel/0029Vb8n36OGE56uvRAq4y3y
 */

const axios = require('axios');

const BASE_URL = 'https://moviezone.web.id';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

let sessionCookie = null;
let sessionExpiry = 0;

/**
 * Mendapatkan atau memperbarui cookie sesi proteksi (mz_t)
 */
async function getSessionCookie() {
  const now = Date.now();
  if (sessionCookie && now < sessionExpiry) {
    return sessionCookie;
  }

  try {
    const res = await axios.get(`${BASE_URL}/search`, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      timeout: 10000,
      maxRedirects: 5,
    });

    const setCookies = res.headers['set-cookie'];
    if (setCookies && Array.isArray(setCookies)) {
      const mzCookie = setCookies.find(c => c.startsWith('mz_t='));
      if (mzCookie) {
        sessionCookie = mzCookie.split(';')[0];
        sessionExpiry = now + (11 * 60 * 60 * 1000);
        return sessionCookie;
      }
    }

    if (res.headers['set-cookie'] && typeof res.headers['set-cookie'] === 'string') {
      const match = res.headers['set-cookie'].match(/mz_t=[^;]+/);
      if (match) {
        sessionCookie = match[0];
        sessionExpiry = now + (11 * 60 * 60 * 1000);
        return sessionCookie;
      }
    }

    return sessionCookie || '';
  } catch (err) {
    throw new Error(`Gagal menginisialisasi sesi MovieZone: ${err.message}`);
  }
}

/**
 * Request internal API dengan bypass sesi
 */
async function fetchApi(endpoint, refererPath = '/search') {
  const cookie = await getSessionCookie();
  const url = `${BASE_URL}${endpoint}`;

  const response = await axios.get(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Referer': `${BASE_URL}${refererPath}`,
      'Cookie': cookie,
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
    },
    timeout: 15000,
  });

  return response.data;
}

/**
 * Helper: Filter khusus Server 7 (VidFast)
 */
function extractServer7(servers) {
  if (!Array.isArray(servers) || servers.length === 0) return null;
  // Cek server dengan nama VidFast atau index ke-7 (index 6)
  const vidFast = servers.find(s => s.server?.toLowerCase().includes('vidfast'));
  if (vidFast) return vidFast;
  return servers[6] || servers[servers.length - 1];
}

/**
 * Cari Film & TV Series berdasarkan Judul / Keyword
 * @param {string} query
 */
async function searchMovies(query, page = 1) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    throw new Error('Kata kunci pencarian tidak boleh kosong');
  }

  const endpoint = `/api/movies/search?q=${encodeURIComponent(query.trim())}&page=${page}`;
  const data = await fetchApi(endpoint, '/search');

  return {
    status: true,
    total: data.results?.length || 0,
    total_pages: data.total_pages || 1,
    total_results: data.total_results,
    results: (data.results || []).map(item => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      type: item.type, // 'Movie' | 'Series'
      rating: item.rating || '0',
      year: item.year || '-',
      releaseDate: item.releaseDate || null,
      poster: item.poster || null,
      backdrop: item.backdrop || null,
      overview: item.overview || null,
      genres: item.genreIds || [],
    })),
  };
}

/**
 * Ambil Film & Series Trending
 */
async function getTrending() {
  const data = await fetchApi('/api/movies/trending', '/');
  return {
    status: true,
    total: data.results?.length || 0,
    total_pages: data.total_pages || 1,
    total_results: data.total_results,
    results: data.results || [],
  };
}

/**
 * Ambil Film & Series Populer
 * @param {'all' | 'movie' | 'tv'} type
 */
async function getPopular(type = 'all', page = 1) {
  const data = await fetchApi(`/api/movies/popular?type=${type}&page=${page}`, '/popular');
  return {
    status: true,
    total: data.results?.length || 0,
    total_pages: data.total_pages || 1,
    total_results: data.total_results,
    results: data.results || [],
  };
}

/**
 * Ambil Film & Series Rating Tertinggi
 * @param {'all' | 'movie' | 'tv'} type
 */
async function getTopRated(type = 'movie', page = 1) {
  const data = await fetchApi(`/api/movies/top-rated?type=${type}&page=${page}`, '/top-rated');
  return {
    status: true,
    total: data.results?.length || 0,
    total_pages: data.total_pages || 1,
    total_results: data.total_results,
    results: data.results || [],
  };
}

/**
 * Ambil Rilis Terbaru
 * @param {'all' | 'movie' | 'tv'} type
 */
async function getLatest(type = 'all', page = 1) {
  const data = await fetchApi(`/api/movies/latest?type=${type}&page=${page}`, '/latest');
  return {
    status: true,
    total: data.results?.length || 0,
    total_pages: data.total_pages || 1,
    total_results: data.total_results,
    results: data.results || [],
  };
}

/**
 * Ambil Detail Lengkap Film atau TV Series (Khusus Server 7: VidFast)
 * @param {string} slug Contoh: "movie-969681" atau "tv-2287"
 */
async function getMovieDetail(slug) {
  if (!slug || typeof slug !== 'string' || !slug.trim()) {
    throw new Error('Slug film/series tidak boleh kosong (contoh: "movie-969681" atau "tv-2287")');
  }

  const cleanSlug = slug.trim();
  const endpoint = `/api/movies/detail/${encodeURIComponent(cleanSlug)}`;
  const data = await fetchApi(endpoint, `/movie/${cleanSlug}`);

  if (!data || !data.id) {
    throw new Error('Konten tidak ditemukan atau slug salah');
  }

  const server7 = extractServer7(data.stream?.servers || []);

  return {
    status: true,
    result: {
      id: data.id,
      slug: data.slug,
      type: data.type,
      title: data.title,
      tagline: data.tagline || null,
      year: data.year,
      rating: data.rating,
      voteCount: data.voteCount,
      duration: data.duration,
      status: data.status,
      ageRating: data.ageRating,
      releaseDate: data.releaseDate,
      genres: data.genres || [],
      director: data.director || null,
      synopsis: data.synopsis || null,
      poster: data.poster,
      backdrop: data.backdrop,
      trailer: data.trailer,
      imdbId: data.imdbId,
      cast: (data.castDetailed || []).slice(0, 15).map(c => ({
        name: c.name,
        character: c.character,
        photo: c.photo,
      })),
      watchProviders: data.watchProviders || [],
      recommendations: (data.recommendations || []).map(r => ({
        slug: r.slug,
        title: r.title,
        type: r.type,
        year: r.year,
        rating: r.rating,
        poster: r.poster,
      })),
      stream: server7 ? {
        serverNumber: 7,
        serverName: server7.server, // "VidFast"
        url: server7.url,
      } : null,
      seasons: data.seasons || [],
    },
  };
}

/**
 * Ambil Daftar Episode TV Series (Khusus Server 7: VidFast)
 * @param {string} slug Contoh: "tv-2287"
 * @param {number|string} season Nomor season (default 1)
 */
async function getSeriesEpisodes(slug, season = 1) {
  if (!slug || typeof slug !== 'string' || !slug.trim()) {
    throw new Error('Slug TV Series tidak boleh kosong (contoh: "tv-2287")');
  }

  const cleanSlug = slug.trim();
  const endpoint = `/api/movies/episodes/${encodeURIComponent(cleanSlug)}?season=${season}`;
  const data = await fetchApi(endpoint, `/movie/${cleanSlug}`);

  return {
    status: true,
    season: Number(season),
    totalEpisodes: data.episodes?.length || 0,
    episodes: (data.episodes || []).map(ep => {
      const server7 = extractServer7(ep.servers || []);
      return {
        episode: ep.episode,
        season: ep.season,
        title: ep.title,
        overview: ep.overview,
        still: ep.still,
        airDate: ep.airDate,
        runtime: ep.runtime,
        stream: server7 ? {
          serverNumber: 7,
          serverName: server7.server, // "VidFast"
          url: server7.url,
        } : null,
      };
    }),
  };
}


/* ================================================================
 * [LukyyZone] Tambahan endpoint (pola sama: lewat fetchApi)
 * ================================================================ */

/** Slide hero beranda (fallback: 6 trending teratas yang punya backdrop) */
async function getHero() {
  try {
    const data = await fetchApi('/api/movies/hero', '/');
    if (Array.isArray(data.results) && data.results.length) {
      return { status: true, total: data.results.length, results: data.results };
    }
  } catch (_) { /* fallback ke trending */ }
  const tr = await getTrending();
  const results = (tr.results || []).filter(m => m.backdrop).slice(0, 6);
  return { status: true, total: results.length, results };
}

/** Film yang akan tayang */
async function getUpcoming() {
  const data = await fetchApi('/api/movies/upcoming', '/');
  return { status: true, total: data.results?.length || 0, results: data.results || [] };
}

/** Daftar genre */
async function getGenres() {
  const data = await fetchApi('/api/movies/genres', '/genre');
  return { status: true, genres: data.genres || [] };
}

/**
 * Discover berdasarkan genre
 * @param {{type?: 'movie'|'tv', genre: string|number, sort?: string, page?: number}} opts
 */
async function discover({ type = 'movie', genre, sort, page = 1 } = {}) {
  const qs = new URLSearchParams({ type, page: String(page) });
  if (genre) qs.set('genre', String(genre));
  if (sort) qs.set('sort', sort);
  const data = await fetchApi(`/api/movies/discover?${qs.toString()}`, '/genre');
  return {
    status: true,
    total: data.results?.length || 0,
    total_pages: data.total_pages || 1,
    total_results: data.total_results,
    results: data.results || [],
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
  searchMovies,
  getTrending,
  getPopular,
  getTopRated,
  getLatest,
  getMovieDetail,
  getSeriesEpisodes,
  // [LukyyZone] tambahan
  getHero,
  getUpcoming,
  getGenres,
  discover,
  fetchApi,
};
}

// Mode CLI Langsung (Interactive & Parameter Checker)
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] ? args[0].toLowerCase().trim() : '';
  const param = args.slice(1).join(' ').trim();

  if (!command) {
    console.log(`
=============================================================
     MOVIEZONE STREAM SCRAPER ENGINE (ONLY SERVER 7: VIDFAST)
=============================================================
❌ Error: Perintah atau parameter tidak boleh kosong!

📖 CARA PENGGUNAAN LENGKAP:
  node moviezone-stream-scraper.js <command> [parameter]

📌 DAFTAR COMMAND TERSEDIA:
  search <judul>              Cari film & series sub Indo
  detail <slug>               Ambil info, sinopsis & stream link Server 7 (VidFast)
  episodes <slug> [season]    Ambil daftar episode & stream link Server 7 (VidFast)
  trending                    Daftar film & series trending
  popular [all|movie|tv]      Daftar film terpopuler
  latest [all|movie|tv]       Daftar film/series rilis terbaru
  toprated [movie|tv]         Daftar rating tertinggi

📌 CONTOH PENGGUNAAN:
  node moviezone-stream-scraper.js search "Spider-Man"
  node moviezone-stream-scraper.js detail "movie-969681"
  node moviezone-stream-scraper.js episodes "tv-2287" 1
  node moviezone-stream-scraper.js trending
  node moviezone-stream-scraper.js popular movie

💡 INTEGRASI MODULAR (Node.js / Express / Baileys):
  const { searchMovies, getMovieDetail, getSeriesEpisodes } = require("./moviezone-stream-scraper");
  const hasil = await getMovieDetail("movie-969681");
  console.log(hasil.result.stream);
=============================================================
`);
    process.exit(1);
  }

  (async () => {
    try {
      console.log(`⏳ Sedang memproses MovieZone [${command}]...`);

      if (command === 'search') {
        if (!param) {
          console.error('❌ Harap masukkan judul film untuk dicari. Contoh: node moviezone-stream-scraper.js search "Batman"');
          process.exit(1);
        }
        const res = await searchMovies(param);
        console.log(JSON.stringify(res, null, 2));
      } else if (command === 'detail') {
        if (!param) {
          console.error('❌ Harap masukkan slug film/series. Contoh: node moviezone-stream-scraper.js detail "movie-969681"');
          process.exit(1);
        }
        const res = await getMovieDetail(param);
        console.log(JSON.stringify(res, null, 2));
      } else if (command === 'episodes' || command === 'ep') {
        const parts = param.split(/\s+/);
        const slug = parts[0];
        const season = parts[1] || 1;
        if (!slug) {
          console.error('❌ Harap masukkan slug series. Contoh: node moviezone-stream-scraper.js episodes "tv-2287" 1');
          process.exit(1);
        }
        const res = await getSeriesEpisodes(slug, season);
        console.log(JSON.stringify(res, null, 2));
      } else if (command === 'trending') {
        const res = await getTrending();
        console.log(JSON.stringify(res, null, 2));
      } else if (command === 'popular') {
        const res = await getPopular(param || 'all');
        console.log(JSON.stringify(res, null, 2));
      } else if (command === 'latest') {
        const res = await getLatest(param || 'all');
        console.log(JSON.stringify(res, null, 2));
      } else if (command === 'toprated') {
        const res = await getTopRated(param || 'movie');
        console.log(JSON.stringify(res, null, 2));
      } else {
        console.error(`❌ Perintah "${command}" tidak dikenali. Ketik node moviezone-stream-scraper.js tanpa parameter untuk melihat bantuan.`);
        process.exit(1);
      }
    } catch (err) {
      console.error('❌ Terjadi Kesalahan:', err.message);
      process.exit(1);
    }
  })();
}
