import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

interface AuthViewProps {
  onLoginSuccess?: (
    token: string,
    user: { id: number; name: string }
  ) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !pin.trim()) {
      setError('Please enter your username and PIN.');
      return;
    }

    if (!isLogin && pin !== confirmPin) {
      setError('The PINs do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = isLogin ? '/api/login' : '/api/signup';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          pin: pin.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            (isLogin
              ? 'Invalid login credentials.'
              : 'Registration failed.')
        );
      }

      if (isLogin) {
        if (data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem(
            'user',
            JSON.stringify({
              id: data.id,
              name: data.name,
            })
          );
        }

        if (onLoginSuccess) {
          onLoginSuccess(data.token, {
            id: data.id,
            name: data.name,
          });
        } else {
          window.location.reload();
        }
      } else {
        setIsLogin(true);
        setPin('');
        setConfirmPin('');
        setError('Account created successfully! You can now sign in.');
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'A network error occurred.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (login: boolean) => {
    setIsLogin(login);
    setError(null);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 p-4 text-zinc-100">
      <div className="absolute left-1/2 top-1/4 h-80 w-80 -translate-x-1/2 rounded-full bg-[#ccff00]/10 blur-[110px]" />
      <div className="absolute bottom-10 right-10 h-56 w-56 rounded-full bg-emerald-500/5 blur-[90px]" />

      <Card className="relative w-full max-w-md rounded-3xl p-7 sm:p-9">
        <div className="mb-8 text-center">
          <img
            src="/img/icon-512.png"
            alt="Gym Tracker Logo"
            className="mx-auto mb-4 h-20 w-20 rounded-2xl shadow-xl"
          />

          <h1 className="text-3xl font-black uppercase italic tracking-tight">
            Gym <span className="text-[#ccff00]">Tracker</span>
          </h1>

          <p className="mt-1.5 text-xs font-medium uppercase tracking-wide text-zinc-400">
            {isLogin
              ? 'Sign in to continue'
              : 'Create an account and track your progress'}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-2xl border border-zinc-800 bg-zinc-900/90 p-1">
          <button
            type="button"
            onClick={() => switchMode(true)}
            className={`rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider transition ${
              isLogin
                ? 'bg-[#ccff00] text-black shadow-md'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            Sign In
          </button>

          <button
            type="button"
            onClick={() => switchMode(false)}
            className={`rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider transition ${
              !isLogin
                ? 'bg-[#ccff00] text-black shadow-md'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div
            className={`mb-5 rounded-xl border p-3.5 text-xs font-medium ${
              error.includes('successfully')
                ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                : 'border-red-500/40 bg-red-950/30 text-red-300'
            }`}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="auth-name"
            label="Username"
            type="text"
            required
            autoFocus={isLogin}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. stefan"
          />

          <Input
            id="auth-pin"
            label="PIN / Password"
            type="password"
            required
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="••••"
          />

          {!isLogin && (
            <Input
              id="auth-confirm-pin"
              label="Confirm PIN"
              type="password"
              required
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              placeholder="••••"
            />
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="mt-3"
          >
            {isLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/40 border-t-black" />
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default AuthView;