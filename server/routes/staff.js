import express from 'express';
import { db } from '../db/database.js';
import { sanitizeUser } from './auth.js';
import { getAuthContext } from '../middleware/auth.js';

const router = express.Router();

// 1. Get all staff in workspace with real-time status & task count
router.get('/', (req, res) => {
  const ctx = getAuthContext(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const todayStr = new Date().toISOString().split('T')[0];
  const allUsers = db.find('users', u => u.workspace_id === ctx.workspace.id);

  const staffWithStats = allUsers.map(u => {
    // Current attendance today
    const todayAtt = db.findOne('attendance', a => a.workspace_id === ctx.workspace.id && a.user_id === u.id && a.date === todayStr);

    let currentStatus = 'not_clocked_in';
    if (todayAtt) {
      if (todayAtt.status === 'working') {
        currentStatus = todayAtt.is_late ? 'late' : 'working';
      } else if (todayAtt.status === 'clocked_out') {
        currentStatus = 'clocked_out';
      } else if (todayAtt.status === 'on_leave') {
        currentStatus = 'on_leave';
      }
    }

    // Tasks assigned and completed
    const userTasks = db.find('tasks', t => t.workspace_id === ctx.workspace.id && t.assignees?.includes(u.id));
    const completedTasks = userTasks.filter(t => t.status === 'completed').length;

    return {
      ...sanitizeUser(u),
      current_status: currentStatus,
      attendance_today: todayAtt,
      tasks_count: userTasks.length,
      tasks_completed: completedTasks,
    };
  });

  res.json(staffWithStats);
});

// 2. Add new staff member directly (Owner or Admin)
router.post('/', (req, res) => {
  const ctx = getAuthContext(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });
  if (ctx.user.system_role === 'staff') {
    return res.status(403).json({ error: 'Staff members cannot add new employees.' });
  }

  const { first_name, last_name, email, phone, role_title, department, system_role, password } = req.body;
  if (!first_name || !last_name || !email || !role_title) {
    return res.status(400).json({ error: 'First name, last name, email, and role title are required.' });
  }

  const existing = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'An employee with this email already exists.' });
  }

  const newStaff = db.insert('users', {
    workspace_id: ctx.workspace.id,
    first_name,
    last_name,
    email: email.toLowerCase(),
    phone: phone || '',
    password: password || 'Welcome123!',
    profile_picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=250&auto=format&fit=crop&q=80',
    role_title,
    department: department || 'General',
    system_role: system_role || 'staff',
    status: 'active',
  });

  // Add to General chat
  const generalConv = db.findOne('conversations', c => c.workspace_id === ctx.workspace.id && c.type === 'group');
  if (generalConv && !generalConv.participant_ids.includes(newStaff.id)) {
    generalConv.participant_ids.push(newStaff.id);
    db.update('conversations', generalConv.id, { participant_ids: generalConv.participant_ids });
  }

  db.insert('audit_logs', {
    workspace_id: ctx.workspace.id,
    user_id: ctx.user.id,
    action: 'STAFF_ADDED',
    details: `${first_name} ${last_name} (${role_title}) was added by ${ctx.user.first_name} ${ctx.user.last_name}.`,
  });

  res.status(201).json(sanitizeUser(newStaff));
});

// 3. Update staff member (Owner or Admin)
router.put('/:id', (req, res) => {
  const ctx = getAuthContext(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });
  if (ctx.user.system_role === 'staff' && ctx.user.id !== req.params.id) {
    return res.status(403).json({ error: 'Permission denied.' });
  }

  const target = db.findById('users', req.params.id);
  if (!target || target.workspace_id !== ctx.workspace.id) {
    return res.status(404).json({ error: 'Employee not found.' });
  }

  const { first_name, last_name, phone, role_title, department, system_role, bio, profile_picture, status } = req.body;

  const updates = {};
  if (first_name) updates.first_name = first_name;
  if (last_name) updates.last_name = last_name;
  if (phone !== undefined) updates.phone = phone;
  if (role_title) updates.role_title = role_title;
  if (department) updates.department = department;
  if (bio !== undefined) updates.bio = bio;
  if (profile_picture) updates.profile_picture = profile_picture;
  if (status) updates.status = status;

  // Only Owner can promote or change system_role
  if (system_role && ctx.user.system_role === 'owner') {
    updates.system_role = system_role;
  }

  const updated = db.update('users', target.id, updates);

  db.insert('audit_logs', {
    workspace_id: ctx.workspace.id,
    user_id: ctx.user.id,
    action: 'STAFF_UPDATED',
    details: `Profile of ${target.first_name} ${target.last_name} was updated.`,
  });

  res.json(sanitizeUser(updated));
});

// 4. Suspend or activate staff (Owner or Admin)
router.put('/:id/status', (req, res) => {
  const ctx = getAuthContext(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });
  if (ctx.user.system_role === 'staff') {
    return res.status(403).json({ error: 'Staff members cannot change employee account status.' });
  }

  const target = db.findById('users', req.params.id);
  if (!target || target.workspace_id !== ctx.workspace.id) {
    return res.status(404).json({ error: 'Employee not found.' });
  }

  if (target.system_role === 'owner') {
    return res.status(400).json({ error: 'The company Owner account cannot be suspended.' });
  }

  const newStatus = target.status === 'active' ? 'suspended' : 'active';
  const updated = db.update('users', target.id, { status: newStatus });

  db.insert('audit_logs', {
    workspace_id: ctx.workspace.id,
    user_id: ctx.user.id,
    action: newStatus === 'suspended' ? 'STAFF_SUSPENDED' : 'STAFF_ACTIVATED',
    details: `Staff account ${target.first_name} ${target.last_name} status changed to ${newStatus}.`,
  });

  res.json(sanitizeUser(updated));
});

// 5. Delete staff member (Owner only)
router.delete('/:id', (req, res) => {
  const ctx = getAuthContext(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });
  if (ctx.user.system_role !== 'owner') {
    return res.status(403).json({ error: 'Only the company Owner can delete employees.' });
  }

  const target = db.findById('users', req.params.id);
  if (!target || target.workspace_id !== ctx.workspace.id) {
    return res.status(404).json({ error: 'Employee not found.' });
  }

  if (target.system_role === 'owner') {
    return res.status(400).json({ error: 'The Owner account cannot be removed.' });
  }

  db.delete('users', target.id);

  db.insert('audit_logs', {
    workspace_id: ctx.workspace.id,
    user_id: ctx.user.id,
    action: 'STAFF_DELETED',
    details: `${target.first_name} ${target.last_name} was removed from the workspace.`,
  });

  res.json({ message: 'Staff member removed successfully.' });
});

export default router;
