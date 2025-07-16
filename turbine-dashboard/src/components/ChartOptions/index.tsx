// src/components/ChartOptions/index.tsx
import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import styles from './ChartOptions.module.css';

const ChartOptions: React.FC = () => {
  const { chartEventFilters, setChartEventFilters } = useAppStore();

  const handleFilterChange = (filterName: string) => {
    setChartEventFilters({
      ...chartEventFilters,
      [filterName]: !chartEventFilters[filterName],
    });
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Grafik Seçenekleri</h3>
      <div className={styles.options}>
        <p className={styles.subtitle}>Olayları Göster:</p>
        {Object.keys(chartEventFilters).map(filterKey => (
          <label key={filterKey} className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={chartEventFilters[filterKey]}
              onChange={() => handleFilterChange(filterKey)}
            />
            <span>{filterKey.charAt(0).toUpperCase() + filterKey.slice(1)}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default React.memo(ChartOptions);