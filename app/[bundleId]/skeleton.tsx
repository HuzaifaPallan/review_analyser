"use client";

export function LoadingSkeleton() {
  return (
    <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{
          background: 'linear-gradient(180deg, #0e1124 0%, #0a0d1a 60%, #080b16 100%)',
          border: '1px solid #1b2442',
          borderRadius: 12,
          padding: 16
        }}>
          <div style={{ height: 12, width: '60%', background: '#1f2a4d', borderRadius: 6 }} />
          <div style={{ height: 10, width: '90%', background: '#162040', borderRadius: 6, marginTop: 10 }} />
          <div style={{ height: 10, width: '80%', background: '#162040', borderRadius: 6, marginTop: 8 }} />
        </div>
      ))}
    </div>
  );
}


