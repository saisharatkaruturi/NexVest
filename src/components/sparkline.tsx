type Props = { data: number[]; positive?: boolean; width?: number; height?: number };

export function Sparkline({ data, positive = true, width = 80, height = 28 }: Props) {
  if (!data?.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const points = data
    .map((v, i) => `${i * step},${height - ((v - min) / range) * height}`)
    .join(" ");
  const color = positive ? "var(--profit)" : "var(--loss)";
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`grad-${positive ? "u" : "d"}-${data[0]}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points={`0,${height} ${points} ${width},${height}`} fill={`url(#grad-${positive ? "u" : "d"}-${data[0]})`} />
    </svg>
  );
}
