import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function LandingPage() {
  const [joinId, setJoinId] = useState('');
  const navigate = useNavigate();

  const createRoom = async () => {
    const serverUrl = import.meta.env.VITE_SERVER_URL ?? '';
    const res = await fetch(`${serverUrl}/api/rooms`, { method: 'POST' });
    const { roomId } = await res.json() as { roomId: string };
    navigate(`/room/${roomId}`);
  };

  const joinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const id = joinId.trim();
    if (id) navigate(`/room/${id}`);
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', gap: 24,
      background: 'linear-gradient(135deg, #f0f4ff 0%, #faf0ff 100%)',
    }}>
      <h1 style={{ fontSize: 36, fontWeight: 800, color: '#1e1b4b', margin: 0 }}>
        CollabWhiteboard
      </h1>
      <p style={{ color: '#6b7280', margin: 0 }}>
        Real-time collaborative drawing — no account needed
      </p>

      <button
        onClick={createRoom}
        style={{
          padding: '12px 32px', borderRadius: 10, border: 'none',
          background: '#6366f1', color: '#fff', fontSize: 16,
          fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
        }}
      >
        Create new room
      </button>

      <form onSubmit={joinRoom} style={{ display: 'flex', gap: 8 }}>
        <input
          value={joinId}
          onChange={e => setJoinId(e.target.value)}
          placeholder="Enter room ID…"
          style={{
            padding: '10px 14px', borderRadius: 8, border: '1.5px solid #d1d5db',
            fontSize: 14, outline: 'none', width: 220,
          }}
        />
        <button
          type="submit"
          style={{
            padding: '10px 20px', borderRadius: 8, border: 'none',
            background: '#f1f5f9', color: '#374151', fontSize: 14,
            fontWeight: 600, cursor: 'pointer',
          }}
        >
          Join
        </button>
      </form>
    </div>
  );
}
