"use client";

import { useState } from "react";
import { Button, Card, Input, Label } from "@/components/ui";
import { loginEmail, PASSWORD_MAX, PASSWORD_MIN } from "@/lib/auth/username";
import { useT } from "@/lib/i18n/client";
import { createClient } from "@/lib/supabase/browser";

export function ChangePassword({ username }: { username: string }) {
  const { t } = useT();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (next.length < PASSWORD_MIN || next.length > PASSWORD_MAX) return setMessage({ ok: false, text: t("signup.passwordHint") });
    if (next !== confirm) return setMessage({ ok: false, text: t("signup.mismatch") });

    setPending(true);
    const supabase = createClient();
    // Check the current password first, so an unattended session can't change it.
    const check = await supabase.auth.signInWithPassword({ email: loginEmail(username), password: current });
    if (check.error) {
      setPending(false);
      return setMessage({ ok: false, text: check.error.code === "invalid_credentials" ? t("account.wrongCurrent") : check.error.message });
    }
    const { error } = await supabase.auth.updateUser({ password: next });
    setPending(false);
    if (error) return setMessage({ ok: false, text: error.message });
    setCurrent("");
    setNext("");
    setConfirm("");
    setMessage({ ok: true, text: t("account.changed") });
  }

  return (
    <Card className="p-6">
      <h2 className="mb-4 font-semibold">{t("account.changePassword")}</h2>
      <form onSubmit={submit} className="space-y-3">
        <input type="text" autoComplete="username" value={username} readOnly hidden />
        <div>
          <Label htmlFor="current">{t("account.current")}</Label>
          <Input id="current" type="password" required autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="new">{t("account.new")}</Label>
          <Input
            id="new"
            type="password"
            required
            autoComplete="new-password"
            minLength={PASSWORD_MIN}
            maxLength={PASSWORD_MAX}
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
          <p className="mt-1 text-xs text-muted">{t("signup.passwordHint")}</p>
        </div>
        <div>
          <Label htmlFor="confirm">{t("signup.confirm")}</Label>
          <Input id="confirm" type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? t("common.saving") : t("account.changePassword")}
        </Button>
        {message && <p className={`text-sm ${message.ok ? "text-ok" : "text-err"}`}>{message.text}</p>}
      </form>
    </Card>
  );
}
