import express from 'express';
import { db } from '../db/database.js';
import { getAuthContext } from '../middleware/auth.js';

const router = express.Router();

// 1. Get all meetings in workspace
router.get('/', (req, res) => {
  const ctx = getAuthContext(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const meetings = db.find('meetings', m => m.workspace_id === ctx.workspace.id);

  const enriched = meetings.map(m => {
    const creator = db.findById('users', m.created_by);
    const invitees = (m.invited_user_ids || []).map(id => {
      const u = db.findById('users', id);
      return u ? { id: u.id, name: `${u.first_name} ${u.last_name}`, role_title: u.role_title, profile_picture: u.profile_picture } : null;
    }).filter(Boolean);

    return {
      ...m,
      creator_name: creator ? `${creator.first_name} ${creator.last_name}` : 'Company Admin',
      invitees_details: invitees,
    };
  });

  enriched.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  res.json(enriched);
});

// 2. Schedule a new meeting (Owner or Admin)
router.post('/', (req, res) => {
  const ctx = getAuthContext(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });
  if (ctx.user.system_role === 'staff') {
    return res.status(403).json({ error: 'Only Owners and Admins can schedule company meetings.' });
  }

  const { title, description, start_time, scheduled_time, scheduledTime, end_time, duration_minutes, durationMinutes, agenda, invited_user_ids } = req.body;
  const startTime = start_time || scheduled_time || scheduledTime;
  if (!title || !startTime) {
    return res.status(400).json({ error: 'Title and start time are required.' });
  }

  const meetingId = `meet-${Date.now()}`;
  const roomId = `room-${Math.random().toString(36).substr(2, 9)}`;

  const newMeeting = db.insert('meetings', {
    id: meetingId,
    workspace_id: ctx.workspace.id,
    title,
    description: description || '',
    start_time: startTime,
    scheduled_time: startTime,
    end_time: end_time || null,
    duration_minutes: duration_minutes || durationMinutes || 45,
    created_by: ctx.user.id,
    meeting_link: roomId,
    invited_user_ids: Array.isArray(invited_user_ids) && invited_user_ids.length > 0 
      ? invited_user_ids 
      : db.find('users', u => u.workspace_id === ctx.workspace.id).map(u => u.id), // defaults to all staff
    agenda: agenda || '',
    status: 'scheduled', // 'scheduled' | 'in_progress' | 'completed'
  });

  // Notify invited staff
  newMeeting.invited_user_ids.forEach(uId => {
    if (uId !== ctx.user.id) {
      db.insert('notifications', {
        workspace_id: ctx.workspace.id,
        user_id: uId,
        type: 'meeting',
        title: 'Meeting Scheduled',
        message: `${ctx.user.first_name} invited you to "${title}"`,
        related_id: newMeeting.id,
        read: false,
      });
    }
  });

  db.insert('audit_logs', {
    workspace_id: ctx.workspace.id,
    user_id: ctx.user.id,
    action: 'MEETING_SCHEDULED',
    details: `Meeting "${title}" scheduled for ${start_time}.`,
  });

  res.status(201).json(newMeeting);
});

// 3. Start or update meeting status
router.put('/:id/status', (req, res) => {
  const ctx = getAuthContext(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const meeting = db.findById('meetings', req.params.id);
  if (!meeting || meeting.workspace_id !== ctx.workspace.id) {
    return res.status(404).json({ error: 'Meeting not found.' });
  }

  const { status } = req.body;
  const updated = db.update('meetings', meeting.id, { status });

  if (status === 'in_progress') {
    db.insert('audit_logs', {
      workspace_id: ctx.workspace.id,
      user_id: ctx.user.id,
      action: 'MEETING_STARTED',
      details: `${ctx.user.first_name} started meeting room for "${meeting.title}".`,
    });
  }

  res.json(updated);
});

export default router;
