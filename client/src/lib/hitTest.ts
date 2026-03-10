import type { DrawingElement, Point } from '@collabwhiteboard/shared';
import { distancePointToSegment } from './geometry.js';

export function hitTestElement(element: DrawingElement, point: Point, eraserRadius: number): boolean {
  switch (element.type) {
    case 'pen': {
      const threshold = eraserRadius + element.strokeWidth / 2;
      for (let i = 0; i < element.points.length - 1; i++) {
        const d = distancePointToSegment(point, element.points[i], element.points[i + 1]);
        if (d <= threshold) return true;
      }
      return false;
    }

    case 'rectangle': {
      const { x, y, width, height, strokeWidth } = element;
      const threshold = eraserRadius + strokeWidth / 2;
      // Test all four edges
      const edges: [Point, Point][] = [
        [{ x, y }, { x: x + width, y }],
        [{ x: x + width, y }, { x: x + width, y: y + height }],
        [{ x: x + width, y: y + height }, { x, y: y + height }],
        [{ x, y: y + height }, { x, y }],
      ];
      return edges.some(([a, b]) => distancePointToSegment(point, a, b) <= threshold);
    }

    case 'circle': {
      const { cx, cy, rx, ry, strokeWidth } = element;
      // Normalise to unit circle and check distance from perimeter
      const nx = (point.x - cx) / rx;
      const ny = (point.y - cy) / ry;
      const r = Math.hypot(nx, ny);
      // Distance from perimeter in original space (approximate)
      const avgR = (rx + ry) / 2;
      const distFromPerimeter = Math.abs(r - 1) * avgR;
      return distFromPerimeter <= eraserRadius + strokeWidth / 2;
    }

    case 'line': {
      const { x1, y1, x2, y2, strokeWidth } = element;
      const threshold = eraserRadius + strokeWidth / 2;
      return distancePointToSegment(point, { x: x1, y: y1 }, { x: x2, y: y2 }) <= threshold;
    }

    case 'text': {
      // Hit-test a bounding region around the text anchor
      const estimatedWidth = element.content.length * element.fontSize * 0.6;
      const estimatedHeight = element.fontSize * 1.2;
      return (
        point.x >= element.x - eraserRadius &&
        point.x <= element.x + estimatedWidth + eraserRadius &&
        point.y >= element.y - estimatedHeight - eraserRadius &&
        point.y <= element.y + eraserRadius
      );
    }

    case 'eraser':
      return false;
  }
}
