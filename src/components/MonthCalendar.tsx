import Link from "next/link";

// Color already carries direction, so day cells skip the +/- sign to stay narrow.
function fmtShort(v: number, signed = false): string {
  const sign = signed ? (v > 0 ? "+" : v < 0 ? "-" : "") : "";
  const abs = Math.abs(v);
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(1)}k`;
  return `${sign}$${Math.round(abs)}`;
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Tappable month grid. Each traded day shows its PnL and links to that
 * day's trades. Monday-first, like the trading week.
 */
export function MonthCalendar({
  daily,
  month,
}: {
  daily: Map<string, number>;
  month: string; // "YYYY-MM"
}) {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = (first.getUTCDay() + 6) % 7; // Monday-first offset

  const cells: ({ day: number; iso: string } | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, iso: `${month}-${String(d).padStart(2, "0")}` });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = first.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  let monthTotal = 0;
  let tradedDays = 0;
  for (const [iso, v] of daily) {
    if (iso.startsWith(month)) {
      monthTotal += v;
      tradedDays++;
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <Link
          href={`/?cal=${shiftMonth(month, -1)}`}
          aria-label="Previous month"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          ‹
        </Link>
        <div className="text-center">
          <p className="text-base font-semibold text-ink">{monthLabel}</p>
          {tradedDays > 0 ? (
            <p
              className={`font-mono text-sm font-bold tabular-nums ${
                monthTotal > 0 ? "text-up" : monthTotal < 0 ? "text-down" : "text-muted"
              }`}
            >
              {fmtShort(monthTotal, true)}
            </p>
          ) : (
            <p className="text-sm text-muted">No trades</p>
          )}
        </div>
        <Link
          href={`/?cal=${shiftMonth(month, 1)}`}
          aria-label="Next month"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          ›
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i} className="pb-1 text-sm font-medium text-faint">
            {d}
          </span>
        ))}
        {cells.map((cell, i) => {
          if (!cell) return <span key={i} />;
          const v = daily.get(cell.iso);
          const inner = (
            <>
              <span className="text-sm leading-none text-faint">{cell.day}</span>
              {v != null ? (
                <span
                  className={`mt-0.5 font-mono text-sm font-bold leading-tight tabular-nums ${
                    v > 0 ? "text-up" : v < 0 ? "text-down" : "text-muted"
                  }`}
                >
                  {fmtShort(v)}
                </span>
              ) : null}
            </>
          );
          const base =
            "flex min-h-12 flex-col items-center justify-center rounded-lg border px-0.5 py-1";
          if (v == null) {
            return (
              <span key={i} className={`${base} border-line/50`}>
                {inner}
              </span>
            );
          }
          return (
            <Link
              key={i}
              href={`/trades?date=${cell.iso}`}
              className={`${base} transition-colors ${
                v > 0
                  ? "border-[rgba(47,227,142,0.35)] bg-up-soft hover:bg-[rgba(47,227,142,0.22)]"
                  : v < 0
                    ? "border-[rgba(255,93,104,0.35)] bg-down-soft hover:bg-[rgba(255,93,104,0.22)]"
                    : "border-line bg-surface-2 hover:bg-surface"
              }`}
            >
              {inner}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
