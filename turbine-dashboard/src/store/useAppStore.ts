import { create } from 'zustand';
import type { TurbineEvent, PowerCurvePoint, Metrics } from '../types/index.js';
import { parseCsvFiles } from '../utils/csvParser.js';

// Yeni arayüz tanımı
interface ChartEventFilters {
  [key: string]: boolean;
  'fault': boolean;
  'safety critical fault': boolean;
}

interface AppState {
  stagedFiles: File[];
  logEvents: TurbineEvent[];
  powerCurveData: PowerCurvePoint[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  metrics: Metrics;
  legendSelected: Record<string, boolean>;
  
  // Yeni state ve setter'ı ekliyoruz
  chartEventFilters: ChartEventFilters;
  setChartEventFilters: (filters: ChartEventFilters) => void;

  addStagedFile: (file: File) => void;
  removeStagedFile: (fileName: string) => void;
  processStagedFiles: () => Promise<{ success: boolean; message: string }>;
  setDateRange: (range: { start: Date; end: Date }) => void;
  setMetrics: (newMetrics: Metrics) => void;
  setLegendSelected: (selected: Record<string, boolean>) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  stagedFiles: [],
  logEvents: [],
  powerCurveData: [],
  dateRange: { start: null, end: null },
  metrics: { availability: 0, mtbf: 0, mttr: 0, reliability_R100h: 0 },
  legendSelected: { 'Power (kW)': true, 'Expected Power (kW)': true, 'Wind Speed (m/s)': true },
  
  // Yeni state'in başlangıç değeri
  chartEventFilters: {
    'fault': true,
    'safety critical fault': true,
  },
  
  // Yeni setter fonksiyonu
  setChartEventFilters: (filters) => set({ chartEventFilters: filters }),

  addStagedFile: (file) => {
    if (!get().stagedFiles.some(f => f.name === file.name)) {
      set(state => ({ stagedFiles: [...state.stagedFiles, file] }));
    }
  },

  removeStagedFile: (fileName) => {
    set(state => ({
      stagedFiles: state.stagedFiles.filter(f => f.name !== fileName),
    }));
  },

  processStagedFiles: async () => {
    const { stagedFiles } = get();
    if (stagedFiles.length === 0) {
      return { success: false, message: "İşlenecek dosya seçilmedi." };
    }
    try {
      const parsedData = await parseCsvFiles(stagedFiles);
      const { logs, power } = parsedData;

      const hasLogFile = logs.length > 0;
      const hasPowerFile = power.length > 0;

      if (!hasLogFile || !hasPowerFile) {
        let missingFiles = [];
        if (!hasLogFile) missingFiles.push("Event Log");
        if (!hasPowerFile) missingFiles.push("Power Curve");
        return { success: false, message: `Lütfen ${missingFiles.join(' ve ')} dosyalarını ekleyin.` };
      }
      
      let earliest = null, latest = null;
      if (power.length > 0) {
          power.forEach(d => {
              if (d.timestamp) {
                  if (!earliest || d.timestamp < earliest) earliest = d.timestamp;
                  if (!latest || d.timestamp > latest) latest = d.timestamp;
              }
          });
      }

      set({
        logEvents: logs,
        powerCurveData: power,
        stagedFiles: [],
        dateRange: { start: earliest, end: latest }
      });

      return { success: true, message: "Dosyalar başarıyla işlendi." };
    } catch (error) {
      console.error("Dosya işleme hatası:", error);
      return { success: false, message: error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu." };
    }
  },

  setDateRange: (range) => set({ dateRange: range }),
  setMetrics: (newMetrics) => set({ metrics: newMetrics }),
  setLegendSelected: (selected) => set({ legendSelected: selected }),
}));