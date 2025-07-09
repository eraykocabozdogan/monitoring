// src/components/CriticalLogs/index.tsx
import React, { memo, useState, useMemo } from 'react';
import { format } from 'date-fns';
import type { TurbineEvent } from '../../types/index.js';
import styles from './CriticalLogs.module.css';

interface CriticalLogsProps {
  logs: TurbineEvent[];
}

const CriticalLogs: React.FC<CriticalLogsProps> = ({ logs }) => {
  const [selectedFilters, setSelectedFilters] = useState<Record<string, boolean>>({
    'fault': true,
    'safety critical fault': true,
  });

  const handleFilterChange = (eventType: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      [eventType]: !prev[eventType],
    }));
  };

  // Gelen logların bir dizi olduğundan emin ol
  const validLogs = Array.isArray(logs) ? logs : [];

  // Önce kritik logları filtrele
  const criticalEvents = useMemo(() => validLogs.filter(log =>
    log.eventType && (log.eventType.toLowerCase().trim() === 'safety critical fault' || log.eventType.toLowerCase().trim() === 'fault')
  ), [validLogs]);

  // Sonra seçili filtrelere göre tekrar filtrele
  const filteredEvents = useMemo(() => {
    const activeFilters = Object.entries(selectedFilters)
      .filter(([, isActive]) => isActive)
      .map(([key]) => key);

    // Eğer hiçbir filtre aktif değilse veya hepsi aktifse, tüm kritik eventleri göster
    if (activeFilters.length === 0 || activeFilters.length === Object.keys(selectedFilters).length) {
      return criticalEvents;
    }

    return criticalEvents.filter(log =>
      log.eventType && activeFilters.includes(log.eventType.toLowerCase().trim())
    );
  }, [criticalEvents, selectedFilters]);


  return (
    <div className={styles.logsCard}>
      <div className={styles.header}>
        <h2 className={styles.title}>Critical Logs</h2>
        <div className={styles.filterContainer}>
          <span className={styles.filterTitle}>Filter by Event Type:</span>
          {Object.keys(selectedFilters).map(filterKey => (
            <label key={filterKey} className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={selectedFilters[filterKey]}
                onChange={() => handleFilterChange(filterKey)}
              />
              {filterKey.charAt(0).toUpperCase() + filterKey.slice(1)}
            </label>
          ))}
        </div>
      </div>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr><th>Date</th><th>Time</th><th>Event Type</th><th>Message</th></tr>
          </thead>
          <tbody>
            {filteredEvents.length > 0 ? (
              filteredEvents.map((log, index) => (
                <tr key={`${log.timestamp?.getTime()}-${index}`}><td>{log.timestamp ? format(log.timestamp, 'MMM d, yyyy') : '--'}</td><td>{log.timestamp ? format(log.timestamp, 'HH:mm:ss') : '--'}</td><td>{log.eventType || '--'}</td><td>{log.description}</td></tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: '#888' }}>
                  No logs to display for the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default memo(CriticalLogs);