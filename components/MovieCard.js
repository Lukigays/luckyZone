'use client';
import Link from 'next/link';

export function hideOnError(e) {
  e.target.style.display = 'none';
}

export default function MovieCard({ movie: m, size = 'md' }) {
  const isSeries = m.type === 'Series' || m.type === 'series';
  const w = size === 'sm' ? 'w-28' : size === 'lg' ? 'w-44' : 'w-36';
  return (
    <Link href={`/movie/${m.slug}`} className={`${w} flex-shrink-0 group active:scale-[0.96] transition-transform duration-150`}>
      <div className="poster-card relative rounded-xl overflow-hidden bg-inkl aspect-[2/3] mb-2 shadow-lg shadow-black/30">
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
            <i className={`${isSeries ? 'fa-solid fa-tv' : 'fa-solid fa-film'} text-2xl text-dim`} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        {m.quality && (
          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-gold/90 text-ink text-[9px] font-bold leading-none">
            {m.quality}
          </div>
        )}
        {isSeries && (
          <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-inkb/90 text-silver text-[9px] font-semibold leading-none">
            SERIES
          </div>
        )}
        {m.rating && (
          <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1">
            <i className="fa-solid fa-star text-[9px] text-gold" />
            <span className="text-[10px] text-gold font-semibold">{m.rating}</span>
          </div>
        )}
      </div>
      <p className="text-xs font-medium text-[#E8EDF2] line-clamp-2 leading-tight group-hover:text-gold transition-colors">{m.title}</p>
      {m.year && <p className="text-[10px] text-dim mt-0.5">{m.year}</p>}
    </Link>
  );
}

export function CardSkeleton({ size = 'md' }) {
  const w = size === 'sm' ? 'w-28' : size === 'lg' ? 'w-44' : 'w-36';
  return (
    <div className={`${w} flex-shrink-0`}>
      <div className="skeleton rounded-xl aspect-[2/3] mb-2" />
      <div className="skeleton h-3 rounded w-4/5 mb-1" />
      <div className="skeleton h-2.5 rounded w-2/5" />
    </div>
  );
}
