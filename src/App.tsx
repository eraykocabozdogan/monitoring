import { useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { useFilteredLogData } from './hooks/useFilteredLogData.js';
import { calculateMetrics } from './utils/calculations.js';
import { useDebounce } from './hooks/useDebounce'; // Debounce hook'unu import et

import CsvUploader from './components/CsvUploader';
import DataChart from './components/DataChart';
import DashboardLayout from './components/DashboardLayout';
import styles from './components/DashboardLayout/DashboardLayout.module.css';
import CriticalLogs from './components/CriticalLogs';
import KpiCard from './components/KpiCard';
import DateRangePicker from './components/DateRangePicker';
import Comments from './components/Comments';
import Spinner from './components/Spinner';

function App() {
  const { setMetrics, metrics, logEvents, powerCurveData, dateRange, theme, isLoading } = useAppStore();
  const [showControls, setShowControls] = useState(true);
  
  // Orijinal dateRange'i 500ms gecikmeyle takip eden yeni bir state
  const debouncedDateRange = useDebounce(dateRange, 500);

  const filteredLogsForTable = useFilteredLogData();

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  // Metrik hesaplama useEffect'i artık 'debouncedDateRange'e bağlandı.
  // Bu sayede hesaplama sadece kullanıcı durduktan sonra yapılacak.
  useEffect(() => {
    if (logEvents.length > 0 && powerCurveData.length > 0 && debouncedDateRange.start && debouncedDateRange.end) {
      const newMetrics = calculateMetrics(logEvents, powerCurveData, debouncedDateRange);
      setMetrics(newMetrics);
    } else {
      setMetrics({ operationalAvailability: 0, technicalAvailability: 0, mtbf: 0, mttr: 0, reliabilityR: 0 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logEvents, powerCurveData, debouncedDateRange, setMetrics]); // setMetrics'i bağımlılıktan çıkarabiliriz

  return (
    <DashboardLayout>
      {isLoading && <Spinner />}

      <DataChart />

      <div className={styles.bottomSection}>
        <div>
          <div className={styles.topControlsSection}>
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

            {showControls && (
                <div className={styles.controlsRow}>
                    <CsvUploader />
                    <DateRangePicker />
                </div>
            )}
          </div>
          
          <CriticalLogs logs={filteredLogsForTable} />
        </div>

        <div>
          <Comments />
        </div>
      </div>
    </DashboardLayout>
  );
}

export default App;