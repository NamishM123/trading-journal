import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { setups, trades } from "@/db/schema";
import { TradeForm } from "@/components/TradeForm";

export const dynamic = "force-dynamic";

export default async function EditTradePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await getDb();
  const [trade, allSetups] = await Promise.all([
    db.query.trades.findFirst({
      where: eq(trades.id, Number(id)),
      with: { setup: true, screenshots: true },
    }),
    db.select().from(setups).orderBy(asc(setups.sortOrder), asc(setups.id)),
  ]);
  if (!trade) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">Edit Recap</h1>
      <TradeForm setups={allSetups} trade={trade} />
    </div>
  );
}
