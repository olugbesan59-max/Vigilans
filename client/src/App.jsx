import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { RealtimeProvider } from './context/RealtimeContext';

// Layout
import Sidebar from './components/layout/Sidebar';
import TopHeader from './components/layout/TopHeader';
import MobileNav from './components/layout/MobileNav';
import GlobalSearchModal from './components/common/GlobalSearchModal';
import BarcodeScannerModal from './components/attendance/BarcodeScannerModal';
import MeetingRoom from './components/meetings/MeetingRoom';

// Pages
import LoginPage from './pages/auth/LoginPage';
import OwnerRegisterPage from './pages/auth/OwnerRegisterPage';
import StaffRegisterPage from './pages/auth/StaffRegisterPage';

import DashboardPage from './pages/DashboardPage';
import StaffDirectoryPage from './pages/StaffDirectoryPage';
import AttendancePage from './pages/AttendancePage';
import TasksPage from './pages/TasksPage';
import MessagesPage from './pages/MessagesPage';
import MeetingsPage from './pages/MeetingsPage';
import RecentFeedPage from './pages/RecentFeedPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

function MainApp() {
  const { user, loading } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [authView, setAuthView] = useState('login'); // 'login' | 'register-owner' | 'register-staff'
  
  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [activeMeetingRoom, setActiveMeetingRoom] = useState(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium tracking-wide">Loading Vigilans Workspace...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated routing
  if (!user) {
    if (authView === 'register-owner') {
      return (
        <OwnerRegisterPage 
          onSwitchToLogin={() => setAuthView('login')} 
          onSwitchToStaff={() => setAuthView('register-staff')} 
        />
      );
    }
    if (authView === 'register-staff') {
      return (
        <StaffRegisterPage 
          onSwitchToLogin={() => setAuthView('login')} 
        />
      );
    }
    return (
      <LoginPage 
        onSwitchToOwnerRegister={() => setAuthView('register-owner')} 
        onSwitchToStaffRegister={() => setAuthView('register-staff')} 
      />
    );
  }

  // Render active page
  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardPage 
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenScanner={() => setIsScannerOpen(true)}
            onStartMeeting={(m) => setActiveMeetingRoom(m)}
          />
        );
      case 'staff':
        return <StaffDirectoryPage />;
      case 'attendance':
        return <AttendancePage onOpenScanner={() => setIsScannerOpen(true)} />;
      case 'tasks':
        return <TasksPage />;
      case 'messages':
        return <MessagesPage />;
      case 'meetings':
        return (
          <MeetingsPage 
            onStartMeetingDirect={(m) => setActiveMeetingRoom(m)} 
          />
        );
      case 'feed':
        return <RecentFeedPage />;
      case 'announcements':
        return <AnnouncementsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return (
          <DashboardPage 
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenScanner={() => setIsScannerOpen(true)}
            onStartMeeting={(m) => setActiveMeetingRoom(m)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row overflow-x-hidden">
      {/* Desktop Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={(tab) => setActiveTab(tab)} 
        onOpenScanner={() => setIsScannerOpen(true)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        <TopHeader 
          activeTab={activeTab}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenScanner={() => setIsScannerOpen(true)}
          onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
        />

        <main className="flex-1 p-3.5 sm:p-5 md:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {renderActivePage()}
        </main>
      </div>

      {/* Mobile & Tablet Bottom Bar */}
      <MobileNav 
        activeTab={activeTab} 
        onTabChange={(tab) => {
          setActiveTab(tab);
          setIsMobileDrawerOpen(false);
        }} 
        onOpenScanner={() => setIsScannerOpen(true)}
        isDrawerOpen={isMobileDrawerOpen}
        setIsDrawerOpen={setIsMobileDrawerOpen}
      />

      {/* Global Modals */}
      {isSearchOpen && (
        <GlobalSearchModal 
          isOpen={isSearchOpen} 
          onClose={() => setIsSearchOpen(false)}
          onNavigate={(tab) => {
            setActiveTab(tab);
            setIsSearchOpen(false);
          }}
        />
      )}

      {isScannerOpen && (
        <BarcodeScannerModal 
          isOpen={isScannerOpen} 
          onClose={() => setIsScannerOpen(false)}
          onClockInSuccess={(result) => {
            addToast(`Clocked in! Status: ${result.record?.status === 'late' ? 'Late Arrival' : 'On Time'}`, 'success');
            setIsScannerOpen(false);
          }}
        />
      )}

      {activeMeetingRoom && (
        <MeetingRoom 
          meeting={activeMeetingRoom} 
          onLeave={() => setActiveMeetingRoom(null)} 
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <RealtimeProvider>
          <MainApp />
        </RealtimeProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
