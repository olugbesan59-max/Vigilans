import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, VideoOff, Mic, MicOff, PhoneOff, ScreenShare, 
  MessageSquare, Users, Shield, Send, User, Sparkles, X 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const MeetingRoom = ({ meeting, onLeaveMeeting, onLeave }) => {
  const handleExit = onLeaveMeeting || onLeave || (() => {});
  const { user } = useAuth();
  const { addToast } = useToast();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [meetingMessages, setMeetingMessages] = useState([
    { id: 'm1', author: 'Elena Rostova', text: 'Welcome team! Let’s review today’s agenda.', time: '10:00 AM' },
    { id: 'm2', author: 'David Chen', text: 'Audio and video are crisp.', time: '10:01 AM' }
  ]);

  const [participants, setParticipants] = useState([
    { id: 'p1', name: 'Elena Rostova', role: 'Head of Operations', isSpeaking: true, avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' },
    { id: 'p2', name: 'David Chen', role: 'Engineering Director', isSpeaking: false, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
    { id: 'p3', name: 'Sarah Jenkins', role: 'Senior Frontend Engineer', isSpeaking: false, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' }
  ]);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    // Attempt local media
    navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => {
        console.warn('Meeting room camera simulation fallback:', err.message);
      });

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => (t.enabled = isMuted));
    }
  };

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(t => (t.enabled = isVideoOff));
    }
  };

  const toggleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
    if (!isScreenSharing) {
      addToast('Screen sharing started', 'info');
    } else {
      addToast('Screen sharing stopped', 'info');
    }
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setMeetingMessages(prev => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        author: user?.fullName || 'You',
        text: chatInput.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setChatInput('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col animate-fade-in text-white select-none">
      {/* Meeting Header */}
      <header className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
            <Video size={18} />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">
              {meeting?.title || 'Vigilans Team Conference'}
            </h2>
            <p className="text-[11px] text-slate-400">
              Host: {meeting?.hostName || 'Workspace Lead'} • {participants.length + 1} participants
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowChat(!showChat)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              showChat ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <MessageSquare size={15} />
            <span>Chat ({meetingMessages.length})</span>
          </button>

          <button
            onClick={handleExit}
            className="p-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white transition"
            title="Leave Meeting"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* Main Grid + Chat Section */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* Video Grid */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-fr">
          {/* User's Video Tile */}
          <div className="relative bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center">
            {!isVideoOff ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center">
                <img
                  src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt=""
                  className="w-16 h-16 rounded-full object-cover mx-auto mb-2 border-2 border-slate-700"
                />
                <p className="font-bold text-xs">{user?.fullName || 'You'}</p>
                <p className="text-[10px] text-slate-500">Camera Off</p>
              </div>
            )}
            <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[11px] font-semibold">
              You {isMuted ? '(Muted)' : ''}
            </div>
          </div>

          {/* Remote Participants */}
          {participants.map(p => (
            <div key={p.id} className="relative bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center">
              <div className="text-center">
                <img
                  src={p.avatar}
                  alt={p.name}
                  className={`w-16 h-16 rounded-full object-cover mx-auto mb-2 border-2 ${
                    p.isSpeaking ? 'border-emerald-400 animate-pulse' : 'border-slate-700'
                  }`}
                />
                <p className="font-bold text-xs">{p.name}</p>
                <p className="text-[10px] text-slate-400">{p.role}</p>
              </div>
              <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[11px] font-semibold flex items-center gap-1.5">
                <span>{p.name}</span>
                {p.isSpeaking && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
              </div>
            </div>
          ))}
        </div>

        {/* Meeting Chat Drawer */}
        {showChat && (
          <aside className="w-80 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col shadow-2xl animate-slide-left">
            <div className="p-3.5 border-b border-slate-800 font-bold text-xs flex items-center justify-between">
              <span>In-Meeting Chat</span>
              <button onClick={() => setShowChat(false)} className="text-slate-500 hover:text-white">
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {meetingMessages.map(m => (
                <div key={m.id} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="font-semibold text-indigo-300">{m.author}</span>
                    <span>{m.time}</span>
                  </div>
                  <p className="text-slate-200">{m.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendChat} className="p-3 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Send a chat message..."
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition"
              >
                <Send size={14} />
              </button>
            </form>
          </aside>
        )}
      </div>

      {/* Footer Controls Toolbar */}
      <footer className="py-4 px-6 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-4">
        <button
          onClick={toggleMute}
          className={`p-3.5 rounded-2xl transition ${
            isMuted ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
          }`}
          title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        <button
          onClick={toggleVideo}
          className={`p-3.5 rounded-2xl transition ${
            isVideoOff ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
          }`}
          title={isVideoOff ? 'Start Camera' : 'Stop Camera'}
        >
          {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`p-3.5 rounded-2xl transition ${
            isScreenSharing ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
          }`}
          title="Share Screen"
        >
          <ScreenShare size={20} />
        </button>

        <div className="h-6 w-px bg-slate-800 mx-2" />

        <button
          onClick={handleExit}
          className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 transition active:scale-95 flex items-center gap-2"
          title="Leave Meeting"
        >
          <PhoneOff size={16} />
          <span>Leave Call</span>
        </button>
      </footer>
    </div>
  );
};

export default MeetingRoom;
