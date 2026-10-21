import Detail from '@/components/Detail';
export default function Page({ params }) {
  return <Detail slug={params.slug} />;
}
