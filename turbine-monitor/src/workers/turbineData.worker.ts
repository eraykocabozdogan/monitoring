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

interface DateRange {
  start: string
  end: string
}

interface RecalculatePayload {
  dateRange: DateRange
  allLogs: LogEntry[]
}

// Event listener for messages from main thread
self.addEventListener('message', (event) => {
  const { type, file, payload } = event.data
  
  if (type === 'PROCESS_CSV') {
    handleCSVProcessing(file)
  } else if (type === 'RECALCULATE') {
    handleKPIRecalculation(payload)
  } else {
    self.postMessage({ success: false, error: 'Unknown message type' })
  }
})

function handleCSVProcessing(file: File) {
  if (!file) {
    self.postMessage({ success: false, error: 'No file provided' })
    return
  }
  
  // Parse CSV file using Papa Parse
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      try {
        const processedData = processCSVData(results.data as CSVRow[])
        self.postMessage({ 
          success: true, 
          type: 'PROCESSING_COMPLETE',
          data: processedData 
        })
      } catch (error) {
        self.postMessage({ 
          success: false,
          error: error instanceof Error ? error.message : 'Processing failed' 
        })
      }
    },
    error: (error) => {
      self.postMessage({ success: false, error: `CSV parsing failed: ${error.message}` })
    }
  })
}

function handleKPIRecalculation(payload: RecalculatePayload) {
  try {
    const { dateRange, allLogs } = payload
    
    // Filter logs within the date range
    const filteredLogs = allLogs.filter(log => 
      log.timestamp >= dateRange.start && log.timestamp <= dateRange.end
    )
    
    // Calculate KPIs based on filtered logs
    const kpiMetrics = calculateKPIsFromLogs(filteredLogs, dateRange)
    
    self.postMessage({
      success: true,
      type: 'RECALCULATION_COMPLETE',
      data: kpiMetrics
    })
  } catch (error) {
    self.postMessage({
      success: false,
      error: error instanceof Error ? error.message : 'Recalculation failed'
    })
  }
}

function calculateKPIsFromLogs(logs: LogEntry[], dateRange: DateRange): KPIMetrics {
  // Calculate time span in hours
  const startTime = new Date(dateRange.start).getTime()
  const endTime = new Date(dateRange.end).getTime()
  const totalHours = (endTime - startTime) / (1000 * 60 * 60)
  
  if (totalHours <= 0) {
    return { availability: 100, reliability: 100 }
  }
  
  // Count fault and warning events
  const faultLogs = logs.filter(log => log.category.toLowerCase() === 'fault')
  const warningLogs = logs.filter(log => log.category.toLowerCase() === 'warning')
  
  // Simple calculation based on log frequency
  // In a real implementation, you'd use actual downtime data
  const faultHours = faultLogs.length * 0.5 // Assume each fault causes 0.5 hour downtime
  const warningHours = warningLogs.length * 0.1 // Assume each warning causes 0.1 hour impact
  
  const totalDowntime = faultHours + warningHours
  const faultDowntime = faultHours
  
  const availability = Math.max(0, Math.min(100, ((totalHours - totalDowntime) / totalHours) * 100))
  const reliability = Math.max(0, Math.min(100, ((totalHours - faultDowntime) / totalHours) * 100))
  
  return {
    availability: Number(availability.toFixed(1)),
    reliability: Number(reliability.toFixed(1))
  }
}

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
