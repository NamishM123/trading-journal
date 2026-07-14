"use client";

import { useRef, useState, useTransition } from "react";
import type { Setup, TradeWithRelations } from "@/db/schema";
import { saveTrade } from "@/actions/trades";
import {
  CHART_TYPES,
  DIRECTIONS,
  EDGE_TYPES,
  EMOTIONS,
  EVIDENCE_TAGS,
  EXECUTION_TIMINGS,
  GRADES,
  INSTRUMENTS,
  LOCATIONS,
  MANAGEMENT_MISTAKES,
  RISK_ACCEPTANCE_AFTER_ENTRY,
} from "@/lib/constants";
import { todayISO } from "@/lib/format";
import {
  Button,
  Card,
  Field,
  Input,
  Select,
  SectionTitle,
  Textarea,
  cx,
} from "./ui";

type NewShot = {
  file: File;
  preview: string;
  chartType: string;
  caption: string;
  evidenceTag?: string;
};

type ExistingShot = {
  id: number;
  url: string;
  chartType: string;
  caption: string;
  evidenceTag?: string;
  deleted: boolean;
};

export function TradeForm({
  setups,
  trade,
}: {
  setups: Setup[];
  trade?: TradeWithRelations;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [label, setLabel] = useState(
    trade ? (trade.noLabel ? "nolabel" : trade.setupId ? `setup:${trade.setupId}` : "") : ""
  );
  const [location, setLocation] = useState(trade?.location ?? "");
  const [newShots, setNewShots] = useState<NewShot[]>([]);
  const [existingShots, setExistingShots] = useState<ExistingShot[]>(
    (trade?.screenshots ?? []).map((s) => ({
      id: s.id,
      url: s.url,
      chartType: s.chartType,
      caption: s.caption,
      evidenceTag: s.evidenceTag || undefined,
      deleted: false,
    }))
  );
  const [dragOver, setDragOver] = useState(false);

  function addFiles(files: FileList | File[]) {
    const imgs = [...files].filter((f) => f.type.startsWith("image/"));
    setNewShots((cur) => [
      ...cur,
      ...imgs.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        chartType: "Delta",
        caption: "",
      })),
    ]);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    if (trade) fd.set("id", String(trade.id));
    for (const s of newShots) fd.append("screenshotFiles", s.file);
    fd.set(
      "screenshotMeta",
      JSON.stringify(newShots.map((s) => ({ chartType: s.chartType, caption: s.caption, evidenceTag: s.evidenceTag })))
    );
    fd.set(
      "existingScreenshots",
      JSON.stringify(
        existingShots
          .filter((s) => !s.deleted)
          .map((s) => ({ id: s.id, chartType: s.chartType, caption: s.caption, evidenceTag: s.evidenceTag }))
      )
    );
    fd.set(
      "deletedScreenshotIds",
      JSON.stringify(existingShots.filter((s) => s.deleted).map((s) => s.id))
    );
    startTransition(async () => {
      const res = await saveTrade(fd);
      if (res?.error) {
        setError(res.error);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-5">
      {error ? (
        <div className="rounded-2xl border border-down/30 bg-down-soft px-4 py-3 text-sm text-down">
          {error}
        </div>
      ) : null}

      {/* Evidence comes first. Upload your screenshots before anything else. */}
      <Card>
        <SectionTitle>
          Evidence
        </SectionTitle>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            addFiles(e.dataTransfer.files);
          }}
          className={cx(
            "rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors",
            dragOver ? "border-accent bg-accent-soft/50" : "border-line-strong"
          )}
        >
          <p className="text-sm text-muted">
            Drag &amp; drop screenshots here, or{" "}
            <label className="cursor-pointer font-medium text-accent underline underline-offset-2">
              browse
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          </p>
        </div>

        {existingShots.filter((s) => !s.deleted).length + newShots.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {existingShots.map((s, i) =>
              s.deleted ? null : (
                <ShotTile
                  key={`e${s.id}`}
                  src={s.url}
                  chartType={s.chartType}
                  caption={s.caption}
                  evidenceTag={s.evidenceTag}
                  onChartType={(v) =>
                    setExistingShots((cur) => cur.map((c, j) => (j === i ? { ...c, chartType: v } : c)))
                  }
                  onCaption={(v) =>
                    setExistingShots((cur) => cur.map((c, j) => (j === i ? { ...c, caption: v } : c)))
                  }
                  onEvidenceTag={(v) =>
                    setExistingShots((cur) => cur.map((c, j) => (j === i ? { ...c, evidenceTag: v } : c)))
                  }
                  onRemove={() =>
                    setExistingShots((cur) => cur.map((c, j) => (j === i ? { ...c, deleted: true } : c)))
                  }
                />
              )
            )}
            {newShots.map((s, i) => (
              <ShotTile
                key={`n${i}`}
                src={s.preview}
                chartType={s.chartType}
                caption={s.caption}
                evidenceTag={s.evidenceTag}
                onChartType={(v) =>
                  setNewShots((cur) => cur.map((c, j) => (j === i ? { ...c, chartType: v } : c)))
                }
                onCaption={(v) =>
                  setNewShots((cur) => cur.map((c, j) => (j === i ? { ...c, caption: v } : c)))
                }
                onEvidenceTag={(v) =>
                  setNewShots((cur) => cur.map((c, j) => (j === i ? { ...c, evidenceTag: v } : c)))
                }
                onRemove={() => setNewShots((cur) => cur.filter((_, j) => j !== i))}
              />
            ))}
          </div>
        ) : null}

        <div className="mt-4">
          <Field label="YouTube Recap Link">
            <Input
              name="youtubeUrl"
              type="url"
              placeholder="https://youtu.be/…"
              defaultValue={trade?.youtubeUrl ?? ""}
            />
          </Field>
        </div>
      </Card>

      {/* The Label Rule */}
      <Card>
        <SectionTitle>
          The Label
        </SectionTitle>
        <Field label="Setup">
          <Select name="label" value={label} onChange={(e) => setLabel(e.target.value)} required>
            <option value="" disabled>
              Name the setup…
            </option>
            {setups.map((s) => (
              <option key={s.id} value={`setup:${s.id}`}>
                {s.name}
              </option>
            ))}
            <option value="nolabel">I couldn&apos;t name it, rule violation</option>
          </Select>
        </Field>
        {label === "nolabel" ? (
          <p className="mt-3 rounded-xl bg-warn-soft px-3.5 py-2.5 text-sm text-warn">
            If you can&apos;t name the setup, you shouldn&apos;t be taking the trade. Log it
            honestly. It counts against your discipline stats.
          </p>
        ) : null}
      </Card>

      {/* Taper or monkey */}
      <Card>
        <SectionTitle>
          Taper Or Monkey?
        </SectionTitle>
        <Field label="Where was your entry?">
          <Select
            name="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          >
            <option value="" disabled>
              Be honest…
            </option>
            {LOCATIONS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </Select>
        </Field>
        {location === "monkey" ? (
          <p className="mt-3 rounded-xl bg-warn-soft px-3.5 py-2.5 text-sm text-warn">
            🐒 Trading inside balance is coin-flip territory. It goes on your monkey tax.
          </p>
        ) : null}
      </Card>

      {/* Trade details */}
      <Card>
        <SectionTitle>Trade Details</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Date">
            <Input type="date" name="tradeDate" defaultValue={trade?.tradeDate ?? todayISO()} required />
          </Field>
          <Field label="Entry Time">
            <Input type="time" name="entryTime" defaultValue={trade?.entryTime ?? ""} />
          </Field>
          <Field label="Instrument">
            <>
              <Input name="instrument" list="instruments" defaultValue={trade?.instrument ?? "ES"} required />
              <datalist id="instruments">
                {INSTRUMENTS.map((i) => (
                  <option key={i} value={i} />
                ))}
              </datalist>
            </>
          </Field>
          <Field label="Direction">
            <Select name="direction" defaultValue={trade?.direction ?? ""} required>
              <option value="" disabled>
                Pick…
              </option>
              {DIRECTIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Contracts">
            <Input type="number" name="contracts" min="0" step="1" defaultValue={trade?.contracts ?? ""} />
          </Field>
          <Field label="Entry Price">
            <Input type="number" name="entryPrice" step="any" defaultValue={trade?.entryPrice ?? ""} />
          </Field>
          <Field label="Exit Price">
            <Input type="number" name="exitPrice" step="any" defaultValue={trade?.exitPrice ?? ""} />
          </Field>
          <Field label="Stop">
            <Input type="number" name="stopPrice" step="any" defaultValue={trade?.stopPrice ?? ""} />
          </Field>
          <Field label="Target">
            <Input type="number" name="targetPrice" step="any" defaultValue={trade?.targetPrice ?? ""} />
          </Field>
          <Field label="PnL ($)">
            <Input type="number" name="pnl" step="any" defaultValue={trade?.pnl ?? ""} required />
          </Field>
          <Field label="PnL (Points)">
            <Input type="number" name="pnlPoints" step="any" defaultValue={trade?.pnlPoints ?? ""} />
          </Field>
          <Field label="Planned R">
            <Input type="number" name="plannedR" step="any" defaultValue={trade?.plannedR ?? ""} />
          </Field>
          <Field label="Realized R (Auto If Blank)">
            <Input type="number" name="realizedR" step="any" defaultValue={trade?.realizedR ?? ""} />
          </Field>
        </div>
      </Card>

      {/* Trading in the Zone */}
      <Card>
        <SectionTitle>
          Mind, Trading In The Zone
        </SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Emotion Before Entry">
            <EmotionSelect name="emotionBefore" defaultValue={trade?.emotionBefore ?? ""} />
          </Field>
          <Field label="Emotion During">
            <EmotionSelect name="emotionDuring" defaultValue={trade?.emotionDuring ?? ""} />
          </Field>
          <Field label="Emotion After">
            <EmotionSelect name="emotionAfter" defaultValue={trade?.emotionAfter ?? ""} />
          </Field>
          <Field label="Conviction (1 To 5)">
            <Select name="conviction" defaultValue={trade?.conviction ?? ""}>
              <option value="">-</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "· lowest" : n === 5 ? "· highest" : ""}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Did you follow your rules?">
            <YesNoSelect name="followedRules" defaultValue={boolToYesNo(trade?.followedRules)} />
          </Field>
          <Field label="Fully accepted the risk before entry?">
            <YesNoSelect name="acceptedRisk" defaultValue={boolToYesNo(trade?.acceptedRisk)} />
          </Field>
          <Field label="Execution Grade (Process Only)">
            <Select name="executionGrade" defaultValue={trade?.executionGrade ?? ""}>
              <option value="">-</option>
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      {/* Execution timing */}
      <Card>
        <SectionTitle>
          Execution Timing
        </SectionTitle>
        <Field label="Timing Of Entry">
          <Select name="executionTiming" defaultValue={trade?.executionTiming ?? ""}>
            <option value="">-</option>
            {EXECUTION_TIMINGS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
      </Card>

      {/* Risk acceptance after entry */}
      <Card>
        <SectionTitle>
          Risk Management After Entry
        </SectionTitle>
        <Field label="After entry, what happened to your stop?">
          <Select name="riskAcceptanceAfterEntry" defaultValue={trade?.riskAcceptanceAfterEntry ?? ""}>
            <option value="">-</option>
            {RISK_ACCEPTANCE_AFTER_ENTRY.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </Field>
      </Card>

      {/* Management mistakes */}
      <Card>
        <SectionTitle>
          Management Mistakes
        </SectionTitle>
        <Field label="What went wrong with management?">
          <Select name="managementMistake" defaultValue={trade?.managementMistake ?? ""}>
            <option value="">-</option>
            {MANAGEMENT_MISTAKES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </Field>
      </Card>

      {/* Edge vs prediction */}
      <Card>
        <SectionTitle>
          Trade Source
        </SectionTitle>
        <Field label="What type of trade was this?">
          <Select name="edgeType" defaultValue={trade?.edgeType ?? ""}>
            <option value="">-</option>
            {EDGE_TYPES.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </Select>
        </Field>
      </Card>

      {/* Narrative */}
      <Card>
        <SectionTitle>Narrative</SectionTitle>
        <div className="space-y-4">
          <Field label="What was the orderflow telling you?">
            <Textarea
              name="narrative"
              rows={4}
              placeholder="Who was trapped, where the size was, what the delta/footprint showed…"
              defaultValue={trade?.narrative ?? ""}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="What Went Well">
              <Textarea name="whatWentWell" defaultValue={trade?.whatWentWell ?? ""} />
            </Field>
            <Field label="What To Improve">
              <Textarea name="whatToImprove" defaultValue={trade?.whatToImprove ?? ""} />
            </Field>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-end gap-3 pb-8">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : trade ? "Save Changes" : "Save Recap"}
        </Button>
      </div>
    </form>
  );
}

function ShotTile({
  src,
  chartType,
  caption,
  evidenceTag,
  onChartType,
  onCaption,
  onEvidenceTag,
  onRemove,
}: {
  src: string;
  chartType: string;
  caption: string;
  evidenceTag?: string;
  onChartType: (v: string) => void;
  onCaption: (v: string) => void;
  onEvidenceTag: (v: string) => void;
  onRemove: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={caption || chartType} className="aspect-video w-full object-cover" />
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-1.5 top-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-sm text-white hover:bg-black/80"
          aria-label="Remove screenshot"
        >
          ✕
        </button>
      </div>
      <div className="space-y-1.5 p-2">
        <Select value={chartType} onChange={(e) => onChartType(e.target.value)} className="!py-1.5 text-xs">
          {CHART_TYPES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Select value={evidenceTag ?? ""} onChange={(e) => onEvidenceTag(e.target.value)} className="!py-1.5 text-xs">
          <option value="">Evidence tag…</option>
          {EVIDENCE_TAGS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
        <Input
          value={caption}
          onChange={(e) => onCaption(e.target.value)}
          placeholder="Caption (optional)"
          className="!py-1.5 text-xs"
        />
      </div>
    </div>
  );
}

function EmotionSelect({ name, defaultValue }: { name: string; defaultValue: string }) {
  return (
    <Select name={name} defaultValue={defaultValue}>
      <option value="">-</option>
      {EMOTIONS.map((e) => (
        <option key={e} value={e}>
          {e}
        </option>
      ))}
    </Select>
  );
}

function YesNoSelect({ name, defaultValue }: { name: string; defaultValue: string }) {
  return (
    <Select name={name} defaultValue={defaultValue}>
      <option value="">-</option>
      <option value="yes">Yes</option>
      <option value="no">No</option>
    </Select>
  );
}

function boolToYesNo(b: boolean | null | undefined): string {
  if (b === true) return "yes";
  if (b === false) return "no";
  return "";
}
