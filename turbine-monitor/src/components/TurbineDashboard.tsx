import { useCallback } from 'react'
import { useTurbineStore } from '../store'
import { useWorker } from '../hooks/useWorker'
import { CSVUploader } from './CSVUploader'
import { KPIMetrics } from './KPIMetrics'
import { AlertsPanel } from './AlertsPanel'
import { ChartsPanel } from './ChartsPanel'

export const TurbineDashboard = () => {
  const { fullData, isLoading, error, startLoading, setData, setError, clearData } = useTurbineStore()
  const { processCSVFile } = useWorker()

  const handleFileSelect = useCallback(async (file: File) => {
    startLoading()
    
    try {
      const processedData = await processCSVFile(file)
      setData(processedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file')
    }
  }, [processCSVFile, startLoading, setData, setError])

  const handleClearData = useCallback(() => {
    clearData()
  }, [clearData])

  return (
    <div className="space-y-8">
      {/* File Upload Section */}
      <div className="space-y-4">
        <CSVUploader 
          onFileSelect={handleFileSelect} 
          isLoading={isLoading}
          error={error}
        />
        
        {fullData && (
          <div className="flex justify-end">
            <button
              onClick={handleClearData}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-sm font-medium"
            >
              Clear Data
            </button>
          </div>
        )}
      </div>

      {/* Data Display Section */}
      {fullData && (
        <>
          {/* KPI Metrics and Alerts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <KPIMetrics />
            <AlertsPanel />
          </div>

          {/* Charts */}
          <ChartsPanel />
        </>
      )}
    </div>
  )
}
