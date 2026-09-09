import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api';
import OfficeBarcodeSignModal from '../components/attendance/OfficeBarcodeSignModal';
import { 
  Settings, Building2, Clock, QrCode, Shield, RefreshCw, 
  CheckCircle2, Save, FileText, Key, AlertCircle, Printer, Download
} from 'lucide-react';

export default function SettingsPage() {
  const { user, isOwner, isAdmin } = useAuth();
  const { addToast } = useToast();

  const [workspace, setWorkspace] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    timezone: 'UTC-05:00 Eastern Time',
    officeStartTime: '09:00',
    gracePeriodMinutes: 15,
    autoClockOutTime: '17:00',
    barcodeToken: 'VIGILANS-HQ-ATTENDANCE-KEY-9823'
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [ws, logs] = await Promise.all([
        api.getWorkspace(),
        api.getAuditLogs().catch(() => [])
      ]);
      setWorkspace(ws);
      setAuditLogs(logs || []);

      if (ws) {
        setFormData({
          name: ws.name || '',
          industry: ws.industry || '',
          timezone: ws.timezone || 'UTC-05:00 Eastern Time',
          officeStartTime: ws.office_start_time || ws.attendanceSettings?.officeStartTime || '09:00',
          gracePeriodMinutes: ws.attendanceSettings?.gracePeriodMinutes || 15,
          autoClockOutTime: ws.automatic_clockout_time || ws.attendanceSettings?.autoClockOutTime || '17:00',
          barcodeToken: ws.barcode_token || ws.barcodeToken || ws.attendanceSettings?.barcodeToken || 'VIGILANS-HQ-ATTENDANCE-KEY-9823'
        });
      }
    } catch (err) {
      addToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!isOwner && !isAdmin) {
      addToast('Only Owners and Admins can update settings', 'error');
      return;
    }

    setSaving(true);
    try {
      await api.updateWorkspace({
        name: formData.name,
        industry: formData.industry,
        timezone: formData.timezone,
        attendanceSettings: {
          officeStartTime: formData.officeStartTime,
          gracePeriodMinutes: parseInt(formData.gracePeriodMinutes, 10),
          autoClockOutTime: formData.autoClockOutTime,
          barcodeToken: formData.barcodeToken
        }
      });
      addToast('Workspace settings saved successfully', 'success');
      fetchSettings();
    } catch (err) {
      addToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateBarcode = async () => {
    if (!window.confirm('Regenerating the barcode key will invalidate old printed signs. Continue?')) return;
    try {
      const newToken = `VIGILANS-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${Date.now().toString().slice(-4)}`;
      setFormData(prev => ({ ...prev, barcodeToken: newToken }));
      await api.regenerateBarcodeToken();
      addToast('New office barcode token generated!', 'success');
      fetchSettings();
    } catch (err) {
      addToast('Failed to regenerate token', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-indigo-400" />
          Workspace Settings & Governance
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure company profile, attendance automation rules, barcode tokens, and review audit logs.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Company Profile Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-white">Company Profile</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Company Workspace Name</label>
              <input
                type="text"
                disabled={!isOwner}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Industry</label>
              <input
                type="text"
                disabled={!isOwner}
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Staff Invite Code</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={workspace?.inviteCode || 'VIGILANS-2026'}
                  className="w-full bg-slate-950/80 border border-indigo-500/30 rounded-xl px-3 py-2 text-xs text-indigo-300 font-mono tracking-wider font-semibold"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(workspace?.inviteCode || 'VIGILANS-2026');
                    addToast('Invite code copied to clipboard!', 'info');
                  }}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl font-medium transition"
                >
                  Copy
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Staff use this code to register into your workspace.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Timezone</label>
              <select
                disabled={!isOwner && !isAdmin}
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-60"
              >
                <option value="UTC-05:00 Eastern Time">UTC-05:00 Eastern Time (US & Canada)</option>
                <option value="UTC-08:00 Pacific Time">UTC-08:00 Pacific Time</option>
                <option value="UTC+00:00 GMT">UTC+00:00 GMT / London</option>
                <option value="UTC+01:00 Central European Time">UTC+01:00 Central European Time</option>
              </select>
            </div>
          </div>
        </div>

        {/* Attendance Automation Rules */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
            <Clock className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-white">Barcode & Attendance Engine Rules</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Office Start Time (Cutoff)
              </label>
              <input
                type="time"
                disabled={!isOwner && !isAdmin}
                value={formData.officeStartTime}
                onChange={(e) => setFormData({ ...formData, officeStartTime: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-60"
              />
              <p className="text-[11px] text-slate-500 mt-1">Clock-ins after this time are tagged as Late.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Grace Period (Minutes)
              </label>
              <input
                type="number"
                min="0"
                max="60"
                disabled={!isOwner && !isAdmin}
                value={formData.gracePeriodMinutes}
                onChange={(e) => setFormData({ ...formData, gracePeriodMinutes: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-60"
              />
              <p className="text-[11px] text-slate-500 mt-1">Tolerance before lateness applies.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Automatic Clock-Out Time
              </label>
              <input
                type="time"
                disabled={!isOwner && !isAdmin}
                value={formData.autoClockOutTime}
                onChange={(e) => setFormData({ ...formData, autoClockOutTime: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-60"
              />
              <p className="text-[11px] text-slate-500 mt-1">Auto departs any unclosed shifts.</p>
            </div>
          </div>

          {/* Barcode Token Row */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Live Barcode Token
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                readOnly
                value={formData.barcodeToken}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-indigo-300 font-mono tracking-wider"
              />
              {(isOwner || isAdmin) && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsBarcodeModalOpen(true)}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold whitespace-nowrap shadow-md shadow-indigo-600/20 transition active:scale-95 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print / Download Sign</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRegenerateBarcode}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold whitespace-nowrap transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Regenerate</span>
                  </button>
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Encoded into your office entrance QR/Barcode standee. Staff scan this barcode to clock in.
            </p>
          </div>
        </div>

        {/* Save Button */}
        {(isOwner || isAdmin) && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Workspace Rules'}</span>
            </button>
          </div>
        )}
      </form>

      {/* Audit Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-sm font-bold text-white">Compliance & Audit Trail</h2>
              <p className="text-[11px] text-slate-400">Chronological history of security and administrative operations</p>
            </div>
          </div>
          <span className="text-xs text-slate-400">{auditLogs.length} events logged</span>
        </div>

        {auditLogs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">No audit logs recorded yet.</div>
        ) : (
          <div className="space-y-3">
            {auditLogs.slice(0, 10).map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs">
                <div>
                  <span className="font-semibold text-white">{log.actorName || 'System'}</span>
                  <span className="text-slate-400 ml-2">{log.action}</span>
                  {log.details && (
                    <span className="text-slate-500 ml-2 font-mono text-[11px]">({log.details})</span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Office Barcode Sign Modal for Owner & Admin */}
      <OfficeBarcodeSignModal
        isOpen={isBarcodeModalOpen}
        onClose={() => {
          setIsBarcodeModalOpen(false);
          fetchSettings();
        }}
      />
    </div>
  );
}
