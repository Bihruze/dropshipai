import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useAuth } from '../contexts/AuthContext';

const Register: React.FC = () => {
  const { login: storeLogin, setView } = useStore();
  const { register, error: authError, isLoading, clearError } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [localError, setLocalError] = useState('');

  // Clear errors when inputs change
  useEffect(() => {
    if (localError) setLocalError('');
    if (authError) clearError();
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!formData.name || !formData.email || !formData.password) {
      setLocalError('All fields are required');
      return;
    }

    if (formData.password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    // Real registration via backend
    const success = await register(formData.email, formData.name, formData.password);
    if (success) {
      // Sync with store for app state
      storeLogin(formData.email, formData.name);
    }
  };

  const displayError = localError || authError;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030712] p-4">
      <div className="w-full max-w-md space-y-8 bg-gray-900/50 p-10 rounded-3xl border border-gray-800 backdrop-blur-sm">
        <div className="text-center">
          <h1 className="text-4xl font-bold heading-font">
            <span className="text-blue-500">Dropship</span>AI
          </h1>
          <p className="mt-2 text-gray-400">Create your account to start selling.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {displayError && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">{displayError}</div>}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="John Doe"
              disabled={isLoading}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="name@example.com"
              disabled={isLoading}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="Min. 8 characters"
              disabled={isLoading}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Confirm Password</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              placeholder="Repeat password"
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
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm">
          Already have an account?{' '}
          <button onClick={() => setView('login')} className="text-blue-500 hover:underline font-semibold">
            Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;