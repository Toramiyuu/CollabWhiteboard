import { describe, it, expect } from 'vitest';
import { userColor } from '../lib/userColor.js';

describe('userColor', () => {
  it('returns a valid hsl string', () => {
    const color = userColor('user123');
    expect(color).toMatch(/^hsl\(\d+,\s*\d+%,\s*\d+%\)$/);
  });

  it('is deterministic — same userId always returns same color', () => {
    expect(userColor('alice')).toBe(userColor('alice'));
  });

  it('returns different colors for different userIds', () => {
    expect(userColor('alice')).not.toBe(userColor('bob'));
  });

  it('handles empty string without throwing', () => {
    expect(() => userColor('')).not.toThrow();
  });
});
