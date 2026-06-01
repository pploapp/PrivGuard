import Link from 'next/link';
import { DsrDashboard } from '../../components/dsr-dashboard';

export default function AdminPage() {
  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>PrivGuard Admin Dashboard</h1>

      <nav style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
        <Link
          href="/admin/stats"
          style={{
            display: 'inline-block',
            padding: '0.5rem 1rem',
            background: '#2563eb',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '0.375rem',
          }}
          aria-label="View consent statistics"
        >
          Consent Statistics
        </Link>
      </nav>

      <DsrDashboard apiUrl="http://localhost:3001" />
    </main>
  );
}
