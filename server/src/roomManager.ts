import type { DrawingElement, HistoryEntry, RemoteUser, RoomState } from '@collabwhiteboard/shared';

interface RoomData {
  roomId: string;
  elements: DrawingElement[];
  users: RemoteUser[];
  history: HistoryEntry[];
  redoStacks: Map<string, HistoryEntry[]>;
}

export class RoomManager {
  private rooms = new Map<string, RoomData>();
  private socketToRoom = new Map<string, string>();

  getOrCreateRoom(roomId: string): RoomState {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        roomId,
        elements: [],
        users: [],
        history: [],
        redoStacks: new Map(),
      });
    }
    const room = this.rooms.get(roomId)!;
    return { roomId: room.roomId, elements: room.elements, users: room.users };
  }

  private getRoom(roomId: string): RoomData | undefined {
    return this.rooms.get(roomId);
  }

  getHistory(roomId: string): HistoryEntry[] {
    return this.rooms.get(roomId)?.history ?? [];
  }

  addUser(roomId: string, user: RemoteUser): void {
    const room = this.getRoom(roomId);
    if (!room) return;
    if (!room.users.find(u => u.userId === user.userId)) {
      room.users.push(user);
    }
  }

  removeUser(roomId: string, userId: string): void {
    const room = this.getRoom(roomId);
    if (!room) return;
    room.users = room.users.filter(u => u.userId !== userId);
  }

  commitElement(roomId: string, element: DrawingElement): void {
    const room = this.getRoom(roomId);
    if (!room) return;
    room.elements.push(element);
    room.history.push({
      userId: element.userId,
      kind: 'add',
      added: [element],
      removed: [],
    });
    // Clear redo stack for this user on new commit
    room.redoStacks.delete(element.userId);
  }

  eraseElements(roomId: string, ids: string[], userId: string): DrawingElement[] {
    const room = this.getRoom(roomId);
    if (!room) return [];
    const idSet = new Set(ids);
    const removed = room.elements.filter(e => idSet.has(e.id));
    if (removed.length === 0) return [];
    room.elements = room.elements.filter(e => !idSet.has(e.id));
    room.history.push({
      userId,
      kind: 'erase',
      added: [],
      removed,
    });
    room.redoStacks.delete(userId);
    return removed;
  }

  undo(roomId: string, userId: string): { removedIds: string[]; restoredIds: string[]; restoredElements: DrawingElement[] } | null {
    const room = this.getRoom(roomId);
    if (!room) return null;

    // Find the last history entry for this user
    let idx = -1;
    for (let i = room.history.length - 1; i >= 0; i--) {
      if (room.history[i].userId === userId) {
        idx = i;
        break;
      }
    }
    if (idx === -1) return null;

    const entry = room.history.splice(idx, 1)[0];
    const removedIds: string[] = [];
    const restoredIds: string[] = [];
    const restoredElements: DrawingElement[] = [];

    if (entry.kind === 'add') {
      // Reverse: remove the added elements
      const addedIds = new Set(entry.added.map(e => e.id));
      room.elements = room.elements.filter(e => !addedIds.has(e.id));
      removedIds.push(...entry.added.map(e => e.id));
    } else if (entry.kind === 'erase') {
      // Reverse: restore the removed elements
      room.elements.push(...entry.removed);
      restoredIds.push(...entry.removed.map(e => e.id));
      restoredElements.push(...entry.removed);
    } else if (entry.kind === 'clear') {
      // Reverse: restore all removed elements
      room.elements.push(...entry.removed);
      restoredIds.push(...entry.removed.map(e => e.id));
      restoredElements.push(...entry.removed);
    }

    // Push to redo stack
    const redoStack = room.redoStacks.get(userId) ?? [];
    redoStack.push(entry);
    room.redoStacks.set(userId, redoStack);

    return { removedIds, restoredIds, restoredElements };
  }

  redo(roomId: string, userId: string): { addedIds: string[]; removedIds: string[]; addedElements: DrawingElement[] } | null {
    const room = this.getRoom(roomId);
    if (!room) return null;

    const redoStack = room.redoStacks.get(userId);
    if (!redoStack || redoStack.length === 0) return null;

    const entry = redoStack.pop()!;
    const addedIds: string[] = [];
    const removedIds: string[] = [];
    const addedElements: DrawingElement[] = [];

    if (entry.kind === 'add') {
      room.elements.push(...entry.added);
      addedIds.push(...entry.added.map(e => e.id));
      addedElements.push(...entry.added);
    } else if (entry.kind === 'erase') {
      const idSet = new Set(entry.removed.map(e => e.id));
      room.elements = room.elements.filter(e => !idSet.has(e.id));
      removedIds.push(...entry.removed.map(e => e.id));
    } else if (entry.kind === 'clear') {
      const idSet = new Set(entry.removed.map(e => e.id));
      room.elements = room.elements.filter(e => !idSet.has(e.id));
      removedIds.push(...entry.removed.map(e => e.id));
    }

    // Re-add to history
    room.history.push(entry);

    return { addedIds, removedIds, addedElements };
  }

  clearCanvas(roomId: string, userId: string): string[] {
    const room = this.getRoom(roomId);
    if (!room) return [];
    const removed = [...room.elements];
    room.elements = [];
    room.history.push({
      userId,
      kind: 'clear',
      added: [],
      removed,
    });
    room.redoStacks.delete(userId);
    return removed.map(e => e.id);
  }

  setSocketRoom(socketId: string, roomId: string): void {
    this.socketToRoom.set(socketId, roomId);
  }

  getRoomForSocket(socketId: string): string | undefined {
    return this.socketToRoom.get(socketId);
  }

  removeSocket(socketId: string): void {
    this.socketToRoom.delete(socketId);
  }
}
