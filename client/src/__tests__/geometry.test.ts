import { describe, it, expect } from 'vitest';
import {
  distancePointToSegment,
  boundingBox,
  expandBoundingBox,
  pointsToSvgPath,
} from '../lib/geometry.js';

describe('distancePointToSegment', () => {
  it('returns 0 when point is on the segment', () => {
    expect(distancePointToSegment({ x: 5, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBeCloseTo(0);
  });

  it('returns perpendicular distance for a point off a horizontal segment', () => {
    expect(distancePointToSegment({ x: 5, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBeCloseTo(3);
  });

  it('returns distance to nearest endpoint when projection is outside segment', () => {
    expect(distancePointToSegment({ x: 15, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBeCloseTo(5);
  });

  it('handles degenerate segment (same start and end)', () => {
    expect(distancePointToSegment({ x: 3, y: 4 }, { x: 0, y: 0 }, { x: 0, y: 0 })).toBeCloseTo(5);
  });
});

describe('boundingBox', () => {
  it('returns correct box for a set of points', () => {
    const box = boundingBox([
      { x: 1, y: 2 },
      { x: 5, y: 8 },
      { x: 3, y: 0 },
    ]);
    expect(box).toEqual({ minX: 1, minY: 0, maxX: 5, maxY: 8 });
  });

  it('handles a single point', () => {
    const box = boundingBox([{ x: 4, y: 7 }]);
    expect(box).toEqual({ minX: 4, minY: 7, maxX: 4, maxY: 7 });
  });
});

describe('expandBoundingBox', () => {
  it('expands the box by the given amount on all sides', () => {
    const box = { minX: 2, minY: 2, maxX: 8, maxY: 8 };
    const expanded = expandBoundingBox(box, 2);
    expect(expanded).toEqual({ minX: 0, minY: 0, maxX: 10, maxY: 10 });
  });
});

describe('pointsToSvgPath', () => {
  it('returns empty string for empty points', () => {
    expect(pointsToSvgPath([])).toBe('');
  });

  it('returns M only for single point', () => {
    expect(pointsToSvgPath([{ x: 1, y: 2 }])).toBe('M 1 2');
  });

  it('produces M then L commands for multiple points', () => {
    const path = pointsToSvgPath([{ x: 0, y: 0 }, { x: 5, y: 5 }]);
    expect(path).toBe('M 0 0 L 5 5');
  });
});
