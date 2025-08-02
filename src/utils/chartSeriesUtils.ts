import type { PowerCurvePoint, ChartPin, ChartInterval, TurbineEvent } from '../types';
import { getChartColors } from './chartUtils';

interface SeriesData {
  faultEvents: Array<{ value: [number, number]; rawData: TurbineEvent }>;
  safetyCriticalFaultEvents: Array<{ value: [number, number]; rawData: TurbineEvent }>;
}

export const createChartSeries = (
  displayData: PowerCurvePoint[],
  processedSeriesData: SeriesData,
  hasRefPower: boolean,
  theme: 'light' | 'dark',
  chartPins: ChartPin[],
  chartIntervals: ChartInterval[],
  pendingInterval: { startTimestamp: Date } | null
) => {
  const colors = getChartColors(theme);

  const baseSeries = [
    {
      name: 'Power (kW)',
      type: 'bar',
      barMaxWidth: 30,
      barGap: '-100%',
      itemStyle: { opacity: 0.9, color: colors.power },
      z: 3,
      triggerEvent: true,
      data: displayData.map(event => [event.timestamp!.getTime(), event.power]),
      xAxisIndex: 0,
      yAxisIndex: 0,
      triggerLineEvent: false,
      hoverAnimation: false,
      silent: false,
      cursor: 'default'
    },
    {
      name: 'Wind Speed (m/s)',
      type: 'line',
      yAxisIndex: 1,
      xAxisIndex: 0,
      showSymbol: false,
      lineStyle: { width: 1.5, color: colors.windLine, opacity: 0.75 },
      areaStyle: { color: colors.windArea, opacity: 0.5 },
      itemStyle: { opacity: 1 },
      z: 1,
      triggerEvent: true,
      data: displayData.map(event => [event.timestamp!.getTime(), event.windSpeed]),
      triggerLineEvent: false,
      hoverAnimation: false,
      silent: false,
      cursor: 'default'
    },
    {
      name: 'Fault',
      type: 'scatter',
      symbol: 'diamond',
      symbolSize: 9,
      itemStyle: { color: colors.fault, opacity: 1 },
      triggerEvent: true,
      data: processedSeriesData.faultEvents,
      zlevel: 10,
      xAxisIndex: 0,
      yAxisIndex: 0,
      triggerLineEvent: false,
      hoverAnimation: false,
      silent: false,
      emphasis: { disabled: true },
      cursor: 'default'
    },
    {
      name: 'Safety Critical Fault',
      type: 'scatter',
      symbol: 'triangle',
      symbolSize: 9,
      itemStyle: { color: colors.criticalFault, opacity: 1 },
      triggerEvent: true,
      data: processedSeriesData.safetyCriticalFaultEvents,
      zlevel: 11,
      xAxisIndex: 0,
      yAxisIndex: 0,
      triggerLineEvent: false,
      hoverAnimation: false,
      silent: false,
      emphasis: { disabled: true },
      cursor: 'default'
    }
  ];

  if (hasRefPower) {
    baseSeries.splice(1, 0, {
      name: 'Expected Power (kW)',
      type: 'bar',
      barMaxWidth: 30,
      barGap: '-100%',
      itemStyle: { opacity: 0.9, color: colors.refPower },
      z: 2,
      triggerEvent: true,
      data: displayData.map(event => [event.timestamp!.getTime(), event.refPower]),
      xAxisIndex: 0,
      yAxisIndex: 0,
      triggerLineEvent: false,
      hoverAnimation: false,
      silent: false,
      cursor: 'default'
    });
  }

  // Add slider series for pins and intervals
  const sliderSeries = [];

  if (chartPins.length > 0 || pendingInterval) {
    const pinData = [];
    
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

  if (chartIntervals.length > 0) {
    const intervalData: unknown[] = [];
    
    chartIntervals.forEach(interval => {
      intervalData.push({
        value: [interval.startTimestamp.getTime(), 0.5],
      });
      intervalData.push({
        value: [interval.endTimestamp.getTime(), 0.5],
      });
      intervalData.push({
        value: [null, null],
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

  return [...baseSeries, ...sliderSeries];
};
