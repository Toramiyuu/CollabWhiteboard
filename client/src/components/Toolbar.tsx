import type { DrawingTool } from '../hooks/useDrawingTools.js';
import { ColorPicker } from './ColorPicker.js';
import { StrokeWidthSlider } from './StrokeWidthSlider.js';

interface ToolbarProps {
  tool: DrawingTool;
  setTool: (t: DrawingTool) => void;
  color: string;
  setColor: (c: string) => void;
  strokeWidth: number;
  setStrokeWidth: (w: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  roomId: string;
}

const TOOLS: { id: DrawingTool; label: string; icon: string }[] = [
  { id: 'pen',       label: 'Pen',       icon: '✏️' },
  { id: 'rectangle', label: 'Rectangle', icon: '▭' },
  { id: 'circle',    label: 'Circle',    icon: '○' },
  { id: 'line',      label: 'Line',      icon: '╱' },
  { id: 'text',      label: 'Text',      icon: 'T' },
  { id: 'eraser',    label: 'Eraser',    icon: '⌫' },
];

export function Toolbar({
  tool, setTool, color, setColor, strokeWidth, setStrokeWidth,
  onUndo, onRedo, onClear, roomId,
}: ToolbarProps) {
  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
  };

  return (
    <div style={{
      position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)',
      background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.12)',
      padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10,
      zIndex: 100, userSelect: 'none',
    }}>
      {/* Tool buttons */}
      <div style={{ display: 'flex', gap: 4 }}>
        {TOOLS.map(t => (
          <button
            key={t.id}
            title={t.label}
            onClick={() => setTool(t.id)}
            style={{
              width: 34, height: 34, borderRadius: 8, border: 'none',
              background: tool === t.id ? '#6366f1' : '#f1f5f9',
              color: tool === t.id ? '#fff' : '#374151',
              fontSize: 15, cursor: 'pointer', fontWeight: 600,
            }}
          >
            {t.icon}
          </button>
        ))}
      </div>

      <div style={{ width: 1, height: 30, background: '#e5e7eb' }} />

      <ColorPicker color={color} onChange={setColor} />

      <div style={{ width: 1, height: 30, background: '#e5e7eb' }} />

      <StrokeWidthSlider value={strokeWidth} onChange={setStrokeWidth} />

      <div style={{ width: 1, height: 30, background: '#e5e7eb' }} />

      {/* History controls */}
      <button title="Undo (⌘Z)" onClick={onUndo} style={btnStyle}>↩</button>
      <button title="Redo (⌘⇧Z)" onClick={onRedo} style={btnStyle}>↪</button>
      <button title="Clear canvas" onClick={onClear} style={{ ...btnStyle, color: '#ef4444' }}>🗑</button>

      <div style={{ width: 1, height: 30, background: '#e5e7eb' }} />

      {/* Room ID copy */}
      <button
        title="Copy room link"
        onClick={copyLink}
        style={{ ...btnStyle, fontSize: 11, padding: '4px 8px', width: 'auto' }}
      >
        🔗 {roomId}
      </button>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 8, border: 'none',
  background: '#f1f5f9', cursor: 'pointer', fontSize: 16,
};
