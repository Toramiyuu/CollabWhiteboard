interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

const PRESETS = [
  '#1a1a1a', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899',
  '#ffffff',
];

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 120 }}>
      {PRESETS.map(c => (
        <button
          key={c}
          title={c}
          onClick={() => onChange(c)}
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: c,
            border: color === c ? '2px solid #6366f1' : '2px solid transparent',
            outline: color === c ? '1px solid #fff' : 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        />
      ))}
      <input
        type="color"
        value={color}
        onChange={e => onChange(e.target.value)}
        title="Custom color"
        style={{ width: 22, height: 22, padding: 0, border: 'none', cursor: 'pointer', borderRadius: '50%' }}
      />
    </div>
  );
}
