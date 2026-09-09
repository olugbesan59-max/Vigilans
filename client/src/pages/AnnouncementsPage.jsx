import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api';
import { 
  Megaphone, Plus, Calendar, AlertTriangle, AlertCircle, 
  Trash2, X, Bell, CheckCircle2, Shield
} from 'lucide-react';

export default function AnnouncementsPage() {
  const { user, isOwner, isAdmin } = useAuth();
  const { addToast } = useToast();

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal',
    department: 'all'
  });

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await api.getAnnouncements();
      setAnnouncements(data || []);
    } catch (err) {
      addToast('Failed to load announcements', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return;

    try {
      await api.createAnnouncement(formData);
      addToast('Announcement broadcasted to workspace', 'success');
      setIsCreateOpen(false);
      setFormData({
        title: '',
        content: '',
        priority: 'normal',
        department: 'all'
      });
      fetchAnnouncements();
    } catch (err) {
      addToast(err.message || 'Failed to create announcement', 'error');
    }
  };

  const handleDelete = async (annId) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.deleteAnnouncement(annId);
      setAnnouncements(prev => prev.filter(a => a.id !== annId));
      addToast('Announcement deleted', 'success');
    } catch (err) {
      addToast('Failed to delete announcement', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Megaphone className="w-6 h-6 text-indigo-400" />
            Company Announcements
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Official workspace broadcasts, policy updates, and operational notices.
          </p>
        </div>

        {(isOwner || isAdmin) && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Broadcast Announcement</span>
          </button>
        )}
      </div>

      {/* Announcements Stream */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Loading broadcasts...</div>
      ) : announcements.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 text-sm">
          No company announcements.
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className={`bg-slate-900 border rounded-2xl p-6 shadow-sm transition ${
                ann.priority === 'urgent'
                  ? 'border-rose-500/40 bg-rose-950/10'
                  : ann.priority === 'high'
                  ? 'border-amber-500/30'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      ann.priority === 'urgent' ? 'bg-rose-500/20 text-rose-400' :
                      ann.priority === 'high' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-indigo-500/20 text-indigo-400'
                    }`}>
                      {ann.priority}
                    </span>
                    <span className="text-xs text-slate-400">
                      {ann.publishedAt ? new Date(ann.publishedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                    </span>
                    {ann.department && ann.department !== 'all' && (
                      <span className="text-xs text-indigo-300">
                        • {ann.department} Dept
                      </span>
                    )}
                  </div>

                  <h2 className="text-base font-bold text-white mb-2">{ann.title}</h2>
                  <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {ann.content}
                  </p>
                </div>

                {(isOwner || isAdmin) && (
                  <button
                    onClick={() => handleDelete(ann.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition"
                    title="Delete announcement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                <span>Published by {ann.authorName || 'Management'}</span>
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Bell className="w-3 h-3 text-indigo-400" /> Broadcast alert sent
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Announcement Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">Broadcast Announcement</h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Q3 All-Hands & Office Policy Updates"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Content *</label>
                <textarea
                  rows="4"
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Details of the announcement for staff..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Priority Level</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">All Departments (Company-wide)</option>
                    <option value="Engineering">Engineering Only</option>
                    <option value="Design">Design Only</option>
                    <option value="Product">Product Only</option>
                    <option value="Operations">Operations Only</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg transition"
                >
                  Publish Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
