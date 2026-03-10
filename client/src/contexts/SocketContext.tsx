import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  DrawingElement,
  PartialPenElement,
  RemoteUser,
  RoomState,
} from '@collabwhiteboard/shared';

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface SocketContextValue {
  socket: AppSocket | null;
  myUserId: string | null;
  connected: boolean;
  roomState: RoomState | null;
  joinRoom: (roomId: string) => void;
  commitElement: (element: DrawingElement) => void;
  previewElement: (element: PartialPenElement) => void;
  eraseElements: (ids: string[]) => void;
  undo: (callback: (success: boolean) => void) => void;
  redo: (callback: (success: boolean) => void) => void;
  clearCanvas: () => void;
  moveCursor: (x: number, y: number) => void;
  localElements: DrawingElement[];
  remoteElements: DrawingElement[];
  remotePreviews: Map<string, PartialPenElement>;
  remoteCursors: Map<string, { x: number; y: number; color: string }>;
  users: RemoteUser[];
}

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<AppSocket | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [remoteElements, setRemoteElements] = useState<DrawingElement[]>([]);
  const [localElements, setLocalElements] = useState<DrawingElement[]>([]);
  const [remotePreviews, setRemotePreviews] = useState<Map<string, PartialPenElement>>(new Map());
  const [remoteCursors, setRemoteCursors] = useState<Map<string, { x: number; y: number; color: string }>>(new Map());
  const [users, setUsers] = useState<RemoteUser[]>([]);

  useEffect(() => {
    const socket: AppSocket = io({ path: '/socket.io' });
    socketRef.current = socket;

    socket.on('connect', () => {
      setMyUserId(socket.id ?? null);
      setConnected(true);
      // Clear stale state — fresh room:join will repopulate
      setRemoteElements([]);
      setLocalElements([]);
      setUsers([]);
      setRemoteCursors(new Map());
      setRemotePreviews(new Map());
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('element:added', (element) => {
      setLocalElements(prev => prev.filter(e => e.id !== element.id));
      setRemoteElements(prev => {
        if (prev.find(e => e.id === element.id)) return prev;
        return [...prev, element];
      });
      // Clear stale pen preview now that the stroke is committed
      setRemotePreviews(prev => {
        if (!prev.has(element.userId)) return prev;
        const next = new Map(prev);
        next.delete(element.userId);
        return next;
      });
    });

    socket.on('element:preview', (element) => {
      setRemotePreviews(prev => new Map(prev).set(element.userId, element));
    });

    socket.on('element:removed', (ids) => {
      const idSet = new Set(ids);
      setRemoteElements(prev => prev.filter(e => !idSet.has(e.id)));
      setLocalElements(prev => prev.filter(e => !idSet.has(e.id)));
    });

    socket.on('history:undone', ({ removedIds, restoredIds }) => {
      const removedSet = new Set(removedIds);
      setRemoteElements(prev => prev.filter(e => !removedSet.has(e.id)));
      setLocalElements(prev => prev.filter(e => !removedSet.has(e.id)));
      if (restoredIds.length > 0) {
        // Server broadcasts restored elements — handled via room:state on reconnect
        // For real-time: server should also broadcast element:added for each restored element
        // We trigger a re-fetch by relying on the server's element:added emissions
      }
    });

    socket.on('history:redone', ({ addedIds, removedIds }) => {
      const removedSet = new Set(removedIds);
      setRemoteElements(prev => prev.filter(e => !removedSet.has(e.id)));
      setLocalElements(prev => prev.filter(e => !removedSet.has(e.id)));
      void addedIds; // elements come back via element:added
    });

    socket.on('canvas:cleared', () => {
      setRemoteElements([]);
      setLocalElements([]);
    });

    socket.on('cursor:moved', ({ userId, x, y }) => {
      setRemoteCursors(prev => {
        const next = new Map(prev);
        const existing = next.get(userId);
        next.set(userId, { x, y, color: existing?.color ?? 'hsl(0,70%,50%)' });
        return next;
      });
    });

    socket.on('user:joined', (user) => {
      setUsers(prev => {
        if (prev.find(u => u.userId === user.userId)) return prev;
        return [...prev, user];
      });
      setRemoteCursors(prev => {
        const next = new Map(prev);
        if (!next.has(user.userId)) {
          next.set(user.userId, { x: -100, y: -100, color: user.color });
        }
        return next;
      });
    });

    socket.on('user:left', (userId) => {
      setUsers(prev => prev.filter(u => u.userId !== userId));
      setRemoteCursors(prev => { const next = new Map(prev); next.delete(userId); return next; });
      setRemotePreviews(prev => { const next = new Map(prev); next.delete(userId); return next; });
    });

    return () => { socket.disconnect(); };
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    socketRef.current?.emit('room:join', roomId, (state: RoomState) => {
      setRoomState(state);
      setRemoteElements(state.elements);
      setUsers(state.users);
    });
  }, []);

  const commitElement = useCallback((element: DrawingElement) => {
    // Optimistic: add to local immediately
    setLocalElements(prev => [...prev, element]);
    socketRef.current?.emit('element:commit', element);
  }, []);

  const previewElement = useCallback((element: PartialPenElement) => {
    socketRef.current?.emit('element:preview', element);
  }, []);

  const eraseElements = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    setRemoteElements(prev => prev.filter(e => !idSet.has(e.id)));
    setLocalElements(prev => prev.filter(e => !idSet.has(e.id)));
    socketRef.current?.emit('element:erase', ids);
  }, []);

  const undo = useCallback((callback: (success: boolean) => void) => {
    socketRef.current?.emit('history:undo', (result) => {
      if (!result) { callback(false); return; }
      const removedSet = new Set(result.removedIds);
      setRemoteElements(prev => prev.filter(e => !removedSet.has(e.id)));
      setLocalElements(prev => prev.filter(e => !removedSet.has(e.id)));
      callback(true);
    });
  }, []);

  const redo = useCallback((callback: (success: boolean) => void) => {
    socketRef.current?.emit('history:redo', (result) => {
      if (!result) { callback(false); return; }
      const removedSet = new Set(result.removedIds);
      setRemoteElements(prev => prev.filter(e => !removedSet.has(e.id)));
      setLocalElements(prev => prev.filter(e => !removedSet.has(e.id)));
      callback(true);
    });
  }, []);

  const clearCanvas = useCallback(() => {
    setRemoteElements([]);
    setLocalElements([]);
    socketRef.current?.emit('canvas:clear');
  }, []);

  const moveCursor = useCallback((x: number, y: number) => {
    socketRef.current?.emit('cursor:move', { x, y });
  }, []);

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      myUserId,
      connected,
      roomState,
      joinRoom,
      commitElement,
      previewElement,
      eraseElements,
      undo,
      redo,
      clearCanvas,
      moveCursor,
      localElements,
      remoteElements,
      remotePreviews,
      remoteCursors,
      users,
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext(): SocketContextValue {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocketContext must be used within SocketProvider');
  return ctx;
}
