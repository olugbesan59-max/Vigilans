-- ==============================================================================
-- VIGILANS ENTERPRISE WORKSPACE PLATFORM - SUPABASE PRODUCTION DATABASE SCHEMA
-- ==============================================================================
-- Run this complete script in your Supabase project's SQL Editor (Dashboard > SQL Editor)

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Workspaces Table
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT DEFAULT 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
  description TEXT DEFAULT '',
  website TEXT DEFAULT '',
  location TEXT DEFAULT 'San Francisco, CA',
  owner_id TEXT,
  invite_code TEXT UNIQUE NOT NULL,
  barcode_token TEXT UNIQUE NOT NULL,
  office_start_time TEXT DEFAULT '09:00',
  late_threshold TEXT DEFAULT '09:00',
  automatic_clockout_time TEXT DEFAULT '17:00',
  timezone TEXT DEFAULT 'America/Los_Angeles',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT DEFAULT '',
  password TEXT NOT NULL,
  profile_picture TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80',
  role_title TEXT NOT NULL,
  department TEXT NOT NULL,
  system_role TEXT NOT NULL DEFAULT 'staff', -- 'owner' | 'admin' | 'staff'
  status TEXT NOT NULL DEFAULT 'active',     -- 'active' | 'suspended'
  bio TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Foreign key link back to workspace owner
ALTER TABLE workspaces DROP CONSTRAINT IF EXISTS fk_workspace_owner;
ALTER TABLE workspaces ADD CONSTRAINT fk_workspace_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;

-- 4. Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL, -- 'YYYY-MM-DD'
  clock_in TEXT,
  clock_out TEXT,
  total_hours NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'working', -- 'working' | 'completed' | 'late'
  is_late BOOLEAN DEFAULT FALSE,
  late_minutes INTEGER DEFAULT 0,
  auto_clocked_out BOOLEAN DEFAULT FALSE,
  device_info TEXT DEFAULT 'Web Terminal',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  priority TEXT DEFAULT 'medium', -- 'low' | 'medium' | 'high' | 'urgent'
  status TEXT DEFAULT 'todo',     -- 'todo' | 'in_progress' | 'review' | 'completed'
  due_date TEXT,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  assignees JSONB DEFAULT '[]'::jsonb, -- array of user IDs
  subtasks JSONB DEFAULT '[]'::jsonb,  -- [{ id, text, completed }]
  comments JSONB DEFAULT '[]'::jsonb,  -- [{ id, author_id, text, created_at }]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Conversations Table (Direct & Group Chat)
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'group', -- 'direct' | 'group'
  name TEXT,
  participant_ids JSONB DEFAULT '[]'::jsonb, -- array of user IDs
  last_message TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Messages Table (Supports Text, Voice Notes, Attachments)
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  content TEXT DEFAULT '',
  message_type TEXT DEFAULT 'text', -- 'text' | 'image' | 'file' | 'voice_note'
  media_url TEXT,
  duration INTEGER, -- duration in seconds for voice notes
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Meetings Table
CREATE TABLE IF NOT EXISTS meetings (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  start_time TEXT NOT NULL,
  scheduled_time TEXT,
  end_time TEXT,
  duration_minutes INTEGER DEFAULT 45,
  created_by TEXT REFERENCES users(id) ON DELETE CASCADE,
  meeting_link TEXT NOT NULL,
  invited_user_ids JSONB DEFAULT '[]'::jsonb,
  agenda TEXT DEFAULT '',
  status TEXT DEFAULT 'scheduled', -- 'scheduled' | 'in_progress' | 'completed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Feed Posts Table
CREATE TABLE IF NOT EXISTS feed_posts (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  author_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT,
  likes JSONB DEFAULT '[]'::jsonb, -- array of user IDs who liked
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Feed Comments Table
CREATE TABLE IF NOT EXISTS feed_comments (
  id TEXT PRIMARY KEY,
  post_id TEXT REFERENCES feed_posts(id) ON DELETE CASCADE,
  author_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by TEXT REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'normal', -- 'normal' | 'high' | 'urgent'
  department TEXT DEFAULT 'all',
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'message', -- 'message' | 'task' | 'attendance' | 'meeting' | 'announcement'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_users_workspace ON users(workspace_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_workspace ON attendance(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_workspace ON tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace ON audit_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_feed_posts_workspace ON feed_posts(workspace_id);

-- ==============================================================================
-- SUPABASE REALTIME ENABLEMENT
-- ==============================================================================
-- Allows instant WebSocket broadcast for chats, calls, and live check-ins
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE feed_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE feed_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- For unified service role access or full application operations:
CREATE POLICY "Allow public read/write for service operations" ON workspaces FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for service operations" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for service operations" ON attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for service operations" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for service operations" ON conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for service operations" ON messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for service operations" ON meetings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for service operations" ON feed_posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for service operations" ON feed_comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for service operations" ON announcements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for service operations" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for service operations" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- DEFAULT SEED DATA (Ready-to-Use Company Workspace & Personas)
-- ==============================================================================
INSERT INTO workspaces (
  id, name, logo, description, website, location, invite_code, barcode_token,
  office_start_time, late_threshold, automatic_clockout_time, timezone
) VALUES (
  'ws-vigilans-main',
  'Vigilans Technologies Inc.',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
  'Next-generation Enterprise Workspace & Attendance Automation Platform',
  'https://vigilans.enterprise.io',
  'San Francisco, CA',
  'VIGILANS-2026',
  'VIGILANS-HQ-ATTENDANCE-KEY-9823',
  '09:00',
  '09:00',
  '17:00',
  'America/Los_Angeles'
) ON CONFLICT (id) DO NOTHING;

-- Seed Owner & Staff Users (Password for all accounts: Password123!)
INSERT INTO users (
  id, workspace_id, first_name, last_name, email, phone, password, profile_picture,
  role_title, department, system_role, status, bio
) VALUES
  ('usr-owner-marcus', 'ws-vigilans-main', 'Marcus', 'Vance', 'owner@vigilans.com', '+1 (555) 019-2834', 'Password123!', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80', 'Founder & CEO', 'Executive', 'owner', 'active', 'Company Founder'),
  ('usr-admin-elena', 'ws-vigilans-main', 'Elena', 'Rostova', 'elena.admin@vigilans.com', '+1 (555) 019-5821', 'Password123!', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=250&auto=format&fit=crop&q=80', 'VP of Operations', 'Operations', 'admin', 'active', 'Operations Leadership'),
  ('usr-admin-david', 'ws-vigilans-main', 'David', 'Kim', 'david.admin@vigilans.com', '+1 (555) 019-9182', 'Password123!', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80', 'Engineering Director', 'Engineering', 'admin', 'active', 'Technical Lead'),
  ('usr-staff-sarah', 'ws-vigilans-main', 'Sarah', 'Jenkins', 'sarah.designer@vigilans.com', '+1 (555) 019-3321', 'Password123!', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=250&auto=format&fit=crop&q=80', 'Senior UI/UX Designer', 'Design', 'staff', 'active', 'Product Design Team'),
  ('usr-staff-liam', 'ws-vigilans-main', 'Liam', 'Miller', 'liam.designer@vigilans.com', '+1 (555) 019-7744', 'Password123!', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80', 'Product Designer', 'Design', 'staff', 'active', 'Visual Experience'),
  ('usr-staff-alex', 'ws-vigilans-main', 'Alex', 'Chen', 'alex.engineer@vigilans.com', '+1 (555) 019-8812', 'Password123!', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=250&auto=format&fit=crop&q=80', 'Frontend Architect', 'Engineering', 'staff', 'active', 'Web Development'),
  ('usr-staff-maya', 'ws-vigilans-main', 'Maya', 'Patel', 'maya.engineer@vigilans.com', '+1 (555) 019-4455', 'Password123!', 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=250&auto=format&fit=crop&q=80', 'Full Stack Developer', 'Engineering', 'staff', 'active', 'Core Systems')
ON CONFLICT (id) DO NOTHING;

-- Link owner to workspace
UPDATE workspaces SET owner_id = 'usr-owner-marcus' WHERE id = 'ws-vigilans-main';

-- Seed General Company Chat
INSERT INTO conversations (id, workspace_id, type, name, participant_ids, last_message)
VALUES (
  'conv-general',
  'ws-vigilans-main',
  'group',
  'General Company Channel',
  '["usr-owner-marcus", "usr-admin-elena", "usr-admin-david", "usr-staff-sarah", "usr-staff-liam", "usr-staff-alex", "usr-staff-maya"]'::jsonb,
  'Welcome to the official Vigilans workspace channel!'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO messages (id, conversation_id, sender_id, content, message_type, duration)
VALUES (
  'msg-welcome-1',
  'conv-general',
  'usr-owner-marcus',
  'Welcome team! Barcode check-ins, tasks, and communications channels are live.',
  'text',
  NULL
) ON CONFLICT (id) DO NOTHING;

-- Seed Sample Feed Post
INSERT INTO feed_posts (id, workspace_id, author_id, content, likes)
VALUES (
  'post-sample-1',
  'ws-vigilans-main',
  'usr-owner-marcus',
  'Great work team on achieving 100% on-time attendance this morning!',
  '["usr-admin-elena", "usr-staff-sarah"]'::jsonb
) ON CONFLICT (id) DO NOTHING;
