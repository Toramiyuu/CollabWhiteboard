interface StrokeWidthSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function StrokeWidthSlider({ value, onChange }: StrokeWidthSliderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <input
        type="range"
        min={1}
        max={32}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: 80 }}
        title="Stroke width"
      />
      <span style={{ fontSize: 11, minWidth: 18, color: '#666' }}>{value}</span>
    </div>
  );
}
