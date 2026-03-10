import { useState } from 'react';

export type DrawingTool = 'pen' | 'rectangle' | 'circle' | 'line' | 'text' | 'eraser';

export function useDrawingTools() {
  const [tool, setTool] = useState<DrawingTool>('pen');
  const [color, setColor] = useState('#1a1a1a');
  const [strokeWidth, setStrokeWidth] = useState(4);

  return { tool, setTool, color, setColor, strokeWidth, setStrokeWidth };
}
