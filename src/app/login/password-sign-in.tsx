"use client";

import { useState } from "react";
import { Button, Input, Label } from "@/components/ui";
import { loginEmail } from "@/lib/auth/username";
import { useT } from "@/lib/i18n/client";
import { createClient } from "@/lib/supabase/browser";

/** Sign-in runs in the browser, so Supabase rate-limits wrong passwords per visitor. */
export function PasswordSignIn({ next }: { next: string }) {
  const { t } = useT();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const { error } = await createClient().auth.signInWithPassword({ email: loginEmail(username), password });
    if (error) {
      setPending(false);
      setError(error.code === "invalid_credentials" ? t("login.invalid") : error.status === 429 ? t("login.tooMany") : error.message);
      return;
    }
    // A full load so the server sees the new session cookie.
    window.location.assign(next);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <Label htmlFor="username">{t("login.username")}</Label>
        <Input
          id="username"
          required
          autoFocus
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="password">{t("login.password")}</Label>
        <Input id="password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? t("login.signingIn") : t("login.submit")}
      </Button>
      {error && <p className="text-sm text-err">{error}</p>}
    </form>
  );
}
