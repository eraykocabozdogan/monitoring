import { create } from 'zustand'; //
import type { TurbineEvent, Metrics } from '../types/index.js'; //

interface AppState {
  allEvents: TurbineEvent[]; //
  dateRange: { //
    start: Date | null; //
    end: Date | null; //
  };
  metrics: Metrics; //
  legendSelected: Record<string, boolean>; //
  setEvents: (events: TurbineEvent[]) => void; //
  setDateRange: (range: { start: Date; end: Date }) => void; //
  setMetrics: (newMetrics: Metrics) => void; //
  setLegendSelected: (selected: Record<string, boolean>) => void; //
}

export const useAppStore = create<AppState>((set) => ({
  allEvents: [], //
  dateRange: { //
    start: null, //
    end: null, //
  },
  metrics: {
    availability: 0, //
    mtbf: 0, //
    mttr: 0, //
    reliability_R100h: 0, // Yeni eklendi
  },
  legendSelected: {
    'Power (kW)': true,
    'Expected Power (kW)': true,
    'Wind Speed (m/s)': true,
  },
  
  setEvents: (events: TurbineEvent[]) => { //
    let earliest: Date | null = null; //
    let latest: Date | null = null; //

    if (events.length > 0) { //
      // Find the earliest and latest timestamps
      events.forEach((event) => { //
        if (event.timestamp && (!earliest || event.timestamp < earliest)) { //
          earliest = event.timestamp; //
        }
        if (event.timestamp && (!latest || event.timestamp > latest)) { //
          latest = event.timestamp; //
        }
      });
    }

    set({
      allEvents: events, //
      dateRange: { //
        start: earliest, //
        end: latest, //
      },
    });
  },

  setDateRange: (range: { start: Date; end: Date }) => { //
    set({
      dateRange: range, //
    });
  },

  setMetrics: (newMetrics: Metrics) => { //
    set({
      metrics: newMetrics, //
    });
  },

  setLegendSelected: (selected: Record<string, boolean>) => { //
    set({
      legendSelected: selected, //
    });
  },
}));