import { useState, useEffect } from 'react';

/**
 * Bir değerin hızlı değişimini yavaşlatarak (debounce) performansı artırır.
 * Yalnızca belirtilen gecikme süresi boyunca değer değişmediğinde güncellenir.
 * @param value Yavaşlatılacak değer (örn: dateRange).
 * @param delay Gecikme süresi (milisaniye olarak).
 * @returns Yavaşlatılmış (debounced) değer.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Değer değiştiğinde bir zamanlayıcı ayarla
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Eğer değer tekrar değişirse (delay bitmeden), önceki zamanlayıcıyı temizle.
    // Bu sayede sadece kullanıcı durduğunda son değer set edilir.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Sadece değer veya gecikme süresi değiştiğinde çalışır

  return debouncedValue;
}