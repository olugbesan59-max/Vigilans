import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';

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
const server = http.createServer(app);

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// WebSocket Server for Real-Time Chat, Calls, and Meeting Signals
const wss = new WebSocketServer({ server, path: '/ws' });
const connectedClients = new Set();

wss.on('connection', (ws) => {
  connectedClients.add(ws);

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      // Broadcast to all other connected clients
      connectedClients.forEach(client => {
        if (client !== ws && client.readyState === ws.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
    } catch (e) {
      console.error('Error handling WebSocket message:', e);
    }
  });

  ws.on('close', () => {
    connectedClients.delete(ws);
  });
});

// Seed demo database on boot
seedDatabase();

const PORT = process.env.PORT || 3001;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Vigilans backend API running at http://127.0.0.1:${PORT}`);
});
