import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { useFilteredLogData } from './hooks/useFilteredLogData.js';
// useFilteredPowerCurveData'ya artık burada doğrudan ihtiyaç yok.
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
  // Global state'den TÜM veriyi ve dateRange'i al
  const { setMetrics, metrics, logEvents, powerCurveData, dateRange } = useAppStore();
  
  // CriticalLogs tablosu için filtrelenmiş logları al (bu kanca görsel amaçlı kalıyor)
  const filteredLogsForTable = useFilteredLogData();

  useEffect(() => {
    // Hesaplama için artık TÜM veri setini kullanıyoruz
    if (logEvents.length > 0 && powerCurveData.length > 0 && dateRange.start && dateRange.end) {
      
      // calculateMetrics'e tüm veri setini ve seçili aralığı gönder
      const newMetrics = calculateMetrics(logEvents, powerCurveData, dateRange);
      setMetrics(newMetrics);

    } else {
      setMetrics({ operationalAvailability: 0, technicalAvailability: 0, mtbf: 0, mttr: 0, reliabilityR: 0 });
    }
  // Bağımlılık dizisi artık tüm veri setlerine ve tarih aralığına bağlı
  }, [logEvents, powerCurveData, dateRange, setMetrics]);

  return (
    <DashboardLayout>
      <DataChart />
      <div className={styles.bottomSection}>
        {/* Tablo, görsel olarak filtrelenmiş veriyi göstermeye devam ediyor */}
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