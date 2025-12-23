import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const { setView, login: storeLogin } = useStore();
  const { login, error: authError, isLoading, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [useDemoMode, setUseDemoMode] = useState(false);

  // Clear errors when inputs change
  useEffect(() => {
    if (localError) setLocalError('');
    if (authError) clearError();
  }, [email, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !password) {
      setLocalError('Please fill in all fields');
      return;
    }

    if (useDemoMode) {
      // Demo mode - use local store auth (no backend)
      storeLogin(email, 'Demo User');
      return;
    }

    // Real authentication via backend
    const success = await login(email, password);
    if (success) {
      // Sync with store for app state
      storeLogin(email, email.split('@')[0]);
    }
  };

  const handleDemoLogin = () => {
    storeLogin('demo@dropshipai.com', 'Demo User');
  };

  const displayError = localError || authError;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030712] p-4">
      <div className="w-full max-w-md space-y-8 bg-gray-900/50 p-10 rounded-3xl border border-gray-800 backdrop-blur-sm">
        <div className="text-center">
          <h1 className="text-4xl font-bold heading-font">
            <span className="text-blue-500">Dropship</span>AI
          </h1>
          <p className="mt-2 text-gray-400">Welcome back! Please login to your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {displayError && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">{displayError}</div>}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              disabled={isLoading}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-900/50 text-gray-500">or</span>
          </div>
        </div>

        <button
          onClick={handleDemoLogin}
          className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-3 rounded-xl transition-all border border-gray-700"
        >
          Try Demo Mode
        </button>

        <p className="text-center text-gray-500 text-sm">
          Don't have an account?{' '}
          <button onClick={() => setView('register')} className="text-blue-500 hover:underline font-semibold">
            Register
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;