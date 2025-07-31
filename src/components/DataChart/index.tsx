import React, { useRef, useMemo, useCallback, memo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useAppStore } from '../../store/useAppStore';
import { format, getMinutes, getHours, getDate, getMonth, getYear } from 'date-fns';
import type { PowerCurvePoint, TurbineEvent } from '../../types/index';
import styles from './DataChart.module.css';

const getTimeBucketKey = (date: Date): string => {
    return `${getYear(date)}-${getMonth(date)}-${getDate(date)}-${getHours(date)}-${getMinutes(date)}`;
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
  } = useAppStore();

  const chartRef = useRef<ReactECharts | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

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
        power: theme === 'dark' ? '#f43f5e' : '#a855f7',
        windLine: theme === 'dark' ? '#22c55e' : '#f59e0b',
        windArea: theme === 'dark' ? '#16a34a' : '#fde68a',
        refPower: theme === 'dark' ? '#fb7185' : '#d8b4fe',
        fault: theme === 'dark' ? '#f59e0b' : '#ef4444', 
        criticalFault: '#b91c1c'
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
      { name: 'Power (kW)', type: 'bar', barMaxWidth: 30, barGap: '-100%', itemStyle: { opacity: 0.9, color: colors.power }, z: 3, triggerEvent: true, data: displayData.map(event => [event.timestamp!.getTime(), event.power]) },
      { name: 'Wind Speed (m/s)', type: 'line', yAxisIndex: 1, showSymbol: false, lineStyle: { width: 1.5, color: colors.windLine, opacity: 0.75 }, areaStyle: { color: colors.windArea, opacity: 0.5 }, itemStyle: { opacity: 1 }, z: 1, triggerEvent: true, data: displayData.map(event => [event.timestamp!.getTime(), event.windSpeed]) },
      { name: 'Fault', type: 'scatter', symbol: 'triangle', symbolSize: 9, itemStyle: { color: colors.fault, opacity: 1 }, triggerEvent: true, data: processedSeriesData.faultEvents, zlevel: 10 },
      { name: 'Safety Critical Fault', type: 'scatter', symbol: 'diamond', symbolSize: 11, itemStyle: { color: colors.criticalFault, opacity: 1 }, triggerEvent: true, data: processedSeriesData.safetyCriticalFaultEvents, zlevel: 11 }
    ];

    if (hasRefPower) {
      baseSeries.splice(1, 0, { name: 'Expected Power (kW)', type: 'bar', barMaxWidth: 30, barGap: '-100%', itemStyle: { opacity: 0.9, color: colors.refPower }, z: 2, triggerEvent: true, data: displayData.map(event => [event.timestamp!.getTime(), event.refPower]) });
    }

    return baseSeries;
  }, [powerCurveData, processedSeriesData, theme, hasRefPower, dateRange]);

  const formatTooltip = useCallback((params: unknown[]) => {
    const tooltipTheme = {
        backgroundColor: theme === 'dark' ? 'rgba(20, 20, 30, 0.9)' : 'rgba(255, 255, 255, 0.95)',
        textColor: theme === 'dark' ? '#f1f5f9' : '#1e293b',
        borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
    };
    const baseStyle = `font-family: sans-serif; font-size: 14px; color: ${tooltipTheme.textColor}; border-radius: 6px; border: 1px solid ${tooltipTheme.borderColor}; background-color: ${tooltipTheme.backgroundColor}; padding: 10px; min-width: 250px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);`;
    const hrStyle = `border-color: ${tooltipTheme.borderColor}; margin: 6px 0;`;

    const firstParam = params[0] as { seriesType: string; data: { rawData: TurbineEvent }; axisValue: number };
    if (!firstParam) return '';

    if (firstParam.seriesType === 'scatter') {
        const event = firstParam.data.rawData as TurbineEvent;
        useAppStore.getState().setLastTooltipFormat('detailed');
        return `<div style="${baseStyle}"><strong>Event: ${event.eventType}</strong><hr style="${hrStyle}"><strong>Timestamp:</strong> ${format(event.timestamp!, 'yyyy-MM-dd HH:mm:ss')}<br><strong>Description:</strong> ${event.description}</div>`;
    }

    const hoverTime = new Date(firstParam.axisValue);
    const key = getTimeBucketKey(hoverTime);
    const eventsInBucket = eventsByTimeBucket.get(key) || [];

    let eventSummary = '<strong>No critical events in this minute.</strong>';
    if (eventsInBucket.length > 0) {
        eventSummary = eventsInBucket.map(e => `<div style="margin-top: 4px;"><strong>${format(e.timestamp!, 'HH:mm:ss')} - ${e.eventType}:</strong><br>${e.description}</div>`).join('');
    }

    const powerPoint = powerCurveData.find(p => p.timestamp?.getTime() === hoverTime.getTime());
    if (!powerPoint) return '';

    // Tooltip formatına göre tooltip tipini belirle
    const timeFormat = format(hoverTime, 'yyyy-MM-dd HH:mm:ss');
    const hasTimeDetails = timeFormat.includes(':');
    
    const tooltipFormat = hasTimeDetails ? 'detailed' : 'simple';
    useAppStore.getState().setLastTooltipFormat(tooltipFormat);

    return `<div style="${baseStyle}"><strong>${timeFormat}</strong><br>Power: ${powerPoint.power.toFixed(2)} kW | Wind: ${powerPoint.windSpeed.toFixed(2)} m/s<hr style="${hrStyle}">${eventSummary}</div>`;
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

  const handleChartClick = useCallback((params: any) => {
    if (params.data && Array.isArray(params.data) && params.data[0]) {
      const timestamp = new Date(params.data[0]);
      setSelectedChartTimestamp(timestamp);
      return;
    } 
    
    if (params.value && Array.isArray(params.value) && params.value[0]) {
      const timestamp = new Date(params.value[0]);
      setSelectedChartTimestamp(timestamp);
      return;
    }
    
    if (chartRef.current && params.event) {
      try {
        const echartsInstance = chartRef.current.getEchartsInstance();
        const isReady = echartsInstance.isDisposed() === false;
        if (!isReady) return;
        
        const pointInGrid = echartsInstance.convertFromPixel('grid', [params.event.offsetX, params.event.offsetY]);
        
        if (pointInGrid && pointInGrid[0] !== undefined && !isNaN(pointInGrid[0])) {
          const timestamp = new Date(pointInGrid[0]);
          setSelectedChartTimestamp(timestamp);
          return;
        } else {
          if (dateRange.start && dateRange.end && params.event.offsetX !== undefined) {
            const chartWidth = echartsInstance.getWidth();
            const gridLeft = chartWidth * 0.05;
            const gridRight = chartWidth * 0.05;
            const gridWidth = chartWidth - gridLeft - gridRight;
            const relativeX = (params.event.offsetX - gridLeft) / gridWidth;
            
            if (relativeX >= 0 && relativeX <= 1) {
              const timeRange = dateRange.end.getTime() - dateRange.start.getTime();
              const clickedTime = dateRange.start.getTime() + (relativeX * timeRange);
              const timestamp = new Date(clickedTime);
              setSelectedChartTimestamp(timestamp);
              return;
            }
          }
        }
      } catch (error) {
        // Sessizce devam et
      }
    }
  }, [setSelectedChartTimestamp, dateRange]);

  const onEvents = useMemo(() => ({
    datazoom: handleDataZoom,
    legendselectchanged: handleLegendSelectChanged,
    click: handleChartClick,
  }), [handleDataZoom, handleLegendSelectChanged, handleChartClick]);

  const option = useMemo(() => {
    const legendData = ['Power (kW)', 'Wind Speed (m/s)', 'Fault', 'Safety Critical Fault'];
    if (hasRefPower) {
      legendData.splice(1, 0, 'Expected Power (kW)');
    }

    return {
      useUTC: true, // DÜZELTME: Bu satır, ECharts'ın saat dilimi dönüşümü yapmasını engeller.
      tooltip: {
        trigger: 'axis', formatter: formatTooltip, axisPointer: { type: 'cross', animation: false, label: { backgroundColor: '#505765' } }, backgroundColor: 'transparent', borderColor: 'transparent', textStyle: { color: theme === 'dark' ? '#f9fafb' : '#1f293b' }, extraCssText: 'box-shadow: none;'
      },
      legend: { data: legendData, selected: legendSelected, textStyle: { color: theme === 'dark' ? '#f9fafb' : '#1f293b' } },
      grid: { left: '5%', right: '5%', bottom: '15%', containLabel: true },
      xAxis: { 
        type: 'time', 
        axisLine: { lineStyle: { color: theme === 'dark' ? '#4b5563' : '#e5e7eb' } }, 
        axisLabel: { color: theme === 'dark' ? '#f9fafb' : '#1f293b' },
        triggerEvent: true // X ekseni tıklamalarını etkinleştir
      },
      yAxis: [
        { type: 'value', name: 'Power (kW)', min: 0, nameTextStyle: { color: theme === 'dark' ? '#f9fafb' : '#1f2937' }, axisLine: { lineStyle: { color: theme === 'dark' ? '#4b5563' : '#e5e7eb' } }, axisLabel: { color: theme === 'dark' ? '#f9fafb' : '#1f2937' }, splitLine: { lineStyle: { color: [theme === 'dark' ? '#4b5563' : '#e5e7eb'] } } },
        { type: 'value', name: 'Wind Speed (m/s)', nameTextStyle: { color: theme === 'dark' ? '#f9fafb' : '#1f2937' }, axisLine: { lineStyle: { color: theme === 'dark' ? '#4b5563' : '#e5e7eb' } }, axisLabel: { color: theme === 'dark' ? '#f9fafb' : '#1f2937' }, splitLine: { show: false } }
      ],
      dataZoom: [{ type: 'inside', startValue: dateRange?.start?.getTime(), endValue: dateRange?.end?.getTime() }, { type: 'slider', startValue: dateRange?.start?.getTime(), endValue: dateRange?.end?.getTime(), textStyle: { color: theme === 'dark' ? '#f9fafb' : '#1f2937' } }],
      series: series,
      animation: false,
    };
  }, [dateRange, legendSelected, series, formatTooltip, theme, hasRefPower]);

  if (powerCurveData.length === 0) {
    return <div className={`${styles.container} ${styles.emptyState}`}>Please upload a Power Curve or Event Log file to see the chart.</div>;
  }

  return (
    <div className={styles.container}>
      <ReactECharts key={theme + hasRefPower} ref={chartRef} option={option} style={{ height: '100%', width: '100%' }} onEvents={onEvents} notMerge={true} lazyUpdate={true} />
    </div>
  );
};

export default memo(DataChart);