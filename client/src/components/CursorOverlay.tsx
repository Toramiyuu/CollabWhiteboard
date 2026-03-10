interface CursorEntry {
  x: number;
  y: number;
  color: string;
}

interface CursorOverlayProps {
  cursors: Map<string, CursorEntry>;
  myUserId: string;
}

export function CursorOverlay({ cursors, myUserId }: CursorOverlayProps) {
  return (
    <svg
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', overflow: 'visible', zIndex: 10,
      }}
    >
      {Array.from(cursors.entries())
        .filter(([userId]) => userId !== myUserId)
        .map(([userId, { x, y, color }]) => (
          <g key={userId} transform={`translate(${x},${y})`}>
            {/* Cursor dot */}
            <circle r={5} fill={color} opacity={0.85} />
            {/* Label */}
            <rect x={8} y={-10} width={userId.length * 7 + 8} height={16} rx={4} fill={color} opacity={0.85} />
            <text x={12} y={2} fontSize={10} fill="#fff" fontFamily="system-ui, sans-serif">
              {userId.slice(0, 8)}
            </text>
          </g>
        ))}
    </svg>
  );
}
