import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { TurbineEvent } from '../types/index';

export const useFilteredLogData = () => {
  const { logEvents, dateRange, logFilters } = useAppStore();

  const filteredData = useMemo(() => {
    if (!dateRange || !dateRange.start || !dateRange.end || !logEvents) {
      return [];
    }
    
    const startTime = dateRange.start.getTime();
    const endTime = dateRange.end.getTime();

    const isFilterActive = Object.values(logFilters).some(filterValues => filterValues.length > 0);

    return logEvents.filter(event => {
      if (!event.timestamp) return false;
      const eventTime = event.timestamp.getTime();

      const inDateRange = eventTime >= startTime && eventTime <= endTime;
      if (!inDateRange) {
        return false;
      }

      if (!isFilterActive) {
        return true;
      }

      return Object.entries(logFilters).every(([key, selectedValues]) => {
        if (!selectedValues || selectedValues.length === 0) {
          return true;
        }
        const eventValue = event[key as keyof TurbineEvent];
        if (eventValue === undefined || eventValue === null) {
          return false;
        }
        return selectedValues.includes(String(eventValue));
      });
    });
  }, [logEvents, dateRange, logFilters]);

  return filteredData;
};