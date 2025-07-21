import type { ReactNode } from 'react';
import styles from './DashboardLayout.module.css';
import ThemeToggleButton from '../ThemeToggleButton'; // Butonu import et

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Wind Turbine Monitoring</h1>
        <ThemeToggleButton /> {/* Butonu başlığa ekle */}
      </div>
      {children}
    </div>
  );
};

export { styles };
export default DashboardLayout;