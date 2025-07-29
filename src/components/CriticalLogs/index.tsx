import React, { memo } from 'react';
import { format } from 'date-fns';
import { useAppStore } from '../../store/useAppStore';
import type { TurbineEvent } from '../../types/index.js';
import styles from './CriticalLogs.module.css';
import FilterModal from '../FilterModal';
import { FixedSizeList as List } from 'react-window';

interface CriticalLogsProps {
  logs: TurbineEvent[];
}

const LogRow = memo(({ index, style, data }: { index: number, style: React.CSSProperties, data: TurbineEvent[] }) => {
  const log = data[index];
  return (
    <div className={styles.tableRow} style={style}>
      <div className={styles.tableCell}>{log.timestamp ? format(log.timestamp, 'MMM d, yyyy') : '--'}</div>
      <div className={styles.tableCell}>{log.timestamp ? format(log.timestamp, 'HH:mm:ss') : '--'}</div>
      <div className={styles.tableCell}>{log.status || '--'}</div>
      <div className={styles.tableCell}>{log.name || '--'}</div>
      <div className={styles.tableCell}>{log.eventType || '--'}</div>
      <div className={styles.tableCell} title={log.description}>{log.description}</div>
      <div className={styles.tableCell}>{log.category || '--'}</div>
      <div className={styles.tableCell}>{log.ccuEvent || '--'}</div>
    </div>
  );
});

const CriticalLogs: React.FC<CriticalLogsProps> = ({ logs }) => {
  const { openFilterModal, isFilterModalOpen } = useAppStore();

  return (
    <>
      {isFilterModalOpen && <FilterModal />}

      <div className={styles.logsCard}>
        <div className={styles.header}>
          <h2 className={styles.title}>Critical Logs ({logs.length})</h2>
          <button onClick={openFilterModal} className={styles.filterButton}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            <span>Filter</span>
          </button>
        </div>
        
        <div className={styles.tableContainer}>
          <div className={styles.tableHeader}>
            <div className={styles.tableCell}>Date</div>
            <div className={styles.tableCell}>Time</div>
            <div className={styles.tableCell}>Status</div>
            <div className={styles.tableCell}>Name</div>
            <div className={styles.tableCell}>Event Type</div>
            <div className={styles.tableCell}>Description</div>
            <div className={styles.tableCell}>Category</div>
            <div className={styles.tableCell}>CCU Event</div>
          </div>

          <div className={styles.tableBody}>
            {logs.length > 0 ? (
              <List
                height={560}
                itemCount={logs.length}
                itemSize={45}
                width="100%"
                itemData={logs}
              >
                {LogRow}
              </List>
            ) : (
              <div className={styles.noLogs}>
                No logs to display for the selected date range and filters.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default memo(CriticalLogs);