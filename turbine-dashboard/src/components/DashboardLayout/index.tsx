import type { ReactNode } from 'react';
import styles from './DashboardLayout.module.css';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Rüzgar Türbini İzleme Paneli</h1>
      </div>
      {children}
    </div>
  );
};

export { styles };
export default DashboardLayout;
