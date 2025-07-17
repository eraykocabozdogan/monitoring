import React, { useRef, useMemo, useCallback, memo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useAppStore } from '../../store/useAppStore.js';
import { format, addMinutes, subMinutes } from 'date-fns';
import type { PowerCurvePoint, TurbineEvent } from '../../types/index.js';

const DataChart: React.FC = () => {
  const {
    powerCurveData,
    logEvents,
    dateRange,
    setDateRange,
    legendSelected,
    setLegendSelected,
  } = useAppStore();

  const chartRef = useRef<any>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Olayları grafik üzerinde göstermek için veriyi hazırla
  const chartEvents = useMemo(() => {
    // EĞER GÜÇ VERİSİ YOKSA, olayları grafiğe yerleştiremeyiz.
    // Bu kontrol, reduce hatasını engeller.
    if (powerCurveData.length === 0 || logEvents.length === 0) {
      return [];
    }

    const activeFilters = ['fault', 'safety critical fault'];

    return logEvents
      .filter(log => log.eventType && activeFilters.includes(log.eventType.toLowerCase().trim()))
      .map(log => {
        // powerCurveData'nın dolu olduğu garanti edildiği için reduce artık güvenli.
        const closestPowerPoint = powerCurveData.reduce((prev, curr) =>
          Math.abs(curr.timestamp!.getTime() - log.timestamp!.getTime()) < Math.abs(prev.timestamp!.getTime() - log.timestamp!.getTime()) ? curr : prev,
        );
        return {
          value: [log.timestamp!.getTime(), closestPowerPoint.power],
          rawData: log,
        };
      });
  }, [logEvents, powerCurveData]);

  // ECharts serilerini oluştur
  const series = useMemo(() => {
    const baseSeries = [
      // Değişiklik burada: type 'scatter' -> 'line' ve çizgi kalınlığı inceltildi.
      { name: 'Power (kW)', type: 'line', showSymbol: false, lineStyle: { width: 1 }, data: powerCurveData.map(event => [event.timestamp!.getTime(), event.power]) },
      { name: 'Expected Power (kW)', type: 'line', showSymbol: false, lineStyle: { width: 1 }, data: powerCurveData.map(event => [event.timestamp!.getTime(), event.refPower]) },
      { name: 'Wind Speed (m/s)', type: 'line', yAxisIndex: 1, showSymbol: false, lineStyle: { width: 1 }, data: powerCurveData.map(event => [event.timestamp!.getTime(), event.windSpeed]) },
    ];

    if (chartEvents.length > 0) {
      baseSeries.push({
        name: 'Critical Events',
        type: 'scatter',
        symbolSize: 8,
        itemStyle: { color: '#ef4444' },
        data: chartEvents,
        zlevel: 10,
      });
    }
    return baseSeries;
  }, [powerCurveData, chartEvents]);

  // Tooltip formatlayıcısı
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

  const onEvents = useMemo(() => ({
    datazoom: handleDataZoom,
    legendselectchanged: handleLegendSelectChanged,
  }), [handleDataZoom, handleLegendSelectChanged]);

  const option = useMemo(() => ({
    tooltip: { trigger: 'axis', formatter: formatTooltip, axisPointer: { type: 'cross', animation: false, label: { backgroundColor: '#505765' } } },
    legend: { data: Object.keys(legendSelected), selected: legendSelected },
    grid: { left: '5%', right: '5%', bottom: '15%', containLabel: true },
    xAxis: { type: 'time' },
    yAxis: [{ type: 'value', name: 'Power (kW)' }, { type: 'value', name: 'Wind Speed (m/s)', position: 'right' }],
    dataZoom: [{ type: 'inside', startValue: dateRange?.start?.getTime(), endValue: dateRange?.end?.getTime() }, { type: 'slider', startValue: dateRange?.start?.getTime(), endValue: dateRange?.end?.getTime() }],
    series: series,
    animation: false,
  }), [dateRange, legendSelected, series, formatTooltip]);

  if (powerCurveData.length === 0) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '450px', backgroundColor: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', color: '#888' }}>Grafiği görmek için lütfen bir Power Curve dosyası yükleyin.</div>;
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