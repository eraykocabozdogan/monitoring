import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { useFilteredLogData } from './hooks/useFilteredLogData.js';
import { useFilteredPowerCurveData } from './hooks/useFilteredPowerCurveData.js';
import { calculateMetrics } from './utils/calculations.js';

import CsvUploader from './components/CsvUploader';
import DataChart from './components/DataChart';
import DashboardLayout from './components/DashboardLayout';
import styles from './components/DashboardLayout/DashboardLayout.module.css';
import sidebarStyles from './components/Sidebar/Sidebar.module.css';
import CriticalLogs from './components/CriticalLogs';
import Sidebar from './components/Sidebar';
import KpiCard from './components/KpiCard';
import DateRangePicker from './components/DateRangePicker';

function App() {
  const { setMetrics, metrics, logEvents, powerCurveData } = useAppStore();
  const filteredLogs = useFilteredLogData();
  const filteredPowerCurve = useFilteredPowerCurveData();

  // Recalculate metrics when the filtered data changes
  useEffect(() => {
    // We use the full dataset for the most accurate metrics within the selected date range
    if (filteredLogs.length > 0 && filteredPowerCurve.length > 0) {
      const newMetrics = calculateMetrics(filteredLogs, filteredPowerCurve);
      setMetrics(newMetrics);
    } else {
      // If data is missing, reset metrics
      setMetrics({ availability: 0, mtbf: 0, mttr: 0, reliability_R100h: 0 });
    }
  }, [filteredLogs, filteredPowerCurve, setMetrics]);

  return (
    <DashboardLayout>
      <DataChart />
      <div className={styles.bottomSection}>
        {/* CriticalLogs now receives the filtered log data */}
        <CriticalLogs logs={filteredLogs} />
        <Sidebar>
          <CsvUploader />
          <DateRangePicker />
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