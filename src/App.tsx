import { useEffect, useState, useMemo } from 'react';
import { useAppStore } from './store/useAppStore';
import { useFilteredLogData } from './hooks/useFilteredLogData';
import { calculateMetrics } from './utils/calculations';
import { useDebounce } from './hooks/useDebounce';

import Login from './components/Login';
import CsvUploader from './components/CsvUploader';
import DataChart from './components/DataChart';
import DashboardLayout from './components/DashboardLayout';
import styles from './components/DashboardLayout/DashboardLayout.module.css';
import CriticalLogs from './components/CriticalLogs';
import KpiCard from './components/KpiCard';
import DateRangePicker from './components/DateRangePicker';
import Comments from './components/Comments';
import Spinner from './components/Spinner';
import PerformanceScatterChart from './components/PerformanceScatterChart';
import FaultDistributionChart from './components/FaultDistributionChart';
import WeeklyKpiChart from './components/WeeklyKpiChart';

function App() {
  const isAuthenticated = useAppStore(state => state.isAuthenticated);
  const { 
    setMetrics, 
    metrics, 
    lightweightLogEvents, 
    dateRange, 
    theme, 
    isLoading 
  } = useAppStore();
  const [showControls, setShowControls] = useState(true);
  
  const debouncedDateRange = useDebounce(dateRange, 200);
  const filteredLogsForTable = useFilteredLogData();

  const filteredLogsForMetrics = useMemo(() => {
    if (!debouncedDateRange.start || !debouncedDateRange.end) {
      return [];
    }
    const startTime = debouncedDateRange.start.getTime();
    const endTime = debouncedDateRange.end.getTime();
    return lightweightLogEvents.filter(log => {
      if (!log.timestamp) return false;
      const eventTime = log.timestamp.getTime();
      return eventTime >= startTime && eventTime <= endTime;
    });
  }, [lightweightLogEvents, debouncedDateRange]);

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (filteredLogsForMetrics.length > 0 && debouncedDateRange.start && debouncedDateRange.end) {
      const newMetrics = calculateMetrics(filteredLogsForMetrics, debouncedDateRange);
      setMetrics(newMetrics);
    } else {
      setMetrics({ operationalAvailability: 0, technicalAvailability: 0, mtbf: 0, mttr: 0, reliabilityR: 0 });
    }
  }, [filteredLogsForMetrics, debouncedDateRange, setMetrics]);

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <DashboardLayout>
      {isLoading && <Spinner />}

      <DataChart />

      <div className={styles.chartsRow}>
        <PerformanceScatterChart />
        <FaultDistributionChart />
        <WeeklyKpiChart />
      </div>

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