import { create } from 'zustand';
import type { TurbineEvent, PowerCurvePoint, Metrics } from '../types/index.js';
import { parseCsvFiles } from '../utils/csvParser.js';

interface AppState {
  stagedFiles: File[];
  logEvents: TurbineEvent[];
  powerCurveData: PowerCurvePoint[];
  dateRange: { start: Date | null; end: Date | null; };
  metrics: Metrics;
  legendSelected: Record<string, boolean>;
  addStagedFile: (file: File) => void;
  removeStagedFile: (fileName: string) => void;
  processStagedFiles: () => Promise<{ success: boolean; message: string }>;
  setDateRange: (range: { start: Date; end: Date }) => void;
  setMetrics: (newMetrics: Metrics) => void;
  setLegendSelected: (selected: Record<string, boolean>) => void;
}

const initialMetrics: Metrics = { operationalAvailability: 0, technicalAvailability: 0, mtbf: 0, mttr: 0, reliabilityR: 0, };

export const useAppStore = create<AppState>((set, get) => ({
  stagedFiles: [],
  logEvents: [],
  powerCurveData: [],
  dateRange: { start: null, end: null },
  metrics: initialMetrics,
  legendSelected: { 'Power (kW)': true, 'Expected Power (kW)': true, 'Wind Speed (m/s)': true },
  addStagedFile: (file) => {
    if (!get().stagedFiles.some(f => f.name === file.name)) {
      set(state => ({ stagedFiles: [...state.stagedFiles, file] }));
    }
  },
  removeStagedFile: (fileName) => {
    set(state => ({ stagedFiles: state.stagedFiles.filter(f => f.name !== fileName) }));
  },
  processStagedFiles: async () => {
    const { stagedFiles } = get();
    if (stagedFiles.length === 0) return { success: false, message: "İşlenecek dosya seçilmedi." };
    
    try {
      const parsedData = await parseCsvFiles(stagedFiles);
      if (parsedData.logs.length === 0 && parsedData.power.length === 0) {
        return { success: false, message: "Dosya formatları tanınamadı veya dosyalar boş. Lütfen geçerli bir Power Curve veya Event Log dosyası yükleyin." };
      }
      
      const powerTimestamps = parsedData.power.map(p => p.timestamp!.getTime());
      const logTimestamps = parsedData.logs.map(l => l.timestamp!.getTime());
      const allTimestamps = [...powerTimestamps, ...logTimestamps];
      
      const earliest = allTimestamps.length > 0 ? new Date(Math.min(...allTimestamps)) : null;
      const latest = allTimestamps.length > 0 ? new Date(Math.max(...allTimestamps)) : null;

      set({
        logEvents: parsedData.logs,
        powerCurveData: parsedData.power,
        stagedFiles: [],
        dateRange: { start: earliest, end: latest },
        metrics: initialMetrics,
      });
      return { success: true, message: "Dosyalar başarıyla işlendi." };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu.";
      console.error("processStagedFiles Error:", error);
      return { success: false, message };
    }
  },
  setDateRange: (range) => set({ dateRange: range }),
  setMetrics: (newMetrics) => set({ metrics: newMetrics }),
  setLegendSelected: (selected) => set({ legendSelected: selected }),
}));