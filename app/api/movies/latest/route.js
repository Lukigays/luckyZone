export const dynamic = 'force-dynamic';
import mz from '@/lib/moviezone';
import { handle, num } from '@/lib/handler';

export async function GET(req) {
  const p = req.nextUrl.searchParams;
  const type = p.get('type') || 'all';
  const page = num(p.get('page'));
  return handle(`latest:${type}:${page}`, () => mz.getLatest(type, page));
}
