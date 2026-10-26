"use client";

import { useState } from "react";
import { Button, Input, Label } from "@/components/ui";
import { useT } from "@/lib/i18n/client";
import { createClient } from "@/lib/supabase/browser";

/**
 * Sign-in by email: Supabase sends one email with a 6-digit code and a link.
 * The code works on any device; the link only in the browser that asked for it.
 */
export function EmailLink({ next }: { next: string }) {
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "verifying">("idle");
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

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setState("verifying");
    setError(null);
    const { error } = await createClient().auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" });
    if (error) {
      setState("sent");
      setError(t("login.codeFailed"));
    } else {
      // A full load so the server sees the new session cookie.
      window.location.assign(next);
    }
  }

  if (state === "sent" || state === "verifying") {
    return (
      <form onSubmit={verify} className="space-y-2">
        <p className="rounded-lg bg-ok-soft px-3 py-2 text-sm leading-relaxed text-ok">
          {t("login.codeSent")} <span className="font-medium">{email.trim()}</span>
        </p>
        <Label htmlFor="code">{t("login.code")}</Label>
        <Input
          id="code"
          required
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6,10}"
          maxLength={10}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="123456"
          className="text-center text-lg tracking-[0.4em]"
        />
        <Button type="submit" disabled={state === "verifying" || code.length < 6} className="w-full">
          {state === "verifying" ? t("login.verifying") : t("login.verify")}
        </Button>
        {error && <p className="text-xs text-err">{error}</p>}
        <p className="text-xs leading-relaxed text-muted">{t("login.linkNote")}</p>
        <button
          type="button"
          className="text-xs font-medium text-accent hover:underline"
          onClick={() => {
            setState("idle");
            setCode("");
            setError(null);
          }}
        >
          {t("login.otherEmail")}
        </button>
      </form>
    );
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
