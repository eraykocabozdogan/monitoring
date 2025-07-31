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
  const { 
    openFilterModal, 
    isFilterModalOpen, 
    selectedChartTimestamp, 
    setSelectedChartTimestamp,
    selectedFaultCategory,
    setSelectedFaultCategory 
  } = useAppStore();
  const listRef = useRef<List>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedChartTimestamp && logs.length > 0 && listRef.current) {
      const clickedTime = selectedChartTimestamp.getTime();
      const { lastTooltipFormat } = useAppStore.getState();
      const isDetailedZoom = lastTooltipFormat === 'detailed';
      
      let targetIndex = -1;
      
      if (isDetailedZoom) {
        let prevLogTimeDiff = Infinity;
        let prevLogIndex = -1;
        let closestTimeDiff = Infinity;
        let closestIndex = -1;
        
        logs.forEach((log, index) => {
          if (log.timestamp) {
            const timeDiff = log.timestamp.getTime() - clickedTime;
            const absTimeDiff = Math.abs(timeDiff);
            
            if (absTimeDiff < closestTimeDiff) {
              closestTimeDiff = absTimeDiff;
              closestIndex = index;
            }
            
            if (timeDiff <= 0 && Math.abs(timeDiff) < prevLogTimeDiff) {
              prevLogTimeDiff = Math.abs(timeDiff);
              prevLogIndex = index;
            }
          }
        });
        
        targetIndex = prevLogIndex !== -1 ? prevLogIndex : closestIndex;
        
      } else {
        const clickedDate = new Date(selectedChartTimestamp);
        clickedDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(clickedDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        const dayStart = clickedDate.getTime();
        const dayEnd = nextDay.getTime();
        
        for (let i = 0; i < logs.length; i++) {
          const log = logs[i];
          if (log.timestamp) {
            const logTime = log.timestamp.getTime();
            if (logTime >= dayStart && logTime < dayEnd) {
              targetIndex = i;
              break;
            }
          }
        }
      }
      
      if (targetIndex !== -1) {
        listRef.current.scrollToItem(targetIndex, 'start');
        
        if (containerRef.current) {
          containerRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }
      
      setSelectedChartTimestamp(null);
    }
  }, [selectedChartTimestamp, logs, setSelectedChartTimestamp]);

  return (
    <>
      {isFilterModalOpen && <FilterModal />}

      <div ref={containerRef} className={styles.logsCard}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            Logs ({logs.length})
            {selectedFaultCategory && (
              <span className={styles.categoryFilter}>
                → {selectedFaultCategory}
              </span>
            )}
          </h2>
          <div className={styles.headerButtons}>
            {selectedFaultCategory && (
              <button 
                onClick={() => setSelectedFaultCategory(null)} 
                className={styles.clearCategoryButton}
                title="Clear fault category filter"
              >
                ✕ Clear Category
              </button>
            )}
            <button onClick={openFilterModal} className={styles.filterButton}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
              <span>Filter</span>
            </button>
          </div>
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