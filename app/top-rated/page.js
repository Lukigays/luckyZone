import TypeListPage from '@/components/TypeListPage';
export const metadata = { title: 'Rating Tertinggi — LukyyZone' };
export default function Page() {
  return <TypeListPage title="Rating Tertinggi" endpoint="/api/movies/top-rated" />;
}
