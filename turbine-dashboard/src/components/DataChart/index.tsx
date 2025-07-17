import React, { useRef, useMemo, useCallback, memo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useAppStore } from '../../store/useAppStore.js';
import { format, addMinutes, subMinutes } from 'date-fns';
import type { PowerCurvePoint, TurbineEvent } from '../../types/index.js';
import styles from './DataChart.module.css';

const DataChart: React.FC = () => {
  const {
    powerCurveData,
    logEvents,
    dateRange,
    setDateRange,
    legendSelected,
    setLegendSelected,
    setNewCommentSelection,
    theme,
  } = useAppStore();

  const chartRef = useRef<any>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // ... (useMemo ve useCallback hook'ları değişmedi)
  const chartEvents = useMemo(() => {
    if (powerCurveData.length === 0 || logEvents.length === 0) return [];
    const activeFilters = ['fault', 'safety critical fault'];
    return logEvents
      .filter(log => log.eventType && activeFilters.includes(log.eventType.toLowerCase().trim()))
      .map(log => {
        const closestPowerPoint = powerCurveData.reduce((prev, curr) =>
          Math.abs(curr.timestamp!.getTime() - log.timestamp!.getTime()) < Math.abs(prev.timestamp!.getTime() - log.timestamp!.getTime()) ? curr : prev
        );
        return {
          value: [log.timestamp!.getTime(), closestPowerPoint.power],
          rawData: log,
        };
      });
  }, [logEvents, powerCurveData]);

  const series = useMemo(() => {
    const baseSeries = [
      { name: 'Power (kW)', type: 'line', showSymbol: false, lineStyle: { width: 1 }, data: powerCurveData.map(event => [event.timestamp!.getTime(), event.power]) },
      { name: 'Expected Power (kW)', type: 'line', showSymbol: false, lineStyle: { width: 1 }, data: powerCurveData.map(event => [event.timestamp!.getTime(), event.refPower]) },
      { name: 'Wind Speed (m/s)', type: 'line', yAxisIndex: 1, showSymbol: false, lineStyle: { width: 1 }, data: powerCurveData.map(event => [event.timestamp!.getTime(), event.windSpeed]) },
    ];
    if (chartEvents.length > 0) {
      baseSeries.push({
        name: 'Critical Events', type: 'scatter', symbolSize: 8, itemStyle: { color: '#ef4444' }, data: chartEvents, zlevel: 10,
      });
    }
    return baseSeries;
  }, [powerCurveData, chartEvents]);

  const formatTooltip = useCallback((params: any) => {
    const firstParam = params[0];
    if (!firstParam) return '';

    if (firstParam.seriesType === 'scatter') {
      const event = firstParam.data.rawData as TurbineEvent;
      return `<div style="font-family: sans-serif; font-size: 14px; color: #333; min-width: 250px;"><strong>Event: ${event.eventType}</strong><hr style="border-color: #eee; margin: 4px 0;"><strong>Timestamp:</strong> ${format(event.timestamp!, 'yyyy-MM-dd HH:mm:ss')}<br><strong>Description:</strong> ${event.description}</div>`;
    }
    const hoverTime = new Date(firstParam.axisValue);
    const startTime = subMinutes(hoverTime, 5);
    const endTime = addMinutes(hoverTime, 5);
    const eventsInWindow = logEvents.filter(e => {
      if (!e.timestamp) return false;
      const eventTime = e.timestamp.getTime();
      return eventTime >= startTime.getTime() && eventTime <= endTime.getTime();
    });
    let eventSummary = '<strong>No critical events in this 10-min window.</strong>';
    if (eventsInWindow.length > 0) {
      eventSummary = eventsInWindow.map(e => `<div style="margin-top: 4px;"><strong>${format(e.timestamp!, 'HH:mm:ss')} - ${e.eventType}:</strong><br>${e.description}</div>`).join('');
    }
    const powerPoint = powerCurveData[firstParam.dataIndex];
    if (!powerPoint) return '';
    return `<div style="font-family: sans-serif; font-size: 14px; color: #333; min-width: 300px;"><strong>${format(hoverTime, 'yyyy-MM-dd HH:mm:ss')}</strong><br>Power: ${powerPoint.power.toFixed(2)} kW | Wind: ${powerPoint.windSpeed.toFixed(2)} m/s<hr style="border-color: #eee; margin: 6px 0;">${eventSummary}</div>`;
  }, [logEvents, powerCurveData]);

  const handleDataZoom = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      if (chartRef.current) {
        const echartsInstance = chartRef.current.getEchartsInstance();
        const newOption = echartsInstance.getOption();
        if (newOption.dataZoom && newOption.dataZoom.length > 0) {
          const startValue = newOption.dataZoom[0].startValue;
          const endValue = newOption.dataZoom[0].endValue;
          if (startValue != null && endValue != null && (dateRange.start?.getTime() !== startValue || dateRange.end?.getTime() !== endValue)) {
            setDateRange({ start: new Date(startValue), end: new Date(endValue) });
          }
        }
      }
    }, 400);
  }, [dateRange, setDateRange]);

  const handleLegendSelectChanged = useCallback((e: any) => {
    setLegendSelected(e.selected);
  }, [setLegendSelected]);

  const handleBrushSelected = useCallback((params: any) => {
    const areas = params.areas;
    if (areas.length > 0 && areas[0].coordRange) {
      const [start, end] = areas[0].coordRange;
      setNewCommentSelection({ start, end });
    }
  }, [setNewCommentSelection]);

  const handleChartClick = useCallback((params: any) => {
      if (params.componentType === 'series') {
          const pointInGrid = [params.event.offsetX, params.event.offsetY];
          const echartsInstance = chartRef.current.getEchartsInstance();
          if (echartsInstance.containPixel('grid', pointInGrid)) {
              setNewCommentSelection({ start: params.data[0] });
          }
      }
  }, [setNewCommentSelection]);

  const onEvents = useMemo(() => ({
    datazoom: handleDataZoom,
    legendselectchanged: handleLegendSelectChanged,
    brushselected: handleBrushSelected,
    click: handleChartClick,
  }), [handleDataZoom, handleLegendSelectChanged, handleBrushSelected, handleChartClick]);


  const option = useMemo(() => {
    const textColor = theme === 'dark' ? '#f9fafb' : '#1f2937';
    const axisLineColor = theme === 'dark' ? '#4b5563' : '#e5e7eb';
    return {
      tooltip: { trigger: 'axis', formatter: formatTooltip, axisPointer: { type: 'cross', animation: false, label: { backgroundColor: '#505765' } } },
      legend: { data: Object.keys(legendSelected), selected: legendSelected, textStyle: { color: textColor } },
      grid: { left: '5%', right: '5%', bottom: '15%', containLabel: true },
      xAxis: { type: 'time', axisLine: { lineStyle: { color: axisLineColor } }, axisLabel: { color: textColor } },
      yAxis: [
        { type: 'value', name: 'Power (kW)', nameTextStyle: { color: textColor }, axisLine: { lineStyle: { color: axisLineColor } }, axisLabel: { color: textColor }, splitLine: { lineStyle: { color: [axisLineColor] } } },
        { type: 'value', name: 'Wind Speed (m/s)', nameTextStyle: { color: textColor }, axisLine: { lineStyle: { color: axisLineColor } }, axisLabel: { color: textColor }, splitLine: { show: false } }
      ],
      dataZoom: [{ type: 'inside', startValue: dateRange?.start?.getTime(), endValue: dateRange?.end?.getTime() }, { type: 'slider', startValue: dateRange?.start?.getTime(), endValue: dateRange?.end?.getTime(), textStyle: { color: textColor } }],
      series: series,
      animation: false,
      brush: {
        toolbox: ['lineX', 'clear'], xAxisIndex: 'all', throttleType: 'debounce', throttleDelay: 500,
      },
    }
  }, [dateRange, legendSelected, series, formatTooltip, theme]);

  if (powerCurveData.length === 0) {
    return <div className={`${styles.container} ${styles.emptyState}`}>Please upload a Power Curve file to see the chart.</div>;
  }

  return (
    <div className={styles.container}>
      <ReactECharts
        key={theme}
        ref={chartRef}
        option={option}
        style={{ height: '100%', width: '100%' }} // Yüksekliği %100 yapıldı
        onEvents={onEvents}
        notMerge={true}
        lazyUpdate={true}
      />
    </div>
  );
};

export default memo(DataChart);