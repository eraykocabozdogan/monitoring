import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { TurbineEvent } from '../types/index';

export const useFilteredLogData = () => {
  const { logEvents, dateRange, logFilters, selectedFaultCategory } = useAppStore();

  const filteredData = useMemo(() => {
    if (!dateRange || !dateRange.start || !dateRange.end || !logEvents) {
      return [];
    }
    
    const startTime = dateRange.start.getTime();
    const endTime = dateRange.end.getTime();

    const isFilterActive = Object.values(logFilters).some(filterValues => filterValues && filterValues.length > 0);
    const isFaultCategoryFilterActive = selectedFaultCategory !== null;

    return logEvents.filter(event => {
      if (!event.timestamp) return false;
      const eventTime = event.timestamp.getTime();

      const inDateRange = eventTime >= startTime && eventTime <= endTime;
      if (!inDateRange) {
        return false;
      }

      // Apply fault category filter if active (from pie chart click)
      if (isFaultCategoryFilterActive) {
        if (event.category !== selectedFaultCategory) {
          return false;
        }
      }

      // Apply other filters including category filter from FilterModal
      if (isFilterActive) {
        const passesAllFilters = Object.entries(logFilters).every(([key, selectedValues]) => {
          if (!selectedValues || selectedValues.length === 0) {
            return true;
          }
          const eventValue = event[key as keyof TurbineEvent];
          if (eventValue === undefined || eventValue === null) {
            return false;
          }
          return selectedValues.includes(String(eventValue));
        });
        
        if (!passesAllFilters) {
          return false;
        }
      }

      return true;
    });
  }, [logEvents, dateRange, logFilters, selectedFaultCategory]);

  return filteredData;
};