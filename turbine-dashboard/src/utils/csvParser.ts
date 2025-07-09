import Papa from 'papaparse';
// Hatanın olduğu import'u 'import type' olarak düzeltiyoruz
import type { TurbineEvent } from '../types/index.js';

export const parseCsvFile = (file: File): Promise<TurbineEvent[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse<any>(file, {
      header: true,
      skipEmptyLines: true,
      transform: (value: string, header: string) => {
        if (header === 'Power (kW)' || header === 'Wind Speed (m/s)') {
          return parseFloat(value) || 0;
        }
        if (header === 'Timestamp') {
          const isoString = value.replace(' ', 'T') + 'Z';
          const date = new Date(isoString);
          return isNaN(date.getTime()) ? null : date;
        }
        return value;
      },
      complete: (results) => {
        const cleanData = (results.data as any[]).filter(row => row.Timestamp);

        const finalData: TurbineEvent[] = cleanData.map(row => ({
            timestamp: row.Timestamp,
            status: row.Status,
            description: row.Description,
            category: row.Category,
            eventType: row['Event Type'], // Burası düzeltildi!
            power: row['Power (kW)'],
            windSpeed: row['Wind Speed (m/s)']
        }));

        resolve(finalData);
      },
      error: (error: Error) => {
        reject(error);
      },
    });
  });
};