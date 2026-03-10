import { useRef, useCallback, useEffect } from 'react';
import { nanoid } from 'nanoid';
import type { DrawingElement, PartialPenElement, Point } from '@collabwhiteboard/shared';
import type { DrawingTool } from './useDrawingTools.js';
import { renderAll, renderElement } from '../lib/renderer.js';
import { hitTestElement } from '../lib/hitTest.js';
import { userColor } from '../lib/userColor.js';

interface UseCanvasOptions {
  tool: DrawingTool;
  color: string;
  strokeWidth: number;
  userId: string;
  elements: DrawingElement[];
  remotePreviews: Map<string, PartialPenElement>;
  onCommit: (element: DrawingElement) => void;
  onPreview: (element: PartialPenElement) => void;
  onErase: (ids: string[]) => void;
  onMoveCursor: (x: number, y: number) => void;
  onTextStart?: (x: number, y: number) => void;
}

export function useCanvas(options: UseCanvasOptions) {
  const committedRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);

  const isDrawing = useRef(false);
  const currentPoints = useRef<Point[]>([]);
  const shapeStart = useRef<Point | null>(null);
  const erasedIds = useRef<Set<string>>(new Set());
  const previewThrottle = useRef(0);
  const cursorThrottle = useRef(0);

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio ?? 1 : 1;

  // Resize both canvases to match their CSS size at device pixel ratio
  const resizeCanvas = useCallback((canvas: HTMLCanvasElement) => {
    const { offsetWidth, offsetHeight } = canvas;
    const w = Math.floor(offsetWidth * dpr);
    const h = Math.floor(offsetHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
    }
  }, [dpr]);

  // Re-render committed layer whenever elements change
  useEffect(() => {
    const canvas = committedRef.current;
    if (!canvas) return;
    resizeCanvas(canvas);
    const ctx = canvas.getContext('2d');
    if (ctx) renderAll(ctx, options.elements);
  }, [options.elements, resizeCanvas]);

  // Render preview layer: local in-progress stroke + remote previews
  const renderPreview = useCallback(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    // Remote pen previews
    for (const preview of options.remotePreviews.values()) {
      renderElement(ctx, { ...preview, type: 'pen' } as DrawingElement);
    }

    // Local in-progress stroke
    if (isDrawing.current && options.tool === 'pen' && currentPoints.current.length > 1) {
      const el: DrawingElement = {
        id: '__preview__',
        type: 'pen',
        userId: options.userId,
        color: options.color,
        strokeWidth: options.strokeWidth,
        points: currentPoints.current,
      };
      renderElement(ctx, el);
    }

    if (isDrawing.current && options.tool === 'eraser') {
      // Draw circular eraser cursor
      const last = currentPoints.current[currentPoints.current.length - 1];
      if (last) {
        ctx.save();
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(last.x, last.y, options.strokeWidth / 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
  }, [options.tool, options.color, options.strokeWidth, options.userId, options.remotePreviews, dpr]);

  useEffect(() => {
    renderPreview();
  }, [renderPreview]);

  const getCanvasPoint = (e: PointerEvent): Point => {
    const canvas = previewRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = useCallback((e: PointerEvent) => {
    if (e.button !== 0) return;
    if (options.tool === 'text') return;

    const pt = getCanvasPoint(e);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    isDrawing.current = true;
    currentPoints.current = [pt];
    shapeStart.current = pt;
    erasedIds.current = new Set();
  }, [options]);

  const onPointerMove = useCallback((e: PointerEvent) => {
    const pt = getCanvasPoint(e);

    // Throttled cursor broadcast
    const now = Date.now();
    if (now - cursorThrottle.current >= 32) {
      cursorThrottle.current = now;
      options.onMoveCursor(pt.x, pt.y);
    }

    if (!isDrawing.current) return;

    if (options.tool === 'pen') {
      currentPoints.current.push(pt);
      // Throttled pen preview broadcast
      if (now - previewThrottle.current >= 16) {
        previewThrottle.current = now;
        const preview: PartialPenElement = {
          id: '__preview__' + options.userId,
          type: 'pen',
          userId: options.userId,
          color: options.color,
          strokeWidth: options.strokeWidth,
          points: currentPoints.current,
        };
        options.onPreview(preview);
      }
    } else if (options.tool === 'eraser') {
      currentPoints.current.push(pt);
      // Hit-test elements and collect IDs to erase
      const newErased: string[] = [];
      for (const el of options.elements) {
        if (!erasedIds.current.has(el.id) && hitTestElement(el, pt, options.strokeWidth / 2)) {
          erasedIds.current.add(el.id);
          newErased.push(el.id);
        }
      }
      if (newErased.length > 0) {
        options.onErase(newErased);
      }
    }

    renderPreview();
  }, [options, renderPreview]);

  const onPointerUp = useCallback((e: PointerEvent) => {
    if (options.tool === 'text') {
      const pt = getCanvasPoint(e);
      options.onTextStart?.(pt.x, pt.y);
      return;
    }

    if (!isDrawing.current) return;
    isDrawing.current = false;
    const pt = getCanvasPoint(e);

    const previewCanvas = previewRef.current;
    if (previewCanvas) {
      const ctx = previewCanvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, previewCanvas.width / dpr, previewCanvas.height / dpr);
    }

    const start = shapeStart.current;
    if (!start) return;

    const id = nanoid();

    switch (options.tool) {
      case 'pen': {
        if (currentPoints.current.length < 2) break;
        const el: DrawingElement = {
          id,
          type: 'pen',
          userId: options.userId,
          color: options.color,
          strokeWidth: options.strokeWidth,
          points: currentPoints.current,
        };
        options.onCommit(el);
        break;
      }
      case 'rectangle': {
        const el: DrawingElement = {
          id,
          type: 'rectangle',
          userId: options.userId,
          color: options.color,
          strokeWidth: options.strokeWidth,
          x: Math.min(start.x, pt.x),
          y: Math.min(start.y, pt.y),
          width: Math.abs(pt.x - start.x),
          height: Math.abs(pt.y - start.y),
        };
        if (el.width > 2 && el.height > 2) options.onCommit(el);
        break;
      }
      case 'circle': {
        const el: DrawingElement = {
          id,
          type: 'circle',
          userId: options.userId,
          color: options.color,
          strokeWidth: options.strokeWidth,
          cx: (start.x + pt.x) / 2,
          cy: (start.y + pt.y) / 2,
          rx: Math.abs(pt.x - start.x) / 2,
          ry: Math.abs(pt.y - start.y) / 2,
        };
        if (el.rx > 2 && el.ry > 2) options.onCommit(el);
        break;
      }
      case 'line': {
        const el: DrawingElement = {
          id,
          type: 'line',
          userId: options.userId,
          color: options.color,
          strokeWidth: options.strokeWidth,
          x1: start.x, y1: start.y,
          x2: pt.x, y2: pt.y,
        };
        options.onCommit(el);
        break;
      }
      case 'eraser':
        // Erases dispatched incrementally in onPointerMove
        break;
    }

    currentPoints.current = [];
    shapeStart.current = null;
  }, [options, dpr]);

  // Resize observer
  useEffect(() => {
    const committed = committedRef.current;
    const preview = previewRef.current;
    if (!committed || !preview) return;

    const observer = new ResizeObserver(() => {
      resizeCanvas(committed);
      resizeCanvas(preview);
      const ctx = committed.getContext('2d');
      if (ctx) renderAll(ctx, options.elements);
    });
    observer.observe(committed);
    return () => observer.disconnect();
  }, [options.elements, resizeCanvas]);

  // Attach/detach pointer events to preview canvas
  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
    };
  }, [onPointerDown, onPointerMove, onPointerUp]);

  return { committedRef, previewRef };
}

export { userColor };
