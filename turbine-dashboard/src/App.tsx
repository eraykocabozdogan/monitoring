import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
// Artık tüm veri setini kullanacağımız için filtrelenmiş hook'lara doğrudan ihtiyacımız yok,
// ama log tablosu için kullanmaya devam edeceğiz.
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

function App() {
  // logEvents ve powerCurveData'yı doğrudan store'dan alıyoruz
  const { setMetrics, metrics, logEvents, powerCurveData } = useAppStore();
  
  // CriticalLogs bileşeni için filtrelenmiş log verisine hala ihtiyacımız var
  const filteredLogs = useFilteredLogData();

  // Metrikleri hesaplamak için tüm veri setlerinin yüklenmesini bekle
  useEffect(() => {
    if (logEvents.length > 0 && powerCurveData.length > 0) {
      // Metrik hesaplaması için filtrelenmemiş, tam veri setlerini gönderiyoruz
      const newMetrics = calculateMetrics(logEvents, powerCurveData);
      setMetrics(newMetrics);
    } else {
      // Veri setlerinden biri eksikse metrikleri sıfırla
      setMetrics({ availability: 0, mtbf: 0, mttr: 0, reliability_R100h: 0 });
    }
    // Bağımlılıkları tam veri setleri olarak değiştiriyoruz
  }, [logEvents, powerCurveData, setMetrics]);

  return (
    <DashboardLayout>
      <DataChart />
      <div className={styles.bottomSection}>
        {/* CriticalLogs bileşeni, tarih aralığına göre filtrelenmiş logları göstermeye devam ediyor */}
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