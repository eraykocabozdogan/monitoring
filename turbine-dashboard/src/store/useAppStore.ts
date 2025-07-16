import { create } from 'zustand';
import type { TurbineEvent, PowerCurvePoint, Metrics } from '../types/index.js';
import { parseCsvFiles } from '../utils/csvParser.js'; // Parser'ı buraya import ediyoruz.

interface AppState {
  stagedFiles: File[]; // Yüklenmek için hazırlanan dosyaların listesi
  logEvents: TurbineEvent[];
  powerCurveData: PowerCurvePoint[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  metrics: Metrics;
  legendSelected: Record<string, boolean>;
  
  // Staging alanı için yeni fonksiyonlar
  addStagedFile: (file: File) => void;
  removeStagedFile: (fileName: string) => void;
  
  // Hazırlanan dosyaları işleyecek olan asenkron fonksiyon
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

  addStagedFile: (file) => {
    // Aynı isimde dosyanın tekrar eklenmesini engelle
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
      // Dosyaları işle
      const parsedData = await parseCsvFiles(stagedFiles);

      // Verileri state'e yaz
      const { logs, power } = parsedData;

      // Eğer beklenen dosya tipleri bulunamazsa hata ver
      const hasLogFile = logs.length > 0;
      const hasPowerFile = power.length > 0;

      if (!hasLogFile || !hasPowerFile) {
        let missingFiles = [];
        if (!hasLogFile) missingFiles.push("Event Log");
        if (!hasPowerFile) missingFiles.push("Power Curve");
        return { success: false, message: `Lütfen ${missingFiles.join(' ve ')} dosyalarını ekleyin.` };
      }
      
      // Veriyi ve tarih aralığını ayarla
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
        stagedFiles: [], // İşlem sonrası hazırlık listesini temizle
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