import type { AxisDefinition } from "../types";

interface CompassInfoBlurb {
  descriptor: string;
  axisLineX: string;
  axisLineY: string;
  bullets: Array<{
    label: string;
    text: string;
  }>;
}

interface CompassMiniChartProps {
  title: string;
  quadrantLabel: string;
  x: number;
  y: number;
  confidence: number;
  xAxis: AxisDefinition;
  yAxis: AxisDefinition;
  infoBlurb?: CompassInfoBlurb;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function CompassMiniChart({
  title,
  quadrantLabel,
  x,
  y,
  confidence,
  xAxis,
  yAxis,
  infoBlurb
}: CompassMiniChartProps): JSX.Element {
  const boundedX = clamp(x, -12, 12);
  const boundedY = clamp(y, -12, 12);

  const dotLeft = ((boundedX + 12) / 24) * 100;
  const dotTop = 100 - ((boundedY + 12) / 24) * 100;

  return (
    <article className="mini-chart-card">
      <h3>{title}</h3>
      <p className="mini-chart-meta">{quadrantLabel}</p>
      <div className="mini-chart-grid" role="img" aria-label={`${title} chart at x ${x}, y ${y}`}>
        <span className="axis-label axis-top">{yAxis.posLabel}</span>
        <span className="axis-label axis-bottom">{yAxis.negLabel}</span>
        <span className="axis-label axis-left">{xAxis.negLabel}</span>
        <span className="axis-label axis-right">{xAxis.posLabel}</span>
        <div className="axis-line axis-horizontal" />
        <div className="axis-line axis-vertical" />
        <div className="position-dot" style={{ left: `${dotLeft}%`, top: `${dotTop}%` }} />
      </div>
      <p className="mini-chart-confidence">Confidence: {confidence}%</p>
      {infoBlurb ? (
        <section className="grid-blurb">
          <p className="grid-blurb-line">{infoBlurb.descriptor}</p>
          <ul className="grid-blurb-list">
            {infoBlurb.bullets.map((bullet) => (
              <li key={bullet.label}>
                <strong>{bullet.label}</strong>
                <span> {bullet.text}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
