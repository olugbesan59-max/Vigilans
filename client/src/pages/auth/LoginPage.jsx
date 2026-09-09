import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const LoginPage = ({ 
  onNavigateToOwnerRegister, 
  onNavigateToStaffRegister,
  onSwitchToOwnerRegister,
  onSwitchToStaffRegister
}) => {
  const { login } = useAuth();
  const { error, success } = useToast();

  const handleToOwnerRegister = onSwitchToOwnerRegister || onNavigateToOwnerRegister;
  const handleToStaffRegister = onSwitchToStaffRegister || onNavigateToStaffRegister;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      error('Please enter both your email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim().toLowerCase(), password);
      success('Logged in successfully!');
    } catch (err) {
      error(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden select-none font-sans">
      {/* Background radial glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Logo & Title */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-xl shadow-indigo-600/30 mb-4">
          <Shield size={32} className="stroke-[2.2]" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">Vigilans</h1>
        <p className="mt-2 text-sm text-slate-400">
          Enterprise company workspace & staff management platform
        </p>
      </div>

      {/* Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/30 active:scale-[0.98] disabled:opacity-50 mt-2 cursor-pointer"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In to Workspace'}
            </button>
          </form>

          {/* Onboarding Links */}
          <div className="mt-6 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <button
              type="button"
              onClick={handleToOwnerRegister}
              className="text-slate-300 hover:text-white font-medium flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Register Company Workspace</span>
              <ArrowRight size={13} />
            </button>
            <button
              type="button"
              onClick={handleToStaffRegister}
              className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer transition-colors"
            >
              Join via Staff Invite
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
