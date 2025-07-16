import { create } from 'zustand';
import type { TurbineEvent, PowerCurvePoint, Metrics } from '../types/index.js';

interface AppState {
  logEvents: TurbineEvent[];
  powerCurveData: PowerCurvePoint[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  metrics: Metrics;
  legendSelected: Record<string, boolean>;
  setLogEvents: (events: TurbineEvent[]) => void;
  setPowerCurveData: (data: PowerCurvePoint[]) => void;
  setDateRange: (range: { start: Date; end: Date }) => void;
  setMetrics: (newMetrics: Metrics) => void;
  setLegendSelected: (selected: Record<string, boolean>) => void;
}

export const useAppStore = create<AppState>((set) => ({
  logEvents: [],
  powerCurveData: [],
  dateRange: {
    start: null,
    end: null,
  },
  metrics: {
    availability: 0,
    mtbf: 0,
    mttr: 0,
    reliability_R100h: 0,
  },
  legendSelected: {
    'Power (kW)': true,
    'Expected Power (kW)': true,
    'Wind Speed (m/s)': true,
  },

  setLogEvents: (events: TurbineEvent[]) => set({ logEvents: events }),

  setPowerCurveData: (data: PowerCurvePoint[]) => {
    let earliest: Date | null = null;
    let latest: Date | null = null;

    if (data.length > 0) {
      data.forEach((d) => {
        if (d.timestamp) {
          if (!earliest || d.timestamp < earliest) earliest = d.timestamp;
          if (!latest || d.timestamp > latest) latest = d.timestamp;
        }
      });
    }

    set({
      powerCurveData: data,
      dateRange: {
        start: earliest,
        end: latest,
      },
    });
  },

  setDateRange: (range: { start: Date; end: Date }) => set({ dateRange: range }),

  setMetrics: (newMetrics: Metrics) => set({ metrics: newMetrics }),

  setLegendSelected: (selected: Record<string, boolean>) => set({ legendSelected: selected }),
}));