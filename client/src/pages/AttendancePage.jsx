import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api';
import BarcodeGeneratorCard from '../components/attendance/BarcodeGeneratorCard';
import OfficeBarcodeSignModal from '../components/attendance/OfficeBarcodeSignModal';
import { 
  QrCode, Clock, Calendar, CheckCircle2, AlertTriangle, 
  Download, Filter, Search, UserCheck, StopCircle, Eye, Printer
} from 'lucide-react';

export default function AttendancePage({ onOpenScanner }) {
  const { user, isOwner, isAdmin } = useAuth();
  const { addToast } = useToast();

  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({});
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBarcodeCard, setShowBarcodeCard] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const [history, ws] = await Promise.all([
        api.getAttendanceHistory().catch(() => ({ records: [], stats: {} })),
        api.getWorkspace().catch(() => null)
      ]);
      setRecords(history.records || []);
      setStats(history.stats || {});
      setWorkspace(ws);
    } catch (err) {
      addToast('Failed to load attendance records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handleManualClockOut = async (staffId, staffName) => {
    try {
      await api.clockOut({ staffId });
      addToast(`Clocked out ${staffName}`, 'success');
      fetchAttendance();
    } catch (err) {
      addToast(err.message || 'Failed to clock out staff', 'error');
    }
  };

  const handleExportCSV = () => {
    if (records.length === 0) {
      addToast('No records available to export', 'info');
      return;
    }

    const headers = ['Staff Name', 'Role Title', 'Department', 'Date', 'Clock In', 'Clock Out', 'Status', 'Minutes Late', 'Duration (Hours)'];
    const rows = filteredRecords.map(r => [
      `"${r.staffName || ''}"`,
      `"${r.roleTitle || ''}"`,
      `"${r.department || ''}"`,
      `"${r.date || ''}"`,
      `"${r.clockInTime ? new Date(r.clockInTime).toLocaleTimeString() : ''}"`,
      `"${r.clockOutTime ? new Date(r.clockOutTime).toLocaleTimeString() : 'In Progress'}"`,
      `"${r.status || 'present'}"`,
      `"${r.minutesLate || 0}"`,
      `"${r.durationHours || 0}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Vigilans_Attendance_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Attendance CSV exported successfully', 'success');
  };

  const filteredRecords = records.filter(r => {
    const matchesSearch = 
      (r.staffName && r.staffName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.roleTitle && r.roleTitle.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesDept = departmentFilter === 'all' || r.department === departmentFilter;
    return matchesSearch && matchesStatus && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-indigo-400" />
            Attendance & Barcode Hub
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time workplace clock-ins, lateness tracking, automatic departures, and CSV logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {(isOwner || isAdmin) && (
            <>
              <button
                type="button"
                onClick={() => setIsBarcodeModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Office Barcode Sign (Print / Download)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowBarcodeCard(!showBarcodeCard)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-indigo-400" />
                <span>{showBarcodeCard ? 'Hide Barcode' : 'Display Barcode'}</span>
              </button>
            </>
          )}

          <button
            onClick={onOpenScanner}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/25 transition active:scale-95 cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>Scan Barcode (Clock In)</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition cursor-pointer"
            title="Download CSV report"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Office Barcode Card Toggle (if enabled) */}
      {showBarcodeCard && (
        <div className="animate-in fade-in duration-300">
          <BarcodeGeneratorCard 
            workspaceToken={workspace?.barcode_token || workspace?.attendanceSettings?.barcodeToken}
            companyName={workspace?.name}
            onRegenerate={() => {
              addToast('Refreshing attendance rules...', 'info');
              fetchAttendance();
            }}
          />
        </div>
      )}

      {/* Office Barcode Print / Download Poster Modal */}
      <OfficeBarcodeSignModal
        isOpen={isBarcodeModalOpen}
        onClose={() => {
          setIsBarcodeModalOpen(false);
          fetchAttendance();
        }}
      />

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Clock-Ins</span>
            <UserCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{records.length}</p>
          <span className="text-[11px] text-slate-500">All recorded shifts</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>On-Time Arrival</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-400">
            {records.filter(r => r.status === 'present').length}
          </p>
          <span className="text-[11px] text-slate-500">Before 9:00 AM cutoff</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Late Arrivals</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-400">
            {records.filter(r => r.status === 'late').length}
          </p>
          <span className="text-[11px] text-slate-500">Flagged by lateness engine</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active Shift</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-purple-400">
            {records.filter(r => !r.clockOutTime).length}
          </p>
          <span className="text-[11px] text-slate-500">Currently on premises</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search attendance by staff name or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="present">On Time</option>
            <option value="late">Late</option>
          </select>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Design">Design</option>
            <option value="Product">Product</option>
            <option value="Marketing">Marketing</option>
            <option value="Operations">Operations</option>
          </select>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">Loading attendance ledger...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">No attendance records found matching filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Role Title</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Clock In</th>
                  <th className="py-3 px-4">Clock Out</th>
                  <th className="py-3 px-4">Status & Lateness</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 flex items-center gap-3">
                      <img
                        src={r.staffAvatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100`}
                        alt={r.staffName}
                        className="w-8 h-8 rounded-full object-cover border border-slate-700"
                      />
                      <div>
                        <span className="font-semibold text-white block">{r.staffName}</span>
                        <span className="text-[11px] text-slate-500">{r.department}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-300">
                      {r.roleTitle}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {r.date}
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-400">
                      {r.clockInTime ? new Date(r.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {r.clockOutTime ? (
                        <span className="text-slate-300">
                          {new Date(r.clockOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          On Duty
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-md ${
                        r.status === 'late'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {r.status === 'late' ? `Late (+${r.minutesLate || 0}m)` : 'On Time'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!r.clockOutTime && (isOwner || isAdmin || user?.id === r.staffId) ? (
                        <button
                          onClick={() => handleManualClockOut(r.staffId, r.staffName)}
                          className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-[11px] font-semibold transition inline-flex items-center gap-1"
                        >
                          <StopCircle className="w-3.5 h-3.5" /> Clock Out
                        </button>
                      ) : (
                        <span className="text-slate-500 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
