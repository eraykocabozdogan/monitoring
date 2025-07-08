import { useTurbineStore } from '../store'
import { formatKPIValue, calculateTimeRange } from '../utils/helpers'

export const KPIMetrics = () => {
  const { fullData, filteredKpis, visibleDateRange } = useTurbineStore()

  if (!fullData || !filteredKpis) {
    return null
  }

  const timeRange = visibleDateRange || 
    (fullData ? calculateTimeRange(fullData.chartData.timestamps) : null)

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        KPI Metrics
      </h3>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Availability:</span>
          <span className="text-2xl font-bold text-green-600">
            {formatKPIValue(filteredKpis.availability)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Reliability:</span>
          <span className="text-2xl font-bold text-blue-600">
            {formatKPIValue(filteredKpis.reliability)}
          </span>
        </div>
        {timeRange && (
          <div className="text-sm text-gray-500 mt-4">
            <div>Data Range:</div>
            <div>{timeRange.start} - {timeRange.end}</div>
          </div>
        )}
      </div>
    </div>
  )
}
