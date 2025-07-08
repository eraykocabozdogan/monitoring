import { create } from 'zustand'
import type { ProcessedData, KPIMetrics, DateRange } from '../types'

interface TurbineStore {
  // State
  fullData: ProcessedData | null
  filteredKpis: KPIMetrics | null
  visibleDateRange: DateRange | null
  isLoading: boolean
  error: string | null
  
  // Actions
  startLoading: () => void
  setError: (error: string | null) => void
  setData: (data: ProcessedData) => void
  setVisibleDateRange: (range: DateRange | null) => void
  setFilteredKpis: (kpis: KPIMetrics | null) => void
  clearData: () => void
}

export const useTurbineStore = create<TurbineStore>((set, get) => ({
  // Initial state
  fullData: null,
  filteredKpis: null,
  visibleDateRange: null,
  isLoading: false,
  error: null,

  // Actions
  startLoading: () => set({ 
    isLoading: true, 
    error: null 
  }),

  setError: (error) => set({ 
    error, 
    isLoading: false 
  }),

  setData: (data) => {
    // Calculate initial filtered KPIs based on full data
    const filteredKpis = data.kpiMetrics
    
    // Set initial visible date range if timestamps exist
    let visibleDateRange: DateRange | null = null
    if (data.chartData.timestamps.length > 0) {
      const sortedTimestamps = [...data.chartData.timestamps].sort()
      visibleDateRange = {
        start: sortedTimestamps[0],
        end: sortedTimestamps[sortedTimestamps.length - 1]
      }
    }

    set({ 
      fullData: data,
      filteredKpis,
      visibleDateRange,
      isLoading: false,
      error: null 
    })
  },

  setVisibleDateRange: (range) => {
    const { fullData } = get()
    
    set({ visibleDateRange: range })
    
    // Recalculate filtered KPIs based on new date range
    if (fullData && range) {
      // Filter data within the date range
      const filteredIndices = fullData.chartData.timestamps
        .map((timestamp, index) => ({ timestamp, index }))
        .filter(({ timestamp }) => timestamp >= range.start && timestamp <= range.end)
        .map(({ index }) => index)

      if (filteredIndices.length > 0) {
        // Calculate KPIs for filtered data
        // For simplicity, we'll use the full data KPIs for the filtered range
        // In a real application, you'd need the raw downtime data for accurate calculation
        const filteredKpis: KPIMetrics = {
          availability: fullData.kpiMetrics.availability,
          reliability: fullData.kpiMetrics.reliability
        }

        set({ filteredKpis })
      } else {
        set({ filteredKpis: { availability: 0, reliability: 0 } })
      }
    }
  },

  setFilteredKpis: (kpis) => set({ filteredKpis: kpis }),

  clearData: () => set({
    fullData: null,
    filteredKpis: null,
    visibleDateRange: null,
    isLoading: false,
    error: null
  })
}))
