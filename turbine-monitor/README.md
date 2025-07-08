# Turbine Monitor

A real-time monitoring system for wind turbines built with React, TypeScript, and Vite.

## Features

- **Real-time Monitoring**: Track turbine performance, power output, and efficiency
- **Interactive Charts**: Visualize data with ECharts integration
- **Data Management**: Import/export CSV data with PapaParse
- **State Management**: Zustand for efficient state management
- **Modern UI**: Beautiful interface with Tailwind CSS
- **TypeScript**: Full type safety throughout the application

## Tech Stack

- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Charts**: ECharts with echarts-for-react
- **State Management**: Zustand
- **Data Processing**: PapaParse for CSV handling
- **Development**: ESLint for code quality

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── TurbineCard.tsx
│   ├── TurbineChart.tsx
│   └── index.ts
├── features/           # Feature-specific components
├── hooks/              # Custom React hooks
│   └── useMonitoring.ts
├── services/           # API and external services
│   └── api.ts
├── store/              # Zustand store configuration
│   ├── monitoring.ts
│   └── index.ts
├── types/              # TypeScript type definitions
│   └── index.ts
├── utils/              # Utility functions
│   └── helpers.ts
├── workers/            # Web Workers for heavy computations
│   └── dataProcessor.js
├── App.tsx
├── main.tsx
└── index.css
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

Create a production build:
```bash
npm run build
```

### Preview

Preview the production build:
```bash
npm run preview
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Key Components

### TurbineCard
Displays individual turbine information including status, power output, and efficiency metrics.

### TurbineChart
Interactive chart component using ECharts to visualize turbine data over time.

### useMonitoring Hook
Custom hook that manages the monitoring data state and provides loading/error states.

### Data Processing Worker
Web Worker for handling heavy data calculations without blocking the main thread.

## State Management

The application uses Zustand for state management with the following features:
- Centralized monitoring data store
- Turbine update operations
- Alert management
- Loading and error states

## Data Types

The application defines comprehensive TypeScript interfaces for:
- `TurbineData`: Individual turbine information
- `MonitoringData`: Overall system data
- `Alert`: System alerts and notifications
- `ChartData`: Chart visualization data
- `CSVData`: CSV import/export data

## Styling

The project uses Tailwind CSS for styling with:
- Responsive design
- Modern color scheme
- Consistent spacing and typography
- Hover states and transitions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.
