import React from 'react';
import { format } from 'date-fns';
import type { ChartPin, ChartInterval } from '../../../types';
import styles from '../DataChart.module.css';

interface ChartSidebarProps {
  chartPins: ChartPin[];
  chartIntervals: ChartInterval[];
  onRemovePin: (pinId: string) => void;
  onRemoveInterval: (intervalId: string) => void;
}

const ChartSidebar: React.FC<ChartSidebarProps> = ({
  chartPins,
  chartIntervals,
  onRemovePin,
  onRemoveInterval,
}) => {
  const hasSelections = chartPins.length > 0 || chartIntervals.length > 0;

  return (
    <div className={styles.sidebar}>
      <h4 className={styles.sidebarTitle}>Chart Selections</h4>
      
      <div className={styles.selectionsList}>
        {!hasSelections && (
          <div className={styles.emptySelections}>
            No pins or intervals selected.
          </div>
        )}
        
        {chartPins.map(pin => (
          <div key={pin.id} className={`${styles.selectionItem} ${styles.pin}`}>
            <div className={styles.selectionHeader}>
              <span className={styles.selectionType}>Pin</span>
              <button
                className={styles.removeButton}
                onClick={() => onRemovePin(pin.id)}
                title="Remove pin"
              >
                ×
              </button>
            </div>
            <div className={styles.selectionDetails}>
              <div className={styles.timestamp}>
                {format(pin.timestamp, 'yyyy-MM-dd HH:mm:ss')}
              </div>
              <div className={styles.dataPoint}>
                Power: {pin.powerValid !== false ? `${pin.power.toFixed(2)} kW` : 'not valid data'}
              </div>
              <div className={styles.dataPoint}>
                Wind Speed: {pin.windSpeedValid !== false ? `${pin.windSpeed.toFixed(2)} m/s` : 'not valid data'}
              </div>
              {pin.expectedPower !== undefined && (
                <div className={styles.dataPoint}>
                  Expected Power: {pin.expectedPowerValid !== false ? `${pin.expectedPower.toFixed(2)} kW` : 'not valid data'}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {chartIntervals.map(interval => (
          <div key={interval.id} className={`${styles.selectionItem} ${styles.interval}`}>
            <div className={styles.selectionHeader}>
              <span className={styles.selectionType}>Interval</span>
              <button
                className={styles.removeButton}
                onClick={() => onRemoveInterval(interval.id)}
                title="Remove interval"
              >
                ×
              </button>
            </div>
            <div className={styles.selectionDetails}>
              <div className={styles.timestamp}>
                From: {format(interval.startTimestamp, 'yyyy-MM-dd HH:mm:ss')}
              </div>
              <div className={styles.intervalRange}>
                To: {format(interval.endTimestamp, 'yyyy-MM-dd HH:mm:ss')}
              </div>
              <div className={styles.intervalRange}>
                Duration: {Math.round((interval.endTimestamp.getTime() - interval.startTimestamp.getTime()) / (1000 * 60))} minutes
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChartSidebar;
