export const dynamic = 'force-dynamic';
import mz from '@/lib/moviezone';
import { handle, num } from '@/lib/handler';
import { NextResponse } from 'next/server';

export async function GET(req) {
  const p = req.nextUrl.searchParams;
  const q = (p.get('q') || '').trim();
  const page = num(p.get('page'));
  if (!q) return NextResponse.json({ results: [], total_pages: 0 });
  return handle(`search:${q.toLowerCase()}:${page}`, () => mz.searchMovies(q, page));
}
