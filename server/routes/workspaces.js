import express from 'express';
import { db } from '../db/database.js';
import { getAuthContext } from '../middleware/auth.js';

const router = express.Router();

// 1. Get current workspace
router.get('/current', (req, res) => {
  const ctx = getAuthContext(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const ws = ctx.workspace;
  res.json({
    ...ws,
    inviteCode: ws.invite_code,
    barcodeToken: ws.barcode_token,
    attendanceSettings: {
      officeStartTime: ws.office_start_time || '09:00',
      lateThreshold: ws.late_threshold || '09:00',
      autoClockOutTime: ws.automatic_clockout_time || '17:00',
      barcodeToken: ws.barcode_token
    }
  });
});

// 2. Update workspace profile (Owner or Admin)
router.put('/current', (req, res) => {
  const ctx = getAuthContext(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });
  if (ctx.user.system_role !== 'owner' && ctx.user.system_role !== 'admin') {
    return res.status(403).json({ error: 'Only the company Owner or Admin can update workspace settings.' });
  }

  const { name, logo, description, website, location, attendanceSettings, office_start_time, late_threshold, automatic_clockout_time, barcode_token } = req.body;
  
  const updates = {};
  if (name) updates.name = name;
  if (logo !== undefined) updates.logo = logo;
  if (description !== undefined) updates.description = description;
  if (website !== undefined) updates.website = website;
  if (location !== undefined) updates.location = location;

  if (office_start_time) updates.office_start_time = office_start_time;
  if (late_threshold) updates.late_threshold = late_threshold;
  if (automatic_clockout_time) updates.automatic_clockout_time = automatic_clockout_time;
  if (barcode_token) updates.barcode_token = barcode_token;

  if (attendanceSettings) {
    if (attendanceSettings.officeStartTime) updates.office_start_time = attendanceSettings.officeStartTime;
    if (attendanceSettings.lateThreshold) updates.late_threshold = attendanceSettings.lateThreshold;
    if (attendanceSettings.autoClockOutTime) updates.automatic_clockout_time = attendanceSettings.autoClockOutTime;
    if (attendanceSettings.barcodeToken) updates.barcode_token = attendanceSettings.barcodeToken;
  }

  const updated = db.update('workspaces', ctx.workspace.id, updates);

  db.insert('audit_logs', {
    workspace_id: ctx.workspace.id,
    user_id: ctx.user.id,
    action: 'SETTINGS_CHANGED',
    details: 'Company profile and attendance settings were updated.',
  });

  res.json({
    ...updated,
    inviteCode: updated.invite_code,
    barcodeToken: updated.barcode_token,
    attendanceSettings: {
      officeStartTime: updated.office_start_time || '09:00',
      lateThreshold: updated.late_threshold || '09:00',
      autoClockOutTime: updated.automatic_clockout_time || '17:00',
      barcodeToken: updated.barcode_token
    }
  });
});

// 3. Update attendance & barcode rules (Owner or Admin)
router.put('/attendance-settings', (req, res) => {
  const ctx = getAuthContext(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });
  if (ctx.user.system_role === 'staff') {
    return res.status(403).json({ error: 'Staff members cannot modify attendance rules.' });
  }

  const { office_start_time, late_threshold, automatic_clockout_time, regenerate_barcode } = req.body;

  const updates = {};
  if (office_start_time) updates.office_start_time = office_start_time;
  if (late_threshold) updates.late_threshold = late_threshold;
  if (automatic_clockout_time) updates.automatic_clockout_time = automatic_clockout_time;
  if (regenerate_barcode) {
    updates.barcode_token = `VIGILANS-HQ-${Math.floor(10000 + Math.random() * 90000)}`;
  }

  const updated = db.update('workspaces', ctx.workspace.id, updates);

  db.insert('audit_logs', {
    workspace_id: ctx.workspace.id,
    user_id: ctx.user.id,
    action: 'ATTENDANCE_SETTINGS_UPDATED',
    details: `Attendance settings updated: Start: ${updated.office_start_time}, Late: ${updated.late_threshold}, Auto Clock-Out: ${updated.automatic_clockout_time}`,
  });

  res.json(updated);
});

// 3.5. Regenerate barcode token (Owner or Admin)
router.post('/current/barcode-token', (req, res) => {
  const ctx = getAuthContext(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });
  if (ctx.user.system_role === 'staff') {
    return res.status(403).json({ error: 'Staff members cannot regenerate barcode tokens.' });
  }

  const newToken = `VIGILANS-HQ-${Math.floor(10000 + Math.random() * 90000)}`;
  const updated = db.update('workspaces', ctx.workspace.id, { barcode_token: newToken });

  db.insert('audit_logs', {
    workspace_id: ctx.workspace.id,
    user_id: ctx.user.id,
    action: 'BARCODE_TOKEN_REGENERATED',
    details: `Workspace barcode token regenerated: ${newToken}`,
  });

  res.json({ barcode_token: newToken, workspace: updated });
});

// 4. Get workspace audit log
router.get('/audit-logs', (req, res) => {
  const ctx = getAuthContext(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });
  if (ctx.user.system_role === 'staff') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const logs = db.find('audit_logs', l => l.workspace_id === ctx.workspace.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Attach user names to audit records
  const enriched = logs.map(l => {
    const actor = db.findById('users', l.user_id);
    return {
      ...l,
      user_name: actor ? `${actor.first_name} ${actor.last_name}` : 'System',
      user_role: actor ? actor.role_title : 'Platform',
    };
  });

  res.json(enriched);
});

export default router;
