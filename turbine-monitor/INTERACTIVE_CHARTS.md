# Interactive Chart Implementation

## Overview
The TurbineChart component has been completely refactored to be fully interactive, with zoom/pan capabilities and real-time KPI recalculation based on the visible date range.

## Key Features

### 1. Interactive Zoom & Pan
- **Slider DataZoom**: Bottom slider for easy range selection
- **Inside DataZoom**: Mouse wheel zoom and drag to pan
- **Visual Feedback**: Custom handle styling and smooth transitions

### 2. Real-time KPI Recalculation
- **Automatic Updates**: KPIs recalculate when zoom range changes
- **Worker-based Processing**: Heavy calculations run in background
- **Responsive UI**: No blocking of main thread during calculations

### 3. Enhanced Visualization
- **Area Charts**: Gradient fill for better visual appeal
- **Mark Points**: Shows maximum and minimum values
- **Improved Tooltips**: Better formatting with units and timestamps
- **Responsive Design**: Adapts to different screen sizes

## Technical Implementation

### Component Interface
```typescript
interface TurbineChartProps {
  dataType: 'power' | 'windSpeed'  // Determines which data to display
  title: string                    // Chart title
  color?: string                   // Chart color theme
}
```

### Data Flow
```
User Zooms Chart → onDataZoom Event → Calculate New Date Range → 
Update Store → Send to Worker → Recalculate KPIs → Update UI
```

### Store Integration
The component integrates with `useTurbineStore` to:
- Read `fullData.chartData` for chart data
- Read `visibleDateRange` for current zoom state
- Update `visibleDateRange` when user zooms
- Update `filteredKpis` with recalculated values

### Worker Communication
The worker now handles two message types:

#### 1. CSV Processing
```typescript
{
  type: 'PROCESS_CSV',
  file: File
}
```

#### 2. KPI Recalculation
```typescript
{
  type: 'RECALCULATE',
  payload: {
    dateRange: { start: string, end: string },
    allLogs: LogEntry[]
  }
}
```

## Chart Configuration

### DataZoom Options
```typescript
dataZoom: [
  {
    type: 'slider',           // Bottom slider
    show: true,
    start: 0,                 // Start percentage
    end: 100,                 // End percentage
    handleIcon: 'path://...',  // Custom handle icon
    handleSize: '80%',
    handleStyle: { color: chartColor }
  },
  {
    type: 'inside',           // Mouse/touch zoom
    start: 0,
    end: 100
  }
]
```

### Enhanced Styling
- **Gradient Area Fill**: Creates depth and visual appeal
- **Custom Mark Points**: Highlights min/max values automatically
- **Responsive Grid**: Adapts to container size
- **Professional Tooltips**: Shows formatted timestamps and values with units

## KPI Recalculation Logic

### Date Range Filtering
```typescript
const filteredLogs = allLogs.filter(log => 
  log.timestamp >= dateRange.start && 
  log.timestamp <= dateRange.end
)
```

### KPI Calculation Method
```typescript
// Calculate based on log frequency and severity
const faultHours = faultLogs.length * 0.5    // Each fault = 0.5h downtime
const warningHours = warningLogs.length * 0.1 // Each warning = 0.1h impact

const availability = ((totalHours - totalDowntime) / totalHours) * 100
const reliability = ((totalHours - faultDowntime) / totalHours) * 100
```

## Performance Optimizations

### 1. Worker-based Processing
- Heavy KPI calculations run in background
- Main UI thread remains responsive
- Parallel processing for multiple operations

### 2. Efficient Data Handling
- Only necessary data sent to worker
- Minimal DOM updates during zoom
- Cached calculations where possible

### 3. Optimized Rendering
- ECharts handles large datasets efficiently
- Smooth animations for better UX
- Debounced zoom events to prevent excessive calculations

## Usage Examples

### Basic Usage
```typescript
<TurbineChart
  dataType="power"
  title="Power Output (MW)"
  color="#3b82f6"
/>
```

### In ChartsPanel
```typescript
export const ChartsPanel = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <TurbineChart dataType="power" title="Power Output (MW)" color="#3b82f6" />
      <TurbineChart dataType="windSpeed" title="Wind Speed (m/s)" color="#10b981" />
    </div>
  )
}
```

## Error Handling

### Chart Level
- Graceful degradation when no data available
- Error boundaries for worker communication failures
- Fallback UI states for loading and error conditions

### Worker Level
- Validation of date ranges before processing
- Error messages for invalid data
- Recovery from calculation failures

## Future Enhancements

### Potential Improvements
1. **Custom Date Range Picker**: Manual date range selection
2. **Multiple Chart Types**: Bar, scatter, heatmap options
3. **Export Functionality**: Save charts as images or PDFs
4. **Real-time Updates**: Live data streaming from APIs
5. **Comparative Analysis**: Multiple turbine comparison
6. **Advanced Analytics**: Trend analysis and forecasting

### Performance Improvements
1. **Data Virtualization**: Handle very large datasets
2. **Progressive Loading**: Load data in chunks
3. **Smart Caching**: Cache calculated KPIs
4. **Optimized Workers**: Shared worker for multiple charts

## Testing

The interactive chart system supports:
- ✅ Zoom and pan operations
- ✅ Real-time KPI updates
- ✅ Multiple chart instances
- ✅ Worker-based calculations
- ✅ Error handling and recovery
- ✅ Responsive design
- ✅ Cross-browser compatibility

## Browser Compatibility

- **Modern Browsers**: Full feature support
- **Web Workers**: Required for KPI calculations
- **ECharts**: Handles rendering compatibility
- **Touch Devices**: Mobile zoom/pan support
