import { useCallback } from 'react'
import ReactECharts from 'echarts-for-react'
import { useTurbineStore } from '../store'
import { useWorker } from '../hooks/useWorker'

interface TurbineChartProps {
  dataType: 'power' | 'windSpeed'
  title: string
  color?: string
}

export const TurbineChart = ({ dataType, title, color = '#1f77b4' }: TurbineChartProps) => {
  const { fullData, visibleDateRange, setVisibleDateRange, setFilteredKpis } = useTurbineStore()
  const { recalculateKPIs } = useWorker()

  // Get data based on type
  const getData = useCallback(() => {
    if (!fullData) return { timestamps: [], values: [] }
    
    return {
      timestamps: fullData.chartData.timestamps,
      values: dataType === 'power' ? fullData.chartData.power : fullData.chartData.windSpeed
    }
  }, [fullData, dataType])

  const { timestamps, values } = getData()

  // Handle zoom events
  const handleDataZoom = useCallback(async (params: any) => {
    if (!fullData || !params || !params.batch) return

    const batch = params.batch[0]
    if (!batch) return

    // Calculate new date range based on zoom
    const startIndex = Math.floor(batch.startValue)
    const endIndex = Math.ceil(batch.endValue)
    
    if (startIndex >= 0 && endIndex < timestamps.length && startIndex < endIndex) {
      const newDateRange = {
        start: timestamps[startIndex],
        end: timestamps[endIndex]
      }

      // Update visible date range in store
      setVisibleDateRange(newDateRange)

      // Recalculate KPIs for the new date range
      try {
        const newKpis = await recalculateKPIs(newDateRange, fullData.logs)
        setFilteredKpis(newKpis)
      } catch (error) {
        console.error('Failed to recalculate KPIs:', error)
      }
    }
  }, [fullData, timestamps, setVisibleDateRange, setFilteredKpis, recalculateKPIs])

  // Chart configuration
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
      formatter: (params: any) => {
        if (params && params.length > 0) {
          const param = params[0]
          const timestamp = new Date(param.name).toLocaleString()
          const unit = dataType === 'power' ? 'MW' : 'm/s'
          return `${timestamp}<br/>${title}: ${param.value} ${unit}`
        }
        return ''
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: timestamps.map(timestamp => new Date(timestamp).toLocaleString()),
      axisLabel: {
        rotate: 45,
        formatter: (value: string) => {
          const date = new Date(value)
          return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
        }
      }
    },
    yAxis: {
      type: 'value',
      name: dataType === 'power' ? 'Power (MW)' : 'Wind Speed (m/s)',
      nameLocation: 'middle',
      nameGap: 40,
    },
    dataZoom: [
      {
        type: 'slider',
        show: true,
        start: visibleDateRange ? 
          (timestamps.indexOf(visibleDateRange.start) / timestamps.length) * 100 : 0,
        end: visibleDateRange ? 
          (timestamps.indexOf(visibleDateRange.end) / timestamps.length) * 100 : 100,
        handleIcon: 'path://M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z',
        handleSize: '80%',
        handleStyle: {
          color: color,
        }
      },
      {
        type: 'inside',
        start: visibleDateRange ? 
          (timestamps.indexOf(visibleDateRange.start) / timestamps.length) * 100 : 0,
        end: visibleDateRange ? 
          (timestamps.indexOf(visibleDateRange.end) / timestamps.length) * 100 : 100,
      }
    ],
    series: [
      {
        name: title,
        type: 'line',
        smooth: true,
        data: values,
        lineStyle: {
          color: color,
          width: 2,
        },
        itemStyle: {
          color: color,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: color + '40'
              },
              {
                offset: 1,
                color: color + '10'
              }
            ]
          }
        },
        markPoint: {
          data: [
            { type: 'max', name: 'Maximum' },
            { type: 'min', name: 'Minimum' }
          ]
        }
      },
    ],
  }

  if (!fullData || timestamps.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No data available
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <ReactECharts 
        option={option} 
        style={{ height: '400px' }} 
        onEvents={{
          dataZoom: handleDataZoom
        }}
      />
    </div>
  )
}
