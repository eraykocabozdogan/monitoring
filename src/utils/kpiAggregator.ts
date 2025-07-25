import { calculateMetrics } from './calculations';
import type { LightweightLogEvent } from '../store/useAppStore';
import { startOfWeek, endOfWeek, eachWeekOfInterval, format } from 'date-fns';

export interface WeeklyMetrics {
  labels: string[];
  aoData: number[];
  atData: number[];
  reliabilityData: number[];
}

export const calculateWeeklyMetrics = (
  logs: LightweightLogEvent[],
  dateRange: { start: Date; end: Date }
): WeeklyMetrics => {
  const weeklyMetrics: WeeklyMetrics = {
    labels: [],
    aoData: [],
    atData: [],
    reliabilityData: [],
  };

  const weeks = eachWeekOfInterval(
    { start: dateRange.start, end: dateRange.end },
    { weekStartsOn: 1 } // Haftanın başlangıcı Pazartesi
  );

  for (const week of weeks) {
    const weekStart = startOfWeek(week, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(week, { weekStartsOn: 1 });
    
    const effectiveStart = new Date(Math.max(dateRange.start.getTime(), weekStart.getTime()));
    const effectiveEnd = new Date(Math.min(dateRange.end.getTime(), weekEnd.getTime()));

    const weekLogs = logs.filter(log => 
      log.timestamp && log.timestamp >= effectiveStart && log.timestamp <= effectiveEnd
    );

    if (weekLogs.length > 0) {
      const metrics = calculateMetrics(weekLogs, { start: effectiveStart, end: effectiveEnd });
      weeklyMetrics.labels.push(format(effectiveStart, 'MMM d'));
      weeklyMetrics.aoData.push(metrics.operationalAvailability);
      weeklyMetrics.atData.push(metrics.technicalAvailability);
      weeklyMetrics.reliabilityData.push(metrics.reliabilityR);
    }
  }

  return weeklyMetrics;
};