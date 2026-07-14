import { quoteOfTheDay } from "@/lib/constants";

/** Rotates daily through the Trading in the Zone quotes. */
export function QuoteCard() {
  const quote = quoteOfTheDay();
  return (
    <div className="rounded-2xl border border-line border-l-2 border-l-accent bg-surface px-5 py-4 shadow-[-6px_0_22px_-8px_rgba(69,196,255,0.25),0_14px_34px_rgba(0,0,0,0.3)] backdrop-blur-xl">
      <p className="text-sm leading-relaxed text-ink">“{quote}”</p>
      <p className="mt-1.5 text-xs text-faint">
        Mark Douglas, Trading In The Zone
      </p>
    </div>
  );
}
