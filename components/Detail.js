'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MovieRow from './MovieRow';
import ShareModal from './ShareModal';
import RatingStars from './RatingStars';
import { hideOnError } from './MovieCard';
import { isReminded, addReminder, removeReminder, vibrate } from '@/lib/storage';
import { SITE_URL } from '@/lib/site';
import useIdSynopsis from './useIdSynopsis';

const glassBtn = {
  background: 'rgba(255,255,255,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.09)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
};

function useLockBody(onClose) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const fn = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', fn);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', fn);
    };
  }, [onClose]);
}

function CastModal({ cast, movieTitle, onClose }) {
  useLockBody(onClose);
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md max-h-[85vh] bg-inkl border border-line rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-line" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-line flex-shrink-0">
          <div>
            <h2 className="font-display font-bold text-base">Pemeran</h2>
            <p className="text-dim text-xs truncate max-w-[240px]">{movieTitle}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="w-8 h-8 rounded-full bg-ghost flex items-center justify-center text-silver hover:text-gold transition-colors flex-shrink-0"
          >
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-3 gap-4">
            {cast.map((c, i) => (
              <div key={c.name + i} className="flex flex-col items-center text-center">
                <div className="w-full aspect-square rounded-full overflow-hidden bg-ghost mb-2 border border-line">
                  {c.photo ? (
                    <img src={c.photo} alt={c.name} loading="lazy" className="w-full h-full object-cover" onError={hideOnError} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <i className="fa-solid fa-user text-lg text-dim" />
                    </div>
                  )}
                </div>
                <p className="text-xs font-medium text-[#E8EDF2] line-clamp-2 leading-tight">{c.name}</p>
                {c.character && <p className="text-[10px] text-dim line-clamp-1 mt-0.5">{c.character}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ icon, label, children }) {
  return (
    <div className="bg-inke rounded-xl p-3 border border-line">
      <div className="flex items-center gap-1.5 mb-1">
        <i className={`fa-solid ${icon} text-[11px] text-gold`} />
        <p className="text-[10px] text-dim font-medium uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-xs text-silver line-clamp-2">{children}</p>
    </div>
  );
}

function averageColor(src) {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const c = document.createElement('canvas');
          c.width = 32;
          c.height = 32;
          const ctx = c.getContext('2d');
          if (!ctx) return resolve(null);
          ctx.drawImage(img, 0, 0, 32, 32);
          const { data } = ctx.getImageData(0, 0, 32, 32);
          let r = 0, g = 0, b = 0, n = 0;
          for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] < 200) continue;
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            n++;
          }
          if (!n) return resolve(null);
          const k = (v) => Math.round(0.35 * Math.round(v / n));
          resolve(`rgb(${k(r)}, ${k(g)}, ${k(b)})`);
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = src;
    } catch {
      resolve(null);
    }
  });
}

export default function Detail({ slug }) {
  const router = useRouter();
  const [m, setM] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [season, setSeason] = useState(1);
  const [episodes, setEpisodes] = useState([]);
  const [epLoading, setEpLoading] = useState(false);
  const [reminded, setReminded] = useState(false);
  const [remState, setRemState] = useState('idle');
  const [castOpen, setCastOpen] = useState(false);
  const synopsisId = useIdSynopsis(m);
  const [shareOpen, setShareOpen] = useState(false);
  const [tint, setTint] = useState(null);
  const imgRef = useRef(null);

  useEffect(() => {
    fetch(`/api/movies/detail/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setM(d);
        const first = (d.seasons || []).find((s) => s.season_number > 0) || (d.seasons || [])[0];
        if (first) setSeason(first.season_number);
      })
      .catch((e) => setError(e.message || 'Gagal memuat'))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => setReminded(isReminded(slug)), [slug]);

  useEffect(() => {
    const src = m?.backdrop || m?.poster;
    if (!src) return;
    let off = false;
    averageColor(src).then((c) => !off && setTint(c));
    return () => {
      off = true;
    };
  }, [m?.backdrop, m?.poster]);

  useEffect(() => {
    const fn = () => {
      const el = imgRef.current;
      if (!el) return;
      const y = Math.min(window.scrollY, 280);
      el.style.transform = `translateY(${0.3 * y}px) scale(1.08)`;
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    if (!m || m.type !== 'Series') return;
    setEpLoading(true);
    fetch(`/api/movies/episodes/${slug}?season=${season}`)
      .then((r) => r.json())
      .then((d) => setEpisodes(d.episodes || []))
      .catch(() => {})
      .finally(() => setEpLoading(false));
  }, [slug, m, season]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <i className="fa-solid fa-circle-notch fa-spin text-3xl text-gold" />
      </div>
    );

  if (error || !m)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6">
        <i className="fa-solid fa-triangle-exclamation text-4xl text-dim" />
        <p className="text-silver text-sm text-center">{error || 'Film tidak ditemukan'}</p>
        <div className="flex gap-2">
          <button onClick={() => router.back()} className="px-4 py-2 rounded-xl bg-inke border border-line text-silver text-sm">
            Kembali
          </button>
          <Link href={`/watch/${slug}`} className="px-4 py-2 rounded-xl bg-gold text-ink text-sm font-semibold">
            <i className="fa-solid fa-play text-xs mr-1.5" />
            Tetap Tonton
          </Link>
        </div>
      </div>
    );

  const isSeries = m.type === 'Series';
  const synopsis = synopsisId;
  const seasons = m.seasons || [];
  const notReleased = !!m.status && m.status.toLowerCase() !== 'released' && !isSeries;
  const cast = m.castDetailed || [];

  const toggleRemind = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    vibrate();
    if (reminded) {
      removeReminder(slug);
      setReminded(false);
      return;
    }
    setRemState('requesting');
    const r = await addReminder({ slug, title: m.title, poster: m.poster || null, releaseDate: m.releaseDate || '' });
    setReminded(true);
    setRemState(r === 'unsupported' ? 'unsupported' : r === 'denied' ? 'denied' : 'idle');
  };

  return (
    <div className="min-h-screen" style={{ backgroundImage: tint ? `linear-gradient(to bottom, ${tint} 0%, transparent 420px)` : undefined }}>
      <div
        className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4"
        style={{ background: 'linear-gradient(to bottom, rgba(8,10,12,0.92), transparent)' }}
      >
        <button
          onClick={() => router.back()}
          aria-label="Kembali"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-silver active:scale-90 transition-all duration-200"
          style={glassBtn}
        >
          <i className="fa-solid fa-arrow-left text-sm" />
        </button>
        <button
          onClick={() => {
            vibrate();
            setShareOpen(true);
          }}
          aria-label="Bagikan"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-silver active:scale-90 transition-all duration-200"
          style={glassBtn}
        >
          <i className="fa-solid fa-share-nodes text-sm" />
        </button>
      </div>

      <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16/9', maxHeight: 280 }}>
        {m.backdrop || m.poster ? (
          <img
            ref={imgRef}
            src={m.backdrop || m.poster || ''}
            alt={m.title}
            className="w-full h-full object-cover will-change-transform"
            style={{ opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.4s' }}
            onLoad={() => setImgLoaded(true)}
          />
        ) : (
          <div className="w-full h-full bg-inke flex items-center justify-center">
            <i className="fa-solid fa-clapperboard text-5xl text-dim" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
        {!isSeries &&
          (notReleased ? (
            <button
              onClick={toggleRemind}
              className={`absolute bottom-4 right-4 flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm shadow-lg transition-colors ${
                reminded ? 'bg-gold text-ink' : 'bg-ink/80 backdrop-blur border border-gold/50 text-gold'
              }`}
            >
              <i className="fa-solid fa-bell text-xs" />
              {remState === 'requesting' ? 'Memproses...' : reminded ? 'Diingatkan' : 'Ingatkan Saya'}
            </button>
          ) : (
            <Link
              href={`/watch/${slug}`}
              className="absolute bottom-4 right-4 flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gold text-ink font-bold text-sm shadow-lg"
            >
              <i className="fa-solid fa-play text-xs" /> Tonton
            </Link>
          ))}
      </div>

      <div className="px-4 pt-4 pb-6">
        <div className="flex gap-3 mb-4">
          {m.poster && (
            <img src={m.poster} alt={m.title} className="w-20 rounded-xl flex-shrink-0 shadow-lg" style={{ aspectRatio: '2/3', objectFit: 'cover' }} />
          )}
          <div className="flex-1 min-w-0">
            {isSeries && (
              <span className="inline-block px-2 py-0.5 rounded-md bg-gold/20 text-gold text-[10px] font-bold mb-1 uppercase">Series</span>
            )}
            <h1 className="font-display font-bold text-xl leading-tight mb-1">{m.title}</h1>
            {m.tagline && <p className="text-dim text-xs italic mb-2">{m.tagline}</p>}
            <div className="flex flex-wrap gap-2">
              {m.rating && (
                <div className="flex items-center gap-1">
                  <i className="fa-solid fa-star text-[11px] text-gold" />
                  <span className="text-gold font-bold text-sm">{m.rating}</span>
                </div>
              )}
              {m.year && <span className="text-silver text-xs bg-ghost px-2 py-0.5 rounded-lg">{m.year}</span>}
              {m.duration && <span className="text-silver text-xs bg-ghost px-2 py-0.5 rounded-lg">{m.duration}</span>}
              {m.ageRating && (
                <span className="text-silver text-xs bg-ghost px-2 py-0.5 rounded-lg border border-line/60 font-semibold">{m.ageRating}</span>
              )}
            </div>
          </div>
        </div>

        {m.genres && m.genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {m.genres.map((g) => (
              <Link
                key={g}
                href={`/genre/${g.toLowerCase().replace(/[\s_]/g, '-')}`}
                className="px-2.5 py-1 rounded-xl bg-ghost border border-line text-silver text-xs hover:border-gold/50 hover:text-gold transition-colors"
              >
                {g}
              </Link>
            ))}
          </div>
        )}

        {m.watchProviders && m.watchProviders.length > 0 && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-dim text-xs">Juga di:</span>
            {m.watchProviders.map((p, i) => (
              <div key={p.id ?? p.name ?? i} className="flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full bg-ghost border border-line">
                {p.logo ? (
                  <img src={p.logo} alt={p.name} className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-inke flex items-center justify-center">
                    <i className="fa-solid fa-tv text-[8px] text-dim" />
                  </div>
                )}
                <span className="text-silver text-[11px] font-medium">{p.name}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mb-5 p-3.5 rounded-xl bg-inke border border-line">
          <RatingStars slug={slug} tmdbRating={m.rating || null} voteCount={m.voteCount} />
        </div>

        <div className="mb-5">
          <h2 className="font-semibold text-sm mb-2">Sinopsis</h2>
          {synopsis ? (
            <>
              <p className={`text-silver text-sm leading-relaxed ${expanded ? '' : 'line-clamp-4'}`}>{synopsis}</p>
              {synopsis.length > 200 && (
                <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-gold text-xs mt-1.5 font-medium">
                  <i className={`fa-solid ${expanded ? 'fa-chevron-up' : 'fa-chevron-down'} text-[10px]`} />
                  {expanded ? 'Lebih sedikit' : 'Selengkapnya'}
                </button>
              )}
            </>
          ) : (
            <p className="text-dim text-sm italic">Sinopsis belum tersedia untuk judul ini.</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          {m.director && (
            <InfoBox icon="fa-clapperboard" label="Sutradara">
              {m.director}
            </InfoBox>
          )}
          {m.status && (
            <InfoBox icon="fa-circle-dot" label="Status">
              {m.status}
            </InfoBox>
          )}
          {isSeries && seasons.length > 0 && (
            <InfoBox icon="fa-layer-group" label="Season">
              {seasons.filter((s) => s.season_number > 0).length || seasons.length} Season
            </InfoBox>
          )}
          {m.releaseDate && (
            <InfoBox icon="fa-calendar-days" label="Rilis">
              {new Date(m.releaseDate + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </InfoBox>
          )}
        </div>

        {cast.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <i className="fa-solid fa-users text-sm text-gold" />
                <h2 className="font-semibold text-sm">Pemeran</h2>
              </div>
              {cast.length > 8 && (
                <button onClick={() => setCastOpen(true)} className="text-gold text-xs font-medium flex items-center gap-1">
                  Lihat Selengkapnya <i className="fa-solid fa-chevron-right text-[9px]" />
                </button>
              )}
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {cast.slice(0, 12).map((c, i) => (
                <button key={c.name + i} onClick={() => setCastOpen(true)} className="flex flex-col items-center w-16 flex-shrink-0 text-center">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-ghost border border-line mb-1.5">
                    {c.photo ? (
                      <img src={c.photo} alt={c.name} loading="lazy" className="w-full h-full object-cover" onError={hideOnError} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <i className="fa-solid fa-user text-sm text-dim" />
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] font-medium text-[#E8EDF2] line-clamp-2 leading-tight">{c.name}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {m.trailer && (
          <a
            href={m.trailer}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 w-full py-3 rounded-2xl bg-inke border border-line text-silver text-sm font-medium justify-center mb-4 hover:border-gold/50 hover:text-gold transition-colors"
          >
            <i className="fa-brands fa-youtube text-red-500" /> Tonton Trailer
          </a>
        )}

        {isSeries && seasons.length > 0 && (
          <div className="mb-5">
            <h2 className="font-semibold text-sm mb-3">Episode</h2>
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3 pb-1">
              {seasons.map((s) => (
                <button
                  key={s.season_number}
                  onClick={() => setSeason(s.season_number)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    season === s.season_number ? 'bg-gold text-ink' : 'bg-inke border border-line text-silver'
                  }`}
                >
                  {s.name || `Season ${s.season_number}`}
                </button>
              ))}
            </div>
            {epLoading ? (
              <div className="flex justify-center py-6">
                <i className="fa-solid fa-circle-notch fa-spin text-xl text-gold" />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {episodes.map((ep) => (
                  <div
                    key={ep.episode}
                    className="flex flex-col gap-2 p-3 rounded-xl bg-inke border border-line hover:border-gold/40 transition-colors group"
                  >
                    <Link href={`/watch/${slug}?season=${ep.season}&episode=${ep.episode}`} className="flex items-center gap-3">
                      {ep.still ? (
                        <img src={ep.still} alt={ep.title} className="w-16 h-10 object-cover rounded-lg flex-shrink-0" onError={hideOnError} />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-ghost flex items-center justify-center flex-shrink-0 group-hover:bg-gold/20 transition-colors">
                          <span className="text-xs font-bold text-gold">{ep.episode}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#E8EDF2] truncate">{ep.title || `Episode ${ep.episode}`}</p>
                        {ep.runtime && <p className="text-[10px] text-dim mt-0.5">{ep.runtime}</p>}
                      </div>
                      <i className="fa-solid fa-play text-[11px] text-dim group-hover:text-gold transition-colors flex-shrink-0" />
                    </Link>
                    <div className="pl-[76px]">
                      <RatingStars slug={slug} tmdbRating={null} season={ep.season} episode={ep.episode} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!isSeries &&
          (notReleased ? (
            <button
              onClick={toggleRemind}
              className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-sm transition-colors ${
                reminded ? 'bg-gold text-ink' : 'bg-inke border border-gold/50 text-gold'
              }`}
            >
              <i className="fa-solid fa-bell text-xs" />
              {remState === 'requesting' ? 'Memproses...' : reminded ? 'Diingatkan — Tersimpan' : 'Ingatkan Saya Saat Rilis'}
            </button>
          ) : (
            <Link
              href={`/watch/${slug}`}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-gold text-ink font-bold text-sm"
            >
              <i className="fa-solid fa-play text-xs" /> Tonton Sekarang
            </Link>
          ))}
        {!isSeries && notReleased && (remState === 'denied' || remState === 'unsupported') && (
          <p className="text-[11px] text-dim text-center mt-2">
            {remState === 'denied' ? 'Tersimpan (izin notifikasi ditolak)' : 'Tersimpan (browser tidak dukung notifikasi)'}
          </p>
        )}
      </div>

      {m.recommendations && m.recommendations.length > 0 && (
        <MovieRow title="Mungkin Kamu Suka" eyebrow="Direkomendasikan" eyebrowIcon="fa-solid fa-wand-magic-sparkles" movies={m.recommendations} />
      )}

      {castOpen && cast.length > 0 && <CastModal cast={cast} movieTitle={m.title} onClose={() => setCastOpen(false)} />}
      {shareOpen && <ShareModal title={m.title} url={`${SITE_URL}/movie/${slug}`} onClose={() => setShareOpen(false)} />}
    </div>
  );
}
