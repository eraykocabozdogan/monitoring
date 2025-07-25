import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useAppStore } from '../../store/useAppStore';
import styles from './FaultDistributionChart.module.css';

const FaultDistributionChart: React.FC = () => {
  const { logEvents, theme, dateRange } = useAppStore();

  const chartData = useMemo(() => {
    const categoryCounts = new Map<string, number>();

    // Artık dateRange'e göre filtreleme yapıyoruz
    const filteredLogs = logEvents.filter(log => {
      if (!log.status || log.status !== 'ON' || !log.category || log.category === 'No Fault' || !log.timestamp) {
        return false;
      }
      // Zaman damgasının seçili aralıkta olup olmadığını kontrol et
      if (dateRange.start && dateRange.end) {
        return log.timestamp >= dateRange.start && log.timestamp <= dateRange.end;
      }
      return true; // Eğer dateRange seçilmemişse tümünü al
    });

    filteredLogs.forEach(log => {
      const category = log.category || 'Unknown';
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    });

    return Array.from(categoryCounts.entries()).map(([name, value]) => ({ name, value }));
  }, [logEvents, dateRange]); // Bağımlılığa dateRange eklendi

  const option = {
    title: {
      text: 'Fault Distribution by Category',
      subtext: 'Based on selected date range',
      left: 'center',
      textStyle: {
        color: theme === 'dark' ? '#f9fafb' : '#1f2937',
      },
      subtextStyle: {
        color: theme === 'dark' ? '#9ca3af' : '#6b7280',
      },
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 10,
      top: 'middle',
      data: chartData.map(d => d.name),
      textStyle: {
        color: theme === 'dark' ? '#f9fafb' : '#1f2937',
      },
    },
    series: [
      {
        name: 'Fault Category',
        type: 'pie',
        radius: ['50%', '70%'],
        center: ['65%', '55%'],
        avoidLabelOverlap: false,
        label: { show: false, position: 'center' },
        emphasis: { label: { show: true, fontSize: '20', fontWeight: 'bold' } },
        labelLine: { show: false },
        data: chartData,
      },
    ],
  };
  
  if (logEvents.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          Fault distribution için Event Log verisi gereklidir.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
       <div className={styles.chartArea}>
         {chartData.length > 0 ? (
            <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
         ) : (
            <div className={styles.emptyState}>No fault data for selected period.</div>
         )}
      </div>
    </div>
  );
};

export default FaultDistributionChart;