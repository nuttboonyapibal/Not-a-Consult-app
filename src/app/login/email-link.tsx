"use client";

import { useState } from "react";
import { Button, Input, Label } from "@/components/ui";
import { useT } from "@/lib/i18n/client";
import { createClient } from "@/lib/supabase/browser";

/** Sign-in by a one-time link sent to the email address. */
export function EmailLink({ next }: { next: string }) {
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setError(null);
    const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await createClient().auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo } });
    if (error) {
      setState("idle");
      setError(`${t("login.emailFailed")}: ${error.message}`);
    } else {
      setState("sent");
    }
  }

  if (state === "sent") {
    return <p className="rounded-lg bg-ok-soft px-3 py-2 text-sm leading-relaxed text-ok">{t("login.emailSent")}</p>;
  }
  return (
    <form onSubmit={send} className="space-y-2">
      <Label htmlFor="email">{t("login.email")}</Label>
      <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
      <Button type="submit" disabled={state === "sending"} className="w-full">
        {state === "sending" ? t("login.emailSending") : t("login.emailSend")}
      </Button>
      {error && <p className="text-xs text-err">{error}</p>}
    </form>
  );
}
