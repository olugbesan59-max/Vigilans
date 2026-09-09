import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { seedDatabase } from './db/seedData.js';

import authRoutes from './routes/auth.js';
import workspaceRoutes from './routes/workspaces.js';
import staffRoutes from './routes/staff.js';
import attendanceRoutes from './routes/attendance.js';
import taskRoutes from './routes/tasks.js';
import messageRoutes from './routes/messages.js';
import meetingRoutes from './routes/meetings.js';
import feedRoutes from './routes/feed.js';
import announcementRoutes from './routes/announcements.js';
import reportRoutes from './routes/reports.js';
import uploadRoutes from './routes/uploads.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files statically
const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const uploadsDir = isVercel ? path.join('/tmp', 'uploads') : path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/uploads', uploadRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    platform: 'Vigilans Enterprise Workspace Platform',
    timestamp: new Date().toISOString()
  });
});

// Seed demo database on boot
try {
  seedDatabase();
} catch (e) {
  console.warn('Seed database warning:', e.message);
}

export { app, seedDatabase };
export default app;
