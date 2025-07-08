import DashboardLayout, { styles } from './components/DashboardLayout';
import Sidebar from './components/Sidebar';
import CsvUploader from './components/CsvUploader';
import DataChart from './components/DataChart';
import KpiCard from './components/KpiCard';
import CriticalLogs from './components/CriticalLogs';

function App() {
  return (
    <DashboardLayout>
      {/* 1. Top Item: Full-width graph */}
      <DataChart />

      {/* 2. Bottom Item: A container for the two-column layout */}
      <div className={styles.bottomSection}>
        {/* Left Column of the bottom section */}
        <CriticalLogs />

        {/* Right Column of the bottom section (Sidebar) */}
        <Sidebar>
          <CsvUploader />
          
          <div style={{
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            <h2 style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#1f2937',
              margin: '0 0 16px 0',
              padding: '20px 20px 0 20px'
            }}>
              Key Metrics
            </h2>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '0 20px 20px 20px'
            }}>
              <KpiCard title="Availability" value="97.8%" variant="positive" />
              <KpiCard title="Reliability" value="94.5%" variant="positive" />
              <KpiCard title="Performance" value="92.1%" variant="warning" />
              <KpiCard title="MTBF" value="847h" variant="positive" />
              <KpiCard title="MTTR" value="2.3h" variant="warning" />
            </div>
          </div>
        </Sidebar>
      </div>
    </DashboardLayout>
  );
}

export default App
