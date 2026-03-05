interface RadarPoint {
  id: string;
  label: string;
  value: number;
}

interface PersonalityRadarChartProps {
  points: RadarPoint[];
  size?: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function polarPoint(
  index: number,
  total: number,
  center: number,
  radius: number,
  scale: number
): { x: number; y: number } {
  const angle = -Math.PI / 2 + (index / total) * Math.PI * 2;
  return {
    x: center + Math.cos(angle) * radius * scale,
    y: center + Math.sin(angle) * radius * scale
  };
}

export function PersonalityRadarChart({
  points,
  size = 280
}: PersonalityRadarChartProps): JSX.Element {
  const center = size / 2;
  const radius = size * 0.33;
  const levels = [0.2, 0.4, 0.6, 0.8, 1];

  const safePoints = points.slice(0, 5);
  const total = safePoints.length || 1;

  const dataPolygon = safePoints
    .map((point, index) => {
      const normalized = clamp(point.value, 0, 100) / 100;
      const position = polarPoint(index, total, center, radius, normalized);
      return `${position.x.toFixed(2)},${position.y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <div className="personality-radar-panel" role="img" aria-label="Personality radar chart">
      <svg className="personality-radar-chart" viewBox={`0 0 ${size} ${size}`}>
        {levels.map((level) => {
          const levelPoints = safePoints
            .map((_, index) => {
              const position = polarPoint(index, total, center, radius, level);
              return `${position.x.toFixed(2)},${position.y.toFixed(2)}`;
            })
            .join(" ");

          return <polygon key={`lvl-${level}`} className="radar-level" points={levelPoints} />;
        })}

        {safePoints.map((_, index) => {
          const edge = polarPoint(index, total, center, radius, 1);
          return (
            <line
              key={`axis-${index}`}
              className="radar-axis"
              x1={center}
              y1={center}
              x2={edge.x}
              y2={edge.y}
            />
          );
        })}

        <polygon className="radar-shape" points={dataPolygon} />

        {safePoints.map((point, index) => {
          const normalized = clamp(point.value, 0, 100) / 100;
          const valueDot = polarPoint(index, total, center, radius, normalized);
          return <circle key={`dot-${point.id}`} className="radar-dot" cx={valueDot.x} cy={valueDot.y} r={4.2} />;
        })}

        {safePoints.map((point, index) => {
          const labelPoint = polarPoint(index, total, center, radius + 20, 1);
          return (
            <text key={`label-${point.id}`} x={labelPoint.x} y={labelPoint.y} className="radar-label" textAnchor="middle">
              {point.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
