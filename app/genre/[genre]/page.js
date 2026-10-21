import BackButton from '@/components/BackButton';
import GenreList from '@/components/GenreList';
import { findGenre } from '@/lib/genres';

export function generateMetadata({ params }) {
  const g = findGenre(params.genre);
  return { title: `${g ? g.label : params.genre} — LukyyZone` };
}

export default function Page({ params }) {
  const g = findGenre(params.genre);
  return (
    <div className="py-4">
      <div className="flex items-center gap-3 px-4 mb-5">
        <BackButton />
        <h1 className="font-display font-bold text-lg capitalize">{g ? g.label : decodeURIComponent(params.genre).replace(/-/g, ' ')}</h1>
      </div>
      <GenreList genreSlug={params.genre} />
    </div>
  );
}
