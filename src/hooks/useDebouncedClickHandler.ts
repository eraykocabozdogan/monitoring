import { useRef, useCallback } from 'react';
import type { ChartInterval, ChartPin } from '../types';
import { calculateGridCoordinates } from '../utils/chartUtils';

interface ClickHandlerParams {
  chartMode: 'normal' | 'interval' | 'pin';
  pendingInterval: { startTimestamp: Date } | null;
  dateRange: { start: Date | null; end: Date | null };
  exactDisplayedTimestamp: React.MutableRefObject<Date | null>;
  currentAxisPointerTimestamp: React.MutableRefObject<Date | null>;
  lastTooltipTimestamp: React.MutableRefObject<Date | null>;
  findStableTimestamp: (timestamp: Date) => Date;
  setSelectedChartTimestamp: (timestamp: Date | null) => void;
  addChartPin: (pin: ChartPin) => void;
  addChartInterval: (interval: ChartInterval) => void;
  setPendingInterval: (interval: { startTimestamp: Date } | null) => void;
  createChartPin: (timestamp: Date) => ChartPin;
  generateId: () => string;
}

export const useDebouncedClickHandler = ({
  chartMode,
  pendingInterval,
  dateRange,
  exactDisplayedTimestamp,
  currentAxisPointerTimestamp,
  lastTooltipTimestamp,
  findStableTimestamp,
  setSelectedChartTimestamp,
  addChartPin,
  addChartInterval,
  setPendingInterval,
  createChartPin,
  generateId,
}: ClickHandlerParams) => {
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const getClickTimestamp = useCallback((params: unknown): Date | null => {
    const typedParams = params as {
      manualTrigger?: boolean;
      calculatedTimestamp?: Date;
      data?: unknown[];
      value?: unknown[];
      event?: { offsetX: number; offsetY: number };
    };

    // Check if this is a manual trigger with calculated timestamp
    if (typedParams.manualTrigger && typedParams.calculatedTimestamp) {
      return typedParams.calculatedTimestamp;
    }

    // Use exact displayed timestamp for perfect consistency
    if (exactDisplayedTimestamp.current) {
      return exactDisplayedTimestamp.current;
    }

    if (currentAxisPointerTimestamp.current) {
      return currentAxisPointerTimestamp.current;
    }

    if (lastTooltipTimestamp.current) {
      return lastTooltipTimestamp.current;
    }

    // Original ECharts event handling as last fallback
    if (typedParams.data && Array.isArray(typedParams.data) && typedParams.data[0]) {
      return new Date(typedParams.data[0] as number);
    }

    if (typedParams.value && Array.isArray(typedParams.value) && typedParams.value[0]) {
      return new Date(typedParams.value[0] as number);
    }

    return null;
  }, []);

  const handleChartClick = useCallback((params: unknown, chartRef?: React.RefObject<{ getEchartsInstance: () => unknown }>) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    let clickedTimestamp = getClickTimestamp(params);

    // If no timestamp found and we have chart ref, try coordinate conversion
    if (!clickedTimestamp && chartRef?.current) {
      const typedParams = params as { event?: { offsetX: number; offsetY: number } };
      
      if (typedParams.event) {
        try {
          const echartsInstance = chartRef.current.getEchartsInstance() as {
            isDisposed: () => boolean;
            convertFromPixel: (grid: string, point: [number, number]) => [number, number] | null;
            getOption: () => { grid: Array<{ left?: string | number; right?: string | number; bottom?: string | number }> };
            getWidth: () => number;
            getHeight: () => number;
          };

          if (!echartsInstance.isDisposed()) {
            const pointInPixel: [number, number] = [typedParams.event.offsetX, typedParams.event.offsetY];
            const pointInGrid = echartsInstance.convertFromPixel('grid', pointInPixel);

            if (pointInGrid?.[0]) {
              const rawTimestamp = new Date(pointInGrid[0]);
              clickedTimestamp = findStableTimestamp(rawTimestamp);
            } else {
              // Manual calculation fallback
              const option = echartsInstance.getOption();
              const grid = option.grid[0];
              const chartWidth = echartsInstance.getWidth();
              const chartHeight = echartsInstance.getHeight();

              const gridCoords = calculateGridCoordinates(
                typedParams.event.offsetX,
                typedParams.event.offsetY,
                chartWidth,
                chartHeight,
                grid
              );

              if (gridCoords && dateRange.start && dateRange.end) {
                const timeRange = dateRange.end.getTime() - dateRange.start.getTime();
                const calculatedTime = dateRange.start.getTime() + (gridCoords.relativeX * timeRange);
                const rawTimestamp = new Date(calculatedTime);
                clickedTimestamp = findStableTimestamp(rawTimestamp);
              }
            }
          }
        } catch (error) {
          console.warn('Grid click coordinate conversion failed:', error);
        }
      }
    }

    if (!clickedTimestamp) return;

    debounceTimer.current = setTimeout(() => {
      if (chartMode === 'pin') {
        const pin = createChartPin(clickedTimestamp!);
        addChartPin(pin);
      } else if (chartMode === 'interval') {
        if (!pendingInterval) {
          setPendingInterval({ startTimestamp: clickedTimestamp! });
        } else {
          const startTime = pendingInterval.startTimestamp.getTime();
          const endTime = clickedTimestamp!.getTime();

          const interval: ChartInterval = {
            id: generateId(),
            startTimestamp: startTime < endTime ? pendingInterval.startTimestamp : clickedTimestamp!,
            endTimestamp: startTime < endTime ? clickedTimestamp! : pendingInterval.startTimestamp,
          };

          addChartInterval(interval);
          setPendingInterval(null);
        }
      } else {
        setSelectedChartTimestamp(clickedTimestamp!);
      }
    }, 100);
  }, [
    chartMode,
    pendingInterval,
    dateRange,
    findStableTimestamp,
    getClickTimestamp,
    createChartPin,
    addChartPin,
    addChartInterval,
    setPendingInterval,
    setSelectedChartTimestamp,
    generateId,
  ]);

  return { handleChartClick };
};
