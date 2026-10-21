import { Suspense } from 'react';
import Watch from '@/components/Watch';

export default function Page({ params }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <i className="fa-solid fa-circle-notch fa-spin text-3xl text-gold" />
        </div>
      }
    >
      <Watch slug={params.slug} />
    </Suspense>
  );
}
