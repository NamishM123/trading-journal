import { asc, desc } from "drizzle-orm";
import { getDb } from "@/db";
import { setups, trades } from "@/db/schema";
import { createSetup, updateSetup, toggleSetupActive } from "@/actions/setups";
import { Badge, Button, Card, Field, Input, Textarea } from "@/components/ui";
import { fmtMoney, fmtPct, fmtR } from "@/lib/format";
import { statsForTrades } from "@/lib/stats";
import { SAMPLE_SIZE_TARGET } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function PlaybookPage() {
  const db = await getDb();
  const [allSetups, allTrades] = await Promise.all([
    db.select().from(setups).orderBy(asc(setups.sortOrder), asc(setups.id)),
    db.query.trades.findMany({
      with: { setup: true, screenshots: true },
      orderBy: [desc(trades.tradeDate)],
    }),
  ]);

  const active = allSetups.filter((s) => s.isActive);
  const archived = allSetups.filter((s) => !s.isActive);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-lg font-semibold">Playbook</h1>
        <p className="mt-1 text-sm text-muted">
          If you can&apos;t assign a trade one of these labels, you don&apos;t take it. Douglas&apos;s
          consistency exercise: execute one setup {SAMPLE_SIZE_TARGET} times, graded only on
          process.
        </p>
      </div>

      {active.map((s) => {
        const st = statsForTrades(allTrades.filter((t) => t.setupId === s.id));
        const sample = Math.min(st.count, SAMPLE_SIZE_TARGET);
        return (
          <Card key={s.id}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold">{s.name}</h2>
                {s.description ? (
                  <p className="mt-1 text-sm text-muted">{s.description}</p>
                ) : null}
                {s.rules ? (
                  <p className="mt-2 whitespace-pre-wrap rounded-xl bg-surface-2 px-3 py-2 text-sm">
                    {s.rules}
                  </p>
                ) : null}
              </div>
              <Badge tone={st.count >= SAMPLE_SIZE_TARGET ? "up" : "neutral"}>
                {st.count} trade{st.count === 1 ? "" : "s"}
              </Badge>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Win rate" value={fmtPct(st.winRate)} />
              <Stat label="Total PnL" value={fmtMoney(st.pnl)} />
              <Stat label="Avg R" value={fmtR(st.avgR)} />
              <Stat
                label="Expectancy / trade"
                value={st.expectancy != null ? fmtMoney(st.expectancy) : "—"}
              />
            </dl>

            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-xs text-muted">
                <span>{SAMPLE_SIZE_TARGET}-trade sample</span>
                <span>
                  {sample}/{SAMPLE_SIZE_TARGET}
                  {st.avgGrade ? ` · avg execution ${st.avgGrade}` : ""}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${(sample / SAMPLE_SIZE_TARGET) * 100}%` }}
                />
              </div>
            </div>

            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-accent">Edit setup</summary>
              <form action={updateSetup} className="mt-3 space-y-3">
                <input type="hidden" name="id" value={s.id} />
                <Field label="Name">
                  <Input name="name" defaultValue={s.name} required />
                </Field>
                <Field label="Description">
                  <Textarea name="description" rows={2} defaultValue={s.description} />
                </Field>
                <Field label="Entry rules / criteria">
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
              <form action={toggleSetupActive} className="mt-2">
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="active" value="false" />
                <button type="submit" className="text-sm text-muted hover:text-down">
                  Archive setup
                </button>
              </form>
            </details>
          </Card>
        );
      })}

      <Card>
        <h2 className="mb-3 text-sm font-semibold">Add a setup</h2>
        <form action={createSetup} className="space-y-3">
          <Field label="Name">
            <Input name="name" placeholder="e.g. Failed breakout reclaim" required />
          </Field>
          <Field label="Description">
            <Textarea name="description" rows={2} />
          </Field>
          <Field label="Entry rules / criteria">
            <Textarea name="rules" rows={3} />
          </Field>
          <Button type="submit">Add to playbook</Button>
        </form>
      </Card>

      {archived.length > 0 ? (
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-muted">Archived</h2>
          <div className="space-y-2">
            {archived.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted">{s.name}</span>
                <form action={toggleSetupActive}>
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="active" value="true" />
                  <button type="submit" className="text-sm text-accent hover:underline">
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
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
