import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { journalEntries } from "@/db/schema";
import { deleteJournalEntry } from "@/actions/journal";
import { Badge, Button, Card } from "@/components/ui";
import { JournalForm } from "@/components/JournalForm";
import { fmtDate, todayISO } from "@/lib/format";
import { requireUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const editDate = date ?? todayISO();
  const userId = await requireUserId();
  const db = await getDb();
  const [entries, [current]] = await Promise.all([
    db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(desc(journalEntries.entryDate)),
    db
      .select()
      .from(journalEntries)
      .where(and(eq(journalEntries.entryDate, editDate), eq(journalEntries.userId, userId))),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Card>
        <JournalForm editDate={editDate} current={current} />
      </Card>

      <div className="space-y-2">
        {entries
          .filter((e) => e.entryDate !== editDate)
          .map((e) => (
            <details key={e.id} className="rounded-2xl border border-line bg-surface px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                <span className="text-base font-medium">{fmtDate(e.entryDate)}</span>
                <span className="flex items-center gap-2">
                  {e.dayGrade ? <Badge>{`${e.dayGrade} Day`}</Badge> : null}
                  <a href={`/journal?date=${e.entryDate}`} className="text-base text-accent hover:underline">
                    Edit
                  </a>
                </span>
              </summary>
              <div className="mt-3 space-y-3 text-base">
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
                      <p className="text-sm font-medium text-muted">{label}</p>
                      <p className="mt-0.5 whitespace-pre-wrap leading-relaxed">{text}</p>
                    </div>
                  ) : null
                )}
                <form action={deleteJournalEntry} className="pt-1">
                  <input type="hidden" name="id" value={e.id} />
                  <Button type="submit" variant="danger">
                    Delete Entry
                  </Button>
                </form>
              </div>
            </details>
          ))}
      </div>
    </div>
  );
}
