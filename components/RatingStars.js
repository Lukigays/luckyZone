'use client';
import { useEffect, useState } from 'react';
import { vibrate } from '@/lib/storage';

// Rating pribadi (disimpan lokal di perangkat).
const KEY = 'lz_user_ratings';
function readAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

function fmt(n) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

export default function RatingStars({ slug, tmdbRating, voteCount, season, episode }) {
  const id = season ? `${slug}:${season}:${episode}` : slug;
  const [val, setVal] = useState(null);
  const [hover, setHover] = useState(null);
  const [status, setStatus] = useState('idle');
  const [pop, setPop] = useState(null);

  useEffect(() => setVal(readAll()[id] ?? null), [id]);

  const pick = (n) => {
    vibrate();
    const all = readAll();
    if (val === n) {
      delete all[id];
      setVal(null);
      setStatus('idle');
    } else {
      all[id] = n;
      setVal(n);
      setPop(n);
      setStatus('saved');
      setTimeout(() => setPop(null), 600);
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(all));
    } catch {}
  };
  const shown = hover ?? val ?? 0;

  return (
    <div className="flex flex-col gap-2">
      {tmdbRating && (
        <div className="flex items-center gap-1.5">
          <i className="fa-solid fa-star text-gold text-sm" />
          <span className="text-[#E8EDF2] font-bold text-base">{tmdbRating}</span>
          <span className="text-dim text-sm">/ 10</span>
          {typeof voteCount === 'number' && voteCount > 0 && <span className="text-dim text-xs ml-1">· {fmt(voteCount)} ratings</span>}
        </div>
      )}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1" onMouseLeave={() => setHover(null)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => pick(n)}
              onMouseEnter={() => setHover(n)}
              className="p-0.5 disabled:opacity-50 transition-transform active:scale-90"
              aria-label={`Beri rating ${n} bintang`}
            >
              <i
                className={`fa-star text-lg transition-colors ${n <= shown ? 'fa-solid text-gold' : 'fa-regular text-dim'} ${
                  pop !== null && n <= pop ? 'star-pop' : ''
                }`}
                style={pop !== null && n <= pop ? { animationDelay: `${(n - 1) * 40}ms` } : undefined}
              />
            </button>
          ))}
        </div>
        {status === 'saved' && val && <span className="text-gold text-xs font-medium">Rating tersimpan</span>}
      </div>
      {val && !season && <p className="text-dim text-[11px]">Ketuk bintang yang sama untuk membatalkan rating.</p>}
    </div>
  );
}
