import { useState } from 'react';
const styles: Record<string, string> = {};
import { useAuthStore } from '../store/useAuthStore';
import { API } from '../api';

export default function AuthView() {
  const setAuth = useAuthStore(state => state.setAuth);
  
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !pin) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setIsLoading(true);

    // Wywołanie odpowiedniego endpointu przez naszego klienta API
    const response = isLoginMode 
      ? await API.login(name, pin) 
      : await API.signup(name, pin);

    setIsLoading(false);

    if (response.ok && response.data) {
      // Zapisujemy prawdziwe dane w Zustand (który zrzuci je do LocalStorage)
      setAuth(response.data.userId, response.data.name, response.data.token);
    } else {
      setError(response.error || 'Authentication failed');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconContainer}>
          <img src="/img/icon-512.png" alt="Gym Tracker" className={styles.logo} />
        </div>
        
        <h1 className={styles.title}>{isLoginMode ? 'Welcome Back' : 'Create Account'}</h1>
        <p className={styles.subtitle}>
          {isLoginMode ? 'Enter your details to access your workouts.' : 'Sign up to start tracking your progress.'}
        </p>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Username</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="e.g. Stefan"
              autoCapitalize="off"
            />
          </div>

          <div className={styles.inputGroup}>
            <label>PIN</label>
            <input 
              type="password" 
              inputMode="numeric"
              pattern="[0-9]*"
              value={pin} 
              onChange={(e) => setPin(e.target.value)} 
              placeholder="Enter PIN"
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? 'Connecting...' : (isLoginMode ? 'Login' : 'Sign Up')}
          </button>
        </form>

        <button 
          type="button" 
          className={styles.toggleBtn}
          onClick={() => {
            setIsLoginMode(!isLoginMode);
            setError('');
          }}
        >
          {isLoginMode ? "Don't have an account? Sign Up" : "Already have an account? Login"}
        </button>
      </div>
    </div>
  );
}