import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
// Filtrelenmiş veri hook'ları artık her iki veri türü için de kullanılacak
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
  // Global state'den tüm veriyi ve metrikleri al
  const { setMetrics, metrics, logEvents, powerCurveData } = useAppStore();
  
  // Hook'ları kullanarak seçili tarih aralığına göre filtrelenmiş verileri al
  const filteredLogs = useFilteredLogData();
  const filteredPowerCurve = useFilteredPowerCurveData();

  useEffect(() => {
    // Metrikleri HESAPLAMAK İÇİN FİLTRELENMİŞ VERİYİ KULLAN
    // Bu sayede, dateRange değiştikçe bu kanca yeniden çalışır.
    if (filteredLogs.length > 0 && filteredPowerCurve.length > 0) {
      const newMetrics = calculateMetrics(filteredLogs, filteredPowerCurve);
      setMetrics(newMetrics);
    } else {
      // Eğer filtrelenmiş veri boşsa (örneğin seçili aralıkta veri yoksa) metrikleri sıfırla
      setMetrics({ operationalAvailability: 0, technicalAvailability: 0, mtbf: 0, mttr: 0, reliabilityR: 0 });
    }
  // useEffect'in bağımlılık dizisini FİLTRELENMİŞ VERİ olarak güncelle
  // Bu, dateRange her değiştiğinde yeniden hesaplama yapılmasını sağlar.
  }, [filteredLogs, filteredPowerCurve, setMetrics]);

  return (
    <DashboardLayout>
      {/* DataChart ve CriticalLogs bileşenleri zaten filtrelenmiş veriyi kullanıyor */}
      <DataChart />
      <div className={styles.bottomSection}>
        <CriticalLogs logs={filteredLogs} />
        <Sidebar>
          <CsvUploader />
          <DateRangePicker />
          <div className={sidebarStyles.section}>
            <div className={sidebarStyles.kpiGrid}>
              {/* KPI Kartları artık dinamik olarak güncellenen metrikleri gösterecek */}
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