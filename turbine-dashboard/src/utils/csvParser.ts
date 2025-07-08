import Papa from 'papaparse';
import type { TurbineEvent } from '../types';

export const parseCsvFile = (file: File): Promise<TurbineEvent[]> => {
  return new Promise((resolve, reject) => {
    const results: TurbineEvent[] = [];

    Papa.parse<TurbineEvent>(file, {
      header: true,
      skipEmptyLines: true,
      transform: (value: string, field: string) => {
        // Convert specific fields to appropriate types
        switch (field) {
          case 'power':
          case 'windSpeed':
            return Number(value);
          case 'timestamp':
            return new Date(value);
          default:
            return value;
        }
      },
      step: (row: Papa.ParseStepResult<TurbineEvent>) => {
        // Add each parsed row to results
        if (row.data) {
          results.push(row.data);
        }
      },
      complete: () => {
        resolve(results);
      },
      error: (error: Error) => {
        reject(error);
      }
    });
  });
};
