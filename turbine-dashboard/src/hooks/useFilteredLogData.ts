import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore.js';
import type { TurbineEvent } from '../types/index.js';

export const useFilteredLogData = () => {
  const { logEvents, dateRange, logFilters } = useAppStore();

  const filteredData = useMemo(() => {
    // Tarih aralığı seçilmemişse veya log yoksa boş dizi döndür
    if (!dateRange || !dateRange.start || !dateRange.end || !logEvents) {
      return [];
    }
    
    const startTime = dateRange.start.getTime();
    const endTime = dateRange.end.getTime();

    // Filtrelerin uygulanıp uygulanmadığını kontrol et
    const isFilterActive = Object.values(logFilters).some(filterValues => filterValues.length > 0);

    return logEvents.filter(event => {
      if (!event.timestamp) return false;
      const eventTime = event.timestamp.getTime();

      // 1. Tarih Aralığı Kontrolü
      const inDateRange = eventTime >= startTime && eventTime <= endTime;
      if (!inDateRange) {
        return false;
      }

      // 2. Gelişmiş Filtre Kontrolü
      if (!isFilterActive) {
        return true; // Eğer aktif filtre yoksa, tarih aralığındaki tüm logları döndür
      }

      // Filtrelerin her bir kategorisine bakar (every -> AND mantığı)
      return Object.entries(logFilters).every(([key, selectedValues]) => {
        if (!selectedValues || selectedValues.length === 0) {
          return true; // Bu kategori için filtre seçilmemişse, geç
        }
        const eventValue = event[key as keyof TurbineEvent];
        if (eventValue === undefined || eventValue === null) {
          return false; // Log'da bu değer yoksa, gösterme
        }
        return selectedValues.includes(String(eventValue));
      });
    });
  }, [logEvents, dateRange, logFilters]);

  return filteredData;
};