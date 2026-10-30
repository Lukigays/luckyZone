/**
 * Daftar server streaming (sama seperti situs asli, Server 1–7).
 * - tmdb : ID TMDB (angka) bila ada
 * - imdb : ID IMDb (tt…) bila ada
 * Server yang hanya mendukung TMDB dilewati bila ID TMDB tidak tersedia.
 */
export const SERVER_DOMAINS = [
  'https://vidlink.pro',
  'https://vidsrc.to',
  'https://vidfast.vc',
  'https://www.2embed.cc',
  'https://vsembed.ru',
  'https://multiembed.mov',
  'https://vidsrc.wiki',
];

// Urutan server default bila pengguna belum pernah memilih (paling stabil dulu)
export const DEFAULT_ORDER = ['VidLink', 'VidSrc', 'VidFast', '2Embed', 'VSEmbed', 'SuperEmbed', 'VidSrcWiki'];
export const RECOMMENDED = DEFAULT_ORDER[0];
export const PREF_KEY = 'lz_server_pref';

export function idsFrom(detail, slug) {
  const s = /^(movie|tv)-(.+)$/.exec(slug || '');
  const raw = [detail?.id, detail?.tmdbId, s?.[2]].map((x) => (x == null ? '' : String(x)));
  const tmdb = raw.find((x) => /^\d+$/.test(x)) || null;
  const imdb = [detail?.imdbId, ...raw].map((x) => (x == null ? '' : String(x))).find((x) => /^tt\d+$/.test(x)) || null;
  return { tmdb, imdb };
}

export function buildServers({ tmdb, imdb }, type, season = 1, episode = 1) {
  const id = tmdb || imdb;
  if (!id) return [];
  const s = season || 1;
  const e = episode || 1;
  const tv = type === 'tv';
  const list = tv
    ? [
        { number: 1, server: 'VidSrcWiki', url: `https://vidsrc.wiki/embed/tv/${id}/${s}/${e}` },
        { number: 2, server: 'SuperEmbed', url: `https://multiembed.mov/?video_id=${id}${tmdb ? '&tmdb=1' : ''}&s=${s}&e=${e}` },
        { number: 3, server: 'VidSrc', url: `https://vidsrc.to/embed/tv/${id}/${s}/${e}` },
        tmdb && { number: 4, server: 'VidLink', url: `https://vidlink.pro/tv/${tmdb}/${s}/${e}` },
        { number: 5, server: '2Embed', url: `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}` },
        { number: 6, server: 'VSEmbed', url: `https://vsembed.ru/embed/tv/${imdb || id}/${s}/${e}` },
        { number: 7, server: 'VidFast', url: `https://vidfast.vc/tv/${id}/${s}/${e}` },
      ]
    : [
        { number: 1, server: 'VidSrcWiki', url: `https://vidsrc.wiki/embed/movie/${id}` },
        { number: 2, server: 'SuperEmbed', url: `https://multiembed.mov/?video_id=${id}${tmdb ? '&tmdb=1' : ''}` },
        { number: 3, server: 'VidSrc', url: `https://vidsrc.to/embed/movie/${id}` },
        { number: 4, server: 'VidLink', url: `https://vidlink.pro/movie/${id}` },
        { number: 5, server: '2Embed', url: `https://www.2embed.cc/embed/${id}` },
        { number: 6, server: 'VSEmbed', url: `https://vsembed.ru/embed/movie/${imdb || id}` },
        { number: 7, server: 'VidFast', url: `https://vidfast.vc/movie/${id}` },
      ];
  return list.filter(Boolean);
}

export function pickDefault(servers) {
  let pref = null;
  try {
    pref = localStorage.getItem(PREF_KEY);
  } catch {}
  const order = pref ? [pref, ...DEFAULT_ORDER] : DEFAULT_ORDER;
  for (const name of order) {
    const i = servers.findIndex((x) => x.server === name);
    if (i >= 0) return i;
  }
  return 0;
}

export function savePref(name) {
  try {
    localStorage.setItem(PREF_KEY, name);
  } catch {}
}
