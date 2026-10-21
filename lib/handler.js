import { NextResponse } from 'next/server';

// Cache memori sederhana supaya tidak membebani sumber (TTL 10 menit)
const g = globalThis;
g.__lzCache = g.__lzCache || new Map();
const cache = g.__lzCache;
const TTL = 10 * 60 * 1000;

export async function handle(key, fn) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < TTL) {
    return NextResponse.json(hit.v, { headers: { 'X-LZ-Cache': 'HIT' } });
  }
  try {
    const v = await fn();
    cache.set(key, { t: Date.now(), v });
    if (cache.size > 500) cache.delete(cache.keys().next().value);
    return NextResponse.json(v, {
      headers: { 'Cache-Control': 's-maxage=600, stale-while-revalidate=1800' },
    });
  } catch (err) {
    const status = err?.response?.status;
    const msg =
      status === 403
        ? 'Sumber data menolak permintaan (403). Coba lagi nanti.'
        : err?.message || 'Gagal memuat';
    return NextResponse.json({ error: msg, results: [] }, { status: 502 });
  }
}

export function num(v, d = 1) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : d;
}
