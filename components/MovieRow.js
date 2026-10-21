'use client';
import Link from 'next/link';
import MovieCard, { CardSkeleton } from './MovieCard';

export default function MovieRow({ title, movies = [], moreHref, loading, size = 'md', eyebrow, eyebrowIcon }) {
  return (
    <section className="mb-7">
      <div className="flex items-center justify-between px-4 mb-3">
        <div>
          {eyebrow && (
            <p className="flex items-center gap-1.5 text-gold text-[10px] font-bold uppercase tracking-wider mb-0.5">
              {eyebrowIcon && <i className={`${eyebrowIcon} text-[10px]`} />}
              {eyebrow}
            </p>
          )}
          <h2 className="font-display font-semibold text-base tracking-tight">{title}</h2>
        </div>
        {moreHref && (
          <Link href={moreHref} className="flex items-center gap-1.5 text-gold text-xs font-medium flex-shrink-0">
            Semua <i className="fa-solid fa-chevron-right text-[10px]" />
          </Link>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} size={size} />)
        ) : movies.length === 0 ? (
          <p className="text-dim text-sm py-6 text-center w-full">Tidak ada konten</p>
        ) : (
          movies.map((m) => <MovieCard key={m.slug} movie={m} size={size} />)
        )}
      </div>
    </section>
  );
}
