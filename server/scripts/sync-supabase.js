import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase, isSupabaseConfigured } from '../db/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, '..', 'data', 'vigilans.db.json');

// Table schema column definitions for clean sanitization
const TABLE_COLUMNS = {
  workspaces: ['id', 'name', 'logo', 'description', 'website', 'location', 'owner_id', 'invite_code', 'barcode_token', 'office_start_time', 'late_threshold', 'automatic_clockout_time', 'timezone', 'created_at', 'updated_at'],
  users: ['id', 'workspace_id', 'first_name', 'last_name', 'email', 'phone', 'password', 'profile_picture', 'role_title', 'department', 'system_role', 'status', 'bio', 'created_at', 'updated_at'],
  attendance: ['id', 'workspace_id', 'user_id', 'date', 'clock_in', 'clock_out', 'total_hours', 'status', 'is_late', 'late_minutes', 'auto_clocked_out', 'device_info', 'created_at', 'updated_at'],
  tasks: ['id', 'workspace_id', 'title', 'description', 'priority', 'status', 'due_date', 'created_by', 'assignees', 'subtasks', 'comments', 'created_at', 'updated_at'],
  conversations: ['id', 'workspace_id', 'type', 'name', 'participant_ids', 'last_message', 'created_at', 'updated_at'],
  messages: ['id', 'conversation_id', 'sender_id', 'content', 'message_type', 'media_url', 'duration', 'created_at'],
  meetings: ['id', 'workspace_id', 'title', 'description', 'start_time', 'scheduled_time', 'end_time', 'duration_minutes', 'created_by', 'meeting_link', 'invited_user_ids', 'agenda', 'status', 'created_at', 'updated_at'],
  feed_posts: ['id', 'workspace_id', 'author_id', 'content', 'media_url', 'media_type', 'likes', 'created_at', 'updated_at'],
  feed_comments: ['id', 'post_id', 'author_id', 'content', 'created_at'],
  announcements: ['id', 'workspace_id', 'created_by', 'title', 'content', 'priority', 'department', 'attachment_url', 'created_at', 'updated_at'],
  notifications: ['id', 'workspace_id', 'user_id', 'type', 'title', 'message', 'related_id', 'read', 'created_at'],
  audit_logs: ['id', 'workspace_id', 'user_id', 'action', 'details', 'created_at']
};

function sanitizeRecord(table, record, validRefs) {
  const allowed = TABLE_COLUMNS[table];
  if (!allowed) return record;

  const sanitized = {};
  for (const col of allowed) {
    if (record[col] !== undefined) {
      sanitized[col] = record[col];
    }
  }

  // Attendance total_hours calculation
  if (table === 'attendance' && sanitized.total_hours === undefined) {
    if (record.total_duration) {
      sanitized.total_hours = Number((record.total_duration / 3600).toFixed(2));
    } else {
      sanitized.total_hours = 0;
    }
  }

  // Foreign key reference protection
  if (sanitized.workspace_id && !validRefs.workspaces.has(sanitized.workspace_id)) {
    return null;
  }
  if (table === 'attendance' && !validRefs.users.has(sanitized.user_id)) {
    return null;
  }
  if (table === 'feed_comments' && (!validRefs.posts.has(sanitized.post_id) || !validRefs.users.has(sanitized.author_id))) {
    return null;
  }
  if (table === 'notifications' && !validRefs.users.has(sanitized.user_id)) {
    return null;
  }
  if (table === 'audit_logs' && sanitized.user_id && !validRefs.users.has(sanitized.user_id)) {
    sanitized.user_id = null; // foreign key allows null
  }
  if (table === 'messages' && (!validRefs.conversations.has(sanitized.conversation_id) || !validRefs.users.has(sanitized.sender_id))) {
    return null;
  }

  return sanitized;
}

async function syncAllToSupabase() {
  console.log('========================================================');
  console.log('🚀 VIGILANS -> SUPABASE DATABASE MIGRATION & SYNC TOOL');
  console.log('========================================================\n');

  if (!isSupabaseConfigured || !supabase) {
    console.error('❌ Error: Supabase credentials are missing or invalid.');
    console.error('Please configure SUPABASE_URL and SUPABASE_ANON_KEY in your server/.env file.');
    process.exit(1);
  }

  if (!fs.existsSync(DB_FILE)) {
    console.error(`❌ Local database file not found at: ${DB_FILE}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(DB_FILE, 'utf8');
  const dbData = JSON.parse(raw);

  const validRefs = {
    workspaces: new Set((dbData.workspaces || []).map(w => w.id)),
    users: new Set((dbData.users || []).map(u => u.id)),
    posts: new Set((dbData.feed_posts || []).map(p => p.id)),
    conversations: new Set((dbData.conversations || []).map(c => c.id))
  };

  const syncOrder = [
    'workspaces',
    'users',
    'attendance',
    'tasks',
    'conversations',
    'messages',
    'meetings',
    'feed_posts',
    'feed_comments',
    'announcements',
    'notifications',
    'audit_logs'
  ];

  let totalUpserted = 0;

  for (const table of syncOrder) {
    const rawRecords = dbData[table] || [];
    if (rawRecords.length === 0) {
      console.log(`⚪ [${table}]: 0 records to sync.`);
      continue;
    }

    const sanitizedRecords = rawRecords
      .map(r => sanitizeRecord(table, r, validRefs))
      .filter(Boolean);

    if (sanitizedRecords.length === 0) {
      console.log(`⚪ [${table}]: 0 valid records after relation check.`);
      continue;
    }

    console.log(`⏳ [${table}]: Upserting ${sanitizedRecords.length} records to Supabase...`);
    
    // Batch in chunks of 50 for safety
    const chunkSize = 50;
    let tableSuccessCount = 0;
    let tableError = null;

    for (let i = 0; i < sanitizedRecords.length; i += chunkSize) {
      const chunk = sanitizedRecords.slice(i, i + chunkSize);
      const { data, error } = await supabase.from(table).upsert(chunk, { onConflict: 'id' });
      if (error) {
        tableError = error;
        break;
      } else {
        tableSuccessCount += chunk.length;
      }
    }

    if (tableError) {
      console.error(`❌ [${table}] Error:`, tableError.message);
    } else {
      console.log(`✅ [${table}]: Successfully synced ${tableSuccessCount} records!`);
      totalUpserted += tableSuccessCount;
    }
  }

  console.log('\n========================================================');
  console.log(`🎉 Complete Success! Total records in Supabase: ${totalUpserted}`);
  console.log('========================================================\n');
}

syncAllToSupabase().catch(err => {
  console.error('Fatal sync error:', err);
  process.exit(1);
});
