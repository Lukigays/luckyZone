import BackButton from '@/components/BackButton';
import GenreGrid from '@/components/GenreGrid';
export const metadata = { title: 'Genre — LukyyZone' };
export default function Page() {
  return (
    <div className="py-4">
      <div className="flex items-center gap-3 px-4 mb-5">
        <BackButton />
        <h1 className="font-display font-bold text-lg">Genre</h1>
      </div>
      <GenreGrid />
    </div>
  );
}
