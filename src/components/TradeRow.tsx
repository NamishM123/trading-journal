import Link from "next/link";
import type { TradeWithRelations } from "@/db/schema";
import { fmtDateShort } from "@/lib/format";
import { LabelChip, LocationBadge, GradeBadge, PnlText } from "./badges";

/**
 * Two stacked lines so nothing can ever collide.
 * Line one holds date, instrument, direction, and PnL.
 * Line two is a wrapping badge row where long setup names truncate.
 */
export function TradeRow({ trade }: { trade: TradeWithRelations }) {
  return (
    <Link
      href={`/trades/${trade.id}`}
      className="block rounded-2xl border border-line bg-surface px-4 py-3.5 transition-colors hover:bg-surface-2"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-baseline gap-2.5">
          <span className="shrink-0 text-base text-muted">{fmtDateShort(trade.tradeDate)}</span>
          <span className="text-base font-bold text-ink">{trade.instrument}</span>
          <span className="text-base text-muted">
            {trade.direction === "long" ? "Long" : "Short"}
          </span>
        </span>
        <PnlText value={trade.pnl} className="shrink-0 text-base" />
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <LabelChip trade={trade} />
        <LocationBadge location={trade.location} />
        <GradeBadge grade={trade.executionGrade} />
      </div>
    </Link>
  );
}
