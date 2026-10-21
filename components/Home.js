'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import MovieRow from './MovieRow';
import { hideOnError } from './MovieCard';
import { GENRES } from '@/lib/genres';
import { SITE_NAME } from '@/lib/site';
import {
  getHistory,
  removeHistory,
  isReminded,
  addReminder,
  removeReminder,
  checkReminders,
  vibrate,
} from '@/lib/storage';

/* ---------- Lanjutkan Menonton ---------- */
function ContinueWatching() {
  const [list, setList] = useState(null);
  useEffect(() => setList(getHistory()), []);
  const remove = (e, slug) => {
    e.preventDefault();
    e.stopPropagation();
    removeHistory(slug);
    setList((l) => (l ? l.filter((x) => x.slug !== slug) : l));
  };
  if (!list || list.length === 0) return null;
  return (
    <section className="mb-7">
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="font-display font-semibold text-base tracking-tight">Lanjutkan Menonton</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
        {list.map((m) => {
          const href =
            m.type === 'Series' && m.season && m.episode
              ? `/watch/${m.slug}?season=${m.season}&episode=${m.episode}`
              : `/watch/${m.slug}`;
          return (
            <div key={m.slug} className="w-36 flex-shrink-0 group relative">
              <Link href={href} className="block active:scale-[0.96] transition-transform duration-150">
                <div className="poster-card relative rounded-xl overflow-hidden bg-inkl aspect-[2/3] mb-2">
                  {m.poster ? (
                    <img
                      src={m.poster}
                      alt={m.title}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={hideOnError}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-inke">
                      <i className={`${m.type === 'Series' ? 'fa-solid fa-tv' : 'fa-solid fa-film'} text-2xl text-dim`} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  {m.type === 'Series' && m.season && m.episode && (
                    <div className="absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded-md bg-inkb/90 text-silver text-[9px] font-semibold leading-none pointer-events-none">
                      S{m.season} E{m.episode}
                    </div>
                  )}
                </div>
                <p className="text-xs font-medium text-[#E8EDF2] line-clamp-2 leading-tight group-hover:text-gold transition-colors">{m.title}</p>
                {m.year && <p className="text-[10px] text-dim mt-0.5">{m.year}</p>}
              </Link>
              <button
                type="button"
                onClick={(e) => remove(e, m.slug)}
                aria-label="Hapus dari daftar"
                className="absolute top-1.5 right-1.5 z-20 w-6 h-6 rounded-full flex items-center justify-center text-white"
                style={{ background: 'rgba(0,0,0,0.65)' }}
              >
                <i className="fa-solid fa-xmark text-[10px]" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- Pilihan Editor (featured) ---------- */
function Featured({ movie: m, loading, eyebrow = 'Pilihan Editor' }) {
  if (loading)
    return (
      <section className="mb-7 px-4">
        <div className="skeleton rounded-2xl w-full" style={{ aspectRatio: '3/2' }} />
      </section>
    );
  if (!m) return null;
  return (
    <section className="mb-7 px-4">
      <Link href={`/movie/${m.slug}`} className="relative block w-full rounded-2xl overflow-hidden group" style={{ aspectRatio: '3/2' }}>
        {(m.backdrop || m.poster) && (
          <img
            src={m.backdrop || m.poster || ''}
            alt={m.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/40 via-transparent to-transparent" />
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gold text-ink text-[10px] font-bold uppercase tracking-wide">
            <i className="fa-solid fa-star text-[9px]" /> {eyebrow}
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {m.type && (
            <span className="inline-block px-2 py-0.5 rounded-md bg-ghost border border-line text-silver text-[9px] font-bold mb-2 uppercase">
              {m.type}
            </span>
          )}
          <h3 className="font-display font-bold text-lg leading-tight mb-1.5 line-clamp-2">{m.title}</h3>
          <div className="flex items-center gap-3 mb-2">
            {m.rating && (
              <div className="flex items-center gap-1">
                <i className="fa-solid fa-star text-[11px] text-gold" />
                <span className="text-gold text-xs font-semibold">{m.rating}</span>
              </div>
            )}
            {m.year && <span className="text-silver text-xs">{m.year}</span>}
          </div>
          {m.overview && <p className="text-silver/90 text-xs leading-relaxed line-clamp-2 mb-3 max-w-md">{m.overview}</p>}
          <div className="flex items-center gap-1.5 text-gold text-xs font-semibold">
            <i className="fa-solid fa-play text-[10px]" /> Tonton Sekarang
          </div>
        </div>
      </Link>
    </section>
  );
}

/* ---------- Top 10 ---------- */
const rankStyle = { fontSize: 74, WebkitTextStroke: '2px #2A2A30', marginRight: -20, marginBottom: -6 };

function RankCard({ movie: m, rank }) {
  return (
    <Link href={`/movie/${m.slug}`} className="flex-shrink-0 flex items-end group" style={{ width: 108 }}>
      <span className="font-display font-black text-transparent flex-shrink-0 leading-none select-none" style={rankStyle}>
        {rank}
      </span>
      <div className="w-20 flex-shrink-0">
        <div className="poster-card relative rounded-lg overflow-hidden bg-inkl aspect-[2/3] mb-2">
          {m.poster ? (
            <img
              src={m.poster}
              alt={m.title}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={hideOnError}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-inke">
              <i className="fa-solid fa-film text-lg text-dim" />
            </div>
          )}
        </div>
        <p className="text-[11px] font-medium text-[#E8EDF2] line-clamp-2 leading-tight group-hover:text-gold transition-colors">{m.title}</p>
      </div>
    </Link>
  );
}

function RankSkeleton({ rank }) {
  return (
    <div className="flex-shrink-0 flex items-end" style={{ width: 108 }}>
      <span className="font-display font-black text-transparent flex-shrink-0 leading-none" style={rankStyle}>
        {rank}
      </span>
      <div className="w-20 flex-shrink-0">
        <div className="skeleton rounded-lg aspect-[2/3] mb-2" />
      </div>
    </div>
  );
}

function Top10({ title, movies, loading, eyebrow, eyebrowIcon }) {
  const top = movies.slice(0, 10);
  if (!loading && top.length === 0) return null;
  return (
    <section className="mb-7">
      <div className="flex items-center justify-between px-4 mb-3">
        <div>
          {eyebrow && (
            <p className="flex items-center gap-1.5 text-gold text-[10px] font-extrabold tracking-wide mb-0.5">
              {eyebrowIcon && <i className={`${eyebrowIcon} text-[10px]`} />} {eyebrow.toUpperCase()}
            </p>
          )}
          <h2 className="font-display font-semibold text-base tracking-tight">{title}</h2>
        </div>
      </div>
      <div className="flex gap-1 overflow-x-auto no-scrollbar px-4 pb-1">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <RankSkeleton key={i} rank={i + 1} />)
          : top.map((m, i) => <RankCard key={m.slug} movie={m} rank={i + 1} />)}
      </div>
    </section>
  );
}

/* ---------- Segera Datang ---------- */
function daysUntil(date) {
  if (!date) return null;
  const t = new Date(date + 'T00:00:00');
  const n = new Date();
  n.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((t.getTime() - n.getTime()) / 864e5));
}

function UpcomingCard({ movie: m, onPermission }) {
  const [reminded, setReminded] = useState(false);
  const [state, setState] = useState('idle');
  useEffect(() => setReminded(isReminded(m.slug)), [m.slug]);
  const d = daysUntil(m.releaseDate);
  const toggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    vibrate();
    if (reminded) {
      removeReminder(m.slug);
      setReminded(false);
      return;
    }
    setState('requesting');
    const r = await addReminder({ slug: m.slug, title: m.title, poster: m.poster || null, releaseDate: m.releaseDate || '' });
    setReminded(true);
    setState('idle');
    onPermission(r === 'unsupported' ? 'unsupported' : r === 'granted' ? 'granted' : 'denied');
  };
  return (
    <div className="w-36 flex-shrink-0 group">
      <Link href={`/movie/${m.slug}`} className="block">
        <div className="poster-card relative rounded-xl overflow-hidden bg-inkl aspect-[2/3] mb-2">
          {m.poster ? (
            <img
              src={m.poster}
              alt={m.title}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={hideOnError}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-inke">
              <i className="fa-solid fa-film text-2xl text-dim" />
            </div>
          )}
        </div>
      </Link>
      {d !== null && (
        <div className="flex items-center gap-1 mb-1">
          <i className="fa-solid fa-clock text-[9px] text-gold" />
          <span className="text-gold text-[10px] font-bold">{d === 0 ? 'Tayang hari ini' : `${d} hari lagi`}</span>
        </div>
      )}
      <p className="text-xs font-medium text-[#E8EDF2] line-clamp-2 leading-tight mb-1">
        <Link href={`/movie/${m.slug}`} className="group-hover:text-gold transition-colors">
          {m.title}
        </Link>
      </p>
      {m.releaseDate && (
        <p className="text-[10px] text-dim mb-1.5">
          {new Date(m.releaseDate + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      )}
      <button
        onClick={toggle}
        disabled={state === 'requesting'}
        className={`w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold transition-colors ${
          reminded ? 'bg-gold text-ink' : 'bg-ghost border border-line text-silver'
        }`}
      >
        <i className="fa-solid fa-bell text-[9px]" />
        {state === 'requesting' ? 'Memproses...' : reminded ? 'Diingatkan' : 'Ingatkan Saya'}
      </button>
    </div>
  );
}

function Upcoming({ movies, loading }) {
  const [perm, setPerm] = useState(null);
  if (!loading && movies.length === 0) return null;
  return (
    <section className="mb-7">
      <div className="flex items-center justify-between px-4 mb-3">
        <div>
          <p className="flex items-center gap-1.5 text-gold text-[10px] font-extrabold tracking-wide mb-0.5">
            <i className="fa-solid fa-calendar-days text-[10px]" /> AKAN TAYANG
          </p>
          <h2 className="font-display font-semibold text-base tracking-tight">Segera Datang</h2>
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-36 flex-shrink-0">
                <div className="skeleton rounded-xl aspect-[2/3] mb-2" />
                <div className="skeleton h-3 rounded w-4/5 mb-1" />
                <div className="skeleton h-2.5 rounded w-2/5" />
              </div>
            ))
          : movies.map((m) => <UpcomingCard key={m.slug} movie={m} onPermission={(r) => setPerm((p) => p ?? r)} />)}
      </div>
      {perm === 'denied' && (
        <p className="px-4 mt-2 text-[10px] text-dim">
          Film tersimpan di daftar. Untuk dapat notifikasi saat tayang, izinkan notifikasi lewat pengaturan browser kamu.
        </p>
      )}
      {perm === 'unsupported' && (
        <p className="px-4 mt-2 text-[10px] text-dim">Film tersimpan di daftar. Notifikasi push tidak didukung di browser ini.</p>
      )}
    </section>
  );
}

/* ---------- Hero slider ---------- */
const SLIDE_MS = 6000;
function Hero({ movies }) {
  const [idx, setIdx] = useState(0);
  const [loaded, setLoaded] = useState([]);
  const [fading, setFading] = useState(false);
  const [tick, setTick] = useState(0);
  const timer = useRef(null);
  const tx = useRef(null);
  const ty = useRef(null);
  const touching = useRef(false);

  const go = useCallback(
    (i) => {
      if (fading) return;
      setFading(true);
      setTimeout(() => {
        setIdx(i);
        setFading(false);
        setTick((t) => t + 1);
      }, 350);
    },
    [fading]
  );
  const next = useCallback(() => go((idx + 1) % movies.length), [idx, movies.length, go]);
  const prev = useCallback(() => go((idx - 1 + movies.length) % movies.length), [idx, movies.length, go]);

  useEffect(() => {
    if (movies.length <= 1) return;
    const loop = () => {
      timer.current = setTimeout(() => {
        if (!touching.current) next();
        loop();
      }, SLIDE_MS);
    };
    loop();
    return () => timer.current && clearTimeout(timer.current);
  }, [next, movies.length]);

  useEffect(() => setLoaded(Array(movies.length).fill(false)), [movies.length]);

  if (!movies.length) return null;
  const cur = movies[idx];

  return (
    <div className="relative w-full mb-6">
      {movies.length > 1 && (
        <div className="relative z-20 h-1 flex gap-0.5 bg-ink">
          {movies.map((_, i) => (
            <button key={i} onClick={() => go(i)} aria-label={`Slide ${i + 1}`} className="flex-1 h-full overflow-hidden">
              {i === idx && <div key={tick} className="h-full bg-gold" style={{ animation: `heroProgress ${SLIDE_MS}ms linear forwards` }} />}
              {i < idx && <div className="h-full bg-gold/70 w-full" />}
            </button>
          ))}
        </div>
      )}
      <section
        className="relative w-full overflow-hidden"
        style={{ height: '78vw', maxHeight: 460, minHeight: 320 }}
        onTouchStart={(e) => {
          tx.current = e.touches[0].clientX;
          ty.current = e.touches[0].clientY;
          touching.current = true;
        }}
        onTouchEnd={(e) => {
          touching.current = false;
          if (tx.current === null || ty.current === null) return;
          const dx = e.changedTouches[0].clientX - tx.current;
          const dy = Math.abs(e.changedTouches[0].clientY - ty.current);
          if (Math.abs(dx) > 40 && dy < 60) dx < 0 ? next() : prev();
          tx.current = null;
          ty.current = null;
        }}
      >
        {movies.map((m, i) => (
          <div
            key={m.slug}
            className="absolute inset-0 transition-opacity duration-500"
            style={{ opacity: i === idx ? 1 : 0, pointerEvents: i === idx ? 'auto' : 'none' }}
          >
            {(m.backdrop || m.poster) && (
              <img
                src={m.backdrop || m.poster || ''}
                alt={m.title}
                className="absolute inset-0 w-full h-full object-cover"
                fetchPriority={i === 0 ? 'high' : 'auto'}
                loading={i === 0 ? 'eager' : 'lazy'}
                style={{
                  opacity: loaded[i] ? 1 : 0,
                  transition: 'opacity 0.6s, transform 8s ease-out',
                  transform: i !== idx || fading ? 'scale(1)' : 'scale(1.06)',
                }}
                onLoad={() =>
                  setLoaded((l) => {
                    const c = [...l];
                    c[i] = true;
                    return c;
                  })
                }
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/60 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-ink via-ink/70 to-transparent" />
          </div>
        ))}
        <div
          className="absolute bottom-0 left-0 p-5 max-w-[85%] z-10"
          style={{
            opacity: fading ? 0 : 1,
            transform: fading ? 'translateY(6px)' : 'translateY(0)',
            transition: 'opacity 0.3s, transform 0.3s',
          }}
        >
          {cur.type && (
            <span className="inline-block px-2 py-0.5 rounded-md bg-gold text-ink text-[10px] font-bold mb-3 uppercase tracking-wide">
              {cur.type}
            </span>
          )}
          {cur.titleLogo ? (
            <div className="relative w-full max-w-[260px] h-16 mb-3 drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
              <img src={cur.titleLogo} alt={cur.title} className="absolute inset-0 w-full h-full object-contain object-left" />
            </div>
          ) : (
            <h1 className="font-display font-bold text-2xl leading-tight mb-2 line-clamp-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
              {cur.title}
            </h1>
          )}
          <div className="flex items-center gap-2 mb-4">
            {cur.rating && (
              <div className="flex items-center gap-1">
                <i className="fa-solid fa-star text-[11px] text-gold" />
                <span className="text-gold text-xs font-semibold">{cur.rating}</span>
              </div>
            )}
            {cur.year && <span className="text-silver text-xs">{cur.year}</span>}
          </div>
          <div className="flex gap-2">
            <Link
              href={`/movie/${cur.slug}`}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gold text-ink text-sm font-bold shadow-lg shadow-gold/20 active:scale-95 transition-transform"
            >
              <i className="fa-solid fa-play text-[11px]" /> Tonton
            </Link>
            <Link
              href={`/movie/${cur.slug}`}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur border border-white/20 text-white text-sm font-medium active:scale-95 transition-transform"
            >
              <i className="fa-solid fa-circle-info text-[11px]" /> Detail
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---------- Genre marquee ---------- */
function GenreMarquee() {
  const list = [...GENRES, ...GENRES];
  return (
    <section className="mb-7">
      <div className="flex items-center justify-between mb-3 px-4">
        <div>
          <p className="flex items-center gap-1.5 text-gold text-[10px] font-extrabold tracking-wide mb-0.5">
            <i className="fa-solid fa-layer-group text-[10px]" /> JELAJAHI KATEGORI
          </p>
          <h2 className="font-display font-semibold text-base tracking-tight">Genre</h2>
        </div>
        <Link href="/genre" className="flex items-center gap-1.5 text-gold text-xs font-medium">
          Semua <i className="fa-solid fa-chevron-right text-[10px]" />
        </Link>
      </div>
      <div className="overflow-hidden px-4">
        <div className="genre-marquee-track gap-2">
          {list.map((g, i) => (
            <Link
              key={g.slug + i}
              href={`/genre/${g.slug}`}
              className="genre-chip flex-shrink-0 flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-2xl text-xs font-semibold"
              style={{ '--g1': g.color, '--g2': g.color2, color: '#E8EDF2' }}
            >
              <span className="genre-icon-dot w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
                <i className={`${g.icon} text-[10px] text-[#080A0C]`} />
              </span>
              {g.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Page ---------- */
function useList(url) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(url)
      .then((r) => r.json())
      .then((d) => setData(d.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [url]);
  return [data, loading];
}

export default function Home() {
  const [hero, heroLoading] = useList('/api/movies/hero');
  const [trending, trLoading] = useList('/api/movies/trending');
  const [popular, popLoading] = useList('/api/movies/popular?type=all');
  const [top, topLoading] = useList('/api/movies/top-rated?type=movie');
  const [latest, latLoading] = useList('/api/movies/latest?type=all');
  const [upcoming, upLoading] = useList('/api/movies/upcoming');

  useEffect(() => {
    checkReminders(SITE_NAME);
  }, []);

  const featured =
    [...trending]
      .filter((m) => m.backdrop && m.overview)
      .sort((a, b) => parseFloat(b.rating || '0') - parseFloat(a.rating || '0'))[0] || null;

  return (
    <div>
      {heroLoading ? (
        <div className="skeleton mb-6" style={{ height: '78vw', maxHeight: 460, minHeight: 320 }} />
      ) : hero.length ? (
        <Hero movies={hero} />
      ) : (
        <div className="h-14" />
      )}
      <ContinueWatching />
      <GenreMarquee />
      <MovieRow
        title="Trending Minggu Ini"
        eyebrow="Lagi Ramai Ditonton"
        eyebrowIcon="fa-solid fa-fire"
        movies={trending}
        loading={trLoading}
        moreHref="/popular"
      />
      <Featured movie={featured} loading={trLoading} />
      <MovieRow
        title="Sedang Tayang"
        eyebrow="Update Terbaru"
        eyebrowIcon="fa-solid fa-clapperboard"
        movies={latest}
        loading={latLoading}
        moreHref="/latest"
      />
      <Top10 title="Top 10 Populer Hari Ini" eyebrow="Paling Dicari" eyebrowIcon="fa-solid fa-ranking-star" movies={popular} loading={popLoading} />
      <MovieRow
        title="Rating Tertinggi"
        eyebrow="Pilihan Kritikus"
        eyebrowIcon="fa-solid fa-star"
        movies={top}
        loading={topLoading}
        moreHref="/top-rated"
      />
      <Upcoming movies={upcoming} loading={upLoading} />
    </div>
  );
}
