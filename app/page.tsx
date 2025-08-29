import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
      <h1>Play Store Viewer</h1>
      <p>Use a URL like <code>/com.schellgames.happyatoms</code> to view details.</p>
      <div style={{ marginTop: '1rem' }}>
        <Link href="/com.schellgames.happyatoms">Try sample: com.schellgames.happyatoms</Link>
      </div>
    </main>
  );
}

