// API helper for Vigilans backend

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('vigilans_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  // If body is FormData, don't set Content-Type so browser sets boundary
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      throw new Error('Server returned HTML instead of API data. Please check your backend connection.');
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.error || data?.message || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    if (data === null && response.status !== 204) {
      throw new Error('Received an empty response from server.');
    }

    return data;
  } catch (err) {
    if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
      throw new Error('Unable to connect to Vigilans backend. Please verify your server is running.');
    }
    throw err;
  }
}

// Upload file helper
export async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest('/uploads', {
    method: 'POST',
    body: formData,
  });
}

// Full REST API client helpers
export const api = {
  // Staff
  getStaff: async () => {
    const res = await apiRequest('/staff');
    const list = Array.isArray(res) ? res : (res?.staff || []);
    return list.map(s => ({
      ...s,
      fullName: s.fullName || `${s.first_name || ''} ${s.last_name || ''}`.trim(),
      roleTitle: s.roleTitle || s.role_title,
      avatar: s.avatar || s.profile_picture,
      role: s.role || s.system_role,
      isWorkingNow: s.status_details?.is_clocked_in || s.isWorkingNow || false,
    }));
  },
  addStaff: (data) => apiRequest('/staff', { 
    method: 'POST', 
    body: JSON.stringify({
      first_name: data.fullName ? data.fullName.split(' ')[0] : data.first_name,
      last_name: data.fullName ? data.fullName.split(' ').slice(1).join(' ') || 'Staff' : data.last_name,
      email: data.email,
      password: data.password,
      role_title: data.roleTitle || data.role_title,
      department: data.department,
      phone: data.phone,
      system_role: data.role || data.system_role || 'staff',
    }) 
  }),
  updateStaff: (id, data) => apiRequest(`/staff/${id}`, { 
    method: 'PUT', 
    body: JSON.stringify({
      first_name: data.fullName ? data.fullName.split(' ')[0] : data.first_name,
      last_name: data.fullName ? data.fullName.split(' ').slice(1).join(' ') || 'Staff' : data.last_name,
      role_title: data.roleTitle || data.role_title,
      department: data.department,
      phone: data.phone,
      status: data.status,
      system_role: data.role || data.system_role,
    }) 
  }),
  deleteStaff: (id) => apiRequest(`/staff/${id}`, { method: 'DELETE' }),

  // Attendance
  getTodayAttendance: async () => {
    const res = await apiRequest('/attendance/today');
    return {
      metrics: res?.metrics || {},
      records: res?.records || [],
      live_staff: res?.live_staff || [],
    };
  },
  getAttendanceHistory: async (params = '') => {
    const res = await apiRequest(`/attendance/history${params}`);
    const list = Array.isArray(res) ? res : (res?.records || []);
    return {
      records: list.map(r => ({
        id: r.id,
        staffId: r.user_id || r.staffId,
        staffName: r.employee_name || r.staffName || 'Staff Member',
        staffAvatar: r.profile_picture || r.staffAvatar,
        roleTitle: r.role_title || r.roleTitle,
        department: r.department,
        date: r.date,
        clockInTime: r.clock_in || r.clockInTime,
        clockOutTime: r.clock_out || r.clockOutTime,
        status: r.is_late ? 'late' : (r.status === 'working' ? 'present' : r.status || 'present'),
        minutesLate: r.late_minutes || r.minutesLate || 0,
        durationHours: r.total_duration ? (r.total_duration / 3600).toFixed(1) : (r.durationHours || 0),
      })),
      stats: res?.stats || {}
    };
  },
  clockIn: (data) => apiRequest('/attendance/clock-in', { 
    method: 'POST', 
    body: JSON.stringify({
      barcode_token: data.barcodeToken || data.barcode_token,
      device_info: data.deviceInfo || 'Vigilans Web Terminal'
    }) 
  }),
  clockOut: (data) => apiRequest('/attendance/clock-out', { 
    method: 'POST', 
    body: JSON.stringify(data) 
  }),

  // Tasks
  getTasks: async () => {
    const res = await apiRequest('/tasks');
    const list = Array.isArray(res) ? res : (res?.tasks || []);
    return list.map(t => ({
      ...t,
      dueDate: t.due_date || t.dueDate,
      assigneeName: t.assignees_details?.[0]?.name || t.assigneeName || 'Unassigned',
      subtasks: Array.isArray(t.subtasks) 
        ? t.subtasks.map((s, i) => typeof s === 'string' ? { id: `st-${i}`, title: s, completed: false } : s)
        : [],
      comments: t.comments || [],
    }));
  },
  createTask: (data) => apiRequest('/tasks', { 
    method: 'POST', 
    body: JSON.stringify({
      title: data.title,
      description: data.description,
      priority: data.priority,
      due_date: data.dueDate || data.due_date,
      assignees: data.assignees || (data.assigneeId ? [data.assigneeId] : []),
      subtasks: data.subtasks || []
    }) 
  }),
  updateTask: (id, data) => apiRequest(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  addTaskComment: (id, data) => apiRequest(`/tasks/${id}/comments`, { method: 'POST', body: JSON.stringify(data) }),

  // Messages & Chat
  getConversations: async () => {
    const res = await apiRequest('/messages/conversations');
    const list = Array.isArray(res) ? res : (res?.conversations || []);
    return list.map(c => ({
      ...c,
      name: c.display_name || c.name,
      avatar: c.display_avatar || c.avatar,
      lastMessage: c.last_message_text || c.last_message,
      lastMessageTime: c.last_message_time ? new Date(c.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
    }));
  },
  getMessages: (convId) => apiRequest(`/messages/${convId}`),
  sendMessage: (convId, data) => apiRequest(`/messages/${convId}`, { method: 'POST', body: JSON.stringify(data) }),
  deleteMessage: (msgId) => apiRequest(`/messages/${msgId}`, { method: 'DELETE' }),

  // Meetings
  getMeetings: async () => {
    const res = await apiRequest('/meetings');
    const list = Array.isArray(res) ? res : (res?.meetings || []);
    return list.map(m => ({
      ...m,
      hostName: m.host_name || m.hostName,
      scheduledTime: m.scheduled_time || m.scheduledTime,
      durationMinutes: m.duration_minutes || m.durationMinutes || 45,
    }));
  },
  createMeeting: (data) => apiRequest('/meetings', { 
    method: 'POST', 
    body: JSON.stringify({
      title: data.title,
      agenda: data.agenda,
      scheduled_time: data.scheduledTime || data.scheduled_time,
      duration_minutes: data.durationMinutes || data.duration_minutes,
      host_name: data.hostName || data.host_name,
    }) 
  }),

  // Feed
  getFeed: async () => {
    const res = await apiRequest('/feed');
    const list = Array.isArray(res) ? res : (res?.posts || []);
    return list.map(p => ({
      ...p,
      authorName: p.author_name || p.authorName,
      authorAvatar: p.author_avatar || p.authorAvatar,
      authorRole: p.author_role || p.authorRole,
      authorRoleTitle: p.author_role_title || p.authorRoleTitle || p.author_role,
      timestamp: p.created_at || p.timestamp,
      mediaUrl: p.media_url || p.mediaUrl,
      likes: Array.isArray(p.likes) ? p.likes : [],
      likes_count: p.likes_count !== undefined ? p.likes_count : (Array.isArray(p.likes) ? p.likes.length : 0),
      has_liked: Boolean(p.has_liked),
      comments: (p.comments || []).map(c => ({
        ...c,
        authorName: c.author_name || c.authorName,
        authorAvatar: c.author_avatar || c.authorAvatar,
        timestamp: c.created_at || c.timestamp,
      })),
    }));
  },
  createPost: (data) => apiRequest('/feed', { 
    method: 'POST', 
    body: JSON.stringify({
      content: data.content,
      media_url: data.mediaUrl || data.media_url
    }) 
  }),
  likePost: (id) => apiRequest(`/feed/${id}/like`, { method: 'POST' }),
  commentPost: (id, data) => apiRequest(`/feed/${id}/comment`, { method: 'POST', body: JSON.stringify(data) }),
  deletePost: (id) => apiRequest(`/feed/${id}`, { method: 'DELETE' }),

  // Announcements
  getAnnouncements: async () => {
    const res = await apiRequest('/announcements');
    const list = Array.isArray(res) ? res : (res?.announcements || []);
    return list.map(a => ({
      ...a,
      authorName: a.author_name || a.authorName,
      publishedAt: a.published_at || a.created_at || a.publishedAt,
    }));
  },
  createAnnouncement: (data) => apiRequest('/announcements', { 
    method: 'POST', 
    body: JSON.stringify({
      title: data.title,
      content: data.content,
      priority: data.priority,
      department: data.department
    }) 
  }),
  deleteAnnouncement: (id) => apiRequest(`/announcements/${id}`, { method: 'DELETE' }),

  // Reports
  getReports: (params = '') => apiRequest(`/reports${params}`),

  // Workspace & Audit
  getWorkspace: () => apiRequest('/workspaces/current'),
  updateWorkspace: (data) => apiRequest('/workspaces/current', { method: 'PUT', body: JSON.stringify(data) }),
  regenerateBarcodeToken: () => apiRequest('/workspaces/current/barcode-token', { method: 'POST' }),
  getAuditLogs: () => apiRequest('/workspaces/audit-logs'),
};
