// src/hooks/useFilteredData.ts
import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore.js';

export const useFilteredData = () => {
  const { allEvents, dateRange } = useAppStore();

  const filteredData = useMemo(() => {
    // Eğer tarih aralığı seçilmemişse, tüm veriyi döndür
    if (!dateRange || !dateRange.start || !dateRange.end) {
      return allEvents;
    }
    
    const startTime = dateRange.start.getTime();
    const endTime = dateRange.end.getTime();

    // Sadece seçili zaman aralığındaki olayları filtrele
    return allEvents.filter(event => {
      if (!event.timestamp) return false;
      const eventTime = event.timestamp.getTime();
      return eventTime >= startTime && eventTime <= endTime;
    });
  }, [allEvents, dateRange]);

  return filteredData;
};