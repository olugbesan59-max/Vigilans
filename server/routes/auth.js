import express from 'express';
import { db } from '../db/database.js';
import { getUserIdFromHeader } from '../middleware/auth.js';

const router = express.Router();

// Helper to sanitize user object (exclude raw password)
export function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
}

// 1. Owner Registration + Company Workspace Creation
router.post('/register-owner', (req, res) => {
  const {
    first_name,
    last_name,
    email,
    phone,
    password,
    company_name,
    company_logo,
    company_description,
    company_website,
    company_location,
    profile_picture,
  } = req.body;

  if (!first_name || !last_name || !email || !password || !company_name) {
    return res.status(400).json({ error: 'Please fill in all required fields.' });
  }

  // Check unique email
  const existing = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  const workspaceId = `ws-${Date.now()}`;
  const userId = `usr-${Date.now()}`;

  // Create Workspace
  const workspace = db.insert('workspaces', {
    id: workspaceId,
    name: company_name,
    logo: company_logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
    description: company_description || '',
    website: company_website || '',
    location: company_location || 'San Francisco, CA',
    owner_id: userId,
    invite_code: `VIGILANS-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    barcode_token: `VIGILANS-HQ-${Math.floor(10000 + Math.random() * 90000)}`,
    office_start_time: '09:00',
    late_threshold: '09:00',
    automatic_clockout_time: '17:00',
    timezone: 'America/Los_Angeles',
  });

  // Create Owner User
  const user = db.insert('users', {
    id: userId,
    workspace_id: workspaceId,
    first_name,
    last_name,
    email: email.toLowerCase(),
    phone: phone || '',
    password, // in production we'd use bcrypt; simple direct store here
    profile_picture: profile_picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80',
    role_title: 'Founder & CEO',
    department: 'Executive',
    system_role: 'owner',
    status: 'active',
  });

  // Log Audit
  db.insert('audit_logs', {
    workspace_id: workspaceId,
    user_id: userId,
    action: 'WORKSPACE_CREATED',
    details: `Workspace "${company_name}" registered by ${first_name} ${last_name}.`,
  });

  // Seed General Chat
  db.insert('conversations', {
    workspace_id: workspaceId,
    type: 'group',
    name: 'General Company Chat',
    participant_ids: [userId],
    last_message: 'Welcome to your new Vigilans workspace!',
  });

  res.status(201).json({
    token: `token-${user.id}-${Date.now()}`,
    user: sanitizeUser(user),
    workspace,
  });
});

// 2. Staff Registration (requires valid workspace invite code)
router.post('/register-staff', (req, res) => {
  const firstName = req.body.first_name || (req.body.fullName ? req.body.fullName.trim().split(' ')[0] : '');
  const lastName = req.body.last_name || (req.body.fullName ? req.body.fullName.trim().split(' ').slice(1).join(' ') || 'Staff' : '');
  const email = req.body.email;
  const password = req.body.password;
  const roleTitle = req.body.role_title || req.body.roleTitle;
  const inviteCode = req.body.invite_code || req.body.inviteCode;
  const phone = req.body.phone || '';
  const department = req.body.department || 'General';
  const profilePicture = req.body.profile_picture || req.body.profilePicture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=250&auto=format&fit=crop&q=80';

  if (!firstName || !lastName || !email || !password || !roleTitle || !inviteCode) {
    return res.status(400).json({ error: 'Please provide all required fields including role title and invite code.' });
  }

  // Verify workspace by invite code
  const workspace = db.findOne('workspaces', w => w.invite_code?.toUpperCase() === inviteCode.toUpperCase().trim());
  if (!workspace) {
    return res.status(404).json({ error: 'Invalid workspace invitation code. Please verify with your Owner/Admin.' });
  }

  // Check unique email
  const existing = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase().trim());
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  // Create Staff User (Notice: Non-unique roles allowed!)
  const user = db.insert('users', {
    workspace_id: workspace.id,
    first_name: firstName,
    last_name: lastName,
    email: email.toLowerCase().trim(),
    phone,
    password,
    profile_picture: profilePicture,
    role_title: roleTitle,
    department,
    system_role: 'staff',
    status: 'active',
  });

  // Add staff to General Group chat
  const generalConv = db.findOne('conversations', c => c.workspace_id === workspace.id && c.type === 'group');
  if (generalConv) {
    const pIds = Array.isArray(generalConv.participant_ids) ? [...generalConv.participant_ids] : [];
    if (!pIds.includes(user.id)) {
      pIds.push(user.id);
      db.update('conversations', generalConv.id, { participant_ids: pIds });
    }
  }

  // Log Audit
  db.insert('audit_logs', {
    workspace_id: workspace.id,
    user_id: user.id,
    action: 'STAFF_JOINED',
    details: `${firstName} ${lastName} joined workspace as ${roleTitle}.`,
  });

  res.status(201).json({
    token: `token-${user.id}-${Date.now()}`,
    user: sanitizeUser(user),
    workspace,
  });
});

// 3. Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase().trim());
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid email or password credentials.' });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'Your account has been suspended by an administrator. Please contact support.' });
  }

  const workspace = db.findById('workspaces', user.workspace_id);

  res.json({
    token: `token-${user.id}-${Date.now()}`,
    user: sanitizeUser(user),
    workspace,
  });
});

// 4. Current User Session Verification
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const userId = getUserIdFromHeader(authHeader);
  const user = userId ? db.findById('users', userId) : null;
  if (!user) {
    return res.status(401).json({ error: 'Invalid session token.' });
  }

  const workspace = db.findById('workspaces', user.workspace_id);
  res.json({
    user: sanitizeUser(user),
    workspace,
  });
});

// 5. Pre-configured Demo Accounts for 1-Click Login
router.get('/demo-users', (req, res) => {
  const users = db.find('users');
  const demoList = users.map(u => ({
    id: u.id,
    name: `${u.first_name} ${u.last_name}`,
    email: u.email,
    system_role: u.system_role,
    role_title: u.role_title,
    department: u.department,
    profile_picture: u.profile_picture,
  }));
  res.json(demoList);
});

export default router;
