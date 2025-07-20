import React, { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
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

  // Log verilerinden her kategori için benzersiz değerleri çıkarır
  const uniqueFilterOptions = useMemo(() => {
    const options: Record<keyof TurbineEvent, Set<string>> = {
      status: new Set(),
      name: new Set(),
      eventType: new Set(),
      description: new Set(), // Genellikle çok fazla benzersiz değer içerir, dikkatli kullanılmalı
      category: new Set(),
      ccuEvent: new Set(),
      timestamp: new Set(), // Timestamp filtrelenmez
    };

    const filterableKeys: (keyof TurbineEvent)[] = ['status', 'name', 'eventType', 'category', 'ccuEvent'];

    logEvents.forEach(log => {
      filterableKeys.forEach(key => {
        const value = log[key];
        if (value && typeof value === 'string') {
          options[key].add(value);
        }
      });
    });

    // Set'leri sıralanmış array'lere dönüştür
    const sortedOptions: Record<string, string[]> = {};
    for (const key of filterableKeys) {
      sortedOptions[key] = Array.from(options[key]).sort();
    }
    return sortedOptions;
  }, [logEvents]);

  const handleCheckboxChange = (category: keyof TurbineEvent, value: string) => {
    const currentFilters = tempLogFilters[category] || [];
    const newFilters = currentFilters.includes(value)
      ? currentFilters.filter(item => item !== value)
      : [...currentFilters, value];
    
    setTempLogFilters({
      ...tempLogFilters,
      [category]: newFilters,
    });
  };

  const handleApply = () => {
    applyLogFilters();
    closeFilterModal();
  };

  return (
    <div className={styles.overlay} onClick={closeFilterModal}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Filter Critical Logs</h2>
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
                      checked={(tempLogFilters[category as keyof TurbineEvent] || []).includes(value)}
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
          <button onClick={handleApply} className={`${styles.button} ${styles.applyButton}`}>Apply Filters</button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;