import React, { useRef, useMemo, useCallback, memo, useEffect } from 'react';
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
    newCommentSelection,
    setNewCommentSelection,
    theme,
  } = useAppStore();

  const chartRef = useRef<any>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!newCommentSelection && chartRef.current) {
      const echartsInstance = chartRef.current.getEchartsInstance();
      echartsInstance.dispatchAction({
        type: 'brush',
        areas: [],
      });
    }
  }, [newCommentSelection]);

  // ECharts serilerini oluştur (PERFORMANS OPTİMİZASYONU YAPILDI)
  const series = useMemo(() => {
    const colors = {
      power: theme === 'dark' ? '#3b82f6' : '#2563eb',
      wind: theme === 'dark' ? '#22c55e' : '#16a34a',
      refPower: theme === 'dark' ? '#6b7280' : '#9ca3af',
      fault: '#f97316',
      criticalFault: '#dc2626'
    };

    // --- PERFORMANS İYİLEŞTİRMESİ ---
    // Güç verilerini bir Map'e dönüştürerek anlık erişim sağlıyoruz.
    // Bu, her arıza için tüm güç verisi dizisini tarama (O(n*m)) ihtiyacını ortadan kaldırır.
    const powerMap = new Map<number, PowerCurvePoint>();
    powerCurveData.forEach(p => {
        if (p.timestamp) {
            powerMap.set(p.timestamp.getTime(), p);
        }
    });

    // En yakın güç noktasını bulmak için optimize edilmiş fonksiyon
    const getClosestPowerValue = (logTime: Date, powerData: PowerCurvePoint[]): number => {
        if (powerData.length === 0) return 0;
        const time = logTime.getTime();
        // Önce doğrudan eşleşme var mı diye kontrol et
        if (powerMap.has(time)) {
            return powerMap.get(time)!.power;
        }
        // Eğer doğrudan eşleşme yoksa, en yakınını bul (bu daha az sıklıkta çalışacak)
        const closestPoint = powerData.reduce((prev, curr) => 
            Math.abs(curr.timestamp!.getTime() - time) < Math.abs(prev.timestamp!.getTime() - time) ? curr : prev
        );
        return closestPoint.power;
    };
    
    const faultEvents = logEvents
      .filter(log => log.eventType?.toLowerCase().trim() === 'fault' && log.timestamp)
      .map(log => ({
          value: [log.timestamp!.getTime(), getClosestPowerValue(log.timestamp!, powerCurveData)],
          rawData: log,
      }));

    const safetyCriticalFaultEvents = logEvents
      .filter(log => log.eventType?.toLowerCase().trim() === 'safety critical fault' && log.timestamp)
      .map(log => ({
        value: [log.timestamp!.getTime(), getClosestPowerValue(log.timestamp!, powerCurveData)],
        rawData: log,
      }));

    const allSeries = [
      { 
        name: 'Power (kW)', type: 'line', showSymbol: false, 
        lineStyle: { width: 1.5, color: colors.power, opacity: 1 }, 
        itemStyle: { opacity: 0.66 }, z: 3,
        data: powerCurveData.map(event => [event.timestamp!.getTime(), event.power]) 
      },
      { 
        name: 'Wind Speed (m/s)', type: 'line', yAxisIndex: 1, showSymbol: false, 
        lineStyle: { width: 1.5, color: colors.wind, opacity: 0.66 },
        itemStyle: { opacity: 0.66 }, z: 2,
        data: powerCurveData.map(event => [event.timestamp!.getTime(), event.windSpeed]) 
      },
      { 
        name: 'Expected Power (kW)', type: 'line', showSymbol: false, 
        lineStyle: { width: 1, type: 'dashed', color: colors.refPower, opacity: 0.66 },
        itemStyle: { opacity: 0.66 }, z: 1,
        data: powerCurveData.map(event => [event.timestamp!.getTime(), event.refPower]) 
      },
      {
        name: 'Fault', type: 'scatter', symbol: 'triangle', symbolSize: 9,
        itemStyle: { color: colors.fault, opacity: 0.66 }, data: faultEvents, zlevel: 10,
      },
      {
        name: 'Safety Critical Fault', type: 'scatter', symbol: 'diamond', symbolSize: 11,
        itemStyle: { color: colors.criticalFault, opacity: 0.66 }, data: safetyCriticalFaultEvents, zlevel: 11,
      }
    ];

    return allSeries;
  }, [powerCurveData, logEvents, theme]);

  const formatTooltip = useCallback((params: any) => {
    const tooltipTheme = {
      backgroundColor: theme === 'dark' ? 'rgba(20, 20, 30, 0.9)' : 'rgba(255, 255, 255, 0.95)',
      textColor: theme === 'dark' ? '#f1f5f9' : '#1e293b',
      borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
    };

    const firstParam = params[0];
    if (!firstParam) return '';
    
    const baseStyle = `font-family: sans-serif; font-size: 14px; color: ${tooltipTheme.textColor}; border-radius: 6px; border: 1px solid ${tooltipTheme.borderColor}; background-color: ${tooltipTheme.backgroundColor}; padding: 10px; min-width: 250px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);`;
    const hrStyle = `border-color: ${tooltipTheme.borderColor}; margin: 6px 0;`;

    if (firstParam.seriesType === 'scatter') {
      const event = firstParam.data.rawData as TurbineEvent;
      return `<div style="${baseStyle}"><strong>Event: ${event.eventType}</strong><hr style="${hrStyle}"><strong>Timestamp:</strong> ${format(event.timestamp!, 'yyyy-MM-dd HH:mm:ss')}<br><strong>Description:</strong> ${event.description}</div>`;
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
    
    return `<div style="${baseStyle}"><strong>${format(hoverTime, 'yyyy-MM-dd HH:mm:ss')}</strong><br>Power: ${powerPoint.power.toFixed(2)} kW | Wind: ${powerPoint.windSpeed.toFixed(2)} m/s<hr style="${hrStyle}">${eventSummary}</div>`;
  }, [logEvents, powerCurveData, theme]);

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
    if (!areas || areas.length === 0) {
      setNewCommentSelection(null);
      return;
    }
    const area = areas[0];
    if (area && area.coordRange) {
      const [start, end] = area.coordRange;
      if (Math.abs(end - start) < 1000) {
        setNewCommentSelection({ start });
      } else {
        setNewCommentSelection({ start, end });
      }
    }
  }, [setNewCommentSelection]);

  const onEvents = useMemo(() => ({
    datazoom: handleDataZoom,
    legendselectchanged: handleLegendSelectChanged,
    brushselected: handleBrushSelected,
  }), [handleDataZoom, handleLegendSelectChanged, handleBrushSelected]);

  const option = useMemo(() => {
    const textColor = theme === 'dark' ? '#f9fafb' : '#1f2937';
    const axisLineColor = theme === 'dark' ? '#4b5563' : '#e5e7eb';
    return {
      tooltip: { trigger: 'axis', formatter: formatTooltip, axisPointer: { type: 'cross', animation: false, label: { backgroundColor: '#505765' } }, backgroundColor: 'transparent', borderColor: 'transparent', textStyle: { color: textColor }, extraCssText: 'box-shadow: none;' },
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
      brush: { toolbox: ['lineX', 'clear'], xAxisIndex: 'all', throttleType: 'debounce', throttleDelay: 500, },
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
        style={{ height: '100%', width: '100%' }}
        onEvents={onEvents}
        notMerge={true}
        lazyUpdate={true}
      />
    </div>
  );
};

export default memo(DataChart);