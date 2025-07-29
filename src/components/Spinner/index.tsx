import React from 'react';
import styles from './Spinner.module.css';
// YENİ: Logoyu iki parça olarak import edin
import logoBackground from '../../assets/logo-background.png';
import logoBlades from '../../assets/logo-blades.png';

const Spinner: React.FC = () => {
  return (
    <div className={styles.overlay}>
      {/* YENİ: İki resmi bir arada tutan konteyner */}
      <div className={styles.spinnerContainer}>
        <img src={logoBackground} className={styles.logoBackground} alt="FU Enerji" />
        <img src={logoBlades} className={styles.logoBlades} alt="Dönüyor..." />
      </div>
      <p className={styles.text}>Processing Data...</p>
    </div>
  );
};

export default Spinner;