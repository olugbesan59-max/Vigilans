import express from 'express';
import { db } from '../db/database.js';
import { getAuthContext } from '../middleware/auth.js';

const router = express.Router();

// 1. Get user's active conversations (direct & group)
router.get('/conversations', (req, res) => {
  const ctx = getAuthContext(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const convs = db.find('conversations', c => 
    c.workspace_id === ctx.workspace.id && 
    c.participant_ids.includes(ctx.user.id)
  );

  // Enrich conversations with other participant details
  const enriched = convs.map(c => {
    let displayName = c.name;
    let displayAvatar = null;
    let isOnline = false;

    if (c.type === 'direct') {
      const otherId = c.participant_ids.find(id => id !== ctx.user.id);
      const otherUser = db.findById('users', otherId);
      if (otherUser) {
        displayName = `${otherUser.first_name} ${otherUser.last_name}`;
        displayAvatar = otherUser.profile_picture;
        // In this demo, mark working staff as online
        const todayStr = new Date().toISOString().split('T')[0];
        const att = db.findOne('attendance', a => a.user_id === otherUser.id && a.date === todayStr && a.status === 'working');
        isOnline = Boolean(att);
      }
    }

    const messages = db.find('messages', m => m.conversation_id === c.id);
    const lastMsg = messages[messages.length - 1];

    return {
      ...c,
      display_name: displayName,
      display_avatar: displayAvatar,
      is_online: isOnline,
      last_message_text: lastMsg?.content || c.last_message || 'No messages yet',
      last_message_time: lastMsg?.created_at || c.updated_at,
    };
  });

  enriched.sort((a, b) => new Date(b.last_message_time) - new Date(a.last_message_time));
  res.json(enriched);
});

// 2. Start or get direct conversation
router.post('/conversations/direct', (req, res) => {
  const ctx = getAuthContext(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const { target_user_id } = req.body;
  if (!target_user_id) {
    return res.status(400).json({ error: 'Target user ID is required.' });
  }

  // Find existing direct conversation
  let conv = db.findOne('conversations', c => 
    c.workspace_id === ctx.workspace.id && 
    c.type === 'direct' && 
    c.participant_ids.includes(ctx.user.id) && 
    c.participant_ids.includes(target_user_id)
  );

  if (!conv) {
    const targetUser = db.findById('users', target_user_id);
    conv = db.insert('conversations', {
      workspace_id: ctx.workspace.id,
      type: 'direct',
      name: targetUser ? `${targetUser.first_name} ${targetUser.last_name}` : 'Direct Chat',
      participant_ids: [ctx.user.id, target_user_id],
      last_message: 'Conversation started',
    });
  }

  res.status(201).json(conv);
});

// 3. Create group conversation
router.post('/conversations/group', (req, res) => {
  const ctx = getAuthContext(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const { name, participant_ids } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Group name is required.' });
  }

  const members = Array.from(new Set([ctx.user.id, ...(participant_ids || [])]));

  const newGroup = db.insert('conversations', {
    workspace_id: ctx.workspace.id,
    type: 'group',
    name: name.trim(),
    participant_ids: members,
    last_message: 'Group conversation created',
  });

  res.status(201).json(newGroup);
});

// 4. Get messages in conversation
const handleGetMessages = (req, res) => {
  const ctx = getAuthContext(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const conv = db.findById('conversations', req.params.id);
  if (!conv || conv.workspace_id !== ctx.workspace.id || !conv.participant_ids.includes(ctx.user.id)) {
    return res.status(404).json({ error: 'Conversation not found or access denied.' });
  }

  const messages = db.find('messages', m => m.conversation_id === conv.id);

  // Enrich with sender profile
  const enriched = messages.map(m => {
    const sender = db.findById('users', m.sender_id);
    return {
      ...m,
      sender_name: sender ? `${sender.first_name} ${sender.last_name}` : 'Unknown',
      sender_avatar: sender ? sender.profile_picture : '',
      is_me: m.sender_id === ctx.user.id,
    };
  });

  enriched.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  res.json(enriched);
};

router.get('/conversations/:id/messages', handleGetMessages);
router.get('/:id', handleGetMessages);

// 5. Send message (Supports text, image, file, voice_note)
const handleSendMessage = (req, res) => {
  const ctx = getAuthContext(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const conv = db.findById('conversations', req.params.id);
  if (!conv || conv.workspace_id !== ctx.workspace.id || !conv.participant_ids.includes(ctx.user.id)) {
    return res.status(404).json({ error: 'Conversation not found.' });
  }

  const { content, message_type, type, media_url, duration } = req.body;
  const textContent = content;
  if (!textContent && !media_url) {
    return res.status(400).json({ error: 'Message cannot be completely empty.' });
  }

  const msgType = message_type || type || 'text'; // 'text' | 'image' | 'file' | 'voice_note'

  const message = db.insert('messages', {
    conversation_id: conv.id,
    sender_id: ctx.user.id,
    content: textContent || (msgType === 'voice_note' ? 'Voice Message' : 'Media Attachment'),
    message_type: msgType,
    media_url: media_url || null,
    duration: duration || null, // in seconds for voice notes
  });

  // Update conversation last_message
  db.update('conversations', conv.id, {
    last_message: msgType === 'voice_note' ? '🎤 Voice note' : textContent || 'Attachment',
    updated_at: new Date().toISOString(),
  });

  // Notify other participants
  conv.participant_ids.forEach(pId => {
    if (pId !== ctx.user.id) {
      db.insert('notifications', {
        workspace_id: ctx.workspace.id,
        user_id: pId,
        type: 'message',
        title: conv.type === 'group' ? conv.name : `${ctx.user.first_name} ${ctx.user.last_name}`,
        message: msgType === 'voice_note' ? 'Sent a voice note 🎤' : textContent || 'Sent an attachment',
        related_id: conv.id,
        read: false,
      });
    }
  });

  res.status(201).json({
    ...message,
    sender_name: `${ctx.user.first_name} ${ctx.user.last_name}`,
    sender_avatar: ctx.user.profile_picture,
    is_me: true,
  });
};

router.post('/conversations/:id/messages', handleSendMessage);
router.post('/:id', handleSendMessage);

// 6. Delete message
const handleDeleteMessage = (req, res) => {
  const ctx = getAuthContext(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const msg = db.findById('messages', req.params.id);
  if (!msg) return res.status(404).json({ error: 'Message not found.' });

  if (msg.sender_id !== ctx.user.id && ctx.user.system_role === 'staff') {
    return res.status(403).json({ error: 'You can only delete your own messages.' });
  }

  db.delete('messages', msg.id);
  res.json({ message: 'Message deleted successfully.' });
};

router.delete('/messages/:id', handleDeleteMessage);
router.delete('/:id', handleDeleteMessage);

export default router;
