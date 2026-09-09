import { db } from './database.js';

export function seedDatabase() {
  const existingWorkspaces = db.find('workspaces');
  if (existingWorkspaces.length > 0) {
    console.log('Database already initialized with', existingWorkspaces.length, 'workspaces.');
    return;
  }

  console.log('🌱 Seeding initial Vigilans company workspace and staff demo data...');

  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();

  // 1. Company Workspace
  const workspaceId = 'ws-vigilans-main';
  const ownerId = 'usr-owner-marcus';

  const workspace = db.insert('workspaces', {
    id: workspaceId,
    name: 'Vigilans Technologies Inc.',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
    description: 'Next-generation enterprise intelligence, security, and workforce infrastructure.',
    website: 'https://vigilans.tech',
    location: '100 Montgomery St, Suite 2400, San Francisco, CA',
    owner_id: ownerId,
    invite_code: 'VIGILANS-2026',
    barcode_token: 'VIGILANS-HQ-88291',
    office_start_time: '09:00',
    late_threshold: '09:00',
    automatic_clockout_time: '17:00',
    timezone: 'America/Los_Angeles',
  });

  // 2. Users (1 Owner, 2 Admins, 10 Staff with multiple sharing same roles)
  const users = [
    // Owner
    {
      id: ownerId,
      workspace_id: workspaceId,
      first_name: 'Marcus',
      last_name: 'Vance',
      email: 'owner@vigilans.com',
      phone: '+1 (415) 890-1201',
      password: 'Password123!',
      profile_picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80',
      role_title: 'Founder & CEO',
      department: 'Executive',
      system_role: 'owner',
      status: 'active',
      bio: 'Building the future of team intelligence and autonomous workspaces.',
    },
    // Admin 1
    {
      id: 'usr-admin-elena',
      workspace_id: workspaceId,
      first_name: 'Elena',
      last_name: 'Rostova',
      email: 'elena.admin@vigilans.com',
      phone: '+1 (415) 890-1202',
      password: 'Password123!',
      profile_picture: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=250&auto=format&fit=crop&q=80',
      role_title: 'Head of People & Operations',
      department: 'Operations',
      system_role: 'admin',
      status: 'active',
      bio: 'Passionate about workplace culture, productivity, and team wellbeing.',
    },
    // Admin 2
    {
      id: 'usr-admin-david',
      workspace_id: workspaceId,
      first_name: 'David',
      last_name: 'Chen',
      email: 'david.admin@vigilans.com',
      phone: '+1 (415) 890-1203',
      password: 'Password123!',
      profile_picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80',
      role_title: 'Director of Engineering',
      department: 'Engineering',
      system_role: 'admin',
      status: 'active',
      bio: 'Scaling distributed cloud systems and real-time communication protocols.',
    },
    // Staff 1: Product Designer
    {
      id: 'usr-staff-sarah',
      workspace_id: workspaceId,
      first_name: 'Sarah',
      last_name: 'Jenkins',
      email: 'sarah.designer@vigilans.com',
      phone: '+1 (415) 890-1204',
      password: 'Password123!',
      profile_picture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=250&auto=format&fit=crop&q=80',
      role_title: 'Product Designer',
      department: 'Design',
      system_role: 'staff',
      status: 'active',
      bio: 'Creating delightful, accessible user journeys and design systems.',
    },
    // Staff 2: Product Designer (SAME ROLE AS SARAH - non-unique roles requirement)
    {
      id: 'usr-staff-liam',
      workspace_id: workspaceId,
      first_name: 'Liam',
      last_name: 'Miller',
      email: 'liam.designer@vigilans.com',
      phone: '+1 (415) 890-1205',
      password: 'Password123!',
      profile_picture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80',
      role_title: 'Product Designer',
      department: 'Design',
      system_role: 'staff',
      status: 'active',
      bio: 'UX researcher and interaction specialist.',
    },
    // Staff 3: Senior Frontend Engineer
    {
      id: 'usr-staff-alex',
      workspace_id: workspaceId,
      first_name: 'Alex',
      last_name: 'Rivera',
      email: 'alex.engineer@vigilans.com',
      phone: '+1 (415) 890-1206',
      password: 'Password123!',
      profile_picture: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=250&auto=format&fit=crop&q=80',
      role_title: 'Senior Frontend Engineer',
      department: 'Engineering',
      system_role: 'staff',
      status: 'active',
      bio: 'React, TypeScript, WebRTC, and high performance dashboards.',
    },
    // Staff 4: Senior Frontend Engineer (SAME ROLE AS ALEX)
    {
      id: 'usr-staff-maya',
      workspace_id: workspaceId,
      first_name: 'Maya',
      last_name: 'Patel',
      email: 'maya.engineer@vigilans.com',
      phone: '+1 (415) 890-1207',
      password: 'Password123!',
      profile_picture: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=250&auto=format&fit=crop&q=80',
      role_title: 'Senior Frontend Engineer',
      department: 'Engineering',
      system_role: 'staff',
      status: 'active',
      bio: 'CSS architect, accessibility advocate, and animation enthusiast.',
    },
    // Staff 5: Backend Engineer
    {
      id: 'usr-staff-james',
      workspace_id: workspaceId,
      first_name: 'James',
      last_name: 'Wilson',
      email: 'james.backend@vigilans.com',
      phone: '+1 (415) 890-1208',
      password: 'Password123!',
      profile_picture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=250&auto=format&fit=crop&q=80',
      role_title: 'Backend Engineer',
      department: 'Engineering',
      system_role: 'staff',
      status: 'active',
      bio: 'APIs, relational databases, distributed caching, and microservices.',
    },
    // Staff 6: Growth Marketing Specialist
    {
      id: 'usr-staff-chloe',
      workspace_id: workspaceId,
      first_name: 'Chloe',
      last_name: 'Dupont',
      email: 'chloe.marketing@vigilans.com',
      phone: '+1 (415) 890-1209',
      password: 'Password123!',
      profile_picture: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=250&auto=format&fit=crop&q=80',
      role_title: 'Growth Marketing Specialist',
      department: 'Marketing',
      system_role: 'staff',
      status: 'active',
      bio: 'Data-driven campaigns, community building, and content strategy.',
    },
    // Staff 7: Growth Marketing Specialist (SAME ROLE AS CHLOE)
    {
      id: 'usr-staff-daniel',
      workspace_id: workspaceId,
      first_name: 'Daniel',
      last_name: 'Kim',
      email: 'daniel.marketing@vigilans.com',
      phone: '+1 (415) 890-1210',
      password: 'Password123!',
      profile_picture: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=250&auto=format&fit=crop&q=80',
      role_title: 'Growth Marketing Specialist',
      department: 'Marketing',
      system_role: 'staff',
      status: 'active',
      bio: 'Paid acquisition, analytics modeling, and product launches.',
    },
    // Staff 8: Customer Success Lead
    {
      id: 'usr-staff-olivia',
      workspace_id: workspaceId,
      first_name: 'Olivia',
      last_name: 'Taylor',
      email: 'olivia.support@vigilans.com',
      phone: '+1 (415) 890-1211',
      password: 'Password123!',
      profile_picture: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=250&auto=format&fit=crop&q=80',
      role_title: 'Customer Success Lead',
      department: 'Support',
      system_role: 'staff',
      status: 'active',
      bio: 'Empowering customers, onboarding teams, and driving client retention.',
    },
    // Staff 9: Account Executive
    {
      id: 'usr-staff-noah',
      workspace_id: workspaceId,
      first_name: 'Noah',
      last_name: 'Adams',
      email: 'noah.sales@vigilans.com',
      phone: '+1 (415) 890-1212',
      password: 'Password123!',
      profile_picture: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=250&auto=format&fit=crop&q=80',
      role_title: 'Account Executive',
      department: 'Sales',
      system_role: 'staff',
      status: 'active',
      bio: 'Enterprise contracts, client discovery, and strategic partnerships.',
    },
    // Staff 10: Account Executive (SAME ROLE AS NOAH)
    {
      id: 'usr-staff-emma',
      workspace_id: workspaceId,
      first_name: 'Emma',
      last_name: 'Scott',
      email: 'emma.sales@vigilans.com',
      phone: '+1 (415) 890-1213',
      password: 'Password123!',
      profile_picture: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=250&auto=format&fit=crop&q=80',
      role_title: 'Account Executive',
      department: 'Sales',
      system_role: 'staff',
      status: 'active',
      bio: 'SMB & Mid-Market growth, relationship management.',
    }
  ];

  users.forEach(u => db.insert('users', u));

  // 3. Today's Attendance Records
  // Sarah: Working on time
  db.insert('attendance', {
    id: 'att-today-1',
    workspace_id: workspaceId,
    user_id: 'usr-staff-sarah',
    date: todayStr,
    clock_in: `${todayStr}T08:52:14.000Z`,
    clock_out: null,
    status: 'working',
    is_late: false,
    late_minutes: 0,
    total_duration: 14400, // 4 hours in seconds
    device_info: 'Chrome on macOS (192.168.1.45)',
  });

  // Alex: Working Late (clocked in at 09:14 AM)
  db.insert('attendance', {
    id: 'att-today-2',
    workspace_id: workspaceId,
    user_id: 'usr-staff-alex',
    date: todayStr,
    clock_in: `${todayStr}T09:14:32.000Z`,
    clock_out: null,
    status: 'working',
    is_late: true,
    late_minutes: 14,
    total_duration: 12600,
    device_info: 'Chrome on Windows 11 (Office Camera Barcode)',
  });

  // James: Working on time
  db.insert('attendance', {
    id: 'att-today-3',
    workspace_id: workspaceId,
    user_id: 'usr-staff-james',
    date: todayStr,
    clock_in: `${todayStr}T08:58:02.000Z`,
    clock_out: null,
    status: 'working',
    is_late: false,
    late_minutes: 0,
    total_duration: 14100,
    device_info: 'Vigilans Mobile App (iOS)',
  });

  // Elena (Admin): Working on time
  db.insert('attendance', {
    id: 'att-today-4',
    workspace_id: workspaceId,
    user_id: 'usr-admin-elena',
    date: todayStr,
    clock_in: `${todayStr}T08:45:00.000Z`,
    clock_out: null,
    status: 'working',
    is_late: false,
    late_minutes: 0,
    total_duration: 15200,
    device_info: 'Desktop Chrome',
  });

  // Chloe: Clocked out after morning shift
  db.insert('attendance', {
    id: 'att-today-5',
    workspace_id: workspaceId,
    user_id: 'usr-staff-chloe',
    date: todayStr,
    clock_in: `${todayStr}T08:30:10.000Z`,
    clock_out: `${todayStr}T12:30:15.000Z`,
    status: 'clocked_out',
    is_late: false,
    late_minutes: 0,
    total_duration: 14405,
    device_info: 'Office Scanner',
  });

  // Liam: Late (clocked in at 09:28 AM)
  db.insert('attendance', {
    id: 'att-today-6',
    workspace_id: workspaceId,
    user_id: 'usr-staff-liam',
    date: todayStr,
    clock_in: `${todayStr}T09:28:44.000Z`,
    clock_out: null,
    status: 'working',
    is_late: true,
    late_minutes: 28,
    total_duration: 11800,
    device_info: 'Android Camera Scanner',
  });

  // Olivia: On leave
  db.insert('attendance', {
    id: 'att-today-7',
    workspace_id: workspaceId,
    user_id: 'usr-staff-olivia',
    date: todayStr,
    clock_in: null,
    clock_out: null,
    status: 'on_leave',
    is_late: false,
    late_minutes: 0,
    total_duration: 0,
    device_info: 'Approved Vacation',
  });

  // 4. Tasks across Kanban Statuses
  const tasks = [
    {
      id: 'task-101',
      workspace_id: workspaceId,
      title: 'Design Dark Mode Design Tokens & Icons',
      description: 'Audit our design system tokens for high contrast accessibility and produce the new SVG glyph set for Vigilans 2.0.',
      priority: 'high',
      status: 'in_progress',
      due_date: '2026-09-15',
      created_by: ownerId,
      assignees: ['usr-staff-sarah', 'usr-staff-liam'],
      subtasks: [
        { id: 'sub-1', text: 'Color contrast check (WCAG AAA)', completed: true },
        { id: 'sub-2', text: 'Figma component library publish', completed: true },
        { id: 'sub-3', text: 'Handoff meeting with frontend engineers', completed: false },
      ],
      comments: [
        { id: 'comm-1', author_id: 'usr-staff-sarah', text: 'Contrast tests passed for 100% of core buttons!', created_at: `${todayStr}T10:30:00.000Z` }
      ]
    },
    {
      id: 'task-102',
      workspace_id: workspaceId,
      title: 'Implement WebRTC Video Call Signaling',
      description: 'Build direct peer connection negotiation for high fidelity meeting rooms and voice note recording audio buffer.',
      priority: 'urgent',
      status: 'in_progress',
      due_date: '2026-09-12',
      created_by: 'usr-admin-david',
      assignees: ['usr-staff-alex', 'usr-staff-james'],
      subtasks: [
        { id: 'sub-21', text: 'WebSocket signaling protocol', completed: true },
        { id: 'sub-22', text: 'Screen sharing stream capture API', completed: true },
        { id: 'sub-23', text: 'Audio mute/unmute indicators', completed: false },
      ],
      comments: []
    },
    {
      id: 'task-103',
      workspace_id: workspaceId,
      title: 'Q3 Enterprise Product Launch Campaign',
      description: 'Prepare landing page copy, product demo videos, social announcements, and email drip sequences for enterprise clients.',
      priority: 'high',
      status: 'review',
      due_date: '2026-09-20',
      created_by: 'usr-admin-elena',
      assignees: ['usr-staff-chloe', 'usr-staff-daniel'],
      subtasks: [
        { id: 'sub-31', text: 'Draft press release', completed: true },
        { id: 'sub-32', text: 'Record walkthrough screen recordings', completed: true },
        { id: 'sub-33', text: 'Executive sign-off from Marcus', completed: false },
      ],
      comments: []
    },
    {
      id: 'task-104',
      workspace_id: workspaceId,
      title: 'Automated Barcode Attendance Scanner Testing',
      description: 'Verify camera scanning speed on mobile web browsers and validate duplicate clock-in prevention.',
      priority: 'urgent',
      status: 'completed',
      due_date: '2026-09-08',
      created_by: ownerId,
      assignees: ['usr-staff-maya', 'usr-staff-james'],
      subtasks: [
        { id: 'sub-41', text: 'Camera permission prompt UX', completed: true },
        { id: 'sub-42', text: 'Instant token validation API', completed: true },
        { id: 'sub-43', text: 'Duplicate attendance rejection logic', completed: true },
      ],
      comments: []
    },
    {
      id: 'task-105',
      workspace_id: workspaceId,
      title: 'Review Q3 Security Audit & Encryption Standards',
      description: 'Ensure all media uploads, voice recordings, and employee records follow enterprise data isolation rules.',
      priority: 'medium',
      status: 'todo',
      due_date: '2026-09-28',
      created_by: 'usr-admin-david',
      assignees: ['usr-staff-james'],
      subtasks: [
        { id: 'sub-51', text: 'Verify workspace ID data boundaries', completed: false },
        { id: 'sub-52', text: 'File upload format and size validation', completed: false },
      ],
      comments: []
    }
  ];

  tasks.forEach(t => db.insert('tasks', t));

  // 5. Conversations & Messages (with Voice notes & Images)
  const generalConvId = 'conv-general-all';
  const directConvId = 'conv-direct-sarah-marcus';

  // Group Channel
  db.insert('conversations', {
    id: generalConvId,
    workspace_id: workspaceId,
    type: 'group',
    name: 'General Company Announcements & Chat',
    participant_ids: users.map(u => u.id),
    last_message: 'Welcome everyone! Today is the Q3 sprint kickoff.',
    updated_at: new Date().toISOString(),
  });

  // Direct Chat
  db.insert('conversations', {
    id: directConvId,
    workspace_id: workspaceId,
    type: 'direct',
    name: 'Sarah Jenkins',
    participant_ids: [ownerId, 'usr-staff-sarah'],
    last_message: 'Voice note: Here is the quick design breakdown for the mobile scanner.',
    updated_at: new Date().toISOString(),
  });

  // Messages in General
  db.insert('messages', {
    conversation_id: generalConvId,
    sender_id: ownerId,
    content: 'Welcome to Vigilans! Today we kick off our new workforce hub. Let us know if you need anything.',
    message_type: 'text',
    media_url: null,
    created_at: `${todayStr}T08:00:00.000Z`,
  });

  db.insert('messages', {
    conversation_id: generalConvId,
    sender_id: 'usr-admin-elena',
    content: 'Friendly reminder to check in with the office barcode scanner or the mobile camera upon arrival! 📸',
    message_type: 'text',
    media_url: null,
    created_at: `${todayStr}T08:15:00.000Z`,
  });

  db.insert('messages', {
    conversation_id: generalConvId,
    sender_id: 'usr-staff-alex',
    content: 'All systems are go on the frontend! The video conference room is ready for testing.',
    message_type: 'text',
    media_url: null,
    created_at: `${todayStr}T08:30:00.000Z`,
  });

  // Messages in Direct Chat (including sample Voice Note!)
  db.insert('messages', {
    conversation_id: directConvId,
    sender_id: ownerId,
    content: 'Hi Sarah, how are the new UI cards progressing for the staff attendance dashboard?',
    message_type: 'text',
    media_url: null,
    created_at: `${todayStr}T09:30:00.000Z`,
  });

  db.insert('messages', {
    conversation_id: directConvId,
    sender_id: 'usr-staff-sarah',
    content: 'They look super clean Marcus! I just recorded a quick voice summary explaining the layout hierarchy.',
    message_type: 'text',
    media_url: null,
    created_at: `${todayStr}T09:32:10.000Z`,
  });

  db.insert('messages', {
    conversation_id: directConvId,
    sender_id: 'usr-staff-sarah',
    content: 'Design breakdown & mobile layout',
    message_type: 'voice_note',
    media_url: 'sample-voice-note',
    duration: 18, // 18 seconds
    created_at: `${todayStr}T09:33:00.000Z`,
  });

  // 6. Company Meetings
  db.insert('meetings', {
    id: 'meet-101',
    workspace_id: workspaceId,
    title: 'Weekly All-Hands & Executive Briefing',
    description: 'Company-wide updates on client milestones, attendance metrics, product demo, and Q&A with Marcus.',
    start_time: `${todayStr}T14:00:00.000Z`,
    end_time: `${todayStr}T15:00:00.000Z`,
    created_by: ownerId,
    meeting_link: 'vigilans-allhands-room',
    invited_user_ids: users.map(u => u.id),
    agenda: '1. CEO Welcome • 2. Attendance & Lateness Review • 3. Product Demo • 4. Open Q&A',
    status: 'scheduled',
  });

  db.insert('meetings', {
    id: 'meet-102',
    workspace_id: workspaceId,
    title: 'Engineering & Design Sync: Barcode Scanner UX',
    description: 'Review camera frame rate, lighting adaptation, and audio feedback when staff clock in.',
    start_time: `${todayStr}T16:00:00.000Z`,
    end_time: `${todayStr}T16:45:00.000Z`,
    created_by: 'usr-admin-david',
    meeting_link: 'vigilans-eng-sync',
    invited_user_ids: ['usr-admin-david', 'usr-staff-alex', 'usr-staff-sarah', 'usr-staff-maya'],
    agenda: 'Performance test on Android & iOS mobile Safari.',
    status: 'scheduled',
  });

  // 7. Recent Feed (Internal Company Social Network)
  db.insert('feed_posts', {
    id: 'post-201',
    workspace_id: workspaceId,
    author_id: 'usr-staff-chloe',
    content: 'Huge shoutout to the engineering team for launching the real-time attendance system today! Celebrated with some fresh artisan donuts in the breakroom 🍩🎉 Grab one while they last!',
    media_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&auto=format&fit=crop&q=80',
    media_type: 'image',
    likes: [ownerId, 'usr-staff-sarah', 'usr-staff-alex', 'usr-admin-elena', 'usr-staff-james'],
    created_at: `${todayStr}T10:15:00.000Z`,
  });

  db.insert('feed_comments', {
    post_id: 'post-201',
    author_id: 'usr-staff-alex',
    content: 'Already on my way to grab the chocolate glazed one! Delicious! 🚀',
    created_at: `${todayStr}T10:20:00.000Z`,
  });

  db.insert('feed_comments', {
    post_id: 'post-201',
    author_id: ownerId,
    content: 'Well deserved team! Keep up the tremendous momentum.',
    created_at: `${todayStr}T10:25:00.000Z`,
  });

  db.insert('feed_posts', {
    id: 'post-202',
    workspace_id: workspaceId,
    author_id: 'usr-staff-sarah',
    content: 'Sneak peek at our new design system components! Focus on high contrast accessibility and responsive navigation on all tablet & mobile views. Feedback welcome! ✨🎨',
    media_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80',
    media_type: 'image',
    likes: ['usr-staff-liam', 'usr-staff-maya', 'usr-admin-david'],
    created_at: `${todayStr}T11:00:00.000Z`,
  });

  // 8. Announcements
  db.insert('announcements', {
    id: 'ann-301',
    workspace_id: workspaceId,
    created_by: ownerId,
    title: 'Official Launch of Vigilans Workplace Platform',
    content: 'We are thrilled to roll out Vigilans across all departments. You can now track attendance via the office barcode, manage your sprint tasks, record voice notes in team chat, and join video meetings directly inside the platform.',
    priority: 'urgent',
    attachment_url: null,
    created_at: `${todayStr}T08:00:00.000Z`,
  });

  db.insert('announcements', {
    id: 'ann-302',
    workspace_id: workspaceId,
    created_by: 'usr-admin-elena',
    title: 'Standard Work Hours & Lateness Policy',
    content: 'Core office hours begin promptly at 9:00 AM. Automatic clock-out takes effect at 5:00 PM. Please remember to clock in using your camera barcode scanner when arriving.',
    priority: 'important',
    attachment_url: null,
    created_at: `${todayStr}T08:30:00.000Z`,
  });

  // 9. Notifications
  db.insert('notifications', {
    id: 'notif-1',
    workspace_id: workspaceId,
    user_id: 'usr-staff-sarah',
    type: 'task',
    title: 'Task Assigned',
    message: 'Marcus assigned you to: Design Dark Mode Design Tokens & Icons',
    related_id: 'task-101',
    read: false,
    created_at: `${todayStr}T09:00:00.000Z`,
  });

  db.insert('notifications', {
    id: 'notif-2',
    workspace_id: workspaceId,
    user_id: ownerId,
    type: 'attendance',
    title: 'Staff Late Alert',
    message: 'Alex Rivera clocked in late at 09:14 AM (14 min overdue).',
    related_id: 'att-today-2',
    read: false,
    created_at: `${todayStr}T09:14:35.000Z`,
  });

  // 10. Audit Logs
  db.insert('audit_logs', {
    workspace_id: workspaceId,
    user_id: ownerId,
    action: 'WORKSPACE_CREATED',
    details: 'Company workspace "Vigilans Technologies Inc." was created.',
    created_at: `${todayStr}T07:30:00.000Z`,
  });

  db.insert('audit_logs', {
    workspace_id: workspaceId,
    user_id: ownerId,
    action: 'BARCODE_GENERATED',
    details: 'Attendance barcode token VIGILANS-HQ-88291 configured with 09:00 AM start time.',
    created_at: `${todayStr}T07:45:00.000Z`,
  });

  db.saveSync();
  console.log('✅ Seed data successfully populated into database!');
}
