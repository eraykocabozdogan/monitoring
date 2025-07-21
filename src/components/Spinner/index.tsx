import React from 'react';
import styles from './Spinner.module.css';

const Spinner: React.FC = () => {
  return (
    <div className={styles.overlay}>
      <div className={styles.spinner}></div>
      <p className={styles.text}>Processing Data...</p>
    </div>
  );
};

export default Spinner;