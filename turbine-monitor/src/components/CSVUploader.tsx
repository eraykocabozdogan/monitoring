import { useState, useCallback } from 'react'
import { useWorker } from '../hooks/useWorker'
import { TurbineChart } from './TurbineChart'
import type { ProcessedData } from '../types'
import { formatKPIValue, calculateTimeRange } from '../utils/helpers'

export const CSVUploader = () => {
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { processCSVFile } = useWorker()

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    setError(null)

    try {
      const data = await processCSVFile(file)
      setProcessedData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file')
    } finally {
      setIsProcessing(false)
    }
  }, [processCSVFile])

  const timeRange = processedData ? calculateTimeRange(processedData.chartData.timestamps) : null

  return (
    <div className="space-y-6">
      {/* File Upload */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Upload Turbine Data CSV
        </h2>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={isProcessing}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Choose CSV File'}
          </label>
          <p className="mt-2 text-sm text-gray-500">
            Upload a CSV file with turbine data including timestamps, power, wind speed, and status information.
          </p>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
      </div>

      {/* KPI Metrics */}
      {processedData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              KPI Metrics
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Availability:</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatKPIValue(processedData.kpiMetrics.availability)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Reliability:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {formatKPIValue(processedData.kpiMetrics.reliability)}
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

          {/* Recent Logs */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Recent Alerts ({processedData.logs.length})
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {processedData.logs.slice(0, 10).map((log, index) => (
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
              {processedData.logs.length === 0 && (
                <div className="text-gray-500 text-center py-4">
                  No alerts found in the data
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      {processedData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TurbineChart
            data={processedData.chartData.timestamps.map((timestamp, index) => ({
              timestamp,
              value: processedData.chartData.power[index]
            }))}
            title="Power Output"
            color="#3b82f6"
          />
          <TurbineChart
            data={processedData.chartData.timestamps.map((timestamp, index) => ({
              timestamp,
              value: processedData.chartData.windSpeed[index]
            }))}
            title="Wind Speed"
            color="#10b981"
          />
        </div>
      )}
    </div>
  )
}
