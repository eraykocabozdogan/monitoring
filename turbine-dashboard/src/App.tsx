// src/App.tsx
import CsvUploader from './components/CsvUploader';
import DataChart from './components/DataChart';
import DashboardLayout from './components/DashboardLayout';
import styles from './components/DashboardLayout/DashboardLayout.module.css';
import CriticalLogs from './components/CriticalLogs';
import Sidebar from './components/Sidebar';
import KpiCard from './components/KpiCard';
import DateRangePicker from './components/DateRangePicker'; // Yeni import

function App() {
  return (
    <DashboardLayout>
      <DataChart />
      <div className={styles.bottomSection}>
        <CriticalLogs />
        <Sidebar>
          <CsvUploader />
          <DateRangePicker /> {/* Buraya ekliyoruz */}
          <KpiCard title="Availability" value="97.8%" />
          <KpiCard title="Reliability" value="94.5%" />
          <KpiCard title="Availability" value="97.8%" />
        </Sidebar>
      </div>
    </DashboardLayout>
  );
}

export default App;