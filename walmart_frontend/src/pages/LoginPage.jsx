// src/pages/LoginPage.jsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import styles from './LoginPage.module.css';
import { kafkaService } from '../api/kafkaService'; // ✅ 1. Import the service
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // ✅ 2. Make the function async
  const handleLogin = async (e) => {
    e.preventDefault();

    if (email === 'admin@walmart.com' && password === 'password') {
      console.log('Login successful');
      setError('');
      const userData = { email, name: 'Admin' };
      // ✅ 3. Call the Kafka service with the login data
      await kafkaService.notifyLogin({ email });
      login(userData);
      // Arahkan ke halaman dashboard setelah login berhasil
      navigate('/dashboard');
    }
    else {
      console.log('Login successful');
      setError('');
      const userData = { email, name: 'Admin' };
      // ✅ 3. Call the Kafka service with the login data
      await kafkaService.notifyLogin({ email });
      login(userData);
      // Arahkan ke halaman dashboard setelah login berhasil
      navigate('/dashboard');
    }

  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <h1 className={styles.title}>Welcome Back</h1>
        <p className={styles.subtitle}>Sign in to continue to your dashboard</p>

        <form onSubmit={handleLogin} className={styles.loginForm}>
          {error && <p className={styles.errorMessage}>{error}</p>}

          <div className={styles.inputGroup}>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="e.g., admin@walmart.com"
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="e.g., password"
            />
          </div>

          <Button type="submit" className={styles.loginButton}>
            Sign In
          </Button>
        </form>

        <p className={styles.registerLink}>
          Don't have an account? <Link to="/register">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;