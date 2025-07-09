// src/components/KpiCard/index.tsx
import React from 'react';
import styles from './KpiCard.module.css';

interface KpiCardProps {
  title: string;
  value: number; // Artık sadece number bekliyor
  unit?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, unit }) => {
  // Gelen değerin geçerli ve sonlu bir sayı olup olmadığını kontrol et
  const displayValue = typeof value === 'number' && isFinite(value) 
    ? value.toFixed(1) // Sadece geçerli, sonlu sayıyı formatla
    : '--'; // Geçersizse veya Infinity ise '--' göster

  return (
    <div className={styles.kpiCard}>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.value}>
        {displayValue}
        {unit && <span className={styles.unit}> {unit}</span>}
      </p>
    </div>
  );
};

export default KpiCard;