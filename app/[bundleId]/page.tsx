import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { LoadingSkeleton } from './skeleton';

type PageProps = {
  params: { bundleId: string };
};

function parseBundleId(bundleId: string) {
  const parts = bundleId.split('.');
  const studio = parts.length >= 2 ? parts[1] : parts[0] ?? '';
  const app = parts.length >= 3 ? parts[2] : parts[1] ?? '';
  return { studio, app };
}

const AppDetails = dynamic(() => import('./ui').then(m => m.AppDetails), { ssr: false });

export default function BundlePage({ params }: PageProps) {
  const { bundleId } = params;
  const { studio, app } = parseBundleId(bundleId);

  return (
    <main style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      <h1>
        Welcome {studio}, you are seeing data for '{app}'
      </h1>
      <p style={{ color: '#666' }}>Bundle ID: {bundleId}</p>
      <Suspense fallback={<LoadingSkeleton />}>
        <AppDetails bundleId={bundleId} />
      </Suspense>
    </main>
  );
}

