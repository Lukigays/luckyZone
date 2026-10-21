export const dynamic = 'force-dynamic';
import mz from '@/lib/source';
import { handle, num } from '@/lib/handler';

export async function GET(_req, { params }) {
  const slug = params.slug;
  return handle('detail:' + slug, async () => {
    const { result } = await mz.getMovieDetail(slug);
    // UI memakai castDetailed (sama seperti aslinya)
    return { ...result, castDetailed: result.cast || [], cast: undefined };
  });
}
