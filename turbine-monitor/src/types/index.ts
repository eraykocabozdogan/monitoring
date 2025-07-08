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

export interface ChartData {
  timestamp: number
  value: number
  label?: string
}

export interface CSVData {
  [key: string]: string | number
}
