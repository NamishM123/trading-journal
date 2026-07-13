import Link from "next/link";
import type { TradeWithRelations } from "@/db/schema";
import { fmtDateShort } from "@/lib/format";
import { LabelChip, LocationBadge, GradeBadge, PnlText } from "./badges";

export function TradeRow({ trade }: { trade: TradeWithRelations }) {
  return (
    <Link
      href={`/trades/${trade.id}`}
      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-line bg-surface px-4 py-3 transition-colors hover:bg-surface-2"
    >
      <span className="w-14 text-xs text-muted">{fmtDateShort(trade.tradeDate)}</span>
      <span className="w-12 text-sm font-medium">{trade.instrument}</span>
      <span className="w-11 text-xs uppercase tracking-wide text-muted">
        {trade.direction}
      </span>
      <span className="min-w-0 flex-1">
        <LabelChip trade={trade} />
      </span>
      <LocationBadge location={trade.location} />
      <GradeBadge grade={trade.executionGrade} />
      <PnlText value={trade.pnl} className="w-24 text-right text-sm" />
    </Link>
  );
}
