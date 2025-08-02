import React from 'react';
import styles from '../DataChart.module.css';

interface ChartControlsProps {
  chartMode: 'normal' | 'interval' | 'pin';
  pendingInterval: { startTimestamp: Date } | null;
  chartPins: unknown[];
  chartIntervals: unknown[];
  onModeChange: (mode: 'normal' | 'interval' | 'pin') => void;
  onClearSelections: () => void;
}

const ChartControls: React.FC<ChartControlsProps> = ({
  chartMode,
  pendingInterval,
  chartPins,
  chartIntervals,
  onModeChange,
  onClearSelections,
}) => {
  const toggleIntervalMode = () => {
    onModeChange(chartMode === 'interval' ? 'normal' : 'interval');
  };

  const togglePinMode = () => {
    onModeChange(chartMode === 'pin' ? 'normal' : 'pin');
  };

  const getIntervalButtonText = () => {
    if (chartMode !== 'interval') return 'Select Interval';
    return pendingInterval ? 'Click to end interval' : 'Click to start interval';
  };

  return (
    <div className={styles.controls}>
      <button
        className={`${styles.controlButton} ${chartMode === 'interval' ? styles.active : ''}`}
        onClick={toggleIntervalMode}
      >
        {getIntervalButtonText()}
      </button>
      <button
        className={`${styles.controlButton} ${chartMode === 'pin' ? styles.active : ''}`}
        onClick={togglePinMode}
      >
        Add Pin
      </button>
      <button
        className={styles.controlButton}
        onClick={onClearSelections}
        disabled={chartPins.length === 0 && chartIntervals.length === 0}
      >
        Clear Selections
      </button>
    </div>
  );
};

export default ChartControls;
