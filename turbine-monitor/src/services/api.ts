import type { TurbineData, MonitoringData } from '../types'

export const mockTurbineData: TurbineData[] = [
  {
    id: '1',
    name: 'Turbine 001',
    power: 1.2,
    speed: 15.5,
    temperature: 45.2,
    efficiency: 85.5,
    status: 'online',
    lastUpdate: new Date(),
  },
  {
    id: '2',
    name: 'Turbine 002',
    power: 1.8,
    speed: 18.2,
    temperature: 42.1,
    efficiency: 89.2,
    status: 'online',
    lastUpdate: new Date(),
  },
  {
    id: '3',
    name: 'Turbine 003',
    power: 0.9,
    speed: 12.1,
    temperature: 48.5,
    efficiency: 78.3,
    status: 'maintenance',
    lastUpdate: new Date(),
  },
]

export const fetchMonitoringData = async (): Promise<MonitoringData> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  return {
    turbines: mockTurbineData,
    totalPower: mockTurbineData.reduce((sum, turbine) => sum + turbine.power, 0),
    averageEfficiency: mockTurbineData.reduce((sum, turbine) => sum + turbine.efficiency, 0) / mockTurbineData.length,
    activeCount: mockTurbineData.filter(turbine => turbine.status === 'online').length,
    alerts: [
      {
        id: '1',
        turbineId: '3',
        type: 'warning',
        message: 'Maintenance required within 2 days',
        timestamp: new Date(),
        resolved: false,
      },
      {
        id: '2',
        turbineId: '1',
        type: 'info',
        message: 'Performance optimal',
        timestamp: new Date(),
        resolved: false,
      },
    ],
  }
}

export const updateTurbineData = async (turbineId: string, data: Partial<TurbineData>): Promise<void> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500))
  console.log(`Updating turbine ${turbineId}:`, data)
}
