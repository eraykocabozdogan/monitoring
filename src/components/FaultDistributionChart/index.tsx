import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption, ECElementEvent } from 'echarts';
import { useAppStore } from '../../store/useAppStore';
import { calculateFaultCategoryDowntimes } from '../../utils/calculations';
import styles from './FaultDistributionChart.module.css';

const FaultDistributionChart: React.FC = () => {
  const { 
    logEvents, 
    theme, 
    dateRange, 
    selectedFaultCategory, 
    faultChartMode,
    logFilters,
    setSelectedFaultCategory,
    setFaultChartMode 
  } = useAppStore();

  const chartData = useMemo(() => {
    const filteredLogs = logEvents.filter(log => {
      if (!log.status || log.status !== 'ON' || !log.category || log.category === 'No Fault' || !log.timestamp) {
        return false;
      }
      if (dateRange.start && dateRange.end) {
        return log.timestamp >= dateRange.start && log.timestamp <= dateRange.end;
      }
      return true;
    });

    if (faultChartMode === 'count') {
      const categoryCounts = new Map<string, number>();
      filteredLogs.forEach(log => {
        const category = log.category || 'Unknown';
        categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
      });
      return Array.from(categoryCounts.entries()).map(([name, value]) => ({ name, value }));
    } else {
      const categoryDowntimes = calculateFaultCategoryDowntimes(logEvents, dateRange);
      return Array.from(categoryDowntimes.entries())
        .filter(([, value]) => value > 0)
        .map(([name, value]) => ({ 
          name, 
          value: Math.round(value * 100) / 100 
        }));
    }
  }, [logEvents, dateRange, faultChartMode]);

  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => { // Tooltip formatter for complex strings can remain flexible
        const unit = faultChartMode === 'count' ? 'events' : 'hours';
        return `${params.seriesName}<br/>${params.name}: ${params.value} ${unit} (${params.percent}%)`;
      },
    },
    color: [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
      '#f97316', '#06b6d4', '#84cc16', '#ec4899', '#6366f1',
      '#14b8a6', '#f43f5e', '#8b5a2b', '#7c3aed', '#059669',
      '#dc2626', '#0891b2', '#ca8a04', '#9333ea', '#0d9488'
    ],
    legend: {
      type: 'scroll',
      orient: 'vertical',
      left: '2%',
      top: '5%',
      bottom: '5%',
      width: '35%',
      data: chartData.map(d => d.name),
      textStyle: {
        color: theme === 'dark' ? '#f9fafb' : '#1f2937',
        fontSize: 10,
      },
      pageButtonItemGap: 5,
      pageButtonGap: 5,
      pageIconColor: theme === 'dark' ? '#f9fafb' : '#1f2937',
      pageIconInactiveColor: theme === 'dark' ? '#6b7280' : '#9ca3af',
      selected: (() => {
        if (selectedFaultCategory) {
          return Object.fromEntries(chartData.map(d => [d.name, d.name === selectedFaultCategory]));
        } else if (logFilters.category && logFilters.category.length > 0) {
          return Object.fromEntries(chartData.map(d => [d.name, logFilters.category!.includes(d.name)]));
        }
        return undefined;
      })(),
    },
    series: [
      {
        name: 'Fault Category',
        type: 'pie',
        radius: ['50%', '75%'],
        center: ['70%', '50%'],
        avoidLabelOverlap: false,
        label: { show: false, position: 'center' },
        emphasis: { 
          label: { 
            show: true, 
            fontSize: '16', 
            fontWeight: 'bold',
            formatter: (params: any) => {
              const unit = faultChartMode === 'count' ? 'events' : 'hrs';
              return `${params.name}\n${params.value} ${unit}`;
            }
          },
          scale: false,
          scaleSize: 0,
        },
        labelLine: { show: false },
        data: chartData.map(item => ({
          ...item,
          itemStyle: {
            borderWidth: selectedFaultCategory === item.name ? 4 : 0,
            borderColor: theme === 'dark' ? '#ffffff' : '#000000',
            opacity: 1,
          }
        })),
      },
    ],
  };
  
  const handleChartClick = (params: ECElementEvent) => {
    if (params.componentType === 'series' && params.name) {
      const clickedCategory = params.name as string;
      
      const currentFilters = useAppStore.getState().logFilters;
      if (currentFilters.category && currentFilters.category.length > 0) {
        const newFilters = { ...currentFilters };
        delete newFilters.category;
        useAppStore.getState().setTempLogFilters(newFilters);
        useAppStore.getState().applyLogFilters();
      }
      
      setSelectedFaultCategory(selectedFaultCategory === clickedCategory ? null : clickedCategory);
    }
  };

  const handleLegendSelectChanged = (params: { type: 'legendselectchanged', name: string, selected: Record<string, boolean> }) => {
    const selectedCategories = Object.keys(params.selected).filter(key => params.selected[key]);
    
    if (selectedFaultCategory) {
      setSelectedFaultCategory(null);
    }
    
    const currentFilters = useAppStore.getState().logFilters;
    const newFilters = {
      ...currentFilters,
      category: selectedCategories.length > 0 ? selectedCategories : undefined
    };
    
    useAppStore.getState().setTempLogFilters(newFilters);
    useAppStore.getState().applyLogFilters();
  };

  const toggleChartMode = () => {
    setFaultChartMode(faultChartMode === 'count' ? 'downtime' : 'count');
    setSelectedFaultCategory(null);
  };

  const handleClearFilter = () => {
    setSelectedFaultCategory(null);
    
    const currentFilters = useAppStore.getState().logFilters;
    if (currentFilters.category && currentFilters.category.length > 0) {
      const newFilters = { ...currentFilters };
      delete newFilters.category;
      useAppStore.getState().setTempLogFilters(newFilters);
      useAppStore.getState().applyLogFilters();
    }
  };
  
  if (logEvents.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          Fault distribution requires Event Log data.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h3 className={styles.chartTitle}>
            Fault Distribution {faultChartMode === 'count' ? '(Count)' : '(Hours)'}
          </h3>
          <p className={styles.chartSubtitle}>Click segments to filter logs</p>
        </div>
        <div className={styles.headerButtons}>
          <button 
            className={styles.toggleButton}
            onClick={toggleChartMode}
            title={`Switch to ${faultChartMode === 'count' ? 'downtime' : 'count'} view`}
          >
            {faultChartMode === 'count' ? '🕒 Show Downtime' : '📊 Show Count'}
          </button>
          {(selectedFaultCategory || (logFilters.category && logFilters.category.length > 0)) && (
            <button 
              className={styles.clearButton}
              onClick={handleClearFilter}
              title="Clear selection"
            >
              ✕ Clear Filter
            </button>
          )}
        </div>
      </div>
      <div className={styles.chartArea}>
        {chartData.length > 0 ? (
          <ReactECharts 
            option={option} 
            style={{ height: '100%', width: '100%' }}
            onEvents={{
              'click': handleChartClick,
              'legendselectchanged': handleLegendSelectChanged
            }}
          />
        ) : (
          <div className={styles.emptyState}>
            No fault data for selected period.
          </div>
        )}
      </div>
    </div>
  );
};

export default FaultDistributionChart;