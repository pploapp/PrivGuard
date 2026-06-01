'use client';

import { useState, useEffect } from 'react';

interface ConsentStats {
  byPurpose: Record<string, number>;
  byStatus: Record<string, number>;
  total: number;
}

interface ConsentStatsDashboardProps {
  apiUrl: string;
}

const purposeColors: Record<string, string> = {
  marketing: '#ef4444',
  analytics: '#3b82f6',
  functional: '#10b981',
  personalization: '#8b5cf6',
};

const statusColors: Record<string, string> = {
  granted: '#10b981',
  denied: '#ef4444',
  withdrawn: '#f59e0b',
};

function PieChart({ data, colors }: { data: Record<string, number>; colors: Record<string, string> }) {
  const total = Object.values(data).reduce((sum, val) => sum + val, 0);
  if (total === 0) {
    return <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>No data available</p>;
  }

  let currentAngle = 0;
  const entries = Object.entries(data);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
      <div
        style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: `conic-gradient(${entries
            .map(([key, val]) => {
              const angle = (val / total) * 360;
              const start = currentAngle;
              currentAngle += angle;
              return `${colors[key] ?? '#9ca3af'} ${start}deg ${currentAngle}deg`;
            })
            .join(', ')})`,
        }}
        aria-label="Pie chart"
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {entries.map(([key, val]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <span
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '2px',
                background: colors[key] ?? '#9ca3af',
                display: 'inline-block',
              }}
            />
            <span style={{ textTransform: 'capitalize' }}>{key}</span>
            <span style={{ fontWeight: 600 }}>{val}</span>
            <span style={{ color: '#6b7280' }}>({((val / total) * 100).toFixed(1)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data, colors }: { data: Record<string, number>; colors: Record<string, string> }) {
  const max = Math.max(...Object.values(data), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {Object.entries(data).map(([key, val]) => (
        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ width: '100px', fontSize: '0.875rem', textTransform: 'capitalize', textAlign: 'right' }}>
            {key}
          </span>
          <div style={{ flex: 1, height: '24px', background: '#f3f4f6', borderRadius: '0.25rem', overflow: 'hidden' }}>
            <div
              style={{
                width: `${(val / max) * 100}%`,
                height: '100%',
                background: colors[key] ?? '#9ca3af',
                borderRadius: '0.25rem',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
          <span style={{ width: '40px', fontSize: '0.875rem', fontWeight: 600 }}>{val}</span>
        </div>
      ))}
    </div>
  );
}

export function ConsentStatsDashboard({ apiUrl }: ConsentStatsDashboardProps) {
  const [stats, setStats] = useState<ConsentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/consents/stats`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as ConsentStats;
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch consent statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchStats();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Consent Statistics</h2>
        <button
          onClick={() => void fetchStats()}
          aria-label="Refresh consent statistics"
          style={{
            padding: '0.5rem 1rem',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
          }}
        >
          Refresh
        </button>
      </div>

      {loading && <p>Loading statistics...</p>}
      {error && <p style={{ color: '#ef4444' }}>Error: {error}</p>}

      {!loading && !error && stats && (
        <div style={{ display: 'grid', gap: '2rem' }}>
          <div
            style={{
              padding: '1.5rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              background: '#fff',
            }}
          >
            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Total Consents</h3>
            <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0, color: '#2563eb' }}>{stats.total}</p>
          </div>

          <div
            style={{
              padding: '1.5rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              background: '#fff',
            }}
          >
            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Purpose Distribution</h3>
            <PieChart data={stats.byPurpose} colors={purposeColors} />
          </div>

          <div
            style={{
              padding: '1.5rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              background: '#fff',
            }}
          >
            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Status Breakdown</h3>
            <BarChart data={stats.byStatus} colors={statusColors} />
          </div>
        </div>
      )}
    </div>
  );
}
