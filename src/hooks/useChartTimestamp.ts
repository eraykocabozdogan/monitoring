import { useRef, useCallback } from 'react';
import type { PowerCurvePoint } from '../types';

export const useChartTimestamp = (powerCurveData: PowerCurvePoint[]) => {
  const lastTooltipTimestamp = useRef<Date | null>(null);
  const currentAxisPointerTimestamp = useRef<Date | null>(null);
  const exactDisplayedTimestamp = useRef<Date | null>(null);

  const findStableTimestamp = useCallback((rawTimestamp: Date): Date => {
    if (powerCurveData.length === 0) {
      return new Date(Math.round(rawTimestamp.getTime() / (60 * 1000)) * (60 * 1000));
    }

    let closestPoint = null;
    let minDistance = Infinity;

    for (const point of powerCurveData) {
      if (point.timestamp) {
        const distance = Math.abs(point.timestamp.getTime() - rawTimestamp.getTime());
        if (distance < minDistance) {
          minDistance = distance;
          closestPoint = point;
        }
      }
    }

    const thirtyMinutes = 30 * 60 * 1000;
    if (closestPoint && minDistance <= thirtyMinutes) {
      return new Date(closestPoint.timestamp!.getTime());
    }

    return new Date(Math.round(rawTimestamp.getTime() / (60 * 1000)) * (60 * 1000));
  }, [powerCurveData]);

  const updateTimestamps = useCallback((timestamp: Date) => {
    const stableTimestamp = findStableTimestamp(timestamp);
    lastTooltipTimestamp.current = stableTimestamp;
    currentAxisPointerTimestamp.current = stableTimestamp;
    exactDisplayedTimestamp.current = stableTimestamp;
    return stableTimestamp;
  }, [findStableTimestamp]);

  const getClickTimestamp = useCallback(() => {
    return exactDisplayedTimestamp.current || 
           currentAxisPointerTimestamp.current || 
           lastTooltipTimestamp.current;
  }, []);

  return {
    lastTooltipTimestamp,
    currentAxisPointerTimestamp,
    exactDisplayedTimestamp,
    updateTimestamps,
    findStableTimestamp,
    getClickTimestamp,
  };
};
