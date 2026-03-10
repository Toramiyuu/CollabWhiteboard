import { describe, it, expect, beforeEach } from 'vitest';
import { RoomManager } from '../roomManager.js';
import type { DrawingElement, HistoryEntry } from '@collabwhiteboard/shared';

function makePen(id: string, userId: string): DrawingElement {
  return {
    id,
    type: 'pen',
    userId,
    color: '#000',
    strokeWidth: 2,
    points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
  };
}

function makeRect(id: string, userId: string): DrawingElement {
  return {
    id,
    type: 'rectangle',
    userId,
    color: '#f00',
    strokeWidth: 2,
    x: 0, y: 0, width: 100, height: 50,
  };
}

describe('RoomManager', () => {
  let rm: RoomManager;

  beforeEach(() => {
    rm = new RoomManager();
  });

  describe('getOrCreateRoom', () => {
    it('creates a new room with empty state', () => {
      const room = rm.getOrCreateRoom('room1');
      expect(room.roomId).toBe('room1');
      expect(room.elements).toHaveLength(0);
      expect(room.users).toHaveLength(0);
    });

    it('returns the same room data on subsequent calls', () => {
      const a = rm.getOrCreateRoom('room1');
      const b = rm.getOrCreateRoom('room1');
      expect(a).toStrictEqual(b);
    });

    it('creates distinct rooms for different IDs', () => {
      const a = rm.getOrCreateRoom('room1');
      const b = rm.getOrCreateRoom('room2');
      expect(a).not.toBe(b);
    });
  });

  describe('addUser / removeUser', () => {
    it('adds a user to the room', () => {
      rm.getOrCreateRoom('room1');
      rm.addUser('room1', { userId: 'u1', color: '#abc' });
      const room = rm.getOrCreateRoom('room1');
      expect(room.users).toHaveLength(1);
      expect(room.users[0].userId).toBe('u1');
    });

    it('does not duplicate users', () => {
      rm.getOrCreateRoom('room1');
      rm.addUser('room1', { userId: 'u1', color: '#abc' });
      rm.addUser('room1', { userId: 'u1', color: '#abc' });
      expect(rm.getOrCreateRoom('room1').users).toHaveLength(1);
    });

    it('removes a user from the room', () => {
      rm.getOrCreateRoom('room1');
      rm.addUser('room1', { userId: 'u1', color: '#abc' });
      rm.removeUser('room1', 'u1');
      expect(rm.getOrCreateRoom('room1').users).toHaveLength(0);
    });
  });

  describe('commitElement', () => {
    it('adds element to the room', () => {
      rm.getOrCreateRoom('room1');
      const el = makePen('e1', 'u1');
      rm.commitElement('room1', el);
      expect(rm.getOrCreateRoom('room1').elements).toHaveLength(1);
      expect(rm.getOrCreateRoom('room1').elements[0].id).toBe('e1');
    });

    it('records a history entry for the add', () => {
      rm.getOrCreateRoom('room1');
      rm.commitElement('room1', makePen('e1', 'u1'));
      const history = rm.getHistory('room1');
      expect(history).toHaveLength(1);
      expect(history[0].kind).toBe('add');
      expect(history[0].userId).toBe('u1');
      expect(history[0].added[0].id).toBe('e1');
    });
  });

  describe('eraseElements', () => {
    it('removes elements by IDs', () => {
      rm.getOrCreateRoom('room1');
      rm.commitElement('room1', makePen('e1', 'u1'));
      rm.commitElement('room1', makePen('e2', 'u1'));
      rm.eraseElements('room1', ['e1'], 'u1');
      const elements = rm.getOrCreateRoom('room1').elements;
      expect(elements).toHaveLength(1);
      expect(elements[0].id).toBe('e2');
    });

    it('records a history entry for the erase', () => {
      rm.getOrCreateRoom('room1');
      rm.commitElement('room1', makePen('e1', 'u1'));
      rm.eraseElements('room1', ['e1'], 'u1');
      const history = rm.getHistory('room1');
      expect(history[1].kind).toBe('erase');
      expect(history[1].removed[0].id).toBe('e1');
    });

    it('ignores IDs that do not exist', () => {
      rm.getOrCreateRoom('room1');
      rm.commitElement('room1', makePen('e1', 'u1'));
      rm.eraseElements('room1', ['nonexistent'], 'u1');
      expect(rm.getOrCreateRoom('room1').elements).toHaveLength(1);
    });
  });

  describe('undo', () => {
    it('undoes a pen add — removes the element', () => {
      rm.getOrCreateRoom('room1');
      rm.commitElement('room1', makePen('e1', 'u1'));
      const result = rm.undo('room1', 'u1');
      expect(result).not.toBeNull();
      expect(result!.removedIds).toContain('e1');
      expect(result!.restoredIds).toHaveLength(0);
      expect(rm.getOrCreateRoom('room1').elements).toHaveLength(0);
    });

    it('undoes an erase — restores the elements', () => {
      rm.getOrCreateRoom('room1');
      rm.commitElement('room1', makePen('e1', 'u1'));
      rm.eraseElements('room1', ['e1'], 'u1');
      const result = rm.undo('room1', 'u1');
      expect(result).not.toBeNull();
      expect(result!.restoredIds).toContain('e1');
      expect(rm.getOrCreateRoom('room1').elements).toHaveLength(1);
    });

    it('returns null when there is nothing to undo for that user', () => {
      rm.getOrCreateRoom('room1');
      rm.commitElement('room1', makePen('e1', 'u2'));
      const result = rm.undo('room1', 'u1');
      expect(result).toBeNull();
    });

    it('only undoes the requesting user\'s last action', () => {
      rm.getOrCreateRoom('room1');
      rm.commitElement('room1', makePen('e1', 'u1'));
      rm.commitElement('room1', makeRect('e2', 'u2'));
      rm.undo('room1', 'u1');
      const elements = rm.getOrCreateRoom('room1').elements;
      expect(elements).toHaveLength(1);
      expect(elements[0].id).toBe('e2');
    });
  });

  describe('redo', () => {
    it('redoes after an undo', () => {
      rm.getOrCreateRoom('room1');
      rm.commitElement('room1', makePen('e1', 'u1'));
      rm.undo('room1', 'u1');
      const result = rm.redo('room1', 'u1');
      expect(result).not.toBeNull();
      expect(result!.addedIds).toContain('e1');
      expect(rm.getOrCreateRoom('room1').elements).toHaveLength(1);
    });

    it('returns null when there is nothing to redo', () => {
      rm.getOrCreateRoom('room1');
      const result = rm.redo('room1', 'u1');
      expect(result).toBeNull();
    });

    it('clears the redo stack when a new element is committed after undo', () => {
      rm.getOrCreateRoom('room1');
      rm.commitElement('room1', makePen('e1', 'u1'));
      rm.undo('room1', 'u1');
      rm.commitElement('room1', makePen('e2', 'u1'));
      const result = rm.redo('room1', 'u1');
      expect(result).toBeNull();
    });
  });

  describe('clearCanvas', () => {
    it('removes all elements', () => {
      rm.getOrCreateRoom('room1');
      rm.commitElement('room1', makePen('e1', 'u1'));
      rm.commitElement('room1', makeRect('e2', 'u2'));
      rm.clearCanvas('room1', 'u1');
      expect(rm.getOrCreateRoom('room1').elements).toHaveLength(0);
    });

    it('records a clear history entry', () => {
      rm.getOrCreateRoom('room1');
      rm.commitElement('room1', makePen('e1', 'u1'));
      rm.clearCanvas('room1', 'u1');
      const history = rm.getHistory('room1');
      const clearEntry = history.find((h: HistoryEntry) => h.kind === 'clear');
      expect(clearEntry).toBeDefined();
      expect(clearEntry!.removed).toHaveLength(1);
    });

    it('can undo a clear', () => {
      rm.getOrCreateRoom('room1');
      rm.commitElement('room1', makePen('e1', 'u1'));
      rm.clearCanvas('room1', 'u1');
      rm.undo('room1', 'u1');
      expect(rm.getOrCreateRoom('room1').elements).toHaveLength(1);
    });
  });

  describe('getRoomForSocket / setSocketRoom', () => {
    it('tracks which room a socket is in', () => {
      rm.setSocketRoom('socket1', 'room1');
      expect(rm.getRoomForSocket('socket1')).toBe('room1');
    });

    it('returns undefined for unknown sockets', () => {
      expect(rm.getRoomForSocket('unknown')).toBeUndefined();
    });

    it('removes socket association on cleanup', () => {
      rm.setSocketRoom('socket1', 'room1');
      rm.removeSocket('socket1');
      expect(rm.getRoomForSocket('socket1')).toBeUndefined();
    });
  });
});
