import express from 'express';
import { db } from '../db/database.js';
import { supabase, isSupabaseConfigured } from '../db/supabase.js';
import { getUserIdFromHeader } from '../middleware/auth.js';

const router = express.Router();

// Helper to sanitize user object (exclude raw password)
export function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
}

// 1. Owner Registration + Company Workspace Creation
router.post('/register-owner', async (req, res) => {
  try {
    const {
      first_name,
      firstName,
      last_name,
      lastName,
      email,
      phone,
      password,
      company_name,
      companyName,
      company_logo,
      companyLogo,
      company_description,
      company_website,
      company_location,
      profile_picture,
      profilePicture,
    } = req.body || {};

    const fName = first_name || firstName;
    const lName = last_name || lastName;
    const cName = company_name || companyName;

    if (!fName || !lName || !email || !password || !cName) {
      return res.status(400).json({ error: 'Please fill in all required fields.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // Check unique email safely in memory and Supabase
    let existing = db.findOne('users', u => u && u.email && u.email.toLowerCase() === cleanEmail);
    if (!existing && isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase.from('users').select('id').ilike('email', cleanEmail).maybeSingle();
        if (data) existing = data;
      } catch (e) {}
    }
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
      first_name: String(first_name).trim(),
      last_name: String(last_name).trim(),
      email: cleanEmail,
      phone: phone || '',
      password: String(password),
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

    return res.status(201).json({
      token: `token-${user.id}-${Date.now()}`,
      user: sanitizeUser(user),
      workspace,
    });
  } catch (err) {
    console.error('Owner Registration Error:', err);
    return res.status(500).json({ error: err.message || 'Workspace registration failed.' });
  }
});

// 2. Staff Registration (requires valid workspace invite code)
router.post('/register-staff', async (req, res) => {
  try {
    const body = req.body || {};
    const firstName = body.first_name || body.firstName || (body.fullName ? body.fullName.trim().split(' ')[0] : '');
    const lastName = body.last_name || body.lastName || (body.fullName ? body.fullName.trim().split(' ').slice(1).join(' ') || 'Staff' : '');
    const email = body.email;
    const password = body.password;
    const roleTitle = body.role_title || body.roleTitle;
    const inviteCode = body.invite_code || body.inviteCode;
    const phone = body.phone || '';
    const department = body.department || 'General';
    const profilePicture = body.profile_picture || body.profilePicture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=250&auto=format&fit=crop&q=80';

    if (!firstName || !lastName || !email || !password || !roleTitle || !inviteCode) {
      return res.status(400).json({ error: 'Please provide all required fields including role title and invite code.' });
    }

    const cleanCode = String(inviteCode).toUpperCase().trim();
    const cleanEmail = String(email).toLowerCase().trim();

    // Verify workspace by invite code (check memory then Supabase)
    let workspace = db.findOne('workspaces', w => w && w.invite_code && w.invite_code.toUpperCase().trim() === cleanCode);
    if (!workspace && isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase.from('workspaces').select('*').ilike('invite_code', cleanCode).maybeSingle();
        if (data) {
          workspace = data;
          db.insert('workspaces', data);
        }
      } catch (e) {}
    }

    if (!workspace) {
      return res.status(404).json({ error: 'Invalid workspace invitation code. Please verify with your Owner/Admin.' });
    }

    // Check unique email in memory and Supabase
    let existing = db.findOne('users', u => u && u.email && u.email.toLowerCase().trim() === cleanEmail);
    if (!existing && isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase.from('users').select('id').ilike('email', cleanEmail).maybeSingle();
        if (data) existing = data;
      } catch (e) {}
    }
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    // Create Staff User
    const user = db.insert('users', {
      workspace_id: workspace.id,
      first_name: String(firstName).trim(),
      last_name: String(lastName).trim(),
      email: cleanEmail,
      phone,
      password: String(password).trim(),
      profile_picture: profilePicture,
      role_title: String(roleTitle).trim(),
      department,
      system_role: 'staff',
      status: 'active',
    });

    // Add staff to General Group chat
    const generalConv = db.findOne('conversations', c => c && c.workspace_id === workspace.id && c.type === 'group');
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

    return res.status(201).json({
      token: `token-${user.id}-${Date.now()}`,
      user: sanitizeUser(user),
      workspace,
    });
  } catch (err) {
    console.error('Staff Registration Error:', err);
    return res.status(500).json({ error: err.message || 'Staff registration failed.' });
  }
});

// 3. Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    let user = db.findOne('users', u => u && u.email && u.email.toLowerCase().trim() === cleanEmail);
    
    // Check Supabase directly if user is not found in memory (e.g. cold start)
    if (!user && isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase.from('users').select('*').ilike('email', cleanEmail).maybeSingle();
        if (data) {
          user = data;
          db.insert('users', data);
        }
      } catch (err) {
        console.warn('Supabase fallback query for login failed:', err.message);
      }
    }

    if (!user || String(user.password).trim() !== String(password).trim()) {
      return res.status(401).json({ error: 'Invalid email or password credentials.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended by an administrator. Please contact support.' });
    }

    let workspace = db.findById('workspaces', user.workspace_id);
    if (!workspace && isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase.from('workspaces').select('*').eq('id', user.workspace_id).maybeSingle();
        if (data) {
          workspace = data;
          db.insert('workspaces', data);
        }
      } catch (e) {}
    }

    workspace = workspace || {
      id: user.workspace_id || 'ws-vigilans-main',
      name: 'Vigilans Technologies Inc.'
    };

    return res.json({
      token: `token-${user.id}-${Date.now()}`,
      user: sanitizeUser(user),
      workspace,
    });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ error: err.message || 'Login process failed.' });
  }
});

// 4. Current User Session Verification
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const userId = getUserIdFromHeader(authHeader);
    let user = userId ? db.findById('users', userId) : null;
    
    if (!user && userId && isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
        if (data) {
          user = data;
          db.insert('users', data);
        }
      } catch (e) {}
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid session token.' });
    }

    let workspace = db.findById('workspaces', user.workspace_id);
    if (!workspace && isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase.from('workspaces').select('*').eq('id', user.workspace_id).maybeSingle();
        if (data) {
          workspace = data;
          db.insert('workspaces', data);
        }
      } catch (e) {}
    }

    workspace = workspace || {
      id: user.workspace_id,
      name: 'Vigilans Workspace'
    };

    return res.json({
      user: sanitizeUser(user),
      workspace,
    });
  } catch (err) {
    console.error('/me Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to verify session.' });
  }
});

// 5. Pre-configured Demo Accounts for 1-Click Login
router.get('/demo-users', (req, res) => {
  try {
    const users = db.find('users') || [];
    const demoList = users
      .filter(u => u && u.id && u.email)
      .map(u => ({
        id: u.id,
        name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Demo User',
        email: u.email,
        system_role: u.system_role || 'staff',
        role_title: u.role_title || 'Staff Member',
        department: u.department || 'General',
        profile_picture: u.profile_picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80',
      }));
    return res.json(demoList);
  } catch (err) {
    console.error('/demo-users Error:', err);
    return res.status(500).json({ error: 'Failed to load demo accounts' });
  }
});

export default router;
