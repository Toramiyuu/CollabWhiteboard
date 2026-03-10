export interface Point {
  x: number;
  y: number;
}

export type DrawingElement =
  | PenElement
  | RectangleElement
  | CircleElement
  | LineElement
  | TextElement
  | EraserElement;

export interface PenElement {
  id: string;
  type: 'pen';
  userId: string;
  color: string;
  strokeWidth: number;
  points: Point[];
}

export interface RectangleElement {
  id: string;
  type: 'rectangle';
  userId: string;
  color: string;
  strokeWidth: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CircleElement {
  id: string;
  type: 'circle';
  userId: string;
  color: string;
  strokeWidth: number;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

export interface LineElement {
  id: string;
  type: 'line';
  userId: string;
  color: string;
  strokeWidth: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface TextElement {
  id: string;
  type: 'text';
  userId: string;
  color: string;
  fontSize: number;
  x: number;
  y: number;
  content: string;
}

export interface EraserElement {
  id: string;
  type: 'eraser';
  userId: string;
  strokeWidth: number;
  points: Point[];
}

export type PartialPenElement = Omit<PenElement, 'id'> & { id: string };

export interface RemoteUser {
  userId: string;
  color: string;
}

export interface RoomState {
  roomId: string;
  elements: DrawingElement[];
  users: RemoteUser[];
}

export interface HistoryEntry {
  userId: string;
  kind: 'add' | 'erase' | 'clear';
  added: DrawingElement[];
  removed: DrawingElement[];
}

// Socket.io event interfaces
export interface ServerToClientEvents {
  'room:state': (state: RoomState) => void;
  'element:added': (element: DrawingElement) => void;
  'element:preview': (element: PartialPenElement) => void;
  'element:removed': (ids: string[]) => void;
  'history:undone': (data: { removedIds: string[]; restoredIds: string[] }) => void;
  'history:redone': (data: { addedIds: string[]; removedIds: string[] }) => void;
  'canvas:cleared': () => void;
  'cursor:moved': (data: { userId: string; x: number; y: number }) => void;
  'user:joined': (user: RemoteUser) => void;
  'user:left': (userId: string) => void;
}

export interface ClientToServerEvents {
  'room:join': (roomId: string, callback: (state: RoomState) => void) => void;
  'element:preview': (element: PartialPenElement) => void;
  'element:commit': (element: DrawingElement) => void;
  'element:erase': (ids: string[]) => void;
  'history:undo': (callback: (result: { removedIds: string[]; restoredIds: string[] } | false) => void) => void;
  'history:redo': (callback: (result: { addedIds: string[]; removedIds: string[] } | false) => void) => void;
  'canvas:clear': () => void;
  'cursor:move': (data: { x: number; y: number }) => void;
}
