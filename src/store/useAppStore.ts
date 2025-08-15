import { create } from 'zustand';
import type { TurbineEvent, PowerCurvePoint, Metrics, Comment, CommentSelection, ChartPin, ChartInterval } from '../types/index';
import { parseCsvFiles } from '../utils/csvParser';
import { aggregateLogDataToPowerCurve } from '../utils/aggregator';

type Theme = 'light' | 'dark';

export type LogFilters = Partial<Record<keyof Omit<TurbineEvent, 'id' | 'timestamp' | 'description' | 'power' | 'windSpeed'>, string[]>>;
export type LightweightLogEvent = Pick<TurbineEvent, 'timestamp' | 'status' | 'eventType'>;

interface AppState {
  stagedFiles: File[];
  logEvents: TurbineEvent[];
  powerCurveData: PowerCurvePoint[];
  lightweightLogEvents: LightweightLogEvent[];
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
  isFilterModalOpen: boolean;
  logFilters: LogFilters;
  tempLogFilters: LogFilters;
  selectedChartTimestamp: Date | null;
  lastTooltipFormat: 'detailed' | 'simple' | null;
  selectedFaultCategory: string | null;
  faultChartMode: 'count' | 'downtime';
  chartMode: 'normal' | 'interval' | 'pin';
  chartPins: ChartPin[];
  chartIntervals: ChartInterval[];
  pendingInterval: { startTimestamp: Date } | null;
  commentLogSelections: TurbineEvent[];
  targetLogIds: Set<string>; // YENİ: Hedef log ID'lerini tutmak için.
  addStagedFile: (file: File) => void;
  removeStagedFile: (fileName: string) => void;
  processStagedFiles: () => Promise<{ success: boolean; message: string }>;
  setDateRange: (range: { start: Date; end: Date }) => void;
  setMetrics: (newMetrics: Metrics) => void;
  setLegendSelected: (selected: Record<string, boolean>) => void;
  addComment: (comment: Omit<Comment, 'id' | 'createdAt'>) => void;
  setNewCommentSelection: (selection: CommentSelection | null) => void;
  toggleTheme: () => void;
  setIsLoading: (loading: boolean) => void;
  openFilterModal: () => void;
  closeFilterModal: () => void;
  setTempLogFilters: (filters: LogFilters) => void;
  applyLogFilters: () => void;
  resetLogFilters: () => void;
  setSelectedChartTimestamp: (timestamp: Date | null) => void;
  setLastTooltipFormat: (format: 'detailed' | 'simple' | null) => void;
  setSelectedFaultCategory: (category: string | null) => void;
  setFaultChartMode: (mode: 'count' | 'downtime') => void;
  setChartMode: (mode: 'normal' | 'interval' | 'pin') => void;
  addChartPin: (pin: ChartPin) => void;
  removeChartPin: (pinId: string) => void;
  addChartInterval: (interval: ChartInterval) => void;
  removeChartInterval: (intervalId: string) => void;
  setPendingInterval: (interval: { startTimestamp: Date } | null) => void;
  clearChartSelections: () => void;
  loadCommentSelectionsToChart: (commentId: number) => void;
  toggleLogCommentSelection: (log: TurbineEvent) => void;
  toggleTargetLog: (logId: string) => void; // YENİ: Hedef log seçme/kaldırma eylemi.
}

const withMinimumLoading = async (action: () => Promise<unknown>) => {
  const minLoadingTime = 500;
  const startTime = Date.now();
  try {
    return await action();
  } finally {
    const elapsedTime = Date.now() - startTime;
    if (elapsedTime < minLoadingTime) {
      await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime));
    }
  }
};

export const useAppStore = create<AppState>((set, get) => ({
  stagedFiles: [],
  logEvents: [],
  powerCurveData: [],
  lightweightLogEvents: [],
  dateRange: { start: null, end: null },
  metrics: { operationalAvailability: 0, technicalAvailability: 0, mtbf: 0, mttr: 0, reliabilityR: 0 },
  legendSelected: { 'Power (kW)': true, 'Expected Power (kW)': true, 'Wind Speed (m/s)': true, 'Fault': true, 'Safety Critical Fault': true },
  comments: [],
  newCommentSelection: null,
  theme: 'light',
  isLoading: false,
  isFilterModalOpen: false,
  logFilters: {},
  tempLogFilters: {},
  selectedChartTimestamp: null,
  lastTooltipFormat: null,
  selectedFaultCategory: null,
  faultChartMode: 'count',
  chartMode: 'normal',
  chartPins: [],
  chartIntervals: [],
  pendingInterval: null,
  commentLogSelections: [],
  targetLogIds: new Set<string>(), // YENİ: Başlangıç değeri.

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
    if (stagedFiles.length === 0) {
      return { success: false, message: "No files selected for processing." };
    }
    
    set({ isLoading: true });
    
    let result: { success: boolean; message: string } = { success: false, message: "An unknown error occurred." };

    await withMinimumLoading(async () => {
      try {
        const { logs: parsedLogs, power: parsedPower, lightweightLogs: parsedLightweightLogs } = await parseCsvFiles(stagedFiles);
        const logs = parsedLogs;
        let power = parsedPower;
        const lightweightLogs = parsedLightweightLogs;

        if (logs.length > 0 && power.length === 0) {
          power = aggregateLogDataToPowerCurve(logs);
        }

        if (logs.length === 0 && power.length === 0) {
          result = { success: false, message: "Could not recognize file formats or files are empty." };
          return;
        }
        
        const allTimestamps = [...power.map(p => p.timestamp), ...logs.map(l => l.timestamp)].filter(Boolean) as Date[];
        let earliest = null, latest = null;
        if (allTimestamps.length > 0) {
            earliest = new Date(Math.min(...allTimestamps.map(d => d.getTime())));
            latest = new Date(Math.max(...allTimestamps.map(d => d.getTime())));
        }
        
        set({
          logEvents: logs,
          powerCurveData: power,
          lightweightLogEvents: lightweightLogs,
          stagedFiles: [],
          dateRange: { start: earliest, end: latest },
          comments: [],
          logFilters: {},
          tempLogFilters: {},
          chartPins: [],
          chartIntervals: [],
          pendingInterval: null,
          commentLogSelections: [],
          targetLogIds: new Set<string>(), // GÜNCELLENDİ: Yeni dosyalar işlendiğinde hedef listesini sıfırla.
        });
        result = { success: true, message: "Files processed successfully." };
      } catch (error) {
        result = { success: false, message: error instanceof Error ? error.message : "An unknown error occurred." };
      }
    });

    set({ isLoading: false });
    return result;
  },

  setDateRange: (range) => set({ dateRange: range }),
  setMetrics: (newMetrics) => set({ metrics: newMetrics }),
  setLegendSelected: (selected) => set({ legendSelected: selected }),
  
  addComment: (comment) => set(state => {
    const { chartPins, chartIntervals, commentLogSelections } = state;
    const newComment: Comment = {
      ...comment,
      id: Date.now(),
      createdAt: new Date(),
      pins: chartPins.length > 0 ? [...chartPins] : undefined,
      intervals: chartIntervals.length > 0 ? [...chartIntervals] : undefined,
      logs: commentLogSelections.length > 0 ? [...commentLogSelections] : undefined,
    };
    return { 
      comments: [...state.comments, newComment],
      chartPins: [],
      chartIntervals: [],
      pendingInterval: null,
      chartMode: 'normal',
      commentLogSelections: [],
    };
  }),

  setNewCommentSelection: (selection) => set({ newCommentSelection: selection }),
  toggleTheme: () => set(state => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
  setIsLoading: (loading) => set({ isLoading: loading }),
  openFilterModal: () => set(state => ({ isFilterModalOpen: true, tempLogFilters: state.logFilters })),
  closeFilterModal: () => set({ isFilterModalOpen: false }),
  setTempLogFilters: (filters) => set({ tempLogFilters: filters }),
  applyLogFilters: () => set(state => ({ logFilters: state.tempLogFilters })),
  resetLogFilters: () => set({ logFilters: {}, tempLogFilters: {} }),
  setSelectedChartTimestamp: (timestamp) => set({ selectedChartTimestamp: timestamp }),
  setLastTooltipFormat: (format) => set({ lastTooltipFormat: format }),
  setSelectedFaultCategory: (category) => set({ selectedFaultCategory: category }),
  setFaultChartMode: (mode) => set({ faultChartMode: mode }),
  
  setChartMode: (mode) => set({ chartMode: mode }),
  addChartPin: (pin) => set(state => ({ chartPins: [...state.chartPins, pin] })),
  removeChartPin: (pinId) => set(state => ({ chartPins: state.chartPins.filter(p => p.id !== pinId) })),
  addChartInterval: (interval) => set(state => ({ chartIntervals: [...state.chartIntervals, interval] })),
  removeChartInterval: (intervalId) => set(state => ({ chartIntervals: state.chartIntervals.filter(i => i.id !== intervalId) })),
  setPendingInterval: (interval) => set({ pendingInterval: interval }),
  clearChartSelections: () => set({ chartPins: [], chartIntervals: [], pendingInterval: null, chartMode: 'normal' }),
  loadCommentSelectionsToChart: (commentId: number) => set(state => {
    const comment = state.comments.find(c => c.id === commentId);
    if (!comment) return state;
    
    const newPins = comment.pins ? [...comment.pins] : [];
    const newIntervals = comment.intervals ? [...comment.intervals] : [];
    
    return {
      chartPins: [...state.chartPins, ...newPins],
      chartIntervals: [...state.chartIntervals, ...newIntervals],
    };
  }),

  toggleLogCommentSelection: (log) => set(state => {
    const isSelected = state.commentLogSelections.some(selectedLog => selectedLog.id === log.id);
    const newSelections = isSelected
      ? state.commentLogSelections.filter(selectedLog => selectedLog.id !== log.id)
      : [...state.commentLogSelections, log];
    return { commentLogSelections: newSelections };
  }),

  toggleTargetLog: (logId: string) => set(state => {
    const newTargetLogIds = new Set(state.targetLogIds);
    if (newTargetLogIds.has(logId)) {
      newTargetLogIds.delete(logId);
    } else {
      newTargetLogIds.add(logId);
    }
    return { targetLogIds: newTargetLogIds };
  }),
}));