import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api';
import { 
  BarChart3, TrendingUp, Clock, AlertTriangle, CheckCircle2, 
  Download, Calendar, Users, Award, Shield
} from 'lucide-react';

export default function ReportsPage() {
  const { isOwner, isAdmin } = useAuth();
  const { addToast } = useToast();

  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('7d');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await api.getReports();
      setReports(data || {
        attendanceRate: 94.2,
        onTimeRate: 88.5,
        avgWorkHours: 7.8,
        totalHoursLogged: 428,
        latenessTrends: [
          { day: 'Mon', count: 3 },
          { day: 'Tue', count: 1 },
          { day: 'Wed', count: 2 },
          { day: 'Thu', count: 0 },
          { day: 'Fri', count: 4 }
        ],
        departmentStats: [
          { name: 'Engineering', attendance: 96, tasksCompleted: 24, totalTasks: 28 },
          { name: 'Design', attendance: 92, tasksCompleted: 14, totalTasks: 16 },
          { name: 'Product', attendance: 98, tasksCompleted: 18, totalTasks: 20 },
          { name: 'Marketing', attendance: 89, tasksCompleted: 11, totalTasks: 15 },
          { name: 'Operations', attendance: 95, tasksCompleted: 9, totalTasks: 10 }
        ]
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [timeframe]);

  const handleExportReport = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Metric,Value\n" +
      `Overall Attendance Rate,${reports?.attendanceRate || 94}%\n` +
      `On-Time Arrival Rate,${reports?.onTimeRate || 88}%\n` +
      `Average Daily Work Hours,${reports?.avgWorkHours || 7.8} hours\n` +
      `Total Workspace Hours Logged,${reports?.totalHoursLogged || 428} hours\n`;
    
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `Vigilans_Executive_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Executive report exported', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            Workspace Analytics & Reports
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Executive insights into staff attendance, punctuality trends, shift durations, and department productivity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">This Quarter (Q3)</option>
          </select>

          <button
            onClick={handleExportReport}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Export Analytics</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs text-slate-400 font-medium">Overall Attendance Rate</span>
          <p className="mt-2 text-3xl font-bold text-white">
            {reports?.attendanceRate || 94.2}%
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+2.4% vs last week</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs text-slate-400 font-medium">On-Time Arrival Rate</span>
          <p className="mt-2 text-3xl font-bold text-emerald-400">
            {reports?.onTimeRate || 88.5}%
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
            <span>Cutoff: 09:00 AM</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs text-slate-400 font-medium">Avg. Shift Duration</span>
          <p className="mt-2 text-3xl font-bold text-indigo-300">
            {reports?.avgWorkHours || 7.8}h
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
            <span>Target: 8.0 hrs/day</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs text-slate-400 font-medium">Total Logged Hours</span>
          <p className="mt-2 text-3xl font-bold text-purple-400">
            {reports?.totalHoursLogged || 428}h
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
            <span>Across 12 staff</span>
          </div>
        </div>
      </div>

      {/* Lateness Breakdown and Department Productivity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lateness by Day of Week */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-white mb-1">Lateness Occurrences by Day</h2>
          <p className="text-xs text-slate-400 mb-6">Staff clocking in past 9:00 AM</p>

          <div className="h-44 flex items-end justify-between gap-4 px-2 pt-6">
            {(reports?.latenessTrends || []).map((day) => {
              const maxCount = 5;
              const heightPercent = Math.max(15, (day.count / maxCount) * 100);
              return (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {day.count}
                  </span>
                  <div
                    className={`w-full max-w-[48px] rounded-t-lg transition-all ${
                      day.count > 2 ? 'bg-rose-500/80' : day.count > 0 ? 'bg-amber-500/80' : 'bg-slate-800'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-xs font-semibold text-slate-400">{day.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Department Attendance and Task Completion */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-white mb-1">Department Performance</h2>
          <p className="text-xs text-slate-400 mb-5">Punctuality and sprint execution</p>

          <div className="space-y-4">
            {(reports?.departmentStats || []).map((dept) => (
              <div key={dept.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">{dept.name}</span>
                  <span className="text-slate-400">
                    {dept.attendance}% attendance • {dept.tasksCompleted}/{dept.totalTasks} tasks
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all"
                    style={{ width: `${dept.attendance}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
