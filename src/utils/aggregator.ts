import type { TurbineEvent, PowerCurvePoint } from '../types';

export const aggregateLogDataToPowerCurve = (logs: TurbineEvent[]): PowerCurvePoint[] => {
  if (!logs || logs.length === 0) {
    return [];
  }

  const buckets = new Map<number, { powerSum: number; windSum: number; count: number }>();

  for (const log of logs) {
    if (log.timestamp && log.power !== undefined && log.windSpeed !== undefined) {
      const bucketTimestamp = Math.floor(log.timestamp.getTime() / (10 * 60 * 1000)) * (10 * 60 * 1000);

      if (!buckets.has(bucketTimestamp)) {
        buckets.set(bucketTimestamp, { powerSum: 0, windSum: 0, count: 0 });
      }

      const bucket = buckets.get(bucketTimestamp)!;
      bucket.powerSum += log.power;
      bucket.windSum += log.windSpeed;
      bucket.count++;
    }
  }

  const aggregatedData: PowerCurvePoint[] = [];
  for (const [timestamp, { powerSum, windSum, count }] of buckets.entries()) {
    aggregatedData.push({
      timestamp: new Date(timestamp),
      power: count > 0 ? powerSum / count : 0,
      windSpeed: count > 0 ? windSum / count : 0,
      refPower: 0,
    });
  }

  return aggregatedData.sort((a, b) => a.timestamp!.getTime() - b.timestamp!.getTime());
};