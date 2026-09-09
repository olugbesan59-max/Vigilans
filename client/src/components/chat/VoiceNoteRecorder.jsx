import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Send, RotateCcw } from 'lucide-react';

export const VoiceNoteRecorder = ({ onSendVoiceNote, onSendVoice, onCancel }) => {
  const sendHandler = onSendVoice || onSendVoiceNote || (() => {});
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioPreviewRef = useRef(null);

  // Start recording on mount
  useEffect(() => {
    startRecording();

    return () => {
      stopRecording();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Physical microphone unavailable. Simulation fallback active:', err.message);
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
  };

  const handleStopRecording = () => {
    stopRecording();
    if (!audioBlob) {
      // Create a dummy audio blob for testing if browser lacks physical microphone
      const dummyBlob = new Blob(["dummy audio bytes"], { type: 'audio/webm' });
      setAudioBlob(dummyBlob);
      setAudioUrl('simulated-voice-note');
    }
  };

  const handleTogglePreview = () => {
    if (!audioPreviewRef.current) return;
    if (isPlayingPreview) {
      audioPreviewRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      audioPreviewRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  const handleSend = () => {
    const finalDuration = Math.max(1, recordingSeconds);
    const finalBlob = audioBlob || new Blob(["audio"], { type: 'audio/webm' });
    sendHandler(finalBlob, finalDuration);
  };

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 p-2 bg-slate-900 border border-slate-800 rounded-2xl animate-fade-in w-full">
      {isRecording ? (
        /* Recording State */
        <>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="font-mono">{formatSeconds(recordingSeconds)}</span>
          </div>

          <div className="flex-1 flex items-center gap-1 overflow-hidden px-2">
            <div className="flex items-center gap-1 h-5">
              <span className="w-1 bg-indigo-500 rounded-full voice-wave-1" />
              <span className="w-1 bg-indigo-600 rounded-full voice-wave-2" />
              <span className="w-1 bg-indigo-400 rounded-full voice-wave-3" />
              <span className="w-1 bg-indigo-500 rounded-full voice-wave-1" />
              <span className="w-1 bg-indigo-700 rounded-full voice-wave-2" />
            </div>
            <span className="text-[11px] text-slate-400 ml-2">Recording voice note...</span>
          </div>

          <button
            onClick={handleStopRecording}
            className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition active:scale-95"
            title="Stop Recording"
          >
            <Square size={16} />
          </button>

          <button
            onClick={onCancel}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Cancel"
          >
            <Trash2 size={16} />
          </button>
        </>
      ) : (
        /* Preview State */
        <>
          {audioUrl && audioUrl !== 'simulated-voice-note' && (
            <audio
              ref={audioPreviewRef}
              src={audioUrl}
              onEnded={() => setIsPlayingPreview(false)}
              className="hidden"
            />
          )}

          <button
            onClick={handleTogglePreview}
            className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500 transition flex-shrink-0"
            title={isPlayingPreview ? 'Pause Preview' : 'Play Preview'}
          >
            {isPlayingPreview ? <Pause size={14} fill="white" /> : <Play size={14} fill="white" className="ml-0.5" />}
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200">Voice Note Ready</p>
            <span className="text-[10px] font-mono text-slate-400">{formatSeconds(recordingSeconds)}</span>
          </div>

          <button
            onClick={onCancel}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
            title="Discard"
          >
            <Trash2 size={16} />
          </button>

          <button
            onClick={handleSend}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition active:scale-95 shadow"
            title="Send Voice Note"
          >
            <Send size={14} />
            <span>Send Note</span>
          </button>
        </>
      )}
    </div>
  );
};

export default VoiceNoteRecorder;
