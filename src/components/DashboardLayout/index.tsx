import type { ReactNode } from 'react';
import styles from './DashboardLayout.module.css';
import ThemeToggleButton from '../ThemeToggleButton';
// YENİ: assets klasöründen logonuzu import edin
import logo from '../../assets/logo.png';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {/* YENİ: Logo ve başlığı bir arada tutan bir grup oluşturduk */}
        <div className={styles.titleGroup}>
          <img src={logo} alt="FU Enerji Logo" className={styles.headerLogo} />
          <h1 className={styles.title}>Wind Turbine Monitoring</h1>
        </div>
        <ThemeToggleButton />
      </div>
      {children}
    </div>
  );
};

export default DashboardLayout;