import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDrawingTools } from '../hooks/useDrawingTools.js';

describe('useDrawingTools', () => {
  it('has pen as default tool', () => {
    const { result } = renderHook(() => useDrawingTools());
    expect(result.current.tool).toBe('pen');
  });

  it('changes tool', () => {
    const { result } = renderHook(() => useDrawingTools());
    act(() => result.current.setTool('rectangle'));
    expect(result.current.tool).toBe('rectangle');
  });

  it('has a default color', () => {
    const { result } = renderHook(() => useDrawingTools());
    expect(result.current.color).toBeTruthy();
  });

  it('changes color', () => {
    const { result } = renderHook(() => useDrawingTools());
    act(() => result.current.setColor('#ff0000'));
    expect(result.current.color).toBe('#ff0000');
  });

  it('has a default strokeWidth', () => {
    const { result } = renderHook(() => useDrawingTools());
    expect(result.current.strokeWidth).toBeGreaterThan(0);
  });

  it('changes strokeWidth', () => {
    const { result } = renderHook(() => useDrawingTools());
    act(() => result.current.setStrokeWidth(8));
    expect(result.current.strokeWidth).toBe(8);
  });
});
