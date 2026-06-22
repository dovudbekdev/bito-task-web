import { LoginForm } from '../components/LoginForm';
import styles from './LoginPage.module.css';

export function LoginPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>BITO POS</h1>
          <p className={styles.subtitle}>Tizimga kirish</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
