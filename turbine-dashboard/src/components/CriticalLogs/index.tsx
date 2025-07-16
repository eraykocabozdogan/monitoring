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
    'information': true,
    'warning': true,
  });

  const handleFilterChange = (eventType: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      [eventType]: !prev[eventType],
    }));
  };

  const validLogs = Array.isArray(logs) ? logs : [];

  const relevantEventTypes = useMemo(() => [
    'safety critical fault',
    'fault',
    'information',
    'warning'
  ], []);

  const relevantEvents = useMemo(() => validLogs.filter(log =>
    log.eventType && relevantEventTypes.includes(log.eventType.toLowerCase().trim())
  ), [validLogs, relevantEventTypes]);

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
            {/* Tablo başlığına "Name" sütunu eklendi */}
            <tr><th>Date</th><th>Time</th><th>Status</th><th>Name</th><th>Event Type</th><th>Description</th><th>Category</th><th>CCU Event</th></tr>
          </thead>
          <tbody>
            {filteredEvents.length > 0 ? (
              filteredEvents.map((log, index) => (
                <tr key={`${log.timestamp?.getTime()}-${index}`}>
                  <td>{log.timestamp ? format(log.timestamp, 'MMM d, yyyy') : '--'}</td>
                  <td>{log.timestamp ? format(log.timestamp, 'HH:mm:ss') : '--'}</td>
                  <td>{log.status || '--'}</td>
                  {/* Her satıra "Name" verisi eklendi */}
                  <td>{log.name || '--'}</td>
                  <td>{log.eventType || '--'}</td>
                  <td>{log.description}</td>
                  <td>{log.category || '--'}</td>
                  <td>{log.ccuEvent || '--'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: '#888' }}>
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