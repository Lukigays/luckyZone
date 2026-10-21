import TypeListPage from '@/components/TypeListPage';
export const metadata = { title: 'Sedang Tayang — LukyyZone' };
export default function Page() {
  return <TypeListPage title="Sedang Tayang" endpoint="/api/movies/latest" />;
}
