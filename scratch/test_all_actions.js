// Comprehensive E2E test simulating all UI button actions against the live Vigilans backend
const BASE_URL = 'http://127.0.0.1:3001/api';

async function req(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('🧪 Starting Vigilans Comprehensive Button & Action Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(name, condition, extra = '') {
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name}:`, extra);
      failed++;
    }
  }

  try {
    // 1. Demo Users (Login 1-Click Persona Switcher buttons)
    const demoRes = await req('/auth/demo-users');
    assert('1-Click Demo Personas list', demoRes.ok && demoRes.data.length >= 4);

    // 2. Login Owner (Sign In button)
    const loginRes = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'owner@vigilans.com', password: 'Password123!' })
    });
    assert('Owner Login button', loginRes.ok && loginRes.data.token, JSON.stringify(loginRes.data));
    const ownerToken = loginRes.data.token;
    const authHeaders = { Authorization: `Bearer ${ownerToken}` };

    // 3. Current User / Me
    const meRes = await req('/auth/me', { headers: authHeaders });
    assert('Session persistence / Auth context', meRes.ok && (meRes.data?.user?.role === 'owner' || meRes.data?.user?.system_role === 'owner'), JSON.stringify(meRes.data));

    // 4. Staff Directory - Fetch
    const staffRes = await req('/staff', { headers: authHeaders });
    assert('Staff Directory list', staffRes.ok && Array.isArray(staffRes.data.staff || staffRes.data));

    // 5. Staff Directory - Add Staff Member button
    const testStaffEmail = `test.staff.${Date.now()}@vigilans.com`;
    const addStaffRes = await req('/staff', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        first_name: 'Alex',
        last_name: 'Rivera',
        email: testStaffEmail,
        password: 'Password123!',
        role_title: 'Product Designer', // Non-unique role
        department: 'Design',
        phone: '+1 (555) 999-8888',
        system_role: 'staff'
      })
    });
    assert('Add Staff Member button & submit', addStaffRes.ok && (addStaffRes.data?.user?.id || addStaffRes.data?.id), JSON.stringify(addStaffRes.data));
    const newStaffId = addStaffRes.data?.user?.id || addStaffRes.data?.id;

    // 6. Staff Directory - Edit Staff & Toggle Suspend buttons
    if (newStaffId) {
      const editStaffRes = await req(`/staff/${newStaffId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          role_title: 'Lead Product Designer',
          status: 'suspended'
        })
      });
      assert('Edit Staff & Toggle Suspend buttons', editStaffRes.ok && (editStaffRes.data?.user?.status === 'suspended' || editStaffRes.data?.status === 'suspended'), JSON.stringify(editStaffRes.data));

      // Reactivate
      const reactivateRes = await req(`/staff/${newStaffId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ status: 'active' })
      });
      assert('Reactivate Staff button', reactivateRes.ok && (reactivateRes.data?.user?.status === 'active' || reactivateRes.data?.status === 'active'), JSON.stringify(reactivateRes.data));
    }

    // 7. Attendance - Barcode Clock-In button
    // Login as staff user Liam Miller
    const staffLoginRes = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'liam.designer@vigilans.com', password: 'Password123!' })
    });
    assert('Staff login', staffLoginRes.ok && staffLoginRes.data.token);
    const staffHeaders = { Authorization: `Bearer ${staffLoginRes.data.token}` };

    const clockInRes = await req('/attendance/clock-in', {
      method: 'POST',
      headers: staffHeaders,
      body: JSON.stringify({
        barcode_token: 'VIGILANS-HQ-ATTENDANCE-KEY-9823',
        device_info: 'E2E Test Terminal'
      })
    });
    // Can succeed or return already clocked in
    assert('Barcode Clock-In scan button', clockInRes.ok || clockInRes.status === 400, clockInRes.data?.error);

    // 8. Attendance - Today status & Clock-Out button
    const todayAttRes = await req('/attendance/today', { headers: staffHeaders });
    assert('Live attendance metrics & list', todayAttRes.ok && todayAttRes.data.metrics);

    // Staff Clock Out
    const clockOutRes = await req('/attendance/clock-out', {
      method: 'POST',
      headers: staffHeaders,
      body: JSON.stringify({})
    });
    assert('Clock Out button (Self)', clockOutRes.ok || clockOutRes.status === 400, clockOutRes.data?.error);

    // 9. Tasks - Create Task button
    const createTaskRes = await req('/tasks', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Complete UI Interaction Audit',
        description: 'Ensure every button, tab, dropdown, and toggle functions flawlessly.',
        priority: 'urgent',
        due_date: 'Today',
        subtasks: [
          { id: 'st-1', title: 'Test sidebar tabs', completed: true },
          { id: 'st-2', title: 'Test modals and drawers', completed: false }
        ]
      })
    });
    assert('Create Task button & modal submit', createTaskRes.ok && (createTaskRes.data?.task?.id || createTaskRes.data?.id), JSON.stringify(createTaskRes.data));
    const taskId = createTaskRes.data?.task?.id || createTaskRes.data?.id;

    // 10. Tasks - Update status & Toggle subtask buttons
    if (taskId) {
      const updateTaskRes = await req(`/tasks/${taskId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          status: 'in-progress',
          subtasks: [
            { id: 'st-1', title: 'Test sidebar tabs', completed: true },
            { id: 'st-2', title: 'Test modals and drawers', completed: true }
          ]
        })
      });
      assert('Update Task Status & Checklist checkbox toggle', updateTaskRes.ok, JSON.stringify(updateTaskRes.data));

      // Task Comment Reply button
      const commentRes = await req(`/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ content: 'All buttons checked and verified!' })
      });
      assert('Task Reply / Comment button', commentRes.ok, JSON.stringify(commentRes.data));
    }

    // 11. Messages & Chat - Send message & Audio buttons
    const convRes = await req('/messages/conversations', { headers: authHeaders });
    assert('Conversations & Channels list', convRes.ok && convRes.data.length > 0);
    const convId = convRes.data[0]?.id;

    if (convId) {
      const sendMsgRes = await req(`/messages/${convId}`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          type: 'text',
          content: 'Testing automated button click flow'
        })
      });
      assert('Send Message button', sendMsgRes.ok && (sendMsgRes.data?.message?.id || sendMsgRes.data?.id), JSON.stringify(sendMsgRes.data));
      const msgId = sendMsgRes.data?.message?.id || sendMsgRes.data?.id;

      if (msgId) {
        const delMsgRes = await req(`/messages/${msgId}`, {
          method: 'DELETE',
          headers: authHeaders
        });
        assert('Delete Message button', delMsgRes.ok, JSON.stringify(delMsgRes.data));
      }
    }

    // 12. Meetings - Schedule Meeting button
    const createMeetingRes = await req('/meetings', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Weekly Executive Punctuality Sync',
        agenda: 'Review barcode timestamps and lateness reports',
        scheduled_time: 'Today at 4:30 PM',
        duration_minutes: 30,
        host_name: 'Marcus Vance'
      })
    });
    assert('Schedule Meeting button', createMeetingRes.ok && (createMeetingRes.data?.meeting?.id || createMeetingRes.data?.id), JSON.stringify(createMeetingRes.data));

    // 13. Feed - Post Update & Like buttons
    const createPostRes = await req('/feed', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        content: 'Huge milestone! All workspace modules and buttons are responsive and operational.',
      })
    });
    assert('Feed Post Update button', createPostRes.ok && (createPostRes.data?.post?.id || createPostRes.data?.id), JSON.stringify(createPostRes.data));
    const postId = createPostRes.data?.post?.id || createPostRes.data?.id;

    if (postId) {
      const likeRes = await req(`/feed/${postId}/like`, {
        method: 'POST',
        headers: authHeaders
      });
      assert('Feed Like button', likeRes.ok);

      const replyRes = await req(`/feed/${postId}/comment`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ content: 'Awesome job team!' })
      });
      assert('Feed Comment Reply button', replyRes.ok);
    }

    // 14. Announcements - Broadcast Announcement button
    const annRes = await req('/announcements', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'System Operational Notification',
        content: 'Vigilans Workspace attendance engine and communications channels are live.',
        priority: 'high',
        department: 'all'
      })
    });
    assert('Broadcast Announcement button', annRes.ok && (annRes.data?.announcement?.id || annRes.data?.id), JSON.stringify(annRes.data));

    // 15. Reports / Analytics
    const reportsRes = await req('/reports', { headers: authHeaders });
    assert('Analytics & Reports data', reportsRes.ok);

    // 16. Settings - Save Workspace Rules & Regenerate Barcode Token buttons
    const updateWsRes = await req('/workspaces/current', {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        attendanceSettings: {
          officeStartTime: '09:00',
          gracePeriodMinutes: 15,
          autoClockOutTime: '17:00'
        }
      })
    });
    assert('Save Workspace Rules button', updateWsRes.ok);

    const regenRes = await req('/workspaces/current/barcode-token', {
      method: 'POST',
      headers: authHeaders
    });
    assert('Regenerate Barcode Token button', regenRes.ok && regenRes.data?.barcode_token, JSON.stringify(regenRes.data));

    console.log(`\n🏁 Test Run Finished: ${passed} passed, ${failed} failed.`);
    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Fatal error during test run:', err);
    process.exit(1);
  }
}

runTests();
