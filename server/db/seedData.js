import { db } from './database.js';

export function seedDatabase() {
  const existingWorkspaces = db.find('workspaces');
  if (existingWorkspaces.length > 0) {
    console.log('Database already initialized with', existingWorkspaces.length, 'workspaces.');
    return;
  }

  console.log('🌱 Initializing clean Vigilans company workspace for Owner Olugbesan59@gmail.com...');

  // 1. Company Workspace
  const workspaceId = 'ws-vigilans-main';
  const ownerId = 'usr-owner-olugbesan';

  const workspace = db.insert('workspaces', {
    id: workspaceId,
    name: 'Vigilans Technologies Inc.',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
    description: 'Next-generation Enterprise Workspace & Security Platform.',
    website: 'https://vigilans.tech',
    location: 'San Francisco, CA',
    owner_id: ownerId,
    invite_code: 'VIGILANS-2026',
    barcode_token: 'VIGILANS-HQ-88291',
    office_start_time: '09:00',
    late_threshold: '09:00',
    automatic_clockout_time: '17:00',
    timezone: 'America/Los_Angeles',
  });

  // 2. Real Owner Account (Olugbesan59@gmail.com)
  const owner = db.insert('users', {
    id: ownerId,
    workspace_id: workspaceId,
    first_name: 'Olugbesan',
    last_name: 'Max',
    email: 'olugbesan59@gmail.com',
    phone: '+1 (555) 019-2834',
    password: 'Succeedjo1',
    profile_picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80',
    role_title: 'Founder & CEO',
    department: 'Executive',
    system_role: 'owner',
    status: 'active',
    bio: 'Founder & CEO of Vigilans Technologies.',
  });

  // 3. General Company Channel
  db.insert('conversations', {
    id: 'conv-general',
    workspace_id: workspaceId,
    type: 'group',
    name: 'General Company Channel',
    participant_ids: [ownerId],
    last_message: 'Welcome to Vigilans! Real-time messaging is live.',
  });

  // 4. Initial Welcome Message
  db.insert('messages', {
    id: 'msg-welcome-1',
    conversation_id: 'conv-general',
    sender_id: ownerId,
    content: 'Welcome to Vigilans! You can register, sign in, and text the app here.',
    message_type: 'text',
    duration: null,
  });

  // 5. Initial Audit Log
  db.insert('audit_logs', {
    workspace_id: workspaceId,
    user_id: ownerId,
    action: 'WORKSPACE_INITIALIZED',
    details: 'Vigilans Workspace initialized by Owner Olugbesan.',
  });

  console.log('✅ Workspace and Owner account ready for real users and testing.');
}

export default seedDatabase;
