import express from 'express';
import { db } from '../db/database.js';
import { getAuthContext } from '../middleware/auth.js';

const router = express.Router();

// 1. Get company announcements
router.get('/', (req, res) => {
  const ctx = getAuthContext(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const list = db.find('announcements', a => a.workspace_id === ctx.workspace.id);

  const enriched = list.map(a => {
    const author = db.findById('users', a.created_by);
    return {
      ...a,
      author_name: author ? `${author.first_name} ${author.last_name}` : 'Company Management',
      author_role: author ? author.role_title : 'Admin',
      author_avatar: author ? author.profile_picture : '',
    };
  });

  enriched.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(enriched);
});

// 2. Create announcement (Owner/Admin only)
router.post('/', (req, res) => {
  const ctx = getAuthContext(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });
  if (ctx.user.system_role === 'staff') {
    return res.status(403).json({ error: 'Only Owners and Admins can publish announcements.' });
  }

  const { title, content, priority, attachment_url } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required.' });
  }

  const announcement = db.insert('announcements', {
    workspace_id: ctx.workspace.id,
    created_by: ctx.user.id,
    title,
    content,
    priority: priority || 'important', // 'urgent' | 'important' | 'general'
    attachment_url: attachment_url || null,
  });

  // Create notifications for all staff
  const staffMembers = db.find('users', u => u.workspace_id === ctx.workspace.id && u.id !== ctx.user.id);
  staffMembers.forEach(s => {
    db.insert('notifications', {
      workspace_id: ctx.workspace.id,
      user_id: s.id,
      type: 'announcement',
      title: `Announcement: ${title}`,
      message: content.substring(0, 80) + '...',
      related_id: announcement.id,
      read: false,
    });
  });

  db.insert('audit_logs', {
    workspace_id: ctx.workspace.id,
    user_id: ctx.user.id,
    action: 'ANNOUNCEMENT_POSTED',
    details: `Announcement "${title}" was broadcast to the company.`,
  });

  res.status(201).json({
    ...announcement,
    author_name: `${ctx.user.first_name} ${ctx.user.last_name}`,
    author_role: ctx.user.role_title,
    author_avatar: ctx.user.profile_picture,
  });
});

export default router;
