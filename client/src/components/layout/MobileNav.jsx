import React, { useState } from 'react';
import { 
  LayoutDashboard, Clock, CheckSquare, MessageSquare, 
  MoreHorizontal, Users, Video, Rss, Bell, BarChart3, 
  Settings, LogOut, X, QrCode 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const MobileNav = ({ 
  currentTab, 
  setCurrentTab, 
  activeTab, 
  onTabChange, 
  onOpenScanner,
  isDrawerOpen: propDrawerOpen, 
  setIsDrawerOpen: propSetDrawerOpen 
}) => {
  const { user, logout } = useAuth();
  const [localDrawerOpen, setLocalDrawerOpen] = useState(false);

  const isDrawerOpen = propDrawerOpen !== undefined ? propDrawerOpen : localDrawerOpen;
  const setIsDrawerOpen = propSetDrawerOpen || setLocalDrawerOpen;

  const selectedTab = activeTab || currentTab || 'dashboard';
  const handleTabChange = onTabChange || setCurrentTab || (() => {});

  const currentRole = user?.system_role || user?.role || 'staff';

  const mainTabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
  ];

  const drawerTabs = [
    { id: 'staff', label: 'Staff Directory', icon: Users, roles: ['owner', 'admin', 'staff'] },
    { id: 'meetings', label: 'Meetings', icon: Video, roles: ['owner', 'admin', 'staff'] },
    { id: 'feed', label: 'Recent Feed', icon: Rss, roles: ['owner', 'admin', 'staff'] },
    { id: 'announcements', label: 'Announcements', icon: Bell, roles: ['owner', 'admin', 'staff'] },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, roles: ['owner', 'admin'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['owner', 'admin'] },
  ].filter(t => t.roles.includes(currentRole));

  return (
    <>
      {/* Bottom Nav Bar for Mobile & Tablet */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-3 py-2 flex items-center justify-around select-none">
        {mainTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = selectedTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                handleTabChange(tab.id);
                setIsDrawerOpen(false);
              }}
              className={`flex flex-col items-center gap-1 py-1 px-2 transition-colors ${
                isActive ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon size={20} className={isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'} />
              <span className="text-[10px]">{tab.label}</span>
            </button>
          );
        })}

        <button
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          className={`flex flex-col items-center gap-1 py-1 px-2 transition-colors ${
            isDrawerOpen ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MoreHorizontal size={20} />
          <span className="text-[10px]">More</span>
        </button>
      </nav>

      {/* Slide-Up Mobile Drawer */}
      {isDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 shadow-2xl z-50 animate-slide-up max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <span className="font-bold text-sm text-white">All Workspace Features</span>
              <button onClick={() => setIsDrawerOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {onOpenScanner && (
              <button
                onClick={() => {
                  onOpenScanner();
                  setIsDrawerOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs mb-3 shadow transition"
              >
                <QrCode size={16} />
                <span>Scan Office Barcode (Clock In)</span>
              </button>
            )}

            <div className="grid grid-cols-2 gap-2">
              {drawerTabs.map(tab => {
                const Icon = tab.icon;
                const isActive = selectedTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      handleTabChange(tab.id);
                      setIsDrawerOpen(false);
                    }}
                    className={`flex items-center gap-2.5 p-3 rounded-xl text-xs font-semibold text-left transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-950/60 text-slate-300 border border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  logout();
                  setIsDrawerOpen(false);
                }}
                className="flex items-center gap-2.5 w-full p-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 transition-colors"
              >
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNav;
