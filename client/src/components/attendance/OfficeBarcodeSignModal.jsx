import React, { useRef, useState } from 'react';
import { 
  X, Printer, Download, RefreshCw, Shield, CheckCircle2, 
  Clock, AlertTriangle, Building2, Sparkles, Copy, Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiRequest } from '../../api';

export default function OfficeBarcodeSignModal({ isOpen, onClose }) {
  const { workspace, refreshWorkspace, isOwner, isAdmin } = useAuth();
  const { success, error, addToast } = useToast();

  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const barcodeToken = workspace?.barcode_token || workspace?.barcodeToken || 'VIGILANS-HQ-ATTENDANCE-KEY-9823';
  const companyName = workspace?.name || 'Vigilans Technologies Inc.';
  const officeStart = workspace?.attendanceSettings?.officeStartTime || workspace?.office_start_time || '09:00';
  const lateTime = workspace?.attendanceSettings?.lateThreshold || workspace?.late_threshold || '09:00';
  const autoOut = workspace?.attendanceSettings?.autoClockOutTime || workspace?.automatic_clockout_time || '17:00';

  const handleCopy = () => {
    navigator.clipboard?.writeText(barcodeToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (success) success('Barcode token copied to clipboard!');
    else addToast('Barcode token copied to clipboard!', 'success');
  };

  const handleRegenerate = async () => {
    if (!window.confirm('Regenerate official office barcode? Staff will need to scan the new code immediately after update.')) return;
    setIsRegenerating(true);
    try {
      await apiRequest('/workspaces/current/barcode-token', { method: 'POST' });
      await refreshWorkspace();
      if (success) success('New official office barcode generated successfully.');
      else addToast('New official office barcode generated successfully.', 'success');
    } catch (err) {
      if (error) error(err.message || 'Failed to regenerate barcode');
      else addToast(err.message || 'Failed to regenerate barcode', 'error');
    } finally {
      setIsRegenerating(false);
    }
  };

  // Download high-resolution PNG poster
  const handleDownloadPNG = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 1500;
      const ctx = canvas.getContext('2d');

      // 1. Background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Outer Card Border
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 12;
      ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

      // Inner decorative border
      ctx.strokeStyle = '#4F46E5';
      ctx.lineWidth = 4;
      ctx.strokeRect(55, 55, canvas.width - 110, canvas.height - 110);

      // 3. Top Header Bar
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(60, 60, canvas.width - 120, 160);

      // Header Text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 44px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(companyName.toUpperCase(), canvas.width / 2, 130);

      ctx.fillStyle = '#A5B4FC';
      ctx.font = '600 24px sans-serif';
      ctx.fillText('OFFICIAL WORKPLACE ATTENDANCE TERMINAL', canvas.width / 2, 180);

      // 4. Subtitle Callout
      ctx.fillStyle = '#1E293B';
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText('ATTENDANCE CHECK-IN BARCODE', canvas.width / 2, 290);

      ctx.fillStyle = '#64748B';
      ctx.font = '500 24px sans-serif';
      ctx.fillText('Scan with your smartphone camera or mobile browser to clock in', canvas.width / 2, 335);

      // 5. White Barcode Container Box
      const boxX = 140;
      const boxY = 380;
      const boxW = canvas.width - 280;
      const boxH = 460;

      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(boxX, boxY, boxW, boxH);
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 4;
      ctx.strokeRect(boxX, boxY, boxW, boxH);

      // Draw realistic variable Barcode Bars
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

      // Barcode Token Text
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 36px monospace';
      ctx.fillText(`* ${barcodeToken} *`, canvas.width / 2, boxY + 380);

      // 6. Shift Rules Banner
      const rulesY = 890;
      ctx.fillStyle = '#EEF2FF';
      ctx.fillRect(140, rulesY, canvas.width - 280, 140);
      ctx.strokeStyle = '#C7D2FE';
      ctx.lineWidth = 3;
      ctx.strokeRect(140, rulesY, canvas.width - 280, 140);

      ctx.fillStyle = '#1E1B4B';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(`Office Hours: ${officeStart} AM  •  Late After: ${lateTime} AM  •  Auto Clock-Out: ${autoOut} PM`, canvas.width / 2, rulesY + 80);

      // 7. Step-by-Step Instructions
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

      // 8. Footer Notice
      ctx.fillStyle = '#94A3B8';
      ctx.font = '500 18px sans-serif';
      ctx.fillText('Generated by Vigilans Enterprise Workspace • Keep mounted visibly at office reception', canvas.width / 2, 1420);

      // Download trigger
      const link = document.createElement('a');
      link.download = `${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_Office_Barcode_Sign.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      if (success) success('Office Barcode Sign (PNG) downloaded successfully!');
      else addToast('Office Barcode Sign (PNG) downloaded successfully!', 'success');
    } catch (e) {
      console.error('Download error:', e);
      if (error) error('Failed to generate PNG download');
      else addToast('Failed to generate PNG download', 'error');
    }
  };

  // Instant Print Isolated Office Poster
  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=850,height=1100');
    if (!printWindow) {
      window.print();
      return;
    }

    const printHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${companyName} - Official Office Barcode Sign</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              color: #0f172a;
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
              background: #fff;
            }
            .poster-container {
              width: 100%;
              max-width: 680px;
              border: 8px solid #0f172a;
              border-radius: 12px;
              padding: 24px;
              box-sizing: border-box;
              text-align: center;
            }
            .header-badge {
              background: #0f172a;
              color: #fff;
              padding: 16px 20px;
              border-radius: 8px;
              margin-bottom: 24px;
            }
            .company-name {
              font-size: 28px;
              font-weight: 900;
              letter-spacing: 0.5px;
              margin: 0;
              text-transform: uppercase;
            }
            .subtitle {
              font-size: 13px;
              font-weight: 600;
              color: #a5b4fc;
              margin-top: 6px;
              letter-spacing: 1px;
            }
            .title {
              font-size: 24px;
              font-weight: 800;
              margin: 16px 0 6px 0;
            }
            .tagline {
              font-size: 14px;
              color: #475569;
              margin-bottom: 24px;
            }
            .barcode-card {
              border: 3px solid #cbd5e1;
              background: #f8fafc;
              border-radius: 12px;
              padding: 28px 20px;
              margin: 0 auto 24px auto;
            }
            .bars-row {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 4px;
              height: 120px;
              margin-bottom: 14px;
            }
            .bar {
              background: #0f172a;
              height: 100%;
              border-radius: 1px;
            }
            .token-text {
              font-family: monospace;
              font-size: 22px;
              font-weight: 900;
              letter-spacing: 3px;
              color: #0f172a;
            }
            .rules-box {
              background: #eef2ff;
              border: 2px solid #c7d2fe;
              border-radius: 8px;
              padding: 12px 16px;
              font-size: 14px;
              font-weight: 700;
              color: #1e1b4b;
              margin-bottom: 24px;
            }
            .instructions {
              text-align: left;
              background: #f1f5f9;
              border-radius: 8px;
              padding: 16px 20px;
              font-size: 13px;
              line-height: 1.6;
              color: #334155;
            }
            .instructions h4 {
              margin: 0 0 8px 0;
              font-size: 14px;
              font-weight: 800;
              color: #0f172a;
            }
            .footer-note {
              margin-top: 24px;
              font-size: 11px;
              color: #94a3b8;
            }
          </style>
        </head>
        <body>
          <div class="poster-container">
            <div class="header-badge">
              <h1 class="company-name">${companyName}</h1>
              <div class="subtitle">OFFICIAL WORKPLACE ATTENDANCE TERMINAL</div>
            </div>

            <div class="title">ATTENDANCE CHECK-IN BARCODE</div>
            <div class="tagline">Scan with your smartphone camera to log your arrival timestamp</div>

            <div class="barcode-card">
              <div class="bars-row">
                ${[6, 2, 8, 3, 4, 9, 3, 5, 2, 7, 4, 8, 2, 6, 3, 10, 4, 2, 7, 3, 5, 9, 2, 4, 8, 3, 6, 2, 7, 4, 9, 3].map(w => `<span class="bar" style="width:${w * 2.2}px"></span>`).join('')}
              </div>
              <div class="token-text">* ${barcodeToken} *</div>
            </div>

            <div class="rules-box">
              Office Hours: ${officeStart} AM &nbsp;•&nbsp; Late After: ${lateTime} AM &nbsp;•&nbsp; Auto Clock-Out: ${autoOut} PM
            </div>

            <div class="instructions">
              <h4>EMPLOYEE SIGN-IN INSTRUCTIONS:</h4>
              <ol style="margin: 0; padding-left: 20px;">
                <li>Open <strong>Vigilans Workspace</strong> on your smartphone.</li>
                <li>Tap <strong>"Clock In / Barcode"</strong> on your dashboard or header.</li>
                <li>Point your camera at this barcode to record your check-in.</li>
              </ol>
            </div>

            <div class="footer-note">
              Vigilans Enterprise Workplace • Mount prominently at front reception or entry gate
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printHTML);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-900/50 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">Office Attendance Barcode Sign</h3>
              <p className="text-[11px] sm:text-xs text-slate-400">Download or print for your office entrance and reception standee</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Poster Preview */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
          
          {/* Visual Printable Poster Preview */}
          <div className="bg-white rounded-2xl border-2 sm:border-4 border-slate-900 p-4 sm:p-6 text-center text-slate-900 shadow-xl max-w-lg mx-auto w-full">
            {/* Top Company Banner */}
            <div className="bg-slate-900 text-white rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-black tracking-wider uppercase truncate">{companyName}</h2>
              <p className="text-[10px] sm:text-[11px] font-semibold text-indigo-300 uppercase tracking-widest mt-0.5">
                Official Workplace Attendance Terminal
              </p>
            </div>

            <h4 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
              ATTENDANCE CHECK-IN BARCODE
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Staff scan with smartphone camera to record arrival
            </p>

            {/* Barcode Graphic Block */}
            <div className="my-3 sm:my-4 p-3 sm:p-4 bg-slate-50 border-2 border-slate-200 rounded-xl flex flex-col items-center shadow-inner overflow-hidden">
              <div className="flex items-center gap-0.5 sm:gap-1 h-16 sm:h-20 px-1 sm:px-2 max-w-full overflow-hidden">
                {[5, 2, 7, 3, 4, 8, 3, 5, 2, 7, 4, 8, 2, 6, 3, 9, 4, 2, 7, 3, 5, 8, 2, 4, 7, 3, 6, 2, 7, 4, 8, 3].map((w, idx) => (
                  <span key={idx} className="bg-slate-900 h-full rounded-xs" style={{ width: `${w}px` }} />
                ))}
              </div>
              <div className="mt-2.5 sm:mt-3 flex items-center justify-center gap-1.5 sm:gap-2 max-w-full px-2">
                <span className="font-mono text-xs sm:text-sm font-black text-slate-900 tracking-wider sm:tracking-widest break-all text-center">
                  * {barcodeToken} *
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  title="Copy token string"
                  className="p-1 hover:bg-slate-200 rounded text-slate-600 transition flex-shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Office Rules */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-2 sm:p-2.5 text-[10px] sm:text-xs text-indigo-950 font-bold flex items-center justify-around flex-wrap gap-1">
              <span>Start: {officeStart} AM</span>
              <span>•</span>
              <span className="text-amber-700">Late: {lateTime} AM</span>
              <span>•</span>
              <span>Depart: {autoOut} PM</span>
            </div>

            <div className="mt-2.5 sm:mt-3 text-[10px] sm:text-[11px] text-slate-400 font-medium">
              Point camera at this sign • Instant timestamp & anti-proxy validation
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            
            {/* Primary actions: Print & Download */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Print Office Sign</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPNG}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-bold transition active:scale-95"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Download Sign (PNG)</span>
              </button>
            </div>

            {/* Admin control: Regenerate */}
            {(isOwner || isAdmin) && (
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin text-indigo-400' : ''}`} />
                <span>Regenerate Barcode</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
