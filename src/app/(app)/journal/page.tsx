import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { journalEntries } from "@/db/schema";
import { saveJournalEntry, deleteJournalEntry } from "@/actions/journal";
import { Badge, Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { fmtDate, todayISO } from "@/lib/format";
import { GRADES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const editDate = date ?? todayISO();
  const db = await getDb();
  const [entries, [current]] = await Promise.all([
    db.select().from(journalEntries).orderBy(desc(journalEntries.entryDate)),
    db.select().from(journalEntries).where(eq(journalEntries.entryDate, editDate)),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-lg font-semibold">Daily Journal</h1>
        <p className="mt-1 text-sm text-muted">
          The mindset check-in. Plan before the open, review after the close — the
          consistency you seek is in your mind.
        </p>
      </div>

      <Card>
        <form action={saveJournalEntry} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date">
              <Input type="date" name="entryDate" defaultValue={editDate} required />
            </Field>
            <Field label="Day grade (process, not PnL)">
              <Select name="dayGrade" defaultValue={current?.dayGrade ?? ""}>
                <option value="">—</option>
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Pre-market plan">
            <Textarea
              name="premarketPlan"
              placeholder="Key levels, overnight context, which setups you're hunting…"
              defaultValue={current?.premarketPlan ?? ""}
            />
          </Field>
          <Field label="Market context">
            <Textarea
              name="marketContext"
              rows={2}
              placeholder="Balance or trend day? Where's value? News?"
              defaultValue={current?.marketContext ?? ""}
            />
          </Field>
          <Field label="Mindset check-in">
            <Textarea
              name="mindset"
              rows={2}
              placeholder="How do you feel walking in? Anything carrying over from yesterday?"
              defaultValue={current?.mindset ?? ""}
            />
          </Field>
          <Field label="Post-market review">
            <Textarea
              name="review"
              placeholder="Did you trade your plan? What did today's sample teach you?"
              defaultValue={current?.review ?? ""}
            />
          </Field>
          <Button type="submit">{current ? "Update entry" : "Save entry"}</Button>
        </form>
      </Card>

      <div className="space-y-2">
        {entries
          .filter((e) => e.entryDate !== editDate)
          .map((e) => (
            <details key={e.id} className="rounded-2xl border border-line bg-surface px-4 py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                <span className="text-sm font-medium">{fmtDate(e.entryDate)}</span>
                <span className="flex items-center gap-2">
                  {e.dayGrade ? <Badge>{`Day ${e.dayGrade}`}</Badge> : null}
                  <a href={`/journal?date=${e.entryDate}`} className="text-sm text-accent hover:underline">
                    Edit
                  </a>
                </span>
              </summary>
              <div className="mt-3 space-y-3 text-sm">
                {(
                  [
                    ["Pre-market plan", e.premarketPlan],
                    ["Market context", e.marketContext],
                    ["Mindset", e.mindset],
                    ["Review", e.review],
                  ] as const
                ).map(([label, text]) =>
                  text ? (
                    <div key={label}>
                      <p className="text-xs font-medium text-muted">{label}</p>
                      <p className="mt-0.5 whitespace-pre-wrap leading-relaxed">{text}</p>
                    </div>
                  ) : null
                )}
                <form action={deleteJournalEntry}>
                  <input type="hidden" name="id" value={e.id} />
                  <button type="submit" className="text-xs text-muted hover:text-down">
                    Delete entry
                  </button>
                </form>
              </div>
            </details>
          ))}
      </div>
    </div>
  );
}
