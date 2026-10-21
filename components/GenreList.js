'use client';
import { useEffect, useMemo, useState } from 'react';
import InfiniteGrid from './InfiniteGrid';
import { findGenre, genreIdFor } from '@/lib/genres';

export default function GenreList({ genreSlug }) {
  const [genre, setGenre] = useState(null);
  const [remoteId, setRemoteId] = useState(null);
  const [type, setType] = useState('movie');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const g = findGenre(genreSlug);
    if (g) {
      setGenre(g);
      if (!g.tmdbId && g.tmdbIdTv) setType('tv');
      setLoading(false);
      return;
    }
    fetch('/api/movies/genres')
      .then((r) => r.json())
      .then((d) => {
        const f = (d.genres || []).find((x) => x.name.toLowerCase().replace(/\s+/g, '-') === genreSlug.toLowerCase());
        if (f) setRemoteId(f.id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [genreSlug]);

  const id = useMemo(() => (genre ? genreIdFor(genre, type) : remoteId ?? undefined), [genre, remoteId, type]);

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <i className="fa-solid fa-circle-notch fa-spin text-2xl text-gold" />
      </div>
    );
  if (!genre && !remoteId) return <p className="text-center text-dim py-16 text-sm">Genre tidak ditemukan</p>;

  const hasMovie = !genre || !!genre.tmdbId;
  const hasTv = !genre || !!genre.tmdbIdTv;

  return (
    <div>
      {hasMovie && hasTv && (
        <div className="flex gap-2 px-4 mb-5">
          {['movie', 'tv'].map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                type === t ? 'bg-gold text-ink' : 'bg-inke border border-line text-silver'
              }`}
            >
              {t === 'movie' ? 'Film' : 'Series'}
            </button>
          ))}
        </div>
      )}
      {id && <InfiniteGrid endpoint="/api/movies/discover" extraParams={{ genre: String(id), type }} />}
    </div>
  );
}
