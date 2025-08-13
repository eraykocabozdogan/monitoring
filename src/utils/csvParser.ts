import * as Papa from 'papaparse';
import type { TurbineEvent, PowerCurvePoint } from '../types/index';
import type { LightweightLogEvent } from '../store/useAppStore';

const POWER_CURVE_HEADERS = ['TimeStamp', 'Actual Wind Speed (m/s)', 'Power (kW)', 'Ref Power (kW)'];
const EVENT_LOG_HEADERS = ['Timestamp', 'Status', 'Name', 'Description', 'Category', 'Event Type', 'CCU Event'];

interface ParsedData {
  logs: TurbineEvent[];
  power: PowerCurvePoint[];
  lightweightLogs: LightweightLogEvent[];
}

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

const createUTCDate = (dateString: string): Date | null => {
    if (!dateString || typeof dateString !== 'string') return null;
    const isoString = dateString.trim().replace(' ', 'T') + 'Z';
    const date = new Date(isoString);
    return isNaN(date.getTime()) ? null : date;
}

const parseFile = (file: File): Promise<ParsedFileResult> => {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
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
          const powerData = results.data.map((row): PowerCurvePoint | null => {
            const timestamp = createUTCDate(row['TimeStamp']);
            if (!timestamp) return null;

            const powerValue = row['Power (kW)'] ? String(row['Power (kW)']).replace(/,/g, '') : '0';
            const refPowerValue = row['Ref Power (kW)'] ? String(row['Ref Power (kW)']).replace(/,/g, '') : '0';

            return {
              timestamp,
              windSpeed: parseFloat(row['Actual Wind Speed (m/s)']) || 0,
              power: parseFloat(powerValue) || 0,
              refPower: parseFloat(refPowerValue) || 0,
            };
          }).filter((d): d is PowerCurvePoint => d !== null);
          resolve({ type: 'power', data: powerData });
        } else if (fileType === 'log') {
          const logData: TurbineEvent[] = [];
          const lightweightLogData: LightweightLogEvent[] = [];

          results.data.forEach((row, index) => {
            const timestamp = createUTCDate(row['Timestamp']);
            if (timestamp) {
              const powerValue = row['Power (kW)'] ? String(row['Power (kW)']).replace(/,/g, '') : undefined;
              const uniqueId = `${timestamp.getTime()}-${row['Name']}-${index}`;

              logData.push({
                id: uniqueId,
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

  results.logs.sort((a, b) => a.timestamp!.getTime() - b.timestamp!.getTime());
  results.power.sort((a, b) => a.timestamp!.getTime() - b.timestamp!.getTime());
  results.lightweightLogs.sort((a, b) => a.timestamp!.getTime() - b.timestamp!.getTime());

  return results;
};