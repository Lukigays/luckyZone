export const dynamic = 'force-dynamic';
import mz from '@/lib/moviezone';
import { handle, num } from '@/lib/handler';

export async function GET(req) {
  const p = req.nextUrl.searchParams;
  const opts = {
    type: p.get('type') || 'movie',
    genre: p.get('genre') || '',
    sort: p.get('sort') || '',
    page: num(p.get('page')),
  };
  return handle('discover:' + JSON.stringify(opts), () => mz.discover(opts));
}
