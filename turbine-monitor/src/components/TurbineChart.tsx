import ReactECharts from 'echarts-for-react'
import type { ChartData } from '../types'

interface TurbineChartProps {
  data: ChartData[]
  title: string
  color?: string
}

export const TurbineChart = ({ data, title, color = '#1f77b4' }: TurbineChartProps) => {
  const option = {
    title: {
      text: title,
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
      },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985',
        },
      },
    },
    xAxis: {
      type: 'category',
      data: data.map(item => new Date(item.timestamp).toLocaleTimeString()),
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: title,
        type: 'line',
        smooth: true,
        data: data.map(item => item.value),
        lineStyle: {
          color: color,
        },
        itemStyle: {
          color: color,
        },
      },
    ],
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <ReactECharts option={option} style={{ height: '300px' }} />
    </div>
  )
}
