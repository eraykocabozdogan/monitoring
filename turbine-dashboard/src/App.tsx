import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { useFilteredLogData } from './hooks/useFilteredLogData.js'; // Artık bu dosya mevcut
import { calculateMetrics } from './utils/calculations.js';

// Hata veren eksik import'lar buraya eklendi
import CsvUploader from './components/CsvUploader';
import DataChart from './components/DataChart';
import DashboardLayout from './components/DashboardLayout';
import styles from './components/DashboardLayout/DashboardLayout.module.css';
import sidebarStyles from './components/Sidebar/Sidebar.module.css';
import CriticalLogs from './components/CriticalLogs';
import Sidebar from './components/Sidebar';
import KpiCard from './components/KpiCard';
import DateRangePicker from './components/DateRangePicker';
import ChartOptions from './components/ChartOptions';

function App() {
  const { setMetrics, metrics, logEvents, powerCurveData } = useAppStore();
  const filteredLogs = useFilteredLogData();

  useEffect(() => {
    if (logEvents.length > 0 && powerCurveData.length > 0) {
      const newMetrics = calculateMetrics(logEvents, powerCurveData);
      setMetrics(newMetrics);
    } else {
      setMetrics({ availability: 0, mtbf: 0, mttr: 0, reliability_R100h: 0 });
    }
  }, [logEvents, powerCurveData, setMetrics]);

  return (
    <DashboardLayout>
      <DataChart />
      <div className={styles.bottomSection}>
        <CriticalLogs logs={filteredLogs} />
        <Sidebar>
          <CsvUploader />
          <DateRangePicker />
          <ChartOptions />
          <div className={sidebarStyles.section}>
            <div className={sidebarStyles.kpiGrid}>
              <KpiCard title="Availability" value={metrics.availability} unit="%" />
              <KpiCard title="MTBF" value={metrics.mtbf} unit="hours" />
              <KpiCard title="MTTR" value={metrics.mttr} unit="hours" />
              <KpiCard title="Reliability (R(100h))" value={metrics.reliability_R100h} unit="%" />
            </div>
          </div>
        </Sidebar>
      </div>
    </DashboardLayout>
  );
}

export default App;