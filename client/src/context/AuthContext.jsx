import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const normalizeUser = (u, ws) => {
  if (!u) return null;
  return {
    ...u,
    fullName: u.fullName || `${u.first_name || ''} ${u.last_name || ''}`.trim(),
    roleTitle: u.roleTitle || u.role_title,
    role: u.role || u.system_role,
    avatar: u.avatar || u.profile_picture,
    companyName: u.companyName || ws?.name || 'Vigilans Technologies'
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('vigilans_token'));
  const [loading, setLoading] = useState(true);

  // Verify session on mount
  useEffect(() => {
    const checkSession = async () => {
      const savedToken = localStorage.getItem('vigilans_token');
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const data = await apiRequest('/auth/me');
        setUser(normalizeUser(data.user, data.workspace));
        setWorkspace(data.workspace);
      } catch (err) {
        console.warn('Session expired or invalid:', err.message);
        localStorage.removeItem('vigilans_token');
        setToken(null);
        setUser(null);
        setWorkspace(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [token]);

  // Login
  const login = async (email, password) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    localStorage.setItem('vigilans_token', data.token);
    setToken(data.token);
    setUser(normalizeUser(data.user, data.workspace));
    setWorkspace(data.workspace);
    return data;
  };

  // Register Owner + Company
  const registerOwner = async (formData) => {
    const data = await apiRequest('/auth/register-owner', {
      method: 'POST',
      body: JSON.stringify(formData),
    });

    localStorage.setItem('vigilans_token', data.token);
    setToken(data.token);
    setUser(normalizeUser(data.user, data.workspace));
    setWorkspace(data.workspace);
    return data;
  };

  // Register Staff
  const registerStaff = async (formData) => {
    const payload = {
      first_name: formData.first_name || (formData.fullName ? formData.fullName.trim().split(' ')[0] : ''),
      last_name: formData.last_name || (formData.fullName ? formData.fullName.trim().split(' ').slice(1).join(' ') || 'Staff' : ''),
      email: formData.email,
      password: formData.password,
      role_title: formData.role_title || formData.roleTitle,
      invite_code: formData.invite_code || formData.inviteCode,
      department: formData.department || 'General',
      phone: formData.phone || '',
      profile_picture: formData.profile_picture || formData.avatar,
    };

    const data = await apiRequest('/auth/register-staff', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    localStorage.setItem('vigilans_token', data.token);
    setToken(data.token);
    setUser(normalizeUser(data.user, data.workspace));
    setWorkspace(data.workspace);
    return data;
  };

  // 1-Click Switch Demo User for Testing Roles
  const switchDemoUser = async (demoUser) => {
    try {
      // Direct login simulation for demo user
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: demoUser.email, password: 'Password123!' }),
      });

      localStorage.setItem('vigilans_token', data.token);
      setToken(data.token);
      setUser(normalizeUser(data.user, data.workspace));
      setWorkspace(data.workspace);
      return data;
    } catch (err) {
      console.error('Demo user switch error:', err);
      throw err;
    }
  };

  // Refresh workspace details
  const refreshWorkspace = async () => {
    try {
      const ws = await apiRequest('/workspaces/current');
      setWorkspace(ws);
    } catch (e) {
      console.warn(e);
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('vigilans_token');
    setToken(null);
    setUser(null);
    setWorkspace(null);
  };

  const isOwner = user?.system_role === 'owner';
  const isAdmin = user?.system_role === 'admin' || isOwner;
  const isStaff = user?.system_role === 'staff';

  const value = {
    user,
    workspace,
    token,
    loading,
    isOwner,
    isAdmin,
    isStaff,
    login,
    logout,
    registerOwner,
    registerStaff,
    switchDemoUser,
    refreshWorkspace,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
