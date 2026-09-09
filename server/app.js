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

// Enable CORS
app.use(cors());

// Vercel serverless request body and URL normalization
app.use((req, res, next) => {
  // If Vercel or proxy sent x-forwarded-uri, normalize req.url
  const forwarded = req.headers['x-forwarded-uri'] || req.headers['x-matched-path'];
  if (forwarded && forwarded.startsWith('/api') && !req.url.startsWith('/api')) {
    req.url = forwarded;
  }

  // If body is a JSON string already parsed by platform
  if (typeof req.body === 'string' && req.body.trim().startsWith('{')) {
    try {
      req.body = JSON.parse(req.body);
    } catch (e) {}
  }
  next();
});

// JSON & URL-encoded body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files statically
const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const uploadsDir = isVercel ? path.join('/tmp', 'uploads') : path.join(__dirname, 'uploads');
try {
  app.use('/uploads', express.static(uploadsDir));
} catch (e) {}

// Mount API Routes on both /api/* and /* so rewrites always resolve
const routes = [
  ['/auth', authRoutes],
  ['/workspaces', workspaceRoutes],
  ['/staff', staffRoutes],
  ['/attendance', attendanceRoutes],
  ['/tasks', taskRoutes],
  ['/messages', messageRoutes],
  ['/meetings', meetingRoutes],
  ['/feed', feedRoutes],
  ['/announcements', announcementRoutes],
  ['/reports', reportRoutes],
  ['/uploads', uploadRoutes],
];

routes.forEach(([path, router]) => {
  app.use(`/api${path}`, router);
  app.use(path, router);
});

// Health check endpoint
const healthHandler = (req, res) => {
  res.json({
    status: 'ok',
    platform: 'Vigilans Enterprise Workspace Platform',
    timestamp: new Date().toISOString()
  });
};
app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// Global JSON error handler to prevent HTML 500 pages
app.use((err, req, res, next) => {
  console.error('Unhandled API Exception:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
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
