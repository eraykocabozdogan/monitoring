import React, { useRef, useMemo, useCallback, memo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useAppStore } from '../../store/useAppStore';
import { format, getMinutes, getHours, getDate, getMonth, getYear } from 'date-fns';
import type { PowerCurvePoint, TurbineEvent, ChartPin, ChartInterval } from '../../types/index';
import styles from './DataChart.module.css';

const getTimeBucketKey = (date: Date): string => {
    return `${getYear(date)}-${getMonth(date)}-${getDate(date)}-${getHours(date)}-${getMinutes(date)}`;
};

const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
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
      { name: 'Power (kW)', type: 'bar', barMaxWidth: 30, barGap: '-100%', itemStyle: { opacity: 0.9, color: colors.power }, z: 3, triggerEvent: true, data: displayData.map(event => [event.timestamp!.getTime(), event.power]), xAxisIndex: 0, yAxisIndex: 0 },
      { name: 'Wind Speed (m/s)', type: 'line', yAxisIndex: 1, xAxisIndex: 0, showSymbol: false, lineStyle: { width: 1.5, color: colors.windLine, opacity: 0.75 }, areaStyle: { color: colors.windArea, opacity: 0.5 }, itemStyle: { opacity: 1 }, z: 1, triggerEvent: true, data: displayData.map(event => [event.timestamp!.getTime(), event.windSpeed]) },
      { name: 'Fault', type: 'scatter', symbol: 'triangle', symbolSize: 9, itemStyle: { color: colors.fault, opacity: 1 }, triggerEvent: true, data: processedSeriesData.faultEvents, zlevel: 10, xAxisIndex: 0, yAxisIndex: 0 },
      { name: 'Safety Critical Fault', type: 'scatter', symbol: 'diamond', symbolSize: 11, itemStyle: { color: colors.criticalFault, opacity: 1 }, triggerEvent: true, data: processedSeriesData.safetyCriticalFaultEvents, zlevel: 11, xAxisIndex: 0, yAxisIndex: 0 }
    ];

    if (hasRefPower) {
      baseSeries.splice(1, 0, { name: 'Expected Power (kW)', type: 'bar', barMaxWidth: 30, barGap: '-100%', itemStyle: { opacity: 0.9, color: colors.refPower }, z: 2, triggerEvent: true, data: displayData.map(event => [event.timestamp!.getTime(), event.refPower]), xAxisIndex: 0, yAxisIndex: 0 });
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

    const firstParam = params[0] as { seriesType: string; seriesName?: string; data: { rawData?: TurbineEvent }; axisValue: number };
    if (!firstParam) return '';

    // Handle pin/interval series - skip tooltip for these
    if (firstParam.seriesName === 'Chart Pins' || firstParam.seriesName === 'Chart Intervals') {
      return '';
    }

    if (firstParam.seriesType === 'scatter' && firstParam.data?.rawData) {
        const event = firstParam.data.rawData;
        if (!event || !event.eventType || !event.timestamp) return '';
        
        useAppStore.getState().setLastTooltipFormat('detailed');
        return `<div style="${baseStyle}"><strong>Event: ${event.eventType}</strong><hr style="${hrStyle}"><strong>Timestamp:</strong> ${format(event.timestamp, 'yyyy-MM-dd HH:mm:ss')}<br><strong>Description:</strong> ${event.description || 'No description available'}</div>`;
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
    let clickedTimestamp: Date | null = null;
    
    // First try to get timestamp from clicked data point
    if (params.data && Array.isArray(params.data) && params.data[0]) {
      clickedTimestamp = new Date(params.data[0]);
    } else if (params.value && Array.isArray(params.value) && params.value[0]) {
      clickedTimestamp = new Date(params.value[0]);
    }
    
    // If no data point clicked, try coordinate conversion
    if (!clickedTimestamp && chartRef.current && params.event) {
      try {
        const echartsInstance = chartRef.current.getEchartsInstance();
        const isReady = echartsInstance.isDisposed() === false;
        if (!isReady) return;
        
        // Try to convert pixel coordinates to chart coordinates
        const pointInGrid = echartsInstance.convertFromPixel('grid', [params.event.offsetX, params.event.offsetY]);
        
        if (pointInGrid && pointInGrid[0] !== undefined && !isNaN(pointInGrid[0])) {
          clickedTimestamp = new Date(pointInGrid[0]);
        } else {
          // Fallback: manual calculation based on chart dimensions
          if (dateRange.start && dateRange.end && params.event.offsetX !== undefined) {
            const chartWidth = echartsInstance.getWidth();
            const gridLeft = chartWidth * 0.03;
            const gridRight = chartWidth * 0.03;
            const gridWidth = chartWidth - gridLeft - gridRight;
            const relativeX = (params.event.offsetX - gridLeft) / gridWidth;
            
            if (relativeX >= 0 && relativeX <= 1) {
              const timeRange = dateRange.end.getTime() - dateRange.start.getTime();
              const clickedTime = dateRange.start.getTime() + (relativeX * timeRange);
              clickedTimestamp = new Date(clickedTime);
            }
          }
        }
      } catch (error) {
        // Continue silently
      }
    }

    if (!clickedTimestamp) return;

    // Handle different chart modes
    if (chartMode === 'pin') {
      // Find the closest power data point for this timestamp
      let closestPowerPoint = null;
      let minDistance = Infinity;
      
      if (powerCurveData.length > 0) {
        for (const point of powerCurveData) {
          if (point.timestamp) {
            const distance = Math.abs(point.timestamp.getTime() - clickedTimestamp.getTime());
            if (distance < minDistance) {
              minDistance = distance;
              closestPowerPoint = point;
            }
          }
        }
      }

      // Create pin even if no power data is available
      const pin: ChartPin = {
        id: generateId(),
        timestamp: clickedTimestamp,
        power: closestPowerPoint ? closestPowerPoint.power : 0,
        windSpeed: closestPowerPoint ? closestPowerPoint.windSpeed : 0,
        expectedPower: closestPowerPoint && closestPowerPoint.refPower > 0 ? closestPowerPoint.refPower : undefined,
      };
      
      addChartPin(pin);
    } else if (chartMode === 'interval') {
      if (!pendingInterval) {
        // Start new interval
        setPendingInterval({ startTimestamp: clickedTimestamp });
      } else {
        // Complete interval
        const startTime = pendingInterval.startTimestamp.getTime();
        const endTime = clickedTimestamp.getTime();
        
        const interval: ChartInterval = {
          id: generateId(),
          startTimestamp: startTime < endTime ? pendingInterval.startTimestamp : clickedTimestamp,
          endTimestamp: startTime < endTime ? clickedTimestamp : pendingInterval.startTimestamp,
        };
        
        addChartInterval(interval);
        setPendingInterval(null);
      }
    } else {
      // Normal mode - just set selected timestamp
      setSelectedChartTimestamp(clickedTimestamp);
    }
  }, [setSelectedChartTimestamp, dateRange, chartMode, pendingInterval, powerCurveData, addChartPin, addChartInterval, setPendingInterval]);

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

    // Create slider timeline series for pins and intervals
    const sliderSeries = [];

    // Add pin markers as a separate series
    if (chartPins.length > 0 || pendingInterval) {
      const pinData = [];
      
      // Add chart pins
      chartPins.forEach(pin => {
        pinData.push({
          value: [pin.timestamp.getTime(), 0.5],
          symbol: 'circle',
          symbolSize: 12,
          itemStyle: {
            color: '#3b82f6',
            borderColor: '#ffffff',
            borderWidth: 2
          }
        });
      });

      // Add pending interval start marker
      if (pendingInterval) {
        pinData.push({
          value: [pendingInterval.startTimestamp.getTime(), 0.5],
          symbol: 'rect',
          symbolSize: 12,
          itemStyle: {
            color: '#10b981',
            borderColor: '#ffffff',
            borderWidth: 2
          }
        });
      }

      sliderSeries.push({
        name: 'Chart Pins',
        type: 'scatter',
        data: pinData,
        xAxisIndex: 1,
        yAxisIndex: 2,
        showInLegend: false,
        silent: true,
        zlevel: 100,
        tooltip: { show: false }
      });
    }

    // Add interval markers as line segments
    if (chartIntervals.length > 0) {
      const intervalData: any[] = [];
      
      chartIntervals.forEach(interval => {
        intervalData.push({
          value: [interval.startTimestamp.getTime(), 0.5],
        });
        intervalData.push({
          value: [interval.endTimestamp.getTime(), 0.5],
        });
        intervalData.push({
          value: [null, null], // Break in line
        });
      });

      sliderSeries.push({
        name: 'Chart Intervals',
        type: 'line',
        data: intervalData,
        xAxisIndex: 1,
        yAxisIndex: 2,
        showInLegend: false,
        silent: true,
        lineStyle: {
          color: '#10b981',
          width: 6,
          opacity: 0.7
        },
        showSymbol: false,
        zlevel: 99,
        tooltip: { show: false }
      });
    }

    return {
      useUTC: true, // DÜZELTME: Bu satır, ECharts'ın saat dilimi dönüşümü yapmasını engeller.
      tooltip: {
        trigger: 'axis', 
        formatter: formatTooltip, 
        axisPointer: { type: 'cross', animation: false, label: { backgroundColor: '#505765' } }, 
        backgroundColor: 'transparent', 
        borderColor: 'transparent', 
        textStyle: { color: theme === 'dark' ? '#f9fafb' : '#1f293b' }, 
        extraCssText: 'box-shadow: none;',
        confine: true,
        enterable: false
      },
      legend: { data: legendData, selected: legendSelected, textStyle: { color: theme === 'dark' ? '#f9fafb' : '#1f293b' } },
      grid: [
        { left: '3%', right: '3%', bottom: '15%', containLabel: true, triggerEvent: true },
        { left: '3%', right: '3%', bottom: '5%', height: '8%', show: false }
      ],
      xAxis: [
        { 
          type: 'time', 
          gridIndex: 0,
          axisLine: { lineStyle: { color: theme === 'dark' ? '#4b5563' : '#e5e7eb' } }, 
          axisLabel: { color: theme === 'dark' ? '#f9fafb' : '#1f293b' },
          triggerEvent: true // X ekseni tıklamalarını etkinleştir
        },
        {
          type: 'time',
          gridIndex: 1,
          position: 'bottom',
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { show: false },
          splitLine: { show: false },
          min: dateRange?.start?.getTime(),
          max: dateRange?.end?.getTime()
        }
      ],
      yAxis: [
        { 
          type: 'value', 
          gridIndex: 0,
          name: 'Power (kW)', 
          min: 0, 
          nameTextStyle: { color: theme === 'dark' ? '#f9fafb' : '#1f2937' }, 
          axisLine: { lineStyle: { color: theme === 'dark' ? '#4b5563' : '#e5e7eb' } }, 
          axisLabel: { color: theme === 'dark' ? '#f9fafb' : '#1f2937' }, 
          splitLine: { lineStyle: { color: [theme === 'dark' ? '#4b5563' : '#e5e7eb'] } },
          triggerEvent: true
        },
        { 
          type: 'value', 
          gridIndex: 0,
          name: 'Wind Speed (m/s)', 
          nameTextStyle: { color: theme === 'dark' ? '#f9fafb' : '#1f2937' }, 
          axisLine: { lineStyle: { color: theme === 'dark' ? '#4b5563' : '#e5e7eb' } }, 
          axisLabel: { color: theme === 'dark' ? '#f9fafb' : '#1f2937' }, 
          splitLine: { show: false }, 
          triggerEvent: true 
        },
        {
          type: 'value',
          gridIndex: 1,
          min: 0,
          max: 1,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { show: false },
          splitLine: { show: false }
        }
      ],
      dataZoom: [
        { type: 'inside', startValue: dateRange?.start?.getTime(), endValue: dateRange?.end?.getTime() }, 
        { 
          type: 'slider', 
          startValue: dateRange?.start?.getTime(), 
          endValue: dateRange?.end?.getTime(), 
          textStyle: { color: theme === 'dark' ? '#f9fafb' : '#1f2937' }
        }
      ],
      series: [...series, ...sliderSeries],
      animation: false,
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
          <button
            className={`${styles.controlButton} ${chartMode === 'interval' ? styles.active : ''}`}
            onClick={() => setChartMode(chartMode === 'interval' ? 'normal' : 'interval')}
          >
            {chartMode === 'interval' ? (pendingInterval ? 'Click to end interval' : 'Click to start interval') : 'Select Interval'}
          </button>
          <button
            className={`${styles.controlButton} ${chartMode === 'pin' ? styles.active : ''}`}
            onClick={() => setChartMode(chartMode === 'pin' ? 'normal' : 'pin')}
          >
            Add Pin
          </button>
          <button
            className={styles.controlButton}
            onClick={clearChartSelections}
            disabled={chartPins.length === 0 && chartIntervals.length === 0}
          >
            Clear Selections
          </button>
        </div>
      </div>
      
      <div className={styles.mainContent}>
        <div className={styles.chartWrapper}>
          <ReactECharts 
            key={theme + hasRefPower} 
            ref={chartRef} 
            option={option} 
            style={{ height: '100%', width: '100%' }} 
            onEvents={onEvents} 
            notMerge={false} 
            lazyUpdate={false}
            opts={{ renderer: 'canvas' }}
          />
        </div>
        
        <div className={styles.sidebar}>
          <h4 className={styles.sidebarTitle}>Chart Selections</h4>
          
          <div className={styles.selectionsList}>
            {chartPins.length === 0 && chartIntervals.length === 0 && (
              <div className={styles.emptySelections}>
                No pins or intervals selected.
              </div>
            )}
            
            {chartPins.map(pin => (
              <div key={pin.id} className={`${styles.selectionItem} ${styles.pin}`}>
                <div className={styles.selectionHeader}>
                  <span className={styles.selectionType}>Pin</span>
                  <button
                    className={styles.removeButton}
                    onClick={() => removeChartPin(pin.id)}
                    title="Remove pin"
                  >
                    ×
                  </button>
                </div>
                <div className={styles.selectionDetails}>
                  <div className={styles.timestamp}>
                    {format(pin.timestamp, 'yyyy-MM-dd HH:mm:ss')}
                  </div>
                  <div className={styles.dataPoint}>
                    Power: {pin.power.toFixed(2)} kW
                  </div>
                  <div className={styles.dataPoint}>
                    Wind Speed: {pin.windSpeed.toFixed(2)} m/s
                  </div>
                  {pin.expectedPower && (
                    <div className={styles.dataPoint}>
                      Expected Power: {pin.expectedPower.toFixed(2)} kW
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {chartIntervals.map(interval => (
              <div key={interval.id} className={`${styles.selectionItem} ${styles.interval}`}>
                <div className={styles.selectionHeader}>
                  <span className={styles.selectionType}>Interval</span>
                  <button
                    className={styles.removeButton}
                    onClick={() => removeChartInterval(interval.id)}
                    title="Remove interval"
                  >
                    ×
                  </button>
                </div>
                <div className={styles.selectionDetails}>
                  <div className={styles.timestamp}>
                    From: {format(interval.startTimestamp, 'yyyy-MM-dd HH:mm:ss')}
                  </div>
                  <div className={styles.intervalRange}>
                    To: {format(interval.endTimestamp, 'yyyy-MM-dd HH:mm:ss')}
                  </div>
                  <div className={styles.intervalRange}>
                    Duration: {Math.round((interval.endTimestamp.getTime() - interval.startTimestamp.getTime()) / (1000 * 60))} minutes
                  </div>
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