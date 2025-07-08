import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useAppStore } from '../../store/useAppStore';

const DataChart: React.FC = () => {
  const { allEvents } = useAppStore();

  if (!allEvents || allEvents.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
        Please upload a CSV file to see the chart.
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
      <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
        No valid data with dates found in the CSV file to display.
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
    <ReactECharts
      option={option}
      // GRAFİĞİN GÖRÜNMESİNİ SAĞLAYAN KISIM
      style={{ height: '500px', width: '100%' }}
    />
  );
};

export default DataChart;