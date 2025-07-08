import { useTurbineStore } from '../store'

export const AlertsPanel = () => {
  const { fullData, visibleDateRange } = useTurbineStore()

  if (!fullData) {
    return null
  }

  // Filter logs based on visible date range
  const filteredLogs = visibleDateRange 
    ? fullData.logs.filter(log => 
        log.timestamp >= visibleDateRange.start && 
        log.timestamp <= visibleDateRange.end
      )
    : fullData.logs

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Recent Alerts ({filteredLogs.length})
      </h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {filteredLogs.slice(0, 10).map((log, index) => (
          <div
            key={index}
            className={`p-3 rounded text-sm ${
              log.category.toLowerCase() === 'fault'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            <div className="font-medium">{log.message}</div>
            <div className="text-xs opacity-75">{log.timestamp}</div>
          </div>
        ))}
        {filteredLogs.length === 0 && (
          <div className="text-gray-500 text-center py-4">
            No alerts found in the selected date range
          </div>
        )}
      </div>
    </div>
  )
}
