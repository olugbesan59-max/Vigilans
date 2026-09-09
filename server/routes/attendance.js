import express from 'express';
import { db } from '../db/database.js';
import { getAuthContext } from '../middleware/auth.js';

const router = express.Router();

// 1. Clock In via Barcode Scan
router.post('/clock-in', (req, res) => {
  const ctx = getAuthContext(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const { barcode_token, device_info } = req.body;
  if (!barcode_token) {
    return res.status(400).json({ error: 'Barcode token is required for clock-in.' });
  }

  // 1. Verify barcode matches company workspace
  if (barcode_token.trim() !== ctx.workspace.barcode_token) {
    return res.status(400).json({ error: 'Barcode not recognized for this company workspace.' });
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();

  // 2. Prevent duplicate clock-in
  const existingToday = db.findOne('attendance', a => 
    a.workspace_id === ctx.workspace.id && 
    a.user_id === ctx.user.id && 
    a.date === todayStr
  );

  if (existingToday) {
    if (existingToday.status === 'working') {
      return res.status(400).json({
        error: 'You are already clocked in for today.',
        attendance: existingToday
      });
    } else if (existingToday.status === 'clocked_out') {
      return res.status(400).json({
        error: 'You have already completed your shift and clocked out for today.',
        attendance: existingToday
      });
    }
  }

  // 3. Determine if Late based on office_start_time
  // e.g. office_start_time = "09:00"
  const [startHour, startMin] = (ctx.workspace.office_start_time || '09:00').split(':').map(Number);
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();

  const startTimeMinutes = startHour * 60 + startMin;
  const currentTimeMinutes = currentHour * 60 + currentMin;

  const isLate = currentTimeMinutes > startTimeMinutes;
  const lateMinutes = isLate ? currentTimeMinutes - startTimeMinutes : 0;

  // 4. Record Attendance
  const newRecord = db.insert('attendance', {
    workspace_id: ctx.workspace.id,
    user_id: ctx.user.id,
    date: todayStr,
    clock_in: now.toISOString(),
    clock_out: null,
    status: 'working',
    is_late: isLate,
    late_minutes: lateMinutes,
    total_duration: 0,
    device_info: device_info || 'Vigilans Web Scanner',
  });

  // 5. Add notification if late
  if (isLate) {
    db.insert('notifications', {
      workspace_id: ctx.workspace.id,
      user_id: ctx.user.id,
      type: 'attendance',
      title: 'Late Arrival Notice',
      message: `You clocked in at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, which is ${lateMinutes} minutes past start time (${ctx.workspace.office_start_time}).`,
      related_id: newRecord.id,
      read: false,
    });
  }

  db.insert('audit_logs', {
    workspace_id: ctx.workspace.id,
    user_id: ctx.user.id,
    action: isLate ? 'STAFF_CLOCKED_IN_LATE' : 'STAFF_CLOCKED_IN',
    details: `${ctx.user.first_name} ${ctx.user.last_name} clocked in via barcode scanner${isLate ? ` (${lateMinutes} min late)` : ''}.`,
  });

  res.status(201).json({
    message: isLate ? `Clock-in successful. You have been marked late by ${lateMinutes} minutes.` : 'Clock-in successful! Welcome to work.',
    attendance: newRecord,
    is_late: isLate,
    late_minutes: lateMinutes,
  });
});

// 2. Clock Out
router.post('/clock-out', (req, res) => {
  const ctx = getAuthContext(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();

  // Support owner/admin clocking out a specific staff member, or self clock-out
  const isPrivileged = ctx.user.system_role === 'owner' || ctx.user.system_role === 'admin';
  const targetUserId = (isPrivileged && req.body?.staffId) ? req.body.staffId : ctx.user.id;

  // Find active clock-in record for today (or most recent uncompleted)
  const record = db.findOne('attendance', a => 
    a.workspace_id === ctx.workspace.id && 
    a.user_id === targetUserId && 
    a.status === 'working'
  );

  if (!record) {
    return res.status(400).json({ error: 'No active clock-in record found to clock out.' });
  }

  const clockInTime = new Date(record.clock_in);
  const totalSeconds = Math.max(0, Math.floor((now.getTime() - clockInTime.getTime()) / 1000));

  const updated = db.update('attendance', record.id, {
    clock_out: now.toISOString(),
    status: 'clocked_out',
    total_duration: totalSeconds,
  });

  const staffTarget = db.findById('users', targetUserId) || ctx.user;

  db.insert('audit_logs', {
    workspace_id: ctx.workspace.id,
    user_id: ctx.user.id,
    action: 'STAFF_CLOCKED_OUT',
    details: `${staffTarget.first_name} ${staffTarget.last_name} clocked out${isPrivileged && targetUserId !== ctx.user.id ? ` (by ${ctx.user.first_name})` : ''}. Working duration: ${Math.floor(totalSeconds / 3600)}h ${Math.floor((totalSeconds % 3600) / 60)}m.`,
  });

  res.json({
    message: 'Clock-out recorded successfully. Great job today!',
    attendance: updated,
  });
});

// 3. Today's Attendance Overview & Live Staff Status (Dashboard Command Center)
router.get('/today', (req, res) => {
  const ctx = getAuthContext(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const todayStr = new Date().toISOString().split('T')[0];
  const staffList = db.find('users', u => u.workspace_id === ctx.workspace.id && u.status === 'active');
  const todayRecords = db.find('attendance', a => a.workspace_id === ctx.workspace.id && a.date === todayStr);

  const totalStaff = staffList.length;
  let currentlyClockedIn = 0;
  let presentToday = 0;
  let lateToday = 0;
  let clockedOut = 0;
  let onLeave = 0;

  const liveStaffList = staffList.map(u => {
    const att = todayRecords.find(a => a.user_id === u.id);
    let currentStatus = 'not_clocked_in';
    let durationSeconds = 0;

    if (att) {
      if (att.status === 'working') {
        currentlyClockedIn++;
        presentToday++;
        currentStatus = att.is_late ? 'late' : 'working';
        if (att.is_late) lateToday++;

        // Calculate live duration
        const inTime = new Date(att.clock_in).getTime();
        durationSeconds = Math.max(0, Math.floor((Date.now() - inTime) / 1000));
      } else if (att.status === 'clocked_out') {
        presentToday++;
        clockedOut++;
        currentStatus = 'clocked_out';
        if (att.is_late) lateToday++;
        durationSeconds = att.total_duration || 0;
      } else if (att.status === 'on_leave') {
        onLeave++;
        currentStatus = 'on_leave';
      }
    }

    return {
      user_id: u.id,
      name: `${u.first_name} ${u.last_name}`,
      profile_picture: u.profile_picture,
      role_title: u.role_title,
      department: u.department,
      status: currentStatus,
      is_late: att?.is_late || false,
      late_minutes: att?.late_minutes || 0,
      clock_in: att?.clock_in || null,
      clock_out: att?.clock_out || null,
      working_duration: durationSeconds,
      device_info: att?.device_info || null,
    };
  });

  const absentToday = Math.max(0, totalStaff - presentToday - onLeave);

  const formattedRecords = liveStaffList
    .filter(s => s.status !== 'not_clocked_in')
    .map(s => ({
      id: `att-${s.user_id}`,
      staffId: s.user_id,
      staffName: s.name,
      staffAvatar: s.profile_picture,
      roleTitle: s.role_title,
      department: s.department,
      clockInTime: s.clock_in,
      clockOutTime: s.clock_out,
      status: s.is_late ? 'late' : 'present',
      minutesLate: s.late_minutes,
      duration: s.working_duration,
    }));

  res.json({
    metrics: {
      total_staff: totalStaff,
      present_today: presentToday,
      currently_clocked_in: currentlyClockedIn,
      late_today: lateToday,
      absent_today: absentToday,
      clocked_out: clockedOut,
      on_leave: onLeave,
    },
    live_staff: liveStaffList,
    records: formattedRecords,
  });
});

// 4. Attendance History with filtering
router.get('/history', (req, res) => {
  const ctx = getAuthContext(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const { date_range, user_id, department, status, role } = req.query;

  let records = db.find('attendance', a => a.workspace_id === ctx.workspace.id);

  // If staff user, restrict to their own records unless admin/owner
  if (ctx.user.system_role === 'staff') {
    records = records.filter(a => a.user_id === ctx.user.id);
  } else if (user_id) {
    records = records.filter(a => a.user_id === user_id);
  }

  // Date range filtering
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  if (date_range === 'today') {
    records = records.filter(a => a.date === todayStr);
  } else if (date_range === 'this_week') {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    records = records.filter(a => new Date(a.date) >= weekAgo);
  } else if (date_range === 'this_month') {
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    records = records.filter(a => new Date(a.date) >= monthAgo);
  }

  if (status) {
    records = records.filter(a => a.status === status);
  }

  // Enrich with user profile info
  const enriched = records.map(a => {
    const staff = db.findById('users', a.user_id);
    return {
      ...a,
      employee_name: staff ? `${staff.first_name} ${staff.last_name}` : 'Unknown Staff',
      role_title: staff ? staff.role_title : 'Staff',
      department: staff ? staff.department : 'General',
      profile_picture: staff ? staff.profile_picture : '',
    };
  });

  // Further filter by department or role if requested
  let filtered = enriched;
  if (department) {
    filtered = filtered.filter(a => a.department.toLowerCase() === department.toLowerCase());
  }
  if (role) {
    filtered = filtered.filter(a => a.role_title.toLowerCase().includes(role.toLowerCase()));
  }

  filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  res.json(filtered);
});

// 5. Automatic Clock-out Background Routine
router.post('/auto-clockout', (req, res) => {
  const ctx = getAuthContext(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();

  // Find all active working staff
  const activeRecords = db.find('attendance', a => 
    a.workspace_id === ctx.workspace.id && 
    a.date === todayStr && 
    a.status === 'working'
  );

  let count = 0;
  for (const record of activeRecords) {
    const clockInTime = new Date(record.clock_in);
    const totalSeconds = Math.max(0, Math.floor((now.getTime() - clockInTime.getTime()) / 1000));

    db.update('attendance', record.id, {
      clock_out: now.toISOString(),
      status: 'clocked_out',
      total_duration: totalSeconds,
    });
    count++;
  }

  if (count > 0) {
    db.insert('audit_logs', {
      workspace_id: ctx.workspace.id,
      user_id: ctx.user.id,
      action: 'AUTOMATIC_CLOCK_OUT_EXECUTED',
      details: `Automatic clock-out process executed for ${count} staff members at ${ctx.workspace.automatic_clockout_time || '17:00'}.`,
    });
  }

  res.json({ message: `Successfully auto-clocked out ${count} active staff members.` });
});

export default router;
