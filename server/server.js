import http from 'http';
import { WebSocketServer } from 'ws';
import { app } from './app.js';

const server = http.createServer(app);

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

const PORT = process.env.PORT || 3001;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Vigilans backend API running at http://127.0.0.1:${PORT}`);
});
