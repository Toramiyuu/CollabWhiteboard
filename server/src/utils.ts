import { nanoid } from 'nanoid';

export function generateRoomId(): string {
  return nanoid(10);
}

export function userColor(userId: string): string {
  // Deterministic HSL color from userId hash
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) & 0xffffffff;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 50%)`;
}
