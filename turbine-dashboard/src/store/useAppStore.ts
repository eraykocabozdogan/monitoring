import { create } from 'zustand';
import type { TurbineEvent, PowerCurvePoint, Metrics, Comment, CommentSelection } from '../types/index.js';
import { parseCsvFiles } from '../utils/csvParser.js';

type Theme = 'light' | 'dark';

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
  comments: Comment[];
  newCommentSelection: CommentSelection | null;
  theme: Theme;

  addStagedFile: (file: File) => void;
  removeStagedFile: (fileName: string) => void;
  processStagedFiles: () => Promise<{ success: boolean; message: string }>;
  setDateRange: (range: { start: Date; end: Date }) => void;
  setMetrics: (newMetrics: Metrics) => void;
  setLegendSelected: (selected: Record<string, boolean>) => void;
  addComment: (comment: Comment) => void;
  setNewCommentSelection: (selection: CommentSelection | null) => void;
  toggleTheme: () => void;
}


export const useAppStore = create<AppState>((set, get) => ({
  stagedFiles: [],
  logEvents: [],
  powerCurveData: [],
  dateRange: { start: null, end: null },
  metrics: { operationalAvailability: 0, technicalAvailability: 0, mtbf: 0, mttr: 0, reliabilityR: 0 },
  // "Critical Events" kaldırıldı, yerine iki yeni event eklendi
  legendSelected: {
    'Power (kW)': true,
    'Expected Power (kW)': true,
    'Wind Speed (m/s)': true,
    'Fault': true,
    'Safety Critical Fault': true,
  },
  comments: [],
  newCommentSelection: null,
  theme: 'light', // Varsayılan tema

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
      return { success: false, message: "No files selected for processing." };
    }
    try {
      const parsedData = await parseCsvFiles(stagedFiles);
      const { logs, power } = parsedData;

      if (logs.length === 0 && power.length === 0) {
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
      
      // Legend state'i yeni eventlere göre güncellendi
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
        stagedFiles: [],
        dateRange: { start: earliest, end: latest },
        metrics: { operationalAvailability: 0, technicalAvailability: 0, mtbf: 0, mttr: 0, reliabilityR: 0 },
        legendSelected: newLegendSelected,
        comments: [],
        newCommentSelection: null,
      });

      return { success: true, message: "Files processed successfully." };
    } catch (error) {
      console.error("File processing error:", error);
      return { success: false, message: error instanceof Error ? error.message : "An unknown error occurred." };
    }
  },

  setDateRange: (range) => set({ dateRange: range }),
  setMetrics: (newMetrics) => set({ metrics: newMetrics }),
  setLegendSelected: (selected) => set({ legendSelected: selected }),
  addComment: (comment) => set(state => ({ comments: [...state.comments, comment] })),
  setNewCommentSelection: (selection) => set({ newCommentSelection: selection }),
  toggleTheme: () => set(state => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
}));