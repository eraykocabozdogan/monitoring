import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import styles from './Login.module.css';
import logo from '../../assets/logo.png';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useAppStore(state => state.login);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Kural: Giriş yapmak için sadece username alanının dolu olması yeterli.
    if (username.trim()) {
      setError('');
      login(username.trim());
    } else {
      setError('Username is required.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <img src={logo} alt="FU Enerji Logo" className={styles.logo} />
        <h1 className={styles.title}>Wind Turbine Monitoring</h1>
        <p className={styles.subtitle}>Please sign in to continue</p>
        <form onSubmit={handleLogin} className={styles.form}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className={styles.input}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className={styles.input}
          />
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.button}>
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;