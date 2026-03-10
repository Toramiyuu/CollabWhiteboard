import { useState, useEffect, useRef, useCallback } from 'react';
import { nanoid } from 'nanoid';
import type { DrawingElement } from '@collabwhiteboard/shared';
import { useCanvas } from '../hooks/useCanvas.js';
import { CursorOverlay } from './CursorOverlay.js';
import type { DrawingTool } from '../hooks/useDrawingTools.js';

interface WhiteboardCanvasProps {
  tool: DrawingTool;
  color: string;
  strokeWidth: number;
  userId: string;
  elements: DrawingElement[];
  remotePreviews: Map<string, import('@collabwhiteboard/shared').PartialPenElement>;
  remoteCursors: Map<string, { x: number; y: number; color: string }>;
  onCommit: (element: DrawingElement) => void;
  onPreview: (element: import('@collabwhiteboard/shared').PartialPenElement) => void;
  onErase: (ids: string[]) => void;
  onMoveCursor: (x: number, y: number) => void;
}

interface TextOverlay {
  x: number;
  y: number;
  id: string;
}

export function WhiteboardCanvas({
  tool, color, strokeWidth, userId, elements,
  remotePreviews, remoteCursors, onCommit, onPreview, onErase, onMoveCursor,
}: WhiteboardCanvasProps) {
  const [textOverlay, setTextOverlay] = useState<TextOverlay | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextStart = useCallback((x: number, y: number) => {
    setTextOverlay({ x, y, id: nanoid() });
  }, []);

  const commitText = useCallback((content: string) => {
    if (!textOverlay || !content.trim()) {
      setTextOverlay(null);
      return;
    }
    const el: DrawingElement = {
      id: textOverlay.id,
      type: 'text',
      userId,
      color,
      fontSize: strokeWidth < 8 ? 16 : strokeWidth * 2,
      x: textOverlay.x,
      y: textOverlay.y,
      content: content.trim(),
    };
    onCommit(el);
    setTextOverlay(null);
  }, [textOverlay, userId, color, strokeWidth, onCommit]);

  const handleTextKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      commitText(e.currentTarget.value);
    }
    if (e.key === 'Escape') {
      setTextOverlay(null);
    }
  }, [commitText]);

  const handleTextBlur = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
    commitText(e.currentTarget.value);
  }, [commitText]);

  useEffect(() => {
    if (textOverlay) {
      textareaRef.current?.focus();
    }
  }, [textOverlay]);

  const { committedRef, previewRef } = useCanvas({
    tool,
    color,
    strokeWidth,
    userId,
    elements,
    remotePreviews,
    onCommit,
    onPreview,
    onErase,
    onMoveCursor,
    onTextStart: handleTextStart,
  });

  const cursor = tool === 'eraser' ? 'none'
    : tool === 'text' ? 'text'
    : 'crosshair';

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Committed layer */}
      <canvas
        ref={committedRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />
      {/* Preview layer (receives pointer events) */}
      <canvas
        ref={previewRef}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          cursor,
          touchAction: 'none',
        }}
      />
      {/* Remote cursor SVG overlay */}
      <CursorOverlay cursors={remoteCursors} myUserId={userId} />
      {/* Text input overlay */}
      {textOverlay && (
        <textarea
          ref={textareaRef}
          onKeyDown={handleTextKeyDown}
          onBlur={handleTextBlur}
          style={{
            position: 'absolute',
            left: textOverlay.x,
            top: textOverlay.y - 20,
            minWidth: 120,
            minHeight: 32,
            background: 'rgba(255,255,255,0.9)',
            border: '1px dashed #6366f1',
            borderRadius: 4,
            padding: '2px 6px',
            fontSize: strokeWidth < 8 ? 16 : strokeWidth * 2,
            color,
            fontFamily: 'system-ui, sans-serif',
            resize: 'both',
            zIndex: 20,
            outline: 'none',
          }}
          placeholder="Type here, Enter to commit…"
        />
      )}
    </div>
  );
}
