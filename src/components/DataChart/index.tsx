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
        refPower: theme === 'dark' ? '#6b7280' : '#9ca3af',
        fault: '#f97316',
        criticalFault: '#dc2626'
    };

    const baseSeries = [
      { name: 'Power (kW)', type: 'line', showSymbol: false, lineStyle: { width: 1.5, color: colors.power, opacity: 1 }, itemStyle: { opacity: 0.66 }, z: 3, data: powerCurveData.map(event => [event.timestamp!.getTime(), event.power]) },
      { name: 'Wind Speed (m/s)', type: 'line', yAxisIndex: 1, showSymbol: false, lineStyle: { width: 1.5, color: colors.wind, opacity: 0.66 }, itemStyle: { opacity: 0.66 }, z: 2, data: powerCurveData.map(event => [event.timestamp!.getTime(), event.windSpeed]) },
      { name: 'Fault', type: 'scatter', symbol: 'triangle', symbolSize: 9, itemStyle: { color: colors.fault, opacity: 0.66 }, data: processedSeriesData.faultEvents, zlevel: 10 },
      { name: 'Safety Critical Fault', type: 'scatter', symbol: 'diamond', symbolSize: 11, itemStyle: { color: colors.criticalFault, opacity: 0.66 }, data: processedSeriesData.safetyCriticalFaultEvents, zlevel: 11 }
    ];

    // YENİ MANTIK: Sadece refPower varsa bu seriyi ekle
    if (hasRefPower) {
      baseSeries.splice(2, 0, { name: 'Expected Power (kW)', type: 'line', showSymbol: false, lineStyle: { width: 1, type: 'dashed', color: colors.refPower, opacity: 0.66 }, itemStyle: { opacity: 0.66 }, z: 1, data: powerCurveData.map(event => [event.timestamp!.getTime(), event.refPower]) });
    }

    return baseSeries;
  }, [powerCurveData, processedSeriesData, theme, hasRefPower]);

  const formatTooltip = useCallback((params: any) => {
    // ... (Mevcut formatTooltip fonksiyonu değişmeden kalabilir) ...
    // ...
  }, [eventsByTimeBucket, powerCurveData, theme]);

  const handleDataZoom = useCallback(() => {
    // ... (Mevcut handleDataZoom fonksiyonu değişmeden kalabilir) ...
    // ...
  }, [dateRange, setDateRange]);

  const handleLegendSelectChanged = useCallback((e: any) => setLegendSelected(e.selected), [setLegendSelected]);

  const handleBrushSelected = useCallback((params: any) => {
    // ... (Mevcut handleBrushSelected fonksiyonu değişmeden kalabilir) ...
    // ...
  }, [setNewCommentSelection]);

  const onEvents = useMemo(() => ({
    datazoom: handleDataZoom,
    legendselectchanged: handleLegendSelectChanged,
    brushselected: handleBrushSelected,
  }), [handleDataZoom, handleLegendSelectChanged, handleBrushSelected]);

  const option = useMemo(() => {
    // YENİ MANTIK: Lejantı, verinin varlığına göre dinamik olarak oluştur
    const legendData = ['Power (kW)', 'Wind Speed (m/s)', 'Fault', 'Safety Critical Fault'];
    if (hasRefPower) {
      legendData.splice(1, 0, 'Expected Power (kW)');
    }

    return {
      tooltip: { trigger: 'axis', formatter: formatTooltip, axisPointer: { type: 'cross', animation: false, label: { backgroundColor: '#505765' } }, backgroundColor: 'transparent', borderColor: 'transparent', textStyle: { color: theme === 'dark' ? '#f9fafb' : '#1f2937' }, extraCssText: 'box-shadow: none;' },
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