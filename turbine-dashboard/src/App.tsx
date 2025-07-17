import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { useFilteredLogData } from './hooks/useFilteredLogData.js';
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

const initialMetrics = {
  operationalAvailability: 0,
  technicalAvailability: 0,
  mtbf: 0,
  mttr: 0,
  reliabilityR: 0,
};

function App() {
  const { setMetrics, metrics, logEvents, powerCurveData, dateRange } = useAppStore();
  
  const filteredLogsForTable = useFilteredLogData();

  useEffect(() => {
    // Düzeltme: Sadece gerekli veriler mevcut olduğunda hesaplama yap
    if (powerCurveData.length > 0 && dateRange.start && dateRange.end) {
      const newMetrics = calculateMetrics(logEvents, powerCurveData, dateRange);
      setMetrics(newMetrics);
    } else {
      // Veri yoksa metrikleri sıfırla
      setMetrics(initialMetrics);
    }
  // Düzeltme: Bağımlılık dizisi artık `logEvents`'i de içeriyor.
  }, [logEvents, powerCurveData, dateRange, setMetrics]);

  return (
    <DashboardLayout>
      {/* Grafik artık veri geldiğinde yüklenecek */}
      <DataChart /> 
      <div className={styles.bottomSection}>
        <CriticalLogs logs={filteredLogsForTable} />
        <Sidebar>
          <CsvUploader />
          <DateRangePicker />
          <div className={sidebarStyles.section}>
            <div className={sidebarStyles.kpiGrid}>
              <KpiCard title="Operational Availability (Ao)" value={metrics.operationalAvailability} unit="%" />
              <KpiCard title="Technical Availability (At)" value={metrics.technicalAvailability} unit="%" />
              <KpiCard title="MTBF" value={metrics.mtbf} unit="hours" />
              <KpiCard title="MTTR" value={metrics.mttr} unit="hours" />
              <KpiCard title="Reliability (R)" value={metrics.reliabilityR} unit="%" />
            </div>
          </div>
        </Sidebar>
      </div>
    </DashboardLayout>
  );
}

export default App;