import { create } from 'zustand';
import type { TurbineEvent, PowerCurvePoint, Metrics } from '../types/index.js';
import { parseCsvFiles } from '../utils/csvParser.js';

// ... (AppState arayüzünde değişiklik yok)
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

  // ... (addStagedFile ve removeStagedFile'da değişiklik yok)
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

      if (logs.length === 0 && power.length === 0) {
        return { 
          success: false, 
          message: "Dosya formatları tanınamadı veya dosyalar boş. Lütfen geçerli bir Power Curve veya Event Log dosyası yükleyin." 
        };
      }
      
      const allTimestamps = [
          ...power.map(p => p.timestamp), 
          ...logs.map(l => l.timestamp)
        ].filter(Boolean) as Date[];

      let earliest = null, latest = null;
      if (allTimestamps.length > 0) {
          earliest = new Date(Math.min(...allTimestamps.map(d => d.getTime())));
          latest = new Date(Math.max(...allTimestamps.map(d => d.getTime())));
      }
      
      // Legend'ı mevcut verilere göre dinamik olarak oluştur
      const newLegendSelected: Record<string, boolean> = {
        'Power (kW)': true,
        'Expected Power (kW)': true,
        'Wind Speed (m/s)': true,
      };

      // Critical Events seçeneğini sadece hem log hem de power verisi varsa ekle
      if (logs.length > 0 && power.length > 0) {
        newLegendSelected['Critical Events'] = true;
      }

      set({
        logEvents: logs,
        powerCurveData: power,
        stagedFiles: [],
        dateRange: { start: earliest, end: latest },
        metrics: { availability: 0, mtbf: 0, mttr: 0, reliability_R100h: 0 },
        legendSelected: newLegendSelected, // Dinamik olarak oluşturulan legend'ı ayarla
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