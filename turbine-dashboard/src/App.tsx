// src/App.tsx
import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { useFilteredData } from './hooks/useFilteredData.js';
import { calculateMetrics } from './utils/calculations.js';

import CsvUploader from './components/CsvUploader';
import DataChart from './components/DataChart';
import DashboardLayout from './components/DashboardLayout';
import styles from './components/DashboardLayout/DashboardLayout.module.css';
import CriticalLogs from './components/CriticalLogs';
import Sidebar from './components/Sidebar';
import KpiCard from './components/KpiCard';
import DateRangePicker from './components/DateRangePicker';

function App() {
  const { setMetrics, metrics } = useAppStore();
  const filteredData = useFilteredData();

  // Filtrelenmiş veri her değiştiğinde bu blok çalışır
  useEffect(() => {
    if (filteredData.length > 0) {
      const newMetrics = calculateMetrics(filteredData);
      setMetrics(newMetrics);
    } else {
      // Eğer filtrelenmiş veri boşsa, metrikleri sıfırla
      setMetrics({ availability: 0, mtbf: 0, mttr: 0 });
    }
  }, [filteredData, setMetrics]);

  return (
    <DashboardLayout>
      <DataChart />
      <div className={styles.bottomSection}>
        {/* Loglara filtrelenmiş veriyi gönder */}
        <CriticalLogs logs={filteredData} />
        <Sidebar>
          <CsvUploader />
          <DateRangePicker />
          {/* Artık gerçek, dinamik metrikleri gösteriyoruz */}
          <KpiCard title="Availability" value={metrics.availability} unit="%" />
          <KpiCard title="MTBF" value={metrics.mtbf} unit="hours" />
          <KpiCard title="MTTR" value={metrics.mttr} unit="hours" />
        </Sidebar>
      </div>
    </DashboardLayout>
  );
}

export default App;