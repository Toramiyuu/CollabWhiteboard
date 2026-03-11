import type { Socket, Server } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents, DrawingElement, PartialPenElement } from '@collabwhiteboard/shared';
import { RoomManager } from './roomManager.js';
import { userColor } from './utils.js';

type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents> & {
  data: { userId: string; roomId?: string };
};
type AppServer = Server<ClientToServerEvents, ServerToClientEvents>;

export function registerHandlers(socket: AppSocket, io: AppServer, rm: RoomManager): void {
  socket.on('room:join', (roomId, callback) => {
    socket.join(roomId);
    socket.data.roomId = roomId;
    rm.setSocketRoom(socket.id, roomId);

    const color = userColor(socket.data.userId);
    const user = { userId: socket.data.userId, color };
    rm.addUser(roomId, user);

    socket.to(roomId).emit('user:joined', user);

    const state = rm.getOrCreateRoom(roomId);
    callback(state);
  });

  socket.on('element:preview', (element: PartialPenElement) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    socket.to(roomId).emit('element:preview', element);
  });

  socket.on('element:commit', (element: DrawingElement) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    rm.commitElement(roomId, element);
    socket.to(roomId).emit('element:added', element);
  });

  socket.on('element:erase', (ids: string[]) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    rm.eraseElements(roomId, ids, socket.data.userId);
    socket.to(roomId).emit('element:removed', ids);
  });

  socket.on('history:undo', (callback) => {
    const roomId = socket.data.roomId;
    if (!roomId) { callback(false); return; }
    const result = rm.undo(roomId, socket.data.userId);
    if (!result) { callback(false); return; }
    // Broadcast restored elements to all clients (including requester) before event
    for (const el of result.restoredElements) {
      io.to(roomId).emit('element:added', el);
    }
    socket.to(roomId).emit('history:undone', result);
    callback(result);
  });

  socket.on('history:redo', (callback) => {
    const roomId = socket.data.roomId;
    if (!roomId) { callback(false); return; }
    const result = rm.redo(roomId, socket.data.userId);
    if (!result) { callback(false); return; }
    // Broadcast re-added elements to all clients (including requester) before event
    for (const el of result.addedElements) {
      io.to(roomId).emit('element:added', el);
    }
    socket.to(roomId).emit('history:redone', result);
    callback(result);
  });

  socket.on('canvas:clear', () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    rm.clearCanvas(roomId, socket.data.userId);
    io.to(roomId).emit('canvas:cleared');
  });

  socket.on('cursor:move', ({ x, y }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    socket.to(roomId).emit('cursor:moved', { userId: socket.data.userId, x, y });
  });

  socket.on('disconnect', () => {
    const roomId = socket.data.roomId ?? rm.getRoomForSocket(socket.id);
    if (roomId) {
      rm.removeUser(roomId, socket.data.userId);
      rm.removeSocket(socket.id);
      socket.to(roomId).emit('user:left', socket.data.userId);
    }
  });
}
