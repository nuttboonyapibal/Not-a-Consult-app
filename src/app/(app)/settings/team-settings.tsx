"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Badge, Button, Card, Input, Select } from "@/components/ui";
import { setMemberLogin } from "@/lib/actions/auth";
import { updateMember } from "@/lib/actions/settings";
import { displayName, handle, PASSWORD_MAX, PASSWORD_MIN, USERNAME_TAKEN } from "@/lib/auth/username";
import { useT } from "@/lib/i18n/client";
import type { Profile } from "@/lib/types";

export function TeamSettings({ meId, people }: { meId: string; people: Profile[] }) {
  const { t } = useT();
  const router = useRouter();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      const res = await fn();
      setMessage(res.ok ? { ok: true, text: t("common.saved") } : { ok: false, text: res.error ?? "" });
      if (res.ok) router.refresh();
    });

  return (
    <Card className="max-w-4xl overflow-hidden">
      <div className="border-b border-line px-6 py-4">
        <div className="font-semibold">{t("settings.members")}</div>
        <p className="mt-1 text-xs text-muted">{t("settings.approveHint")}</p>
        {message && <p className={`mt-2 text-xs ${message.ok ? "text-ok" : "text-err"}`}>{message.text}</p>}
      </div>
      <table className="w-full text-sm">
        <thead className="bg-paper text-left text-xs text-muted">
          <tr>
            <th className="px-6 py-2 font-medium">{t("settings.member")}</th>
            <th className="px-3 py-2 font-medium">{t("settings.role")}</th>
            <th className="px-3 py-2 font-medium">{t("settings.active")}</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {people.map((p) => (
            <MemberRow
              key={p.id}
              person={p}
              isMe={p.id === meId}
              pending={pending}
              editing={editing === p.id}
              onEdit={(on) => {
                setEditing(on ? p.id : null);
                setMessage(null);
              }}
              onUpdate={(patch) => run(() => updateMember(p.id, patch))}
              onDone={(text) => {
                setEditing(null);
                setMessage({ ok: true, text });
                router.refresh();
              }}
            />
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function MemberRow({
  person: p,
  isMe,
  pending,
  editing,
  onEdit,
  onUpdate,
  onDone,
}: {
  person: Profile;
  isMe: boolean;
  pending: boolean;
  editing: boolean;
  onEdit: (on: boolean) => void;
  onUpdate: (patch: { role?: Profile["role"]; active?: boolean }) => void;
  onDone: (message: string) => void;
}) {
  const { t } = useT();
  return (
    <>
      <tr className="border-t border-line">
        <td className="px-6 py-2.5">
          <div className="flex flex-wrap items-center gap-2 font-medium">
            {displayName(p)}
            {!p.active && <Badge tone="warn">{t("settings.pending")}</Badge>}
          </div>
          <div className="text-xs text-muted">{handle(p)}</div>
        </td>
        <td className="px-3 py-2.5">
          {isMe ? (
            <Badge tone="accent">
              {t("settings.admin")} ({t("settings.you")})
            </Badge>
          ) : (
            <Select
              value={p.role}
              disabled={pending}
              className="h-8 w-36"
              onChange={(e) => onUpdate({ role: e.target.value as Profile["role"] })}
            >
              <option value="consultant">{t("settings.consultant")}</option>
              <option value="admin">{t("settings.admin")}</option>
            </Select>
          )}
        </td>
        <td className="px-3 py-2.5">
          <input
            type="checkbox"
            checked={p.active}
            disabled={pending || isMe}
            onChange={(e) => onUpdate({ active: e.target.checked })}
            className="size-4 accent-accent"
            aria-label={t("settings.active")}
          />
        </td>
        <td className="px-3 py-2.5 text-right">
          {!isMe && (
            <button type="button" className="text-xs font-medium text-accent hover:underline" onClick={() => onEdit(!editing)}>
              {p.username ? t("settings.setPassword") : t("settings.setLogin")}
            </button>
          )}
        </td>
      </tr>
      {editing && (
        <tr className="bg-paper">
          <td colSpan={4} className="px-6 py-3">
            <SetLoginForm person={p} onCancel={() => onEdit(false)} onDone={onDone} />
          </td>
        </tr>
      )}
    </>
  );
}

/** A random temporary password the admin passes on; the member changes it under My account. */
function randomPassword() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from(crypto.getRandomValues(new Uint32Array(12)), (n) => chars[n % chars.length]).join("");
}

function SetLoginForm({ person, onCancel, onDone }: { person: Profile; onCancel: () => void; onDone: (message: string) => void }) {
  const { t } = useT();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await setMemberLogin(person.id, { username: person.username ? undefined : username, password });
      if (res.ok) onDone(t("settings.passwordSet"));
      else setError(res.error === USERNAME_TAKEN ? t("signup.taken") : res.error);
    });
  };

  return (
    <form onSubmit={save} className="flex flex-wrap items-end gap-2">
      {!person.username && (
        <label className="text-xs">
          <span className="mb-1 block text-muted">{t("login.username")}</span>
          <Input required autoCapitalize="none" spellCheck={false} maxLength={30} value={username} onChange={(e) => setUsername(e.target.value)} className="h-8 w-44" />
        </label>
      )}
      <label className="text-xs">
        <span className="mb-1 block text-muted">{t("account.new")}</span>
        <Input
          required
          minLength={PASSWORD_MIN}
          maxLength={PASSWORD_MAX}
          autoComplete="off"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-8 w-44 font-mono"
        />
      </label>
      <Button type="button" variant="ghost" size="sm" onClick={() => setPassword(randomPassword())}>
        {t("settings.randomPassword")}
      </Button>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? t("common.saving") : t("common.save")}
      </Button>
      <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={onCancel}>
        {t("common.cancel")}
      </Button>
      {error && <p className="w-full text-xs text-err">{error}</p>}
    </form>
  );
}
