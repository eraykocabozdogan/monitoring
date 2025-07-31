import React, { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { useAppStore } from '../../store/useAppStore';
import { calculateWeeklyMetrics } from '../../utils/kpiAggregator';
import { startOfWeek, endOfWeek, eachWeekOfInterval } from 'date-fns';
import styles from './WeeklyKpiChart.module.css';

type KpiType = 'ao' | 'at' | 'reliability';

const WeeklyKpiChart: React.FC = () => {
  const { lightweightLogEvents, dateRange, theme, metrics, setDateRange } = useAppStore();
  const [selectedKpi, setSelectedKpi] = useState<KpiType>('ao');

  const weeklyData = useMemo(() => {
    if (!lightweightLogEvents || lightweightLogEvents.length === 0 || !dateRange.start || !dateRange.end) {
      return null;
    }
    return calculateWeeklyMetrics(lightweightLogEvents, { start: dateRange.start, end: dateRange.end });
  }, [lightweightLogEvents, dateRange]);

  const kpiDetails = {
    ao: { 
      title: 'Weekly Operational Availability (Ao)', 
      data: weeklyData?.aoData, 
      name: 'Availability (%)',
      targetValue: metrics.operationalAvailability
    },
    at: { 
      title: 'Weekly Technical Availability (At)', 
      data: weeklyData?.atData, 
      name: 'Availability (%)',
      targetValue: metrics.technicalAvailability
    },
    reliability: { 
      title: 'Weekly Reliability (R)', 
      data: weeklyData?.reliabilityData, 
      name: 'Reliability (%)',
      targetValue: metrics.reliabilityR
    },
  };

  const currentKpi = kpiDetails[selectedKpi];

  // Handle chart click to update date range to selected week
  const handleChartClick = (params: any) => {
    if (params.componentType === 'series' && params.seriesType === 'bar' && weeklyData && weeklyData.labels[params.dataIndex]) {
      const weekIndex = params.dataIndex;
      
      // Get all weeks in the current date range
      const weeks = eachWeekOfInterval(
        { start: dateRange.start!, end: dateRange.end! },
        { weekStartsOn: 1 }
      );
      
      if (weeks[weekIndex]) {
        const weekStart = startOfWeek(weeks[weekIndex], { weekStartsOn: 1 });
        const weekEnd = endOfWeek(weeks[weekIndex], { weekStartsOn: 1 });
        
        // Ensure we don't go beyond the original date range
        const effectiveStart = new Date(Math.max(dateRange.start!.getTime(), weekStart.getTime()));
        const effectiveEnd = new Date(Math.min(dateRange.end!.getTime(), weekEnd.getTime()));
        
        setDateRange({ start: effectiveStart, end: effectiveEnd });
      }
    }
  };

  const option = {
    title: {
      text: currentKpi.title,
      left: 'center',
      textStyle: { color: theme === 'dark' ? '#f9fafb' : '#1f2937' },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      // DÜZELTME: 'params' artık bir dizi olarak doğru şekilde işleniyor.
      formatter: (params: any[]) => {
        const barData = params.find(p => p.seriesType === 'bar');
        const lineData = params.find(p => p.seriesType === 'line');
        let tooltip = `${barData.name}<br/>`;
        tooltip += `${currentKpi.name}: ${barData.value.toFixed(2)}%<br/>`;
        if (lineData) {
          tooltip += `Target Average: ${lineData.value.toFixed(2)}%<br/>`;
          const difference = barData.value - lineData.value;
          tooltip += `Difference: ${difference > 0 ? '+' : ''}${difference.toFixed(2)}%<br/>`;
        }
        tooltip += '<br/><small>Click bar to filter to this week</small>';
        return tooltip;
      },
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
      // Hedef çizgisi - genel ortalama
      {
        name: 'Target Average',
        type: 'line',
        data: weeklyData?.labels.map(() => currentKpi.targetValue) || [],
        lineStyle: {
          color: theme === 'dark' ? '#ef4444' : '#dc2626',
          type: 'dashed',
          width: 2,
        },
        symbol: 'none',
        itemStyle: {
          color: theme === 'dark' ? '#ef4444' : '#dc2626',
        },
        emphasis: {
          disabled: true, // Disable hover effects on target line
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
        <ReactECharts 
          option={option} 
          style={{ height: '100%', width: '100%' }} 
          notMerge={true}
          onEvents={{
            click: handleChartClick
          }}
        />
      </div>
    </div>
  );
};

export default WeeklyKpiChart;