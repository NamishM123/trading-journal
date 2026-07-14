import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { setups } from "@/db/schema";
import { TradeForm } from "@/components/TradeForm";
import { requireUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function NewTradePage() {
  const userId = await requireUserId();
  const db = await getDb();
  const activeSetups = await db
    .select()
    .from(setups)
    .where(and(eq(setups.isActive, true), eq(setups.userId, userId)))
    .orderBy(asc(setups.sortOrder), asc(setups.id));

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <TradeForm setups={activeSetups} />
    </div>
  );
}
