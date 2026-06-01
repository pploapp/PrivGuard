import Link from 'next/link';
import { ConsentBanner } from '../components/consent-banner';

export default function HomePage() {
  return (
    <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>PrivGuard Consent Portal</h1>
      <p>Open-source Privacy Compliance & Data Governance Platform</p>

      <nav style={{ marginTop: '1.5rem', marginBottom: '2rem' }}>
        <Link
          href="/admin"
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            background: '#2563eb',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '0.375rem',
          }}
        >
          Open Admin Dashboard
        </Link>
      </nav>

      <section style={{ marginTop: '2rem' }}>
        <h2>Consent Banner Preview</h2>
        <p>This banner can be embedded on any website:</p>
        <div
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginTop: '1rem',
            minHeight: '200px',
            position: 'relative',
          }}
        >
          <ConsentBanner
            apiUrl="http://localhost:3001"
            dataSubjectId="demo-user-123"
          />
        </div>
      </section>
    </main>
  );
}
