import React, { useState } from 'react';
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
  LogOut, 
  ShieldCheck, 
  Copy,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const Sidebar = ({ 
  currentTab, 
  setCurrentTab, 
  activeTab, 
  onTabChange, 
  onOpenScanner 
}) => {
  const selectedTab = activeTab || currentTab || 'dashboard';
  const handleTabChange = onTabChange || setCurrentTab || (() => {});

  const { user, workspace, isOwner, isAdmin, logout } = useAuth();
  const { success } = useToast();
  const [copied, setCopied] = useState(false);

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

  const inviteCode = workspace?.invite_code || 'VIGILANS-2026';

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    success(`Invite code copied: ${inviteCode}`);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <aside className="hidden md:flex flex-col w-20 lg:w-64 bg-slate-900 text-slate-300 h-screen select-none flex-shrink-0 border-r border-slate-800 transition-all duration-200 z-30">
      {/* Brand Header */}
      <div className="p-4 lg:p-5 flex items-center gap-3 border-b border-slate-800/80">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 flex-shrink-0">
          <ShieldCheck size={22} className="stroke-[2.5]" />
        </div>
        <div className="hidden lg:flex flex-col min-w-0">
          <span className="font-black text-white text-base tracking-tight truncate">
            {workspace?.name || 'Vigilans Workspace'}
          </span>
          <span className="text-[11px] text-slate-400 font-medium tracking-wide truncate">
            Enterprise Security
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {allowedNav.map((item) => {
          const Icon = item.icon;
          const isActive = selectedTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'hover:bg-slate-800/70 text-slate-400 hover:text-slate-100'
              }`}
              title={item.label}
            >
              <Icon
                size={18}
                className={`flex-shrink-0 transition-transform duration-200 ${
                  isActive ? 'scale-110 text-white' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              <span className="hidden lg:inline truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Invite Code Share Widget */}
      <div className="p-3 border-t border-slate-800/80">
        <div className="hidden lg:flex flex-col gap-1.5 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Staff Invite Code</span>
            <span className="text-[10px] text-indigo-400">Shareable</span>
          </div>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <span className="font-mono text-indigo-300 font-bold tracking-wider truncate">
              {inviteCode}
            </span>
            <button
              onClick={handleCopyInvite}
              className="p-1 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              title="Copy invite code to clipboard"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* User Footer Profile */}
      <div className="p-3 lg:p-4 border-t border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={user?.avatar || user?.profile_picture || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100`}
            alt={user?.fullName || user?.first_name}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/30 flex-shrink-0"
          />
          <div className="hidden lg:flex flex-col min-w-0">
            <span className="font-bold text-xs text-white truncate">
              {user?.fullName || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Workspace User'}
            </span>
            <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider truncate">
              {user?.roleTitle || user?.role_title || user?.system_role || 'Staff'}
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
          title="Sign Out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
