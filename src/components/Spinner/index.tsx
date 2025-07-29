import React from 'react';
import styles from './Spinner.module.css';
import logoBackground from '../../assets/logo-background.png';
import logoBlades from '../../assets/logo-blades.png';

const Spinner: React.FC = () => {
  return (
    <div className={styles.overlay}>
      <div className={styles.spinnerContainer}>
        <img src={logoBackground} className={styles.logoBackground} alt="FU Enerji" />
        <img src={logoBlades} className={styles.logoBlades} alt="Loading..." />
      </div>
      <p className={styles.text}>Processing Data...</p>
    </div>
  );
};

export default Spinner;