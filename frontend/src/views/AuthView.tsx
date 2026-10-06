import React, { useState } from 'react';

interface AuthViewProps {
  onLoginSuccess?: (token: string, user: { id: number; name: string }) => void;
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
      setError('Podaj nazwę użytkownika oraz PIN.');
      return;
    }

    if (!isLogin && pin !== confirmPin) {
      setError('Podane kody PIN nie zgadzają się.');
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = isLogin ? '/api/login' : '/api/signup';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), pin: pin.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || (isLogin ? 'Nieprawidłowe dane logowania' : 'Rejestracja nie powiodła się'));
      }

      if (isLogin) {
        if (data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify({ id: data.id, name: data.name }));
        }

        if (onLoginSuccess) {
          onLoginSuccess(data.token, { id: data.id, name: data.name });
        } else {
          window.location.reload();
        }
      } else {
        setIsLogin(true);
        setPin('');
        setConfirmPin('');
        setError('Konto utworzone pomyślnie! Możesz się teraz zalogować.');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Wystąpił błąd sieci.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-black text-white selection:bg-lime-400 selection:text-black overflow-hidden">
      {/* Dynamiczne poświaty w tle (Radial ambient glows) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-lime-500/10 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[220px] h-[220px] bg-emerald-500/5 rounded-full blur-[90px] pointer-events-none" />

      {/* Główna karta */}
      <div className="relative w-full max-w-sm sm:max-w-md bg-zinc-950/80 border border-zinc-800/80 rounded-3xl p-7 sm:p-9 shadow-2xl backdrop-blur-xl">
        
        {/* Sekcja logo i nagłówka */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative mb-4 group">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-lime-400 to-emerald-400 opacity-20 blur group-hover:opacity-40 transition duration-300" />
            <img 
              src="/img/icon-512.png" 
              alt="Gym Tracker Logo" 
              className="relative w-20 h-20 rounded-2xl object-cover ring-1 ring-white/10 shadow-xl"
            />
          </div>
          
          <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">
            Gym <span className="text-lime-400">Tracker</span>
          </h1>
          <p className="text-xs font-medium text-zinc-400 tracking-wide mt-1.5 uppercase">
            {isLogin ? 'Zaloguj się, aby kontynuować' : 'Załóż konto i śledź progres'}
          </p>
        </div>

        {/* Zakładki Sign In / Sign Up */}
        <div className="grid grid-cols-2 p-1 bg-zinc-900/90 rounded-2xl border border-zinc-800 mb-6">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(null); }}
            className={`py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200 ${
              isLogin
                ? 'bg-lime-400 text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Logowanie
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(null); }}
            className={`py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200 ${
              !isLogin
                ? 'bg-lime-400 text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Rejestracja
          </button>
        </div>

        {/* Komunikat o błędzie lub sukcesie */}
        {error && (
          <div className={`p-3.5 rounded-xl text-xs font-medium mb-5 border leading-relaxed ${
            error.includes('pomyślnie') 
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' 
              : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
          }`}>
            {error}
          </div>
        )}

        {/* Formularz */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 pl-1">
              Użytkownik
            </label>
            <input
              type="text"
              required
              autoFocus={isLogin}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. stefan"
              className="w-full px-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-all text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 pl-1">
              PIN / Hasło
            </label>
            <input
              type="password"
              required
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              className="w-full px-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-all text-sm font-medium tracking-widest"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 pl-1">
                Potwierdź PIN
              </label>
              <input
                type="password"
                required
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="••••"
                className="w-full px-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-all text-sm font-medium tracking-widest"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 mt-3 bg-lime-400 hover:bg-lime-300 active:scale-[0.98] text-black font-extrabold uppercase tracking-wider text-xs rounded-xl transition duration-150 shadow-lg shadow-lime-400/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" />
            ) : (
              <span>{isLogin ? 'Zaloguj się' : 'Utwórz konto'}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthView;