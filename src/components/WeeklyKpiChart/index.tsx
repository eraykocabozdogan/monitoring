import React, { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { useAppStore } from '../../store/useAppStore';
import { calculateWeeklyMetrics } from '../../utils/kpiAggregator';
import styles from './WeeklyKpiChart.module.css';

type KpiType = 'ao' | 'at' | 'reliability';

const WeeklyKpiChart: React.FC = () => {
  const { lightweightLogEvents, dateRange, theme } = useAppStore();
  const [selectedKpi, setSelectedKpi] = useState<KpiType>('ao');

  const weeklyData = useMemo(() => {
    if (!lightweightLogEvents || lightweightLogEvents.length === 0 || !dateRange.start || !dateRange.end) {
      return null;
    }
    return calculateWeeklyMetrics(lightweightLogEvents, { start: dateRange.start, end: dateRange.end });
  }, [lightweightLogEvents, dateRange]);

  const kpiDetails = {
    ao: { title: 'Weekly Operational Availability (Ao)', data: weeklyData?.aoData, name: 'Availability (%)' },
    at: { title: 'Weekly Technical Availability (At)', data: weeklyData?.atData, name: 'Availability (%)' },
    reliability: { title: 'Weekly Reliability (R)', data: weeklyData?.reliabilityData, name: 'Reliability (%)' },
  };

  const currentKpi = kpiDetails[selectedKpi];

  const option = {
    title: {
      text: currentKpi.title,
      left: 'center',
      textStyle: { color: theme === 'dark' ? '#f9fafb' : '#1f2937' },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
            formatter: (params: { value: number }) => `${currentKpi.name}: ${params.value.toFixed(2)}`,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: weeklyData?.labels || [],
      axisLine: { lineStyle: { color: theme === 'dark' ? '#4b5563' : '#e5e7eb' } },
      axisLabel: { color: theme === 'dark' ? '#f9fafb' : '#1f2937' },
    },
    yAxis: {
      type: 'value',
      name: currentKpi.name,
      min: 0,
      max: 100,
      nameTextStyle: { color: theme === 'dark' ? '#f9fafb' : '#1f2937' },
      axisLine: { lineStyle: { color: theme === 'dark' ? '#4b5563' : '#e5e7eb' } },
      axisLabel: { color: theme === 'dark' ? '#f9fafb' : '#1f2937', formatter: '{value}%' },
      splitLine: { lineStyle: { color: theme === 'dark' ? '#4b5563' : '#e5e7eb' } },
    },
    series: [
      {
        name: currentKpi.title,
        type: 'bar',
        barWidth: '60%',
        data: currentKpi.data || [],
        itemStyle: {
          color: theme === 'dark' ? '#3b82f6' : '#2563eb',
        },
      },
    ],
  };

  if (!weeklyData || weeklyData.labels.length === 0) {
     return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
         Weekly KPI Chart requires Event Log data.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.buttonGroup}>
        <button onClick={() => setSelectedKpi('ao')} className={selectedKpi === 'ao' ? styles.active : ''}>Ao</button>
        <button onClick={() => setSelectedKpi('at')} className={selectedKpi === 'at' ? styles.active : ''}>At</button>
        <button onClick={() => setSelectedKpi('reliability')} className={selectedKpi === 'reliability' ? styles.active : ''}>Reliability</button>
      </div>
      <div className={styles.chartArea}>
        <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
      </div>
    </div>
  );
};

export default WeeklyKpiChart;