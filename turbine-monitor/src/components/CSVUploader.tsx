import { useCallback } from 'react'

interface CSVUploaderProps {
  onFileSelect: (file: File) => void
  isLoading?: boolean
  error?: string | null
}

export const CSVUploader = ({ onFileSelect, isLoading = false, error }: CSVUploaderProps) => {
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onFileSelect(file)
    }
  }, [onFileSelect])

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Upload Turbine Data CSV
      </h2>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          disabled={isLoading}
          className="hidden"
          id="csv-upload"
        />
        <label
          htmlFor="csv-upload"
          className={`cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
            isLoading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Processing...' : 'Choose CSV File'}
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
  )
}
