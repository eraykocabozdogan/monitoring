# Turbine Data Worker Implementation

## Overview
The `turbineData.worker.ts` file implements a Web Worker for processing CSV data from turbine monitoring systems. This worker handles heavy data processing tasks in a separate thread to prevent blocking the main UI thread.

## Features

### 1. CSV Data Processing
- **File Input**: Accepts CSV files via the main thread
- **Papa Parse Integration**: Uses Papa Parse library with `header: true` and `skipEmptyLines: true` options
- **Data Validation**: Validates and converts numerical data (power, wind speed) to Number type
- **Error Handling**: Skips invalid data rows and continues processing

### 2. KPI Calculations
The worker calculates key performance indicators based on the processed data:

#### Availability
```
Availability = (Total Operating Time - Total Downtime) / Total Operating Time * 100
```

#### Reliability
```
Reliability = (Total Operating Time - Fault Downtime) / Total Operating Time * 100
```

### 3. Data Transformation
The worker transforms raw CSV data into structured formats:

#### Chart Data
```typescript
{
  timestamps: string[],
  power: number[],
  windSpeed: number[]
}
```

#### Logs
```typescript
{
  timestamp: string,
  message: string,
  category: string
}[]
```
- Filters only 'Fault' and 'Warning' categories
- Provides structured log entries for alert display

#### KPI Metrics
```typescript
{
  availability: number,
  reliability: number
}
```

## Usage

### 1. Using the Worker Hook
```typescript
import { useWorker } from '../hooks/useWorker'

const { processCSVFile } = useWorker()

const handleFileUpload = async (file: File) => {
  try {
    const processedData = await processCSVFile(file)
    // Handle processed data
  } catch (error) {
    // Handle error
  }
}
```

### 2. Direct Worker Usage
```typescript
const worker = new Worker(
  new URL('../workers/turbineData.worker.ts', import.meta.url),
  { type: 'module' }
)

worker.postMessage({ file: csvFile })
worker.onmessage = (event) => {
  if (event.data.success) {
    console.log('Processed data:', event.data.data)
  } else {
    console.error('Error:', event.data.error)
  }
}
```

## CSV Data Format

The worker expects CSV files with the following columns:

### Required Fields
- `timestamp`: Date and time of the data point
- `power`: Power output (will be converted to number)
- `wind speed` (or `wind_speed`, `windSpeed`): Wind speed measurement

### Optional Fields
- `status`: Turbine status (online, offline, maintenance)
- `category`: Event category (fault, warning, info)
- `message`: Event description
- `downtime`: Total downtime hours
- `fault_downtime`: Fault-related downtime hours

### Example CSV Format
```csv
timestamp,power,wind speed,status,category,message,downtime,fault_downtime
2024-01-01 00:00:00,1.2,15.5,online,info,System started,0,0
2024-01-01 01:00:00,1.8,18.2,online,info,Normal operation,0,0
2024-01-01 02:00:00,0.9,12.1,maintenance,warning,Scheduled maintenance,1,0
```

## Error Handling

The worker implements comprehensive error handling:
- **Invalid CSV**: Returns error message for malformed CSV files
- **Missing Data**: Skips rows with missing required fields
- **Type Conversion**: Handles invalid numerical data gracefully
- **Processing Errors**: Catches and reports processing exceptions

## Performance Considerations

- **Non-blocking**: Runs in a separate thread to prevent UI blocking
- **Memory Efficient**: Processes data in chunks to handle large files
- **Error Recovery**: Continues processing even if individual rows fail
- **Validation**: Validates data before processing to prevent errors

## Integration with UI Components

The worker integrates seamlessly with the `CSVUploader` component:

1. **File Upload**: User selects CSV file
2. **Worker Processing**: File is sent to worker for processing
3. **Progress Indication**: UI shows loading state during processing
4. **Results Display**: Processed data is displayed in charts and metrics
5. **Error Handling**: Errors are displayed to the user

## Testing

A sample CSV file (`sample-data.csv`) is provided for testing the worker functionality. The file contains:
- 24 hours of sample turbine data
- Various operational states (online, offline, maintenance)
- Different event categories (info, warning, fault)
- Realistic power and wind speed values

## Future Enhancements

Potential improvements for the worker:
- Support for additional CSV formats
- Real-time data streaming capabilities
- Advanced analytics and trend analysis
- Multiple turbine data correlation
- Historical data comparison
