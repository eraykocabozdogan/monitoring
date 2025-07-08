// src/components/CriticalLogs/index.tsx
import React from 'react';
import styles from './CriticalLogs.module.css';

const CriticalLogs: React.FC = () => {
  return (
    <div className={styles.logsCard}>
      <h2 className={styles.title}>Critical Logs</h2>
      
      {/* Tabloyu, esneyip büyüyebilen bir konteyner içine alıyoruz */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            {/* Örnek veriler */}
            <tr>
              <td>Jan 3, 2024</td>
              <td>08:00</td>
              <td>Yaw system fault</td>
            </tr>
            <tr>
              <td>Jan 3, 2024</td>
              <td>09:30</td>
              <td>Power limitation mode activated</td>
            </tr>
            <tr>
              <td>Jan 3, 2024</td>
              <td>11:15</td>
              <td>Grid loss detected</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CriticalLogs;