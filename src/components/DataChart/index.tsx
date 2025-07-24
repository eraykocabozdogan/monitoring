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
        power: theme === 'dark' ? '#FFCA28' : '#1565C0',
        wind: theme === 'dark' ? '#26A69A' : '#2E7D32',
        refPower: '#B39DDB', // Her iki tema için de aynı renk
        fault: '#FFA726',
        criticalFault: '#EF5350'
    };

    const baseSeries = [
      {
        name: 'Power (kW)',
        type: 'line',
        showSymbol: false,
        lineStyle: { width: 2, color: colors.power },
        z: 10,
        data: powerCurveData.map(event => [event.timestamp!.getTime(), event.power])
      },
      {
        name: 'Wind Speed (m/s)',
        type: 'line',
        yAxisIndex: 1,
        showSymbol: false,
        lineStyle: {
          width: 0
        },
        areaStyle: {
          color: colors.wind,
          opacity: 0.25
        },
        z: 1,
        data: powerCurveData.map(event => [event.timestamp!.getTime(), event.windSpeed])
      },
      { name: 'Fault', type: 'scatter', symbol: 'triangle', symbolSize: 9, itemStyle: { color: colors.fault }, zlevel: 5, data: processedSeriesData.faultEvents },
      { name: 'Safety Critical Fault', type: 'scatter', symbol: 'diamond', symbolSize: 11, itemStyle: { color: colors.criticalFault }, zlevel: 5, data: processedSeriesData.safetyCriticalFaultEvents }
    ];

    if (hasRefPower) {
      baseSeries.splice(2, 0, {
        name: 'Expected Power (kW)',
        type: 'line', // Sürekli bir çizgi olmasını sağlar
        showSymbol: false,
        lineStyle: {
          width: 1.5,
          type: 'dashed', // Çizgiyi kesikli yapar
          color: colors.refPower, // Temadan bağımsız renk
          opacity: 1
        },
        z: 5,
        data: powerCurveData.map(event => [event.timestamp!.getTime(), event.refPower])
      });
    }

    return baseSeries;
  }, [powerCurveData, processedSeriesData, theme, hasRefPower]);

  const formatTooltip = useCallback((params: any) => {
    if (!Array.isArray(params) || params.length === 0) {
        return '';
    }

    const firstParam = params[0];
    const timestamp = firstParam.axisValue;
    const date = new Date(timestamp);

    const timeKey = getTimeBucketKey(date);
    const eventsAtTime = eventsByTimeBucket.get(timeKey) || [];

    const header = `<div class="${theme === 'dark' ? 'tooltip-dark' : 'tooltip-light'}">
                        <div class="tooltip-header">${format(date, 'MMM d, yyyy HH:mm:ss')}</div>
                        <div class="tooltip-body">`;
    
    let content = '<ul>';
    params.forEach((param: any) => {
        let value = Array.isArray(param.value) ? param.value[1] : param.value;
        value = typeof value === 'number' ? value.toFixed(2) : value;
        content += `<li>
                      <span class="tooltip-marker" style="background-color:${param.color};"></span>
                      <span>${param.seriesName}:</span>&nbsp;<strong>${value}</strong>
                    </li>`;
    });
    content += '</ul>';

    if (eventsAtTime.length > 0) {
        content += '<div class="tooltip-separator"></div><div class="tooltip-events-title">Events at this time:</div><ul>';
        eventsAtTime.forEach(event => {
            content += `<li><span class="tooltip-event-name">${event.name}</span>: <span class="tooltip-event-desc">${event.description}</span></li>`;
        });
        content += '</ul>';
    }

    const footer = `</div></div>`;
    return header + content + footer;
  }, [eventsByTimeBucket, theme]);

  const handleDataZoom = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      if (chartRef.current) {
        const echartsInstance = chartRef.current.getEchartsInstance();
        const newOption = echartsInstance.getOption();
        if (newOption && newOption.dataZoom && newOption.dataZoom.length > 0) {
          const newDateRange = {
            start: new Date(newOption.dataZoom[0].startValue),
            end: new Date(newOption.dataZoom[0].endValue),
          };
          setDateRange(newDateRange);
        }
      }
    }, 500);
  }, [setDateRange]);

  const handleLegendSelectChanged = useCallback((e: any) => setLegendSelected(e.selected), [setLegendSelected]);

  const handleBrushSelected = useCallback((params: any) => {
    const areas = params.areas;
    if (areas && areas.length > 0) {
      const coordRange = areas[0].coordRange;
      if (coordRange && coordRange.length > 0) {
        const start = Math.floor(coordRange[0]);
        const end = Math.floor(coordRange[1]);
        setNewCommentSelection({ start, end });
        return;
      }
    }
    setNewCommentSelection(null);
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
      tooltip: { trigger: 'axis', formatter: formatTooltip, axisPointer: { type: 'cross', animation: false, label: { backgroundColor: '#505765' } }, backgroundColor: 'transparent', borderColor: 'transparent', textStyle: { color: theme === 'dark' ? '#f9fafb' : '#1f2937' }, extraCssText: 'box-shadow: none;' },
      legend: { data: legendData, selected: legendSelected, textStyle: { color: theme === 'dark' ? '#f9fafb' : '#1f2937' } },
      grid: { left: '5%', right: '5%', bottom: '15%', containLabel: true },
      xAxis: { type: 'time', axisLine: { lineStyle: { color: theme === 'dark' ? '#4b5563' : '#e5e7eb' } }, axisLabel: { color: theme === 'dark' ? '#f9fafb' : '#1f2937' } },
      yAxis: [
        {
          type: 'value',
          name: 'Power (kW)',
          min: 0,
          nameTextStyle: { color: theme === 'dark' ? '#f9fafb' : '#1f2937' },
          axisLine: { lineStyle: { color: theme === 'dark' ? '#4b5563' : '#e5e7eb' } },
          axisLabel: { color: theme === 'dark' ? '#f9fafb' : '#1f2937' },
          splitLine: { lineStyle: { color: [theme === 'dark' ? '#333333' : '#e5e7eb'] } }
        },
        {
          type: 'value',
          name: 'Wind Speed (m/s)',
          min: 0,
          nameTextStyle: { color: theme === 'dark' ? '#f9fafb' : '#1f2937' },
          axisLine: { lineStyle: { color: theme === 'dark' ? '#4b5563' : '#e5e7eb' } },
          axisLabel: { color: theme === 'dark' ? '#f9fafb' : '#1f2937' },
          splitLine: { show: false }
        }
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