import Papa from 'papaparse';
import type { TurbineEvent, PowerCurvePoint } from '../types/index.js';

// Gerekli başlıkları tanımla
const POWER_CURVE_HEADERS = ['TimeStamp', 'Actual Wind Speed (m/s)', 'Power (kW)'];
const EVENT_LOG_HEADERS = ['Timestamp', 'Status', 'Name'];

interface ParsedData {
  logs: TurbineEvent[];
  power: PowerCurvePoint[];
}

// Dosya türünü başlıklarına göre tanımlar.
const identifyFileType = (headers: string[]): 'power' | 'log' | 'unknown' => {
  const hasPowerHeaders = POWER_CURVE_HEADERS.every(h => headers.includes(h));
  if (hasPowerHeaders) return 'power';

  const hasLogHeaders = EVENT_LOG_HEADERS.every(h => headers.includes(h));
  if (hasLogHeaders) return 'log';

  return 'unknown';
};

// Tek bir dosyayı ayrıştırır ve veriyi ilgili tipe dönüştürür.
const parseFile = (file: File): Promise<{ type: 'power' | 'log' | 'unknown'; data: (PowerCurvePoint | TurbineEvent)[] }> => {
  return new Promise((resolve, reject) => {
    Papa.parse<any>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: header => header.trim(),
      complete: (results) => {
        if (!results.meta.fields) {
            return reject(new Error("CSV başlıkları okunamadı."));
        }
        const headers = results.meta.fields;
        const fileType = identifyFileType(headers);

        if (fileType === 'unknown') {
            console.warn("Dosya formatı tanınamadı. Bulunan başlıklar:", headers);
            return resolve({ type: 'unknown', data: [] });
        }
        
        let parsedData: (PowerCurvePoint | TurbineEvent)[] = [];

        try {
            if (fileType === 'power') {
              parsedData = results.data.map((row): PowerCurvePoint | null => {
                const timestamp = new Date(row['TimeStamp']?.replace(' ', 'T') + 'Z');
                const power = parseFloat(row['Power (kW)']);
                const windSpeed = parseFloat(row['Actual Wind Speed (m/s)']);
                if (isNaN(timestamp.getTime()) || isNaN(power) || isNaN(windSpeed)) return null;
                return { timestamp, windSpeed, power };
              }).filter((d): d is PowerCurvePoint => d !== null);
            } else if (fileType === 'log') {
              parsedData = results.data.map((row): TurbineEvent | null => {
                 const timestamp = new Date(row['Timestamp']?.replace(' ', 'T') + 'Z');
                 if (isNaN(timestamp.getTime())) return null;
                 return {
                    timestamp,
                    status: row['Status'] || '',
                    name: row['Name'] || '',
                 };
              }).filter((d): d is TurbineEvent => d !== null);
            }
            resolve({ type: fileType, data: parsedData });
        } catch (error) {
            reject(error);
        }
      },
      error: (error: Error) => reject(error),
    });
  });
};

// Birden fazla CSV dosyasını ayrıştırır ve log/power olarak ayırır.
export const parseCsvFiles = async (files: File[]): Promise<ParsedData> => {
  const results: ParsedData = { logs: [], power: [] };
  const parsePromises = files.map(file => parseFile(file));
  
  try {
    const parsedResults = await Promise.all(parsePromises);
    for (const result of parsedResults) {
      if (result.type === 'log') {
        results.logs.push(...(result.data as TurbineEvent[]));
      } else if (result.type === 'power') {
        results.power.push(...(result.data as PowerCurvePoint[]));
      }
    }

    results.logs.sort((a, b) => a.timestamp!.getTime() - b.timestamp!.getTime());
    results.power.sort((a, b) => a.timestamp!.getTime() - b.timestamp!.getTime());
    
    return results;
  } catch (error) {
    console.error("Dosya ayrıştırma sırasında kritik hata:", error);
    // Hata durumunda boş bir sonuç döndürerek uygulamanın çökmesini engelle.
    return { logs: [], power: [] };
  }
};