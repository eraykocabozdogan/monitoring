// src/components/CriticalLogs/index.tsx
import React, { memo } from 'react';
import { format } from 'date-fns';
import type { TurbineEvent } from '../../types/index.js';
import styles from './CriticalLogs.module.css';

interface CriticalLogsProps {
  logs: TurbineEvent[];
}

const CriticalLogs: React.FC<CriticalLogsProps> = ({ logs }) => {
  // Gelen logların bir dizi olduğundan emin ol
  const validLogs = Array.isArray(logs) ? logs : [];

  // Sadece 'safety critical fault' veya 'fault' eventType'ına sahip logları filtrele
  const criticalEvents = validLogs.filter(log =>
    log.eventType && (log.eventType.toLowerCase().trim() === 'safety critical fault' || log.eventType.toLowerCase().trim() === 'fault')
  );

  return (
    <div className={styles.logsCard}>
      <h2 className={styles.title}>Critical Logs</h2>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr><th>Date</th><th>Time</th><th>Event Type</th><th>Message</th></tr>
          </thead>
          <tbody>
            {criticalEvents.length > 0 ? (
              criticalEvents.map((log, index) => (
                <tr key={`${log.timestamp?.getTime()}-${index}`}><td>{log.timestamp ? format(log.timestamp, 'MMM d, yyyy') : '--'}</td><td>{log.timestamp ? format(log.timestamp, 'HH:mm:ss') : '--'}</td><td>{log.eventType || '--'}</td><td>{log.description}</td></tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: '#888' }}>
                  No logs to display for the selected range.
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