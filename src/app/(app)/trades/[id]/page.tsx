import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { trades } from "@/db/schema";
import { Card, SectionTitle, Badge } from "@/components/ui";
import { LabelChip, LocationBadge, GradeBadge, DirectionBadge, PnlText } from "@/components/badges";
import { ScreenshotGallery } from "@/components/Lightbox";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";
import { DeleteTradeButton } from "@/components/DeleteTradeButton";
import { fmtDate, fmtR } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TradeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await getDb();
  const trade = await db.query.trades.findFirst({
    where: eq(trades.id, Number(id)),
    with: { setup: true, screenshots: true },
  });
  if (!trade) notFound();

  const detail: [string, string | number | null][] = [
    ["Contracts", trade.contracts],
    ["Entry", trade.entryPrice],
    ["Exit", trade.exitPrice],
    ["Stop", trade.stopPrice],
    ["Target", trade.targetPrice],
    ["PnL (points)", trade.pnlPoints],
    ["Planned R", trade.plannedR != null ? fmtR(trade.plannedR) : null],
    ["Realized R", trade.realizedR != null ? fmtR(trade.realizedR) : null],
  ];

  const mind: [string, string | null][] = [
    ["Emotion before", trade.emotionBefore],
    ["Emotion during", trade.emotionDuring],
    ["Emotion after", trade.emotionAfter],
    ["Conviction", trade.conviction != null ? `${trade.conviction}/5` : null],
    ["Followed rules", yn(trade.followedRules)],
    ["Accepted the risk", yn(trade.acceptedRisk)],
    ["Execution timing", trade.executionTiming],
    ["Stop after entry", trade.riskAcceptanceAfterEntry],
    ["Management mistake", trade.managementMistake],
    ["Edge or prediction", edgeLabel(trade.edgeType)],
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{fmtDate(trade.tradeDate)}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold">{trade.instrument}</h1>
            <DirectionBadge direction={trade.direction} />
            <LabelChip trade={trade} />
            <LocationBadge location={trade.location} />
            <GradeBadge grade={trade.executionGrade} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PnlText value={trade.pnl} className="mr-2 text-xl" />
          <Link
            href={`/trades/${trade.id}/edit`}
            className="rounded-xl border border-line-strong bg-surface px-4 py-2 text-sm font-medium hover:bg-surface-2"
          >
            Edit
          </Link>
          <DeleteTradeButton tradeId={trade.id} />
        </div>
      </div>

      {trade.screenshots.length > 0 ? (
        <Card>
          <SectionTitle>Screenshots</SectionTitle>
          <ScreenshotGallery shots={trade.screenshots} />
        </Card>
      ) : null}

      {trade.youtubeUrl ? (
        <Card>
          <SectionTitle>Video recap</SectionTitle>
          <YouTubeEmbed url={trade.youtubeUrl} />
        </Card>
      ) : null}

      <Card>
        <SectionTitle>Trade details</SectionTitle>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          {detail.map(([k, v]) =>
            v != null && v !== "" ? (
              <div key={k}>
                <dt className="text-xs text-muted">{k}</dt>
                <dd className="mt-0.5 text-sm font-medium tabular-nums">{v}</dd>
              </div>
            ) : null
          )}
        </dl>
      </Card>

      <Card>
        <SectionTitle>Mind</SectionTitle>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
          {mind.map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs text-muted">{k}</dt>
              <dd className="mt-0.5 text-sm font-medium">{v ?? "—"}</dd>
            </div>
          ))}
        </dl>
        {trade.setup?.rules ? (
          <div className="mt-4 rounded-xl bg-surface-2 px-3.5 py-2.5">
            <p className="text-xs font-medium text-muted">
              Playbook rules for {trade.setup.name}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{trade.setup.rules}</p>
          </div>
        ) : null}
      </Card>

      {trade.narrative || trade.whatWentWell || trade.whatToImprove ? (
        <Card>
          <SectionTitle>Narrative</SectionTitle>
          <div className="space-y-4">
            {trade.narrative ? (
              <NarrativeBlock label="What the orderflow was telling me" text={trade.narrative} />
            ) : null}
            {trade.whatWentWell ? (
              <NarrativeBlock label="What went well" text={trade.whatWentWell} />
            ) : null}
            {trade.whatToImprove ? (
              <NarrativeBlock label="What to improve" text={trade.whatToImprove} />
            ) : null}
          </div>
        </Card>
      ) : null}

      {trade.noLabel ? (
        <div className="rounded-2xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
          This trade was taken without a nameable setup.{" "}
          <Badge tone="warn">Rule violation</Badge> Review it in your next session recap.
        </div>
      ) : null}
    </div>
  );
}

function NarrativeBlock({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{text}</p>
    </div>
  );
}

function yn(b: boolean | null): string | null {
  if (b === true) return "Yes";
  if (b === false) return "No";
  return null;
}

function edgeLabel(v: string | null): string | null {
  if (!v) return null;
  const map: Record<string, string> = {
    edge: "Edge",
    prediction: "Prediction",
    impulse: "Impulse",
    revenge: "Revenge",
  };
  return map[v] ?? v;
}
