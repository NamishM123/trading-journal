import { fmtMoney } from "@/lib/format";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const WEEKS = 16;

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

/**
 * Last 16 weeks of daily PnL, Mon–Fri. Polarity encoding: validated up/down
 * hues, magnitude via opacity; every cell carries a native tooltip + aria label.
 */
export function CalendarHeatmap({ daily }: { daily: Map<string, number> }) {
  const today = new Date();
  // Snap to the Monday of the current week (UTC-naive is fine for a personal journal).
  const monday = new Date(today);
  const dow = (today.getDay() + 6) % 7; // 0 = Monday
  monday.setDate(today.getDate() - dow);

  const max = Math.max(1, ...[...daily.values()].map((v) => Math.abs(v)));

  const weeks: { date: Date; iso: string }[][] = [];
  for (let w = WEEKS - 1; w >= 0; w--) {
    const col: { date: Date; iso: string }[] = [];
    for (let d = 0; d < 5; d++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() - w * 7 + d);
      col.push({ date, iso: isoDate(date) });
    }
    weeks.push(col);
  }

  const monthLabel = (weekIdx: number) => {
    const first = weeks[weekIdx][0].date;
    const prev = weekIdx > 0 ? weeks[weekIdx - 1][0].date : null;
    if (!prev || prev.getMonth() !== first.getMonth()) {
      return first.toLocaleDateString("en-US", { month: "short" });
    }
    return null;
  };

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex gap-2 pr-4">
        <div className="mt-5 grid grid-rows-5 gap-1 text-right">
          {DAY_LABELS.map((d) => (
            <span key={d} className="flex h-5 items-center text-[10px] text-muted">
              {d}
            </span>
          ))}
        </div>
        <div>
          <div className="mb-1 grid h-4 grid-flow-col gap-1" style={{ gridTemplateColumns: `repeat(${WEEKS}, 1.25rem)` }}>
            {weeks.map((_, i) => (
              <span key={i} className="text-[10px] text-muted">
                {monthLabel(i)}
              </span>
            ))}
          </div>
          <div className="grid grid-flow-col gap-1" style={{ gridTemplateColumns: `repeat(${WEEKS}, 1.25rem)` }}>
            {weeks.map((col, wi) => (
              <div key={wi} className="grid grid-rows-5 gap-1">
                {col.map((cell) => {
                  const v = daily.get(cell.iso);
                  const future = cell.date > today;
                  const label =
                    v != null
                      ? `${cell.iso}: ${v >= 0 ? "+" : ""}${fmtMoney(v)}`
                      : `${cell.iso}: no trades`;
                  const style =
                    v == null
                      ? undefined
                      : {
                          backgroundColor: v >= 0 ? "var(--chart-up)" : "var(--chart-down)",
                          opacity: 0.25 + 0.75 * (Math.abs(v) / max),
                        };
                  return (
                    <div
                      key={cell.iso}
                      role="img"
                      aria-label={label}
                      title={future ? undefined : label}
                      className="h-5 w-5 rounded-[5px] bg-surface-2"
                      style={future ? { opacity: 0 } : style}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2 text-[10px] text-muted">
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: "var(--chart-down)" }} />
            <span>loss</span>
            <span className="h-2.5 w-2.5 rounded-[3px] bg-surface-2" />
            <span>flat / no trades</span>
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: "var(--chart-up)" }} />
            <span>win</span>
          </div>
        </div>
      </div>
    </div>
  );
}
