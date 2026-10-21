'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import MovieCard from './MovieCard';
import { getSearchHistory, pushSearchHistory, removeSearchHistory, clearSearchHistory } from '@/lib/storage';

function useDebounce(v, ms) {
  const [d, setD] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setD(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return d;
}

export default function SearchClient() {
  const sp = useSearchParams();
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('all');
  const [suggest, setSuggest] = useState([]);
  const [history, setHistory] = useState([]);
  const [dropOpen, setDropOpen] = useState(false);
  const [sugLoading, setSugLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const input = useRef(null);
  const drop = useRef(null);
  const sentinel = useRef(null);
  const dq = useDebounce(q, 350);
  const sq = useDebounce(q, 250);

  useEffect(() => {
    const init = sp.get('q');
    if (init && init.trim()) setQ(init);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setHistory(getSearchHistory());
    input.current?.focus();
  }, []);

  useEffect(() => {
    if (!sq.trim()) {
      setSuggest([]);
      return;
    }
    setSugLoading(true);
    fetch(`/api/movies/search?q=${encodeURIComponent(sq)}&page=1`)
      .then((r) => r.json())
      .then((d) => setSuggest((d.results || []).slice(0, 8)))
      .catch(() => setSuggest([]))
      .finally(() => setSugLoading(false));
  }, [sq]);

  const run = useCallback(async (term, p = 1) => {
    if (!term.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setError('');
    setDropOpen(false);
    if (p === 1) setFilter('all');
    try {
      const r = await fetch(`/api/movies/search?q=${encodeURIComponent(term)}&page=${p}`);
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      const list = d.results || [];
      if (p === 1) setResults(list);
      else setResults((prev) => [...prev, ...list.filter((x) => !prev.some((y) => y.slug === x.slug))]);
      setTotalPages(d.total_pages || 1);
      setSearched(true);
    } catch {
      setError('Pencarian gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }, []);

  const save = (term) => {
    if (!term.trim()) return;
    pushSearchHistory(term.trim());
    setHistory(getSearchHistory());
  };

  useEffect(() => {
    setPage(1);
    run(dq, 1);
  }, [dq, run]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !searched) return;
    const io = new IntersectionObserver(
      (e) => {
        if (e[0].isIntersecting && !loading && page < totalPages) {
          const n = page + 1;
          setPage(n);
          run(dq, n);
        }
      },
      { rootMargin: '400px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loading, page, totalPages, searched, dq, run]);

  useEffect(() => {
    if (focused && q.trim()) setDropOpen(true);
    else if (!q.trim() && focused) setDropOpen(history.length > 0);
  }, [focused, q, history]);

  useEffect(() => {
    const fn = (e) => {
      if (drop.current && !drop.current.contains(e.target) && input.current && !input.current.contains(e.target)) {
        setDropOpen(false);
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const choose = (term) => {
    setQ(term);
    setDropOpen(false);
    setFocused(false);
    input.current?.blur();
    setPage(1);
    run(term, 1);
    save(term);
  };

  const showHistory = !q.trim() && history.length > 0;
  const showSuggest = !!q.trim() && (suggest.length > 0 || sugLoading);
  const filtered = useMemo(() => (filter === 'all' ? results : results.filter((m) => m.type === filter)), [results, filter]);

  return (
    <div className="py-4 px-4">
      <div className="relative flex items-center mb-0">
        <i className="fa-solid fa-magnifying-glass absolute left-3.5 text-dim text-sm pointer-events-none z-10" />
        <input
          ref={input}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => {
            setFocused(true);
            setDropOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && q.trim()) {
              setDropOpen(false);
              setFocused(false);
              input.current?.blur();
              setPage(1);
              run(q.trim(), 1);
              save(q.trim());
            }
            if (e.key === 'Escape') setDropOpen(false);
          }}
          placeholder="Cari film atau series..."
          autoComplete="off"
          className={`w-full h-11 pl-10 pr-10 bg-inke border border-line text-sm text-[#E8EDF2] placeholder-dim focus:outline-none focus:border-gold/50 transition-colors ${
            dropOpen ? 'rounded-t-2xl rounded-b-none border-b-transparent' : 'rounded-2xl'
          }`}
        />
        {q && (
          <button
            onClick={() => {
              setQ('');
              setResults([]);
              setSearched(false);
              setSuggest([]);
              setDropOpen(history.length > 0);
              input.current?.focus();
            }}
            className="absolute right-3 text-dim hover:text-silver z-10"
          >
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        )}
        {dropOpen && focused && (showHistory || showSuggest) && (
          <div ref={drop} className="absolute top-full left-0 right-0 bg-inke border border-line border-t-0 rounded-b-2xl z-50 overflow-hidden">
            {showHistory && (
              <>
                <div className="px-4 pt-2.5 pb-1 flex items-center justify-between">
                  <span className="text-dim text-[11px] uppercase tracking-wider font-medium">Riwayat</span>
                  <button
                    onClick={() => {
                      clearSearchHistory();
                      setHistory([]);
                      setDropOpen(false);
                    }}
                    className="text-dim text-[11px] hover:text-gold transition-colors"
                  >
                    Hapus semua
                  </button>
                </div>
                {history.map((h) => (
                  <div
                    key={h}
                    role="button"
                    onClick={() => choose(h)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors group cursor-pointer"
                  >
                    <i className="fa-solid fa-clock-rotate-left text-dim text-xs w-4 flex-shrink-0" />
                    <span className="text-silver text-sm flex-1 text-left truncate">{h}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSearchHistory(h);
                        setHistory(getSearchHistory());
                      }}
                      className="text-dim opacity-0 group-hover:opacity-100 hover:text-silver transition-all"
                    >
                      <i className="fa-solid fa-xmark text-xs" />
                    </button>
                  </div>
                ))}
              </>
            )}
            {showSuggest && (
              <>
                {sugLoading && suggest.length === 0 && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <i className="fa-solid fa-circle-notch fa-spin text-gold text-xs" />
                    <span className="text-dim text-sm">Mencari...</span>
                  </div>
                )}
                {suggest.map((s) => (
                  <button
                    key={s.slug}
                    onClick={() => choose(s.title)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors"
                  >
                    <i className="fa-solid fa-magnifying-glass text-dim text-xs w-4 flex-shrink-0" />
                    <span className="text-silver text-sm flex-1 text-left truncate">{s.title}</span>
                    <i className="fa-solid fa-arrow-up-left text-dim text-xs flex-shrink-0 rotate-90" />
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      <div className="mt-5">
        {loading && results.length === 0 && (
          <div className="flex justify-center py-16">
            <i className="fa-solid fa-circle-notch fa-spin text-2xl text-gold" />
          </div>
        )}
        {error && <p className="text-center text-dim text-sm py-8">{error}</p>}
        {!loading && searched && results.length === 0 && !error && (
          <div className="text-center py-16">
            <p className="text-silver text-sm mb-1">Tidak ada hasil untuk</p>
            <p className="text-gold font-semibold">&quot;{q}&quot;</p>
          </div>
        )}
        {!searched && !loading && !error && (
          <div className="text-center py-16">
            <i className="fa-solid fa-magnifying-glass text-4xl text-dim mb-3 block" />
            <p className="text-silver text-sm">Ketik judul film atau series</p>
          </div>
        )}
        {results.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-dim text-xs">{filtered.length} hasil ditemukan</p>
              <div className="flex gap-1.5">
                {[
                  { key: 'all', label: 'Semua' },
                  { key: 'Movie', label: 'Film' },
                  { key: 'Series', label: 'Series' },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                      filter === f.key ? 'bg-gold text-ink' : 'bg-inke border border-line text-silver'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-silver text-sm">Tidak ada {filter === 'Movie' ? 'film' : 'series'} yang cocok</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {filtered.map((m) => (
                  <MovieCard key={m.slug} movie={m} size="sm" />
                ))}
              </div>
            )}
            {page < totalPages && !loading && <div ref={sentinel} className="h-1" />}
            {page < totalPages && !loading && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => {
                    const n = page + 1;
                    setPage(n);
                    run(dq, n);
                  }}
                  className="px-6 py-2.5 rounded-xl border border-line text-silver text-sm hover:border-gold hover:text-gold transition-colors"
                >
                  Muat lebih banyak
                </button>
              </div>
            )}
            {loading && results.length > 0 && (
              <div className="flex justify-center py-4">
                <i className="fa-solid fa-circle-notch fa-spin text-xl text-gold" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
