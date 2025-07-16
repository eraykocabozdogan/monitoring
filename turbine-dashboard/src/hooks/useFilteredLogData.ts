import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore.js';

export const useFilteredLogData = () => {
  const { logEvents, dateRange } = useAppStore();

  const filteredData = useMemo(() => {
    if (!dateRange || !dateRange.start || !dateRange.end || !logEvents) {
      return [];
    }
    
    const startTime = dateRange.start.getTime();
    const endTime = dateRange.end.getTime();

    return logEvents.filter(event => {
      if (!event.timestamp) return false;
      const eventTime = event.timestamp.getTime();
      return eventTime >= startTime && eventTime <= endTime;
    });
  }, [logEvents, dateRange]);

  return filteredData;
};