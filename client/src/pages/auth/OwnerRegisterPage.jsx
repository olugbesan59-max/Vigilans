import React, { useState } from 'react';
import { Shield, Building2, User, Mail, Lock, Phone, MapPin, Globe, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const OwnerRegisterPage = ({ onNavigateToLogin, onSwitchToLogin }) => {
  const { registerOwner } = useAuth();
  const { success, error } = useToast();

  const handleBackToLogin = onSwitchToLogin || onNavigateToLogin;

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    company_name: '',
    company_description: '',
    company_website: '',
    company_location: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await registerOwner(formData);
      success('Workspace created successfully! Welcome to Vigilans.');
    } catch (err) {
      error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden select-none">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center z-10 px-4">
        <button
          type="button"
          onClick={handleBackToLogin}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white mb-4 transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to Sign In</span>
        </button>
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-lg mb-3">
          <Building2 size={26} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Create Company Workspace</h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Register as the Company Owner and deploy your isolated organization workspace.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl z-10 px-4 sm:px-0">
        <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="font-bold text-xs uppercase tracking-wider text-indigo-400 border-b border-slate-800 pb-2">
              1. Owner Personal Information
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  name="first_name"
                  placeholder="e.g. Marcus"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  name="last_name"
                  placeholder="e.g. Vance"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Email *</label>
                <input
                  type="email"
                  required
                  name="email"
                  placeholder="marcus@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Password *</label>
              <input
                type="password"
                required
                name="password"
                placeholder="Strong master password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="font-bold text-xs uppercase tracking-wider text-indigo-400 border-b border-slate-800 pb-2 pt-3">
              2. Company Organization Details
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Company Name *</label>
              <input
                type="text"
                required
                name="company_name"
                placeholder="e.g. Vigilans Global Technologies Inc."
                value={formData.company_name}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Headquarters Location</label>
                <input
                  type="text"
                  name="company_location"
                  placeholder="e.g. San Francisco, CA"
                  value={formData.company_location}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Company Website</label>
                <input
                  type="url"
                  name="company_website"
                  placeholder="https://yourcompany.com"
                  value={formData.company_website}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/30 active:scale-[0.98] disabled:opacity-50 mt-4"
            >
              {isSubmitting ? 'Creating Company Workspace...' : 'Create & Launch Workspace'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OwnerRegisterPage;
