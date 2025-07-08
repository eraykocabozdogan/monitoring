import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useAppStore } from '../../store/useAppStore';

const DataChart: React.FC = () => {
  const { allEvents } = useAppStore();

  // 1. Veri henüz yüklenmediyse bir mesaj göster
  if (!allEvents || allEvents.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
        Please upload a CSV file to see the chart.
      </div>
    );
  }

  // 2. HATA DÜZELTME: Grafik oluşturmadan önce geçersiz veya tanımsız timestamp'i olan verileri filtrele
  const validEvents = allEvents.filter(
    (event) => event.timestamp instanceof Date && !isNaN(event.timestamp.getTime())
  );

  // 3. ECharts için grafik konfigürasyonunu (option) oluştur
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      }
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
      bottom: '3%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'time',
        boundaryGap: false,
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: 'Power (kW)',
        position: 'left',
        axisLabel: {
          formatter: '{value} kW'
        }
      },
      {
        type: 'value',
        name: 'Wind Speed (m/s)',
        position: 'right',
        axisLabel: {
          formatter: '{value} m/s'
        }
      }
    ],
    series: [
      {
        name: 'Power (kW)',
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: validEvents.map(event => [event.timestamp, event.power])
      },
      {
        name: 'Expected Power (kW)',
        type: 'line',
        smooth: true,
        showSymbol: false,
        // Placeholder: Şimdilik gerçek güç verisini kullanıyoruz
        data: validEvents.map(event => [event.timestamp, event.power]) 
      },
      {
        name: 'Wind Speed (m/s)',
        type: 'line',
        yAxisIndex: 1, // Bu seriyi ikinci (sağdaki) y eksenine bağla
        smooth: true,
        showSymbol: false,
        data: validEvents.map(event => [event.timestamp, event.windSpeed])
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: '500px', width: '100%' }} />;
};

export default DataChart;