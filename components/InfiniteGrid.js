'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import MovieCard from './MovieCard';

function GridSkeleton() {
  return (
    <div>
      <div className="skeleton rounded-xl aspect-[2/3] mb-2" />
      <div className="skeleton h-3 rounded w-4/5 mb-1" />
      <div className="skeleton h-2.5 rounded w-2/5" />
    </div>
  );
}

export default function InfiniteGrid({ endpoint, extraParams = {}, showCount = true }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initial, setInitial] = useState(false);
  const [error, setError] = useState('');
  const sentinel = useRef(null);
  const busy = useRef(false);
  const key = JSON.stringify(extraParams);

  const load = useCallback(
    async (p, first = false) => {
      if (busy.current) return;
      busy.current = true;
      setLoading(true);
      if (first) setInitial(true);
      setError('');
      try {
        const u = new URL(endpoint, 'http://x');
        u.searchParams.set('page', String(p));
        Object.entries(extraParams).forEach(([k, v]) => u.searchParams.set(k, v));
        const r = await fetch(`${u.pathname}${u.search}`);
        if (!r.ok) throw new Error('Gagal');
        const d = await r.json();
        const res = d.results || [];
        if (p === 1) setItems(res);
        else setItems((prev) => [...prev, ...res.filter((x) => !prev.some((y) => y.slug === x.slug))]);
        setTotalPages(d.total_pages || 1);
        setTotal(typeof d.total_results === 'number' ? d.total_results : null);
      } catch {
        setError('Gagal memuat konten. Coba lagi.');
      } finally {
        setLoading(false);
        setInitial(false);
        busy.current = false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [endpoint, key]
  );

  useEffect(() => {
    setPage(1);
    setItems([]);
    setInitial(true);
    load(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, key]);

  const more = useCallback(() => {
    if (busy.current) return;
    setPage((p) => {
      const n = p + 1;
      load(n);
      return n;
    });
  }, [load]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (e) => {
        if (e[0].isIntersecting && !loading && page < totalPages && items.length > 0) more();
      },
      { rootMargin: '400px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loading, page, totalPages, items.length, more]);

  if (error && items.length === 0 && !initial) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <i className="fa-solid fa-circle-exclamation text-3xl text-dim" />
        <p className="text-dim text-sm">{error}</p>
        <button onClick={() => load(1)} className="px-4 py-2 rounded-xl bg-gold text-ink text-sm font-semibold">
          Coba Lagi
        </button>
      </div>
    );
  }

  const firstLoad = initial && items.length === 0;
  return (
    <div>
      {showCount && total !== null && !firstLoad && (
        <p className="text-dim text-xs px-4 mb-3">{total.toLocaleString('id-ID')} hasil ditemukan</p>
      )}
      <div className="grid grid-cols-3 gap-3 px-4">
        {!initial && items.map((m) => <MovieCard key={m.slug} movie={m} size="sm" />)}
        {(loading || initial) && Array.from({ length: initial ? 9 : 6 }).map((_, i) => <GridSkeleton key={i} />)}
      </div>
      {!initial && page < totalPages && items.length > 0 && <div ref={sentinel} className="h-1" />}
      {!initial && !loading && page < totalPages && items.length > 0 && (
        <div className="flex justify-center mt-2 mb-4">
          <button
            onClick={more}
            className="px-6 py-2.5 rounded-xl border border-line text-silver text-sm font-medium hover:border-gold hover:text-gold transition-colors"
          >
            Muat lebih banyak
          </button>
        </div>
      )}
      {!initial && !loading && page >= totalPages && items.length > 0 && (
        <p className="text-center text-dim text-xs py-6">Semua konten sudah ditampilkan</p>
      )}
      {!initial && !loading && items.length === 0 && !error && (
        <p className="text-center text-dim text-sm py-16">Tidak ada konten untuk ditampilkan</p>
      )}
    </div>
  );
}
