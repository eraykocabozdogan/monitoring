import styles from './KpiCard.module.css';

interface KpiCardProps {
  title: string;
  value: string;
  variant?: 'default' | 'positive' | 'warning' | 'negative';
}

const KpiCard = ({ title, value, variant = 'default' }: KpiCardProps) => {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>{title}</h3>
      <p className={`${styles.value} ${variant !== 'default' ? styles[variant] : ''}`}>
        {value}
      </p>
    </div>
  );
};

export default KpiCard;
