"use client";

import { useRef, useState } from "react";
import { fmtMoney } from "@/lib/format";

type Point = { x: number; y: number };

const W = 640;
const H = 200;
const PAD = { top: 12, right: 12, bottom: 22, left: 56 };

/** Cumulative PnL by trade sequence. Single series — the title names it, no legend. */
export function EquityCurve({ points }: { points: Point[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  if (points.length === 0) return null;

  const xs = [0, ...points.map((p) => p.x)];
  const ys = [0, ...points.map((p) => p.y)];
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const ySpan = yMax - yMin || 1;

  const px = (x: number) =>
    PAD.left + ((x - 0) / (xMax || 1)) * (W - PAD.left - PAD.right);
  const py = (y: number) =>
    PAD.top + (1 - (y - yMin) / ySpan) * (H - PAD.top - PAD.bottom);

  const all: Point[] = [{ x: 0, y: 0 }, ...points];
  const path = all
    .map((p, i) => `${i === 0 ? "M" : "L"}${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`)
    .join(" ");
  const area = `${path} L${px(xMax).toFixed(1)},${py(Math.max(yMin, 0)).toFixed(1)} L${px(0).toFixed(1)},${py(Math.max(yMin, 0)).toFixed(1)} Z`;

  const last = points[points.length - 1];
  const lineColor = last.y >= 0 ? "var(--chart-up)" : "var(--chart-down)";
  const glow =
    last.y >= 0
      ? "drop-shadow(0 0 6px rgba(47,227,142,0.55))"
      : "drop-shadow(0 0 6px rgba(255,93,104,0.55))";

  // 3 recessive horizontal gridlines + zero line when in range
  const gridYs = [yMin, yMin + ySpan / 2, yMax];

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    let bestDist = Infinity;
    all.forEach((p, i) => {
      const d = Math.abs(px(p.x) - mx);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    setHover(best);
  }

  const h = hover != null ? all[hover] : null;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label={`Equity curve, ${points.length} trades, ending at ${fmtMoney(last.y)}`}
      onMouseMove={onMove}
      onMouseLeave={() => setHover(null)}
    >
      {gridYs.map((gy, i) => (
        <g key={i}>
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={py(gy)}
            y2={py(gy)}
            stroke="var(--border)"
            strokeWidth="1"
          />
          <text
            x={PAD.left - 8}
            y={py(gy) + 3.5}
            textAnchor="end"
            fontSize="10.5"
            fill="var(--muted)"
          >
            {gy >= 1000 || gy <= -1000
              ? `${gy < 0 ? "-" : ""}$${(Math.abs(gy) / 1000).toFixed(1)}k`
              : `${gy < 0 ? "-" : ""}$${Math.abs(Math.round(gy))}`}
          </text>
        </g>
      ))}
      {yMin < 0 && yMax > 0 ? (
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={py(0)}
          y2={py(0)}
          stroke="var(--border-strong)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
      ) : null}

      <path d={area} fill={lineColor} opacity="0.12" />
      <path
        d={path}
        fill="none"
        stroke={lineColor}
        strokeWidth="2"
        strokeLinejoin="round"
        style={{ filter: glow }}
      />

      <text
        x={W - PAD.right}
        y={H - 6}
        textAnchor="end"
        fontSize="10.5"
        fill="var(--muted)"
      >
        trade #
      </text>

      {h ? (
        <g>
          <line
            x1={px(h.x)}
            x2={px(h.x)}
            y1={PAD.top}
            y2={H - PAD.bottom}
            stroke="var(--border-strong)"
            strokeWidth="1"
          />
          <circle
            cx={px(h.x)}
            cy={py(h.y)}
            r="4"
            fill={lineColor}
            stroke="var(--surface)"
            strokeWidth="2"
          />
          <g
            transform={`translate(${Math.min(px(h.x) + 10, W - 130)}, ${Math.max(py(h.y) - 34, 4)})`}
          >
            <rect
              width="120"
              height="30"
              rx="8"
              fill="var(--surface)"
              stroke="var(--border)"
            />
            <text x="10" y="13" fontSize="10" fill="var(--muted)">
              {h.x === 0 ? "start" : `after trade ${h.x}`}
            </text>
            <text x="10" y="25" fontSize="11" fontWeight="600" fill="var(--text)">
              {fmtMoney(h.y)}
            </text>
          </g>
        </g>
      ) : null}
    </svg>
  );
}
