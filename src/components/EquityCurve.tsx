"use client";

import { useEffect, useRef, useState } from "react";
import { fmtDateShort, fmtMoney } from "@/lib/format";

type Point = { x: number; y: number; date?: string };

const H = 300;
const PAD = { top: 16, right: 16, bottom: 28, left: 62 };

function fmtAxis(v: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(1)}k`;
  return `${sign}$${Math.round(abs)}`;
}

/**
 * Cumulative PnL by trade sequence, rendered at the container's real pixel
 * size so it stays tall and readable on every screen.
 */
export function EquityCurve({ points }: { points: Point[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [w, setW] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setW(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (points.length === 0) return null;

  const body = () => {
    const W = w;
    const xs = [0, ...points.map((p) => p.x)];
    const ys = [0, ...points.map((p) => p.y)];
    const xMax = Math.max(...xs);
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);
    const ySpan = yMax - yMin || 1;

    const px = (x: number) => PAD.left + (x / (xMax || 1)) * (W - PAD.left - PAD.right);
    const py = (y: number) => PAD.top + (1 - (y - yMin) / ySpan) * (H - PAD.top - PAD.bottom);

    const all: Point[] = [{ x: 0, y: 0 }, ...points];
    const path = all
      .map((p, i) => `${i === 0 ? "M" : "L"}${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`)
      .join(" ");
    const baseY = py(Math.max(yMin, 0));
    const area = `${path} L${px(xMax).toFixed(1)},${baseY.toFixed(1)} L${px(0).toFixed(1)},${baseY.toFixed(1)} Z`;

    const last = points[points.length - 1];
    const up = last.y >= 0;
    const lineColor = up ? "var(--chart-up)" : "var(--chart-down)";
    const glow = up
      ? "drop-shadow(0 0 8px rgba(47,227,142,0.5))"
      : "drop-shadow(0 0 8px rgba(255,93,104,0.5))";

    const gridYs = [yMin, yMin + ySpan / 3, yMin + (2 * ySpan) / 3, yMax];

    const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mx = e.clientX - rect.left;
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
    };

    const h = hover != null ? all[hover] : null;

    return (
      <svg
        ref={svgRef}
        width={W}
        height={H}
        role="img"
        aria-label={`Equity curve, ${points.length} trades, ending at ${fmtMoney(last.y)}`}
        style={{ touchAction: "pan-y" }}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") setHover(null);
        }}
      >
        <defs>
          <linearGradient id="eqfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={up ? "#2fe38e" : "#ff5d68"} stopOpacity="0.3" />
            <stop offset="100%" stopColor={up ? "#2fe38e" : "#ff5d68"} stopOpacity="0" />
          </linearGradient>
        </defs>

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
              x={PAD.left - 10}
              y={py(gy) + 4.5}
              textAnchor="end"
              fontSize="14"
              fill="var(--muted)"
            >
              {fmtAxis(gy)}
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
            strokeDasharray="4 4"
          />
        ) : null}

        <path d={area} fill="url(#eqfill)" />
        <path
          d={path}
          fill="none"
          stroke={lineColor}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{ filter: glow }}
        />

        {/* Endpoint marker with the running total. */}
        <circle cx={px(last.x)} cy={py(last.y)} r="4.5" fill={lineColor} />
        <text
          x={Math.min(px(last.x), W - PAD.right) - 8}
          y={Math.max(py(last.y) - 12, 16)}
          textAnchor="end"
          fontSize="14"
          fontWeight="700"
          fill={lineColor}
        >
          {fmtAxis(last.y)}
        </text>

        <text
          x={W - PAD.right}
          y={H - 8}
          textAnchor="end"
          fontSize="14"
          fill="var(--faint)"
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
              r="5"
              fill={lineColor}
              stroke="var(--surface-solid)"
              strokeWidth="2"
            />
            <g
              transform={`translate(${Math.min(px(h.x) + 12, W - 172)}, ${Math.max(py(h.y) - 52, 6)})`}
            >
              <rect
                width="160"
                height="46"
                rx="10"
                fill="var(--surface-solid)"
                stroke="var(--border-strong)"
              />
              <text x="12" y="19" fontSize="12" fill="var(--muted)">
                {h.x === 0
                  ? "start"
                  : `${h.date ? fmtDateShort(h.date) : ""} · trade ${h.x}`}
              </text>
              <text x="12" y="37" fontSize="14" fontWeight="700" fill="var(--text)">
                {fmtMoney(h.y)}
              </text>
            </g>
          </g>
        ) : null}
      </svg>
    );
  };

  return (
    <div ref={wrapRef} className="w-full" style={{ height: H }}>
      {w > 0 ? body() : null}
    </div>
  );
}
