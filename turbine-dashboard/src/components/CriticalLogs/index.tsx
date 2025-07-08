import styles from './CriticalLogs.module.css';

const CriticalLogs = () => {
  // Placeholder data for demonstration
  const logs = [
    {
      id: 1,
      date: '2025-01-08',
      time: '14:32:15',
      level: 'critical',
      message: 'Turbine #1 Power Output Below Threshold'
    },
    {
      id: 2,
      date: '2025-01-08',
      time: '14:28:42',
      level: 'warning',
      message: 'High Wind Speed Detected - Turbine #2'
    },
    {
      id: 3,
      date: '2025-01-08',
      time: '14:15:30',
      level: 'info',
      message: 'Maintenance Window Scheduled'
    },
    {
      id: 4,
      date: '2025-01-08',
      time: '13:45:18',
      level: 'critical',
      message: 'Gearbox Temperature Alarm - Turbine #3'
    },
    {
      id: 5,
      date: '2025-01-08',
      time: '13:22:05',
      level: 'warning',
      message: 'Low Wind Speed - Turbine #1'
    }
  ];

  const getLevelClass = (level: string) => {
    switch (level) {
      case 'critical':
        return styles.criticalLevel;
      case 'warning':
        return styles.warningLevel;
      case 'info':
        return styles.infoLevel;
      default:
        return '';
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Critical Logs</h2>
      <div className={styles.tableContainer}>
        {logs.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Level</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.date}</td>
                  <td>{log.time}</td>
                  <td className={getLevelClass(log.level)}>
                    {log.level.toUpperCase()}
                  </td>
                  <td>{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className={styles.emptyState}>
            No critical logs available
          </div>
        )}
      </div>
    </div>
  );
};

export default CriticalLogs;
