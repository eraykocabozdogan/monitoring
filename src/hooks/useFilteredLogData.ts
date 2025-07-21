import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { TurbineEvent } from '../types/index';
import { useDebounce } from './useDebounce';

export const useFilteredLogData = () => {
  const { logEvents, dateRange, logFilters } = useAppStore();

  // --- PERFORMANS OPTİMİZASYONU / GÜNCELLENDİ ---
  // dateRange'in sürekli değişimini 200ms gecikmeyle takip et.
  const debouncedDateRange = useDebounce(dateRange, 200);

  const filteredData = useMemo(() => {
    // Filtreleme mantığı artık 'debouncedDateRange'e bağlandı.
    if (!debouncedDateRange || !debouncedDateRange.start || !debouncedDateRange.end || !logEvents) {
      return [];
    }
    
    const startTime = debouncedDateRange.start.getTime();
    const endTime = debouncedDateRange.end.getTime();

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
  // Bağımlılıklara dikkat: Artık 'dateRange' yerine 'debouncedDateRange' kullanılıyor.
  }, [logEvents, debouncedDateRange, logFilters]);

  return filteredData;
};