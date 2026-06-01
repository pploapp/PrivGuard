import { ConsentStatsDashboard } from '../../../components/consent-stats-dashboard';

export default function StatsPage() {
  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Consent Statistics</h1>
      <ConsentStatsDashboard apiUrl="http://localhost:3001" />
    </main>
  );
}
