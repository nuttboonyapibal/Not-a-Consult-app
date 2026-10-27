"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Input, Label } from "@/components/ui";
import { signUpAction } from "@/lib/actions/auth";
import { loginEmail, normalizeUsername, PASSWORD_MAX, PASSWORD_MIN, USERNAME_PATTERN, USERNAME_TAKEN } from "@/lib/auth/username";
import { useT } from "@/lib/i18n/client";
import { createClient } from "@/lib/supabase/browser";

export function SignUpForm() {
  const { t } = useT();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!USERNAME_PATTERN.test(normalizeUsername(username))) return setError(t("signup.invalidUsername"));
    if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) return setError(t("signup.passwordHint"));
    if (password !== confirm) return setError(t("signup.mismatch"));

    setPending(true);
    const res = await signUpAction({ username, fullName, password });
    if (!res.ok) {
      setPending(false);
      return setError(res.error === USERNAME_TAKEN ? t("signup.taken") : res.error);
    }
    // Signed in straight away; until an admin approves, the app shows the waiting page.
    const { error } = await createClient().auth.signInWithPassword({ email: loginEmail(username), password });
    if (error) {
      setPending(false);
      return setError(error.message);
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <Label htmlFor="fullName">{t("signup.fullName")}</Label>
        <Input id="fullName" required autoFocus autoComplete="name" maxLength={100} value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="username">{t("login.username")}</Label>
        <Input
          id="username"
          required
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={30}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <p className="mt-1 text-xs text-muted">{t("signup.usernameHint")}</p>
      </div>
      <div>
        <Label htmlFor="password">{t("login.password")}</Label>
        <Input
          id="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={PASSWORD_MIN}
          maxLength={PASSWORD_MAX}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="mt-1 text-xs text-muted">{t("signup.passwordHint")}</p>
      </div>
      <div>
        <Label htmlFor="confirm">{t("signup.confirm")}</Label>
        <Input id="confirm" type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? t("signup.creating") : t("signup.submit")}
      </Button>
      {error && <p className="text-sm text-err">{error}</p>}
    </form>
  );
}
