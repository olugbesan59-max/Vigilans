import React, { useState, useEffect } from 'react';
import { Play, Pause, Mic } from 'lucide-react';

export const AudioMessagePlayer = ({ message, isMe }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const duration = message.duration || 12;

  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + (100 / (duration * 10));
        });
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, duration]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex items-center gap-3 w-56 sm:w-64 py-1 select-none">
      <button
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 flex-shrink-0 shadow-sm ${
          isMe ? 'bg-white text-indigo-600' : 'bg-indigo-600 text-white'
        }`}
      >
        {isPlaying ? (
          <Pause size={15} fill="currentColor" />
        ) : (
          <Play size={15} fill="currentColor" className="ml-0.5" />
        )}
      </button>

      <div className="flex-1 space-y-1">
        {/* Waveform graphic bars with progress fill */}
        <div className="flex items-center gap-[3px] h-5">
          {[6, 12, 18, 14, 8, 16, 20, 10, 14, 18, 8, 12, 16, 10, 6].map((h, i) => {
            const barPercent = (i / 15) * 100;
            const isFilled = progress >= barPercent;
            return (
              <span
                key={i}
                className={`w-[3px] rounded-full transition-colors duration-150 ${
                  isMe
                    ? isFilled ? 'bg-white' : 'bg-indigo-300/60'
                    : isFilled ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
                style={{ height: `${h}px` }}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono opacity-80">
          <span className="flex items-center gap-1">
            <Mic size={10} />
            <span>Voice Note</span>
          </span>
          <span>{formatSeconds(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export default AudioMessagePlayer;
