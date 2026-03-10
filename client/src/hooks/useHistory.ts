import { useSocketContext } from '../contexts/SocketContext.js';

export function useHistory() {
  const { undo, redo } = useSocketContext();
  return { undo, redo };
}
