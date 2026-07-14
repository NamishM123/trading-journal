import { asc } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { setups } from "@/db/schema";
import { TradeForm } from "@/components/TradeForm";
import { truthOfTheDay } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function NewTradePage() {
  const db = await getDb();
  const activeSetups = await db
    .select()
    .from(setups)
    .where(eq(setups.isActive, true))
    .orderBy(asc(setups.sortOrder), asc(setups.id));

  const truth = truthOfTheDay();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Recap</h1>
        <p className="mt-1 text-sm text-muted">“{truth}”</p>
      </div>
      <TradeForm setups={activeSetups} />
    </div>
  );
}
