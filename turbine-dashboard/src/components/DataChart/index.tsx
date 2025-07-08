import ReactECharts from 'echarts-for-react';
import { useAppStore } from '../../store/useAppStore';

const DataChart = () => {
  const allEvents = useAppStore((state) => state.allEvents);

  if (allEvents.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px',
        color: '#666',
        fontSize: '16px',
        border: '2px dashed #ccc',
        borderRadius: '8px',
        margin: '20px 0'
      }}>
        Please upload a CSV file to see the chart.
      </div>
    );
  }

  // Prepare data for the chart
  const powerData = allEvents.map(event => [
    event.timestamp.getTime(),
    event.power
  ]);

  const expectedPowerData = allEvents.map(event => [
    event.timestamp.getTime(),
    event.power // Using power as placeholder for expected power
  ]);

  const windSpeedData = allEvents.map(event => [
    event.timestamp.getTime(),
    event.windSpeed
  ]);

  const option = {
    title: {
      text: 'Rüzgar Türbini Veri Analizi',
      left: 'center',
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      },
      formatter: (params: any) => {
        const date = new Date(params[0].value[0]).toLocaleString('tr-TR');
        let result = `<strong>${date}</strong><br/>`;
        params.forEach((param: any) => {
          result += `${param.seriesName}: ${param.value[1]}<br/>`;
        });
        return result;
      }
    },
    legend: {
      data: ['Power (kW)', 'Expected Power (kW)', 'Wind Speed (m/s)'],
      top: 35
    },
    grid: {
      left: '3%',
      right: '10%',
      bottom: '10%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'time',
      name: 'Zaman',
      nameLocation: 'middle',
      nameGap: 30,
      axisLabel: {
        formatter: (value: number) => {
          return new Date(value).toLocaleDateString('tr-TR');
        }
      }
    },
    yAxis: [
      {
        type: 'value',
        name: 'Güç (kW)',
        nameLocation: 'middle',
        nameGap: 50,
        position: 'left',
        axisLabel: {
          formatter: '{value} kW'
        }
      },
      {
        type: 'value',
        name: 'Rüzgar Hızı (m/s)',
        nameLocation: 'middle',
        nameGap: 50,
        position: 'right',
        axisLabel: {
          formatter: '{value} m/s'
        }
      }
    ],
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: 0,
        filterMode: 'none'
      },
      {
        type: 'slider',
        xAxisIndex: 0,
        filterMode: 'none',
        bottom: 20
      }
    ],
    series: [
      {
        name: 'Power (kW)',
        type: 'line',
        yAxisIndex: 0,
        data: powerData,
        lineStyle: {
          color: '#1f77b4',
          width: 2
        },
        symbol: 'none',
        smooth: true
      },
      {
        name: 'Expected Power (kW)',
        type: 'line',
        yAxisIndex: 0,
        data: expectedPowerData,
        lineStyle: {
          color: '#ff7f0e',
          width: 2,
          type: 'dashed'
        },
        symbol: 'none',
        smooth: true
      },
      {
        name: 'Wind Speed (m/s)',
        type: 'line',
        yAxisIndex: 1,
        data: windSpeedData,
        lineStyle: {
          color: '#2ca02c',
          width: 2
        },
        symbol: 'none',
        smooth: true
      }
    ]
  };

  return (
    <div style={{ margin: '20px 0' }}>
      <ReactECharts
        option={option}
        style={{ height: '500px', width: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  );
};

export default DataChart;
