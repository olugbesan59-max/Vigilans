import React, { useState, useEffect, useRef } from 'react';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Maximize2, Shield, User } from 'lucide-react';

export const VideoCallModal = ({ isOpen, onClose, participant }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      setCallSeconds(0);
      return;
    }

    // Start local camera
    navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => {
        console.warn('Camera preview simulated for video call:', err);
      });

    const timer = setInterval(() => {
      setCallSeconds(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

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

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col h-[520px] animate-slide-up">
        {/* Call Header */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 backdrop-blur-md border border-slate-800/80 text-white">
          <div className="flex items-center gap-3">
            <img
              src={participant?.display_avatar || participant?.profile_picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt=""
              className="w-9 h-9 rounded-full object-cover border border-slate-700"
            />
            <div>
              <p className="font-bold text-xs text-white">{participant?.display_name || participant?.name || 'Direct Video Call'}</p>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Connected • {formatSeconds(callSeconds)}</span>
              </div>
            </div>
          </div>

          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Encrypted WebRTC Call
          </span>
        </div>

        {/* Video Stage */}
        <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden">
          {/* Remote participant simulated feed */}
          <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950">
            <div className="text-center p-6 space-y-3">
              <img
                src={participant?.display_avatar || participant?.profile_picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250'}
                alt=""
                className="w-24 h-24 rounded-full object-cover mx-auto ring-4 ring-indigo-500/30 shadow-2xl animate-pulse-subtle"
              />
              <p className="text-sm font-bold text-white">{participant?.display_name || 'Team Member'}</p>
              <p className="text-xs text-slate-400">Audio & Video Active</p>
            </div>

            {/* Self Video PIP (Picture in Picture) */}
            <div className="absolute bottom-4 right-4 w-36 sm:w-44 aspect-video rounded-xl bg-slate-800 border-2 border-slate-700 overflow-hidden shadow-2xl">
              {!isVideoOff ? (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 bg-slate-900">
                  <User size={24} />
                </div>
              )}
              <span className="absolute bottom-1 left-2 text-[9px] font-semibold text-white/80 bg-black/60 px-1 rounded">
                You
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Call Controls */}
        <div className="p-4 bg-slate-950 border-t border-slate-800/80 flex items-center justify-center gap-4">
          <button
            onClick={toggleMute}
            className={`p-3.5 rounded-2xl transition-all ${
              isMuted ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
            title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-3.5 rounded-2xl transition-all ${
              isVideoOff ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
            title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
          >
            {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
          </button>

          <button
            onClick={onClose}
            className="p-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30 transition-transform hover:scale-105 active:scale-95"
            title="End Video Call"
          >
            <PhoneOff size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCallModal;
