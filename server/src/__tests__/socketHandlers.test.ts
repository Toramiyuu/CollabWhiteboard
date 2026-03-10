import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RoomManager } from '../roomManager.js';
import { registerHandlers } from '../socketHandlers.js';
import type { DrawingElement } from '@collabwhiteboard/shared';

function makeMockSocket(userId = 'u1') {
  const handlers: Record<string, (...args: unknown[]) => void> = {};
  return {
    id: 'socket1',
    data: { userId, roomId: undefined as string | undefined },
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      handlers[event] = handler;
    }),
    emit: vi.fn(),
    to: vi.fn().mockReturnThis(),
    join: vi.fn(),
    leave: vi.fn(),
    _handlers: handlers,
    trigger(event: string, ...args: unknown[]) {
      handlers[event]?.(...args);
    },
  };
}

type MockSocket = ReturnType<typeof makeMockSocket>;
type MockIo = { to: ReturnType<typeof vi.fn> };

function makeMockIo(): MockIo {
  const io = {
    to: vi.fn().mockReturnValue({
      emit: vi.fn(),
    }),
  };
  return io;
}

function makePen(id: string, userId: string): DrawingElement {
  return {
    id,
    type: 'pen',
    userId,
    color: '#000',
    strokeWidth: 2,
    points: [{ x: 0, y: 0 }],
  };
}

describe('socketHandlers', () => {
  let rm: RoomManager;
  let socket: MockSocket;
  let io: MockIo;

  beforeEach(() => {
    rm = new RoomManager();
    socket = makeMockSocket('u1');
    io = makeMockIo();
    registerHandlers(socket as never, io as never, rm);
  });

  describe('room:join', () => {
    it('joins the socket to the room and returns state', () => {
      const callback = vi.fn();
      socket.trigger('room:join', 'room1', callback);
      expect(socket.join).toHaveBeenCalledWith('room1');
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ roomId: 'room1' })
      );
    });

    it('broadcasts user:joined to others in the room', () => {
      socket.trigger('room:join', 'room1', vi.fn());
      expect(socket.to).toHaveBeenCalledWith('room1');
    });

    it('stores roomId on socket.data', () => {
      socket.trigger('room:join', 'room1', vi.fn());
      expect(socket.data.roomId).toBe('room1');
    });
  });

  describe('element:commit', () => {
    beforeEach(() => {
      socket.trigger('room:join', 'room1', vi.fn());
    });

    it('adds element to room and broadcasts element:added', () => {
      const el = makePen('e1', 'u1');
      socket.trigger('element:commit', el);
      const room = rm.getOrCreateRoom('room1');
      expect(room.elements).toHaveLength(1);
      expect(socket.to).toHaveBeenCalledWith('room1');
    });
  });

  describe('element:erase', () => {
    beforeEach(() => {
      socket.trigger('room:join', 'room1', vi.fn());
      rm.commitElement('room1', makePen('e1', 'u1'));
    });

    it('removes elements and broadcasts element:removed', () => {
      socket.trigger('element:erase', ['e1']);
      expect(rm.getOrCreateRoom('room1').elements).toHaveLength(0);
      expect(socket.to).toHaveBeenCalledWith('room1');
    });
  });

  describe('history:undo', () => {
    beforeEach(() => {
      socket.trigger('room:join', 'room1', vi.fn());
      rm.commitElement('room1', makePen('e1', 'u1'));
    });

    it('undoes the last action and calls callback with result', () => {
      const callback = vi.fn();
      socket.trigger('history:undo', callback);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ removedIds: expect.any(Array) })
      );
      expect(rm.getOrCreateRoom('room1').elements).toHaveLength(0);
    });

    it('calls callback with false when nothing to undo', () => {
      rm.undo('room1', 'u1'); // consume the one history entry
      const callback = vi.fn();
      socket.trigger('history:undo', callback);
      expect(callback).toHaveBeenCalledWith(false);
    });
  });

  describe('canvas:clear', () => {
    beforeEach(() => {
      socket.trigger('room:join', 'room1', vi.fn());
      rm.commitElement('room1', makePen('e1', 'u1'));
    });

    it('clears all elements and broadcasts canvas:cleared', () => {
      socket.trigger('canvas:clear');
      expect(rm.getOrCreateRoom('room1').elements).toHaveLength(0);
    });
  });

  describe('disconnect', () => {
    it('removes user from room and broadcasts user:left', () => {
      socket.trigger('room:join', 'room1', vi.fn());
      socket.trigger('disconnect');
      expect(rm.getOrCreateRoom('room1').users).toHaveLength(0);
    });
  });

  describe('cursor:move', () => {
    beforeEach(() => {
      socket.trigger('room:join', 'room1', vi.fn());
    });

    it('broadcasts cursor:moved to room', () => {
      socket.trigger('cursor:move', { x: 10, y: 20 });
      expect(socket.to).toHaveBeenCalledWith('room1');
    });
  });
});
