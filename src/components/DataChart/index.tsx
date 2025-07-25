import React, { useRef, useMemo, useCallback, memo, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { useAppStore } from '../../store/useAppStore';
import { format, getMinutes, getHours, getDate, getMonth, getYear } from 'date-fns';
import type { PowerCurvePoint, TurbineEvent } from '../../types/index';
import styles from './DataChart.module.css';

// Tooltip için olayları gruplamak üzere Map anahtarı oluşturur (Yıl-Ay-Gün-Saat-Dakika)
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
    newCommentSelection,
    setNewCommentSelection,
    theme,
    isTooltipEnabled,
  } = useAppStore();

  const chartRef = useRef<ReactECharts | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Verinin gerçek bir power curve dosyasından gelip gelmediğini kontrol et
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


  useEffect(() => {
    if (!newCommentSelection && chartRef.current) {
      const echartsInstance = chartRef.current.getEchartsInstance();
      echartsInstance.dispatchAction({ type: 'brush', areas: [] });
    }
  }, [newCommentSelection]);

  const series = useMemo(() => {
    const colors = {
        power: theme === 'dark' ? '#3b82f6' : '#2563eb',
        wind: theme === 'dark' ? '#22c55e' : '#16a34a',
        refPower: theme === 'dark' ? '#9ca3af' : '#6b7280',
        fault: '#f97316',
        criticalFault: '#dc2626'
    };

    const baseSeries = [
      // DÜZENLEME: "Power (kW)" serisi 'bar' tipine çevrildi
      { name: 'Power (kW)', type: 'bar', itemStyle: { opacity: 0.66, color: colors.power }, z: 3, data: powerCurveData.map(event => [event.timestamp!.getTime(), event.power]) },
      // "Wind Speed (m/s)" serisi alan grafiği olarak kalacak
      { name: 'Wind Speed (m/s)', type: 'line', yAxisIndex: 1, showSymbol: false, lineStyle: { width: 1.5, color: colors.wind }, areaStyle: { opacity: 0.3 }, itemStyle: { opacity: 0.66 }, z: 2, data: powerCurveData.map(event => [event.timestamp!.getTime(), event.windSpeed]) },
      { name: 'Fault', type: 'scatter', symbol: 'triangle', symbolSize: 9, itemStyle: { color: colors.fault, opacity: 0.66 }, data: processedSeriesData.faultEvents, zlevel: 10 },
      { name: 'Safety Critical Fault', type: 'scatter', symbol: 'diamond', symbolSize: 11, itemStyle: { color: colors.criticalFault, opacity: 0.66 }, data: processedSeriesData.safetyCriticalFaultEvents, zlevel: 11 }
    ];

    if (hasRefPower) {
      // DÜZENLEME: "Expected Power (kW)" serisi 'bar' tipine çevrildi
      baseSeries.splice(1, 0, { name: 'Expected Power (kW)', type: 'bar', barGap: '-100%', itemStyle: { opacity: 0.4, color: colors.refPower }, z: 1, data: powerCurveData.map(event => [event.timestamp!.getTime(), event.refPower]) });
    }

    return baseSeries;
  }, [powerCurveData, processedSeriesData, theme, hasRefPower]);

  const formatTooltip = useCallback((params: any) => {
    const tooltipTheme = {
        backgroundColor: theme === 'dark' ? 'rgba(20, 20, 30, 0.9)' : 'rgba(255, 255, 255, 0.95)',
        textColor: theme === 'dark' ? '#f1f5f9' : '#1e293b',
        borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
    };
    const baseStyle = `font-family: sans-serif; font-size: 14px; color: ${tooltipTheme.textColor}; border-radius: 6px; border: 1px solid ${tooltipTheme.borderColor}; background-color: ${tooltipTheme.backgroundColor}; padding: 10px; min-width: 250px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);`;
    const hrStyle = `border-color: ${tooltipTheme.borderColor}; margin: 6px 0;`;

    const firstParam = params[0];
    if (!firstParam) return '';
    
    if (firstParam.seriesType === 'scatter') {
        const event = firstParam.data.rawData as TurbineEvent;
        return `<div style="${baseStyle}"><strong>Event: ${event.eventType}</strong><hr style="${hrStyle}"><strong>Timestamp:</strong> ${format(event.timestamp!, 'yyyy-MM-dd HH:mm:ss')}<br><strong>Description:</strong> ${event.description}</div>`;
    }

    const hoverTime = new Date(firstParam.axisValue);
    
    const key = getTimeBucketKey(hoverTime);
    const eventsInBucket = eventsByTimeBucket.get(key) || [];
    
    let eventSummary = '<strong>No critical events in this minute.</strong>';
    if (eventsInBucket.length > 0) {
        eventSummary = eventsInBucket.map(e => `<div style="margin-top: 4px;"><strong>${format(e.timestamp!, 'HH:mm:ss')} - ${e.eventType}:</strong><br>${e.description}</div>`).join('');
    }

    const powerPoint = powerCurveData[firstParam.dataIndex];
    if (!powerPoint) return '';
    
    return `<div style="${baseStyle}"><strong>${format(hoverTime, 'yyyy-MM-dd HH:mm:ss')}</strong><br>Power: ${powerPoint.power.toFixed(2)} kW | Wind: ${powerPoint.windSpeed.toFixed(2)} m/s<hr style="${hrStyle}">${eventSummary}</div>`;
  }, [eventsByTimeBucket, powerCurveData, theme]);

  const handleDataZoom = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      if (chartRef.current) {
        const echartsInstance = chartRef.current.getEchartsInstance();
        const newOption = echartsInstance.getOption();
        if (newOption.dataZoom && Array.isArray(newOption.dataZoom) && (newOption.dataZoom as any[]).length > 0) {
          const { startValue, endValue } = (newOption.dataZoom as any[])[0];
          if (startValue != null && endValue != null && (dateRange.start?.getTime() !== startValue || dateRange.end?.getTime() !== endValue)) {
            setDateRange({ start: new Date(startValue), end: new Date(endValue) });
          }
        }
      }
    }, 300);
  }, [dateRange, setDateRange]);

  const handleLegendSelectChanged = useCallback((e: any) => setLegendSelected(e.selected), [setLegendSelected]);

  const handleBrushSelected = useCallback((params: any) => {
    const areas = params.areas;
    if (!areas || areas.length === 0) {
      setNewCommentSelection(null);
      return;
    }
    const area = areas[0];
    if (area && area.coordRange) {
      const [start, end] = area.coordRange;
      setNewCommentSelection({ start, end: start === end ? undefined : end });
    }
  }, [setNewCommentSelection]);

  const onEvents = useMemo(() => ({
    datazoom: handleDataZoom,
    legendselectchanged: handleLegendSelectChanged,
    brushselected: handleBrushSelected,
  }), [handleDataZoom, handleLegendSelectChanged, handleBrushSelected]);

  const option = useMemo(() => {
    const legendData = ['Power (kW)', 'Wind Speed (m/s)', 'Fault', 'Safety Critical Fault'];
    if (hasRefPower) {
      legendData.splice(1, 0, 'Expected Power (kW)');
    }

    return {
      tooltip: { 
        show: isTooltipEnabled,
        trigger: 'axis', 
        formatter: formatTooltip, 
        axisPointer: { type: 'cross', animation: false, label: { backgroundColor: '#505765' } }, 
        backgroundColor: 'transparent', 
        borderColor: 'transparent', 
        textStyle: { color: theme === 'dark' ? '#f9fafb' : '#1f2937' }, 
        extraCssText: 'box-shadow: none;' 
      },
      legend: { data: legendData, selected: legendSelected, textStyle: { color: theme === 'dark' ? '#f9fafb' : '#1f2937' } },
      grid: { left: '5%', right: '5%', bottom: '15%', containLabel: true },
      xAxis: { type: 'time', axisLine: { lineStyle: { color: theme === 'dark' ? '#4b5563' : '#e5e7eb' } }, axisLabel: { color: theme === 'dark' ? '#f9fafb' : '#1f2937' } },
      yAxis: [
        { type: 'value', name: 'Power (kW)', nameTextStyle: { color: theme === 'dark' ? '#f9fafb' : '#1f2937' }, axisLine: { lineStyle: { color: theme === 'dark' ? '#4b5563' : '#e5e7eb' } }, axisLabel: { color: theme === 'dark' ? '#f9fafb' : '#1f2937' }, splitLine: { lineStyle: { color: [theme === 'dark' ? '#4b5563' : '#e5e7eb'] } } },
        { type: 'value', name: 'Wind Speed (m/s)', nameTextStyle: { color: theme === 'dark' ? '#f9fafb' : '#1f2937' }, axisLine: { lineStyle: { color: theme === 'dark' ? '#4b5563' : '#e5e7eb' } }, axisLabel: { color: theme === 'dark' ? '#f9fafb' : '#1f2937' }, splitLine: { show: false } }
      ],
      dataZoom: [{ type: 'inside', startValue: dateRange?.start?.getTime(), endValue: dateRange?.end?.getTime() }, { type: 'slider', startValue: dateRange?.start?.getTime(), endValue: dateRange?.end?.getTime(), textStyle: { color: theme === 'dark' ? '#f9fafb' : '#1f2937' } }],
      series: series,
      animation: false,
      brush: { toolbox: ['lineX', 'clear'], xAxisIndex: 'all', throttleType: 'debounce', throttleDelay: 500, },
    };
  }, [dateRange, legendSelected, series, formatTooltip, theme, hasRefPower, isTooltipEnabled]);

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