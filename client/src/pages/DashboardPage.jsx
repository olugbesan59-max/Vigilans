import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api';
import OfficeBarcodeSignModal from '../components/attendance/OfficeBarcodeSignModal';
import { 
  Users, QrCode, Clock, CheckCircle2, AlertTriangle, ArrowUpRight, 
  Calendar, CheckSquare, MessageSquare, Video, Shield, ChevronRight,
  TrendingUp, Sparkles, AlertCircle, PlayCircle, StopCircle, Printer
} from 'lucide-react';

export default function DashboardPage({ onNavigate, onOpenScanner, onStartMeeting }) {
  const { user, isOwner, isAdmin, isStaff } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [stats, setStats] = useState({
    totalStaff: 0,
    activeStaff: 0,
    todayAttendance: 0,
    lateStaff: 0,
    openTasks: 0,
    completedTasks: 0,
  });
  const [workingNow, setWorkingNow] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);
  const [durationTimer, setDurationTimer] = useState('00:00:00');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [todayAtt, staffList, tasksList, meetingsList, annList] = await Promise.all([
        api.getTodayAttendance().catch(() => ({ stats: {}, records: [] })),
        api.getStaff().catch(() => []),
        api.getTasks().catch(() => []),
        api.getMeetings().catch(() => []),
        api.getAnnouncements().catch(() => []),
      ]);

      const myToday = todayAtt.records?.find(r => r.staffId === user?.id) || null;
      setTodayRecord(myToday);

      const currentlyWorking = (todayAtt.records || []).filter(r => !r.clockOutTime);
      setWorkingNow(currentlyWorking);

      setStats({
        totalStaff: staffList.length || 0,
        activeStaff: currentlyWorking.length,
        todayAttendance: todayAtt.records?.length || 0,
        lateStaff: (todayAtt.records || []).filter(r => r.status === 'late').length,
        openTasks: (tasksList || []).filter(t => t.status !== 'completed').length,
        completedTasks: (tasksList || []).filter(t => t.status === 'completed').length,
      });

      setRecentTasks((tasksList || []).slice(0, 5));
      setUpcomingMeetings((meetingsList || []).slice(0, 3));
      setAnnouncements((annList || []).slice(0, 2));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  // Clock duration timer for clocked in staff
  useEffect(() => {
    if (!todayRecord || todayRecord.clockOutTime) {
      setDurationTimer('00:00:00');
      return;
    }

    const interval = setInterval(() => {
      const start = new Date(todayRecord.clockInTime).getTime();
      const now = new Date().getTime();
      const diffSec = Math.max(0, Math.floor((now - start) / 1000));
      const hours = String(Math.floor(diffSec / 3600)).padStart(2, '0');
      const mins = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
      const secs = String(diffSec % 60).padStart(2, '0');
      setDurationTimer(`${hours}:${mins}:${secs}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [todayRecord]);

  const handleQuickClockOut = async () => {
    if (!todayRecord) return;
    try {
      await api.clockOut({ staffId: user.id });
      addToast('Successfully clocked out for today', 'success');
      fetchDashboardData();
    } catch (err) {
      addToast(err.message || 'Failed to clock out', 'error');
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900/50 via-slate-900 to-slate-900 border border-indigo-500/20 p-6 md:p-8 shadow-xl">
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Vigilans Workspace • {user?.companyName || 'Enterprise'}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              {getGreeting()}, {user?.fullName?.split(' ')[0]} 👋
            </h1>
            <p className="mt-1 text-sm text-slate-300 max-w-xl">
              {isOwner && "You have full executive control of staff attendance, team tasks, communications, and audit logs."}
              {isAdmin && "Manage staff rosters, approve attendance, coordinate projects, and schedule team calls."}
              {isStaff && `You are logged in as ${user?.roleTitle || 'Staff'} in ${user?.department || 'Operations'}. Clock in below to record your attendance.`}
            </p>
          </div>

          {/* Quick Action Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenScanner}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/25 transition active:scale-95 cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Scan Barcode</span>
            </button>
            {(isOwner || isAdmin) && (
              <button
                type="button"
                onClick={() => setIsBarcodeModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-600/25 transition active:scale-95 cursor-pointer"
                title="Download or Print Barcode Sign for Office Entrance"
              >
                <Printer className="w-4 h-4" />
                <span>Office Barcode (Print / Download)</span>
              </button>
            )}
            {(isOwner || isAdmin) ? (
              <button
                onClick={() => onNavigate('tasks')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-medium transition cursor-pointer"
              >
                <CheckSquare className="w-4 h-4 text-indigo-400" />
                <span>New Task</span>
              </button>
            ) : null}
            <button
              onClick={() => onNavigate('meetings')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-medium transition cursor-pointer"
            >
              <Video className="w-4 h-4 text-indigo-400" />
              <span>Join Meeting</span>
            </button>
          </div>
        </div>

        {/* Staff Personal Attendance Banner (If Staff or clock-in active) */}
        {isStaff && (
          <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${todayRecord && !todayRecord.clockOutTime ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <div>
                <p className="text-xs text-slate-400">Attendance Status</p>
                <p className="text-sm font-semibold text-white">
                  {todayRecord ? (
                    todayRecord.clockOutTime ? 'Clocked Out for Today' : (
                      <span className="text-emerald-400">
                        Currently Working ({todayRecord.status === 'late' ? 'Late Arrival' : 'On Time'})
                      </span>
                    )
                  ) : 'Not Clocked In Yet'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-indigo-400" />
              <div>
                <p className="text-xs text-slate-400">Current Session Duration</p>
                <p className="text-lg font-mono font-bold text-indigo-300">{durationTimer}</p>
              </div>
            </div>

            <div className="flex items-center justify-start md:justify-end gap-2">
              {!todayRecord ? (
                <button
                  onClick={onOpenScanner}
                  className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition"
                >
                  <PlayCircle className="w-4 h-4" />
                  Clock In with Barcode
                </button>
              ) : !todayRecord.clockOutTime ? (
                <button
                  onClick={handleQuickClockOut}
                  className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow transition"
                >
                  <StopCircle className="w-4 h-4" />
                  Clock Out Now
                </button>
              ) : (
                <span className="text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                  Day completed ({new Date(todayRecord.clockOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => onNavigate('staff')}
          className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 p-5 rounded-2xl shadow-sm cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Staff</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-white">{stats.totalStaff}</p>
            <span className="text-xs text-emerald-400 flex items-center font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" /> All active
            </span>
          </div>
        </div>

        <div 
          onClick={() => onNavigate('attendance')}
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-5 rounded-2xl shadow-sm cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Working Right Now</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-emerald-400">{stats.activeStaff}</p>
            <span className="text-xs text-slate-400">
              of {stats.todayAttendance} clocked in today
            </span>
          </div>
        </div>

        <div 
          onClick={() => onNavigate('attendance')}
          className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-5 rounded-2xl shadow-sm cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Late Arrivals</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-amber-400">{stats.lateStaff}</p>
            <span className="text-xs text-slate-400">
              after 9:00 AM cutoff
            </span>
          </div>
        </div>

        <div 
          onClick={() => onNavigate('tasks')}
          className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 p-5 rounded-2xl shadow-sm cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Tasks</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-white">{stats.openTasks}</p>
            <span className="text-xs text-purple-400 font-medium">
              {stats.completedTasks} completed
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Who is Working + Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Currently Working Staff Live List (2 Columns) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">Live On-Duty Staff</h2>
              <p className="text-xs text-slate-400">Real-time barcode attendance tracker</p>
            </div>
            <button
              onClick={() => onNavigate('attendance')}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 transition"
            >
              Full Log <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {workingNow.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm border border-dashed border-slate-800 rounded-xl">
              No staff members currently clocked in. Staff can scan the office barcode to check in.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {workingNow.map((record) => (
                <div key={record.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={record.staffAvatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100`}
                        alt={record.staffName}
                        className="w-10 h-10 rounded-full object-cover border border-slate-700"
                      />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{record.staffName}</p>
                      <p className="text-xs text-slate-400">{record.roleTitle} • {record.department}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <p className="text-xs font-mono text-slate-300">
                        In: {new Date(record.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md mt-0.5 ${
                        record.status === 'late'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {record.status === 'late' ? `Late (+${record.minutesLate || 0}m)` : 'On Time'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Meetings & Quick Announcements (1 Column) */}
        <div className="space-y-6">
          {/* Upcoming Meetings Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Video className="w-4 h-4 text-indigo-400" />
                Scheduled Meetings
              </h2>
              <button
                onClick={() => onNavigate('meetings')}
                className="text-xs text-indigo-400 hover:text-indigo-300"
              >
                View all
              </button>
            </div>

            {upcomingMeetings.length === 0 ? (
              <p className="text-xs text-slate-500">No upcoming meetings scheduled.</p>
            ) : (
              <div className="space-y-3">
                {upcomingMeetings.map((meeting) => (
                  <div key={meeting.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-white">{meeting.title}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {meeting.scheduledTime} • {meeting.durationMinutes} mins
                        </p>
                      </div>
                      <button
                        onClick={() => onStartMeeting(meeting)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium transition"
                      >
                        Join
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Announcements Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Company Broadcasts
              </h2>
              <button
                onClick={() => onNavigate('announcements')}
                className="text-xs text-indigo-400 hover:text-indigo-300"
              >
                All
              </button>
            </div>

            {announcements.length === 0 ? (
              <p className="text-xs text-slate-500">No current company broadcasts.</p>
            ) : (
              <div className="space-y-3">
                {announcements.map((ann) => (
                  <div key={ann.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        ann.priority === 'urgent' ? 'bg-rose-500/20 text-rose-400' : 'bg-indigo-500/20 text-indigo-400'
                      }`}>
                        {ann.priority}
                      </span>
                      <span className="text-[11px] text-slate-400">{ann.publishedAt ? new Date(ann.publishedAt).toLocaleDateString() : 'Recent'}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-200">{ann.title}</p>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{ann.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Priority Tasks Row */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Priority Workspace Tasks</h2>
            <p className="text-xs text-slate-400">Items needing attention across teams</p>
          </div>
          <button
            onClick={() => onNavigate('tasks')}
            className="text-xs font-medium text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 transition"
          >
            Go to Kanban <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentTasks.map((task) => (
            <div key={task.id} className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    task.priority === 'urgent' ? 'bg-rose-500/20 text-rose-400' :
                    task.priority === 'high' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {task.priority}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Due: {task.dueDate || 'Ongoing'}
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-white line-clamp-1">{task.title}</h3>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{task.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-[11px] text-indigo-400 font-medium capitalize">
                  {task.status.replace('-', ' ')}
                </span>
                <span className="text-[11px] text-slate-500">
                  {task.subtasks ? `${task.subtasks.filter(s => s.completed).length}/${task.subtasks.length} done` : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Office Barcode Sign Modal for Owner & Admin */}
      <OfficeBarcodeSignModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
      />
    </div>
  );
}
