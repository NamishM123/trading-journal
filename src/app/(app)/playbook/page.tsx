import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { setups, trades } from "@/db/schema";
import { createSetup, updateSetup, toggleSetupActive } from "@/actions/setups";
import { Badge, Button, Card, Field, Input, Textarea } from "@/components/ui";
import { fmtMoney, fmtPct, fmtR } from "@/lib/format";
import { statsForTrades } from "@/lib/stats";
import { SAMPLE_SIZE_TARGET } from "@/lib/constants";
import { requireUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function PlaybookPage() {
  const userId = await requireUserId();
  const db = await getDb();
  const [allSetups, allTrades] = await Promise.all([
    db
      .select()
      .from(setups)
      .where(eq(setups.userId, userId))
      .orderBy(asc(setups.sortOrder), asc(setups.id)),
    db.query.trades.findMany({
      where: eq(trades.userId, userId),
      with: { setup: true, screenshots: true },
      orderBy: [desc(trades.tradeDate)],
    }),
  ]);

  const active = allSetups.filter((s) => s.isActive);
  const archived = allSetups.filter((s) => !s.isActive);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {active.map((s) => {
        const st = statsForTrades(allTrades.filter((t) => t.setupId === s.id));
        const sample = Math.min(st.count, SAMPLE_SIZE_TARGET);
        return (
          <Card key={s.id}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-2xl font-semibold tracking-tight">{s.name}</h2>
                {s.description ? (
                  <p className="mt-1 text-base text-muted">{s.description}</p>
                ) : null}
                {s.rules ? (
                  <p className="mt-2 whitespace-pre-wrap rounded-xl bg-surface-2 px-3 py-2 text-base">
                    {s.rules}
                  </p>
                ) : null}
              </div>
              <Badge
                tone={st.count >= SAMPLE_SIZE_TARGET ? "up" : "neutral"}
                className="px-4 py-2 text-base"
              >
                {st.count} trade{st.count === 1 ? "" : "s"}
              </Badge>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Win Rate" value={fmtPct(st.winRate)} />
              <Stat label="Total PnL" value={fmtMoney(st.pnl)} />
              <Stat label="Avg R" value={fmtR(st.avgR)} />
              <Stat
                label="Expectancy Per Trade"
                value={st.expectancy != null ? fmtMoney(st.expectancy) : "-"}
              />
            </dl>

            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-sm text-muted">
                <span>{SAMPLE_SIZE_TARGET} Trade Sample</span>
                <span>
                  {sample}/{SAMPLE_SIZE_TARGET}
                  {st.avgGrade ? ` · avg execution ${st.avgGrade}` : ""}
                </span>
              </div>
              <div className="h-4 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${(sample / SAMPLE_SIZE_TARGET) * 100}%` }}
                />
              </div>
            </div>

            <details className="mt-4">
              <summary className="cursor-pointer list-none text-base font-medium text-accent hover:underline [&::-webkit-details-marker]:hidden">
                Edit Setup
              </summary>
              <form action={updateSetup} className="mt-3 space-y-3">
                <input type="hidden" name="id" value={s.id} />
                <Field label="Name">
                  <Input name="name" defaultValue={s.name} required />
                </Field>
                <Field label="Description">
                  <Textarea name="description" rows={3} defaultValue={s.description} />
                </Field>
                <Field label="Entry Rules And Criteria">
                  <Textarea
                    name="rules"
                    rows={3}
                    defaultValue={s.rules}
                    placeholder="What must be on the tape before this label applies?"
                  />
                </Field>
                <div className="flex items-center gap-2">
                  <Button type="submit" variant="secondary">
                    Save
                  </Button>
                </div>
              </form>
              <form action={toggleSetupActive} className="mt-3">
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="active" value="false" />
                <Button type="submit" variant="danger">
                  Archive Setup
                </Button>
              </form>
            </details>
          </Card>
        );
      })}

      <Card>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Add A Setup</h2>
        <form action={createSetup} className="space-y-3">
          <Field label="Name">
            <Input name="name" placeholder="e.g. Failed breakout reclaim" required />
          </Field>
          <Field label="Description">
            <Textarea name="description" rows={3} />
          </Field>
          <Field label="Entry Rules And Criteria">
            <Textarea name="rules" rows={3} />
          </Field>
          <Button type="submit">Add To Playbook</Button>
        </form>
      </Card>

      {archived.length > 0 ? (
        <Card>
          <h2 className="mb-3 text-lg font-semibold tracking-tight text-muted">Archived</h2>
          <div className="space-y-2">
            {archived.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3">
                <span className="text-base text-muted">{s.name}</span>
                <form action={toggleSetupActive}>
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="active" value="true" />
                  <button type="submit" className="text-base text-accent hover:underline">
                    Restore
                  </button>
                </form>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-0.5 text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
