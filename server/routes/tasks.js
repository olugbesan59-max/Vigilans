import express from 'express';
import { db } from '../db/database.js';
import { getAuthContext } from '../middleware/auth.js';

const router = express.Router();

// 1. Get all tasks + dashboard statistics
router.get('/', (req, res) => {
  const ctx = getAuthContext(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const { status, priority, assignee_id } = req.query;

  let tasks = db.find('tasks', t => t.workspace_id === ctx.workspace.id);

  // If staff user, they can see all workspace tasks or filter by their own
  if (assignee_id) {
    tasks = tasks.filter(t => t.assignees?.includes(assignee_id));
  }
  if (status) {
    tasks = tasks.filter(t => t.status === status);
  }
  if (priority) {
    tasks = tasks.filter(t => t.priority === priority);
  }

  // Calculate stats over all workspace tasks
  const allWorkspaceTasks = db.find('tasks', t => t.workspace_id === ctx.workspace.id);
  const now = new Date();

  const metrics = {
    total: allWorkspaceTasks.length,
    pending: allWorkspaceTasks.filter(t => t.status === 'todo').length,
    in_progress: allWorkspaceTasks.filter(t => t.status === 'in_progress').length,
    review: allWorkspaceTasks.filter(t => t.status === 'review').length,
    completed: allWorkspaceTasks.filter(t => t.status === 'completed').length,
    overdue: allWorkspaceTasks.filter(t => t.status !== 'completed' && t.due_date && new Date(t.due_date) < now).length,
  };

  // Enrich tasks with assignee profiles & creator profile
  const enriched = tasks.map(t => {
    const creator = db.findById('users', t.created_by);
    const assigneesList = (t.assignees || []).map(id => {
      const u = db.findById('users', id);
      return u ? { id: u.id, name: `${u.first_name} ${u.last_name}`, role_title: u.role_title, profile_picture: u.profile_picture } : null;
    }).filter(Boolean);

    return {
      ...t,
      creator_name: creator ? `${creator.first_name} ${creator.last_name}` : 'Unknown',
      assignees_details: assigneesList,
      is_overdue: t.status !== 'completed' && t.due_date && new Date(t.due_date) < now,
    };
  });

  enriched.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  res.json({
    metrics,
    tasks: enriched,
  });
});

// 2. Create Task (Owner or Admin or Staff)
router.post('/', (req, res) => {
  const ctx = getAuthContext(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const { title, description, priority, due_date, assignees, subtasks } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Task title is required.' });
  }

  const newTask = db.insert('tasks', {
    workspace_id: ctx.workspace.id,
    title,
    description: description || '',
    priority: priority || 'medium', // 'low' | 'medium' | 'high' | 'urgent'
    status: 'todo', // 'todo' | 'in_progress' | 'review' | 'completed'
    due_date: due_date || null,
    created_by: ctx.user.id,
    assignees: Array.isArray(assignees) ? assignees : [],
    subtasks: Array.isArray(subtasks) ? subtasks.map((s, idx) => ({ id: `sub-${idx}-${Date.now()}`, text: s.text || s, completed: false })) : [],
    comments: [],
  });

  // Notify assigned staff
  if (Array.isArray(assignees)) {
    assignees.forEach(assigneeId => {
      if (assigneeId !== ctx.user.id) {
        db.insert('notifications', {
          workspace_id: ctx.workspace.id,
          user_id: assigneeId,
          type: 'task',
          title: 'New Task Assigned',
          message: `${ctx.user.first_name} assigned you to "${title}"`,
          related_id: newTask.id,
          read: false,
        });
      }
    });
  }

  db.insert('audit_logs', {
    workspace_id: ctx.workspace.id,
    user_id: ctx.user.id,
    action: 'TASK_CREATED',
    details: `Task "${title}" created with ${priority} priority.`,
  });

  res.status(201).json(newTask);
});

// 3. Quick update task status (e.g. Kanban drag/drop)
router.put('/:id/status', (req, res) => {
  const ctx = getAuthContext(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const { status } = req.body;
  if (!['todo', 'in_progress', 'review', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid task status.' });
  }

  const task = db.findById('tasks', req.params.id);
  if (!task || task.workspace_id !== ctx.workspace.id) {
    return res.status(404).json({ error: 'Task not found.' });
  }

  const updated = db.update('tasks', task.id, { status });

  // If status is completed, notify task creator
  if (status === 'completed' && task.created_by !== ctx.user.id) {
    db.insert('notifications', {
      workspace_id: ctx.workspace.id,
      user_id: task.created_by,
      type: 'task',
      title: 'Task Completed',
      message: `${ctx.user.first_name} marked "${task.title}" as Completed!`,
      related_id: task.id,
      read: false,
    });
  }

  res.json(updated);
});

// 4. Update task details or toggle subtasks
router.put('/:id', (req, res) => {
  const ctx = getAuthContext(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const task = db.findById('tasks', req.params.id);
  if (!task || task.workspace_id !== ctx.workspace.id) {
    return res.status(404).json({ error: 'Task not found.' });
  }

  const { title, description, priority, status, due_date, assignees, subtasks } = req.body;

  const updates = {};
  if (title) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (priority) updates.priority = priority;
  if (status) updates.status = status;
  if (due_date !== undefined) updates.due_date = due_date;
  if (Array.isArray(assignees)) updates.assignees = assignees;
  if (Array.isArray(subtasks)) updates.subtasks = subtasks;

  const updated = db.update('tasks', task.id, updates);
  res.json(updated);
});

// 5. Add comment to task
router.post('/:id/comments', (req, res) => {
  const ctx = getAuthContext(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const task = db.findById('tasks', req.params.id);
  if (!task || task.workspace_id !== ctx.workspace.id) {
    return res.status(404).json({ error: 'Task not found.' });
  }

  const { text, content } = req.body;
  const commentText = text || content;
  if (!commentText || !commentText.trim()) {
    return res.status(400).json({ error: 'Comment text cannot be empty.' });
  }

  const newComment = {
    id: `comm-${Date.now()}`,
    author_id: ctx.user.id,
    author_name: `${ctx.user.first_name} ${ctx.user.last_name}`,
    author_avatar: ctx.user.profile_picture,
    text: commentText.trim(),
    created_at: new Date().toISOString(),
  };

  const comments = [...(task.comments || []), newComment];
  db.update('tasks', task.id, { comments });

  res.status(201).json(newComment);
});

// 6. Delete task (Owner or Admin or Task Creator)
router.delete('/:id', (req, res) => {
  const ctx = getAuthContext(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const task = db.findById('tasks', req.params.id);
  if (!task || task.workspace_id !== ctx.workspace.id) {
    return res.status(404).json({ error: 'Task not found.' });
  }

  if (ctx.user.system_role === 'staff' && task.created_by !== ctx.user.id) {
    return res.status(403).json({ error: 'Only task creators or admins can delete tasks.' });
  }

  db.delete('tasks', task.id);
  res.json({ message: 'Task deleted successfully.' });
});

export default router;
