import Papa from 'papaparse';
import type { TurbineEvent, PowerCurvePoint } from '../types/index';

// Beklenen başlıklara "Name" eklendi
const POWER_CURVE_HEADERS = ['TimeStamp', 'Actual Wind Speed (m/s)', 'Power (kW)', 'Ref Power (kW)'];
const EVENT_LOG_HEADERS = ['Timestamp', 'Status', 'Name', 'Description', 'Category', 'Event Type', 'CCU Event'];

interface ParsedData {
  logs: TurbineEvent[];
  power: PowerCurvePoint[];
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

/**
 * Parses a single CSV file into the appropriate data structure.
 * @param file - The CSV file to parse.
 * @returns A promise that resolves with the parsed data and its type.
 */
const parseFile = (file: File): Promise<{ type: 'power' | 'log' | 'unknown'; data: (PowerCurvePoint | TurbineEvent)[] }> => {
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
          const powerData = results.data.map((row): PowerCurvePoint => ({
            timestamp: new Date(row['TimeStamp'].replace(' ', 'T') + 'Z'),
            windSpeed: parseFloat(row['Actual Wind Speed (m/s)']) || 0,
            power: parseFloat(row['Power (kW)']) || 0,
            refPower: parseFloat(row['Ref Power (kW)']) || 0,
          })).filter(d => d.timestamp && !isNaN(d.timestamp.getTime()));
          resolve({ type: 'power', data: powerData });
        } else if (fileType === 'log') {
          // "Name" alanı artık okunup nesneye ekleniyor
          const logData = results.data.map((row): TurbineEvent => ({
            timestamp: new Date(row['Timestamp'].replace(' ', 'T') + 'Z'),
            status: row['Status'],
            name: row['Name'],
            description: row['Description'],
            category: row['Category'],
            eventType: row['Event Type'],
            ccuEvent: row['CCU Event'],
          })).filter(d => d.timestamp && !isNaN(d.timestamp.getTime()));
          resolve({ type: 'log', data: logData });
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
  };

  const parsePromises = files.map(file => parseFile(file));
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
};