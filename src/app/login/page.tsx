"use client";

import { useActionState } from "react";
import { login } from "@/actions/auth";
import { Button, Card, Input } from "@/components/ui";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, null);

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-fg">
            TJ
          </span>
          <h1 className="text-base font-semibold">Trading Journal</h1>
        </div>
        <form action={formAction} className="space-y-4">
          <Input type="password" name="password" placeholder="Password" autoFocus required />
          {state?.error ? <p className="text-sm text-down">{state.error}</p> : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Checking…" : "Enter"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
