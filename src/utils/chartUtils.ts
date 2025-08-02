import type { PowerCurvePoint } from '../types';

export const aggregateChartData = (
  powerCurveData: PowerCurvePoint[],
  dateRange: { start: Date | null; end: Date | null }
): PowerCurvePoint[] => {
  if (!dateRange.start || !dateRange.end) return powerCurveData;

  const maxPoints = 200;
  const visibleDuration = dateRange.end.getTime() - dateRange.start.getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  if (visibleDuration <= oneDay || powerCurveData.length <= maxPoints) {
    return powerCurveData;
  }

  const interval = visibleDuration / maxPoints;
  const buckets = new Map<number, { 
    powerSum: number; 
    refPowerSum: number; 
    windSum: number; 
    count: number; 
  }>();

  const visibleData = powerCurveData.filter(p => 
    p.timestamp && p.timestamp >= dateRange.start! && p.timestamp <= dateRange.end!
  );

  for (const point of visibleData) {
    const bucketTimestamp = Math.floor(point.timestamp!.getTime() / interval) * interval;
    if (!buckets.has(bucketTimestamp)) {
      buckets.set(bucketTimestamp, { powerSum: 0, refPowerSum: 0, windSum: 0, count: 0 });
    }
    const bucket = buckets.get(bucketTimestamp)!;
    bucket.powerSum += point.power;
    bucket.refPowerSum += point.refPower || 0;
    bucket.windSum += point.windSpeed;
    bucket.count++;
  }

  const aggregatedData: PowerCurvePoint[] = [];
  for (const [timestamp, { powerSum, refPowerSum, windSum, count }] of buckets.entries()) {
    aggregatedData.push({
      timestamp: new Date(timestamp),
      power: count > 0 ? powerSum / count : 0,
      refPower: count > 0 ? refPowerSum / count : 0,
      windSpeed: count > 0 ? windSum / count : 0,
    });
  }

  return aggregatedData.sort((a, b) => a.timestamp!.getTime() - b.timestamp!.getTime());
};

export const getChartColors = (theme: 'light' | 'dark') => ({
  power: theme === 'dark' ? '#0891b2' : '#0f766e',
  windLine: theme === 'dark' ? '#10b981' : '#059669',
  windArea: theme === 'dark' ? '#065f46' : '#d1fae5',
  refPower: theme === 'dark' ? '#67e8f9' : '#0891b2',
  fault: theme === 'dark' ? '#eab308' : '#ff9055ff',
  criticalFault: theme === 'dark' ? '#b20909ff' : '#b20909ff'
});

export const calculateGridCoordinates = (
  mouseX: number,
  mouseY: number,
  chartWidth: number,
  chartHeight: number,
  grid: { left?: string | number; right?: string | number; bottom?: string | number }
) => {
  const gridLeft = typeof grid.left === 'string' ? 
    (parseFloat(grid.left) / 100) * chartWidth : 
    (grid.left || 60);
  const gridRight = typeof grid.right === 'string' ? 
    (parseFloat(grid.right) / 100) * chartWidth : 
    (grid.right || 30);
  const gridBottom = typeof grid.bottom === 'string' ? 
    (parseFloat(grid.bottom) / 100) * chartHeight : 
    (grid.bottom || 60);
  const gridTop = 40;

  const gridWidth = chartWidth - gridLeft - gridRight;
  
  const isInGrid = mouseX >= gridLeft && 
                  mouseX <= (chartWidth - gridRight) && 
                  mouseY >= gridTop && 
                  mouseY <= (chartHeight - gridBottom);

  if (!isInGrid) return null;

  return {
    relativeX: (mouseX - gridLeft) / gridWidth,
    gridLeft,
    gridRight,
    gridTop,
    gridBottom,
    gridWidth
  };
};
