'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { GENRES } from '@/lib/genres';

export default function GenreGrid() {
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? GENRES.filter((g) => g.label.toLowerCase().includes(s)) : GENRES;
  }, [q]);
  return (
    <div>
      <div className="relative px-4 mb-4">
        <i className="fa-solid fa-magnifying-glass absolute left-7 top-1/2 -translate-y-1/2 text-dim text-sm pointer-events-none" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari genre..."
          className="w-full h-11 pl-10 pr-4 rounded-2xl bg-inke border border-line text-sm text-[#E8EDF2] placeholder-dim focus:outline-none focus:border-gold/50 transition-colors"
        />
      </div>
      {list.length === 0 ? (
        <p className="text-center text-dim text-sm py-10">Genre &quot;{q}&quot; tidak ditemukan</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4">
          {list.map((g) => (
            <Link
              key={g.slug}
              href={`/genre/${g.slug}`}
              className="genre-card flex items-center gap-3 p-3.5 rounded-2xl"
              style={{ '--g1': g.color, '--g2': g.color2 }}
            >
              <div className="genre-icon-bubble w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                <i className={`${g.icon} text-base text-[#080A0C]`} />
              </div>
              <p className="font-semibold text-sm text-[#E8EDF2] leading-tight">{g.label}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
