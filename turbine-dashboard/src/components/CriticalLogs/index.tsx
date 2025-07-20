import React, { memo } from 'react';
import { format } from 'date-fns';
import { useAppStore } from '../../store/useAppStore';
import type { TurbineEvent } from '../../types/index.js';
import styles from './CriticalLogs.module.css';
import FilterModal from '../FilterModal'; // Modal'ı import et

interface CriticalLogsProps {
  logs: TurbineEvent[];
}

const CriticalLogs: React.FC<CriticalLogsProps> = ({ logs }) => {
  const { openFilterModal, isFilterModalOpen } = useAppStore();

  return (
    <>
      {/* Filtre modali, durumu store'dan okunarak gösterilir */}
      {isFilterModalOpen && <FilterModal />}

      <div className={styles.logsCard}>
        <div className={styles.header}>
          <h2 className={styles.title}>Critical Logs</h2>
          {/* Yeni Filtreleme Butonu */}
          <button onClick={openFilterModal} className={styles.filterButton}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            <span>Filter</span>
          </button>
        </div>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Name</th>
                <th>Event Type</th>
                <th>Description</th>
                <th>Category</th>
                <th>CCU Event</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <tr key={`${log.timestamp?.getTime()}-${index}`}>
                    <td>{log.timestamp ? format(log.timestamp, 'MMM d, yyyy') : '--'}</td>
                    <td>{log.timestamp ? format(log.timestamp, 'HH:mm:ss') : '--'}</td>
                    <td>{log.status || '--'}</td>
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
                    No logs to display for the selected date range and filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default memo(CriticalLogs);