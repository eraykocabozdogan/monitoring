import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useAppStore } from '../../store/useAppStore';
import { format } from 'date-fns'; // Tarih formatlamak için import ediyoruz

const DataChart: React.FC = () => {
  const { allEvents, dateRange, setDateRange } = useAppStore();

  if (!allEvents || allEvents.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>Please upload a CSV file to see the chart.</div>;
  }
  
  const validEvents = allEvents.filter(event => event.timestamp instanceof Date && !isNaN(event.timestamp.getTime()));
  
  if (validEvents.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>No valid data with dates found in the CSV file to display.</div>;
  }

  const handleChartEvents = {
    datazoom: (params: any) => {
      const startValue = params.batch[0].startValue;
      const endValue = params.batch[0].endValue;
      if (startValue != null && endValue != null) {
        setDateRange({ start: new Date(startValue), end: new Date(endValue) });
      }
    },
  };

  const option = {
    tooltip: {
      trigger: 'axis',
      // --- TOOLTIP ÖZELLEŞTİRME BAŞLANGICI ---
      formatter: (params: any) => {
        // params bir dizi, genellikle hepsi aynı noktayı gösterir. İlkini alıyoruz.
        const dataPoint = params[0];
        // Serinin veri noktasından, orijinal 'TurbineEvent' objemizi buluyoruz.
        // Bunun için 'dataIndex'i kullanarak ana veri dizimizden doğru olayı çekiyoruz.
        const eventData = validEvents[dataPoint.dataIndex];

        if (!eventData) return 'No data';

        // HTML olarak tooltip içeriğini oluşturuyoruz.
        return `
          <div style="font-family: sans-serif; font-size: 14px; color: #333;">
            <strong>Timestamp:</strong> ${format(eventData.timestamp!, 'yyyy-MM-dd HH:mm:ss')}<br/>
            <hr style="border-color: #eee; margin: 4px 0;">
            <strong>Power:</strong> ${eventData.power.toFixed(2)} kW<br/>
            <strong>Wind Speed:</strong> ${eventData.windSpeed.toFixed(2)} m/s<br/>
            <hr style="border-color: #eee; margin: 4px 0;">
            <strong>Description:</strong> ${eventData.description}<br/>
            <strong>Category:</strong> ${eventData.category}<br/>
            <strong>Event Type:</strong> ${eventData.eventType}<br/>
            <strong>Status:</strong> ${eventData.status}
          </div>
        `;
      }
      // --- TOOLTIP ÖZELLEŞTİRME SONU ---
    },
    legend: { data: ['Power (kW)', 'Expected Power (kW)', 'Wind Speed (m/s)'], textStyle: { color: '#333' } },
    grid: { left: '5%', right: '5%', bottom: '15%', containLabel: true },
    xAxis: { type: 'time' },
    yAxis: [
      { type: 'value', name: 'Power (kW)' },
      { type: 'value', name: 'Wind Speed (m/s)', position: 'right' }
    ],
    dataZoom: [
      { type: 'inside', startValue: dateRange?.start?.getTime(), endValue: dateRange?.end?.getTime() },
      { type: 'slider', startValue: dateRange?.start?.getTime(), endValue: dateRange?.end?.getTime() }
    ],
    series: [
      { name: 'Power (kW)', type: 'line', showSymbol: false, data: validEvents.map(event => [event.timestamp, event.power]) },
      { name: 'Expected Power (kW)', type: 'line', showSymbol: false, data: validEvents.map(event => [event.timestamp, event.power]) },
      { name: 'Wind Speed (m/s)', type: 'line', yAxisIndex: 1, showSymbol: false, data: validEvents.map(event => [event.timestamp, event.windSpeed]) }
    ]
  };

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
      <ReactECharts
        option={option}
        style={{ height: '500px', width: '100%' }}
        onEvents={handleChartEvents}
      />
    </div>
  );
};

export default DataChart;