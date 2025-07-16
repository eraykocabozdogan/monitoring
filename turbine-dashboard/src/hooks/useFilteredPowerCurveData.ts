import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore.js';

export const useFilteredPowerCurveData = () => {
  const { powerCurveData, dateRange } = useAppStore();

  const filteredData = useMemo(() => {
    if (!dateRange || !dateRange.start || !dateRange.end || !powerCurveData) {
      return [];
    }
    
    const startTime = dateRange.start.getTime();
    const endTime = dateRange.end.getTime();

    return powerCurveData.filter(event => {
      if (!event.timestamp) return false;
      const eventTime = event.timestamp.getTime();
      return eventTime >= startTime && eventTime <= endTime;
    });
  }, [powerCurveData, dateRange]);

  return filteredData;
};