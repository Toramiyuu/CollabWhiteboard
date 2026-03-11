import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { nanoid } from 'nanoid';
import { RoomManager } from './roomManager.js';
import { registerHandlers } from './socketHandlers.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

const rm = new RoomManager();

app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (_req.method === 'OPTIONS') { res.sendStatus(204); return; }
  next();
});
app.use(express.json());

// Create a new room
app.post('/api/rooms', (_req, res) => {
  const roomId = nanoid(10);
  rm.getOrCreateRoom(roomId);
  res.json({ roomId });
});

io.on('connection', (socket) => {
  // Use socket.id as userId so it matches what the client sends in element.userId
  socket.data.userId = socket.id;

  registerHandlers(socket as never, io as never, rm);
});

const PORT = process.env.PORT ?? 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
