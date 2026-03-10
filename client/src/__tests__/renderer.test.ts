import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderElement, renderAll } from '../lib/renderer.js';
import type { DrawingElement } from '@collabwhiteboard/shared';

function makeCtx() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    fillText: vi.fn(),
    strokeRect: vi.fn(),
    ellipse: vi.fn(),
    arc: vi.fn(),
    closePath: vi.fn(),
    setLineDash: vi.fn(),
    clearRect: vi.fn(),
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 0,
    lineCap: 'butt' as CanvasLineCap,
    lineJoin: 'miter' as CanvasLineJoin,
    font: '',
    globalCompositeOperation: 'source-over' as GlobalCompositeOperation,
    canvas: { width: 800, height: 600 },
  };
}

const BASE = { userId: 'u1', color: '#000', strokeWidth: 2 };

describe('renderElement', () => {
  let ctx: ReturnType<typeof makeCtx>;

  beforeEach(() => { ctx = makeCtx(); });

  it('renders a pen element (calls stroke)', () => {
    const el: DrawingElement = {
      ...BASE, id: 'e1', type: 'pen',
      points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
    };
    renderElement(ctx as unknown as CanvasRenderingContext2D, el);
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it('renders a rectangle element', () => {
    const el: DrawingElement = {
      ...BASE, id: 'e2', type: 'rectangle',
      x: 0, y: 0, width: 100, height: 50,
    };
    renderElement(ctx as unknown as CanvasRenderingContext2D, el);
    expect(ctx.strokeRect).toHaveBeenCalled();
  });

  it('renders a circle element (calls ellipse + stroke)', () => {
    const el: DrawingElement = {
      ...BASE, id: 'e3', type: 'circle',
      cx: 50, cy: 50, rx: 30, ry: 20,
    };
    renderElement(ctx as unknown as CanvasRenderingContext2D, el);
    expect(ctx.ellipse).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it('renders a line element', () => {
    const el: DrawingElement = {
      ...BASE, id: 'e4', type: 'line',
      x1: 0, y1: 0, x2: 100, y2: 100,
    };
    renderElement(ctx as unknown as CanvasRenderingContext2D, el);
    expect(ctx.stroke).toHaveBeenCalled();
    expect(ctx.moveTo).toHaveBeenCalledWith(0, 0);
    expect(ctx.lineTo).toHaveBeenCalledWith(100, 100);
  });

  it('renders a text element', () => {
    const el: DrawingElement = {
      id: 'e5', type: 'text', userId: 'u1',
      color: '#000', fontSize: 16, x: 10, y: 20, content: 'hello',
    };
    renderElement(ctx as unknown as CanvasRenderingContext2D, el);
    expect(ctx.fillText).toHaveBeenCalledWith('hello', 10, 20);
  });

  it('skips eraser elements (no visible rendering)', () => {
    const el: DrawingElement = {
      id: 'e6', type: 'eraser', userId: 'u1',
      strokeWidth: 10, points: [{ x: 0, y: 0 }],
    };
    renderElement(ctx as unknown as CanvasRenderingContext2D, el);
    expect(ctx.stroke).not.toHaveBeenCalled();
    expect(ctx.fill).not.toHaveBeenCalled();
  });
});

describe('renderAll', () => {
  it('calls renderElement for each element and clears first', () => {
    const ctx = makeCtx();
    const elements: DrawingElement[] = [
      { ...BASE, id: 'e1', type: 'pen', points: [{ x: 0, y: 0 }, { x: 5, y: 5 }] },
      { ...BASE, id: 'e2', type: 'pen', points: [{ x: 1, y: 1 }, { x: 6, y: 6 }] },
    ];
    renderAll(ctx as unknown as CanvasRenderingContext2D, elements);
    expect(ctx.clearRect).toHaveBeenCalledOnce();
    expect(ctx.stroke).toHaveBeenCalledTimes(2);
  });
});
