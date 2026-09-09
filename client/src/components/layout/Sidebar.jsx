import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Clock,
  CheckSquare,
  MessageSquare,
  Video,
  Rss,
  Bell,
  BarChart3,
  Settings,
  Shield,
  LogOut,
  ChevronRight,
  UserCheck,
  Building2,
  RefreshCw,
  QrCode
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiRequest } from '../../api';

export const Sidebar = ({ 
  currentTab, 
  setCurrentTab, 
  activeTab, 
  onTabChange,
  onOpenScanner 
}) => {
  const selectedTab = activeTab || currentTab || 'dashboard';
  const handleTabChange = onTabChange || setCurrentTab || (() => {});

  const { user, workspace, isOwner, isAdmin, logout, switchDemoUser } = useAuth();
  const { success, error } = useToast();
  const [demoUsers, setDemoUsers] = useState([]);
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  useEffect(() => {
    apiRequest('/auth/demo-users')
      .then(list => setDemoUsers(list || []))
      .catch(() => {});
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['owner', 'admin', 'staff'] },
    { id: 'staff', label: 'Staff Directory', icon: Users, roles: ['owner', 'admin', 'staff'] },
    { id: 'attendance', label: 'Attendance', icon: Clock, roles: ['owner', 'admin', 'staff'] },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, roles: ['owner', 'admin', 'staff'] },
    { id: 'messages', label: 'Messages', icon: MessageSquare, roles: ['owner', 'admin', 'staff'] },
    { id: 'meetings', label: 'Meetings', icon: Video, roles: ['owner', 'admin', 'staff'] },
    { id: 'feed', label: 'Recent Feed', icon: Rss, roles: ['owner', 'admin', 'staff'] },
    { id: 'announcements', label: 'Announcements', icon: Bell, roles: ['owner', 'admin', 'staff'] },
    { id: 'reports', label: 'Reports', icon: BarChart3, roles: ['owner', 'admin'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['owner', 'admin'] },
  ];

  const currentRole = user?.system_role || user?.role || 'staff';
  const allowedNav = navItems.filter(item => item.roles.includes(currentRole));

  const handleDemoSwitch = async (demoUser) => {
    try {
      await switchDemoUser(demoUser);
      setShowDemoMenu(false);
      success(`Switched role to ${demoUser.name} (${demoUser.role_title})`);
    } catch (e) {
      error('Failed to switch persona');
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-20 lg:w-64 bg-slate-900 text-slate-300 h-screen select-none flex-shrink-0 border-r border-slate-800 transition-all duration-200 z-30">
      {/* Brand Header */}
      <div className="p-4 lg:p-5 flex items-center gap-3 border-b border-slate-800/80">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
          <Shield size={22} className="stroke-[2.2]" />
        </div>
        <div className="hidden lg:flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-lg tracking-tight text-white">Vigilans</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 uppercase tracking-wide">
              {currentRole}
            </span>
          </div>
          <span className="text-xs text-slate-400 truncate max-w-[150px]" title={workspace?.name || user?.companyName}>
            {workspace?.name || user?.companyName || 'Vigilans Workspace'}
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin">
        {allowedNav.map((item) => {
          const Icon = item.icon;
          const isActive = selectedTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`flex items-center gap-3.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                  : 'hover:bg-slate-800/60 hover:text-white text-slate-400'
              }`}
              title={item.label}
            >
              <Icon
                size={20}
                className={`flex-shrink-0 transition-transform duration-150 group-hover:scale-110 ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              <span className="hidden lg:inline truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Quick 1-Click Role Switcher */}
      <div className="p-3 border-t border-slate-800 relative">
        <button
          onClick={() => setShowDemoMenu(!showDemoMenu)}
          className="w-full flex items-center justify-center lg:justify-between gap-2 px-2.5 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-xs font-semibold text-indigo-300 border border-indigo-500/20 transition-colors"
          title="Switch Demo Role"
        >
          <div className="flex items-center gap-2 truncate">
            <RefreshCw size={14} className="text-indigo-400" />
            <span className="hidden lg:inline truncate">Switch Role (Demo)</span>
          </div>
          <ChevronRight size={14} className="hidden lg:inline text-slate-400" />
        </button>

        {/* Demo Switcher Popup Drawer */}
        {showDemoMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowDemoMenu(false)} />
            <div className="absolute bottom-16 left-3 right-3 lg:w-72 z-50 rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl p-2.5 animate-slide-up space-y-1">
              <div className="px-2 py-1.5 border-b border-slate-700/80 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Test Any Persona
                </span>
                <span className="text-[10px] text-indigo-400 font-medium">1-Click Fast Auth</span>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1 py-1">
                {demoUsers.map(du => (
                  <button
                    key={du.id}
                    onClick={() => handleDemoSwitch(du)}
                    className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-colors ${
                      user?.id === du.id ? 'bg-indigo-600 text-white' : 'hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    <img src={du.profile_picture} alt="" className="w-6 h-6 rounded-full object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate">{du.name}</p>
                      <p className="text-[10px] opacity-75 truncate">{du.role_title}</p>
                    </div>
                    <span className="text-[10px] font-bold uppercase opacity-60">
                      {du.system_role}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* User Footer Profile */}
      <div className="p-3 lg:p-4 border-t border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={user?.avatar || user?.profile_picture || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100`}
            alt={user?.fullName || user?.first_name}
            className="w-9 h-9 rounded-xl object-cover border border-slate-700 flex-shrink-0"
          />
          <div className="hidden lg:flex flex-col min-w-0">
            <span className="text-xs font-semibold text-white truncate">
              {user?.fullName || `${user?.first_name || ''} ${user?.last_name || ''}`}
            </span>
            <span className="text-[11px] text-slate-400 truncate" title={user?.roleTitle || user?.role_title}>
              {user?.roleTitle || user?.role_title || 'Staff'}
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          title="Log Out"
        >
          <LogOut size={17} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
