// Dosya Yolu: src/components/DashboardLayout/index.tsx
import type { ReactNode } from 'react';
import styles from './DashboardLayout.module.css';
import ThemeToggleButton from '../ThemeToggleButton';
import logo from '../../assets/logo.png';
import { useAppStore } from '../../store/useAppStore';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { currentUser, logout } = useAppStore();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <img src={logo} alt="FU Enerji Logo" className={styles.headerLogo} />
          <h1 className={styles.title}>Wind Turbine Monitoring</h1>
        </div>
        <div className={styles.headerButtons}>
          {currentUser && (
            <div className={styles.userInfo}>
              <span className={styles.username}>{currentUser}</span>
              <button onClick={logout} className={styles.logoutButton}>Logout</button>
            </div>
          )}
          <ThemeToggleButton />
        </div>
      </div>
      {children}
    </div>
  );
};

export default DashboardLayout;