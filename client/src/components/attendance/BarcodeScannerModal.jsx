import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Camera, CheckCircle2, AlertCircle, X, Shield, Sparkles, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiRequest } from '../../api';

export const BarcodeScannerModal = ({ isOpen, onClose, onClockInSuccess }) => {
  const { workspace, user } = useAuth();
  const { success, error, warning, addToast } = useToast();

  const [hasCamera, setHasCamera] = useState(true);
  const [cameraError, setCameraError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Initialize camera stream when opened
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScanResult(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCamera(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setHasCamera(true);
    } catch (err) {
      console.warn('Camera stream simulation fallback:', err.message);
      setHasCamera(false);
      setCameraError('Physical camera not active. Use the 1-click simulation button below to test barcode clock-in.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Perform Clock-In with Barcode Token
  const executeClockIn = async (tokenToUse) => {
    setIsScanning(true);
    try {
      const activeToken = tokenToUse || workspace?.barcode_token || 'VIGILANS-HQ-88291';
      const res = await apiRequest('/attendance/clock-in', {
        method: 'POST',
        body: JSON.stringify({
          barcode_token: activeToken,
          device_info: `Vigilans Web Terminal (${navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'})`,
        }),
      });

      setScanResult(res);
      if (res.is_late) {
        if (warning) warning(`Clocked in! Note: Marked late by ${res.late_minutes || 0} minutes.`);
        else addToast(`Clocked in! Note: Marked late by ${res.late_minutes || 0} minutes.`, 'warning');
      } else {
        if (success) success('Successfully clocked in on time! Have a productive shift.');
        else addToast('Successfully clocked in on time! Have a productive shift.', 'success');
      }

      if (onClockInSuccess) onClockInSuccess(res);
    } catch (err) {
      const msg = err.message || 'Clock-in failed';
      if (error) error(msg);
      else addToast(msg, 'error');
      setScanResult({ error: msg });
    } finally {
      setIsScanning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <QrCode size={20} />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Attendance Barcode Scanner</h3>
              <p className="text-[11px] text-slate-400">Scan office barcode to record attendance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scanner Viewport */}
        <div className="p-6 flex flex-col items-center">
          {scanResult ? (
            /* Result Screen */
            <div className="w-full text-center py-4 space-y-4">
              {scanResult.error ? (
                <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300">
                  <AlertCircle size={40} className="mx-auto text-rose-400 mb-2" />
                  <p className="font-bold text-sm">Clock-In Notice</p>
                  <p className="text-xs mt-1">{scanResult.error}</p>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 space-y-2">
                  <CheckCircle2 size={44} className="mx-auto text-emerald-400 mb-1" />
                  <p className="font-bold text-sm text-white">Attendance Confirmed!</p>
                  <p className="text-xs text-slate-300">
                    Staff: <strong className="text-white">{scanResult.employee_name || user?.fullName || 'You'}</strong>
                  </p>
                  <p className="text-xs text-slate-300">
                    Status: <strong className={scanResult.is_late ? 'text-amber-400' : 'text-emerald-400'}>
                      {scanResult.is_late ? `Late (+${scanResult.late_minutes}m)` : 'On Time'}
                    </strong>
                  </p>
                </div>
              )}

              <button
                onClick={() => {
                  setScanResult(null);
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition"
              >
                Close Scanner
              </button>
            </div>
          ) : (
            /* Live Camera / Scanner View */
            <div className="w-full space-y-4">
              <div className="relative w-full h-56 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center">
                {hasCamera ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4">
                    <Camera size={36} className="mx-auto text-slate-600 mb-2" />
                    <p className="text-xs font-semibold text-slate-300">Camera Terminal Ready</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Target office front-desk barcode or click below
                    </p>
                  </div>
                )}

                {/* Laser Scanning Line Animation */}
                <div className="absolute inset-x-4 top-4 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent scanner-laser shadow-[0_0_8px_#34d399]" />

                {/* Corner Targeting Brackets */}
                <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-indigo-400 rounded-tl pointer-events-none" />
                <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-indigo-400 rounded-tr pointer-events-none" />
                <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-indigo-400 rounded-bl pointer-events-none" />
                <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-indigo-400 rounded-br pointer-events-none" />
              </div>

              {cameraError && (
                <p className="text-[11px] text-slate-400 text-center bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  {cameraError}
                </p>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => executeClockIn(workspace?.barcode_token || 'VIGILANS-HQ-88291')}
                  disabled={isScanning}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/25 active:scale-[0.98] disabled:opacity-50"
                >
                  {isScanning ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Validating Barcode Token...</span>
                    </>
                  ) : (
                    <>
                      <QrCode size={16} />
                      <span>Scan Office Barcode (Clock In)</span>
                    </>
                  )}
                </button>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-500 px-1 pt-1">
                  <span>Workspace: <strong className="text-slate-300">{workspace?.name || 'Vigilans'}</strong></span>
                  <span className="truncate">Token: <strong className="text-indigo-400 font-mono break-all">{workspace?.barcode_token || 'VIGILANS-HQ-88291'}</strong></span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BarcodeScannerModal;
