import { useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { useFilteredLogData } from './hooks/useFilteredLogData.js';
import { calculateMetrics } from './utils/calculations.js';

import CsvUploader from './components/CsvUploader';
import DataChart from './components/DataChart';
import DashboardLayout from './components/DashboardLayout';
import styles from './components/DashboardLayout/DashboardLayout.module.css';
import CriticalLogs from './components/CriticalLogs';
import KpiCard from './components/KpiCard';
import DateRangePicker from './components/DateRangePicker';
import Comments from './components/Comments';

function App() {
  const { setMetrics, metrics, logEvents, powerCurveData, dateRange, theme } = useAppStore();
  const [showControls, setShowControls] = useState(true); // Kontrollerin görünürlüğü için state
  
  const filteredLogsForTable = useFilteredLogData();

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (logEvents.length > 0 && powerCurveData.length > 0 && dateRange.start && dateRange.end) {
      const newMetrics = calculateMetrics(logEvents, powerCurveData, dateRange);
      setMetrics(newMetrics);
    } else {
      setMetrics({ operationalAvailability: 0, technicalAvailability: 0, mtbf: 0, mttr: 0, reliabilityR: 0 });
    }
  }, [logEvents, powerCurveData, dateRange, setMetrics]);

  return (
    <DashboardLayout>
      <DataChart />

      <div className={styles.bottomSection}>
        {/* Sol Sütun İçeriği */}
        <div>
          {/* Ana Kontrol Bölümü */}
          <div className={styles.topControlsSection}>
            {/* Üst Sıra: KPI Metrikleri ve Kontrol Butonu */}
            <div className={styles.kpiRow}>
              <KpiCard title="Operational Availability (Ao)" value={metrics.operationalAvailability} unit="%" />
              <KpiCard title="Technical Availability (At)" value={metrics.technicalAvailability} unit="%" />
              <KpiCard title="MTBF" value={metrics.mtbf} unit="hours" />
              <KpiCard title="MTTR" value={metrics.mttr} unit="hours" />
              <KpiCard title="Reliability (R)" value={metrics.reliabilityR} unit="%" />
              <div className={styles.buttonContainer}>
                <button
                    onClick={() => setShowControls(!showControls)}
                    className={styles.toggleButton}
                    title={showControls ? "Hide Controls" : "Show Controls"}
                >
                  <span className={styles.buttonText}>Upload & Range</span>
                  <span className={styles.buttonArrow}>{showControls ? '▲' : '▼'}</span>
                </button>
              </div>
            </div>

            {/* Alt Sıra: Diğer Kontroller (Gizlenebilir) */}
            {showControls && (
                <div className={styles.controlsRow}>
                    <CsvUploader />
                    <DateRangePicker />
                </div>
            )}
          </div>
          
          <CriticalLogs logs={filteredLogsForTable} />
        </div>

        {/* Sağ Sütun İçeriği */}
        <div>
          <Comments />
        </div>
      </div>
    </DashboardLayout>
  );
}

export default App;