import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase, isSupabaseConfigured } from './supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_DB_FILE = path.join(__dirname, '..', 'data', 'vigilans.db.json');
const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DB_FILE = isVercel ? path.join('/tmp', 'vigilans.db.json') : DEFAULT_DB_FILE;

// Ensure data directory exists
const dataDir = path.dirname(DB_FILE);
try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
} catch (e) {
  // Directory might already exist or be restricted
}

// Allowed columns matching Supabase schema exactly to prevent cache errors
const SUPABASE_ALLOWED_COLUMNS = {
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

function sanitizeForSupabase(table, record) {
  const allowed = SUPABASE_ALLOWED_COLUMNS[table];
  if (!allowed) return record;

  const sanitized = {};
  for (const col of allowed) {
    if (record[col] !== undefined) {
      sanitized[col] = record[col];
    }
  }

  // Attendance total_hours calculation if total_duration was supplied
  if (table === 'attendance' && sanitized.total_hours === undefined) {
    if (record.total_duration) {
      sanitized.total_hours = Number((record.total_duration / 3600).toFixed(2));
    } else {
      sanitized.total_hours = 0;
    }
  }

  return sanitized;
}

class Database {
  constructor() {
    this.tables = {
      workspaces: [],
      users: [],
      attendance: [],
      tasks: [],
      conversations: [],
      messages: [],
      meetings: [],
      feed_posts: [],
      feed_comments: [],
      announcements: [],
      notifications: [],
      audit_logs: [],
    };
    this.saveTimeout = null;
    this.load();

    if (isSupabaseConfigured) {
      this.syncFromSupabase();
    }
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        this.tables = { ...this.tables, ...parsed };
      } else if (fs.existsSync(DEFAULT_DB_FILE)) {
        const raw = fs.readFileSync(DEFAULT_DB_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        this.tables = { ...this.tables, ...parsed };
        if (isVercel) {
          try {
            fs.writeFileSync(DB_FILE, raw, 'utf8');
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error('Failed to load database file, starting clean:', err);
    }
  }

  async syncFromSupabase() {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      console.log('🔄 Syncing in-memory database with Supabase tables...');
      const tableNames = Object.keys(this.tables);
      for (const table of tableNames) {
        const { data, error } = await supabase.from(table).select('*');
        if (!error && Array.isArray(data) && data.length > 0) {
          this.tables[table] = data;
        }
      }
      this.saveSync();
      console.log('✅ In-memory database synchronized with Supabase.');
    } catch (err) {
      console.warn('⚠️ Could not sync from Supabase:', err.message);
    }
  }

  save() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(this.tables, null, 2), 'utf8');
      } catch (err) {
        console.error('Failed to save database file:', err);
      }
    }, 100);
  }

  saveSync() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.tables, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to save database file synchronously:', err);
    }
  }

  find(table, filterFn = () => true) {
    if (!this.tables[table]) return [];
    return this.tables[table].filter(filterFn);
  }

  findOne(table, filterFn = () => true) {
    if (!this.tables[table]) return null;
    return this.tables[table].find(filterFn) || null;
  }

  findById(table, id) {
    return this.findOne(table, item => item.id === id);
  }

  insert(table, record) {
    if (!this.tables[table]) this.tables[table] = [];
    const item = {
      id: record.id || `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: record.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...record
    };
    this.tables[table].push(item);
    this.save();

    if (isSupabaseConfigured && supabase) {
      const payload = sanitizeForSupabase(table, item);
      supabase
        .from(table)
        .upsert(payload)
        .then(({ error }) => {
          if (error) console.error(`[Supabase Insert Error - ${table}]:`, error.message);
        })
        .catch(e => console.error(`[Supabase Insert Exception - ${table}]:`, e.message));
    }

    return item;
  }

  update(table, id, updates) {
    if (!this.tables[table]) return null;
    const index = this.tables[table].findIndex(item => item.id === id);
    if (index === -1) return null;

    this.tables[table][index] = {
      ...this.tables[table][index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.save();

    if (isSupabaseConfigured && supabase) {
      const payload = sanitizeForSupabase(table, updates);
      if (Object.keys(payload).length > 0) {
        supabase
          .from(table)
          .update(payload)
          .eq('id', id)
          .then(({ error }) => {
            if (error) console.error(`[Supabase Update Error - ${table}]:`, error.message);
          })
          .catch(e => console.error(`[Supabase Update Exception - ${table}]:`, e.message));
      }
    }

    return this.tables[table][index];
  }

  delete(table, id) {
    if (!this.tables[table]) return false;
    const initialLen = this.tables[table].length;
    this.tables[table] = this.tables[table].filter(item => item.id !== id);
    const deleted = this.tables[table].length < initialLen;
    if (deleted) {
      this.save();
      if (isSupabaseConfigured && supabase) {
        supabase
          .from(table)
          .delete()
          .eq('id', id)
          .then(({ error }) => {
            if (error) console.error(`[Supabase Delete Error - ${table}]:`, error.message);
          })
          .catch(e => console.error(`[Supabase Delete Exception - ${table}]:`, e.message));
      }
    }
    return deleted;
  }

  clear() {
    for (const key of Object.keys(this.tables)) {
      this.tables[key] = [];
    }
    this.saveSync();
  }
}

export const db = new Database();
