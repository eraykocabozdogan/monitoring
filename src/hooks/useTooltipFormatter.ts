import { useMemo } from 'react';
import { format, getMinutes, getHours, getDate, getMonth, getYear } from 'date-fns';
import type { TurbineEvent, PowerCurvePoint } from '../types';

const getTimeBucketKey = (date: Date): string => {
  return `${getYear(date)}-${getMonth(date)}-${getDate(date)}-${getHours(date)}-${getMinutes(date)}`;
};

export const useTooltipFormatter = (
  logEvents: TurbineEvent[],
  powerCurveData: PowerCurvePoint[],
  theme: 'light' | 'dark'
) => {
  const eventsByTimeBucket = useMemo(() => {
    const map = new Map<string, TurbineEvent[]>();
    for (const event of logEvents) {
      if (event.timestamp) {
        const key = getTimeBucketKey(event.timestamp);
        if (!map.has(key)) {
          map.set(key, []);
        }
        map.get(key)!.push(event);
      }
    }
    return map;
  }, [logEvents]);

  const tooltipTheme = useMemo(() => ({
    backgroundColor: theme === 'dark' ? 'rgba(20, 20, 30, 0.9)' : 'rgba(255, 255, 255, 0.95)',
    textColor: theme === 'dark' ? '#f1f5f9' : '#1e293b',
    borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
  }), [theme]);

  const formatTooltip = (params: unknown) => {
    const baseStyle = `font-family: sans-serif; font-size: 14px; color: ${tooltipTheme.textColor}; border-radius: 6px; border: 1px solid ${tooltipTheme.borderColor}; background-color: ${tooltipTheme.backgroundColor}; padding: 10px; min-width: 250px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);`;
    const hrStyle = `border-color: ${tooltipTheme.borderColor}; margin: 6px 0;`;

    if (!params || !Array.isArray(params) || params.length === 0) {
      return '';
    }

    const firstParam = params[0] as { 
      seriesType?: string; 
      seriesName?: string; 
      data?: { rawData?: TurbineEvent }; 
      axisValue?: number; 
      value?: unknown[]; 
    };

    if (!firstParam) return '';

    // Skip tooltip for pin/interval series
    if (firstParam.seriesName === 'Chart Pins' || firstParam.seriesName === 'Chart Intervals') {
      return '';
    }

    // Handle scatter plot events
    if (firstParam.seriesType === 'scatter' && firstParam.data?.rawData) {
      const event = firstParam.data.rawData;
      if (!event?.eventType || !event.timestamp) return '';
      
      return `<div style="${baseStyle}"><strong>Event: ${event.eventType}</strong><hr style="${hrStyle}"><strong>Timestamp:</strong> ${format(event.timestamp, 'yyyy-MM-dd HH:mm:ss')}<br><strong>Description:</strong> ${event.description || 'No description available'}</div>`;
    }

    // Handle axis trigger
    let hoverTime: Date;
    if (firstParam.axisValue) {
      hoverTime = new Date(firstParam.axisValue);
    } else if (firstParam.value && Array.isArray(firstParam.value) && firstParam.value[0]) {
      hoverTime = new Date(firstParam.value[0] as number);
    } else {
      return '';
    }

    // Find stable timestamp
    let stableTimestamp: Date;
    
    if (powerCurveData.length > 0) {
      let closestPoint = null;
      let minDistance = Infinity;
      
      for (const point of powerCurveData) {
        if (point.timestamp) {
          const distance = Math.abs(point.timestamp.getTime() - hoverTime.getTime());
          if (distance < minDistance) {
            minDistance = distance;
            closestPoint = point;
          }
        }
      }
      
      const thirtyMinutes = 30 * 60 * 1000;
      if (closestPoint && minDistance <= thirtyMinutes) {
        stableTimestamp = new Date(closestPoint.timestamp!.getTime());
      } else {
        const roundedTime = Math.round(hoverTime.getTime() / (60 * 1000)) * (60 * 1000);
        stableTimestamp = new Date(roundedTime);
      }
    } else {
      const roundedTime = Math.round(hoverTime.getTime() / (60 * 1000)) * (60 * 1000);
      stableTimestamp = new Date(roundedTime);
    }

    const timeFormat = format(stableTimestamp, 'yyyy-MM-dd HH:mm:ss');

    // Find closest power data
    let displayData = null;
    let eventSummary = '<strong>No critical events in this minute.</strong>';

    let closestPowerPoint = null;
    let minDistance = Infinity;
    
    for (const point of powerCurveData) {
      if (point.timestamp) {
        const distance = Math.abs(point.timestamp.getTime() - stableTimestamp.getTime());
        if (distance < minDistance) {
          minDistance = distance;
          closestPowerPoint = point;
        }
      }
    }

    if (closestPowerPoint) {
      displayData = closestPowerPoint;
      
      const key = getTimeBucketKey(stableTimestamp);
      const eventsInBucket = eventsByTimeBucket.get(key) || [];

      if (eventsInBucket.length > 0) {
        eventSummary = eventsInBucket
          .map(e => `<div style="margin-top: 4px;"><strong>${format(e.timestamp!, 'HH:mm:ss')} - ${e.eventType}:</strong><br>${e.description}</div>`)
          .join('');
      }
    }

    if (!displayData) {
      return `<div style="${baseStyle}"><strong>${timeFormat}</strong><br>No data available at this time</div>`;
    }

    return `<div style="${baseStyle}"><strong>${timeFormat}</strong><br>Power: ${displayData.power.toFixed(2)} kW | Wind: ${displayData.windSpeed.toFixed(2)} m/s<hr style="${hrStyle}">${eventSummary}</div>`;
  };

  return { formatTooltip };
};
