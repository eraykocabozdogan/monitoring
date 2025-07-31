import React, { memo, useRef, useEffect } from 'react';
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
  
  // DÜZELTME: Zamanı, tarayıcının yerel saatine çevirmeden, doğrudan UTC olarak gösteriyoruz.
  const dateStr = log.timestamp ? log.timestamp.toISOString().slice(0, 10) : '--';
  const timeStr = log.timestamp ? log.timestamp.toISOString().slice(11, 19) : '--';

  return (
    <div className={styles.tableRow} style={style}>
      <div className={styles.tableCell}>{dateStr}</div>
      <div className={styles.tableCell}>{timeStr}</div>
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
  const { openFilterModal, isFilterModalOpen, selectedChartTimestamp, setSelectedChartTimestamp } = useAppStore();
  const listRef = useRef<List>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Chart'tan seçilen timestamp'a göre log listesinde ilgili log'a scroll yap
  useEffect(() => {
    console.log('CriticalLogs useEffect triggered:', { selectedChartTimestamp, logsLength: logs.length }); // Debug için
    
    if (selectedChartTimestamp && logs.length > 0 && listRef.current) {
      // Tıklanan zamana en yakın log'u bul
      let closestLogIndex = -1;
      let minTimeDiff = Infinity;
      
      logs.forEach((log, index) => {
        if (log.timestamp) {
          const timeDiff = Math.abs(log.timestamp.getTime() - selectedChartTimestamp.getTime());
          if (timeDiff < minTimeDiff) {
            minTimeDiff = timeDiff;
            closestLogIndex = index;
          }
        }
      });
      
      console.log('Found closest log at index:', closestLogIndex, 'for timestamp:', selectedChartTimestamp); // Debug için
      if (closestLogIndex !== -1) {
        console.log('Closest log timestamp:', logs[closestLogIndex].timestamp, 'Time diff (ms):', minTimeDiff); // Debug için
        
        // İlgili log'a scroll yap - 'start' ile en üstte görünsün
        listRef.current.scrollToItem(closestLogIndex, 'start');
        console.log('Scrolled to log index:', closestLogIndex); // Debug için
        
        // Log container'ına scroll yap
        if (containerRef.current) {
          containerRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
          console.log('Scrolled to logs section'); // Debug için
        }
      }
      
      // Timestamp'i temizle (tek seferlik işlem)
      setSelectedChartTimestamp(null);
    }
  }, [selectedChartTimestamp, logs, setSelectedChartTimestamp]);

  return (
    <>
      {isFilterModalOpen && <FilterModal />}

      <div ref={containerRef} className={styles.logsCard}>
        <div className={styles.header}>
          <h2 className={styles.title}>Logs ({logs.length})</h2>
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
                ref={listRef}
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