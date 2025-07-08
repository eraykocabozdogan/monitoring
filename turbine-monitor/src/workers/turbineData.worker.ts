// turbineData.worker.ts
import Papa from 'papaparse'

interface CSVRow {
  timestamp: string
  power?: string | number
  'wind speed'?: string | number
  'wind_speed'?: string | number
  windSpeed?: string | number
  status?: string
  category?: string
  message?: string
  downtime?: string | number
  fault_downtime?: string | number
  [key: string]: any
}

interface ChartData {
  timestamps: string[]
  power: number[]
  windSpeed: number[]
}

interface LogEntry {
  timestamp: string
  message: string
  category: string
}

interface KPIMetrics {
  availability: number
  reliability: number
}

interface ProcessedData {
  chartData: ChartData
  logs: LogEntry[]
  kpiMetrics: KPIMetrics
}

// Event listener for messages from main thread
self.addEventListener('message', (event) => {
  const { file } = event.data
  
  if (!file) {
    self.postMessage({ error: 'No file provided' })
    return
  }
  
  // Parse CSV file using Papa Parse
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      try {
        const processedData = processCSVData(results.data as CSVRow[])
        self.postMessage({ success: true, data: processedData })
      } catch (error) {
        self.postMessage({ 
          error: error instanceof Error ? error.message : 'Processing failed' 
        })
      }
    },
    error: (error) => {
      self.postMessage({ error: `CSV parsing failed: ${error.message}` })
    }
  })
})

function processCSVData(rows: CSVRow[]): ProcessedData {
  const chartData: ChartData = {
    timestamps: [],
    power: [],
    windSpeed: []
  }
  
  const logs: LogEntry[] = []
  
  // Variables for KPI calculations
  let totalOperatingTime = 0
  let totalDowntime = 0
  let faultDowntime = 0
  let validDataPoints = 0
  
  // Process each row
  for (const row of rows) {
    try {
      // Skip invalid rows
      if (!row.timestamp) continue
      
      // Convert numerical data to Number type
      const power = parseNumber(row.power)
      const windSpeed = parseNumber(
        row['wind speed'] || row['wind_speed'] || row.windSpeed
      )
      
      // Skip rows with invalid numerical data
      if (power === null || windSpeed === null) continue
      
      // Add to chart data
      chartData.timestamps.push(row.timestamp)
      chartData.power.push(power)
      chartData.windSpeed.push(windSpeed)
      
      // Process logs - only include Fault or Warning categories
      if (row.category && row.message) {
        const category = row.category.toLowerCase()
        if (category === 'fault' || category === 'warning') {
          logs.push({
            timestamp: row.timestamp,
            message: row.message,
            category: row.category
          })
        }
      }
      
      // Calculate KPI metrics data
      const downtime = parseNumber(row.downtime) || 0
      const faultDt = parseNumber(row.fault_downtime) || 0
      
      totalDowntime += downtime
      faultDowntime += faultDt
      validDataPoints++
      
    } catch (error) {
      // Skip invalid rows and continue processing
      console.warn('Skipping invalid row:', error)
      continue
    }
  }
  
  // Calculate total operating time (assuming 1 hour intervals)
  totalOperatingTime = validDataPoints * 1 // 1 hour per data point
  
  // Calculate KPI metrics
  const kpiMetrics = calculateKPIMetrics(
    totalOperatingTime,
    totalDowntime,
    faultDowntime
  )
  
  return {
    chartData,
    logs,
    kpiMetrics
  }
}

function parseNumber(value: string | number | undefined): number | null {
  if (value === undefined || value === null || value === '') return null
  
  const num = typeof value === 'string' ? parseFloat(value) : value
  return isNaN(num) ? null : num
}

function calculateKPIMetrics(
  totalOperatingTime: number,
  totalDowntime: number,
  faultDowntime: number
): KPIMetrics {
  if (totalOperatingTime === 0) {
    return { availability: 0, reliability: 0 }
  }
  
  // Availability = (Total Time - Total Downtime) / Total Time * 100
  const availability = ((totalOperatingTime - totalDowntime) / totalOperatingTime) * 100
  
  // Reliability = (Total Time - Fault Downtime) / Total Time * 100
  const reliability = ((totalOperatingTime - faultDowntime) / totalOperatingTime) * 100
  
  return {
    availability: Math.max(0, Math.min(100, availability)), // Clamp between 0-100
    reliability: Math.max(0, Math.min(100, reliability))     // Clamp between 0-100
  }
}

// Export types for TypeScript support
export type { CSVRow, ChartData, LogEntry, KPIMetrics, ProcessedData }
