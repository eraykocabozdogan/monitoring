import { useTurbineStore } from '../store'
import { TurbineChart } from './TurbineChart'

export const ChartsPanel = () => {
  const { fullData, visibleDateRange } = useTurbineStore()

  if (!fullData) {
    return null
  }

  // Filter chart data based on visible date range
  let chartData = fullData.chartData
  if (visibleDateRange) {
    const filteredIndices = fullData.chartData.timestamps
      .map((timestamp, index) => ({ timestamp, index }))
      .filter(({ timestamp }) => 
        timestamp >= visibleDateRange.start && 
        timestamp <= visibleDateRange.end
      )
      .map(({ index }) => index)

    if (filteredIndices.length > 0) {
      chartData = {
        timestamps: filteredIndices.map(i => fullData.chartData.timestamps[i]),
        power: filteredIndices.map(i => fullData.chartData.power[i]),
        windSpeed: filteredIndices.map(i => fullData.chartData.windSpeed[i])
      }
    }
  }

  const powerData = chartData.timestamps.map((timestamp, index) => ({
    timestamp,
    value: chartData.power[index]
  }))

  const windSpeedData = chartData.timestamps.map((timestamp, index) => ({
    timestamp,
    value: chartData.windSpeed[index]
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <TurbineChart
        data={powerData}
        title="Power Output (MW)"
        color="#3b82f6"
      />
      <TurbineChart
        data={windSpeedData}
        title="Wind Speed (m/s)"
        color="#10b981"
      />
    </div>
  )
}
