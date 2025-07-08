export interface TurbineData {
  id: string
  name: string
  power: number
  speed: number
  temperature: number
  efficiency: number
  status: 'online' | 'offline' | 'maintenance'
  lastUpdate: Date
}

export interface MonitoringData {
  turbines: TurbineData[]
  totalPower: number
  averageEfficiency: number
  activeCount: number
  alerts: Alert[]
}

export interface Alert {
  id: string
  turbineId: string
  type: 'warning' | 'error' | 'info'
  message: string
  timestamp: Date
  resolved: boolean
}

// Chart data for visualization
export interface ChartData {
  timestamps: string[]
  power: number[]
  windSpeed: number[]
}

// Individual chart data point
export interface ChartDataPoint {
  timestamp: string
  value: number
}

// Log entry structure
export interface LogEntry {
  timestamp: string
  message: string
  category: string
}

// KPI metrics
export interface KPIMetrics {
  availability: number
  reliability: number
}

// CSV data structure
export interface CSVData {
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

// Worker message types
export interface WorkerMessage {
  type: 'PROCESS_CSV' | 'CALCULATE_KPI' | 'GENERATE_CHART_DATA'
  data: any
}

export interface WorkerResponse {
  success: boolean
  data?: any
  error?: string
}

// Processed data from worker
export interface ProcessedData {
  chartData: ChartData
  logs: LogEntry[]
  kpiMetrics: KPIMetrics
}
