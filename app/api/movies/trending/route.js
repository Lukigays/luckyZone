export const dynamic = 'force-dynamic';
import mz from '@/lib/source';
import { handle, num } from '@/lib/handler';

export async function GET() {
  return handle('trending', () => mz.getTrending());
}
