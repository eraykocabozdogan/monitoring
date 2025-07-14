// src/components/CriticalLogs/index.tsx
import React, { memo, useState, useMemo } from 'react';
import { format } from 'date-fns';
import type { TurbineEvent } from '../../types/index.js';
import styles from './CriticalLogs.module.css';

interface CriticalLogsProps {
  logs: TurbineEvent[];
}

const CriticalLogs: React.FC<CriticalLogsProps> = ({ logs }) => {
  // 1. "Information" ve "Warning" filtrelerini başlangıç durumu olarak ekle
  const [selectedFilters, setSelectedFilters] = useState<Record<string, boolean>>({
    'fault': true,
    'safety critical fault': true,
    'information': true, // Yeni filtre
    'warning': true,     // Yeni filtre
  });

  const handleFilterChange = (eventType: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      [eventType]: !prev[eventType],
    }));
  };

  const validLogs = Array.isArray(logs) ? logs : [];

  // 2. Filtrelenecek olay türlerinin listesini genişlet
  const relevantEventTypes = useMemo(() => [
    'safety critical fault',
    'fault',
    'information',
    'warning'
  ], []);

  // Olayları ilgili türlere göre filtrele
  const relevantEvents = useMemo(() => validLogs.filter(log =>
    log.eventType && relevantEventTypes.includes(log.eventType.toLowerCase().trim())
  ), [validLogs, relevantEventTypes]);

  // Seçili filtrelere göre son filtrelemeyi yap
  const filteredEvents = useMemo(() => {
    const activeFilters = Object.entries(selectedFilters)
      .filter(([, isActive]) => isActive)
      .map(([key]) => key);

    if (activeFilters.length === 0) {
      return [];
    }

    return relevantEvents.filter(log =>
      log.eventType && activeFilters.includes(log.eventType.toLowerCase().trim())
    );
  }, [relevantEvents, selectedFilters]);


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