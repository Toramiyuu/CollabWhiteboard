import { useSocketContext } from '../contexts/SocketContext.js';

export function useCursors() {
  const { remoteCursors, moveCursor } = useSocketContext();
  return { remoteCursors, moveCursor };
}
