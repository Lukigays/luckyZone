'use client';
import { useState } from 'react';
import BackButton from './BackButton';
import InfiniteGrid from './InfiniteGrid';
import { GENRES, genreIdFor } from '@/lib/genres';

export default function Popular() {
  const [type, setType] = useState('movie');
  const [genre, setGenre] = useState('all');
  const list = GENRES.filter((g) => genreIdFor(g, type) !== undefined);
  const g = list.find((x) => x.slug === genre);
  const gid = g ? genreIdFor(g, type) : undefined;
  const params = gid ? { type, genre: String(gid), sort: 'popularity.desc' } : { type };

  return (
    <div className="py-4">
      <div className="flex items-center gap-3 px-4 mb-4">
        <BackButton />
        <h1 className="font-display font-bold text-lg">Film Populer</h1>
      </div>
      <div className="flex gap-2 px-4 mb-3">
        {['movie', 'tv'].map((t) => (
          <button
            key={t}
            onClick={() => {
              setType(t);
              setGenre('all');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
              type === t ? 'bg-gold text-ink' : 'bg-inke border border-line text-silver'
            }`}
          >
            {t === 'movie' ? 'Film' : 'Series'}
          </button>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 mb-5 pb-1">
        <button
          onClick={() => setGenre('all')}
          className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
            genre === 'all' ? 'bg-gold text-ink border-gold' : 'bg-inke border-line text-silver'
          }`}
        >
          Semua Genre
        </button>
        {list.map((x) => (
          <button
            key={x.slug}
            onClick={() => setGenre(x.slug)}
            className="flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors"
            style={
              genre === x.slug
                ? { background: x.color, borderColor: x.color, color: '#080A0C' }
                : { background: x.color + '15', borderColor: x.color + '40', color: x.color }
            }
          >
            {x.label}
          </button>
        ))}
      </div>
      <InfiniteGrid endpoint={gid ? '/api/movies/discover' : '/api/movies/popular'} extraParams={params} />
    </div>
  );
}
