'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ShareModal from './ShareModal';
import { addHistory } from '@/lib/storage';
import { SITE_URL } from '@/lib/site';

/**
 * Stream memakai output engine moviezone.js → `stream` (Server 7: VidFast).
 * - Film   : /api/movies/detail/:slug          → result.stream.url
 * - Series : /api/movies/episodes/:slug?season → episodes[n].stream.url
 * Jika engine tidak mengembalikan stream, dibuat URL VidFast (Server 7) dari ID di slug.
 */
function vidfastFallback(slug, season, episode) {
  const m = /^(movie|tv)-(\d+|tt\d+)$/.exec(slug || '');
  if (!m) return null;
  return m[1] === 'tv' ? `https://vidfast.vc/tv/${m[2]}/${season}/${episode}` : `https://vidfast.vc/movie/${m[2]}`;
}

export default function Watch({ slug }) {
  const router = useRouter();
  const sp = useSearchParams();
  const season = parseInt(sp.get('season') || '1', 10);
  const episode = parseInt(sp.get('episode') || '1', 10);

  const [m, setM] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [servers, setServers] = useState([]);
  const [active, setActive] = useState(0);
  const [pending, setPending] = useState(null);
  const [locked, setLocked] = useState(false);
  const [landscape, setLandscape] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const box = useRef(null);
  const lastTap = useRef(0);

  const unlockTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 350) {
      setLocked(false);
      lastTap.current = 0;
    } else lastTap.current = now;
  }, []);

  useEffect(() => {
    let off = false;
    setLoading(true);
    setError('');
    (async () => {
      const isTvSlug = slug.startsWith('tv-');
      let detail = null;
      try {
        const r = await fetch(`/api/movies/detail/${slug}`);
        const d = await r.json();
        if (d.error) throw new Error(d.error);
        detail = d;
      } catch (e) {
        // Engine gagal → tetap bisa putar via Server 7 (VidFast) dari ID di slug
        const fb = vidfastFallback(slug, season, episode);
        if (!fb) {
          if (!off) setError(e.message || 'Gagal memuat');
          return;
        }
        detail = { slug, title: 'Sedang diputar', type: isTvSlug ? 'Series' : 'Movie', stream: null };
      }

      const status = (detail.status || '').toLowerCase();
      const unreleased = detail.type === 'Series' ? status === 'planned' || status === 'in production' : !!status && status !== 'released';
      if (unreleased) {
        router.replace(`/movie/${slug}`);
        return;
      }

      let stream = detail.stream;
      if (detail.type === 'Series') {
        stream = null;
        try {
          const r = await fetch(`/api/movies/episodes/${slug}?season=${season}`);
          const d = await r.json();
          const ep = (d.episodes || []).find((x) => Number(x.episode) === episode);
          if (ep?.stream?.url) stream = ep.stream;
        } catch {}
      }
      const url = stream?.url || vidfastFallback(slug, season, episode);
      if (off) return;
      setM(detail);
      setServers(url ? [{ server: stream?.serverName || 'VidFast', number: stream?.serverNumber || 7, url }] : []);
      setActive(0);
      if (detail.title && detail.title !== 'Sedang diputar') {
        addHistory(detail, detail.type === 'Series' ? { season, episode } : undefined);
      }
    })()
      .catch((e) => !off && setError(e.message || 'Gagal memuat'))
      .finally(() => !off && setLoading(false));
    return () => {
      off = true;
    };
  }, [slug, season, episode, router]);

  // Unlock orientasi saat keluar
  useEffect(
    () => () => {
      try {
        screen.orientation?.unlock();
      } catch {}
    },
    []
  );

  // Cegah popup iklan membuka tab di halaman ini
  useEffect(() => {
    const orig = window.open.bind(window);
    window.open = (u, t, f) =>
      u && typeof u === 'string' && (u.startsWith('/') || u.includes(window.location.hostname))
        ? orig(u, t, f)
        : (u && orig(u, '_blank', 'noopener,noreferrer'), null);
    const click = (e) => {
      const a = e.target.closest('a');
      if (a?.href && !a.href.startsWith(window.location.origin) && !a.href.startsWith('/')) {
        e.preventDefault();
        e.stopPropagation();
        window.open(a.href, '_blank', 'noopener,noreferrer');
      }
    };
    document.addEventListener('click', click, true);
    return () => {
      window.open = orig;
      document.removeEventListener('click', click, true);
    };
  }, []);

  const toggleLandscape = useCallback(async () => {
    if (landscape) {
      try {
        screen.orientation?.unlock();
        if (document.fullscreenElement) await document.exitFullscreen();
      } catch {}
      setLandscape(false);
    } else {
      try {
        if (box.current?.requestFullscreen) await box.current.requestFullscreen();
        await screen.orientation?.lock('landscape');
        setLandscape(true);
      } catch {
        setLandscape(true);
      }
    }
  }, [landscape]);

  useEffect(() => {
    const fn = () => {
      const portrait = window.screen.orientation?.type?.includes('portrait') || window.innerHeight > window.innerWidth;
      if (portrait && landscape) {
        setLandscape(false);
        try {
          screen.orientation?.unlock();
        } catch {}
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      }
    };
    window.addEventListener('orientationchange', fn);
    window.addEventListener('resize', fn);
    return () => {
      window.removeEventListener('orientationchange', fn);
      window.removeEventListener('resize', fn);
    };
  }, [landscape]);

  useEffect(() => {
    const fn = () => {
      if (!document.fullscreenElement && landscape) {
        setLandscape(false);
        try {
          screen.orientation?.unlock();
        } catch {}
      }
    };
    document.addEventListener('fullscreenchange', fn);
    return () => document.removeEventListener('fullscreenchange', fn);
  }, [landscape]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <i className="fa-solid fa-circle-notch fa-spin text-3xl text-gold" />
      </div>
    );

  if (error || !m)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6">
        <i className="fa-solid fa-circle-exclamation text-4xl text-dim" />
        <p className="text-silver text-sm text-center">{error || 'Konten tidak tersedia'}</p>
        <button onClick={() => router.back()} className="px-4 py-2 rounded-xl bg-inke border border-line text-silver text-sm">
          Kembali
        </button>
      </div>
    );

  const isSeries = m.type === 'Series';
  const cur = servers[active];

  return (
    <div className="min-h-screen bg-ink">
      {!landscape && (
        <div className="flex items-center gap-3 px-4 h-14 border-b border-line sticky top-0 z-40 bg-ink">
          <button onClick={() => router.back()} className="w-8 h-8 rounded-xl bg-ghost flex items-center justify-center flex-shrink-0">
            <i className="fa-solid fa-arrow-left text-sm text-silver" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-sm truncate">{m.title}</h1>
            {isSeries && (
              <p className="text-[10px] text-dim">
                Season {season} · Episode {episode}
              </p>
            )}
          </div>
          <button
            onClick={() => setShareOpen(true)}
            aria-label="Bagikan"
            className="w-8 h-8 rounded-xl bg-ghost flex items-center justify-center flex-shrink-0"
          >
            <i className="fa-solid fa-share-nodes text-sm text-silver" />
          </button>
        </div>
      )}

      <div
        ref={box}
        style={
          landscape
            ? { position: 'fixed', inset: 0, zIndex: 9999, width: '100vw', height: '100vh', background: '#000' }
            : { width: '100%', aspectRatio: '16/9', background: '#000', position: 'relative' }
        }
      >
        {cur ? (
          <iframe
            key={cur.url}
            src={cur.url}
            className="absolute inset-0 w-full h-full border-0"
            allowFullScreen
            allow="fullscreen; autoplay; encrypted-media; picture-in-picture; web-share"
            referrerPolicy="no-referrer"
            title={m.title}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center gap-3 flex-col">
            <i className="fa-solid fa-circle-exclamation text-3xl text-dim" />
            <p className="text-dim text-sm">Pilih server di bawah</p>
          </div>
        )}
        {locked && (
          <div
            className="absolute inset-0"
            style={{ zIndex: 100, background: 'transparent', cursor: 'not-allowed' }}
            onTouchStart={(e) => {
              e.stopPropagation();
              unlockTap();
            }}
            onClick={(e) => {
              e.stopPropagation();
              unlockTap();
            }}
          />
        )}
        {landscape && !locked && (
          <button
            onClick={toggleLandscape}
            className="absolute top-3 left-3 z-[99999] flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white text-xs font-medium"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          >
            <i className="fa-solid fa-rotate-left text-[11px]" /> Portrait
          </button>
        )}
        {landscape && !locked && (
          <button
            onClick={() => setLocked(true)}
            className="absolute top-3 right-3 z-[99999] flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white text-xs font-medium"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          >
            <i className="fa-solid fa-lock-open text-[11px]" /> Kunci
          </button>
        )}
      </div>

      {!landscape && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-line bg-inkl">
          <button
            onClick={() => setLocked(!locked)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              locked ? 'bg-gold/20 border-gold/50 text-gold' : 'bg-ghost border-line text-silver hover:border-gold/40 hover:text-gold'
            }`}
          >
            <i className={`fa-solid ${locked ? 'fa-lock' : 'fa-lock-open'} text-[11px]`} />
            {locked ? 'Terkunci' : 'Kunci Layar'}
          </button>
          <div className="flex-1" />
          <button
            onClick={toggleLandscape}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-ghost border border-line text-silver hover:border-gold/40 hover:text-gold transition-colors"
          >
            <i className="fa-solid fa-expand text-[11px]" /> Horizontal
          </button>
        </div>
      )}

      {!landscape && (
        <>
          <div className="px-4 py-4 border-b border-line">
            <div className="flex items-center gap-2 mb-3">
              <i className="fa-solid fa-server text-sm text-gold" />
              <p className="text-sm font-semibold">Pilih Server</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {servers.map((s, i) => {
                const on = active === i;
                return (
                  <button
                    key={i}
                    onClick={() => i !== active && setPending(i)}
                    style={{ gridColumn: 'span 2', whiteSpace: 'nowrap' }}
                    className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-2 text-center border transition-colors duration-150 ${
                      on ? 'bg-goldf border-gold/50 text-gold' : 'bg-inke border-line text-silver hover:border-line active:scale-[0.98]'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${on ? 'bg-gold' : 'bg-dim'}`} />
                    <span className="text-[12px] font-medium leading-none">Server {s.number}</span>
                    <span
                      className={`text-[8px] font-bold leading-none px-1 py-0.5 rounded ${on ? 'bg-gold/20 text-gold' : 'bg-line text-dim'}`}
                    >
                      {s.server.toUpperCase()}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-dim mt-3">
              <i className="fa-solid fa-circle-info mr-1" />
              Streaming via Server 7 (VidFast). Jika tidak bisa putar, muat ulang halaman.
            </p>
          </div>
          <div className="px-4 py-4 pb-8">
            <h2 className="font-display font-bold text-lg mb-1">{m.title}</h2>
            <div className="flex items-center gap-3 text-dim text-xs mb-3">
              {m.type && <span className="text-gold font-semibold">{m.type}</span>}
              {m.year && <span>{m.year}</span>}
              {m.rating && (
                <div className="flex items-center gap-1">
                  <i className="fa-solid fa-star text-[10px] text-gold" />
                  <span className="text-gold">{m.rating}</span>
                </div>
              )}
            </div>
            {m.synopsis && <p className="text-silver text-sm leading-relaxed line-clamp-3">{m.synopsis}</p>}
            <button
              onClick={() => router.push(`/movie/${slug}`)}
              className="flex items-center gap-2 mt-4 text-silver text-xs hover:text-gold transition-colors"
            >
              <i className="fa-solid fa-circle-info text-[11px]" /> Lihat detail lengkap
            </button>
          </div>
        </>
      )}

      {shareOpen && (
        <ShareModal
          title={isSeries ? `${m.title} S${season}E${episode}` : m.title}
          url={`${SITE_URL}/movie/${slug}`}
          onClose={() => setShareOpen(false)}
        />
      )}

      {pending !== null && (
        <div
          className="fixed inset-0 z-[100000] flex items-center justify-center px-6"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setPending(null)}
        >
          <div className="bg-inkl border border-line rounded-2xl p-5 w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display font-bold text-base mb-2 text-[#E8EDF2]">Ganti Server?</h3>
            <p className="text-silver text-sm leading-relaxed mb-5">
              Berpindah server akan memuat ulang video dari awal (0:00). Progres tontonan di server saat ini tidak tersimpan.
            </p>
            <div className="flex items-center justify-end gap-4">
              <button onClick={() => setPending(null)} className="text-dim text-sm font-medium px-2 py-1">
                Batal
              </button>
              <button
                onClick={() => {
                  setActive(pending);
                  setPending(null);
                }}
                className="text-gold text-sm font-bold px-2 py-1"
              >
                Ganti Server
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
