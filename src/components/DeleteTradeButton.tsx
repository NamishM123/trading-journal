"use client";

import { deleteTrade } from "@/actions/trades";
import { Button } from "./ui";

export function DeleteTradeButton({ tradeId }: { tradeId: number }) {
  return (
    <form
      action={deleteTrade}
      onSubmit={(e) => {
        if (!confirm("Delete this trade and its screenshots? This can't be undone.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={tradeId} />
      <Button type="submit" variant="danger">
        Delete
      </Button>
    </form>
  );
}
