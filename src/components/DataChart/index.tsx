import React, { useRef, useMemo, useCallback, memo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption, ECElementEvent, TooltipComponentFormatterCallback } from 'echarts';
import { useAppStore } from '../../store/useAppStore';
import { format, getMinutes, getHours, getDate, getMonth, getYear } from 'date-fns';
import type { PowerCurvePoint, TurbineEvent, ChartPin, ChartInterval } from '../../types/index';
import styles from './DataChart.module.css';

interface EChartsMouseMoveEvent {
  offsetX: number;
  offsetY: number;
}

const getTimeBucketKey = (date: Date): string => {
    return `${getYear(date)}-${getMonth(date)}-${getDate(date)}-${getHours(date)}-${getMinutes(date)}`;
};

const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

const formatDuration = (startTime: Date, endTime: Date): string => {
  const diffMs = endTime.getTime() - startTime.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays >= 7) {
    const days = diffDays;
    const remainingHours = diffHours - (days * 24);
    if (remainingHours > 0) {
      return `${days} days ${remainingHours} hours`;
    } else {
      return `${days} days`;
    }
  }
  else {
    const hours = diffHours;
    const remainingMinutes = diffMinutes - (hours * 60);
    if (hours > 0) {
      return `${hours} hours ${remainingMinutes} minutes`;
    } else {
      return `${diffMinutes} minutes`;
    }
  }
};

const DataChart: React.FC = () => {
  const {
    powerCurveData,
    logEvents,
    dateRange,
    setDateRange,
    legendSelected,
    setLegendSelected,
    theme,
    setSelectedChartTimestamp,
    chartMode,
    setChartMode,
    chartPins,
    chartIntervals,
    pendingInterval,
    addChartPin,
    removeChartPin,
    addChartInterval,
    removeChartInterval,
    setPendingInterval,
    clearChartSelections,
  } = useAppStore();

  const chartRef = useRef<ReactECharts | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastTooltipTimestamp = useRef<Date | null>(null);
  const currentAxisPointerTimestamp = useRef<Date | null>(null);
  const exactDisplayedTimestamp = useRef<Date | null>(null);

  const hasRefPower = useMemo(() =>
    powerCurveData.length > 0 && powerCurveData.some(p => p.refPower > 0),
    [powerCurveData]
  );

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

  const processedSeriesData = useMemo(() => {
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
          value: [log.timestamp!.getTime(), getClosestPowerValue(log.timestamp!)],
          rawData: log,
      }));

    const safetyCriticalFaultEvents = logEvents
      .filter(log => log.eventType?.toLowerCase().trim() === 'safety critical fault' && log.timestamp)
      .map(log => ({
        value: [log.timestamp!.getTime(), getClosestPowerValue(log.timestamp!)],
        rawData: log,
      }));

    return { faultEvents, safetyCriticalFaultEvents };
  }, [logEvents, powerCurveData]);

  const series = useMemo(() => {
    const colors = {
        power: theme === 'dark' ? '#0891b2' : '#0f766e',
        windLine: theme === 'dark' ? '#10b981' : '#059669',
        windArea: theme === 'dark' ? '#065f46' : '#d1fae5',
        refPower: theme === 'dark' ? '#67e8f9' : '#0891b2',
        fault: theme === 'dark' ? '#eab308' : '#ff9055ff',
        criticalFault: theme === 'dark' ? '#b20909ff' : '#b20909ff'
    };

    let displayData = powerCurveData;
    const maxPoints = 200;
    
    if (dateRange.start && dateRange.end) {
        const visibleDuration = dateRange.end.getTime() - dateRange.start.getTime();
        const oneDay = 24 * 60 * 60 * 1000;

        if (visibleDuration > oneDay && powerCurveData.length > maxPoints) {
            const interval = visibleDuration / maxPoints;
            const buckets = new Map<number, { powerSum: number; refPowerSum: number; windSum: number; count: number }>();

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
            displayData = aggregatedData.sort((a, b) => a.timestamp!.getTime() - b.timestamp!.getTime());
        }
    }

    const baseSeries = [
      { name: 'Power (kW)', type: 'bar' as const, barMaxWidth: 30, barGap: '-100%', itemStyle: { opacity: 0.9, color: colors.power }, z: 3, triggerEvent: true, data: displayData.map(event => [event.timestamp!.getTime(), event.power]), xAxisIndex: 0, yAxisIndex: 0, triggerLineEvent: false, hoverAnimation: false, silent: false, cursor: 'default' },
      { name: 'Wind Speed (m/s)', type: 'line' as const, yAxisIndex: 1, xAxisIndex: 0, showSymbol: false, lineStyle: { width: 1.5, color: colors.windLine, opacity: 0.75 }, areaStyle: { color: colors.windArea, opacity: 0.5 }, itemStyle: { opacity: 1 }, z: 1, triggerEvent: true, data: displayData.map(event => [event.timestamp!.getTime(), event.windSpeed]), triggerLineEvent: false, hoverAnimation: false, silent: false, cursor: 'default' },
      { name: 'Fault', type: 'scatter' as const, symbol: 'diamond', symbolSize: 9, itemStyle: { color: colors.fault, opacity: 1 }, triggerEvent: true, data: processedSeriesData.faultEvents, zlevel: 10, xAxisIndex: 0, yAxisIndex: 0, triggerLineEvent: false, hoverAnimation: false, silent: false, emphasis: { disabled: true }, cursor: 'default' },
      { name: 'Safety Critical Fault', type: 'scatter' as const, symbol: 'triangle', symbolSize: 9, itemStyle: { color: colors.criticalFault, opacity: 1 }, triggerEvent: true, data: processedSeriesData.safetyCriticalFaultEvents, zlevel: 11, xAxisIndex: 0, yAxisIndex: 0, triggerLineEvent: false, hoverAnimation: false, silent: false, emphasis: { disabled: true }, cursor: 'default' }
    ];

    if (hasRefPower) {
      baseSeries.splice(1, 0, { name: 'Expected Power (kW)', type: 'bar' as const, barMaxWidth: 30, barGap: '-100%', itemStyle: { opacity: 0.9, color: colors.refPower }, z: 2, triggerEvent: true, data: displayData.map(event => [event.timestamp!.getTime(), event.refPower]), xAxisIndex: 0, yAxisIndex: 0, triggerLineEvent: false, hoverAnimation: false, silent: false, cursor: 'default' });
    }

    return baseSeries;
  }, [powerCurveData, processedSeriesData, theme, hasRefPower, dateRange]);

  const formatTooltip: TooltipComponentFormatterCallback = useCallback((params) => {
    const tooltipTheme = {
        backgroundColor: theme === 'dark' ? 'rgba(20, 20, 30, 0.9)' : 'rgba(255, 255, 255, 0.95)',
        textColor: theme === 'dark' ? '#f1f5f9' : '#1e293b',
        borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
    };
    const baseStyle = `font-family: sans-serif; font-size: 14px; color: ${tooltipTheme.textColor}; border-radius: 6px; border: 1px solid ${tooltipTheme.borderColor}; background-color: ${tooltipTheme.backgroundColor}; padding: 10px; min-width: 250px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);`;
    const hrStyle = `border-color: ${tooltipTheme.borderColor}; margin: 6px 0;`;

    if (!params || !Array.isArray(params) || params.length === 0) {
      return '';
    }

    const firstParam = params[0] as { seriesType?: string; seriesName?: string; data?: { rawData?: TurbineEvent }; axisValue?: number | string; value?: any[] };
    if (!firstParam) return '';
    
    if (firstParam.seriesName === 'Chart Pins' || firstParam.seriesName === 'Chart Intervals') {
      return '';
    }

    if (firstParam.seriesType === 'scatter' && firstParam.data?.rawData) {
        const event = firstParam.data.rawData;
        if (!event || !event.eventType || !event.timestamp) return '';
        
        const scatterTimestamp = event.timestamp;
        lastTooltipTimestamp.current = scatterTimestamp;
        currentAxisPointerTimestamp.current = scatterTimestamp;
        exactDisplayedTimestamp.current = scatterTimestamp;
        
        useAppStore.getState().setLastTooltipFormat('detailed');
        return `<div style="${baseStyle}"><strong>Event: ${event.eventType}</strong><hr style="${hrStyle}"><strong>Timestamp:</strong> ${format(scatterTimestamp, 'yyyy-MM-dd HH:mm:ss')}<br><strong>Description:</strong> ${event.description || 'No description available'}</div>`;
    }

    let hoverTime: Date;
    if (firstParam.axisValue) {
      hoverTime = new Date(firstParam.axisValue as any);
    } else if (firstParam.value && Array.isArray(firstParam.value) && firstParam.value[0]) {
      hoverTime = new Date(firstParam.value[0]);
    } else {
      return '';
    }
    
    let stableTimestamp: Date;
    if (powerCurveData.length > 0) {
      let closestPoint: PowerCurvePoint | null = null;
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
    
    lastTooltipTimestamp.current = stableTimestamp;
    currentAxisPointerTimestamp.current = stableTimestamp;
    exactDisplayedTimestamp.current = stableTimestamp;
    
    const timeFormat = format(stableTimestamp, 'yyyy-MM-dd HH:mm:ss');
    const hasTimeDetails = timeFormat.includes(':');
    
    const tooltipFormat = hasTimeDetails ? 'detailed' : 'simple';
    useAppStore.getState().setLastTooltipFormat(tooltipFormat);

    let displayData: PowerCurvePoint | null = null;
    let eventSummary = '<strong>No critical events in this minute.</strong>';

    let closestPowerPoint: PowerCurvePoint | null = null;
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
          eventSummary = eventsInBucket.map(e => `<div style="margin-top: 4px;"><strong>${format(e.timestamp!, 'HH:mm:ss')} - ${e.eventType}:</strong><br>${e.description}</div>`).join('');
      }
    }

    if (!displayData) {
      return `<div style="${baseStyle}"><strong>${timeFormat}</strong><br>No data available at this time</div>`;
    }

    return `<div style="${baseStyle}"><strong>${timeFormat}</strong><br>Power: ${displayData.power.toFixed(2)} kW | Wind: ${displayData.windSpeed.toFixed(2)} m/s<hr style="${hrStyle}">${eventSummary}</div>`;
  }, [eventsByTimeBucket, powerCurveData, theme]);

  const handleDataZoom = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      if (chartRef.current) {
        const echartsInstance = chartRef.current.getEchartsInstance();
        const newOption = echartsInstance.getOption();
        const dataZoomArray = newOption.dataZoom as { startValue?: number; endValue?: number }[];
        if (dataZoomArray && Array.isArray(dataZoomArray) && dataZoomArray.length > 0) {
          const { startValue, endValue } = dataZoomArray[0];
          if (startValue != null && endValue != null && (dateRange.start?.getTime() !== startValue || dateRange.end?.getTime() !== endValue)) {
            setDateRange({ start: new Date(startValue), end: new Date(endValue) });
          }
        }
      }
    }, 300);
  }, [dateRange, setDateRange]);

  const handleLegendSelectChanged = useCallback((e: { selected: Record<string, boolean> }) => setLegendSelected(e.selected), [setLegendSelected]);

  const handleAxisPointer = useCallback((params: EChartsMouseMoveEvent) => {
    if (params && typeof params.offsetX === 'number' && chartRef.current) {
      try {
        const echartsInstance = chartRef.current.getEchartsInstance();
        const pointInGrid = echartsInstance.convertFromPixel('grid', [params.offsetX, params.offsetY || 0]);
        if (pointInGrid && pointInGrid[0]) {
          const timestamp = new Date(pointInGrid[0]);
          currentAxisPointerTimestamp.current = timestamp;
        }
      } catch (error) {
        // Ignore conversion errors
      }
    }
  }, []);

  const handleChartClick = useCallback((params: ECElementEvent | { manualTrigger: boolean; calculatedTimestamp: Date; event: { offsetX: number; offsetY: number } }) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    let clickedTimestamp: Date | null = null;
    
    if ('manualTrigger' in params && params.manualTrigger && params.calculatedTimestamp) {
      clickedTimestamp = params.calculatedTimestamp;
    } else {
      const echartsEvent = params as ECElementEvent;
      if (exactDisplayedTimestamp.current) {
        clickedTimestamp = exactDisplayedTimestamp.current;
      } 
      else if (currentAxisPointerTimestamp.current) {
        clickedTimestamp = currentAxisPointerTimestamp.current;
      } else if (lastTooltipTimestamp.current) {
        clickedTimestamp = lastTooltipTimestamp.current;
      } else {
        if (echartsEvent.data && Array.isArray(echartsEvent.data) && echartsEvent.data[0]) {
          clickedTimestamp = new Date(echartsEvent.data[0]);
        } else if (echartsEvent.value && Array.isArray(echartsEvent.value) && echartsEvent.value[0]) {
          clickedTimestamp = new Date(echartsEvent.value[0]);
        }
        
        if (!clickedTimestamp && chartRef.current && echartsEvent.event) {
          try {
            const echartsInstance = chartRef.current.getEchartsInstance();
            if (echartsInstance.isDisposed() === false) {
              const pointInPixel = [echartsEvent.event.offsetX, echartsEvent.event.offsetY];
              const pointInGrid = echartsInstance.convertFromPixel('grid', pointInPixel);
              if (pointInGrid && pointInGrid[0]) {
                const rawTimestamp = new Date(pointInGrid[0]);
                if (powerCurveData.length > 0) {
                  const closestPoint = powerCurveData.reduce((prev, curr) => 
                    Math.abs(curr.timestamp!.getTime() - rawTimestamp.getTime()) < Math.abs(prev.timestamp!.getTime() - rawTimestamp.getTime()) ? curr : prev
                  );
                  const thirtyMinutes = 30 * 60 * 1000;
                  if (Math.abs(closestPoint.timestamp!.getTime() - rawTimestamp.getTime()) <= thirtyMinutes) {
                    clickedTimestamp = new Date(closestPoint.timestamp!.getTime());
                  } else {
                    clickedTimestamp = new Date(Math.round(rawTimestamp.getTime() / (60 * 1000)) * (60 * 1000));
                  }
                } else {
                  clickedTimestamp = new Date(Math.round(rawTimestamp.getTime() / (60 * 1000)) * (60 * 1000));
                }
              }
            }
          } catch (error) {
            console.warn('Grid click coordinate conversion failed:', error);
          }
        }
      }
    }

    if (!clickedTimestamp) return;

    debounceTimer.current = setTimeout(() => {
      if (chartMode === 'pin') {
        const findPinData = (targetTimestamp: Date) => {
          if (powerCurveData.length === 0) return { power: 0, windSpeed: 0, expectedPower: undefined, isValid: false };

          const hasTimeComponent = targetTimestamp.getHours() !== 0 || targetTimestamp.getMinutes() !== 0 || targetTimestamp.getSeconds() !== 0;
          if (hasTimeComponent) {
            const thirtyMinutes = 30 * 60 * 1000;
            let closestPoint: PowerCurvePoint | null = null;
            let minDistance = Infinity;
            for (const point of powerCurveData) {
              if (point.timestamp) {
                const distance = Math.abs(point.timestamp.getTime() - targetTimestamp.getTime());
                if (distance <= thirtyMinutes && distance < minDistance) {
                  minDistance = distance;
                  closestPoint = point;
                }
              }
            }
            return closestPoint ? { power: closestPoint.power, windSpeed: closestPoint.windSpeed, expectedPower: closestPoint.refPower > 0 ? closestPoint.refPower : undefined, isValid: true } : { power: 0, windSpeed: 0, expectedPower: undefined, isValid: false, message: "not valid data" };
          } else {
            const startOfDay = new Date(targetTimestamp);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(targetTimestamp);
            endOfDay.setHours(23, 59, 59, 999);
            const dayData = powerCurveData.filter(point => point.timestamp && point.timestamp >= startOfDay && point.timestamp <= endOfDay);
            if (dayData.length === 0) return { power: 0, windSpeed: 0, expectedPower: undefined, isValid: false, message: "not valid data" };
            const powerSum = dayData.reduce((sum, point) => sum + point.power, 0);
            const windSum = dayData.reduce((sum, point) => sum + point.windSpeed, 0);
            const refPowerSum = dayData.reduce((sum, point) => sum + (point.refPower || 0), 0);
            const refPowerCount = dayData.filter(point => point.refPower > 0).length;
            return { power: powerSum / dayData.length, windSpeed: windSum / dayData.length, expectedPower: refPowerCount > 0 ? refPowerSum / refPowerCount : undefined, isValid: true };
          }
        };

        const pinData = findPinData(clickedTimestamp);
        const pin: ChartPin = { id: generateId(), timestamp: clickedTimestamp, power: pinData.power, windSpeed: pinData.windSpeed, expectedPower: pinData.expectedPower, powerValid: pinData.isValid, windSpeedValid: pinData.isValid, expectedPowerValid: pinData.isValid && pinData.expectedPower !== undefined };
        addChartPin(pin);
      } else if (chartMode === 'interval') {
        if (!pendingInterval) {
          setPendingInterval({ startTimestamp: clickedTimestamp });
        } else {
          const startTime = pendingInterval.startTimestamp.getTime();
          const endTime = clickedTimestamp.getTime();
          const interval: ChartInterval = { id: generateId(), startTimestamp: startTime < endTime ? pendingInterval.startTimestamp : clickedTimestamp, endTimestamp: startTime < endTime ? clickedTimestamp : pendingInterval.startTimestamp };
          addChartInterval(interval);
          setPendingInterval(null);
        }
      } else {
        setSelectedChartTimestamp(clickedTimestamp);
      }
    }, 100);
  }, [setSelectedChartTimestamp, dateRange, chartMode, pendingInterval, powerCurveData, addChartPin, addChartInterval, setPendingInterval]);

  const onEvents = useMemo(() => ({
    datazoom: handleDataZoom,
    legendselectchanged: handleLegendSelectChanged,
    click: handleChartClick,
    mousemove: handleAxisPointer,
  }), [handleDataZoom, handleLegendSelectChanged, handleChartClick, handleAxisPointer]);

  const option: EChartsOption = useMemo(() => {
    const legendData = ['Power (kW)', 'Wind Speed (m/s)', 'Fault', 'Safety Critical Fault'];
    if (hasRefPower) {
      legendData.splice(1, 0, 'Expected Power (kW)');
    }

    const sliderSeries: any[] = [];
    if (chartPins.length > 0 || pendingInterval) {
      const pinData = chartPins.map(pin => ({ value: [pin.timestamp.getTime(), 0.5], symbol: 'circle', symbolSize: 12, itemStyle: { color: '#3b82f6', borderColor: '#ffffff', borderWidth: 2 } }));
      if (pendingInterval) {
        pinData.push({ value: [pendingInterval.startTimestamp.getTime(), 0.5], symbol: 'rect', symbolSize: 12, itemStyle: { color: '#10b981', borderColor: '#ffffff', borderWidth: 2 } });
      }
      sliderSeries.push({ name: 'Chart Pins', type: 'scatter', data: pinData, xAxisIndex: 1, yAxisIndex: 2, silent: true, zlevel: 100, tooltip: { show: false } });
    }

    if (chartIntervals.length > 0) {
      const intervalsWithLevels: Array<ChartInterval & { level: number }> = [];
      const intervalsOverlap = (int1: ChartInterval, int2: ChartInterval) => int1.startTimestamp < int2.endTimestamp && int2.startTimestamp < int1.endTimestamp;

      chartIntervals.forEach((interval, index) => {
        let level = 0.3;
        const usedLevels = new Set<number>();
        for (let i = 0; i < index; i++) {
          if (intervalsOverlap(interval, chartIntervals[i])) {
            usedLevels.add(Math.round(intervalsWithLevels[i].level * 10) / 10);
          }
        }
        while (usedLevels.has(Math.round(level * 10) / 10)) {
          level = Math.round((level + 0.2) * 10) / 10;
        }
        intervalsWithLevels.push({ ...interval, level });
      });

      const levelGroups = new Map<number, any[]>();
      intervalsWithLevels.forEach(interval => {
        if (!levelGroups.has(interval.level)) levelGroups.set(interval.level, []);
        const levelData = levelGroups.get(interval.level)!;
        levelData.push({ value: [interval.startTimestamp.getTime(), interval.level] });
        levelData.push({ value: [interval.endTimestamp.getTime(), interval.level] });
        levelData.push({ value: [null, null] });
      });
      
      const colors = ['#10b981', '#059669', '#047857', '#065f46', '#064e3b'];
      let levelIndex = 0;
      levelGroups.forEach((data) => {
          sliderSeries.push({ name: `Chart Intervals Level ${levelIndex}`, type: 'line', data: data, xAxisIndex: 1, yAxisIndex: 2, silent: true, lineStyle: { color: colors[levelIndex % colors.length], width: 6, opacity: 0.7 }, showSymbol: false, zlevel: 99, tooltip: { show: false } });
        levelIndex++;
      });
    }

    return {
      tooltip: { trigger: 'axis', formatter: formatTooltip, axisPointer: { type: 'none' }, backgroundColor: 'transparent', borderColor: 'transparent', textStyle: { color: theme === 'dark' ? '#f9fafb' : '#1f293b' }, extraCssText: 'box-shadow: none;', confine: true, enterable: false, showContent: true, alwaysShowContent: false, triggerOn: 'mousemove', position: (point: number[]) => [point[0] + 10, point[1] - 10], appendToBody: false, hideDelay: 0, transitionDuration: 0 },
      legend: { data: legendData, selected: legendSelected, textStyle: { color: theme === 'dark' ? '#f9fafb' : '#1f293b' } },
      grid: [{ left: '3%', right: '3%', bottom: '20%', containLabel: true, triggerEvent: true }, { left: '3%', right: '3%', bottom: '7%', height: '8%', show: false }],
      xAxis: [{ type: 'time', gridIndex: 0, axisLine: { lineStyle: { color: theme === 'dark' ? '#4b5563' : '#e5e7eb' } }, axisLabel: { color: theme === 'dark' ? '#f9fafb' : '#1f293b' }, triggerEvent: true }, { type: 'time', gridIndex: 1, position: 'bottom', axisLine: { show: false }, axisTick: { show: false }, axisLabel: { show: false }, splitLine: { show: false }, min: dateRange?.start?.getTime(), max: dateRange?.end?.getTime() }],
      yAxis: [{ type: 'value', gridIndex: 0, name: 'Power (kW)', min: 0, nameTextStyle: { color: theme === 'dark' ? '#f9fafb' : '#1f2937' }, axisLine: { lineStyle: { color: theme === 'dark' ? '#4b5563' : '#e5e7eb' } }, axisLabel: { color: theme === 'dark' ? '#f9fafb' : '#1f2937' }, splitLine: { lineStyle: { color: [theme === 'dark' ? '#4b5563' : '#e5e7eb'] } }, triggerEvent: true }, { type: 'value', gridIndex: 0, name: 'Wind Speed (m/s)', nameTextStyle: { color: theme === 'dark' ? '#f9fafb' : '#1f2937' }, axisLine: { lineStyle: { color: theme === 'dark' ? '#4b5563' : '#e5e7eb' } }, axisLabel: { color: theme === 'dark' ? '#f9fafb' : '#1f2937' }, splitLine: { show: false }, triggerEvent: true }, { type: 'value', gridIndex: 1, min: 0, max: 1, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { show: false }, splitLine: { show: false } }],
      dataZoom: [{ type: 'inside', startValue: dateRange?.start?.getTime(), endValue: dateRange?.end?.getTime() }, { type: 'slider', startValue: dateRange?.start?.getTime(), endValue: dateRange?.end?.getTime(), textStyle: { color: theme === 'dark' ? '#f9fafb' : '#1f2937' }, bottom: '2%', height: '5%' }],
      series: [...(series || []), ...(sliderSeries || [])],
      animation: false,
      hoverLayerThreshold: 2,
      useUTC: false
    };
  }, [dateRange, legendSelected, series, formatTooltip, theme, hasRefPower, chartIntervals, chartPins, pendingInterval]);

  if (powerCurveData.length === 0) {
    return <div className={`${styles.container} ${styles.emptyState}`}>Please upload a Power Curve or Event Log file to see the chart.</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Data Chart</h3>
        <div className={styles.controls}>
          <button className={`${styles.controlButton} ${chartMode === 'interval' ? styles.active : ''}`} onClick={() => setChartMode(chartMode === 'interval' ? 'normal' : 'interval')}>
            {chartMode === 'interval' ? (pendingInterval ? 'Click to end interval' : 'Click to start interval') : 'Select Interval'}
          </button>
          <button className={`${styles.controlButton} ${chartMode === 'pin' ? styles.active : ''}`} onClick={() => setChartMode(chartMode === 'pin' ? 'normal' : 'pin')}>
            Add Pin
          </button>
          <button className={styles.controlButton} onClick={clearChartSelections} disabled={chartPins.length === 0 && chartIntervals.length === 0}>
            Clear Selections
          </button>
        </div>
      </div>
      
      <div className={styles.mainContent}>
        <div className={styles.chartWrapper} onClick={(e) => {
               if (chartMode !== 'normal') {
                 const rect = e.currentTarget.getBoundingClientRect();
                 const mouseX = e.clientX - rect.left;
                 const mouseY = e.clientY - rect.top;
                 
                 if (exactDisplayedTimestamp.current) {
                   handleChartClick({ event: { offsetX: mouseX, offsetY: mouseY }, manualTrigger: true, calculatedTimestamp: exactDisplayedTimestamp.current });
                   return;
                 }
                 
                 if (chartRef.current) {
                   try {
                     const echartsInstance = chartRef.current.getEchartsInstance();
                     const pointInGrid = echartsInstance.convertFromPixel('grid', [mouseX, mouseY]);
                     if (pointInGrid && pointInGrid[0]) {
                       const rawTimestamp = new Date(pointInGrid[0]);
                       let calculatedTimestamp: Date;
                       if (powerCurveData.length > 0) {
                         const closestPoint = powerCurveData.reduce((prev, curr) => Math.abs(curr.timestamp!.getTime() - rawTimestamp.getTime()) < Math.abs(prev.timestamp!.getTime() - rawTimestamp.getTime()) ? curr : prev);
                         const thirtyMinutes = 30 * 60 * 1000;
                         if (Math.abs(closestPoint.timestamp!.getTime() - rawTimestamp.getTime()) <= thirtyMinutes) {
                           calculatedTimestamp = new Date(closestPoint.timestamp!.getTime());
                         } else {
                           calculatedTimestamp = new Date(Math.round(rawTimestamp.getTime() / (60 * 1000)) * (60 * 1000));
                         }
                       } else {
                         calculatedTimestamp = new Date(Math.round(rawTimestamp.getTime() / (60 * 1000)) * (60 * 1000));
                       }
                       handleChartClick({ event: { offsetX: mouseX, offsetY: mouseY }, manualTrigger: true, calculatedTimestamp });
                     }
                   } catch (error) { console.warn('Manual click conversion failed', error) }
                 }
               }
             }}>
          <ReactECharts key={theme + hasRefPower} ref={chartRef} option={option} style={{ height: '100%', width: '100%' }} onEvents={onEvents} notMerge={false} lazyUpdate={false} opts={{ renderer: 'canvas' }} />
        </div>
        
        <div className={styles.sidebar}>
          <h4 className={styles.sidebarTitle}>Chart Selections</h4>
          <div className={styles.selectionsList}>
            {chartPins.length === 0 && chartIntervals.length === 0 && (<div className={styles.emptySelections}>No pins or intervals selected.</div>)}
            {chartPins.map(pin => (
              <div key={pin.id} className={`${styles.selectionItem} ${styles.pin}`}>
                <div className={styles.selectionHeader}>
                  <span className={styles.selectionType}>Pin</span>
                  <button className={styles.removeButton} onClick={() => removeChartPin(pin.id)} title="Remove pin">×</button>
                </div>
                <div className={styles.selectionDetails}>
                  <div className={styles.timestamp}>{format(pin.timestamp, 'yyyy-MM-dd HH:mm:ss')}</div>
                  <div className={styles.dataPoint}>Power: {pin.powerValid !== false ? `${pin.power.toFixed(2)} kW` : 'not valid data'}</div>
                  <div className={styles.dataPoint}>Wind Speed: {pin.windSpeedValid !== false ? `${pin.windSpeed.toFixed(2)} m/s` : 'not valid data'}</div>
                  {pin.expectedPower !== undefined && (<div className={styles.dataPoint}>Expected Power: {pin.expectedPowerValid !== false ? `${pin.expectedPower.toFixed(2)} kW` : 'not valid data'}</div>)}
                </div>
              </div>
            ))}
            {chartIntervals.map(interval => (
              <div key={interval.id} className={`${styles.selectionItem} ${styles.interval}`}>
                <div className={styles.selectionHeader}>
                  <span className={styles.selectionType}>Interval</span>
                  <button className={styles.removeButton} onClick={() => removeChartInterval(interval.id)} title="Remove interval">×</button>
                </div>
                <div className={styles.selectionDetails}>
                  <div className={styles.timestamp}>From: {format(interval.startTimestamp, 'yyyy-MM-dd HH:mm:ss')}</div>
                  <div className={styles.intervalRange}>To: {format(interval.endTimestamp, 'yyyy-MM-dd HH:mm:ss')}</div>
                  <div className={styles.intervalRange}>Duration: {formatDuration(interval.startTimestamp, interval.endTimestamp)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(DataChart);