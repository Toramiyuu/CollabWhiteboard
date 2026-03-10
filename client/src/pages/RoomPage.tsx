import { useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useSocketContext } from '../contexts/SocketContext.js';
import { useDrawingTools } from '../hooks/useDrawingTools.js';
import { Toolbar } from '../components/Toolbar.js';
import { WhiteboardCanvas } from '../components/WhiteboardCanvas.js';
import { RoomInfo } from '../components/RoomInfo.js';

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const {
    socket, myUserId, connected, joinRoom, commitElement, previewElement, eraseElements,
    undo, redo, clearCanvas, moveCursor,
    localElements, remoteElements, remotePreviews, remoteCursors, users,
  } = useSocketContext();

  const { tool, setTool, color, setColor, strokeWidth, setStrokeWidth } = useDrawingTools();

  const joined = useRef(false);

  useEffect(() => {
    if (!connected) {
      joined.current = false; // allow rejoin on reconnect
      return;
    }
    if (!roomId || joined.current) return;
    joined.current = true;
    joinRoom(roomId);
  }, [connected, roomId, joinRoom]);

  // Keyboard shortcuts: Cmd+Z / Cmd+Shift+Z
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo(() => {});
        } else {
          undo(() => {});
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  const allElements = [...remoteElements, ...localElements];

  const userId = myUserId ?? 'local';
  void socket; // kept for potential future use

  const handleUndo = useCallback(() => undo(() => {}), [undo]);
  const handleRedo = useCallback(() => redo(() => {}), [redo]);

  if (!roomId) return <div>Invalid room</div>;

  return (
    <div style={{ width: '100%', height: '100%', background: '#f8f9fa', position: 'relative' }}>
      <Toolbar
        tool={tool} setTool={setTool}
        color={color} setColor={setColor}
        strokeWidth={strokeWidth} setStrokeWidth={setStrokeWidth}
        onUndo={handleUndo} onRedo={handleRedo}
        onClear={clearCanvas}
        roomId={roomId}
      />
      <WhiteboardCanvas
        tool={tool} color={color} strokeWidth={strokeWidth}
        userId={userId}
        elements={allElements}
        remotePreviews={remotePreviews}
        remoteCursors={remoteCursors}
        onCommit={commitElement}
        onPreview={previewElement}
        onErase={eraseElements}
        onMoveCursor={moveCursor}
      />
      <RoomInfo roomId={roomId} users={users} myUserId={userId} />
    </div>
  );
}
