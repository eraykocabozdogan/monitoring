import React, { useRef, useMemo, useCallback, memo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useAppStore } from '../../store/useAppStore';
import { aggregateChartData } from '../../utils/chartUtils';
import { createChartSeries } from '../../utils/chartSeriesUtils';
import { useChartTimestamp } from '../../hooks/useChartTimestamp';
import { useChartPinLogic } from '../../hooks/useChartPinLogic';
import { useTooltipFormatter } from '../../hooks/useTooltipFormatter';
import { useProcessedSeriesData } from '../../hooks/useProcessedSeriesData';
import { useDebouncedClickHandler } from '../../hooks/useDebouncedClickHandler';
import ChartControls from './ChartControls';
import ChartSidebar from './ChartSidebar';
import styles from './DataChart.module.css';

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

  // Custom hooks
  const {
    exactDisplayedTimestamp,
    currentAxisPointerTimestamp,
    lastTooltipTimestamp,
    updateTimestamps,
    findStableTimestamp,
  } = useChartTimestamp(powerCurveData);

  const { createChartPin, generateId } = useChartPinLogic(powerCurveData);
  const { formatTooltip } = useTooltipFormatter(logEvents, powerCurveData, theme);
  const processedSeriesData = useProcessedSeriesData(logEvents, powerCurveData);

  const { handleChartClick } = useDebouncedClickHandler({
    chartMode,
    pendingInterval,
    dateRange,
    exactDisplayedTimestamp,
    currentAxisPointerTimestamp,
    lastTooltipTimestamp,
    findStableTimestamp,
    setSelectedChartTimestamp,
    addChartPin,
    addChartInterval,
    setPendingInterval,
    createChartPin,
    generateId,
  });

  // Memoized calculations
  const hasRefPower = useMemo(() =>
    powerCurveData.length > 0 && powerCurveData.some(p => p.refPower > 0),
    [powerCurveData]
  );

  const displayData = useMemo(() => 
    aggregateChartData(powerCurveData, dateRange), 
    [powerCurveData, dateRange]
  );

  const series = useMemo(() => 
    createChartSeries(
      displayData,
      processedSeriesData,
      hasRefPower,
      theme,
      chartPins,
      chartIntervals,
      pendingInterval
    ), 
    [displayData, processedSeriesData, hasRefPower, theme, chartPins, chartIntervals, pendingInterval]
  );

  // Event handlers
  const handleDataZoom = useCallback(() => {
    const timer = setTimeout(() => {
      if (chartRef.current) {
        const echartsInstance = chartRef.current.getEchartsInstance();
        const newOption = echartsInstance.getOption();
        const dataZoomArray = newOption.dataZoom as { startValue?: number; endValue?: number }[];
        if (dataZoomArray && Array.isArray(dataZoomArray) && dataZoomArray.length > 0) {
          const { startValue, endValue } = dataZoomArray[0];
          if (startValue != null && endValue != null && 
              (dateRange.start?.getTime() !== startValue || dateRange.end?.getTime() !== endValue)) {
            setDateRange({ start: new Date(startValue), end: new Date(endValue) });
          }
        }
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [dateRange, setDateRange]);

  const handleLegendSelectChanged = useCallback((e: { selected: Record<string, boolean> }) => 
    setLegendSelected(e.selected), [setLegendSelected]);

  const handleAxisPointer = useCallback((params: { offsetX?: number; offsetY?: number }) => {
    if (params && typeof params.offsetX === 'number' && chartRef.current) {
      try {
        const echartsInstance = chartRef.current.getEchartsInstance();
        const pointInGrid = echartsInstance.convertFromPixel('grid', [params.offsetX, params.offsetY || 0]);
        if (pointInGrid?.[0]) {
          const timestamp = new Date(pointInGrid[0]);
          updateTimestamps(timestamp);
        }
      } catch (error) {
        // Ignore conversion errors
      }
    }
  }, [updateTimestamps]);

  const onEvents = useMemo(() => ({
    datazoom: handleDataZoom,
    legendselectchanged: handleLegendSelectChanged,
    click: (params: unknown) => handleChartClick(params, chartRef as React.RefObject<{ getEchartsInstance: () => unknown }>),
    mousemove: handleAxisPointer,
  }), [handleDataZoom, handleLegendSelectChanged, handleChartClick, handleAxisPointer]);

  // Chart option configuration
  const option = useMemo(() => {
    const legendData = ['Power (kW)', 'Wind Speed (m/s)', 'Fault', 'Safety Critical Fault'];
    if (hasRefPower) {
      legendData.splice(1, 0, 'Expected Power (kW)');
    }

    return {
      tooltip: {
        trigger: 'axis',
        formatter: formatTooltip,
        axisPointer: {
          type: 'none',
          animation: false,
          snap: false,
          triggerTooltip: true,
          axis: 'x',
          handle: { show: false },
          label: { show: false },
          lineStyle: { opacity: 0 }
        },
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        textStyle: { color: theme === 'dark' ? '#f9fafb' : '#1f293b' },
        extraCssText: 'box-shadow: none;',
        confine: true,
        enterable: false,
        showContent: true,
        alwaysShowContent: false,
        triggerOn: 'mousemove',
        position: (point: number[]) => [point[0] + 10, point[1] - 10],
        appendToBody: false,
        hideDelay: 0,
        transitionDuration: 0
      },
      legend: {
        data: legendData,
        selected: legendSelected,
        textStyle: { color: theme === 'dark' ? '#f9fafb' : '#1f293b' }
      },
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
          triggerEvent: true,
          axisPointer: { snap: false, triggerTooltip: false }
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
      series,
      animation: false,
      hoverLayerThreshold: 2,
      useUTC: false
    };
  }, [dateRange, legendSelected, series, formatTooltip, theme, hasRefPower]);

  // Handle manual chart clicks for pin/interval modes
  const handleManualChartClick = useCallback((e: React.MouseEvent) => {
    if (chartMode === 'normal') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Use exact displayed timestamp if available
    if (exactDisplayedTimestamp.current) {
      handleChartClick({
        event: { offsetX: mouseX, offsetY: mouseY },
        data: null,
        value: null,
        manualTrigger: true,
        calculatedTimestamp: exactDisplayedTimestamp.current
      }, chartRef as React.RefObject<{ getEchartsInstance: () => unknown }>);
    }
  }, [chartMode, handleChartClick, exactDisplayedTimestamp]);

  if (powerCurveData.length === 0) {
    return (
      <div className={`${styles.container} ${styles.emptyState}`}>
        Please upload a Power Curve or Event Log file to see the chart.
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Data Chart</h3>
        <ChartControls
          chartMode={chartMode}
          pendingInterval={pendingInterval}
          chartPins={chartPins}
          chartIntervals={chartIntervals}
          onModeChange={setChartMode}
          onClearSelections={clearChartSelections}
        />
      </div>

      <div className={styles.mainContent}>
        <div 
          className={styles.chartWrapper}
          onClick={handleManualChartClick}
        >
          <ReactECharts
            key={`${theme}-${hasRefPower}`}
            ref={chartRef}
            option={option}
            style={{ height: '100%', width: '100%' }}
            onEvents={onEvents}
            notMerge={false}
            lazyUpdate={false}
            opts={{ renderer: 'canvas' }}
          />
        </div>

        <ChartSidebar
          chartPins={chartPins}
          chartIntervals={chartIntervals}
          onRemovePin={removeChartPin}
          onRemoveInterval={removeChartInterval}
        />
      </div>
    </div>
  );
};

export default memo(DataChart);