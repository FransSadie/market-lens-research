export function Sparkline({ values = [], positive = true, className = "" }) {
  const numericValues = values.map((value) => Number(value)).filter((value) => !Number.isNaN(value));

  if (numericValues.length < 2) {
    return <div className={`h-10 w-24 rounded-xl border border-line/70 bg-panel/55 ${className}`} />;
  }

  const width = 96;
  const height = 32;
  const padding = 3;
  const min = Math.min(...numericValues);
  const max = Math.max(...numericValues);
  const range = max - min || 1;
  const step = (width - padding * 2) / Math.max(numericValues.length - 1, 1);
  const points = numericValues
    .map((value, index) => {
      const x = padding + index * step;
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const lineColor = positive ? "#37d8a8" : "#ff7b95";
  const fillColor = positive ? "rgba(55,216,168,0.16)" : "rgba(255,123,149,0.16)";
  const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className || "h-10 w-24"} aria-hidden="true">
      <rect x="0.5" y="0.5" width={width - 1} height={height - 1} rx="10" fill="rgba(7,12,22,0.88)" stroke="rgba(57,82,126,0.65)" />
      <polyline points={areaPoints} fill={fillColor} stroke="none" />
      <polyline
        points={points}
        fill="none"
        stroke={lineColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
