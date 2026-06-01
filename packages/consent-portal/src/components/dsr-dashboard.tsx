'use client';

import { useState, useEffect } from 'react';

interface DsrRequest {
  id: string;
  type: string;
  status: string;
  dataSubjectId: string;
  regulation: string;
  deadlineAt: string;
  createdAt: string;
  updatedAt: string;
}

interface DsrDashboardProps {
  apiUrl: string;
}

export function DsrDashboard({ apiUrl }: DsrDashboardProps) {
  const [dsrs, setDsrs] = useState<DsrRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  const fetchDsrs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);

      const res = await fetch(`${apiUrl}/dsr?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as DsrRequest[];
      setDsrs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch DSRs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDsrs();
  }, [statusFilter, typeFilter]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`${apiUrl}/dsr/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      void fetchDsrs();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const statusColors: Record<string, string> = {
    pending: '#f59e0b',
    verifying: '#3b82f6',
    processing: '#8b5cf6',
    completed: '#10b981',
    rejected: '#ef4444',
  };

  const getDeadlineStyle = (deadlineAt: string): { color: string; fontWeight: number; label?: string } => {
    const deadline = new Date(deadlineAt);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { color: '#dc2626', fontWeight: 700, label: 'Overdue' };
    }
    if (diffDays <= 3) {
      return { color: '#d97706', fontWeight: 600, label: `${diffDays}d left` };
    }
    return { color: '#374151', fontWeight: 400 };
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div>
          <label htmlFor="status-filter" style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
            Filter by Status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter DSR requests by status"
            style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="verifying">Verifying</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div>
          <label htmlFor="type-filter" style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
            Filter by Type
          </label>
          <select
            id="type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Filter DSR requests by type"
            style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
          >
            <option value="">All Types</option>
            <option value="access">Access</option>
            <option value="deletion">Deletion</option>
            <option value="portability">Portability</option>
            <option value="correction">Correction</option>
          </select>
        </div>

        <button
          onClick={() => void fetchDsrs()}
          aria-label="Refresh DSR requests"
          style={{
            marginTop: '1.25rem',
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

      {loading && <p>Loading DSR requests...</p>}
      {error && <p style={{ color: '#ef4444' }}>Error: {error}</p>}

      {!loading && !error && dsrs.length === 0 && (
        <p>No DSR requests found.</p>
      )}

      {!loading && !error && dsrs.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>ID</th>
                <th style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>Type</th>
                <th style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                <th style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>Subject</th>
                <th style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>Regulation</th>
                <th style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>Deadline</th>
                <th style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dsrs.map((dsr) => {
                const deadlineStyle = getDeadlineStyle(dsr.deadlineAt);
                return (
                  <tr key={dsr.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem' }}>{dsr.id.slice(0, 12)}...</td>
                    <td style={{ padding: '0.75rem', textTransform: 'capitalize' }}>{dsr.type}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: statusColors[dsr.status] + '20',
                          color: statusColors[dsr.status],
                        }}
                      >
                        {dsr.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>{dsr.dataSubjectId}</td>
                    <td style={{ padding: '0.75rem', textTransform: 'uppercase' }}>{dsr.regulation}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ color: deadlineStyle.color, fontWeight: deadlineStyle.fontWeight }}>
                        {new Date(dsr.deadlineAt).toLocaleDateString()}
                        {deadlineStyle.label && (
                          <span
                            style={{
                              marginLeft: '0.5rem',
                              display: 'inline-block',
                              padding: '0.125rem 0.375rem',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem',
                              background: deadlineStyle.color + '15',
                            }}
                          >
                            {deadlineStyle.label}
                          </span>
                        )}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <select
                        value={dsr.status}
                        onChange={(e) => void updateStatus(dsr.id, e.target.value)}
                        aria-label={`Update status for DSR ${dsr.id.slice(0, 8)}`}
                        style={{ padding: '0.25rem', borderRadius: '0.25rem', border: '1px solid #d1d5db', fontSize: '0.75rem' }}
                      >
                        <option value="pending">Pending</option>
                        <option value="verifying">Verifying</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
