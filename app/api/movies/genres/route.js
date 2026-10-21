export const dynamic = 'force-dynamic';
import mz from '@/lib/moviezone';
import { handle, num } from '@/lib/handler';

export async function GET() {
  return handle('genres', () => mz.getGenres());
}
