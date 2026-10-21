export const dynamic = 'force-dynamic';
import mz from '@/lib/source';
import { handle, num } from '@/lib/handler';

export async function GET(req, { params }) {
  const season = num(req.nextUrl.searchParams.get('season'));
  return handle(`eps:${params.slug}:${season}`, () => mz.getSeriesEpisodes(params.slug, season));
}
