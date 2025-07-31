import React, { useMemo } from 'react';
import { useAppStore, type LogFilters } from '../../store/useAppStore';
import type { TurbineEvent } from '../../types';
import styles from './FilterModal.module.css';

const FilterModal: React.FC = () => {
  const {
    logEvents,
    tempLogFilters,
    setTempLogFilters,
    applyLogFilters,
    closeFilterModal,
  } = useAppStore();

  const uniqueFilterOptions = useMemo(() => {
    const options: Partial<Record<keyof TurbineEvent, Set<string>>> = {
      status: new Set(),
      name: new Set(),
      eventType: new Set(),
      description: new Set(),
      category: new Set(),
      ccuEvent: new Set(),
    };

    const filterableKeys: (keyof TurbineEvent)[] = ['status', 'name', 'eventType', 'category', 'ccuEvent'];

    logEvents.forEach(log => {
      filterableKeys.forEach(key => {
        const value = log[key];
        if (value && typeof value === 'string') {
          options[key]?.add(value);
        }
      });
    });

    const sortedOptions: Record<string, string[]> = {};
    for (const key of filterableKeys) {
      const set = options[key];
      if (set) {
        sortedOptions[key] = Array.from(set).sort();
      }
    }
    return sortedOptions;
  }, [logEvents]);

  const handleCheckboxChange = (category: keyof TurbineEvent, value: string) => {
    if (category === 'timestamp' || category === 'description' || category === 'power' || category === 'windSpeed') return;
    
    const categoryKey = category as keyof LogFilters;
    const currentFilters = tempLogFilters[categoryKey] || [];
    const newFilters = currentFilters.includes(value)
      ? currentFilters.filter((item: string) => item !== value)
      : [...currentFilters, value];
    
    setTempLogFilters({
      ...tempLogFilters,
      [categoryKey]: newFilters,
    });
  };

  const handleApply = () => {
    applyLogFilters();
    closeFilterModal();
  };

  const handleClearAll = () => {
    setTempLogFilters({});
  };

  return (
    <div className={styles.overlay} onClick={closeFilterModal}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Filter Logs</h2>
          <button onClick={closeFilterModal} className={styles.closeButton}>&times;</button>
        </div>
        <div className={styles.content}>
          {Object.entries(uniqueFilterOptions).map(([category, values]) => (
            <div key={category} className={styles.filterGroup}>
              <h3 className={styles.categoryTitle}>{category.charAt(0).toUpperCase() + category.slice(1)}</h3>
              <div className={styles.optionsContainer}>
                {values.length > 0 ? values.map(value => (
                  <label key={value} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={(() => {
                        const categoryKey = category as keyof LogFilters;
                        return (tempLogFilters[categoryKey] || []).includes(value);
                      })()}
                      onChange={() => handleCheckboxChange(category as keyof TurbineEvent, value)}
                    />
                    <span>{value}</span>
                  </label>
                )) : <p className={styles.noOptions}>No options available</p>}
              </div>
            </div>
          ))}
        </div>
        <div className={styles.footer}>
          <button onClick={closeFilterModal} className={`${styles.button} ${styles.cancelButton}`}>Cancel</button>
          <button onClick={handleClearAll} className={`${styles.button} ${styles.clearButton}`}>Clear All Selections</button>
          <button onClick={handleApply} className={`${styles.button} ${styles.applyButton}`}>Apply Filters</button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;