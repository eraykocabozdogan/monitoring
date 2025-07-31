import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useAppStore } from '../../store/useAppStore';
import { useFilteredPowerCurveData } from '../../hooks/useFilteredPowerCurveData';
import styles from './PerformanceScatterChart.module.css';

const PerformanceScatterChart: React.FC = () => {
  const { theme, powerCurveData: allPowerCurveData } = useAppStore();
  const filteredPowerCurveData = useFilteredPowerCurveData();

  const option = {
    title: {
      text: 'Power Curve Performance',
      left: 'center',
      textStyle: {
        color: theme === 'dark' ? '#f9fafb' : '#1f2937',
      },
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: { value: number[] }) => `Wind: ${params.value[0].toFixed(2)} m/s<br/>Power: ${params.value[1].toFixed(2)} kW`,
    },
    grid: {
      left: '3%',
      right: '7%',
      bottom: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      name: 'Wind Speed (m/s)',
      nameLocation: 'middle',
      nameGap: 40,
      nameTextStyle: { color: theme === 'dark' ? '#f9fafb' : '#1f2937' },
      axisLine: { lineStyle: { color: theme === 'dark' ? '#4b5563' : '#e5e7eb' } },
      axisLabel: { color: theme === 'dark' ? '#f9fafb' : '#1f2937' },
    },
    yAxis: {
      type: 'value',
      name: 'Power (kW)',
      min: 0,
      nameTextStyle: { color: theme === 'dark' ? '#f9fafb' : '#1f2937' },
      axisLine: { lineStyle: { color: theme === 'dark' ? '#4b5563' : '#e5e7eb' } },
      axisLabel: { color: theme === 'dark' ? '#f9fafb' : '#1f2937' },
      splitLine: { lineStyle: { color: theme === 'dark' ? '#4b5563' : '#e5e7eb' } },
    },
    series: [
      {
        name: 'Actual Performance',
        type: 'scatter',
        symbolSize: 3,
        data: filteredPowerCurveData.map(p => [p.windSpeed, p.power]),
        itemStyle: {
          color: theme === 'dark' ? '#3b82f6' : '#2563eb',
          opacity: 0.5
        },
      },
      {
        name: 'Reference Curve',
        type: 'line',
        data: [...allPowerCurveData].sort((a,b) => a.windSpeed - b.windSpeed).map(p => [p.windSpeed, p.refPower]),
        smooth: true,
        showSymbol: false,
        lineStyle: {
          color: theme === 'dark' ? '#f97316' : '#ea580c',
          width: 2,
          type: 'dashed'
        },
      },
    ],
  };

  if (filteredPowerCurveData.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          Performance Scatter Chart requires Power Curve data for the selected date range.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
    </div>
  );
};

export default PerformanceScatterChart;