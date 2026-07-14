import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { setups, trades } from "@/db/schema";
import { TradeForm } from "@/components/TradeForm";
import { requireUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function EditTradePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireUserId();
  const db = await getDb();
  const [trade, allSetups] = await Promise.all([
    db.query.trades.findFirst({
      where: and(eq(trades.id, Number(id)), eq(trades.userId, userId)),
      with: { setup: true, screenshots: true },
    }),
    db
      .select()
      .from(setups)
      .where(eq(setups.userId, userId))
      .orderBy(asc(setups.sortOrder), asc(setups.id)),
  ]);
  if (!trade) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <TradeForm setups={allSetups} trade={trade} />
    </div>
  );
}
