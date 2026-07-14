"use client";

import { useState } from "react";
import { useActionState } from "react";
import { login, signup } from "@/actions/auth";
import { Button, Card, Field, Input } from "@/components/ui";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginState, loginAction, loginPending] = useActionState(login, null);
  const [signupState, signupAction, signupPending] = useActionState(signup, null);

  const state = mode === "login" ? loginState : signupState;
  const pending = mode === "login" ? loginPending : signupPending;

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <h1 className="whitespace-nowrap text-2xl font-semibold tracking-tight">
          Don&apos;t Be A Monkey
        </h1>
        <p className="mb-6 mt-1 text-sm text-muted">
          {mode === "login"
            ? "Log in to your journal."
            : "Create your own journal account."}
        </p>

        <form action={mode === "login" ? loginAction : signupAction} className="space-y-4">
          <Field label="Username">
            <Input name="username" placeholder="yourname" autoFocus required />
          </Field>
          <Field label="Password">
            <Input type="password" name="password" placeholder="Password" required />
          </Field>
          {state?.error ? <p className="text-sm text-down">{state.error}</p> : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "One second…" : mode === "login" ? "Log In" : "Create Account"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="mt-4 w-full text-center text-sm text-accent hover:underline"
        >
          {mode === "login"
            ? "New here? Create an account"
            : "Already have an account? Log in"}
        </button>
      </Card>
    </main>
  );
}
