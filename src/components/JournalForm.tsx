"use client";

import { useActionState } from "react";
import type { JournalEntry } from "@/db/schema";
import { saveJournalEntry } from "@/actions/journal";
import { Button, Field, Input, Select, Textarea } from "./ui";
import { GRADES } from "@/lib/constants";

export function JournalForm({
  editDate,
  current,
}: {
  editDate: string;
  current?: JournalEntry;
}) {
  const [result, formAction, pending] = useActionState(saveJournalEntry, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Date">
          <Input type="date" name="entryDate" defaultValue={editDate} required />
        </Field>
        <Field label="Day Grade (Process, Not PnL)">
          <Select name="dayGrade" defaultValue={current?.dayGrade ?? ""}>
            <option value="">-</option>
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g} Day
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Pre-Market Plan">
        <Textarea
          name="premarketPlan"
          placeholder="Key levels, overnight context, which setups you're hunting…"
          defaultValue={current?.premarketPlan ?? ""}
        />
      </Field>
      <Field label="Market Context">
        <Textarea
          name="marketContext"
          rows={2}
          placeholder="Balance or trend day? Where's value? News?"
          defaultValue={current?.marketContext ?? ""}
        />
      </Field>
      <Field label="Mindset Check-In">
        <Textarea
          name="mindset"
          rows={2}
          placeholder="How do you feel walking in? Anything carrying over from yesterday?"
          defaultValue={current?.mindset ?? ""}
        />
      </Field>
      <Field label="Post-Market Review">
        <Textarea
          name="review"
          placeholder="Did you trade your plan? What did today's sample teach you?"
          defaultValue={current?.review ?? ""}
        />
      </Field>

      {result?.error ? (
        <p className="rounded-xl bg-down-soft px-3.5 py-2.5 text-base text-down">{result.error}</p>
      ) : null}
      {result?.saved ? <p className="text-base font-medium text-up">Saved.</p> : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : current ? "Update Entry" : "Save Entry"}
      </Button>
    </form>
  );
}
