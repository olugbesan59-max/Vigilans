import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api';
import MeetingRoom from '../components/meetings/MeetingRoom';
import { 
  Video, Plus, Calendar, Clock, Users, Link as LinkIcon, 
  Play, CheckCircle2, MoreVertical, X, Share2, Shield
} from 'lucide-react';

export default function MeetingsPage({ onStartMeetingDirect }) {
  const { user, isOwner, isAdmin } = useAuth();
  const { addToast } = useToast();

  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMeetingRoom, setActiveMeetingRoom] = useState(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    agenda: '',
    scheduledTime: 'Today at 3:00 PM',
    durationMinutes: 45
  });

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const data = await api.getMeetings();
      setMeetings(data || []);
    } catch (err) {
      addToast('Failed to load meetings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    try {
      const newMeeting = await api.createMeeting({
        title: formData.title,
        agenda: formData.agenda,
        scheduledTime: formData.scheduledTime,
        durationMinutes: parseInt(formData.durationMinutes, 10),
        hostName: user?.fullName || 'Workspace Lead'
      });
      addToast('Meeting scheduled successfully', 'success');
      setIsScheduleModalOpen(false);
      setFormData({
        title: '',
        agenda: '',
        scheduledTime: 'Today at 3:00 PM',
        durationMinutes: 45
      });
      fetchMeetings();
    } catch (err) {
      addToast(err.message || 'Failed to schedule meeting', 'error');
    }
  };

  const handleInstantMeeting = () => {
    const instant = {
      id: `instant-${Date.now()}`,
      title: `${user?.fullName || 'Quick'} Standup Call`,
      hostName: user?.fullName || 'You',
      durationMinutes: 30
    };
    setActiveMeetingRoom(instant);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Video className="w-6 h-6 text-indigo-400" />
            Meetings & Conference Rooms
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Conduct 1-on-1 calls, company all-hands, screen sharing, and scheduled conferences.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleInstantMeeting}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
          >
            <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
            <span>Instant Meeting</span>
          </button>

          {(isOwner || isAdmin) && (
            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Meeting</span>
            </button>
          )}
        </div>
      </div>

      {/* Featured Callout Banner */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-purple-950/40 border border-indigo-500/20 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Vigilans WebRTC HD Video Rooms</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Secure in-browser peer communication with microphone, camera, screen-sharing, and real-time meeting chat.
            </p>
          </div>
        </div>

        <button
          onClick={handleInstantMeeting}
          className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition"
        >
          Launch Room Now
        </button>
      </div>

      {/* Meetings List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Loading scheduled sessions...</div>
      ) : meetings.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 text-sm">
          No scheduled meetings. Click "Schedule Meeting" or start an instant call.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {meetings.map((meeting) => (
            <div
              key={meeting.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                    {meeting.status || 'Scheduled'}
                  </span>
                  <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {meeting.durationMinutes} mins
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mb-1.5">{meeting.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                  {meeting.agenda || 'Regular team discussion and sync.'}
                </p>

                <div className="space-y-2 py-3 border-y border-slate-800/80 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-slate-200 font-medium">{meeting.scheduledTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>Host: <strong className="text-slate-300">{meeting.hostName}</strong></span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2">
                <button
                  onClick={() => setActiveMeetingRoom(meeting)}
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition inline-flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  Join Call
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    addToast('Meeting link copied to clipboard', 'info');
                  }}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Copy meeting link"
                >
                  <LinkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Meeting Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-4 sm:p-6 shadow-2xl my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-800">
              <h2 className="text-base sm:text-lg font-bold text-white">Schedule Workspace Meeting</h2>
              <button onClick={() => setIsScheduleModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Meeting Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Weekly Product Design Sync"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Agenda & Description</label>
                <textarea
                  rows="3"
                  value={formData.agenda}
                  onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
                  placeholder="Discussion points, deliverables review..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Scheduled Time *</label>
                  <input
                    type="text"
                    required
                    value={formData.scheduledTime}
                    onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                    placeholder="e.g. Tomorrow at 10:00 AM"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Duration (Minutes)</label>
                  <select
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="15">15 Minutes</option>
                    <option value="30">30 Minutes</option>
                    <option value="45">45 Minutes</option>
                    <option value="60">60 Minutes</option>
                    <option value="90">90 Minutes</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg transition"
                >
                  Schedule Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Meeting Room Conference Interface */}
      {activeMeetingRoom && (
        <MeetingRoom
          meeting={activeMeetingRoom}
          onLeave={() => setActiveMeetingRoom(null)}
        />
      )}
    </div>
  );
}
