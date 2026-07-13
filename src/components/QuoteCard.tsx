import { quoteOfTheDay } from "@/lib/constants";

/** Rotates daily through the Trading in the Zone quotes. */
export function QuoteCard() {
  const quote = quoteOfTheDay();
  return (
    <div className="rounded-2xl border border-line bg-accent-soft/60 px-5 py-4">
      <p className="text-sm leading-relaxed text-ink">“{quote}”</p>
      <p className="mt-1.5 text-xs text-muted">
        Mark Douglas — Trading in the Zone
      </p>
    </div>
  );
}
