import { create } from 'zustand'
import type { TurbineData, MonitoringData, Alert } from '../types'

interface MonitoringStore {
  data: MonitoringData | null
  isLoading: boolean
  error: string | null
  setData: (data: MonitoringData) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  updateTurbine: (turbineId: string, updates: Partial<TurbineData>) => void
  addAlert: (alert: Alert) => void
  resolveAlert: (alertId: string) => void
}

export const useMonitoringStore = create<MonitoringStore>((set, get) => ({
  data: null,
  isLoading: false,
  error: null,
  
  setData: (data) => set({ data }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  
  updateTurbine: (turbineId, updates) => {
    const { data } = get()
    if (!data) return
    
    const turbineIndex = data.turbines.findIndex(t => t.id === turbineId)
    if (turbineIndex === -1) return
    
    const updatedTurbines = [...data.turbines]
    updatedTurbines[turbineIndex] = { ...updatedTurbines[turbineIndex], ...updates }
    
    set({
      data: {
        ...data,
        turbines: updatedTurbines,
      }
    })
  },
  
  addAlert: (alert) => {
    const { data } = get()
    if (!data) return
    
    set({
      data: {
        ...data,
        alerts: [alert, ...data.alerts],
      }
    })
  },
  
  resolveAlert: (alertId) => {
    const { data } = get()
    if (!data) return
    
    const updatedAlerts = data.alerts.map(alert =>
      alert.id === alertId ? { ...alert, resolved: true } : alert
    )
    
    set({
      data: {
        ...data,
        alerts: updatedAlerts,
      }
    })
  },
}))
