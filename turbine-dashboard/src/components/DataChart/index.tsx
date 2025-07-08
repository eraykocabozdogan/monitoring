import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useAppStore } from '../../store/useAppStore';
import styles from './DataChart.module.css';

const DataChart: React.FC = () => {
  const { allEvents } = useAppStore();

  if (!allEvents || allEvents.length === 0) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Time Series Data</h2>
        <div className={styles.emptyState}>
          Please upload a CSV file to see the chart.
        </div>
      </div>
    );
  }

  // Hata düzeltmesi: Geçersiz timestamp'e sahip verileri filtrele
  const validEvents = allEvents.filter(
    (event) => event.timestamp instanceof Date && !isNaN(event.timestamp.getTime())
  );

  // Filtreleme sonrası veri kalmadıysa kullanıcıyı bilgilendir
  if (validEvents.length === 0) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Time Series Data</h2>
        <div className={styles.emptyState}>
          No valid data with dates found in the CSV file to display.
        </div>
      </div>
    );
  }

  const option = {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['Power (kW)', 'Expected Power (kW)', 'Wind Speed (m/s)'],
      textStyle: {
        color: '#ccc'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%', // Alttaki slider için boşluk bırak
      containLabel: true
    },
    xAxis: {
      type: 'time',
      boundaryGap: false,
    },
    yAxis: [
      {
        type: 'value',
        name: 'Power (kW)',
      },
      {
        type: 'value',
        name: 'Wind Speed (m/s)',
        position: 'right',
      }
    ],
    series: [
      {
        name: 'Power (kW)',
        type: 'line',
        showSymbol: false,
        data: validEvents.map(event => [event.timestamp, event.power])
      },
      {
        name: 'Expected Power (kW)',
        type: 'line',
        showSymbol: false,
        data: validEvents.map(event => [event.timestamp, event.power])
      },
      {
        name: 'Wind Speed (m/s)',
        type: 'line',
        yAxisIndex: 1, // Bu seriyi ikinci Y eksenine bağla
        showSymbol: false,
        data: validEvents.map(event => [event.timestamp, event.windSpeed])
      }
    ]
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Time Series Data</h2>
      <div className={styles.chartWrapper}>
        <ReactECharts
          option={option}
          // GRAFİĞİN GÖRÜNMESİNİ SAĞLAYAN KISIM
          style={{ height: '100%', width: '100%' }}
        />
      </div>
    </div>
  );
};

export default DataChart;