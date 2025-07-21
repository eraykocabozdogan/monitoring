import type { ReactNode } from 'react';
import styles from './Sidebar.module.css';

interface SidebarProps {
  children: ReactNode;
}

const Sidebar = ({ children }: SidebarProps) => {
  return (
    <div className={styles.container}>
      {children}
    </div>
  );
};

export default Sidebar;
