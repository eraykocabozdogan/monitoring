import { useMemo } from 'react';
import type { TurbineEvent, PowerCurvePoint } from '../types';

export const useProcessedSeriesData = (logEvents: TurbineEvent[], powerCurveData: PowerCurvePoint[]) => {
  return useMemo(() => {
    const powerMap = new Map<number, PowerCurvePoint>();
    powerCurveData.forEach(p => p.timestamp && powerMap.set(p.timestamp.getTime(), p));

    const getClosestPowerValue = (logTime: Date): number => {
      if (!logTime) return 0;
      const time = logTime.getTime();
      if (powerMap.has(time)) return powerMap.get(time)!.power;
      if (powerCurveData.length === 0) return 0;
      
      const closestPoint = powerCurveData.reduce((prev, curr) =>
        Math.abs(curr.timestamp!.getTime() - time) < Math.abs(prev.timestamp!.getTime() - time) ? curr : prev
      );
      return closestPoint.power;
    };

    const faultEvents = logEvents
      .filter(log => log.eventType?.toLowerCase().trim() === 'fault' && log.timestamp)
      .map(log => ({
        value: [log.timestamp!.getTime(), getClosestPowerValue(log.timestamp!)] as [number, number],
        rawData: log,
      }));

    const safetyCriticalFaultEvents = logEvents
      .filter(log => log.eventType?.toLowerCase().trim() === 'safety critical fault' && log.timestamp)
      .map(log => ({
        value: [log.timestamp!.getTime(), getClosestPowerValue(log.timestamp!)] as [number, number],
        rawData: log,
      }));

    return { faultEvents, safetyCriticalFaultEvents };
  }, [logEvents, powerCurveData]);
};
