import { quoteOfTheDay } from "@/lib/constants";
import { Card } from "./ui";

/** Rotates daily through the Trading in the Zone quotes. */
export function QuoteCard() {
  const quote = quoteOfTheDay();
  return (
    <Card>
      <p className="text-base leading-relaxed text-ink">“{quote}”</p>
      <p className="mt-2 text-sm text-faint">Mark Douglas, Trading In The Zone</p>
    </Card>
  );
}
