import { Badge, cx } from "./ui";
import { fmtMoney } from "@/lib/format";
import type { TradeWithRelations } from "@/db/schema";

export function LabelChip({ trade }: { trade: TradeWithRelations }) {
  if (trade.noLabel) {
    return <Badge tone="warn">Unlabeled — rule violation</Badge>;
  }
  return <Badge tone="accent">{trade.setup?.name ?? "—"}</Badge>;
}

export function LocationBadge({ location }: { location: string }) {
  if (location === "taper") return <Badge tone="up">Taper</Badge>;
  if (location === "monkey") return <Badge tone="warn">🐒 In balance</Badge>;
  return <Badge>Location unsure</Badge>;
}

export function DirectionBadge({ direction }: { direction: string }) {
  return <Badge>{direction === "long" ? "Long" : "Short"}</Badge>;
}

export function GradeBadge({ grade }: { grade: string | null }) {
  if (!grade) return null;
  const tone = grade === "A" || grade === "B" ? "up" : grade === "C" ? "neutral" : "down";
  return <Badge tone={tone}>Execution {grade}</Badge>;
}

export function PnlText({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "font-mono font-medium tabular-nums",
        value > 0 ? "text-up" : value < 0 ? "text-down" : "text-muted",
        className
      )}
    >
      {value > 0 ? "+" : ""}
      {fmtMoney(value)}
    </span>
  );
}
