import type { RemoteUser } from '@collabwhiteboard/shared';

interface RoomInfoProps {
  roomId: string;
  users: RemoteUser[];
  myUserId: string;
}

export function RoomInfo({ roomId, users, myUserId }: RoomInfoProps) {
  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
  };

  return (
    <div style={{
      position: 'fixed', bottom: 16, right: 16,
      background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.12)',
      padding: '10px 14px', zIndex: 100, minWidth: 160,
    }}>
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>
        Room: <strong>{roomId}</strong>
        <button
          onClick={copyLink}
          style={{ marginLeft: 6, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13 }}
          title="Copy room link"
        >
          🔗
        </button>
      </div>
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>
        {users.length} user{users.length !== 1 ? 's' : ''} online
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {users.map(u => (
          <div key={u.userId} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width: 10, height: 10, borderRadius: '50%',
              background: u.color, display: 'inline-block', flexShrink: 0,
            }} />
            <span style={{ fontSize: 11, color: '#374151' }}>
              {u.userId.slice(0, 8)}{u.userId === myUserId ? ' (you)' : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
