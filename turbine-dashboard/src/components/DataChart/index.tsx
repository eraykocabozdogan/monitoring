// eraykocabozdogan/monitoring/monitoring-38bccf512860c62033d3b011ac5cebf8720363f1/turbine-dashboard/src/components/DataChart/index.tsx

import React, { useRef, useMemo, useCallback, memo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useAppStore } from '../../store/useAppStore.js';
import { format } from 'date-fns';
import type { TurbineEvent } from '../../types/index.js';

const DataChart: React.FC = () => {
  const { allEvents, dateRange, setDateRange, legendSelected, setLegendSelected } = useAppStore();
  const chartRef = useRef<any>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const validEvents = useMemo(() => {
    if (!allEvents) return [];
    return allEvents.filter(event => event.timestamp instanceof Date && !isNaN(event.timestamp.getTime()));
  }, [allEvents]);

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
          if (startValue != null && endValue != null) {
            if (dateRange.start?.getTime() !== startValue || dateRange.end?.getTime() !== endValue) {
              setDateRange({ start: new Date(startValue), end: new Date(endValue) });
            }
          }
        }
      }
    }, 400);
  }, [dateRange, setDateRange]);

  const handleLegendSelectChanged = useCallback((e: any) => {
    setLegendSelected(e.selected);
  }, [setLegendSelected]);

  const onEvents = useMemo(() => ({
    datazoom: handleDataZoom,
    legendselectchanged: handleLegendSelectChanged,
  }), [handleDataZoom, handleLegendSelectChanged]);

  const option = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const dataPoint = params[0];
        const eventData = validEvents[dataPoint.dataIndex] as TurbineEvent;
        if (!eventData) return 'No data';
        return `
          <div style="font-family: sans-serif; font-size: 14px; color: #333;">
            <strong>Timestamp:</strong> ${format(eventData.timestamp!, 'yyyy-MM-dd HH:mm:ss')}<br/>
            <hr style="border-color: #eee; margin: 4px 0;">
            <strong>Power:</strong> ${eventData.power.toFixed(2)} kW<br/>
            <strong>Wind Speed:</strong> ${eventData.windSpeed.toFixed(2)} m/s<br/>
            <hr style="border-color: #eee; margin: 4px 0;">
            <strong>Description:</strong> ${eventData.description}<br/>
            <strong>Category:</strong> ${eventData.category}<br/>
            <strong>Event Type:</strong> ${eventData.eventType}<br/>
            <strong>Status:</strong> ${eventData.status}
          </div>
        `;
      }
    },
    legend: { 
      data: ['Power (kW)', 'Expected Power (kW)', 'Wind Speed (m/s)'], 
      textStyle: { color: '#333' },
      selected: legendSelected
    },
    grid: { left: '5%', right: '5%', bottom: '15%', containLabel: true },
    xAxis: { 
      type: 'time',
      axisLabel: {
        formatter: (value: number) => format(new Date(value), 'MMM yyyy')
      }
    },
    yAxis: [
      { type: 'value', name: 'Power (kW)' },
      { type: 'value', name: 'Wind Speed (m/s)', position: 'right' }
    ],
    dataZoom: [
      { type: 'inside', startValue: dateRange?.start?.getTime(), endValue: dateRange?.end?.getTime() },
      { type: 'slider', startValue: dateRange?.start?.getTime(), endValue: dateRange?.end?.getTime() }
    ],
    series: [
      { name: 'Power (kW)', type: 'line', showSymbol: false, data: validEvents.map(event => [event.timestamp, event.power]) },
      { name: 'Expected Power (kW)', type: 'line', showSymbol: false, data: validEvents.map(event => [event.timestamp, event.power]) },
      { name: 'Wind Speed (m/s)', type: 'line', yAxisIndex: 1, showSymbol: false, data: validEvents.map(event => [event.timestamp, event.windSpeed]) }
    ],
    animation: false, // Performansı artırmak için animasyonları kapatabiliriz
  }), [validEvents, dateRange, legendSelected]);

  if (validEvents.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>Please upload a CSV file to see the chart.</div>;
  }

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
      <ReactECharts
        ref={chartRef}
        option={option}
        style={{ height: '500px', width: '100%' }}
        onEvents={onEvents}
        notMerge={true}
        lazyUpdate={true}
      />
    </div>
  );
};

export default memo(DataChart);