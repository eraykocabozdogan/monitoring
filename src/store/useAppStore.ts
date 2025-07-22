import { create } from 'zustand';
import type { TurbineEvent, PowerCurvePoint, Metrics, Comment, CommentSelection } from '../types/index';
import { parseCsvFiles } from '../utils/csvParser';

type Theme = 'light' | 'dark';

// Filtreleme için tip tanımı
export type LogFilters = Partial<Record<keyof Omit<TurbineEvent, 'timestamp' | 'description' | 'power' | 'windSpeed'>, string[]>>;

// Metrik hesaplamaları için hafif veri tipi
export type LightweightLogEvent = Pick<TurbineEvent, 'timestamp' | 'status' | 'eventType'>;

interface AppState {
  stagedFiles: File[];
  logEvents: TurbineEvent[];
  powerCurveData: PowerCurvePoint[];
  lightweightLogEvents: LightweightLogEvent[]; // Metrikler için
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  metrics: Metrics;
  legendSelected: Record<string, boolean>;
  comments: Comment[];
  newCommentSelection: CommentSelection | null;
  theme: Theme;
  isLoading: boolean;

  // Gelişmiş Filtreleme için yeni state'ler
  isFilterModalOpen: boolean;
  logFilters: LogFilters;
  tempLogFilters: LogFilters;

  addStagedFile: (file: File) => void;
  removeStagedFile: (fileName: string) => void;
  processStagedFiles: () => Promise<{ success: boolean; message: string }>;
  setDateRange: (range: { start: Date; end: Date }) => void;
  setMetrics: (newMetrics: Metrics) => void;
  setLegendSelected: (selected: Record<string, boolean>) => void;
  addComment: (comment: Comment) => void;
  setNewCommentSelection: (selection: CommentSelection | null) => void;
  toggleTheme: () => void;
  setIsLoading: (loading: boolean) => void;

  // Gelişmiş Filtreleme için yeni eylemler (actions)
  openFilterModal: () => void;
  closeFilterModal: () => void;
  setTempLogFilters: (filters: LogFilters) => void;
  applyLogFilters: () => void;
  resetLogFilters: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  stagedFiles: [],
  logEvents: [],
  powerCurveData: [],
  lightweightLogEvents: [],
  dateRange: { start: null, end: null },
  metrics: { operationalAvailability: 0, technicalAvailability: 0, mtbf: 0, mttr: 0, reliabilityR: 0 },
  legendSelected: {
    'Power (kW)': true,
    'Expected Power (kW)': true,
    'Wind Speed (m/s)': true,
    'Fault': true,
    'Safety Critical Fault': true,
  },
  comments: [],
  newCommentSelection: null,
  theme: 'light',
  isLoading: false,

  // Filtreleme state başlangıç değerleri
  isFilterModalOpen: false,
  logFilters: {},
  tempLogFilters: {},

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
    const { stagedFiles, setIsLoading } = get();
    if (stagedFiles.length === 0) {
      return { success: false, message: "No files selected for processing." };
    }
    
    setIsLoading(true);
    
    try {
      const parsedData = await parseCsvFiles(stagedFiles);
      const { logs, power, lightweightLogs } = parsedData;

      if (logs.length === 0 && power.length === 0) {
        setIsLoading(false);
        return { 
          success: false, 
          message: "Could not recognize file formats or files are empty. Please upload a valid Power Curve or Event Log file."
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
      
      const newLegendSelected: Record<string, boolean> = {
        'Power (kW)': true,
        'Expected Power (kW)': true,
        'Wind Speed (m/s)': true,
        'Fault': true,
        'Safety Critical Fault': true,
      };

      set({
        logEvents: logs,
        powerCurveData: power,
        lightweightLogEvents: lightweightLogs,
        stagedFiles: [],
        dateRange: { start: earliest, end: latest },
        metrics: { operationalAvailability: 0, technicalAvailability: 0, mtbf: 0, mttr: 0, reliabilityR: 0 },
        legendSelected: newLegendSelected,
        comments: [],
        newCommentSelection: null,
        logFilters: {}, // Dosyalar yeniden işlendiğinde filtreleri sıfırla
        tempLogFilters: {},
      });

      setIsLoading(false);
      return { success: true, message: "Files processed successfully." };
    } catch (error) {
      console.error("File processing error:", error);
      setIsLoading(false);
      return { success: false, message: error instanceof Error ? error.message : "An unknown error occurred." };
    }
  },

  setDateRange: (range) => set({ dateRange: range }),
  setMetrics: (newMetrics) => set({ metrics: newMetrics }),
  setLegendSelected: (selected) => set({ legendSelected: selected }),
  addComment: (comment) => set(state => ({ comments: [...state.comments, comment] })),
  setNewCommentSelection: (selection) => set({ newCommentSelection: selection }),
  toggleTheme: () => set(state => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
  setIsLoading: (loading) => set({ isLoading: loading }),

  // Filtreleme Eylemleri
  openFilterModal: () => set(state => ({
    isFilterModalOpen: true,
    tempLogFilters: state.logFilters,
  })),
  closeFilterModal: () => set({ isFilterModalOpen: false }),
  setTempLogFilters: (filters) => set({ tempLogFilters: filters }),
  applyLogFilters: () => set(state => ({ logFilters: state.tempLogFilters })),
  resetLogFilters: () => set({ logFilters: {}, tempLogFilters: {} }),
}));