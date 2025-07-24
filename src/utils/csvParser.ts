import * as Papa from 'papaparse';
import type { TurbineEvent, PowerCurvePoint } from '../types/index';
import type { LightweightLogEvent } from '../store/useAppStore';

// Beklenen başlıklar güncellendi
const POWER_CURVE_HEADERS = ['TimeStamp', 'Actual Wind Speed (m/s)', 'Power (kW)', 'Ref Power (kW)'];
const EVENT_LOG_HEADERS = ['Timestamp', 'Status', 'Name', 'Description', 'Category', 'Event Type', 'CCU Event'];

interface ParsedData {
  logs: TurbineEvent[];
  power: PowerCurvePoint[];
  lightweightLogs: LightweightLogEvent[];
}

/**
 * Identifies the type of CSV file based on its headers.
 * @param headers - Array of header strings from the CSV.
 * @returns 'power' if it's a power curve file, 'log' if it's an event log file, or 'unknown'.
 */
const identifyFileType = (headers: string[]): 'power' | 'log' | 'unknown' => {
  const hasPowerCurveHeaders = POWER_CURVE_HEADERS.every(h => headers.includes(h));
  if (hasPowerCurveHeaders) {
    return 'power';
  }

  const hasEventLogHeaders = EVENT_LOG_HEADERS.every(h => headers.includes(h));
  if (hasEventLogHeaders) {
    return 'log';
  }

  return 'unknown';
};

interface ParsedFileResult {
  type: 'power' | 'log' | 'unknown';
  data: (PowerCurvePoint | TurbineEvent)[];
  lightweightData?: LightweightLogEvent[];
}

/**
 * Parses a single CSV file into the appropriate data structure.
 * @param file - The CSV file to parse.
 * @returns A promise that resolves with the parsed data and its type.
 */
const parseFile = (file: File): Promise<ParsedFileResult> => {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Papa.parse<any>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: header => header.trim(),
      complete: (results) => {
        const headers = results.meta.fields!;
        const fileType = identifyFileType(headers);

        if (fileType === 'unknown') {
            return resolve({ type: 'unknown', data: [] });
        }
        
        if (fileType === 'power') {
          const powerData = results.data.map((row): PowerCurvePoint => {
            // DÜZELTME: parseFloat'tan önce virgülden kurtuluyoruz.
            const powerValue = row['Power (kW)'] ? String(row['Power (kW)']).replace(/,/g, '') : '0';
            const refPowerValue = row['Ref Power (kW)'] ? String(row['Ref Power (kW)']).replace(/,/g, '') : '0';

            return {
              timestamp: new Date(row['TimeStamp'].replace(' ', 'T') + 'Z'),
              windSpeed: parseFloat(row['Actual Wind Speed (m/s)']) || 0,
              power: parseFloat(powerValue) || 0,
              refPower: parseFloat(refPowerValue) || 0,
            };
          }).filter(d => d.timestamp && !isNaN(d.timestamp.getTime()));
          resolve({ type: 'power', data: powerData });
        } else if (fileType === 'log') {
          const logData: TurbineEvent[] = [];
          const lightweightLogData: LightweightLogEvent[] = [];

          results.data.forEach((row) => {
            const timestamp = new Date(row['Timestamp'].replace(' ', 'T') + 'Z');
            if (timestamp && !isNaN(timestamp.getTime())) {
               // DÜZELTME: Virgülden kurtulma işlemini burada da yapıyoruz.
              const powerValue = row['Power (kW)'] ? String(row['Power (kW)']).replace(/,/g, '') : undefined;

              logData.push({
                timestamp,
                status: row['Status'],
                name: row['Name'],
                description: row['Description'],
                category: row['Category'],
                eventType: row['Event Type'],
                ccuEvent: row['CCU Event'],
                power: powerValue !== undefined ? parseFloat(powerValue) : undefined,
                windSpeed: parseFloat(row['Wind Speed (m/s)']) || undefined,
              });
              
              lightweightLogData.push({
                timestamp,
                status: row['Status'],
                eventType: row['Name'], 
              });
            }
          });

          resolve({ type: 'log', data: logData, lightweightData: lightweightLogData });
        }
      },
      error: (error: Error) => reject(error),
    });
  });
};


/**
 * Parses multiple CSV files and sorts them into logs and power curve data.
 * @param files - An array of File objects.
 * @returns A promise that resolves to an object containing arrays of log and power data.
 */
export const parseCsvFiles = async (files: File[]): Promise<ParsedData> => {
  const results: ParsedData = {
    logs: [],
    power: [],
    lightweightLogs: [],
  };

  const parsePromises = files.map(file => parseFile(file));
  const parsedResults = await Promise.all(parsePromises);

  for (const result of parsedResults) {
    if (result.type === 'log') {
      results.logs.push(...(result.data as TurbineEvent[]));
      if (result.lightweightData) {
        results.lightweightLogs.push(...result.lightweightData);
      }
    } else if (result.type === 'power') {
      results.power.push(...(result.data as PowerCurvePoint[]));
    }
  }

  // Sort all data by timestamp
  results.logs.sort((a, b) => a.timestamp!.getTime() - b.timestamp!.getTime());
  results.power.sort((a, b) => a.timestamp!.getTime() - b.timestamp!.getTime());
  results.lightweightLogs.sort((a, b) => a.timestamp!.getTime() - b.timestamp!.getTime());

  return results;
};