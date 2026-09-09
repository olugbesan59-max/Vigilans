import React, { useState } from 'react';
import { QrCode, Printer, RefreshCw, Download, ExternalLink, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiRequest } from '../../api';
import OfficeBarcodeSignModal from './OfficeBarcodeSignModal';

export const BarcodeGeneratorCard = ({ onOpenPosterModal }) => {
  const { workspace, refreshWorkspace, isOwner, isAdmin } = useAuth();
  const { success, error, addToast } = useToast();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const barcodeToken = workspace?.barcode_token || workspace?.barcodeToken || 'VIGILANS-HQ-ATTENDANCE-KEY-9823';
  const companyName = workspace?.name || 'Vigilans Technologies';

  const handleRegenerate = async () => {
    if (!window.confirm('Regenerate company barcode? Staff must scan the new barcode after updating.')) return;
    setIsRegenerating(true);
    try {
      await apiRequest('/workspaces/current/barcode-token', { method: 'POST' });
      await refreshWorkspace();
      if (success) success('New company barcode generated successfully.');
      else addToast('New company barcode generated successfully.', 'success');
    } catch (err) {
      if (error) error(err.message || 'Failed to regenerate barcode');
      else addToast(err.message || 'Failed to regenerate barcode', 'error');
    } finally {
      setIsRegenerating(false);
    }
  };

  // Download high-resolution PNG
  const handleDownloadPNG = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 1500;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 12;
      ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

      ctx.fillStyle = '#0F172A';
      ctx.fillRect(60, 60, canvas.width - 120, 160);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 44px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(companyName.toUpperCase(), canvas.width / 2, 130);

      ctx.fillStyle = '#A5B4FC';
      ctx.font = '600 24px sans-serif';
      ctx.fillText('OFFICIAL WORKPLACE ATTENDANCE TERMINAL', canvas.width / 2, 180);

      ctx.fillStyle = '#1E293B';
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText('ATTENDANCE CHECK-IN BARCODE', canvas.width / 2, 290);

      ctx.fillStyle = '#64748B';
      ctx.font = '500 24px sans-serif';
      ctx.fillText('Scan with your smartphone camera or mobile browser to clock in', canvas.width / 2, 335);

      const boxX = 140;
      const boxY = 380;
      const boxW = canvas.width - 280;
      const boxH = 460;

      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(boxX, boxY, boxW, boxH);
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 4;
      ctx.strokeRect(boxX, boxY, boxW, boxH);

      const barcodeStartY = boxY + 60;
      const barcodeHeight = 260;
      const barPattern = [
        6, 2, 8, 3, 4, 9, 3, 5, 2, 7, 4, 8, 2, 6, 3, 10, 4, 2, 7, 3,
        5, 9, 2, 4, 8, 3, 6, 2, 7, 4, 9, 3, 5, 2, 8, 4, 6, 3, 7, 2,
        9, 4, 3, 6, 2, 8, 5, 3, 7, 4, 2, 9, 3, 6, 4, 8, 2, 5, 7, 3
      ];

      const totalBarsWidth = barPattern.reduce((acc, val) => acc + val * 2.8 + 6, 0);
      let currentX = (canvas.width - totalBarsWidth) / 2;

      ctx.fillStyle = '#0F172A';
      for (let i = 0; i < barPattern.length; i++) {
        const barW = barPattern[i] * 2.8;
        ctx.fillRect(currentX, barcodeStartY, barW, barcodeHeight);
        currentX += barW + 6;
      }

      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 36px monospace';
      ctx.fillText(`* ${barcodeToken} *`, canvas.width / 2, boxY + 380);

      const rulesY = 890;
      ctx.fillStyle = '#EEF2FF';
      ctx.fillRect(140, rulesY, canvas.width - 280, 140);
      ctx.strokeStyle = '#C7D2FE';
      ctx.lineWidth = 3;
      ctx.strokeRect(140, rulesY, canvas.width - 280, 140);

      ctx.fillStyle = '#1E1B4B';
      ctx.font = 'bold 24px sans-serif';
      const officeStart = workspace?.office_start_time || '09:00';
      const lateTime = workspace?.late_threshold || '09:00';
      const autoOut = workspace?.automatic_clockout_time || '17:00';
      ctx.fillText(`Office Hours: ${officeStart} AM  •  Late After: ${lateTime} AM  •  Auto Clock-Out: ${autoOut} PM`, canvas.width / 2, rulesY + 80);

      const instY = 1080;
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HOW TO CLOCK IN:', canvas.width / 2, instY);

      ctx.fillStyle = '#334155';
      ctx.font = '500 22px sans-serif';
      ctx.fillText('1. Open Vigilans on your smartphone at office arrival', canvas.width / 2, instY + 50);
      ctx.fillText('2. Tap the "Scan Barcode / Clock In" button at the top header', canvas.width / 2, instY + 90);
      ctx.fillText('3. Align your camera over this barcode to verify arrival immediately', canvas.width / 2, instY + 130);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '500 18px sans-serif';
      ctx.fillText('Generated by Vigilans Enterprise Workspace • Keep mounted visibly at office reception', canvas.width / 2, 1420);

      const link = document.createElement('a');
      link.download = `${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_Office_Barcode_Sign.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      if (success) success('Office Barcode Sign (PNG) downloaded successfully!');
      else addToast('Office Barcode Sign (PNG) downloaded successfully!', 'success');
    } catch (e) {
      console.error(e);
      if (error) error('Failed to download barcode image');
      else addToast('Failed to download barcode image', 'error');
    }
  };

  const handlePrint = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Visual Barcode Graphic */}
        <div className="flex flex-col items-center p-6 bg-slate-50 border border-slate-200 rounded-2xl shadow-inner text-center w-full md:w-auto">
          <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-sm mb-2 shadow-md shadow-indigo-600/20">
            V
          </div>
          <span className="font-bold text-xs text-slate-800 tracking-tight">{companyName}</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5 font-medium">Official Check-In Terminal</span>

          {/* Scalable Barcode Stripes */}
          <div className="my-4 p-3 bg-white border border-slate-300 rounded-lg flex flex-col items-center shadow-sm">
            <div className="flex items-center gap-[2px] h-16 px-3">
              {[4, 2, 6, 1, 3, 5, 2, 4, 1, 6, 3, 2, 5, 1, 4, 2, 6, 3, 1, 5, 2, 4, 3, 6, 1, 2, 5, 3, 4, 2, 6, 1].map((w, idx) => (
                <span key={idx} className="bg-slate-900 h-full rounded-xs" style={{ width: `${w}px` }} />
              ))}
            </div>
            <span className="font-mono text-xs font-bold text-slate-800 tracking-widest mt-2">
              * {barcodeToken} *
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active Check-In Endpoint</span>
          </div>
        </div>

        {/* Info & Controls */}
        <div className="flex-1 space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-slate-900">Office Attendance Check-In Barcode</h4>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Authorized Admin View
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Print this placard to place at your office reception or front door. Staff members scan this code with their smartphone camera to log on-time arrival without proxy check-ins.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400">Office Start</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{workspace?.office_start_time || '09:00'} AM</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400">Late After</span>
              <p className="text-sm font-bold text-amber-600 mt-0.5">{workspace?.late_threshold || '09:00'} AM</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400">Auto Clock-Out</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{workspace?.automatic_clockout_time || '17:00'} PM</p>
            </div>
          </div>

          {(isOwner || isAdmin) && (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition active:scale-95 cursor-pointer"
              >
                <Printer size={15} />
                <span>Print Office Sign</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPNG}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                <Download size={15} className="text-emerald-400" />
                <span>Download Sign (PNG)</span>
              </button>

              <button
                type="button"
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={15} className={isRegenerating ? 'animate-spin' : ''} />
                <span>Regenerate Key</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Office Barcode Sign Full Print/Preview Modal */}
      <OfficeBarcodeSignModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};

export default BarcodeGeneratorCard;
