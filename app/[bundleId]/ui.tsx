"use client";

import { useEffect, useState } from 'react';

type AppDetailsProps = { bundleId: string };

type AppInfo = {
  title: string;
  summary: string;
  score?: number;
  installs?: string;
  icon?: string;
  developer?: string;
  url?: string;
};

export function AppDetails({ bundleId }: AppDetailsProps) {
  const [data, setData] = useState<AppInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [summary, setSummary] = useState<string>("");
  const [problems, setProblems] = useState<Array<{ title: string; description: string; severity: number }>>([]);
  const [totalAnalyzed, setTotalAnalyzed] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/app/${bundleId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    // Fetch reviews
    fetch(`/api/reviews/${bundleId}?max=100&sort=newest`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to fetch reviews')))
      .then(j => { if (!cancelled) setReviews(Array.isArray(j.reviews) ? j.reviews : []); })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [bundleId]);

  useEffect(() => {
    let cancelled = false;
    if (reviews.length) {
      setLoadingSummary(true);
      fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviews })
      })
        .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to summarize')))
        .then(j => {
          if (cancelled) return;
          setSummary(j.summaryLine || j.summary || '');
          setProblems(Array.isArray(j.problems) ? j.problems : []);
          setTotalAnalyzed(typeof j.totalAnalyzed === 'number' ? j.totalAnalyzed : reviews.length);
        })
        .catch(() => {})
        .finally(() => { if (!cancelled) setLoadingSummary(false); });
    }
    return () => { cancelled = true; };
  }, [reviews]);

  if (loading) return <div>Loading…</div>;
  if (error) return <div style={{ color: 'crimson' }}>Error: {error}</div>;
  if (!data) return <div>No data.</div>;

  const cards = reviews.slice(0, 12);

  return (
    <section style={{ display: 'grid', gridTemplateColumns: '96px 1fr', gap: '1rem', alignItems: 'start' }}>
      {data.icon && (
        <img src={data.icon} alt={data.title} width={96} height={96} style={{ borderRadius: 16 }} />
      )}
      <div>
        <h2 style={{ margin: 0 }}>{data.title}</h2>
        <p style={{ marginTop: 4, color: '#444' }}>{data.summary}</p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: 8, color: '#222' }}>
          {data.score !== undefined && <span>Rating: {data.score.toFixed(2)}</span>}
          {data.installs && <span>Installs: {data.installs}</span>}
          {data.developer && <span>By: {data.developer}</span>}
        </div>
        {data.url && (
          <p style={{ marginTop: 8 }}>
            <a href={data.url} target="_blank" rel="noreferrer">Open on Google Play</a>
          </p>
        )}
        {problems.length > 0 && (
          <>
            <h3 style={{ marginTop: 24 }}>LiveOps pain points (auto-detected)</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '16px',
              marginTop: 12
            }}>
              {problems.map((p, idx) => (
                <div key={idx} style={{
                  background: 'linear-gradient(180deg, #0e1124 0%, #0a0d1a 60%, #080b16 100%)',
                  border: '1px solid #1b2442',
                  borderRadius: 12,
                  padding: 16,
                  color: '#e6e8ff',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(255,255,255,0.03)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: 15 }}>{p.title}</strong>
                    <span style={{
                      background: '#1f2a4d',
                      border: '1px solid #2d3f72',
                      color: '#9cc1ff',
                      padding: '2px 8px',
                      borderRadius: 999,
                      fontSize: 12
                    }}>Severity {p.severity}/5</span>
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.5, opacity: 0.9, marginTop: 8 }}>{p.description}</div>
                </div>
              ))}
            </div>
            {(summary || totalAnalyzed > 0) && (
              <div style={{
                marginTop: 20,
                padding: 18,
                borderRadius: 12,
                background: 'linear-gradient(180deg, #14244b 0%, #0f1b33 100%)',
                color: '#e8f0ff',
                border: '1px solid #1f3a6a'
              }}>
                <strong>From this we know your biggest LiveOps migraines are… ({totalAnalyzed} reviews analyzed)</strong>
                {summary && <div style={{ opacity: 0.85, marginTop: 6 }}>{summary}</div>}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}


