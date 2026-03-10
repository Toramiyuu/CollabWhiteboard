import { describe, it, expect } from 'vitest';
import { hitTestElement } from '../lib/hitTest.js';
import type { DrawingElement } from '@collabwhiteboard/shared';

const BASE = { userId: 'u1', color: '#000', strokeWidth: 4 };

describe('hitTestElement', () => {
  describe('pen element', () => {
    const pen: DrawingElement = {
      ...BASE,
      id: 'e1',
      type: 'pen',
      points: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
    };

    it('returns true when eraser overlaps the stroke', () => {
      expect(hitTestElement(pen, { x: 50, y: 2 }, 8)).toBe(true);
    });

    it('returns false when eraser is far from the stroke', () => {
      expect(hitTestElement(pen, { x: 50, y: 50 }, 8)).toBe(false);
    });
  });

  describe('rectangle element', () => {
    const rect: DrawingElement = {
      ...BASE,
      id: 'e2',
      type: 'rectangle',
      x: 10, y: 10, width: 80, height: 60,
    };

    it('returns true when eraser overlaps a rectangle edge', () => {
      expect(hitTestElement(rect, { x: 10, y: 40 }, 8)).toBe(true);
    });

    it('returns false when eraser is outside', () => {
      expect(hitTestElement(rect, { x: 200, y: 200 }, 8)).toBe(false);
    });

    it('returns false when eraser is inside (hollow)', () => {
      expect(hitTestElement(rect, { x: 50, y: 40 }, 4)).toBe(false);
    });
  });

  describe('circle element', () => {
    const circle: DrawingElement = {
      ...BASE,
      id: 'e3',
      type: 'circle',
      cx: 50, cy: 50, rx: 30, ry: 20,
    };

    it('returns true when eraser overlaps the circle perimeter', () => {
      // Point near the rightmost edge (cx+rx = 80, cy=50)
      expect(hitTestElement(circle, { x: 80, y: 50 }, 8)).toBe(true);
    });

    it('returns false when eraser is far outside', () => {
      expect(hitTestElement(circle, { x: 200, y: 200 }, 8)).toBe(false);
    });
  });

  describe('line element', () => {
    const line: DrawingElement = {
      ...BASE,
      id: 'e4',
      type: 'line',
      x1: 0, y1: 0, x2: 100, y2: 0,
    };

    it('returns true when eraser overlaps the line', () => {
      expect(hitTestElement(line, { x: 50, y: 2 }, 8)).toBe(true);
    });

    it('returns false when eraser is far from the line', () => {
      expect(hitTestElement(line, { x: 50, y: 50 }, 8)).toBe(false);
    });
  });

  describe('text element', () => {
    const text: DrawingElement = {
      id: 'e5',
      type: 'text',
      userId: 'u1',
      color: '#000',
      fontSize: 16,
      x: 10, y: 10,
      content: 'hello',
    };

    it('returns true when eraser is near the text anchor', () => {
      expect(hitTestElement(text, { x: 12, y: 12 }, 10)).toBe(true);
    });

    it('returns false when eraser is far from text', () => {
      expect(hitTestElement(text, { x: 200, y: 200 }, 8)).toBe(false);
    });
  });

  describe('eraser element', () => {
    const eraser: DrawingElement = {
      id: 'e6',
      type: 'eraser',
      userId: 'u1',
      strokeWidth: 10,
      points: [{ x: 0, y: 0 }, { x: 50, y: 0 }],
    };

    it('always returns false (erasers are not hit-testable)', () => {
      expect(hitTestElement(eraser, { x: 25, y: 0 }, 8)).toBe(false);
    });
  });
});
