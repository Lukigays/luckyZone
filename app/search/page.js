import { Suspense } from 'react';
import SearchClient from '@/components/SearchClient';
export const metadata = { title: 'Cari — LukyyZone' };
export default function Page() {
  return (
    <Suspense fallback={null}>
      <SearchClient />
    </Suspense>
  );
}
