// src/components/KpiCard/index.tsx
import React from 'react';
import styles from './KpiCard.module.css';

interface KpiCardProps {
  title: string;
  value: number; 
  unit?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, unit }) => {
  const displayValue = typeof value === 'number' && isFinite(value) 
    ? value.toFixed(1) 
    : '--';

  return (
    <div className={styles.kpiCard}> {/* .card -> .kpiCard olarak güncellendi */}
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.value}>
        {displayValue}
        {unit && <span className={styles.unit}> {unit}</span>}
      </p>
    </div>
  );
};

export default React.memo(KpiCard);