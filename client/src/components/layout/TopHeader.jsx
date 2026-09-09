import React, { useState, useEffect } from 'react';
import { Search, Bell, Menu, Shield, QrCode, Check, Clock, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../api';

export const TopHeader = ({ onOpenSearch, onOpenScanner, onOpenMobileMenu }) => {
  const { user, workspace } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Fetch user notifications or fallback to active events
    const list = [
      { id: 'n1', title: 'Office Barcode Active', message: 'Today’s check-in barcode is live at reception.', type: 'attendance', time: 'Today' },
      { id: 'n2', title: 'Sprint Review Scheduled', message: 'All-Hands meeting begins at 2:00 PM.', type: 'meeting', time: 'Today' },
      { id: 'n3', title: 'New Announcement', message: 'Read the company Q3 roadmap update.', type: 'announcement', time: '1h ago' },
    ];
    setNotifications(list);
    setUnreadCount(list.length);
  }, [user]);

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 select-none text-slate-100">
      {/* Left: Mobile Drawer Trigger & Workspace Info */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Open Navigation"
        >
          <Menu size={22} />
        </button>

        <div className="flex items-center gap-3">
          <img
            src={workspace?.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80'}
            alt={workspace?.name}
            className="w-8 h-8 rounded-lg object-cover border border-slate-700 hidden sm:block shadow-sm"
          />
          <div className="flex flex-col">
            <span className="font-bold text-sm text-white truncate max-w-[180px] sm:max-w-[260px]">
              {workspace?.name || user?.companyName || 'Vigilans Workspace'}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>San Francisco HQ</span>
              <span>•</span>
              <span className="font-mono text-indigo-400">{workspace?.office_start_time || '09:00'} AM Start</span>
            </div>
          </div>
        </div>
      </div>

      {/* Center / Search Trigger */}
      <div className="hidden sm:flex items-center flex-1 max-w-md mx-6">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-all shadow-inner hover:border-slate-700"
        >
          <div className="flex items-center gap-2">
            <Search size={16} className="text-slate-500" />
            <span>Search staff, tasks, meetings, feed...</span>
          </div>
          <kbd className="hidden lg:inline-block px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-800 rounded border border-slate-700 shadow-sm">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Actions, Clock-In Shortcut & Notifications */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Camera Scan Clock-In Button */}
        <button
          onClick={onOpenScanner}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-transform hover:scale-105 shadow-md shadow-indigo-600/25 active:scale-95"
          title="Scan Company Barcode"
        >
          <QrCode size={16} />
          <span className="hidden sm:inline">Clock In / Barcode</span>
        </button>

        {/* Search trigger icon for mobile */}
        <button
          onClick={onOpenSearch}
          className="sm:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <Search size={20} />
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setUnreadCount(0);
            }}
            className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-slate-900" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 mt-2 z-40 w-80 sm:w-88 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-3 animate-slide-down">
                <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-800 pb-2 mb-2">
                  <span className="font-bold text-xs text-white">Notifications</span>
                  <span 
                    onClick={() => setUnreadCount(0)}
                    className="text-[11px] text-indigo-400 hover:underline cursor-pointer font-medium"
                  >
                    Mark all read
                  </span>
                </div>
                <div className="space-y-1.5 max-h-72 overflow-y-auto">
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-800/80 transition-colors cursor-pointer border border-transparent hover:border-slate-700"
                    >
                      <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 flex-shrink-0 mt-0.5">
                        <Clock size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs text-white truncate">{n.title}</p>
                        <p className="text-[11px] text-slate-400 leading-snug">{n.message}</p>
                        <span className="text-[10px] text-slate-500 mt-1 inline-block">{n.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
